import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Version,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { stat } from 'fs';
import { Auth } from 'src/common/guards/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';

@ApiTags('FAQ')
@ApiBearerAuth()
@Controller({ version: '1', path: 'faq' })
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth(RolesEnum.ADMIN)
  @SuccessResponse('faq.CREATE_FAQ_SUCCESS', HttpStatus.CREATED)
  create(@Body() createFaqDto: CreateFaqDto) {
    return this.faqService.create(createFaqDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @SuccessResponse('faq.FETCH_FAQS_SUCCESS')
  findAll() {
    return this.faqService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @SuccessResponse('faq.FETCH_FAQ_SUCCESS')
  findOne(@Param('id') id: string) {
    return this.faqService.findOne(+id);
  }

  @Patch(':id')
  @Auth(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @SuccessResponse('faq.UPDATE_FAQ_SUCCESS')
  update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    return this.faqService.update(+id, updateFaqDto);
  }

  @Delete(':id')
  @Auth(RolesEnum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @SuccessResponse('faq.DELETE_FAQ_SUCCESS')
  remove(@Param('id') id: string) {
    return this.faqService.remove(+id);
  }
}
