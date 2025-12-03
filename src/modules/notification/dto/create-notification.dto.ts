import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

export class NavigationDataDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, {
    message: 'Screen name cannot be longer than 100 characters.',
  })
  screen: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
  // Allow additional properties
  [key: string]: any;
}

export class NotificationActionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: 'validation.MAX_LENGTH', context: { max: 50 } })
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000, {
    message: 'Action text cannot be longer than 100 characters.',
  })
  text: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'Icon name cannot be longer than 100 characters.',
  })
  icon?: string;

  @IsOptional()
  @IsUrl({}, { message: 'validation.IS_URL' })
  @MaxLength(500, { message: 'validation.MAX_LENGTH', context: { max: 500 } })
  url?: string;
}

export class NotificationDataDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'validation.MAX_LENGTH', context: { max: 100 } })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000, { message: 'validation.MAX_LENGTH', context: { max: 500 } })
  message: string;

  @IsOptional()
  @IsUrl({}, { message: 'validation.IS_URL' })
  @MaxLength(500, { message: 'validation.MAX_LENGTH', context: { max: 500 } })
  url?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NavigationDataDto)
  navigationData?: NavigationDataDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, {
    message: 'Cannot have more than 10 notification actions.',
  })
  @ValidateNested({ each: true })
  @Type(() => NotificationActionDto)
  actions?: NotificationActionDto[];

  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'Sound name cannot be longer than 100 characters.',
  })
  sound?: string;

  @IsOptional()
  @IsUrl({}, { message: 'validation.IS_URL' })
  @MaxLength(500, {
    message: 'Image URL cannot be longer than 500 characters.',
  })
  imageUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'validation.IS_URL' })
  @MaxLength(500, {
    message: 'Big picture URL cannot be longer than 500 characters.',
  })
  bigPictureUrl?: string;
}

export class UnifiedTargetDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10000, {
    message: 'validation.ARRAY_MAX_SIZE',
    context: { max: 10000 },
  })
  @IsNumber({}, { each: true })
  @Min(1, { each: true, message: 'User ID must be at least 1.' })
  userIds?: number[];

  @IsOptional()
  @IsBoolean()
  admins?: boolean;
}

export class CreateNotificationDto {
  @ValidateNested()
  @Type(() => NotificationDataDto)
  notificationData: NotificationDataDto;

  @ValidateNested()
  @Type(() => UnifiedTargetDto)
  target: UnifiedTargetDto;

  @IsEnum(NotificationTypeEnum)
  type?: NotificationTypeEnum;

  @IsOptional()
  @IsDateString()
  scheduledDateTime?: Date;
}
