import { Module } from '@nestjs/common';
import { QuranAudioController } from './quran-audio.controller';
import { QuranAudioService } from './quran-audio.service';
import { CustomI18nModule } from '../../common/services/custom-i18n.module';
import { QuranModule } from '../quran/quran.module';

@Module({
  imports: [
    CustomI18nModule,
    QuranModule,
  ],
  controllers: [QuranAudioController],
  providers: [QuranAudioService],
  exports: [QuranAudioService],
})
export class QuranAudioModule {}
