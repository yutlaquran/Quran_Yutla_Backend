import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { CustomI18nService } from '../../common/services/custom-i18n.service';
import { PlansService } from '../plans/plans.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly plansService: PlansService,
    private readonly i18n: CustomI18nService,
  ) {}

  async create(
    userId: number,
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    // Check if user already has an active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubscription) {
      throw new ConflictException(
        this.i18n.t('subscriptions.ACTIVE_SUBSCRIPTION_EXISTS'),
      );
    }

    // Get plan details
    const plan = await this.plansService.findOne(createSubscriptionDto.planId);

    if (!plan.isActive) {
      throw new BadRequestException(
        this.i18n.t('subscriptions.PLAN_NOT_AVAILABLE'),
      );
    }

    // Create subscription (pending payment)
    const subscription = this.subscriptionRepository.create({
      userId,
      planId: createSubscriptionDto.planId,
      totalSessions: plan.sessionCount,
      remainingSessions: plan.sessionCount,
      sessionDuration: plan.sessionDuration,
      autoRenew: createSubscriptionDto.autoRenew ?? true,
      paymentMethod: createSubscriptionDto.paymentMethod,
      status: SubscriptionStatus.PENDING_PAYMENT,
    });

    return await this.subscriptionRepository.save(subscription);
  }

  async activateSubscription(subscriptionId: number): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException(
        this.i18n.t('subscriptions.SUBSCRIPTION_NOT_FOUND'),
      );
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.startDate = now;
    subscription.endDate = endDate;
    subscription.lastPaymentDate = now;
    subscription.nextBillingDate = endDate;
    subscription.remainingSessions = subscription.totalSessions;

    return await this.subscriptionRepository.save(subscription);
  }

  async findUserSubscription(userId: number): Promise<Subscription | null> {
    return await this.subscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
    });
  }

  async findOne(id: number): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['plan', 'user'],
    });

    if (!subscription) {
      throw new NotFoundException(
        this.i18n.t('subscriptions.SUBSCRIPTION_NOT_FOUND'),
      );
    }

    return subscription;
  }

  async findAllByUser(userId: number): Promise<Subscription[]> {
    return await this.subscriptionRepository.find({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async decrementSession(userId: number): Promise<void> {
    const subscription = await this.findUserSubscription(userId);

    if (!subscription) {
      throw new NotFoundException(
        this.i18n.t('subscriptions.NO_ACTIVE_SUBSCRIPTION'),
      );
    }

    if (subscription.remainingSessions <= 0) {
      throw new BadRequestException(
        this.i18n.t('subscriptions.NO_SESSIONS_REMAINING'),
      );
    }

    subscription.remainingSessions -= 1;
    await this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(
    userId: number,
    cancelDto: CancelSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.findUserSubscription(userId);

    if (!subscription) {
      throw new NotFoundException(
        this.i18n.t('subscriptions.NO_ACTIVE_SUBSCRIPTION'),
      );
    }

    if (cancelDto.immediate) {
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.endDate = new Date();
    } else {
      subscription.autoRenew = false;
    }

    subscription.cancelledAt = new Date();
    if (cancelDto.reason) {
      subscription.cancellationReason = cancelDto.reason;
    }

    return await this.subscriptionRepository.save(subscription);
  }

  async renewSubscription(subscriptionId: number): Promise<Subscription> {
    const subscription = await this.findOne(subscriptionId);

    if (!subscription.autoRenew) {
      subscription.status = SubscriptionStatus.EXPIRED;
      return await this.subscriptionRepository.save(subscription);
    }

    // Reset for new month
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    subscription.startDate = now;
    subscription.endDate = endDate;
    subscription.remainingSessions = subscription.totalSessions;
    subscription.lastPaymentDate = now;
    subscription.nextBillingDate = endDate;
    subscription.status = SubscriptionStatus.ACTIVE;

    return await this.subscriptionRepository.save(subscription);
  }

  async checkAndExpireSubscriptions(): Promise<void> {
    const now = new Date();
    
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: MoreThan(now),
      },
    });

    for (const subscription of expiredSubscriptions) {
      if (subscription.autoRenew) {
        // TODO: Integrate with payment gateway to charge
        await this.renewSubscription(subscription.id);
      } else {
        subscription.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(subscription);
      }
    }
  }

  async hasActiveSubscription(userId: number): Promise<boolean> {
    const subscription = await this.findUserSubscription(userId);
    return !!subscription;
  }

  async canRecordRecitation(userId: number): Promise<{
    allowed: boolean;
    reason?: string;
    remainingSessions?: number;
  }> {
    const subscription = await this.findUserSubscription(userId);

    if (!subscription) {
      return {
        allowed: false,
        reason: this.i18n.t('subscriptions.NO_ACTIVE_SUBSCRIPTION'),
      };
    }

    if (subscription.remainingSessions <= 0) {
      return {
        allowed: false,
        reason: this.i18n.t('subscriptions.NO_SESSIONS_REMAINING'),
        remainingSessions: 0,
      };
    }

    return {
      allowed: true,
      remainingSessions: subscription.remainingSessions,
    };
  }
}
