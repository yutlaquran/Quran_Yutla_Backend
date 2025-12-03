import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CustomI18nModule } from '../../common/services/custom-i18n.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    HttpModule,
    CustomI18nModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
