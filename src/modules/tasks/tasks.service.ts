import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecitationsService } from '../recitations/recitations.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly recitationsService: RecitationsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDeleteOldRecitations() {
    this.logger.log('Starting daily cleanup: Deleting recitations older than 30 days');

    try {
      const deletedCount = await this.recitationsService.deleteOldRecitations();
      
      this.logger.log(`Cleanup completed: ${deletedCount} recitations deleted`);
    } catch (error) {
      this.logger.error('Failed to delete old recitations:', error.message);
    }
  }
}
