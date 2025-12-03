import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { User } from '../user/entities/user.entity';
import {
  ChannelConfig,
  EnhancedNotificationData,
  Filter,
  NotificationData,
  OneSignalChannelResponse,
  ScheduledNotificationData,
  ScheduledNotificationResponse,
} from './interfaces/notification.interface';

@Injectable()
export class OneSignalService {
  private readonly logger = new Logger(OneSignalService.name);
  private readonly apiUrl = 'https://onesignal.com/api/v1/notifications';
  private readonly headers: Record<string, string>;

  constructor(private configService: ConfigService) {
    this.headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Basic ${this.configService.get('ONE_SIGNAL_API_KEY')}`,
    };
  }

  async setExternalUserId(
    playerId: string,
    externalUserId: string,
  ): Promise<boolean> {
    try {
      const response = await axios.put(
        `https://onesignal.com/api/v1/players/${playerId}`,
        {
          app_id: this.configService.get('ONE_SIGNAL_APP_ID'),
          external_user_id: `__${externalUserId}`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${this.configService.get('ONE_SIGNAL_API_KEY')}`,
          },
        },
      );
      return response.status === 200;
    } catch (error) {
      console.error('Failed to set external user ID:', {
        playerId,
        externalUserId,
        error: error.response?.data || error.message,
      });
      return false;
    }
  }

  async syncUserTagsEfficient(user: User): Promise<boolean> {
    const basicTags: Record<string, any> = {};
    return this.updateUserTags(user.id.toString(), basicTags);
  }

  async sendToLargeGroupOfMembers(
    playerIds: string[],
    notificationData: EnhancedNotificationData,
  ): Promise<boolean> {
    const batchSize = 15000;
    const batches: string[][] = [];

    for (let i = 0; i < playerIds.length; i += batchSize) {
      batches.push(playerIds.slice(i, i + batchSize));
    }

    let allSuccessful = true;
    const batchPromises = batches.map(async (batch, index) => {
      try {
        const success = await this.sendToPlayerIds(batch, notificationData);
        if (!success) {
          allSuccessful = false;
        }
        return success;
      } catch (error) {
        console.error(`Error in batch ${index + 1}:`, error);
        allSuccessful = false;
        return false;
      }
    });

    await Promise.all(batchPromises);

    return allSuccessful;
  }

  async sendToAll(notificationData: NotificationData): Promise<boolean> {
    const { title, message, lang = 'en', ...options } = notificationData;
    const data = {
      app_id: this.configService.get('ONE_SIGNAL_APP_ID'),
      headings: { [lang]: title },
      contents: { [lang]: message },
      included_segments: ['All'],
      // small_icon: this.configService.get('LOGO_URL'),
      ...options,
    };
    return this.sendNotification(data);
  }

  async sendToPlayerIds(
    playerIds: string[],
    notificationData: EnhancedNotificationData,
  ): Promise<boolean> {
    const isValidUUID = (id) =>
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        id,
      );
    const excludedPlayerIds = playerIds.filter((playerId) =>
      isValidUUID(playerId),
    );

    const data = this.buildNotificationData(notificationData, {
      include_player_ids: excludedPlayerIds || [],
    });
    return this.sendNotification(data);
  }

  async sendToTaggedUsers(
    filters: Filter[],
    notificationData: EnhancedNotificationData,
  ): Promise<boolean> {
    const data = this.buildNotificationData(notificationData, { filters });
    return this.sendNotification(data);
  }

  async scheduleNotificationForAll(
    notificationData: ScheduledNotificationData,
    scheduledDateTime: Date,
  ): Promise<ScheduledNotificationResponse> {
    const { title, message, lang = 'en', ...options } = notificationData;

    const data = {
      app_id: this.configService.get('ONE_SIGNAL_APP_ID'),
      headings: { [lang]: title },
      contents: { [lang]: message },
      included_segments: ['All'],
      send_after: scheduledDateTime.toISOString(),
      // small_icon: this.configService.get('LOGO_URL'),
      ...options,
    };

    return this.scheduleNotification(data);
  }

  async scheduleNotificationForPlayerIds(
    playerIds: string[],
    notificationData: ScheduledNotificationData,
    scheduledDateTime: Date,
  ): Promise<ScheduledNotificationResponse> {
    const isValidUUID = (id) =>
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        id,
      );
    const excludedPlayerIds = playerIds.filter((playerId) =>
      isValidUUID(playerId),
    );

    const data = this.buildScheduledNotificationData(notificationData, {
      include_player_ids: excludedPlayerIds,
      send_after: scheduledDateTime.toISOString(),
    });

    return this.scheduleNotification(data);
  }

  async scheduleNotificationForTaggedUsers(
    filters: Filter[],
    notificationData: ScheduledNotificationData,
    scheduledDateTime: Date,
  ): Promise<ScheduledNotificationResponse> {
    const data = this.buildScheduledNotificationData(notificationData, {
      filters,
      send_after: scheduledDateTime.toISOString(),
    });

    return this.scheduleNotification(data);
  }

  async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/${notificationId}?app_id=${this.configService.get('ONE_SIGNAL_APP_ID')}`,
        { headers: this.headers },
      );

      if (response.status === 200) {
        this.logger.log(
          `Successfully cancelled scheduled notification: ${notificationId}`,
        );
        return true;
      } else {
        this.logger.error(
          `Failed to cancel notification ${notificationId}:`,
          response.data,
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Error cancelling notification ${notificationId}:`,
        error.response?.data || error.message,
      );
      return false;
    }
  }

  async getScheduledNotification(notificationId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/${notificationId}?app_id=${this.configService.get('ONE_SIGNAL_APP_ID')}`,
        { headers: this.headers },
      );

      if (response.status === 200) {
        this.logger.log(`Retrieved notification details: ${notificationId}`);
        return response.data;
      } else {
        this.logger.error(
          `Failed to get notification ${notificationId}:`,
          response.data,
        );
        return null;
      }
    } catch (error) {
      this.logger.error(
        `Error getting notification ${notificationId}:`,
        error.response?.data || error.message,
      );
      return null;
    }
  }

  async getScheduledNotifications(
    limit: number = 50,
    offset: number = 0,
  ): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}?app_id=${this.configService.get('ONE_SIGNAL_APP_ID')}&limit=${limit}&offset=${offset}`,
        { headers: this.headers },
      );

      if (response.status === 200) {
        this.logger.log(
          `Retrieved ${response.data.notifications?.length || 0} notifications`,
        );
        return response.data;
      } else {
        this.logger.error('Failed to get notifications:', response.data);
        return null;
      }
    } catch (error) {
      this.logger.error(
        'Error getting notifications:',
        error.response?.data || error.message,
      );
      return null;
    }
  }

  async updateScheduledNotification(
    notificationId: string,
    updateData: Partial<ScheduledNotificationData>,
  ): Promise<boolean> {
    try {
      const data = {
        app_id: this.configService.get('ONE_SIGNAL_APP_ID'),
        ...updateData,
      };

      const response = await axios.put(
        `${this.apiUrl}/${notificationId}`,
        data,
        { headers: this.headers },
      );

      if (response.status === 200) {
        this.logger.log(
          `Successfully updated scheduled notification: ${notificationId}`,
        );
        return true;
      } else {
        this.logger.error(
          `Failed to update notification ${notificationId}:`,
          response.data,
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Error updating notification ${notificationId}:`,
        error.response?.data || error.message,
      );
      return false;
    }
  }

  async updateUserTags(
    externalUserId: string,
    tags: Record<string, any>,
  ): Promise<boolean> {
    try {
      const response = await axios.put(
        `https://onesignal.com/api/v1/apps/${this.configService.get('ONE_SIGNAL_APP_ID')}/users/__${externalUserId}`,
        { tags },
        { headers: this.headers },
      );
      this.logger.log(`Successfully updated tags for user ${externalUserId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error updating tags for user ${externalUserId}:`,
        error.response?.data || error.message,
      );
      return false;
    }
  }

  private async sendNotification(data: any): Promise<boolean> {
    try {
      const response: AxiosResponse = await axios.post(this.apiUrl, data, {
        headers: this.headers,
      });
      if (response.data.id) {
        this.logger.log(
          `Notification sent successfully. ID: ${response.data.id}`,
        );
        return true;
      } else {
        this.logger.error('Failed to send notification:', response.data);
        return false;
      }
    } catch (error) {
      this.logger.error(
        'Error sending notification:',
        error.response?.data || error.message,
      );
      return false;
    }
  }

  private async scheduleNotification(
    data: any,
  ): Promise<ScheduledNotificationResponse> {
    try {
      const response: AxiosResponse = await axios.post(this.apiUrl, data, {
        headers: this.headers,
      });

      if (response.data.id) {
        this.logger.log(
          `Notification scheduled successfully. ID: ${response.data.id}`,
        );
        return {
          success: true,
          notificationId: response.data.id,
          scheduledTime: data.send_after,
          message: 'Notification scheduled successfully',
        };
      } else {
        this.logger.error('Failed to schedule notification:', response.data);
        return {
          success: false,
          error: response.data.errors || 'Unknown error occurred',
          message: 'Failed to schedule notification',
        };
      }
    } catch (error) {
      this.logger.error(
        'Error scheduling notification:',
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.response?.data || error.message,
        message: 'Error scheduling notification',
      };
    }
  }

  private buildNotificationData(
    notificationData: EnhancedNotificationData,
    targeting: Record<string, any>,
  ): any {
    const {
      title,
      message,
      lang = 'en',
      navigationData,
      actions,
      customData,
      groupKey,
      groupMessage,
      collapseKey,
      ...options
    } = notificationData;

    const data: any = {
      app_id: this.configService.get('ONE_SIGNAL_APP_ID'),
      headings: { [lang]: title },
      contents: { [lang]: message },
      ...targeting,
      small_icon: this.configService.get('LOGO_URL'),
      chrome_icon: this.configService.get('LOGO_URL'),
      chrome_web_icon: this.configService.get('LOGO_URL'),
      firefox_icon: this.configService.get('LOGO_URL'),
      big_picture: notificationData?.imageUrl,
      large_icon: notificationData?.imageUrl,
      ttl: 86400,
      ios_interruption_level: 'critical',
      ios_sound: 'notification.wav',
      ios_attachments: {
        image: notificationData.imageUrl,
      },
      mutable_content: true,
      priority: 100,
      // android_channel_id:'high_importance',
      ...options,
    };

    if (groupKey) {
      data.android_group = groupKey;
      data.thread_id = groupKey; // iOS grouping
      data.ios_relevance_score = 0.8; // Prioritize grouped notifications
      data.collapse_id = collapseKey || groupKey; // Ensure collapse behavior
      data.android_group_message = groupMessage || {
        [lang]: `$[notif_count] new messages from ${title}`,
      };
    }

    // Add navigation data
    if (navigationData || customData) {
      data.data = {
        ...navigationData,
        ...customData,
      };
    }

    // Add action buttons
    if (actions?.length) {
      data.buttons = actions.map((action) => ({
        id: action.id,
        text: action.text,
        ...(action.icon && { icon: action.icon }),
        ...(action.url && { url: action.url }),
      }));
    }
    return data;
  }

  private buildScheduledNotificationData(
    notificationData: ScheduledNotificationData,
    targeting: Record<string, any>,
  ): any {
    const {
      title,
      message,
      lang = 'en',
      navigationData,
      actions,
      customData,
      ...options
    } = notificationData;

    const data = {
      app_id: this.configService.get('ONE_SIGNAL_APP_ID'),
      headings: { [lang]: title },
      contents: { [lang]: message },
      ...targeting,
      small_icon: this.configService.get('LOGO_URL'),
      chrome_icon: this.configService.get('LOGO_URL'),
      chrome_web_icon: this.configService.get('LOGO_URL'),
      firefox_icon: this.configService.get('LOGO_URL'),
      big_picture: notificationData?.imageUrl,
      large_icon: notificationData?.imageUrl,
      ios_attachments: {
        image: notificationData.imageUrl,
      },
      mutable_content: true,
      ...options,
    };

    // Add navigation data
    if (navigationData || customData) {
      data.data = {
        ...navigationData,
        ...customData,
      };
    }

    // Add action buttons
    if (actions?.length) {
      data.buttons = actions.map((action) => ({
        id: action.id,
        text: action.text,
        ...(action.icon && { icon: action.icon }),
        ...(action.url && { url: action.url }),
      }));
    }

    return data;
  }

  async createChannel(
    channelConfig: ChannelConfig,
  ): Promise<OneSignalChannelResponse> {
    try {
      const payload = {
        name: channelConfig.channelName || 'Default Channel',
        description: channelConfig.channelDescription || '',
        importance: channelConfig.importance || 3,
        sound: channelConfig.sound || 'default',
        vibrate: channelConfig.vibrate !== false || true,
        show_lights: channelConfig.showLights !== false || true,
        light_color: channelConfig.lightColor || '#FF0000',
        lock_screen_visibility: channelConfig.lockScreenVisibility || 'public',
      };

      const response: AxiosResponse<OneSignalChannelResponse> =
        await axios.post(
          `${this.apiUrl}/apps/${this.configService.get('ONE_SIGNAL_API_KEY')}/notification_channels/${channelConfig.channelId}`,
          payload,
          {
            headers: this.headers,
          },
        );

      return response.data;
    } catch (error) {
      console.error(
        'Error creating OneSignal channel:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        `Failed to create notification channel: ${error.response?.data?.errors || error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
