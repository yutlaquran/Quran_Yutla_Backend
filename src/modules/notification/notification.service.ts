import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomI18nService } from 'src/common/services/custom-i18n.service';
import { ArrayContains, Repository } from 'typeorm';
import { DeepPartial } from 'typeorm/browser';
import { RolesEnum } from '../../common/enums/roles.enum';
import { PaginationService } from '../../common/utils/pagination.utils';
import { User } from '../user/entities/user.entity';
import {
  CreateNotificationDto,
  NotificationDataDto,
} from './dto/create-notification.dto';
import { NotificationFindAllQueryDto } from './dto/notification-find-all-query.dto';
import { NotificationQueryDto } from './dto/send-notification-query.dto';
import { NotificationRecipient } from './entities/notification-recipient.entity';
import { Notification } from './entities/notification.entity';
import { NotificationTypeEnum } from './enums/notification-type.enum';
import { ScheduledNotificationResponse } from './interfaces/notification.interface';
import { OneSignalService } from './one-signal.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationRecipient)
    private notificationRecipientRepository: Repository<NotificationRecipient>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private oneSignalService: OneSignalService,
    private readonly i18n: CustomI18nService,
  ) {}

  async findAll(query: NotificationFindAllQueryDto, user: User) {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.forAdmin = true')
      .select();

    return PaginationService.paginateQueryBuilder<Notification>(queryBuilder, {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      basePath: 'notification',
      defaultSortColumn: 'createdAt',
    });
  }

  /**
   * Create and send a notification based on query criteria
   */
  async create(
    query: NotificationQueryDto,
    notificationData: NotificationDataDto,
    createdById: number,
  ): Promise<Notification> {
    if (typeof notificationData.title !== 'string') {
      throw new BadRequestException(
        this.i18n.t('notification.TITLE_MUST_BE_STRING'),
      );
    }

    // Build query to find users based on governorates and roles
    const userQueryBuilder = this.userRepository.createQueryBuilder('user');

    // Execute query to get target users
    const targetUsers = await userQueryBuilder.getMany();

    // Throw error if no target users are found
    if (targetUsers.length === 0) {
      throw new BadRequestException(this.i18n.t('notification.NO_USERS_FOUND'));
    }

    // Explicitly type the notification object as DeepPartial<Notification>
    const notificationDataForCreate: DeepPartial<Notification> = {
      title: notificationData.title || 'Notification',
      message: notificationData.message,
      navigationData: notificationData.navigationData,
      createdById,
      type: NotificationTypeEnum.CustomNotification,
    };

    // Create notification entity
    const notification = this.notificationRepository.create(
      notificationDataForCreate,
    );

    // Extract playerIDs for OneSignal
    let playerIds: string[] = targetUsers
      .filter((user) => user.playerIds && Array.isArray(user.playerIds))
      .flatMap((user) => user.playerIds)
      .filter((id): id is string => id !== undefined);

    if (playerIds.length === 0) {
      // No player IDs found for the target users
      this.logger.warn('No player IDs found for target users');
    }

    // Send notification using OneSignal
    const success = await this.oneSignalService.sendToLargeGroupOfMembers(
      playerIds,
      notificationData,
    );

    if (!success) {
      throw new BadRequestException(this.i18n.t('notification.SEND_FAILED'));
    }
    // Save notification to database
    const savedNotification =
      await this.notificationRepository.save(notification);

    // Create and save recipient entries for all target users
    const recipientPromises = targetUsers.map((user) =>
      this.notificationRecipientRepository.save(
        this.notificationRecipientRepository.create({
          notification: savedNotification,
          user,
        }),
      ),
    );

    // Wait for all recipient entries to be saved
    await Promise.all(recipientPromises);

    // Update notification with delivery status
    await this.notificationRepository.save(savedNotification);

    return savedNotification;
  }

  /**
   * Mark notification as read for a user
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const recipient = await this.notificationRecipientRepository.findOne({
      where: { notification: { id: notificationId }, user: { id: userId } },
    });

    if (!recipient) {
      throw new BadRequestException(
        this.i18n.t('notification.RECIPIENT_NOT_FOUND'),
      );
    }

    recipient.isRead = true;
    recipient.readAt = new Date();
    await this.notificationRecipientRepository.save(recipient);
  }

  async markAllAsRead(userId: number, limit?: number): Promise<void> {
    // First, get the IDs of records to update (with limit)
    const recipientsToUpdate = await this.notificationRecipientRepository
      .createQueryBuilder('recipient')
      .innerJoin('recipient.notification', 'notification')
      .select('recipient.id')
      .where('recipient.userId = :userId', { userId })
      .andWhere('recipient.isRead = :isRead', { isRead: false })
      .andWhere('notification.scheduledAt <= :currentDate', {
        currentDate: new Date(),
      })
      .orderBy('recipient.id', 'DESC')
      .limit(limit || 100)
      .getMany();

    if (recipientsToUpdate.length > 0) {
      const ids = recipientsToUpdate.map((r) => r.id);

      await this.notificationRecipientRepository
        .createQueryBuilder()
        .update()
        .set({
          isRead: true,
          readAt: () => 'CURRENT_TIMESTAMP',
        })
        .whereInIds(ids)
        .execute();
    }
  }
  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: number,
    options: { limit?: number; page?: number } = {},
  ) {
    const { limit = 20, page = 1 } = options;

    // Count unread notifications for the user, considering only notifications that are already scheduled
    const unreadNotificationsQuery = await this.notificationRecipientRepository
      .createQueryBuilder('recipient')
      .innerJoin('recipient.notification', 'notification')
      .where('recipient.userId = :userId', { userId })
      .andWhere('recipient.isRead = :isRead', { isRead: false })
      .getCount();

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .innerJoinAndSelect(
        'notification.recipients',
        'recipient',
        'recipient.userId = :userId',
        { userId },
      )
      .leftJoinAndSelect('recipient.user', 'user')
      .orderBy('notification.scheduledAt', 'DESC')
      .select([
        'notification.id',
        'notification.title',
        'notification.message',
        'notification.navigationData',
        'notification.createdAt',
        'notification.type',
        'notification.scheduledAt',
        'recipient.isRead',
        'recipient.readAt',
        'user.id',
      ]);

    const result = await PaginationService.paginateQueryBuilder<Notification>(
      queryBuilder,
      {
        page,
        limit,
        sortBy: 'scheduledAt',
        sortOrder: 'DESC',
        basePath: 'notification',
      },
    );

    return {
      ...result,
      unreadCount: unreadNotificationsQuery,
    };
  }

  /**
   * Get notification details
   */
  async getNotification(notificationId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
      relations: ['recipients'],
    });

    if (!notification) {
      throw new BadRequestException(this.i18n.t('notification.NOT_FOUND'));
    }

    return notification;
  }

  async setupNotificationSetting(user: User, playerId?: string) {
    if (!playerId) {
      return;
    }
    await this.oneSignalService.setExternalUserId(playerId, user.id.toString());
  }

  async setUserExternalId(userId: number, externalId?: string): Promise<void> {
    if (!externalId) {
      return;
    }
    const success = await this.oneSignalService.setExternalUserId(
      externalId,
      userId.toString(),
    );
    if (!success) {
      throw new BadRequestException(
        this.i18n.t('notification.SET_EXTERNAL_ID_FAILED'),
      );
    }
  }

  async syncUserTagsEfficient(user: User): Promise<void> {
    const success = await this.oneSignalService.syncUserTagsEfficient(user);
    if (!success) {
      throw new BadRequestException(
        this.i18n.t('notification.SYNC_TAGS_FAILED'),
      );
    }
  }

  async sendNotification(
    createNotificationDto: CreateNotificationDto,
    userId?: number,
  ) {
    // Validate title to ensure it's a string
    if (typeof createNotificationDto.notificationData.title !== 'string') {
      throw new BadRequestException(
        this.i18n.t('notification.TITLE_MUST_BE_STRING'),
      );
    }

    const isScheduled = !!createNotificationDto.scheduledDateTime;
    const scheduledDateTime = createNotificationDto.scheduledDateTime;

    // Prepare notification data
    const notificationDataForCreate: DeepPartial<Notification> = {
      title: createNotificationDto.notificationData.title || 'Notification',
      message: createNotificationDto.notificationData.message,
      navigationData: createNotificationDto.notificationData.navigationData,
      forAdmin: createNotificationDto.target.admins || false,
      type:
        createNotificationDto?.type || NotificationTypeEnum.CustomNotification,
      scheduledAt: isScheduled ? scheduledDateTime : new Date(),
    };
    await this.notificationRepository.save(notificationDataForCreate);
    if (userId) {
      notificationDataForCreate.createdById = userId;
    }

    let notification: Notification | null = null;

    // Build user query
    const userQueryBuilder = this.userRepository.createQueryBuilder('user');

    if (
      createNotificationDto.target.userIds?.length === 0 &&
      !createNotificationDto.target.userIds &&
      !createNotificationDto.target.admins
    ) {
      return notification;
    }

    if (createNotificationDto.target.userIds?.length) {
      userQueryBuilder.andWhere('user.id IN (:...userIds)', {
        userIds: createNotificationDto.target.userIds,
      });
    }
    if (createNotificationDto.target.admins) {
      userQueryBuilder.andWhere(':role = ANY(user.roles)', {
        role: RolesEnum.ADMIN,
      });
    }

    const targetUsers = await userQueryBuilder.getMany();

    if (targetUsers.length === 0) {
      return notification;
    }

    // Extract playerIDs for OneSignal
    let playerIds: string[] = targetUsers
      .filter((user) => user.playerIds && Array.isArray(user.playerIds))
      .flatMap((user) => user.playerIds)
      .filter((id): id is string => id !== undefined);
    // Prepare notification data for OneSignal
    const oneSignalNotificationData = {
      title: createNotificationDto.notificationData.title,
      message: createNotificationDto.notificationData.message,
      actions: createNotificationDto.notificationData.actions,
      url: createNotificationDto.notificationData.url,
      navigationData: createNotificationDto.notificationData.navigationData,
      imageUrl: createNotificationDto.notificationData.imageUrl,
      customData: {
        // notificationId: notification?.id, // Include notification ID for reference
      },
    };

    let notificationResult: boolean | ScheduledNotificationResponse;

    // if (isScheduled && scheduledDateTime) {
    //   // Handle scheduled notification
    //   notificationResult =
    //     await this.oneSignalService.scheduleNotificationForPlayerIds(
    //       playerIds,
    //       oneSignalNotificationData,
    //       scheduledDateTime,
    //     );

    //   // if (notification && notificationResult.success) {
    //   //   await this.notificationRepository.update(notification.id, {
    //   //     oneSignalId: notificationResult.notificationId,
    //   //     type: NotificationTypeEnum.Scheduled,
    //   //   });
    //   // }
    // } else {
    // Handle immediate notification
    notificationResult = await this.oneSignalService.sendToLargeGroupOfMembers(
      playerIds,
      oneSignalNotificationData,
    );
    // }

    // Create and save recipient entries for all target users (only if notification was saved to DB)
    if (createNotificationDto.target.userIds?.length !== 0) {
      const recipients = targetUsers.map((user) => ({
        notification: notificationDataForCreate,
        user,
      }));

      await this.notificationRecipientRepository.insert(recipients);
    } else if (createNotificationDto.target.admins) {
      const adminUsers = await this.userRepository.find({
        where: { roles: ArrayContains([RolesEnum.ADMIN]) },
      });
      const recipients = adminUsers.map((user) => ({
        notification: notificationDataForCreate,
        user,
      }));
      await this.notificationRecipientRepository.insert(recipients);
    }

    return {
      notification,
      // oneSignalResult: notificationResult,
    };
  }

  async cancelScheduledNotification(
    OneSignalNotificationId: string,
  ): Promise<void> {
    await this.oneSignalService.cancelScheduledNotification(
      OneSignalNotificationId,
    );

    const notification = await this.notificationRepository.findOne({
      where: { oneSignalId: OneSignalNotificationId },
    });

    if (!notification) {
      throw new BadRequestException(this.i18n.t('notification.NOT_FOUND'));
    }

    // Delete associated recipients
    await this.notificationRecipientRepository.delete({
      notification: {
        id: notification.id,
      },
    });

    // Delete the notification itself
    await this.notificationRepository.delete({
      oneSignalId: OneSignalNotificationId,
    });
  }

  async getNotificationRecipients(
    notificationId: number,
  ): Promise<NotificationRecipient[]> {
    const recipients = await this.notificationRecipientRepository.find({
      where: { notification: { id: notificationId } },
      relations: ['user'],
    });

    if (!recipients || recipients.length === 0) {
      throw new BadRequestException(
        this.i18n.t('notification.NO_RECIPIENTS_FOUND'),
      );
    }

    return recipients;
  }

  async deleteNotification(notificationId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new BadRequestException(this.i18n.t('notification.NOT_FOUND'));
    }

    // Delete associated recipients
    await this.notificationRecipientRepository.delete({
      notification: { id: notificationId },
    });

    // Delete the notification itself
    await this.notificationRepository.delete(notificationId);
  }

  async getScheduledMeetingNotification(meetingId: string) {
    const notification = await this.notificationRepository.find({
      where: {
        type: NotificationTypeEnum.Scheduled,
      },
      relations: ['recipients', 'recipients.user', 'recipients.user.profile'],
      select: {
        id: true,
        title: true,
        message: true,
        navigationData: true,
        scheduledAt: true,
        oneSignalId: true,
        recipients: {
          id: true,
          user: {
            id: true,
            fullName: true,
            // studentProfile: {
            //   profileImage: true,
            // },
          },
        },
      },
    });

    // Find the notification that matches the meeting ID in its navigationData
    const scheduledMeetingNotification = notification.find(
      (notif) => notif.navigationData?.params?.id === meetingId,
    );

    if (!notification) {
      throw new BadRequestException(
        this.i18n.t('notification.NO_SCHEDULED_MEETING_FOUND'),
      );
    }

    return scheduledMeetingNotification;
  }
}
