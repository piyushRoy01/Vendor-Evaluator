import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export async function listAuditLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.entityType) where.entityType = req.query.entityType;
    if (req.query.action) where.action = req.query.action;
    if (req.query.userEmail) where.userEmail = { contains: String(req.query.userEmail).trim() };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      success: true,
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
}

export async function listNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false }
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: { id: String(req.params.id), userId: req.user!.id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function listCriteria(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const criteria = await prisma.evaluationCriteria.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    const thresholds = await prisma.ratingThreshold.findMany({
      orderBy: { minScore: 'desc' }
    });
    res.json({ success: true, criteria, thresholds });
  } catch (error) {
    next(error);
  }
}

export async function updateCriterion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { weight, description, isActive } = req.body;
    const criterion = await prisma.evaluationCriteria.update({
      where: { id: String(req.params.id) },
      data: {
        weight: weight !== undefined ? Number(weight) : undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined
      }
    });
    res.json({ success: true, criterion });
  } catch (error) {
    next(error);
  }
}
