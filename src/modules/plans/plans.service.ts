import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan, SessionCount, SessionDuration } from './entities/plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CustomI18nService } from '../../common/services/custom-i18n.service';
import { CountryEnum } from '../../common/enums/country.enum';

@Injectable()
export class PlansService implements OnModuleInit {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly i18n: CustomI18nService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const appEnv = this.configService.get<string>('APP_ENV') || process.env.APP_ENV;
    const nodeEnv = this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV;
    const isProduction = appEnv === 'production' || nodeEnv === 'production';

    if (isProduction) {
      return;
    }

    await this.ensureDefaultPlansSeeded();
  }

  async ensureDefaultPlansSeeded(): Promise<void> {
    const activePlansCount = await this.planRepository.count({
      where: { isActive: true },
    });

    if (activePlansCount > 0) {
      return;
    }

    const defaults: CreatePlanDto[] = [
      {
        nameEn: 'Starter Plan',
        nameAr: 'الباقة المبتدئة',
        descriptionEn: '8 sessions per month, 30 minutes each',
        descriptionAr: '8 جلسات شهريا، 30 دقيقة لكل جلسة',
        sessionDuration: SessionDuration.THIRTY_MINUTES,
        sessionCount: SessionCount.EIGHT,
        basePrice: 19.99,
        discountPercentage: 0,
        isActive: true,
        isPopular: false,
        displayOrder: 1,
      },
      {
        nameEn: 'Standard Plan',
        nameAr: 'الباقة القياسية',
        descriptionEn: '12 sessions per month, 30 minutes each',
        descriptionAr: '12 جلسة شهريا، 30 دقيقة لكل جلسة',
        sessionDuration: SessionDuration.THIRTY_MINUTES,
        sessionCount: SessionCount.TWELVE,
        basePrice: 29.99,
        discountPercentage: 0,
        isActive: true,
        isPopular: true,
        displayOrder: 2,
      },
      {
        nameEn: 'Intensive Plan',
        nameAr: 'الباقة المكثفة',
        descriptionEn: '16 sessions per month, 60 minutes each',
        descriptionAr: '16 جلسة شهريا، 60 دقيقة لكل جلسة',
        sessionDuration: SessionDuration.SIXTY_MINUTES,
        sessionCount: SessionCount.SIXTEEN,
        basePrice: 49.99,
        discountPercentage: 0,
        isActive: true,
        isPopular: false,
        displayOrder: 3,
      },
    ];

    const defaultPlans = this.planRepository.create(defaults);
    await this.planRepository.save(defaultPlans);
    this.logger.log(
      `Seeded ${defaultPlans.length} default plans for local testing`,
    );
  }

  async hasActivePlans(): Promise<boolean> {
    const activePlansCount = await this.planRepository.count({
      where: { isActive: true },
    });

    return activePlansCount > 0;
  }

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    // Validate country pricing keys if provided
    if (createPlanDto.countryPricing) {
      const validCountries = Object.values(CountryEnum);
      const invalidCountries = Object.keys(createPlanDto.countryPricing).filter(
        (country) => !validCountries.includes(country as CountryEnum),
      );

      if (invalidCountries.length > 0) {
        throw new BadRequestException(
          `Invalid countries in pricing: ${invalidCountries.join(', ')}`,
        );
      }
    }

    const plan = this.planRepository.create(createPlanDto);
    return await this.planRepository.save(plan);
  }

  async findAll(): Promise<Plan[]> {
    return await this.planRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findAllAdmin(): Promise<Plan[]> {
    return await this.planRepository.find({
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException(this.i18n.t('plans.PLAN_NOT_FOUND'));
    }

    return plan;
  }

  async findByCountry(country: CountryEnum): Promise<Plan[]> {
    const plans = await this.findAll();

    return plans.map((plan) => {
      const price = plan.countryPricing?.[country] || plan.basePrice;
      const discountedPrice =
        price - (price * plan.discountPercentage) / 100;

      return {
        ...plan,
        price,
        discountedPrice,
        finalPrice: discountedPrice,
      } as any;
    });
  }

  async update(id: number, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);

    // Validate country pricing keys if provided
    if (updatePlanDto.countryPricing) {
      const validCountries = Object.values(CountryEnum);
      const invalidCountries = Object.keys(updatePlanDto.countryPricing).filter(
        (country) => !validCountries.includes(country as CountryEnum),
      );

      if (invalidCountries.length > 0) {
        throw new BadRequestException(
          `Invalid countries in pricing: ${invalidCountries.join(', ')}`,
        );
      }
    }

    Object.assign(plan, updatePlanDto);
    return await this.planRepository.save(plan);
  }

  async remove(id: number): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepository.remove(plan);
  }

  async toggleActive(id: number): Promise<Plan> {
    const plan = await this.findOne(id);
    plan.isActive = !plan.isActive;
    return await this.planRepository.save(plan);
  }
}
