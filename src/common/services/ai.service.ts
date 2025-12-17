import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface AIEvaluationRequest {
  audioUrl: string;
  surahNumber: number;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  ayahsText?: string[];
  userId: number;
  recitationId: number;
  webhookUrl: string;
  webhookSecret: string;
}

export interface AIEvaluationResponse {
  status: 'processing' | 'error';
  jobId?: string;
  estimatedTime?: number;
  message?: string;
  code?: string;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly serviceUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.serviceUrl = this.configService.get<string>('ai.serviceUrl') || 'http://localhost:5000';
    this.apiKey = this.configService.get<string>('ai.apiKey') || '';
    this.timeout = this.configService.get<number>('ai.timeout') || 30000;

    if (!this.serviceUrl || !this.apiKey) {
      this.logger.warn(
        'AI Service is not properly configured. Please set AI_SERVICE_URL and AI_API_KEY in environment variables.',
      );
    }
  }

  /**
   * Submit audio file for AI evaluation
   * This method sends the recitation to AI service and returns jobId for async processing
   */
  async submitForEvaluation(
    request: AIEvaluationRequest,
  ): Promise<AIEvaluationResponse> {
    try {
      this.logger.log(
        `Submitting recitation ${request.recitationId} to AI service for evaluation`,
      );

      const response = await firstValueFrom(
        this.httpService.post<AIEvaluationResponse>(
          `${this.serviceUrl}/api/evaluate`,
          request,
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: this.timeout,
          },
        ),
      );

      this.logger.log(
        `AI service accepted recitation ${request.recitationId} with jobId: ${response.data.jobId}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to submit recitation ${request.recitationId} to AI service`,
        error.stack,
      );

      // Return error response
      return {
        status: 'error',
        message: error.response?.data?.message || error.message,
        code: error.response?.data?.code || 'AI_SERVICE_ERROR',
      };
    }
  }
}
