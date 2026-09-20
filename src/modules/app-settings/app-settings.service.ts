import { BadRequestException, Injectable } from '@nestjs/common';
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
    return this.withEnabledAlias(await this.findOrCreateApplicationSetting());
  }

  async setApplicationSetting(updateAppSettingDto: UpdateAppSettingDto) {
    const setting = await this.findOrCreateApplicationSetting();

    const maintenanceMode = this.resolveMaintenanceMode(
      updateAppSettingDto,
      setting,
    );

    setting.maintenanceMode = maintenanceMode;
    setting.enabled = maintenanceMode;

    setting.maintenanceMessage =
      updateAppSettingDto.maintenanceMessage ?? setting.maintenanceMessage;
    setting.allowRegistration =
      updateAppSettingDto.allowRegistration ?? setting.allowRegistration;
    setting.minAppVersion =
      updateAppSettingDto.minAppVersion ?? setting.minAppVersion;

    return this.withEnabledAlias(
      await this.appSettingRepository.save(setting),
    );
  }

  private async findOrCreateApplicationSetting(): Promise<AppSetting> {
    const setting = await this.appSettingRepository.findOne({
      where: { name: 'application' },
    });

    if (setting) {
      return setting;
    }

    return this.appSettingRepository.save({
      name: 'application',
      enabled: false,
      maintenanceMode: false,
      maintenanceMessage: this.defaultMaintenanceMessage,
      allowRegistration: true,
      minAppVersion: '1.0.0',
    });
  }

  /**
   * `enabled` is the legacy name of `maintenanceMode`. Callers may send either,
   * but sending both with different values is a contradiction we refuse rather
   * than silently resolve.
   */
  private resolveMaintenanceMode(
    updateAppSettingDto: UpdateAppSettingDto,
    setting: AppSetting,
  ): boolean {
    const { enabled, maintenanceMode } = updateAppSettingDto;

    if (
      enabled !== undefined &&
      maintenanceMode !== undefined &&
      enabled !== maintenanceMode
    ) {
      throw new BadRequestException(
        'enabled is an alias of maintenanceMode, so they cannot be set to different values. Send only maintenanceMode.',
      );
    }

    return maintenanceMode ?? enabled ?? setting.maintenanceMode;
  }

  /** `maintenance_mode` is the source of truth; `enabled` only mirrors it. */
  private withEnabledAlias(setting: AppSetting): AppSetting {
    setting.enabled = setting.maintenanceMode;
    return setting;
  }
}
