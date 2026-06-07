import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Customer } from '../models/customer.model.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors/ApiError.js';
import { CustomerStatus } from '../types/enums.js';
import { generateQrCodeDataUri } from '../utils/qr.js';

export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { name, customer_code, email, phone_number, discount_percentage } = req.body;

    const [existingByCode, existingByEmail, existingByPhone] = await Promise.all([
      Customer.findOne({ tenant_id: tenantId, customer_code }),
      email ? Customer.findOne({ tenant_id: tenantId, email }) : null,
      phone_number ? Customer.findOne({ tenant_id: tenantId, phone_number }) : null,
    ]);

    if (existingByCode) return next(new ConflictError('Customer with this code already exists.'));
    if (existingByEmail) return next(new ConflictError('Customer with this email already exists.'));
    if (existingByPhone) return next(new ConflictError('Customer with this phone number already exists.'));

    const customer = await Customer.create({
      tenant_id: tenantId,
      name,
      customer_code,
      email,
      phone_number,
      discount_percentage,
      status: CustomerStatus.ACTIVE,
      qr_data: customer_code,
    });

    res.status(201).json({ success: true, data: customer });
  } catch (err) { next(err); }
};

export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { search, status } = req.query;

    const filter: Record<string, unknown> = { tenant_id: tenantId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { customer_code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone_number: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      if (!Object.values(CustomerStatus).includes(status as CustomerStatus)) {
        return next(new ValidationError('Invalid status value'));
      }
      filter.status = status;
    }

    const customers = await Customer.find(filter).sort({ name: 1 }).lean();
    res.status(200).json({ success: true, data: customers });
  } catch (err) { next(err); }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(new ValidationError('Invalid customer ID'));
    }

    const customer = await Customer.findOne({ _id: id, tenant_id: tenantId }).lean();
    if (!customer) return next(new NotFoundError('Customer not found'));

    res.status(200).json({ success: true, data: customer });
  } catch (err) { next(err); }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return next(new ValidationError('Invalid customer ID'));
    }

    const allowedUpdates = ['name', 'email', 'phone_number', 'discount_percentage'];
    const filteredUpdates: Record<string, unknown> = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: id, tenant_id: tenantId },
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).lean();
    if (!customer) return next(new NotFoundError('Customer not found'));

    res.status(200).json({ success: true, data: customer });
  } catch (err) { next(err); }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(new ValidationError('Invalid customer ID'));
    }

    const customer = await Customer.findOneAndDelete({ _id: id, tenant_id: tenantId });
    if (!customer) return next(new NotFoundError('Customer not found'));

    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) { next(err); }
};

export const regenerateCustomerQr = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(new ValidationError('Invalid customer ID'));
    }

    const customer = await Customer.findOne({ _id: id, tenant_id: tenantId });
    if (!customer) return next(new NotFoundError('Customer not found'));

    if (!customer.customer_code) return next(new ValidationError('Customer does not have a customer code to generate QR from.'));

    const newQrCodeDataUrl = await generateQrCodeDataUri(customer.customer_code);

    customer.qr_data = customer.customer_code;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer QR code regenerated.',
      data: { customer_id: customer._id, customer_code: customer.customer_code, qr_code_url: newQrCodeDataUrl },
    });
  } catch (err) { next(err); }
};
