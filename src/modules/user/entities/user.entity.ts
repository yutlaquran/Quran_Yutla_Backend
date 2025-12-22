import { IsEmail, MaxLength } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Token } from '../../../common/entities/token.entity';
import { RolesEnum } from '../../../common/enums/roles.enum';
import { CountryEnum } from '../../../common/enums/country.enum';
import { Notification } from '../../notification/entities/notification.entity';
import { Gender } from '../enums/gender.enum';
import { AgeGroup } from '../enums/age-group.enum';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email cannot be longer than 255 characters' })
  email: string;

  @Column({
    name: 'password',
    select: false,
    nullable: true,
  })
  @MaxLength(100, { message: 'Password cannot be longer than 100 characters' })
  password: string;

  @Column({ name: 'full_name', nullable: true })
  @MaxLength(100, { message: 'Full name cannot be longer than 100 characters' })
  fullName: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({
    type: 'enum',
    enum: CountryEnum,
    nullable: true,
  })
  country: CountryEnum;

  @Column({
    type: 'enum',
    enum: AgeGroup,
    nullable: true,
    name: 'age_group',
  })
  ageGroup: AgeGroup;

  @Column({ name: 'phone_number', nullable: true })
  @MaxLength(20, {
    message: 'Phone number cannot be longer than 20 characters',
  })
  phoneNumber: string;

  @CreateDateColumn({
    name: 'registration_date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  registrationDate: Date;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({
    type: 'enum',
    enum: RolesEnum,
    array: true,
    default: [],
    nullable: false,
  })
  roles: RolesEnum[];

  @Column({
    name: 'profile_image_url',
    nullable: true,
    transformer: {
      to: (value: string) => value,
      from: (value: string) => {
        const baseUrl = process.env.OVH_BASE_URL || 'https://yourbaseurl.com';
        if (!value) return value;
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value.replace(/^(http:\/\/|https:\/\/)[^\/]+/, baseUrl);
        }
        return `${baseUrl}${value}`;
      },
    },
  })
  profileImageUrl: string;

  @Column({
    name: 'date_of_birth',
    nullable: true,
  })
  dateOfBirth: Date;

  @OneToMany(() => Token, (token) => token.user, {
    cascade: true,
  })
  tokens: Token[];

  @OneToMany(() => Notification, (Notification) => Notification.recipients)
  notifications: Notification[];

  @Column({ type: 'jsonb', nullable: true })
  playerIds?: string[];

  @Column({
    name: 'student_code',
    unique: true,
    nullable: true,
    length: 6,
  })
  studentCode: string;

  @Column({
    name: 'number_of_children',
    type: 'integer',
    nullable: true,
  })
  numberOfChildren: number;

  // ==================== Relations ====================

  // Parent-Children relation (one parent can have many children)
  @ManyToOne(() => User, (user) => user.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @Column({ name: 'parent_id', nullable: true })
  parentId: number;

  @OneToMany(() => User, (user) => user.parent)
  children: User[];

  // Teacher-Student relation (many-to-many)
  @ManyToMany(() => User, (user) => user.students)
  @JoinTable({
    name: 'teacher_students',
    joinColumn: { name: 'teacher_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'student_id', referencedColumnName: 'id' },
  })
  teachers: User[];

  @ManyToMany(() => User, (user) => user.teachers)
  students: User[];
}
