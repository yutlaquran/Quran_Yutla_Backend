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

  @Post('subscribe')
  @Auth(RolesEnum.STUDENT)
  @ApiOperation({
    summary: 'Create a new subscription (Student only)',
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
}
