import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto, PaymentStatus } from './dto/verify-payment.dto';
import { CustomI18nService } from '../../common/services/custom-i18n.service';
import { PlansService } from '../plans/plans.service';
import { User } from '../user/entities/user.entity';
import { PaymobService } from '../../common/services/paymob.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly plansService: PlansService,
    private readonly paymobService: PaymobService,
    private readonly i18n: CustomI18nService,
  ) {}

  /**
   * Initiate payment for a new subscription
   * Returns payment URL for card payment using Paymob
   */
  async initiatePayment(
    userId: number,
    initiatePaymentDto: InitiatePaymentDto,
  ): Promise<{
    subscriptionId: number;
    paymentUrl: string;
    sessionId: string;
    amount: number;
  }> {
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
    const plan = await this.plansService.findOne(initiatePaymentDto.planId);

    if (!plan.isActive) {
      throw new BadRequestException(
        this.i18n.t('subscriptions.PLAN_NOT_AVAILABLE'),
      );
    }

    // Create subscription (pending payment)
    const subscription = this.subscriptionRepository.create({
      userId,
      planId: initiatePaymentDto.planId,
      totalSessions: plan.sessionCount,
      remainingSessions: 0, // Will be set after payment
      sessionDuration: plan.sessionDuration,
      autoRenew: initiatePaymentDto.autoRenew ?? false,
      paymentMethod: 'card',
      status: SubscriptionStatus.PENDING_PAYMENT,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    // Get user details for Paymob
    const user = await this.subscriptionRepository.manager.findOne(User, {
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(this.i18n.t('user.USER_NOT_FOUND'));
    }

    // Create Paymob payment
    try {
      const paymobResponse = await this.paymobService.createPayment(
        {
          orderId: `SUB-${savedSubscription.id}`,
          amount: plan.basePrice,
          currency: 'EGP',
          firstName: user.fullName?.split(' ')[0] || 'Student',
          lastName: user.fullName?.split(' ').slice(1).join(' ') || 'User',
          email: user.email,
          phone: user.phoneNumber || '+20100000000',
        },
        'card',
      );

      return {
        subscriptionId: savedSubscription.id,
        paymentUrl: paymobResponse.paymentUrl,
        sessionId: paymobResponse.paymentToken,
        amount: plan.basePrice,
      };
    } catch (error) {
      // Delete subscription if payment initiation fails
      await this.subscriptionRepository.remove(savedSubscription);
      throw error;
    }
  }

  /**
   * Verify payment and activate subscription
   */
  async verifyPayment(
    verifyPaymentDto: VerifyPaymentDto,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: verifyPaymentDto.subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException(
        this.i18n.t('subscriptions.SUBSCRIPTION_NOT_FOUND'),
      );
    }

    if (subscription.status !== SubscriptionStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        this.i18n.t('subscriptions.INVALID_SUBSCRIPTION_STATUS'),
      );
    }

    // TODO: Verify transaction with payment gateway
    // const isValid = await this.verifyTransactionWithGateway(verifyPaymentDto.transactionId);
    
    if (verifyPaymentDto.status === PaymentStatus.SUCCESS) {
      // Activate subscription
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + subscription.plan.durationDays);

      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.startDate = now;
      subscription.endDate = endDate;
      subscription.lastPaymentDate = now;
      subscription.nextBillingDate = endDate;
      subscription.remainingSessions = subscription.totalSessions;
      subscription.transactionId = verifyPaymentDto.transactionId;

      return await this.subscriptionRepository.save(subscription);
    } else {
      // Payment failed
      subscription.status = SubscriptionStatus.CANCELLED;
      await this.subscriptionRepository.save(subscription);
      
      throw new BadRequestException(
        this.i18n.t('subscriptions.PAYMENT_FAILED'),
      );
    }
  }

  /**
   * Handle Paymob webhook callback
   */
  async handlePaymobWebhook(webhookData: any): Promise<{ success: boolean }> {
    try {
      // Verify HMAC signature
      const isValid = this.paymobService.verifyWebhookSignature(
        webhookData.obj,
        webhookData.hmac,
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        throw new BadRequestException('Invalid webhook signature');
      }

      // Process webhook
      const result = await this.paymobService.processWebhook(webhookData.obj);

      if (result.success) {
        // Extract subscription ID from order ID (SUB-123 format)
        const subscriptionId = parseInt(result.orderId.replace('SUB-', ''));

        // Verify and activate subscription
        await this.verifyPayment({
          transactionId: result.transactionId,
          subscriptionId,
          status: PaymentStatus.SUCCESS,
        });

        this.logger.log(`Subscription ${subscriptionId} activated via webhook`);
      } else {
        // Payment failed, update subscription status
        const subscriptionId = parseInt(result.orderId.replace('SUB-', ''));
        const subscription = await this.subscriptionRepository.findOne({
          where: { id: subscriptionId },
        });

        if (subscription) {
          subscription.status = SubscriptionStatus.CANCELLED;
          await this.subscriptionRepository.save(subscription);
        }

        this.logger.log(`Payment failed for subscription ${subscriptionId}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Webhook processing failed', error);
      throw error;
    }
  }

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

  /**
   * Suspend subscription (Admin only)
   */
  async suspendSubscription(subscriptionId: number, reason?: string): Promise<Subscription> {
    const subscription = await this.findOne(subscriptionId);

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        this.i18n.t('subscriptions.SUBSCRIPTION_NOT_ACTIVE'),
      );
    }

    subscription.status = SubscriptionStatus.SUSPENDED;
    if (reason) {
      subscription.cancellationReason = reason;
    }

    this.logger.log(`Subscription ${subscriptionId} suspended by admin`);
    return await this.subscriptionRepository.save(subscription);
  }

  /**
   * Resume suspended subscription (Admin only)
   */
  async resumeSubscription(subscriptionId: number): Promise<Subscription> {
    const subscription = await this.findOne(subscriptionId);

    if (subscription.status !== SubscriptionStatus.SUSPENDED) {
      throw new BadRequestException(
        this.i18n.t('subscriptions.SUBSCRIPTION_NOT_SUSPENDED'),
      );
    }

    // Check if subscription end date is still valid
    const now = new Date();
    if (subscription.endDate && subscription.endDate < now) {
      subscription.status = SubscriptionStatus.EXPIRED;
      this.logger.log(`Cannot resume subscription ${subscriptionId} - already expired`);
      throw new BadRequestException(
        this.i18n.t('subscriptions.SUBSCRIPTION_EXPIRED'),
      );
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    delete subscription.cancellationReason;

    this.logger.log(`Subscription ${subscriptionId} resumed by admin`);
    return await this.subscriptionRepository.save(subscription);
  }

  /**
   * Cancel subscription by admin
   */
  async cancelSubscriptionByAdmin(
    subscriptionId: number,
    reason?: string,
  ): Promise<Subscription> {
    const subscription = await this.findOne(subscriptionId);

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException(
        this.i18n.t('subscriptions.SUBSCRIPTION_ALREADY_CANCELLED'),
      );
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;
    if (reason) {
      subscription.cancellationReason = reason;
    }

    this.logger.log(`Subscription ${subscriptionId} cancelled by admin`);
    return await this.subscriptionRepository.save(subscription);
  }

  /**
   * Manually renew subscription (Admin only)
   */
  async renewSubscriptionManually(subscriptionId: number): Promise<Subscription> {
    const subscription = await this.findOne(subscriptionId);

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException(
        this.i18n.t('subscriptions.CANNOT_RENEW_CANCELLED_SUBSCRIPTION'),
      );
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
    delete subscription.cancellationReason;
    delete subscription.cancelledAt;

    this.logger.log(`Subscription ${subscriptionId} renewed manually by admin`);
    return await this.subscriptionRepository.save(subscription);
  }
}
