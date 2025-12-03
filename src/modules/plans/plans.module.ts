import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { Plan } from './entities/plan.entity';
import { CustomI18nModule } from '../../common/services/custom-i18n.module';

@Module({
  imports: [TypeOrmModule.forFeature([Plan]), CustomI18nModule],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
