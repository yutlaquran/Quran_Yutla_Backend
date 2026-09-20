import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AppSettingsService } from './app-settings.service';
import { AppSetting } from './entities/app-setting.entity';

describe('AppSettingsService', () => {
  let row: AppSetting;
  let service: AppSettingsService;

  const repository = {
    findOne: jest.fn(async () => row),
    save: jest.fn(async (value: Partial<AppSetting>) => {
      row = { ...row, ...value } as AppSetting;
      return row;
    }),
  };

  beforeEach(() => {
    row = {
      name: 'application',
      enabled: false,
      maintenanceMode: false,
      maintenanceMessage: 'System is under maintenance.',
      allowRegistration: true,
      minAppVersion: '1.0.0',
    } as AppSetting;
    jest.clearAllMocks();
    service = new AppSettingsService(
      repository as unknown as Repository<AppSetting>,
    );
  });

  it('turns maintenance on and mirrors it onto the enabled alias', async () => {
    const result = await service.setApplicationSetting({
      maintenanceMode: true,
    });

    expect(result.maintenanceMode).toBe(true);
    expect(result.enabled).toBe(true);
  });

  it('accepts the legacy enabled flag on its own', async () => {
    const result = await service.setApplicationSetting({ enabled: true });

    expect(result.maintenanceMode).toBe(true);
    expect(result.enabled).toBe(true);
  });

  it('rejects enabled and maintenanceMode set to different values', async () => {
    await expect(
      service.setApplicationSetting({ enabled: false, maintenanceMode: true }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.save).not.toHaveBeenCalled();
    expect(row.maintenanceMode).toBe(false);
  });

  it('accepts both flags when they agree', async () => {
    const result = await service.setApplicationSetting({
      enabled: true,
      maintenanceMode: true,
    });

    expect(result.maintenanceMode).toBe(true);
    expect(result.enabled).toBe(true);
  });

  it('leaves maintenance untouched when only other fields change', async () => {
    row.maintenanceMode = true;
    row.enabled = true;

    const result = await service.setApplicationSetting({
      allowRegistration: false,
    });

    expect(result.maintenanceMode).toBe(true);
    expect(result.enabled).toBe(true);
    expect(result.allowRegistration).toBe(false);
  });

  it('reads without writing, reporting enabled from maintenanceMode', async () => {
    row.maintenanceMode = true;
    row.enabled = false;

    const result = await service.getApplicationSetting();

    expect(result.enabled).toBe(true);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
