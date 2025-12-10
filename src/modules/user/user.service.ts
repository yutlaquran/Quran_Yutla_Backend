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
    let { keyword, email, role, phoneNumber, fullName } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
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
        'user.studentCode',
      ])
      .where('user.isEmailVerified = :isEmailVerified', {
        isEmailVerified: true,
      });

    if (keyword) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR ' +
          'user.phoneNumber ILIKE :search OR ' +
          'user.fullName ILIKE :search OR ' +
          'user.studentCode ILIKE :search)',
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
        'gender',
        'country',
        'ageGroup',
        'registrationDate',
        'isEmailVerified',
        'roles',
        'profileImageUrl',
        'dateOfBirth',
        'playerIds',
        'studentCode',
        'parentId',
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

  // ==================== Parent-Child Linking ====================

  async linkParent(parentId: number, studentCode: string): Promise<User> {
    // Find student by code
    const student = await this.userRepository.findOne({
      where: { studentCode },
    });

    if (!student) {
      throw new NotFoundException(
        this.i18n.t('user.STUDENT_CODE_NOT_FOUND'),
      );
    }

    // Check if student is already linked to a parent
    if (student.parentId) {
      throw new NotFoundException(
        this.i18n.t('user.STUDENT_ALREADY_HAS_PARENT'),
      );
    }

    // Check if student has STUDENT role
    if (!student.roles.includes('STUDENT' as any)) {
      throw new NotFoundException(
        this.i18n.t('user.USER_IS_NOT_STUDENT'),
      );
    }

    // Link student to parent
    student.parentId = parentId;
    return await this.userRepository.save(student);
  }

  async linkMultipleChildren(
    parentId: number,
    studentCodes: string[],
  ): Promise<{ linked: User[]; failed: { code: string; reason: string }[] }> {
    const linked: User[] = [];
    const failed: { code: string; reason: string }[] = [];

    for (const code of studentCodes) {
      try {
        const student = await this.linkParent(parentId, code);
        linked.push(student);
      } catch (error) {
        failed.push({
          code,
          reason: error.message,
        });
      }
    }

    return { linked, failed };
  }

  async getChildren(parentId: number): Promise<User[]> {
    return await this.userRepository.find({
      where: { parentId },
      select: [
        'id',
        'email',
        'fullName',
        'phoneNumber',
        'gender',
        'country',
        'ageGroup',
        'profileImageUrl',
        'studentCode',
        'registrationDate',
      ],
    });
  }

  // ==================== Teacher-Student Linking ====================

  async linkTeacher(teacherId: number, studentId: number): Promise<User> {
    // Find teacher
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
      relations: ['students'],
    });

    if (!teacher) {
      throw new NotFoundException(this.i18n.t('user.TEACHER_NOT_FOUND'));
    }

    // Check if user is a teacher
    if (!teacher.roles.includes('TEACHER' as any)) {
      throw new NotFoundException(this.i18n.t('user.USER_IS_NOT_TEACHER'));
    }

    // Find student
    const student = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(this.i18n.t('user.STUDENT_NOT_FOUND'));
    }

    // Check if student has STUDENT role
    if (!student.roles.includes('STUDENT' as any)) {
      throw new NotFoundException(this.i18n.t('user.USER_IS_NOT_STUDENT'));
    }

    // Check if already linked
    const isAlreadyLinked = teacher.students?.some((s) => s.id === studentId);
    if (isAlreadyLinked) {
      throw new NotFoundException(
        this.i18n.t('user.STUDENT_ALREADY_LINKED_TO_TEACHER'),
      );
    }

    // Link student to teacher
    if (!teacher.students) {
      teacher.students = [];
    }
    teacher.students.push(student);
    await this.userRepository.save(teacher);

    return student;
  }

  async getStudents(teacherId: number): Promise<User[]> {
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
      relations: ['students'],
    });

    if (!teacher) {
      throw new NotFoundException(this.i18n.t('user.TEACHER_NOT_FOUND'));
    }

    return teacher.students || [];
  }
}
