import 'dotenv/config';
import crypto from 'crypto';

// Polyfill crypto globally for Node.js 20+ ES modules
if (!global.crypto) {
  (global as any).crypto = crypto;
}

import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { mongoSanitize } from './middleware/mongoSanitize.js';
import hpp from 'hpp';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { connectDB } from './DB/config.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { startCronJobs } from './utils/cron.js';

import authRoutes     from './routes/auth.route.js';
import userRoutes     from './routes/user.route.js';
import tenantRoutes   from './routes/tenant.route.js';
import parkingRoutes  from './routes/parking.route.js';
import ratesRoutes    from './routes/rates.route.js';
import analyticsRoutes from './routes/analytics.route.js';
import operatorRoutes  from './routes/operator.routes.js';
import customerRoutes  from './routes/customer.route.js';
import auditLogRoutes  from './routes/auditLog.route.js';
import syncRoutes      from './routes/sync.route.js';
import apiKeyRoutes    from './routes/apiKey.route.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app: Application = express();

app.use(helmet());

const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^https?:\/\/[a-z0-9-]+\.tecobit\.cloud$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts — try again in 15 minutes' },
  skipSuccessfulRequests: true,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please slow down' },
});

const posLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const auth = req.headers.authorization ?? '';
    if (auth.startsWith('Bearer pk_')) {
      return `apikey:${auth.substring(10, 26)}`;
    }
    return req.ip ?? 'unknown';
  },
  message: { success: false, message: 'POS rate limit exceeded — please slow down' },
});

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(mongoSanitize);     
app.use(hpp());               
app.use(compression());       

app.use(morgan('combined', {
  stream: { write: (msg: string) => logger.info(msg.trim()) },
  skip: (_req, res) => res.statusCode < 400 && env.isProd,
}));

const swaggerDocument = YAML.load(path.join(__dirname, 'config/swagger.yaml'));
app.use(
  '/api-docs',
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        fontSrc:     ["'self'", 'data:'],
        imgSrc:      ["'self'", 'data:', 'https:'],
        connectSrc:  ["'self'"],
      },
    },
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'ParkSaaS Pro API',
    customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
  })
);

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ParkSaaS Pro API',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/health'
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'ParkSaaS Pro API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

app.use('/api/v1/auth',      authLimiter, authRoutes);
app.use('/api/v1/user',      authLimiter, userRoutes);
app.use('/api/v1/tenants',   apiLimiter,  tenantRoutes);
app.use('/api/v1/parking',   posLimiter,  parkingRoutes);
app.use('/api/v1/rates',     apiLimiter,  ratesRoutes);
app.use('/api/v1/customers', apiLimiter,  customerRoutes);
app.use('/api/v1/analytics', apiLimiter,  analyticsRoutes);
app.use('/api/v1/audit-logs', apiLimiter, auditLogRoutes);
app.use('/api/v1/sync',      posLimiter,  syncRoutes);
app.use('/api/v1/api-keys',  apiLimiter,  apiKeyRoutes);
app.use('/api/v1',           posLimiter,  operatorRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(` Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
    server.close(() => process.exit(1));
  });
};

startCronJobs();
startServer();

export default app;