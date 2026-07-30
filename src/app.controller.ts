import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AppService } from './app.service';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { errorHtml } from './common/errors/error-html';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Only enable the log-dump endpoint when a secret is explicitly configured.
  // No env var => the endpoint is disabled entirely, rather than falling back
  // to a well-known default that exposes request bodies (including passwords).
  private readonly logsSecret = process.env.LOGS_SECRET;

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Liveness probe for Docker / Kubernetes. Intentionally does not touch the
   * database or any external service: it answers "is the process up and able to
   * serve HTTP", so a transient DB blip must not make the orchestrator kill a
   * healthy pod. Unversioned and public by design.
   */
  @Get('health')
  @HttpCode(200)
  @ApiOperation({ summary: 'Liveness probe' })
  health() {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('errors')
  getErrors(
    @Res() res: Response,
    @Query('key') key: string,
    @Query('index') index: string,
  ) {
    // Disabled unless LOGS_SECRET is set — behave as if the route does not exist.
    if (!this.logsSecret) {
      throw new NotFoundException();
    }

    if (key !== this.logsSecret) {
      throw new UnauthorizedException('Invalid key');
    }

    const filePath = path.resolve(process.cwd(), 'logs', 'errors.json');

    if (index === 'html') {
      try {
        // Read and parse the errors.json file
        const errorLogs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Reverse the array to show newest errors first
        const sortedLogs = [...errorLogs].reverse();

        // HTML template with dynamic errorLogs injection
        const html = errorHtml(sortedLogs);

        // Set content-type to HTML and send the response
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      } catch (error) {
        return res
          .status(500)
          .json({ message: 'Error reading log file', error: error.message });
      }
    }

    // Send the raw JSON file if index !== 'html'
    return res.sendFile(filePath, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: 'Error sending log file', error: err.message });
      }
    });
  }
}
