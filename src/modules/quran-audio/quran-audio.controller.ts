import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuranAudioService } from './quran-audio.service';
import { GetAudioLinksDto, GetSingleAyahAudioDto, getSingleSurahAudioDto, PaginationQueryDto } from './dto/audio-request.dto';
import { SuccessResponse } from '../../common/interceptors/success-response.interceptor';

@ApiTags('Quran Audio')
@Controller('quran-audio')
export class QuranAudioController {
  constructor(private readonly quranAudioService: QuranAudioService) {}

  @Post('get-audio-links')
  @ApiOperation({
    summary: 'Get audio links for ayah range',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audio links retrieved successfully'
  })
  @SuccessResponse('quran.AUDIO_LINKS_RETRIEVED_SUCCESSFULLY', 200)
  async getAudioLinks(@Body() dto: GetAudioLinksDto) {
    return await this.quranAudioService.getAudioLinks(dto);
  } 

  @Post('get-single-ayah-audio')
  @SuccessResponse('quran.SINGLE_AYAH_AUDIO_RETRIEVED_SUCCESSFULLY', 200)
  async getSingleAyahAudio(@Body() dto: GetSingleAyahAudioDto) {
    return await this.quranAudioService.getSingleAyahAudio(dto);
  }

  @Get('reciters')
  @ApiOperation({
    summary: 'Get available reciters (Sheikhs)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reciters retrieved successfully',
    schema: {
      properties: {
        total: { type: 'number', example: 6 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        reciters: {
          type: 'array',
          items: {
            properties: {
              identifier: { type: 'string', example: 'ar.alafasy' },
              arabicName: { type: 'string', example: 'محمود خليل الحصري' },
              englishName: { type: 'string', example: 'Mahmoud Khalil Al-Hussary' }
            }
          }
        }
      }
    }
  })
  @SuccessResponse('quran.RECITERS_RETRIEVED_SUCCESSFULLY', 200)
  async getReciters(@Query() dto: PaginationQueryDto) {
    return await this.quranAudioService.getAvailableReciters(dto);
  }

  @Post('get-surah-audio')
  @SuccessResponse('quran.SURAH_AUDIO_RETRIEVED_SUCCESSFULLY', 200)
  async getSurahAudio(@Body() dto: getSingleSurahAudioDto) {
    return await this.quranAudioService.getSingleSurahAudio(dto);
  } 
}
