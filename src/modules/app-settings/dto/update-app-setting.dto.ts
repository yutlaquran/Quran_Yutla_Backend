import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAppSettingDto {
  @ApiPropertyOptional({
    description: 'Backward-compatible alias for maintenanceMode',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Enable or disable maintenance mode',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional({
    description: 'Message shown to users during maintenance mode',
    example: 'النظام قيد الصيانة',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  maintenanceMessage?: string;

  @ApiPropertyOptional({
    description: 'Allow new users to register',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowRegistration?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum supported app version',
    example: '1.0.0',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  minAppVersion?: string;
}
