import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';

/**
 * Guard to check if user has an active subscription
 * Use this guard on endpoints that require active subscription
 */
@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(ActiveSubscriptionGuard.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user can record recitation (has active subscription with remaining sessions)
    const canRecord = await this.subscriptionsService.canRecordRecitation(user.id);

    if (!canRecord.allowed) {
      this.logger.log(
        `User ${user.id} denied access: ${canRecord.reason}`,
      );
      throw new ForbiddenException(canRecord.reason);
    }

    // Add subscription info to request for later use
    request.subscriptionInfo = {
      remainingSessions: canRecord.remainingSessions,
    };

    return true;
  }
}
