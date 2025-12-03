import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAppSettingDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
