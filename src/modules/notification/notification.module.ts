import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { AccessControlModule } from '../../common/helpers/access control/access-control.module';
import { User } from '../user/entities/user.entity';
import { NotificationRecipient } from './entities/notification-recipient.entity';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notification.controller';
import { NotificationService } from './notification.service';
import { OneSignalService } from './one-signal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationRecipient, User]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationService, OneSignalService],
  exports: [NotificationService, OneSignalService],
})
export class NotificationModule {}
