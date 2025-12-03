import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { RecitationsModule } from '../recitations/recitations.module';

@Module({
  imports: [ScheduleModule.forRoot(), RecitationsModule],
  providers: [TasksService],
})
export class TasksModule {}
