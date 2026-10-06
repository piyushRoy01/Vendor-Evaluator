import { prisma } from '../config/database.js';

export interface AuditLogParams {
  userId?: string;
  userRole: string;
  userEmail: string;
  action: string;
  entityType: 'PO_LOA' | 'EVALUATION' | 'VENDOR' | 'EIC' | 'USER' | 'CRITERIA';
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
}

export async function recordAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userRole: params.userRole,
        userEmail: params.userEmail,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        ipAddress: params.ipAddress || null
      }
    });
  } catch (error) {
    console.error('[Audit Log Error]: Failed to write audit log entry', error);
  }
}
