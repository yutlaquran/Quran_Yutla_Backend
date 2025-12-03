import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from './entities/plan.entity';
import { Auth } from '../../common/guards/auth.decorator';
import { RolesEnum } from '../../common/enums/roles.enum';
import { SuccessResponse } from '../../common/interceptors/success-response.interceptor';
import { CountryEnum } from '../../common/enums/country.enum';

@ApiTags('Plans')
@Controller({ path: 'plans', version: '1' })
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @Auth(RolesEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new plan (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Plan created successfully',
    type: Plan,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @SuccessResponse('plans.PLAN_CREATED_SUCCESSFULLY', HttpStatus.CREATED)
  async create(@Body() createPlanDto: CreatePlanDto) {
    return await this.plansService.create(createPlanDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all active plans',
  })
  @ApiQuery({
    name: 'country',
    required: false,
    enum: CountryEnum,
    description: 'Filter plans by country',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plans retrieved successfully',
    type: [Plan],
  })
  @SuccessResponse('plans.PLANS_RETRIEVED_SUCCESSFULLY', HttpStatus.OK)
  async findAll(@Query('country') country?: CountryEnum) {
    if (country) {
      return await this.plansService.findByCountry(country);
    }
    return await this.plansService.findAll();
  }

  @Get('admin/all')
  @Auth(RolesEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all plans including inactive (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All plans retrieved successfully',
    type: [Plan],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @SuccessResponse('plans.PLANS_RETRIEVED_SUCCESSFULLY', HttpStatus.OK)
  async findAllAdmin() {
    return await this.plansService.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single plan by ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan retrieved successfully',
    type: Plan,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Plan not found',
  })
  @SuccessResponse('plans.PLAN_RETRIEVED_SUCCESSFULLY', HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.plansService.findOne(id);
  }

  @Patch(':id')
  @Auth(RolesEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a plan (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan updated successfully',
    type: Plan,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Plan not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @SuccessResponse('plans.PLAN_UPDATED_SUCCESSFULLY', HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return await this.plansService.update(id, updatePlanDto);
  }

  @Patch(':id/toggle-active')
  @Auth(RolesEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle plan active status (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan status toggled successfully',
    type: Plan,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Plan not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @SuccessResponse('plans.PLAN_STATUS_TOGGLED_SUCCESSFULLY', HttpStatus.OK)
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    return await this.plansService.toggleActive(id);
  }

  @Delete(':id')
  @Auth(RolesEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a plan (Admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Plan deleted successfully',
    schema: {
      properties: {
        deleted: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Plan not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  @SuccessResponse('plans.PLAN_DELETED_SUCCESSFULLY', HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.plansService.remove(id);
    return { deleted: true };
  }
}
