import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { prisma } from '../config/database.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'EIC' | 'VENDOR';
  profileId?: string;
  eicId?: string;
  vendorId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token required.',
      errorCode: 'UNAUTHORIZED'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; email: string; role: 'ADMIN' | 'EIC' | 'VENDOR' };
    
    // Ensure user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        adminProfile: true,
        eicMaster: true,
        vendorMaster: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User account is deactivated or no longer exists.',
        errorCode: 'ACCOUNT_INACTIVE'
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'EIC' | 'VENDOR',
      profileId: user.adminProfile?.id,
      eicId: user.eicMaster?.id,
      vendorId: user.vendorMaster?.id
    };

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      errorCode: 'TOKEN_INVALID'
    });
  }
}

export function requireRole(...allowedRoles: Array<'ADMIN' | 'EIC' | 'VENDOR'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'UNAUTHORIZED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] role privileges.`,
        errorCode: 'FORBIDDEN'
      });
      return;
    }

    next();
  };
}
