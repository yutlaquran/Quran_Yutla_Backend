import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecitationsService } from '../recitations/recitations.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly recitationsService: RecitationsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

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

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleExpireSubscriptions() {
    this.logger.log('Starting daily task: Checking for expired subscriptions');

    try {
      await this.subscriptionsService.checkAndExpireSubscriptions();
      
      this.logger.log('Expired subscriptions check completed');
    } catch (error) {
      this.logger.error('Failed to check expired subscriptions:', error.message);
    }
  }
}
