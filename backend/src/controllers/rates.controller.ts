import type { Request, Response, NextFunction } from 'express';
import { HourlyRate } from '../models/hourlyRate.model.js';
import { ConflictError, NotFoundError } from '../errors/ApiError.js';
import { VehicleType } from '../types/enums.js';

// POST /api/v1/rates
export const createRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { vehicle_type, rate_per_hour, lost_ticket_penalty } = req.body;

    const existingRate = await HourlyRate.findOne({ tenant_id: tenantId, vehicle_type });
    if (existingRate) {
      return next(new ConflictError(`Rate for vehicle type ${vehicle_type} already exists for this tenant.`));
    }

    const newRate = await HourlyRate.create({
      tenant_id: tenantId,
      vehicle_type,
      rate_per_hour,
      lost_ticket_penalty: lost_ticket_penalty ?? 0,
    });

    res.status(201).json({ success: true, data: newRate });
  } catch (err) { next(err); }
};

// GET /api/v1/rates
export const getRates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const rates = await HourlyRate.find({ tenant_id: tenantId }).sort({ vehicle_type: 1 }).lean();
    res.status(200).json({ success: true, data: rates });
  } catch (err) { next(err); }
};

// GET /api/v1/rates/:vehicle_type
export const getRateByVehicleType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { vehicle_type } = req.params;

    if (!Object.values(VehicleType).includes(vehicle_type as VehicleType)) {
      return next(new NotFoundError('Invalid vehicle type specified.'));
    }

    const rate = await HourlyRate.findOne({ tenant_id: tenantId, vehicle_type: vehicle_type as VehicleType }).lean();
    if (!rate) {
      return next(new NotFoundError(`Rate for vehicle type ${vehicle_type} not found.`));
    }

    res.status(200).json({ success: true, data: rate });
  } catch (err) { next(err); }
};

// PATCH /api/v1/rates/:vehicle_type
export const updateRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { vehicle_type } = req.params;
    const { rate_per_hour, lost_ticket_penalty } = req.body;

    if (!Object.values(VehicleType).includes(vehicle_type as VehicleType)) {
      return next(new NotFoundError('Invalid vehicle type specified.'));
    }

    const updatedRate = await HourlyRate.findOneAndUpdate(
      { tenant_id: tenantId, vehicle_type: vehicle_type as VehicleType },
      { $set: { rate_per_hour, lost_ticket_penalty } },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedRate) {
      return next(new NotFoundError(`Rate for vehicle type ${vehicle_type} not found.`));
    }

    res.status(200).json({ success: true, data: updatedRate });
  } catch (err) { next(err); }
};

// DELETE /api/v1/rates/:vehicle_type
export const deleteRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { vehicle_type } = req.params;

    if (!Object.values(VehicleType).includes(vehicle_type as VehicleType)) {
      return next(new NotFoundError('Invalid vehicle type specified.'));
    }

    const deletedRate = await HourlyRate.findOneAndDelete({ tenant_id: tenantId, vehicle_type: vehicle_type as VehicleType });
    if (!deletedRate) {
      return next(new NotFoundError(`Rate for vehicle type ${vehicle_type} not found.`));
    }

    res.status(200).json({ success: true, message: `Rate for vehicle type ${vehicle_type} deleted successfully.` });
  } catch (err) { next(err); }
};
