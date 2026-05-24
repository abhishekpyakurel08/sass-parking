import type { Request, Response, NextFunction } from 'express';
import { HourlyRate } from '../models/hourlyRate.model.js';
import { ConflictError, NotFoundError } from '../errors/ApiError.js';

// POST /api/v1/rates
export const createRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { vehicle_type, rate_per_hour } = req.body;

    const existing = await HourlyRate.findOne({ tenant_id: tenantId, vehicle_type });
    if (existing) return next(new ConflictError(`Rate for ${vehicle_type} already exists. Use PATCH to update.`));

    const rate = await HourlyRate.create({ tenant_id: tenantId, vehicle_type, rate_per_hour });
    res.status(201).json({ success: true, data: rate });
  } catch (err) { next(err); }
};

// GET /api/v1/rates
export const getRates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rates = await HourlyRate.find({ tenant_id: req.tenant!.tenantId }).lean();
    res.status(200).json({ success: true, data: rates });
  } catch (err) { next(err); }
};

// PATCH /api/v1/rates/:id
export const updateRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const rate = await HourlyRate.findOneAndUpdate(
      { _id: req.params.id, tenant_id: tenantId },
      { $set: { rate_per_hour: req.body.rate_per_hour } },
      { new: true, runValidators: true }
    );
    if (!rate) return next(new NotFoundError('Rate not found'));
    res.status(200).json({ success: true, data: rate });
  } catch (err) { next(err); }
};
