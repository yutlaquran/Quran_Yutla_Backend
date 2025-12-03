import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomI18nService } from 'src/common/services/custom-i18n.service';
import { PaginationService } from 'src/common/utils/pagination.utils';
import { Repository } from 'typeorm';
import { UserQueryDto } from './dto/requests/find-user-query.dto';
import { UpdateUserServiceDto } from './dto/requests/update-user-service.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly i18n: CustomI18nService,
  ) {}

  create(user: User) {
    return this.userRepository.save(user);
  }

  async findAll(query: UserQueryDto) {
    let { keyword, email, role, phoneNumber, nationalId, fullName } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.nationalId',
        'user.email',
        'user.fullName',
        'user.phoneNumber',
        'user.roles',
        'user.createdAt',
        'user.dateOfBirth',
        'user.gender',
        'user.isEmailVerified',
        'user.country',
        'user.ageGroup',
        'user.profileImageUrl',
      ])
      .where('user.isEmailVerified = :isEmailVerified', {
        isEmailVerified: true,
      });

    if (keyword) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR ' +
          'user.phoneNumber ILIKE :search OR ' +
          'user.nationalId ILIKE :search OR ' +
          'user.fullName ILIKE :search)',
        { search: `%${keyword}%` },
      );
    }

    if (email) {
      queryBuilder.andWhere('user.email = :email', { email });
    }

    if (role) {
      queryBuilder.andWhere(':role = ANY(user.roles)', { role });
    }

    if (phoneNumber) {
      queryBuilder.andWhere('user.phoneNumber ILIKE :phoneNumber', {
        phoneNumber: `%${phoneNumber}%`,
      });
    }

    if (nationalId) {
      queryBuilder.andWhere('user.nationalId = :nationalId', {
        nationalId,
      });
    }

    if (fullName) {
      queryBuilder.andWhere('user.fullName ILIKE :fullName', {
        fullName: `%${fullName}%`,
      });
    }

    const result = await PaginationService.paginateQueryBuilder<User>(
      queryBuilder,
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        basePath: 'user',
        defaultSortColumn: 'user.createdAt',
      },
    );

    return result;
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'phoneNumber',
        'fullName',
        'nationalId',
        'gender',
        'country',
        'ageGroup',
        'registrationDate',
        'isEmailVerified',
        'roles',
        'nationalImageUrl',
        'profileImageUrl',
        'dateOfBirth',
        'playerIds',
      ],
    });

    if (!user) {
      throw new NotFoundException(this.i18n.t('user.USER_NOT_FOUND'));
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'phoneNumber',
        'fullName',
        'password',
        'roles',
        'isEmailVerified',
      ],
    });
  }

  async update(id: number, updateUserDto: UpdateUserServiceDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async count(): Promise<number> {
    return this.userRepository.count();
  }
}
