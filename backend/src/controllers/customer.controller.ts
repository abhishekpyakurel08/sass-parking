import type { Request, Response, NextFunction } from 'express';
import { Customer } from '../models/customer.model.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors/ApiError.js';
import { CustomerStatus } from '../types/enums.js';
import { generateQrCodeDataUri } from '../utils/qr.js';
import crypto from 'crypto';

// POST /api/v1/customers
export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { name, customer_code, email, phone_number, discount_percentage } = req.body;

    const existing = await Customer.findOne({ tenant_id: tenantId, $or: [{ customer_code }, { email }, { phone_number }] });
    if (existing) {
      if (existing.customer_code === customer_code) return next(new ConflictError('Customer with this code already exists.'));
      if (email && existing.email === email) return next(new ConflictError('Customer with this email already exists.'));
      if (phone_number && existing.phone_number === phone_number) return next(new ConflictError('Customer with this phone number already exists.'));
    }

    const qr_data = customer_code; // Use customer_code as QR data
    const customer = await Customer.create({
      tenant_id: tenantId,
      name,
      customer_code,
      email,
      phone_number,
      discount_percentage,
      status: CustomerStatus.ACTIVE,
      qr_data,
    });

    res.status(201).json({ success: true, data: customer });
  } catch (err) { next(err); }
};

// GET /api/v1/customers
export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { search, status } = req.query;

    const filter: any = { tenant_id: tenantId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { customer_code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone_number: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;

    const customers = await Customer.find(filter).sort({ name: 1 }).lean();
    res.status(200).json({ success: true, data: customers });
  } catch (err) { next(err); }
};

// GET /api/v1/customers/:id
export const getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { id } = req.params;

    const customer = await Customer.findOne({ _id: id, tenant_id: tenantId }).lean();
    if (!customer) return next(new NotFoundError('Customer not found'));

    res.status(200).json({ success: true, data: customer });
  } catch (err) { next(err); }
};

// PATCH /api/v1/customers/:id
export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { id } = req.params;
    const updates = req.body;

    const customer = await Customer.findOneAndUpdate(
      { _id: id, tenant_id: tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (!customer) return next(new NotFoundError('Customer not found'));

    res.status(200).json({ success: true, data: customer });
  } catch (err) { next(err); }
};

// DELETE /api/v1/customers/:id
export const deleteCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { id } = req.params;

    const customer = await Customer.findOneAndDelete({ _id: id, tenant_id: tenantId });
    if (!customer) return next(new NotFoundError('Customer not found'));

    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) { next(err); }
};

// POST /api/v1/customers/:id/regenerate-qr
export const regenerateCustomerQr = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { id } = req.params;

    const customer = await Customer.findOne({ _id: id, tenant_id: tenantId });
    if (!customer) return next(new NotFoundError('Customer not found'));

    if (!customer.customer_code) return next(new ValidationError('Customer does not have a customer code to generate QR from.'));

    // Re-generate QR code data URL using the existing customer_code
    const newQrCodeDataUrl = await generateQrCodeDataUri(customer.customer_code);

    res.status(200).json({
      success: true,
      message: 'Customer QR code regenerated.',
      data: { customer_id: customer._id, customer_code: customer.customer_code, qr_code_url: newQrCodeDataUrl },
    });
  } catch (err) { next(err); }
};
