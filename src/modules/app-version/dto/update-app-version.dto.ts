import { IsDateString, IsString } from 'class-validator';

export class UpdateVersionDto {
  @IsString()
  androidVersion: string;

  @IsDateString()
  androidEndDate: string;

  @IsString()
  androidUrl: string;

  @IsString()
  iosVersion: string;

  @IsDateString()
  iosEndDate: string;

  @IsString()
  iosUrl: string;
}
