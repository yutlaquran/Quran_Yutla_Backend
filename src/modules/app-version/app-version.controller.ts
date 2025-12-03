import { Body, Controller, Get, Put, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppVersionService } from './app-version.service';
import { UpdateVersionDto } from './dto/update-app-version.dto';

@ApiTags('App Version')
@Controller({ path: 'app-version', version: '1' })
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get('check')
  @ApiOperation({
    summary: 'Check app version',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Version retrieved successfully'
  })
  async checkVersion() {
    return this.appVersionService.checkVersion();
  }

  @Put('update')
  async updateVersion(@Body() updateVersionDto: UpdateVersionDto) {
    return this.appVersionService.updateVersion(updateVersionDto);
  }
}
