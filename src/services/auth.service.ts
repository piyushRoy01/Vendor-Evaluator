import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { ENV } from '../config/env.js';
import { recordAuditLog } from './audit.service.js';

export async function loginUser(email: string, password: string, ipAddress?: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      adminProfile: true,
      eicMaster: true,
      vendorMaster: true
    }
  });

  if (!user) {
    throw { statusCode: 401, message: 'Invalid email address or credentials.', errorCode: 'AUTH_FAILED' };
  }

  if (!user.isActive) {
    throw { statusCode: 403, message: 'Account is deactivated. Contact enterprise administrator.', errorCode: 'ACCOUNT_DEACTIVATED' };
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid email address or credentials.', errorCode: 'AUTH_FAILED' };
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN as any });

  await recordAuditLog({
    userId: user.id,
    userRole: user.role,
    userEmail: user.email,
    action: 'USER_LOGIN',
    entityType: 'USER',
    entityId: user.id,
    ipAddress
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      profile: user.adminProfile || user.eicMaster || user.vendorMaster
    }
  };
}

export async function getCurrentUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      adminProfile: true,
      eicMaster: {
        include: {
          _count: {
            select: { contracts: true, evaluations: true }
          }
        }
      },
      vendorMaster: {
        include: {
          _count: {
            select: { contracts: true, evaluations: true }
          }
        }
      }
    }
  });

  if (!user) {
    throw { statusCode: 404, message: 'User profile not found.', errorCode: 'USER_NOT_FOUND' };
  }

  return user;
}
