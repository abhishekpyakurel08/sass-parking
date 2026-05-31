import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, '../../logs');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `${timestamp}  [${level}]: ${message}\n${stack}`
      : `${timestamp}  [${level}]: ${message}`;
  })
);

const fileFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    new winston.transports.Console({ format: consoleFormat }),

    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: path.join(LOG_DIR, 'access.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),

    new winston.transports.File({
      filename: path.join(LOG_DIR, 'security.log'),
      level: 'warn',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: path.join(LOG_DIR, 'transactions.log'),
      format: fileFormat,
      maxsize: 20 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

export const logTransaction = (event: string, meta: Record<string, unknown>): void => {
  logger.info(`[TRANSACTION] ${event}`, meta);
};

export const logSecurity = (event: string, meta: Record<string, unknown>): void => {
  logger.warn(`[SECURITY] ${event}`, meta);
};
