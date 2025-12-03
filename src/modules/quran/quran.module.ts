import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AyahEntity } from './entities/ayah.entity';
import { SurahEntity } from './entities/surah.entity';
import { QuranDataService } from './quran-data.service';
import { QuranController } from './quran.controller';
import { QuranRepository } from './quran.repository';
import { QuranService } from './quran.service';
import { CustomI18nModule } from 'src/common/services/custom-i18n.module';

@Module({
  imports: [
    CustomI18nModule,
    TypeOrmModule.forFeature([SurahEntity, AyahEntity]),
  ],
  controllers: [QuranController],
  providers: [QuranService, QuranDataService, QuranRepository],
  exports: [QuranService, QuranDataService],
})
export class QuranModule {}
