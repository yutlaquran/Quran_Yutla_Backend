import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../../common/entities/token.entity';
import { AppEnv } from '../../common/enums/app-env.enum';
import { PasswordService } from '../../common/helpers/encryption/password.service';
import { CustomI18nService } from '../../common/services/custom-i18n.service';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { ChangePasswordDto } from './dto/requests/change-password.dto';
import { LoginDto } from './dto/requests/login.dto';
import { StudentSignUpDto } from './dto/requests/student-sign-up.dto';
import { UpdatePasswordDto } from './dto/requests/update-password.dto';
import { Tokens } from './interfaces/tokens.interface';

@Injectable()
export class AuthService {
  private appEnv: AppEnv;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private readonly userService: UserService,
    private readonly emailVerificationService: EmailVerificationService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly i18n: CustomI18nService,
    private readonly passwordService: PasswordService,
  ) {
    this.appEnv = this.configService.getOrThrow<string>('app.env') as AppEnv;
  }

  async signup(signUpDto: StudentSignUpDto) {
    let user = await this.userRepository.findOne({
      where: [
        { email: signUpDto.email },
        { phoneNumber: signUpDto.phoneNumber },
      ],
    });

    if (user) {
      throw new ConflictException(
        this.i18n.t('auth.USER_ALREADY_EXISTS', {
          email: signUpDto.email,
          phoneNumber: signUpDto.phoneNumber,
        }),
      );
    }

    const hashedPassword = await this.passwordService.hash(signUpDto.password);

    const newUser: Partial<User> = {
      email: signUpDto.email,
      phoneNumber: signUpDto.phoneNumber,
      password: hashedPassword,
      fullName: signUpDto.fullName,
      country: signUpDto.country,
      ageGroup: signUpDto.ageGroup,
      gender: signUpDto.gender,
      nationalId: signUpDto.nationalId,
    };

    user = this.userRepository.create(newUser);
    const savedUser = await this.userRepository.save(user);

    await this.setPlayerIdForUser(savedUser, signUpDto.playerId);
    return savedUser;
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :identifier', { identifier: loginDto.identifier })
      .orWhere('user.phoneNumber = :identifier', {
        identifier: loginDto.identifier,
      })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new NotFoundException(this.i18n.t('auth.USER_NOT_FOUND'));
    }
    // Verify the password
    const isPasswordValid = await this.passwordService.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException(this.i18n.t('auth.INVALID_CREDENTIALS'));
    }

    if (!user.isEmailVerified) {
      await this.emailVerificationService.sendVerificationCode(user);
      return {
        isEmailVerified: false,
        email: user.email,
        accessToken: null,
        refreshToken: null,
        token_type: null,
        refresh_expires_in: null,
        expires_in: null,
        roles: user.roles,
      };
    }

    const tokens = await this.generateTokens(user);

    await this.setPlayerIdForUser(user, loginDto.playerId);
  
    return {
      isEmailVerified: user.isEmailVerified,
      email: user.email,
      roles: user.roles,
      ...tokens,
    };
  }

  async generateTokens(user): Promise<Tokens> {
    const payload = {
      id: user.id,
      email: user.email,
    };
    const accessTokenExpiresIn =
      this.configService.getOrThrow<string>('JWT.expiresIn');
    const refreshTokenExpiresIn = this.configService.getOrThrow<string>(
      'JWT.refreshTokenExpiresIn',
    );
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
      secret: this.configService.getOrThrow('JWT.secret'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiresIn,
      secret: this.configService.getOrThrow<string>('JWT.refreshTokenSecret'),
    });

    // Parse expiration properly (e.g., "30d", "7d", "24h")
    const parseExpiration = (expStr: string): number => {
      const match = expStr.match(/^(\d+)([dhms])$/);
      if (!match) throw new Error(`Invalid expiration format: ${expStr}`);

      const value = parseInt(match[1]);
      const unit = match[2];

      const multipliers = {
        d: 24 * 60 * 60 * 1000, // days
        h: 60 * 60 * 1000, // hours
        m: 60 * 1000, // minutes
        s: 1000, // seconds
      };

      return value * multipliers[unit];
    };

    await this.tokenRepository.save({
      token: refreshToken,
      expiresAt: new Date(Date.now() + parseExpiration(refreshTokenExpiresIn)),
      user,
    });

    return {
      accessToken,
      refreshToken,
      token_type: 'Bearer',
      refresh_expires_in: refreshTokenExpiresIn,
      expires_in: accessTokenExpiresIn,
    };
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.getOrThrow<string>('JWT.refreshTokenSecret'),
    });

    const token = await this.tokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!token) {
      throw new NotFoundException(this.i18n.t('auth.REFRESH_TOKEN_NOT_FOUND'));
    }

    await this.tokenRepository.delete({
      token: refreshToken,
    });
    return this.generateTokens(token.user);
  }

  async logout(refreshToken: string, currentUser: User): Promise<void> {
    await this.tokenRepository.delete({ token: refreshToken });

    const user = await this.userRepository.findOne({
      where: { id: currentUser?.id },
    });
    if (user) {
      await this.userRepository.save(user);
    }
  }

  async getMe(id: number) {
    const user = await this.userService.findOne(id);
    return user;
  }

  async updatePassword(updatePasswordDto: UpdatePasswordDto, email: string) {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(this.i18n.t('auth.USER_NOT_FOUND'));
    }

    // Hash the new password
    const hashedPassword = await this.passwordService.hash(
      updatePasswordDto.newPassword,
    );

    // Update user password
    await this.userRepository.update({ email }, { password: hashedPassword });
  }

  async setPlayerIdForUser(
    user: User,
    playerId: string = 'string',
  ): Promise<User> {
    // Initialize playerIds array if it doesn't exist
    if (!user.playerIds) {
      user.playerIds = [];
    }

    // Remove the playerId if it already exists (to avoid duplicates)
    user.playerIds = user.playerIds.filter((id) => id !== playerId);
    user.playerIds = user.playerIds.filter((id) => id !== playerId);

    // Add the new playerId to the beginning of the array
    user.playerIds.unshift(playerId);

    // Ensure we only keep the 3 most recent player IDs
    if (user.playerIds.length > 3) {
      user.playerIds = user.playerIds.slice(0, 3);
    }

    // Save the updated user
    return await this.userRepository.save(user);
  }

  async changePassword(body: ChangePasswordDto, userId: number): Promise<void> {
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!currentUser) {
      throw new NotFoundException(this.i18n.t('auth.USER_NOT_FOUND'));
    }

    const isCurrentPasswordValid = await this.passwordService.compare(
      body.currentPassword,
      currentUser.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException(this.i18n.t('auth.PASSWORD_INCORRECT'));
    }

    if (body.newPassword !== body.confirmNewPassword) {
      throw new ConflictException(this.i18n.t('auth.PASSWORDS_DO_NOT_MATCH'));
    }

    const isNewPasswordSameAsOld = await this.passwordService.compare(
      body.newPassword,
      currentUser.password,
    );

    if (isNewPasswordSameAsOld) {
      throw new ConflictException(this.i18n.t('auth.NEW_PASSWORD_SAME_AS_OLD'));
    }

    const newPasswordHash = await this.passwordService.hash(body.newPassword);
    currentUser.password = newPasswordHash;

    await this.userRepository.save(currentUser);
  }
}
