import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UploadImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsNotEmpty({ message: 'validation.IS_NOT_EMPTY' })
  image: any;
}
