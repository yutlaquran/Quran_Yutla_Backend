import {
  DeleteObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomI18nService } from '../services/custom-i18n.service';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AllowedFileType } from '../enums/allowed-file-type.enum';
const sharp = require('sharp');
@Injectable()
export class FileUploadService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly quality: number;
  private readonly maxSizeLimit: number;
  private readonly maxCsvSizeLimit: number;
  private readonly maxRows: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: CustomI18nService,
  ) {
    this.maxSizeLimit = this.configService.getOrThrow<number>(
      'OvhStorage.fileSizeLimit',
    );
    this.maxCsvSizeLimit = this.configService.getOrThrow<number>(
      'OvhStorage.fileCsvSizeLimit',
    );
    this.maxRows = this.configService.getOrThrow<number>('OvhStorage.maxRows');
    this.s3Client = new S3Client({
      region: this.configService.getOrThrow<string>('OvhStorage.region'),
      endpoint: this.configService.getOrThrow<string>('OvhStorage.endpoint'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>(
          'OvhStorage.accessKey',
        ),
        secretAccessKey: this.configService.getOrThrow<string>(
          'OvhStorage.secretKey',
        ),
      },
      forcePathStyle: true,
    });

    this.bucketName = this.configService.getOrThrow<string>(
      'OvhStorage.bucketName',
    );
    this.quality =
      Number(this.configService.get<number>('IMAGE_QUALITY', 15)) || 60;
  }

  private async uploadToS3(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    uploadFolder: string,
  ): Promise<string> {
    const uploadParams = {
      Bucket: this.bucketName,
      Key: `${uploadFolder}/${fileName}`,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read' as ObjectCannedACL,
      Metadata: {
        'Cache-Control': 'max-age=31536000',
      },
    };

    await this.s3Client.send(new PutObjectCommand(uploadParams));

    return `/${uploadFolder}/${fileName}`;
  }

  async processAndSaveFile(
    file: Express.Multer.File,
    uploadFolder: string,
  ): Promise<{ url: string; filename: string; size: number }> {
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
    const fileUrl = await this.uploadToS3(
      processedBuffer,
      fileName,
      file.mimetype,
      uploadFolder,
    );
    return { url: fileUrl, filename: fileName, size: processedBuffer.length };
  }

  async processAndSaveFiles(
    files: Express.Multer.File[],
    uploadDir: string,
  ): Promise<{ url: string; filename: string }[]> {
    return await Promise.all(
      files.map((file) => this.processAndSaveFile(file, uploadDir)),
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
