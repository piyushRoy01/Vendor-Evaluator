import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import * as eicService from '../services/eic.service.js';

export async function listEics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eicService.listEics(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getEic(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const eic = await eicService.getEicById(String(req.params.id));
    res.json({ success: true, eic });
  } catch (error) {
    next(error);
  }
}

export async function createEic(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const eic = await eicService.createEic(req.body, req.user!, ip);
    res.status(201).json({ success: true, eic });
  } catch (error) {
    next(error);
  }
}

export async function updateEic(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const eic = await eicService.updateEic(String(req.params.id), req.body, req.user!, ip);
    res.json({ success: true, eic });
  } catch (error) {
    next(error);
  }
}
