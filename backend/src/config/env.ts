import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  ACCESS_TOKEN_EXPIRES: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().default('12'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  INITIAL_SUPERADMIN_EMAIL: z.string().email().optional(),
  INITIAL_SUPERADMIN_PASSWORD: z.string().min(8).optional(),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:\n', parsed.error.format());
  process.exit(1);
}

let mongoUri = parsed.data.MONGODB_URI;
if (!/^mongodb(?:\+srv)?:\/\//i.test(mongoUri)) {
  mongoUri = `mongodb://${mongoUri}`;
}

export const env = {
  PORT: parseInt(parsed.data.PORT, 10),
  NODE_ENV: parsed.data.NODE_ENV,
  MONGODB_URI: mongoUri,
  REDIS_URL: parsed.data.REDIS_URL,
  JWT_ACCESS_SECRET: parsed.data.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: parsed.data.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES: parsed.data.ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES: parsed.data.REFRESH_TOKEN_EXPIRES,
  BCRYPT_ROUNDS: parseInt(parsed.data.BCRYPT_ROUNDS, 10),
  CORS_ORIGIN: parsed.data.CORS_ORIGIN,
  INITIAL_SUPERADMIN_EMAIL: parsed.data.INITIAL_SUPERADMIN_EMAIL,
  INITIAL_SUPERADMIN_PASSWORD: parsed.data.INITIAL_SUPERADMIN_PASSWORD,
  RESEND_API_KEY: parsed.data.RESEND_API_KEY,
  FRONTEND_URL: parsed.data.FRONTEND_URL,
  isProd: parsed.data.NODE_ENV === 'production',
} as const;
