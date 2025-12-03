import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppSettingsService } from './app-settings.service';
import { UpdateAppSettingDto } from './dto/update-app-setting.dto';
import { Auth } from 'src/common/guards/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';

@ApiTags('App Settings')
@ApiBearerAuth()
@Controller({ path: 'app-settings', version: '1' })
export class AppSettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all app settings (Public)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully'
  })
  @SuccessResponse('Settings retrieved successfully', HttpStatus.OK)
  getSettings() {
    return this.appSettingsService.getApplicationSetting();
  }

  @Get('application')
  @UseGuards(JwtAuthGuard)
  @SuccessResponse('Settings retrieved successfully', HttpStatus.OK)
  getApplicationSetting() {
    return this.appSettingsService.getApplicationSetting();
  }

  @Patch('application')
  @Auth(RolesEnum.ADMIN)
  @SuccessResponse('Settings updated successfully', HttpStatus.OK)
  async setApplicationSetting(
    @Body() updateAppSettingDto: UpdateAppSettingDto,
  ) {
    return await this.appSettingsService.setApplicationSetting(
      updateAppSettingDto,
    );
  }
}
