import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import * as reportService from '../services/report.service.js';

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await reportService.getDashboardMetrics(req.user!);
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
}

export async function getVendorMasterReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await reportService.getVendorMasterReport();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getContractReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await reportService.getContractReport();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getPerformanceReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await reportService.getPerformanceReport();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
