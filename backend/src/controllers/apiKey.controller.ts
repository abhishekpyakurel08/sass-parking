import type { Request, Response, NextFunction } from 'express';
import { ApiKey, generateApiKeyValues } from '../models/apiKey.model.js';
import { NotFoundError } from '../errors/ApiError.js';

export const createApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { name } = req.body;

    const { rawKey, prefix, keyHash } = generateApiKeyValues();

    const apiKey = await ApiKey.create({
      tenantId,
      name: name || 'Default API Key',
      prefix,
      keyHash,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: {
        id: apiKey._id,
        name: apiKey.name,
        prefix: apiKey.prefix,
        rawKey,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getApiKeys = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const keys = await ApiKey.find({ tenantId }).select('-keyHash').lean();
    res.status(200).json({ success: true, data: keys });
  } catch (err) {
    next(err);
  }
};

export const updateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { id } = req.params;
    const { name, isActive } = req.body;

    const apiKey = await ApiKey.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { name, isActive } },
      { new: true, runValidators: true }
    ).select('-keyHash').lean();

    if (!apiKey) {
      return next(new NotFoundError('API Key not found'));
    }

    res.status(200).json({ success: true, data: apiKey });
  } catch (err) {
    next(err);
  }
};

export const deleteApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { id } = req.params;

    const apiKey = await ApiKey.findOneAndDelete({ _id: id, tenantId });
    if (!apiKey) {
      return next(new NotFoundError('API Key not found'));
    }

    res.status(200).json({ success: true, message: 'API Key deleted successfully' });
  } catch (err) {
    next(err);
  }
};
