import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import * as authService from '../services/auth.service.js';

export async function login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.', errorCode: 'MISSING_CREDENTIALS' });
      return;
    }
    const ip = req.ip || req.socket.remoteAddress;
    const result = await authService.loginUser(email, password, ip);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized', errorCode: 'UNAUTHORIZED' });
      return;
    }
    const profile = await authService.getCurrentUserProfile(req.user.id);
    res.json({ success: true, user: profile });
  } catch (error) {
    next(error);
  }
}
