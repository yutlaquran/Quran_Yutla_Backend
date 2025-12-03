import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomI18nModule } from '../services/custom-i18n.module';
import { FileUploadService } from './fileUpload.service';

@Module({
  imports: [ConfigModule, CustomI18nModule],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
