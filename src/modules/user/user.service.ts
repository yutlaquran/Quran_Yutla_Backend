import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomI18nService } from 'src/common/services/custom-i18n.service';
import { PaginationService } from 'src/common/utils/pagination.utils';
import { Repository } from 'typeorm';
import { EmailVerification } from '../email-verification/entities/email-verification.entity';
import { NotificationRecipient } from '../notification/entities/notification-recipient.entity';
import { UserQueryDto } from './dto/requests/find-user-query.dto';
import { UpdateUserServiceDto } from './dto/requests/update-user-service.dto';
import { User } from './entities/user.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { UserStatus } from './enums/user-status.enum';

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
    let { keyword, email, role, phoneNumber, fullName, status } = query;

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
        'user.status',
        'user.suspendedAt',
        'user.suspendedReason',
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

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
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
        'status',
        'suspendedAt',
        'suspendedReason',
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
    if (!student.roles.includes(RolesEnum.STUDENT)) {
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

  /**
   * Link a student to a teacher by the student's 6-digit code.
   *
   * The code rather than the row id, matching how parents link children: a
   * teacher can read a code off the learner's screen, while an internal id is
   * neither visible to them nor safe to guess at.
   */
  async linkTeacher(teacherId: number, studentCode: string): Promise<User> {
    // Find teacher
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
      relations: ['students'],
    });

    if (!teacher) {
      throw new NotFoundException(this.i18n.t('user.TEACHER_NOT_FOUND'));
    }

    // Check if user is a teacher
    if (!teacher.roles.includes(RolesEnum.TEACHER)) {
      throw new NotFoundException(this.i18n.t('user.USER_IS_NOT_TEACHER'));
    }

    // Find student by code
    const student = await this.userRepository.findOne({
      where: { studentCode },
    });

    if (!student) {
      throw new NotFoundException(this.i18n.t('user.STUDENT_CODE_NOT_FOUND'));
    }

    // Check if student has STUDENT role
    if (!student.roles.includes(RolesEnum.STUDENT)) {
      throw new NotFoundException(this.i18n.t('user.USER_IS_NOT_STUDENT'));
    }

    // Check if already linked
    const isAlreadyLinked = teacher.students?.some((s) => s.id === student.id);
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

  async suspendUser(
    adminId: number,
    userId: number,
    reason?: string,
  ): Promise<User> {
    if (adminId === userId) {
      throw new BadRequestException(
        this.i18n.t('user.CANNOT_SUSPEND_SELF'),
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(this.i18n.t('user.USER_NOT_FOUND'));
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException(
        this.i18n.t('user.USER_ALREADY_SUSPENDED'),
      );
    }

    user.status = UserStatus.SUSPENDED;
    user.suspendedAt = new Date();
    user.suspendedReason = reason ?? null;
    user.suspendedByAdminId = adminId;

    return this.userRepository.save(user);
  }

  async activateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(this.i18n.t('user.USER_NOT_FOUND'));
    }

    if (user.status !== UserStatus.SUSPENDED) {
      throw new BadRequestException(
        this.i18n.t('user.USER_NOT_SUSPENDED'),
      );
    }

    user.status = UserStatus.ACTIVE;
    user.suspendedAt = null;
    user.suspendedReason = null;
    user.suspendedByAdminId = null;

    return this.userRepository.save(user);
  }

  async permanentlyDeleteUser(adminId: number, userId: number): Promise<void> {
    if (adminId === userId) {
      throw new BadRequestException(
        this.i18n.t('user.CANNOT_DELETE_SELF'),
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(this.i18n.t('user.USER_NOT_FOUND'));
    }

    await this.userRepository.manager.transaction(async (manager) => {
      await manager.delete(EmailVerification, { userId });
      await manager
        .createQueryBuilder()
        .delete()
        .from(NotificationRecipient)
        .where('"userId" = :userId', { userId })
        .execute();
      await manager.query(
        'DELETE FROM "teacher_students" WHERE "teacher_id" = $1 OR "student_id" = $1',
        [userId],
      );
      await manager.update(User, { parentId: userId }, { parentId: null });
      await manager.delete(User, userId);
    });
  }

  async getUserStatistics() {
    const totalUsers = await this.userRepository.count();

    const roleCountsRaw = await this.userRepository.manager.query(`
      SELECT role, COUNT(*)::int as count
      FROM (
        SELECT unnest(roles) AS role
        FROM users
        WHERE roles IS NOT NULL AND array_length(roles, 1) > 0
      ) AS role_list
      GROUP BY role
    `);

    const statusCountsRaw = await this.userRepository
      .createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.status')
      .getRawMany();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newRegistrationsLast30Days = await this.userRepository
      .createQueryBuilder('user')
      .where('user.registration_date >= :from', { from: thirtyDaysAgo })
      .getCount();

    const roleCounts: Record<string, number> = Object.values(RolesEnum).reduce(
      (acc, role) => ({ ...acc, [role]: 0 }),
      {},
    );

    roleCountsRaw.forEach((row: { role: string; count: number }) => {
      if (row.role) {
        roleCounts[row.role] = Number(row.count);
      }
    });

    const statusCounts: Record<string, number> = Object.values(UserStatus).reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {},
    );

    statusCountsRaw.forEach((row) => {
      if (row.status) {
        statusCounts[row.status] = Number(row.count);
      }
    });

    return {
      totalUsers,
      roleBreakdown: roleCounts,
      statusBreakdown: statusCounts,
      newRegistrationsLast30Days,
      suspendedUsers: statusCounts[UserStatus.SUSPENDED] || 0,
      activeUsers: statusCounts[UserStatus.ACTIVE] || 0,
    };
  }
}
