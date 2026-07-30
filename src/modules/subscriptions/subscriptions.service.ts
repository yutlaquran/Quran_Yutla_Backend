import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
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

  private buildPricingSnapshot(
    plan: {
      basePrice: number;
      countryPricing?: Record<string, number>;
      discountPercentage?: number;
    },
    userCountry: string,
  ): {
    pricingCountry: string;
    originalPrice: number;
    discountPercentageApplied: number;
    finalAmount: number;
    currency: string;
  } {
    const basePrice = Number(plan.basePrice);
    const countryPrice = plan.countryPricing?.[userCountry];
    const originalPrice = Number(
      countryPrice !== undefined ? countryPrice : basePrice,
    );
    const discountPercentageApplied = Number(plan.discountPercentage ?? 0);
    const discounted =
      originalPrice - (originalPrice * discountPercentageApplied) / 100;
    const finalAmount = this.roundToTwoDecimals(Math.max(0, discounted));
    const currency =
      this.configService.get<string>('PAYMOB_CURRENCY') || 'EGP';

    return {
      pricingCountry: userCountry,
      originalPrice: this.roundToTwoDecimals(originalPrice),
      discountPercentageApplied: this.roundToTwoDecimals(
        discountPercentageApplied,
      ),
      finalAmount,
      currency,
    };
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly plansService: PlansService,
    private readonly paymobService: PaymobService,
    private readonly i18n: CustomI18nService,
    private readonly configService: ConfigService,
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
    currency: string;
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

    // Get user details for Paymob
    const user = await this.subscriptionRepository.manager.findOne(User, {
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(this.i18n.t('user.USER_NOT_FOUND'));
    }

    if (!user.country) {
      throw new BadRequestException(
        this.i18n.t('subscriptions.USER_COUNTRY_REQUIRED_FOR_PRICING'),
      );
    }

    const pricingSnapshot = this.buildPricingSnapshot(plan, user.country);

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
      pricingCountry: pricingSnapshot.pricingCountry,
      originalPrice: pricingSnapshot.originalPrice,
      discountPercentageApplied: pricingSnapshot.discountPercentageApplied,
      finalAmount: pricingSnapshot.finalAmount,
      currency: pricingSnapshot.currency,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    // Create Paymob payment
    try {
      const paymobResponse = await this.paymobService.createPayment(
        {
          orderId: `SUB-${savedSubscription.id}`,
          amount: pricingSnapshot.finalAmount,
          currency: pricingSnapshot.currency,
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
        amount: pricingSnapshot.finalAmount,
        currency: pricingSnapshot.currency,
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

  /**
   * Give a session back after work that consumed one could not be delivered
   * (e.g. the AI evaluation failed). Deliberately never throws: every caller
   * runs in a background path where an exception would either be swallowed or
   * take down a cron sweep mid-batch.
   */
  async refundSession(userId: number): Promise<void> {
    const subscription = await this.findUserSubscription(userId);

    if (!subscription) {
      this.logger.warn(
        `Cannot refund session for user ${userId}: no active subscription (it may have expired since)`,
      );
      return;
    }

    // Never hand back more than the plan allows — protects against a
    // double-refund inflating the balance beyond what was paid for.
    if (subscription.remainingSessions >= subscription.totalSessions) {
      this.logger.warn(
        `Skipping refund for user ${userId}: already at ${subscription.remainingSessions}/${subscription.totalSessions}`,
      );
      return;
    }

    subscription.remainingSessions += 1;
    await this.subscriptionRepository.save(subscription);

    this.logger.log(
      `Refunded 1 session to user ${userId} (now ${subscription.remainingSessions}/${subscription.totalSessions})`,
    );
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

    // `LessThan`, not `MoreThan`: we want subscriptions whose end date is in
    // the past. The previous comparison selected every *valid* subscription,
    // expiring live ones nightly and renewing auto-renew ones for free.
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(now),
      },
    });

    if (expiredSubscriptions.length === 0) {
      return;
    }

    for (const subscription of expiredSubscriptions) {
      // NOTE: auto-renew is deliberately not honoured here. Renewing without
      // charging would hand out free months, and recurring billing is not
      // implemented (Paymob integration is one-time payment only, and
      // recurring renewal is listed as post-MVP). Expire the subscription and
      // let the student start a new paid one; `autoRenew` stays recorded so a
      // future billing job can pick these up.
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);
    }

    const pendingRenewal = expiredSubscriptions.filter((s) => s.autoRenew).length;
    this.logger.log(
      `Expired ${expiredSubscriptions.length} subscription(s)` +
        (pendingRenewal > 0
          ? `; ${pendingRenewal} had autoRenew set and need re-payment (recurring billing not implemented)`
          : ''),
    );
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
      const hasActivePlans = await this.plansService.hasActivePlans();

      return {
        allowed: false,
        reason: hasActivePlans
          ? this.i18n.t('subscriptions.NO_ACTIVE_SUBSCRIPTION')
          : this.i18n.t('subscriptions.NO_ACTIVE_PLANS_CONFIGURED'),
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

  async activateTestSubscriptionForDev(
    userId: number,
    planId?: number,
  ): Promise<Subscription> {
    // Fail safe: allow this only when the environment is *explicitly*
    // development. The previous check blocked it merely when APP_ENV was
    // 'production', so a deployment that forgot to set APP_ENV at all left this
    // free-subscription endpoint wide open in production.
    const appEnv =
      this.configService.get<string>('APP_ENV') || process.env.APP_ENV;
    const nodeEnv =
      this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV;
    const isExplicitlyDevelopment =
      appEnv === 'development' || nodeEnv === 'development';

    if (!isExplicitlyDevelopment) {
      throw new ForbiddenException(
        this.i18n.t('subscriptions.DEV_ONLY_ENDPOINT'),
      );
    }

    const existingSubscription = await this.findUserSubscription(userId);
    if (existingSubscription) {
      return existingSubscription;
    }

    await this.plansService.ensureDefaultPlansSeeded();

    let selectedPlan;
    if (planId) {
      selectedPlan = await this.plansService.findOne(planId);
      if (!selectedPlan.isActive) {
        throw new BadRequestException(
          this.i18n.t('subscriptions.PLAN_NOT_AVAILABLE'),
        );
      }
    } else {
      const activePlans = await this.plansService.findAll();
      selectedPlan = activePlans[0];
    }

    if (!selectedPlan) {
      throw new BadRequestException(
        this.i18n.t('subscriptions.NO_ACTIVE_PLANS_CONFIGURED'),
      );
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + selectedPlan.durationDays);

    const subscription = this.subscriptionRepository.create({
      userId,
      planId: selectedPlan.id,
      totalSessions: selectedPlan.sessionCount,
      remainingSessions: selectedPlan.sessionCount,
      sessionDuration: selectedPlan.sessionDuration,
      autoRenew: false,
      paymentMethod: 'dev-test',
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      endDate,
      lastPaymentDate: now,
      nextBillingDate: endDate,
      transactionId: `DEV-${userId}-${Date.now()}`,
    });

    return await this.subscriptionRepository.save(subscription);
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
