import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/guards/user.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { SuccessResponse } from '../../common/interceptors/success-response.interceptor';
import { PaginatedUserResponseDto } from '../user/dto/responses/paginated-users.response.dto';
import { User } from '../user/entities/user.entity';
import { NotificationDataDto } from './dto/create-notification.dto';
import { NotificationFindAllQueryDto } from './dto/notification-find-all-query.dto';
import { NotificationQueryDto } from './dto/send-notification-query.dto';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationService: NotificationService) {}

  /**
   * Create a notification based on query criteria
   */
  @Post()
  @SuccessResponse('notification.NOTIFICATION_SENT_SUCCESSFULLY', 201)
  async createNotificationByQuery(
    @Query() query: NotificationQueryDto,
    @Body() notificationData: NotificationDataDto,
    @CurrentUser() user: User,
  ) {
    return this.notificationService.create(query, notificationData, user.id);
  }

  @Get()
  @SuccessResponse('Notification list retrieved successfully', 200)
  @Serialize(PaginatedUserResponseDto)
  findAll(
    @Query() query: NotificationFindAllQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.notificationService.findAll(query, user);
  }

  /**
   * Mark a notification as read for the current user
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) notificationId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.notificationService.markAsRead(notificationId, user.id);
  }

  @Patch('mark-all-read')
  @SuccessResponse('All notifications marked as read successfully', 200)
  async markAllAsRead(
    @CurrentUser() user: User,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<void> {
    return this.notificationService.markAllAsRead(user.id, limit);
  }

  /**
   * Get notifications for the current user
   */
  @Get('me')
  @SuccessResponse('Notifications retrieved successfully', 200)
  async getMyNotifications(
    @CurrentUser() user: User,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
  ) {
    return this.notificationService.getUserNotifications(user.id, {
      limit,
      page,
    });
  }

  /**
   * Get details of a specific notification
   */
  @Get(':id')
  async getNotification(@Param('id', ParseIntPipe) notificationId: number) {
    return this.notificationService.getNotification(notificationId);
  }
}
