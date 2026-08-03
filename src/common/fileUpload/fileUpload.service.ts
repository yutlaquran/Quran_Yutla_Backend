import {
  DeleteObjectCommand,
  GetObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomI18nService } from '../services/custom-i18n.service';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AllowedFileType } from '../enums/allowed-file-type.enum';
const sharp = require('sharp');

/**
 * `public` objects are readable by anyone holding the URL and are served
 * straight off the CDN. `private` objects are only reachable through a
 * time-limited signed URL — use it for anything belonging to an identifiable
 * user, e.g. a child's recorded recitation.
 */
export type StorageVisibility = 'public' | 'private';

export interface StoredFile {
  /** Bucket-relative path kept in the database, e.g. `/recitations/x.webm`. */
  url: string;
  /** Full object key, e.g. `recitations/x.webm`. Required to delete or sign. */
  key: string;
  filename: string;
  size: number;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly supportsObjectAcl: boolean;
  private readonly signedUrlTtl: number;
  private readonly quality: number;
  private readonly maxSizeLimit: number;
  private readonly maxCsvSizeLimit: number;
  private readonly maxRows: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: CustomI18nService,
  ) {
    this.maxSizeLimit = this.configService.getOrThrow<number>(
      'storage.fileSizeLimit',
    );
    this.maxCsvSizeLimit = this.configService.getOrThrow<number>(
      'storage.fileCsvSizeLimit',
    );
    this.maxRows = this.configService.getOrThrow<number>('storage.maxRows');
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow<string>('storage.region'),
      endpoint: this.configService.getOrThrow<string>('storage.endpoint'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('storage.accessKey'),
        secretAccessKey:
          this.configService.getOrThrow<string>('storage.secretKey'),
      },
      forcePathStyle: true,
    });

    this.bucketName = this.configService.getOrThrow<string>(
      'storage.bucketName',
    );
    this.supportsObjectAcl =
      this.configService.get<boolean>('storage.supportsObjectAcl') ?? true;
    this.signedUrlTtl =
      this.configService.get<number>('storage.signedUrlTtlSeconds') ?? 3600;
    this.quality =
      Number(this.configService.get<number>('IMAGE_QUALITY', 15)) || 60;
  }

  private async uploadToS3(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    uploadFolder: string,
    visibility: StorageVisibility,
  ): Promise<string> {
    const key = `${uploadFolder}/${fileName}`;
    const uploadParams: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Real response header. It used to be set as user metadata, which the
      // CDN/browser never reads, so nothing was actually being cached.
      CacheControl:
        visibility === 'private'
          ? 'private, max-age=3600'
          : 'public, max-age=31536000',
    };

    // Only ever widen access deliberately. R2 has no per-object ACLs at all,
    // so there the bucket itself must stay private and access comes from a
    // signed URL.
    if (visibility === 'public' && this.supportsObjectAcl) {
      uploadParams.ACL = 'public-read' as ObjectCannedACL;
    }

    await this.s3Client.send(new PutObjectCommand(uploadParams));

    return key;
  }

  /**
   * Time-limited download URL for a private object. Returns an empty string
   * rather than throwing: a broken audio link must not take down the whole
   * listing response.
   */
  async getPresignedUrl(
    key: string,
    expiresIn: number = this.signedUrlTtl,
  ): Promise<string> {
    if (!key) return '';

    try {
      return await getSignedUrl(
        this.s3Client,
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key.startsWith('/') ? key.slice(1) : key,
        }),
        { expiresIn },
      );
    } catch (error) {
      this.logger.error(
        `Failed to presign ${key}: ${error.message}`,
        error.stack,
      );
      return '';
    }
  }

  async processAndSaveFile(
    file: Express.Multer.File,
    uploadFolder: string,
    visibility: StorageVisibility = 'public',
  ): Promise<StoredFile> {
    if (!file) {
      throw new BadRequestException(this.i18n.t('file-upload.FILE_REQUIRED'));
    }
    if (file.size > this.maxSizeLimit) {
      throw new BadRequestException(
        this.i18n.t('file-upload.FILE_SIZE_EXCEEDED'),
      );
    }
    const allowedTypes = Object.values(AllowedFileType);
    const fileType = path.extname(file.originalname).toLowerCase().slice(1);

    if (
      !fileType ||
      !Object.values(AllowedFileType).includes(fileType as AllowedFileType)
    ) {
      throw new Error(
        `File type not allowed. Allowed types: ${Object.values(AllowedFileType).join(', ')}`,
      );
    }

    let processedBuffer: Buffer;
    if (['jpg', 'png', 'jpeg'].includes(fileType)) {
      processedBuffer = await sharp(file.buffer)
        .rotate()
        .jpeg({ quality: this.quality })
        .toBuffer();
    } else {
      processedBuffer = file.buffer;
    }
    const fileName = `${uuidv4()}-${file.originalname}`;
    const key = await this.uploadToS3(
      processedBuffer,
      fileName,
      file.mimetype,
      uploadFolder,
      visibility,
    );
    return {
      url: `/${key}`,
      key,
      filename: fileName,
      size: processedBuffer.length,
    };
  }

  async processAndSaveFiles(
    files: Express.Multer.File[],
    uploadDir: string,
    visibility: StorageVisibility = 'public',
  ): Promise<StoredFile[]> {
    return await Promise.all(
      files.map((file) => this.processAndSaveFile(file, uploadDir, visibility)),
    );
  }

  async processCsvFile(
    file: Express.Multer.File,
  ): Promise<{ data: any[]; headers: string[] }> {
    if (!file) {
      throw new BadRequestException(this.i18n.t('file-upload.FILE_REQUIRED'));
    }

    if (file.size > this.maxCsvSizeLimit) {
      throw new BadRequestException(
        this.i18n.t('file-upload.FILE_SIZE_EXCEEDED'),
      );
    }

    const fileType = path.extname(file.originalname).toLowerCase();
    if (fileType !== '.csv') {
      throw new BadRequestException(
        this.i18n.t('file-upload.INVALID_CSV_FORMAT'),
      );
    }

    try {
      const csvContent = file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter((line) => line.trim());

      if (lines.length === 0) {
        throw new BadRequestException(
          this.i18n.t('file-upload.EMPTY_CSV_FILE'),
        );
      }

      if (lines.length > this.maxRows) {
        throw new BadRequestException(
          this.i18n.t('file-upload.CSV_TOO_MANY_ROWS') ||
            `CSV file contains too many rows. Maximum allowed: ${this.maxRows}`,
        );
      }

      // Parse headers and data
      const headers = lines[0].split(',').map((header) => header.trim());
      const data = lines.slice(1).map((line) => {
        const values = line.split(',').map((value) => value.trim());
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || '';
          return obj;
        }, {});
      });

      return { data, headers };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        this.i18n.t('file-upload.CSV_PROCESSING_ERROR'),
      );
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      // Remove leading slash if present
      const key = fileName.startsWith('/') ? fileName.slice(1) : fileName;
      
      const deleteParams = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3Client.send(new DeleteObjectCommand(deleteParams));
    } catch (error) {
      console.error(`Failed to delete file ${fileName} from S3:`, error.message);
      // Don't throw error to avoid blocking the operation
    }
  }
}
