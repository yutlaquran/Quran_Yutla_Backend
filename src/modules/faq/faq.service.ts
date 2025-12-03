import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Repository } from 'typeorm';
import { Faq } from './entities/faq.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomI18nService } from 'src/common/services/custom-i18n.service';

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(Faq)
    private readonly faqRepostiry: Repository<Faq>,
    private readonly i18n: CustomI18nService,
  ) {}
  async create(createFaqDto: CreateFaqDto) {
    const faq = this.faqRepostiry.create(createFaqDto);
    return await this.faqRepostiry.save(faq);
  }

  async findAll() {
    return await this.faqRepostiry.find();
  }

  async findOne(id: number) {
    const faq = await this.faqRepostiry.findOneBy({ id });
    if (!faq) {
      throw new NotFoundException(this.i18n.t('faq.FAQ_NOT_FOUND'));
    }
    return faq;
  }

  async update(id: number, updateFaqDto: UpdateFaqDto) {
    const faq = await this.findOne(id);
    this.faqRepostiry.merge(faq, updateFaqDto);
    return await this.faqRepostiry.save(faq);
  }

  async remove(id: number) {
    const result = await this.faqRepostiry.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(this.i18n.t('faq.FAQ_NOT_FOUND'));
    }
    return result;
  }
}
