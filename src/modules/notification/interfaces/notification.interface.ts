export interface NotificationData {
  title: string;
  message: string;
  lang?: string;
  data?: Record<string, any>;
  url?: string;
  buttons?: Array<{
    id: string;
    text: string;
    url?: string;
  }>;
}

export interface LogicalOperator {
  operator: 'AND' | 'OR';
}

export interface TagFilter {
  field: 'tag' | 'location' | 'email' | 'country';
  key?: string;
  relation: '=' | '!=' | '>' | '<' | 'exists' | 'not_exists' | 'CONTAINS' | '~';
  value?: string | number;
  operator?: never;
}

export type Filter = TagFilter | LogicalOperator;

export interface NotificationQuery {
  governorates?: string[];
  branchIds?: string[];
  operator?: 'AND' | 'OR';
}

export interface NavigationData {
  screen: string;
  params?: Record<string, any>;
  [key: string]: any;
}

export interface NotificationAction {
  id: string;
  text: string;
  icon?: string;
  url?: string;
}

export interface EnhancedNotificationData extends NotificationData {
  navigationData?: NavigationData;
  actions?: NotificationAction[];
  badge?: number;
  sound?: string;
  priority?: number;
  imageUrl?: string;
  bigPictureUrl?: string;
  sendAfter?: Date;
  silent?: boolean;
  customData?: Record<string, any>;
  groupKey?: string;
  groupMessage?: string;
  collapseKey?: string;
}

export interface ScheduledNotificationData extends EnhancedNotificationData {
  // Optional scheduling-specific properties
  timezone?: string;
  throttle_rate_per_minute?: number;
  delayed_option?: 'timezone' | 'last-active';
}

export interface NotificationScheduleOptions {
  // Schedule for specific date/time
  scheduledDateTime?: Date;

  // Schedule with delay in seconds
  delayInSeconds?: number;

  // Timezone for scheduling (optional)
  timezone?: string;

  // Throttle rate (notifications per minute)
  throttleRate?: number;

  // Delivery optimization
  delayedOption?: 'timezone' | 'last-active';
}

export interface ScheduledNotificationResponse {
  success: boolean;
  notificationId?: string;
  scheduledTime?: string;
  message: string;
  error?: any;
}

export interface ChannelConfig {
  channelId: string;
  channelName: string;
  channelDescription?: string;
  importance?: 1 | 2 | 3 | 4 | 5; // 1=Min, 2=Low, 3=Default, 4=High, 5=Max
  sound?: string;
  vibrate?: boolean;
  showLights?: boolean;
  lightColor?: string;
  lockScreenVisibility?: 'public' | 'private' | 'secret';
}

export interface OneSignalChannelResponse {
  id: string;
  name: string;
  description: string;
  importance: number;
  sound: string;
  vibrate: boolean;
  show_lights: boolean;
  light_color: string;
  lock_screen_visibility: string;
}
