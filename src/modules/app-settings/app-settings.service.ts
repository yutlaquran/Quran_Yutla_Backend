import { Injectable } from '@nestjs/common';
import { UpdateAppSettingDto } from './dto/update-app-setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AppSetting } from './entities/app-setting.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AppSettingsService {
  private readonly defaultMaintenanceMessage = 'System is under maintenance.';

  constructor(
    @InjectRepository(AppSetting)
    private readonly appSettingRepository: Repository<AppSetting>,
  ) {}

  async getApplicationSetting() {
    let setting = await this.appSettingRepository.findOne({
      where: { name: 'application' },
    });

    if (!setting) {
      setting = await this.appSettingRepository.save({
        name: 'application',
        enabled: false,
        maintenanceMode: false,
        maintenanceMessage: this.defaultMaintenanceMessage,
        allowRegistration: true,
        minAppVersion: '1.0.0',
      });
    }

    if (setting.maintenanceMode !== setting.enabled) {
      setting.maintenanceMode = setting.enabled;
      setting = await this.appSettingRepository.save(setting);
    }

    return setting;
  }

  async setApplicationSetting(updateAppSettingDto: UpdateAppSettingDto) {
    const setting = await this.getApplicationSetting();

    const maintenanceMode =
      updateAppSettingDto.maintenanceMode ??
      updateAppSettingDto.enabled ??
      setting.maintenanceMode;

    setting.maintenanceMode = maintenanceMode;
    setting.enabled = maintenanceMode;

    setting.maintenanceMessage =
      updateAppSettingDto.maintenanceMessage ?? setting.maintenanceMessage;
    setting.allowRegistration =
      updateAppSettingDto.allowRegistration ?? setting.allowRegistration;
    setting.minAppVersion =
      updateAppSettingDto.minAppVersion ?? setting.minAppVersion;

    await this.appSettingRepository.save(setting);

    return this.getApplicationSetting();
  }
}
