import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { RecitationsService } from './recitations.service';
import { RecitationsController } from './recitations.controller';
import { Recitation } from './entities/recitation.entity';
import { User } from '../user/entities/user.entity';
import { Surah } from '../quran/entities/surah.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { FileUploadModule } from '../../common/fileUpload/fileUpload.module';
import { CustomI18nModule } from '../../common/services/custom-i18n.module';
import { AIService } from '../../common/services/ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recitation, User, Surah]),
    HttpModule,
    SubscriptionsModule,
    FileUploadModule,
    CustomI18nModule,
  ],
  controllers: [RecitationsController],
  providers: [RecitationsService, AIService],
  exports: [RecitationsService],
})
export class RecitationsModule {}
