import { BaseUserProfileDto } from './user-profile.response.dto';

export class UserResponseDto {
  id: number;

  email: string;

  fullName: string;

  nationalId: string;

  memberShipId: string;

  phoneNumber: string;

  status: string;

  createdAt: Date;

  updatedAt: Date;

  isActive: boolean;

  registrationDate: Date;

  points: number;

  profile: BaseUserProfileDto;
}
