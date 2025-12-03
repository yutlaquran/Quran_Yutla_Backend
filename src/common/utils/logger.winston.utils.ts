import * as fs from 'fs';
import * as path from 'path';
import { createLogger, format, transports, Logger } from 'winston';

const logDir: string = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const arrayFormat = format((info) => {
  const logFile = path.join(logDir, 'errors.json');
  const historyFile = path.join(logDir, `errors-${Date.now()}.json`);
  let logs: any[] = [];

  // Read existing logs if file exists
  if (fs.existsSync(logFile)) {
    const fileContent = fs.readFileSync(logFile, 'utf8');
    logs = fileContent ? JSON.parse(fileContent) : [];
  }

  // Add new log
  logs.push(info);

  if (logs.length >= 100) {
    // Move current logs to history file
    fs.writeFileSync(historyFile, JSON.stringify(logs, null, 2));
    // Reset logs array to start new file
    logs = [info];
  }

  // Write to current log file
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

  return info;
});

const winstonLogger: Logger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json(),
    arrayFormat(),
  ),
  transports: [new transports.Console()],
});

export default winstonLogger;
