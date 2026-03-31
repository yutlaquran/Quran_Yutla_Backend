import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { AdminActionSubscriptionDto } from './dto/admin-action-subscription.dto';
import { DevActivateTestSubscriptionDto } from './dto/dev-activate-test-subscription.dto';
import { Subscription } from './entities/subscription.entity';
import { Auth } from '../../common/guards/auth.decorator';
import { RolesEnum } from '../../common/enums/roles.enum';
import { CurrentUser } from '../../common/guards/user.decorator';
import { User } from '../user/entities/user.entity';
import { SuccessResponse } from '../../common/interceptors/success-response.interceptor';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('initiate-payment')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Initiate payment for subscription (Student only)',
    description: 'Creates a pending subscription and returns payment URL for card payment',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment initiated successfully, returns payment URL',
    schema: {
      properties: {
        subscriptionId: { type: 'number', example: 123 },
        paymentUrl: { type: 'string', example: 'https://payment.gateway.com/checkout/session_123' },
        sessionId: { type: 'string', example: 'session_123_1234567890' },
        amount: { type: 'number', example: 50 },
        currency: { type: 'string', example: 'EGP' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid plan or user already has active subscription',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Student role required',
  })
  @SuccessResponse(
    'subscriptions.PAYMENT_INITIATED_SUCCESSFULLY',
    HttpStatus.CREATED,
  )
  async initiatePayment(
    @CurrentUser() user: User,
    @Body() initiatePaymentDto: InitiatePaymentDto,
  ) {
    return await this.subscriptionsService.initiatePayment(
      user.id,
      initiatePaymentDto,
    );
  }

  @Post('verify-payment')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Verify payment and activate subscription',
    description: 'Called after successful payment to activate the subscription',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment verified and subscription activated',
    type: Subscription,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payment failed or invalid transaction',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  @SuccessResponse(
    'subscriptions.SUBSCRIPTION_ACTIVATED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto) {
    return await this.subscriptionsService.verifyPayment(verifyPaymentDto);
  }

  @Post('webhook/paymob')
  @ApiOperation({
    summary: 'Paymob webhook callback',
    description: 'Receives payment notifications from Paymob',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
  })
  async paymobWebhook(@Body() webhookData: any) {
    return await this.subscriptionsService.handlePaymobWebhook(webhookData);
  }

  @Post('subscribe')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Create a new subscription (Student only) - Deprecated',
    deprecated: true,
    description: 'Use /initiate-payment instead',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscription created successfully',
    type: Subscription,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid plan or user already has active subscription',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Student role required',
  })
  @SuccessResponse(
    'subscriptions.SUBSCRIPTION_CREATED_SUCCESSFULLY',
    HttpStatus.CREATED,
  )
  async create(
    @CurrentUser() user: User,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return await this.subscriptionsService.create(
      user.id,
      createSubscriptionDto,
    );
  }

  @Get('me')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Get current user active subscription',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription retrieved successfully',
    type: Subscription,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No active subscription found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @SuccessResponse(
    'subscriptions.SUBSCRIPTION_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async findMine(@CurrentUser() user: User) {
    return await this.subscriptionsService.findUserSubscription(user.id);
  }

  @Get('me/history')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Get all user subscriptions history',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscriptions history retrieved successfully',
    type: [Subscription],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @SuccessResponse(
    'subscriptions.SUBSCRIPTIONS_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async findMyHistory(@CurrentUser() user: User) {
    return await this.subscriptionsService.findAllByUser(user.id);
  }

  @Get('me/check')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Check if user can record recitation',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recording permission checked',
    schema: {
      properties: {
        canRecord: { type: 'boolean', example: true },
        remainingSessions: { type: 'number', example: 8 },
        sessionDuration: { type: 'number', example: 30 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @SuccessResponse(
    'subscriptions.RECORDING_PERMISSION_CHECKED',
    HttpStatus.OK,
  )
  async checkRecordingPermission(@CurrentUser() user: User) {
    return await this.subscriptionsService.canRecordRecitation(user.id);
  }

  @Post('dev/activate-test-subscription')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Development only: activate a test subscription for current student',
    description:
      'Creates and activates a subscription without payment in non-production environments.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Test subscription activated successfully',
    type: Subscription,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'This endpoint is not available in production',
  })
  @SuccessResponse(
    'subscriptions.DEV_TEST_SUBSCRIPTION_ACTIVATED',
    HttpStatus.CREATED,
  )
  async activateTestSubscriptionForDev(
    @CurrentUser() user: User,
    @Body() dto: DevActivateTestSubscriptionDto,
  ) {
    return await this.subscriptionsService.activateTestSubscriptionForDev(
      user.id,
      dto?.planId,
    );
  }

  @Patch('me/cancel')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Cancel current subscription',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription cancelled successfully',
    type: Subscription,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No active subscription found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @SuccessResponse(
    'subscriptions.SUBSCRIPTION_CANCELLED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async cancel(
    @CurrentUser() user: User,
    @Body() cancelDto: CancelSubscriptionDto,
  ) {
    return await this.subscriptionsService.cancelSubscription(
      user.id,
      cancelDto,
    );
  }

  @Patch(':id/activate')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary: 'Activate subscription after payment (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription activated successfully',
    type: Subscription,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @SuccessResponse(
    'subscriptions.SUBSCRIPTION_ACTIVATED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async activate(@Param('id', ParseIntPipe) id: number) {
    return await this.subscriptionsService.activateSubscription(id);
  }

  @Get('user/:userId')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary: 'Get all subscriptions by user ID (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User subscriptions retrieved successfully',
    type: [Subscription],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @SuccessResponse(
    'subscriptions.SUBSCRIPTIONS_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async findAllByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return await this.subscriptionsService.findAllByUser(userId);
  }

  @Get(':id')
  @Auth(RolesEnum.ADMIN)
  @ApiOperation({
    summary: 'Get subscription by ID (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription retrieved successfully',
    type: Subscription,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @SuccessResponse(
    'subscriptions.SUBSCRIPTION_RETRIEVED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.subscriptionsService.findOne(id);
  }

  @Patch(':id/suspend')
  @Auth(RolesEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Suspend subscription (Admin only)',
    description: 'Temporarily suspend an active subscription',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription suspended successfully',
    type: Subscription,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Subscription is not active',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @SuccessResponse(
    'subscriptions.SUBSCRIPTION_SUSPENDED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async suspend(
    @Param('id', ParseIntPipe) id: number,
    @Body() adminActionDto: AdminActionSubscriptionDto,
  ) {
    return await this.subscriptionsService.suspendSubscription(
      id,
      adminActionDto.reason,
    );
  }

  @Patch(':id/resume')
  @Auth(RolesEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Resume suspended subscription (Admin only)',
    description: 'Reactivate a suspended subscription',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription resumed successfully',
    type: Subscription,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Subscription is not suspended or already expired',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @SuccessResponse(
    'subscriptions.SUBSCRIPTION_RESUMED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async resume(@Param('id', ParseIntPipe) id: number) {
    return await this.subscriptionsService.resumeSubscription(id);
  }

  @Patch(':id/cancel-by-admin')
  @Auth(RolesEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel subscription (Admin only)',
    description: 'Cancel a subscription by admin',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription cancelled successfully',
    type: Subscription,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Subscription already cancelled',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @SuccessResponse(
    'subscriptions.SUBSCRIPTION_CANCELLED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async cancelByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() adminActionDto: AdminActionSubscriptionDto,
  ) {
    return await this.subscriptionsService.cancelSubscriptionByAdmin(
      id,
      adminActionDto.reason,
    );
  }

  @Patch(':id/renew')
  @Auth(RolesEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Manually renew subscription (Admin only)',
    description: 'Manually renew a subscription for another month',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription renewed successfully',
    type: Subscription,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot renew cancelled subscription',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @SuccessResponse(
    'subscriptions.SUBSCRIPTION_RENEWED_SUCCESSFULLY',
    HttpStatus.OK,
  )
  async renewManually(@Param('id', ParseIntPipe) id: number) {
    return await this.subscriptionsService.renewSubscriptionManually(id);
  }}