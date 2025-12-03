import { MaritalStatus } from '../../enums/marital-status.enum';
export class BaseUserProfileDto {
  nationality?: string;

  maritalStatus?: MaritalStatus;

  profileImage?: string;

  educationalQualification?: string;

  specializationField?: string;

  currentJob?: string;

  employer?: string;

  previousExperience?: string;

  previousPartyMembership?: boolean;

  previousPartyName?: string;

  previousPartyPeriod?: string;

  communityActivities?: string;

  committeeInterest?: boolean;

  preferredCommittees?: string;

  nationalIdImageFront?: string;

  nationalIdImageBack?: string;

  personalPhoto?: string;

  educationalCertificate?: string;

  additionalDocuments?: string;

  bylawsAgreement?: boolean;

  exclusivityCommitment?: boolean;

  declarationDate?: Date;

  digitalSignature?: string;
}
