import type { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/tenant.model.js';
import { User } from '../models/user.model.js';
import { ApiKey, generateApiKeyValues } from '../models/apiKey.model.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors/ApiError.js';
import { UserRole } from '../types/enums.js';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { invalidateTenant, invalidateApiKeysForUser } from '../utils/cache.js';


export const getAllTenants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page  = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip  = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      Tenant.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Tenant.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: tenants,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

export const createTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, corporate_email, total_capacity } = req.body;

    const existing = await Tenant.findOne({ corporate_email });
    if (existing) return next(new ConflictError(`Tenant with email ${corporate_email} already exists`));

    const tenant = await Tenant.create({ name, corporate_email, total_capacity });
    res.status(201).json({ success: true, data: tenant });
  } catch (err) { next(err); }
};

export const updateTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updates = req.body;

    const tenant = await Tenant.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    if (!tenant) return next(new NotFoundError('Tenant not found'));

    invalidateTenant(id);

    res.status(200).json({ success: true, data: tenant });
  } catch (err) { next(err); }
};


export const deleteTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) return next(new NotFoundError('Tenant not found'));

    await User.updateMany({ tenant_id: id }, { $set: { refresh_token: null } });

    res.status(200).json({ success: true, message: 'Tenant deleted successfully' });
  } catch (err) { next(err); }
};


export const getMyTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenant = await Tenant.findById(req.tenant!.tenantId).lean();
    if (!tenant) return next(new NotFoundError('Tenant not found'));
    res.status(200).json({ success: true, data: tenant });
  } catch (err) { next(err); }
};

export const updateMyTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = req.body;
    delete updates.status;
    delete updates.corporate_email;
    delete updates.total_capacity;

    const tenant = await Tenant.findByIdAndUpdate(
      req.tenant!.tenantId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!tenant) return next(new NotFoundError('Tenant not found'));
    res.status(200).json({ success: true, data: tenant });
  } catch (err) { next(err); }
};



export const createStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, gate_assignment, ticket_prefix } = req.body;
    const tenantId = req.tenant!.tenantId;

    const staffCount = await User.countDocuments({ tenant_id: tenantId, role: UserRole.GATE_STAFF });
    if (staffCount >= 2) {
      return next(new ValidationError('Staff limit reached. Tenants can only create up to 2 staff members.'));
    }

    const existing = await User.findOne({ email });
    if (existing) return next(new ConflictError('User with this email already exists'));

    const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    const staff = await User.create({
      tenant_id: tenantId,
      name,
      email,
      password_hash,
      role: UserRole.GATE_STAFF,
      gate_assignment,
      ticket_prefix: ticket_prefix?.trim() || '',
    });

    const { rawKey, prefix, keyHash } = generateApiKeyValues();
    const apiKey = await ApiKey.create({
      tenantId,
      userId: staff._id,
      name: `Auto: ${name}`,
      prefix,
      keyHash,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: {
        id:             staff._id,
        name:           staff.name,
        email:          staff.email,
        role:           staff.role,
        gate_assignment: staff.gate_assignment,
        ticket_prefix:  staff.ticket_prefix,
      },
      api_key: {
        id:      apiKey._id,
        name:    apiKey.name,
        prefix:  apiKey.prefix,
        raw_key: rawKey,
        note:    'Store this key securely — it will not be shown again.',
      },
    });
  } catch (err) { next(err); }
};


export const getStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const staff = await User.find({ tenant_id: req.tenant!.tenantId, role: UserRole.GATE_STAFF })
      .select('-password_hash -refresh_token')
      .lean();
    res.status(200).json({ success: true, data: staff });
  } catch (err) { next(err); }
};


export const updateStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, password, gate_assignment, ticket_prefix } = req.body;

    const staff = await User.findOne({ _id: id, tenant_id: req.tenant!.tenantId, role: UserRole.GATE_STAFF });
    if (!staff) return next(new NotFoundError('Staff member not found'));

    if (name) staff.name = name;
    if (email && email !== staff.email) {
      const existing = await User.findOne({ email, _id: { $ne: id } });
      if (existing) return next(new ConflictError('A user with this email already exists'));
      staff.email = email;
    }
    if (password) {
      staff.password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    }
    if (gate_assignment) staff.gate_assignment = gate_assignment;
    if (ticket_prefix !== undefined) {
      if (!ticket_prefix || ticket_prefix.trim() === '') {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        staff.ticket_prefix = `P-T-R-${code}`;
      } else {
        staff.ticket_prefix = ticket_prefix;
      }
    }

    await staff.save();

    res.status(200).json({
      success: true,
      data: { id: staff._id, name: staff.name, email: staff.email, role: staff.role, gate_assignment: staff.gate_assignment, ticket_prefix: staff.ticket_prefix },
    });
  } catch (err) { next(err); }
};


export const deleteStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const staff = await User.findOneAndDelete({ _id: id, tenant_id: req.tenant!.tenantId, role: UserRole.GATE_STAFF });
    if (!staff) return next(new NotFoundError('Staff member not found'));

    await ApiKey.deleteMany({ userId: id });
    invalidateApiKeysForUser(id);

    res.status(200).json({ success: true, message: 'Staff member and their API keys deleted successfully' });
  } catch (err) { next(err); }
};


export const regenerateStaffApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenant!.tenantId;

    const staff = await User.findOne({ _id: id, tenant_id: tenantId, role: UserRole.GATE_STAFF });
    if (!staff) return next(new NotFoundError('Staff member not found'));

    await ApiKey.deleteMany({ userId: id, tenantId });
    invalidateApiKeysForUser(id);

    const { rawKey, prefix, keyHash } = generateApiKeyValues();
    const apiKey = await ApiKey.create({
      tenantId,
      userId: staff._id,
      name: `Auto: ${staff.name}`,
      prefix,
      keyHash,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'API key regenerated. Previous keys have been revoked.',
      api_key: {
        id:      apiKey._id,
        name:    apiKey.name,
        prefix:  apiKey.prefix,
        raw_key: rawKey,
        note:    'Store this key securely — it will not be shown again.',
      },
    });
  } catch (err) { next(err); }
};