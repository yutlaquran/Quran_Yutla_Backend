import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateVersionDto } from './dto/update-app-version.dto';
import { AppVersion } from './entities/app-version.entity';

@Injectable()
export class AppVersionService {
  constructor(
    @InjectRepository(AppVersion)
    private readonly appVersionRepository: Repository<AppVersion>,
  ) {}

  async checkVersion(): Promise<AppVersion | null> {
    const appVersion = await this.appVersionRepository.findOne({
      order: { id: 'ASC' },
      select: [
        'androidVersion',
        'androidEndDate',
        'androidUrl',
        'iosVersion',
        'iosEndDate',
        'iosUrl',
      ],
      where: {},
    });
    return appVersion;
  }

  async updateVersion(updateVersionDto: UpdateVersionDto): Promise<AppVersion> {
    let appVersion = await this.appVersionRepository.findOne({
      order: { id: 'ASC' },
      select: ['id'],
      where: {},
    });

    if (!appVersion) {
      appVersion = this.appVersionRepository.create(updateVersionDto);
    } else {
      Object.assign(appVersion, updateVersionDto);
    }

    return await this.appVersionRepository.save(appVersion);
  }
}
