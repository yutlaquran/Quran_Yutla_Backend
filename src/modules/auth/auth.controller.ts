import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/guards/user.decorator';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/requests/login.dto';
import { RefreshTokenDto } from './dto/requests/refresh-token.dto';
import { StudentSignUpDto } from './dto/requests/student-sign-up.dto';
import { Tokens } from './interfaces/tokens.interface';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { VerifyEmailDto } from '../email-verification/dto/verify-email.dto';
import { ResendOtpDto } from './dto/requests/resend-otp.dto';
import { ForgetPasswordDto } from './dto/requests/forget-password.dto';
import { UpdatePasswordDto } from './dto/requests/update-password.dto';
import { ChangePasswordDto } from './dto/requests/change-password.dto';
import { PasswordResetGuard } from '../../common/guards/password-reset.guard';
import { VerifiedEmail } from '../../common/decorators/verified-email.decorator';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @SuccessResponse('auth.LOGIN_SUCCESSFUL')
  async login(@Body() loginDto: LoginDto) {
    const results = await this.authService.login(loginDto);
    return results;
  }

  @Post('sign-up')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 200, description: 'Registration successful' })
  @SuccessResponse('auth.SIGNUP_SUCCESSFUL')
  async signup(@Body() signDto: StudentSignUpDto) {
    const user = await this.authService.signup(signDto);

    await this.emailVerificationService.sendVerificationCode({
      email: user.email,
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    };
  }

  @Get('get-me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @SuccessResponse('auth.USER_INFO_RETRIEVED')
  async getMe(@CurrentUser() user: User) {
    return this.authService.getMe(user.id);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @SuccessResponse('auth.TOKEN_REFRESHED')
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<Tokens> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @SuccessResponse('auth.LOGOUT_SUCCESSFUL')
  async logout(
    @Body() dto: RefreshTokenDto,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.authService.logout(dto.refreshToken, user);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @SuccessResponse('auth.VERIFY_EMAIL_SUCCESSFUL')
  @ApiOperation({
    summary: 'second step to verify email on forget password or signup',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.emailVerificationService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @SuccessResponse('auth.VERIFY_EMAIL_SUCCESSFUL')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.emailVerificationService.sendVerificationCode(resendOtpDto);
  }

  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  @SuccessResponse('auth.VERIFICATION_CODE_SENT')
  @ApiOperation({ summary: 'first step click on Forget password' })
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.emailVerificationService.sendVerificationCode(
      forgetPasswordDto,
      true,
    );
  }

  @Post('update-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PasswordResetGuard) // Add the password reset guard
  @SuccessResponse('auth.UPDATE_PASSWORD_SUCCESSFUL')
  @ApiOperation({
    summary: 'final step to update password',
    description:
      'Requires a valid password reset token in Authorization header',
  })
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @VerifiedEmail() email: string, // Get email from verified token
  ) {
    return this.authService.updatePassword(updatePasswordDto, email);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change user password' })
  @SuccessResponse('auth.PASSWORD_CHANGED_SUCCESSFULLY')
  async changePassword(
    @Body() body: ChangePasswordDto,
    @CurrentUser() user: User,
  ) {
    return this.authService.changePassword(body, user.id);
  }
}
