import 'dotenv/config';
import crypto from 'crypto';

if (!globalThis.crypto) {
  (globalThis as typeof globalThis & { crypto: typeof crypto }).crypto = crypto;
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
import mongoose from 'mongoose';

import { env } from './config/env.js';
import { connectDB } from './DB/config.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { startCronJobs } from './utils/cron.js';
import { redis } from './config/redis.js';

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
import brandingRoutes  from './routes/branding.route.js';

const app: Application = express();

// When running behind a reverse proxy (nginx, caddy, cloud load balancer)
// trust the first proxy so Express reads the original `Host`, `X-Forwarded-*` headers and `req.ip` correctly.
app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, server-to-server)
    if (!origin) return callback(null, true);

    // Allow configured origins (including wildcard patterns)
    for (const allowedOrigin of allowedOrigins) {
      // Wildcard pattern for multi-tenant subdomains
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '[a-z0-9-]+');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(origin)) return callback(null, true);
      }
      // Exact match
      else if (allowedOrigin === origin) {
        return callback(null, true);
      }
    }

    // Allow tecobit preview subdomains (production pattern)
    if (/^https?:\/\/[a-z0-9-]+\.tecobit\.cloud$/.test(origin)) return callback(null, true);

    // During development, allow localhost / 127.0.0.1 on any port (helps Vite dev frontends)
    if (env.NODE_ENV === 'development') {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      // Allow *.localhost for multi-tenant local development
      if (/^https?:\/\/[a-z0-9-]+\.localhost:\d+$/.test(origin)) return callback(null, true);
    }

    // Otherwise reject
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // Allow tenant slug header for API/dev fallback
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Tenant-Slug'],
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts — try again in 15 minutes' },
  skipSuccessfulRequests: true,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please slow down' },
});

const posLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
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

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ParkSaaS Pro API',
    version: '1.0.0',
    health: '/health'
  });
});

app.get('/health', async (_req: Request, res: Response) => {
  const dbPing = await mongoose.connection.db?.command({ ping: 1 }).then(() => 'ok').catch(() => 'error');
  const redisPing = await redis.ping().then(() => 'ok').catch(() => 'error');

  const healthy = dbPing === 'ok';
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    services: { database: dbPing, cache: redisPing },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

app.use('/api/v1/auth',      authLimiter, authRoutes);
app.use('/api/v1/user',      userRoutes); // Removed authLimiter to allow public onboard endpoint
app.use('/api/v1/tenants',   apiLimiter,  tenantRoutes);
app.use('/api/v1/parking',   posLimiter,  parkingRoutes);
app.use('/api/v1/rates',     apiLimiter,  ratesRoutes);
app.use('/api/v1/customers', apiLimiter,  customerRoutes);
app.use('/api/v1/branding',  apiLimiter,  brandingRoutes);
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