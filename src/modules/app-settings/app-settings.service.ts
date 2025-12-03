import { Injectable } from '@nestjs/common';
import { UpdateAppSettingDto } from './dto/update-app-setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AppSetting } from './entities/app-setting.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AppSettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly appSettingRepository: Repository<AppSetting>,
  ) {}

  async getApplicationSetting() {
    const setting = await this.appSettingRepository.findOne({
      where: { name: 'application' },
    });
    return setting;
  }

  async setApplicationSetting(updateAppSettingDto: UpdateAppSettingDto) {
    const setting = await this.appSettingRepository.findOne({
      where: { name: 'application' },
    });
    if (setting) {
      setting.enabled = updateAppSettingDto.enabled ?? false;
      await this.appSettingRepository.save(setting);
    } else {
      await this.appSettingRepository.save({
        name: 'application',
        enabled: updateAppSettingDto.enabled ?? false,
      });
    }
    return this.getApplicationSetting();
  }
}
