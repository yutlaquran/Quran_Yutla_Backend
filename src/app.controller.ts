import {
  Controller,
  Get,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AppService } from './app.service';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { errorHtml } from './common/errors/error-html';
import { ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('api')
export class AppController {
  constructor(private readonly appService: AppService) {}
  private readonly SECRET_KEY = process.env.LOGS_SECRET || 'super-secret';

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('errors')
  getErrors(
    @Res() res: Response,
    @Query('key') key: string,
    @Query('index') index: string,
  ) {
    if (key !== this.SECRET_KEY) {
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
