import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { RecitationsModule } from '../recitations/recitations.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { EmailVerificationModule } from '../email-verification/email-verification.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    RecitationsModule,
    SubscriptionsModule,
    EmailVerificationModule,
  ],
  providers: [TasksService],
})
export class TasksModule {}
