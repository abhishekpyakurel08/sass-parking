import type { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/tenant.model.js';
import { User } from '../models/user.model.js';
import { ConflictError, NotFoundError } from '../errors/ApiError.js';
import { UserRole } from '../types/enums.js';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';


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
    const { id } = req.params;
    const updates = req.body;

    const tenant = await Tenant.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    if (!tenant) return next(new NotFoundError('Tenant not found'));

    res.status(200).json({ success: true, data: tenant });
  } catch (err) { next(err); }
};


export const deleteTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) return next(new NotFoundError('Tenant not found'));

    // Cascade: deactivate all tenant users
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



export const createStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const tenantId = req.tenant!.tenantId;

    const existing = await User.findOne({ email });
    if (existing) return next(new ConflictError('User with this email already exists'));

    const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const staff = await User.create({
      tenant_id: tenantId,
      name,
      email,
      password_hash,
      role: UserRole.GATE_STAFF,
    });

    res.status(201).json({
      success: true,
      data: { id: staff._id, name: staff.name, email: staff.email, role: staff.role },
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