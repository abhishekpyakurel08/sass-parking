import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { User } from '../models/user.model.js';
import { UserRole } from '../types/enums.js';
import bcrypt from 'bcryptjs';

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅  MongoDB connected: ${mongoose.connection.host}`);

    await seedSuperAdmin();
  } catch (error) {
    logger.error('❌  MongoDB connection failed:', error);
    process.exit(1);
  }
};

const seedSuperAdmin = async (): Promise<void> => {
  if (!env.INITIAL_SUPERADMIN_EMAIL || !env.INITIAL_SUPERADMIN_PASSWORD) return;

  const exists = await User.findOne({ role: UserRole.SUPER_ADMIN });
  if (exists) return;

  const password_hash = await bcrypt.hash(env.INITIAL_SUPERADMIN_PASSWORD, env.BCRYPT_ROUNDS);
  await User.create({
    name: 'Super Admin',
    email: env.INITIAL_SUPERADMIN_EMAIL,
    password_hash,
    role: UserRole.SUPER_ADMIN,
    tenant_id: null,
  });

  logger.info(`🌱  Super Admin seeded: ${env.INITIAL_SUPERADMIN_EMAIL}`);
};