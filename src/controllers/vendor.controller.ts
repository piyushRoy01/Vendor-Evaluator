import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import * as vendorService from '../services/vendor.service.js';

export async function listVendors(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await vendorService.listVendors(req.query, req.user!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getVendor(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendor = await vendorService.getVendorById(String(req.params.id), req.user!);
    res.json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
}

export async function createVendor(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const vendor = await vendorService.createVendor(req.body, req.user!, ip);
    res.status(201).json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
}

export async function updateVendor(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const vendor = await vendorService.updateVendor(String(req.params.id), req.body, req.user!, ip);
    res.json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
}

export async function updateVendorStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'BLACKLISTED', 'SUSPENDED'].includes(status)) {
      res.status(422).json({ success: false, message: 'Invalid vendor status.', errorCode: 'INVALID_STATUS' });
      return;
    }
    const ip = req.ip || req.socket.remoteAddress;
    const vendor = await vendorService.updateVendor(String(req.params.id), { status }, req.user!, ip);
    res.json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
}
