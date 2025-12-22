import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { RecitationsModule } from '../recitations/recitations.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [ScheduleModule.forRoot(), RecitationsModule, SubscriptionsModule],
  providers: [TasksService],
})
export class TasksModule {}
