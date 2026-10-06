import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { validateMobile } from '../utils/validators.js';
import { recordAuditLog } from './audit.service.js';
import { AuthenticatedUser } from '../middleware/auth.middleware.js';

export async function listEics(query: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  company?: string;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.company) {
    where.company = { contains: query.company };
  }

  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { employeeId: { contains: s } },
      { name: { contains: s } },
      { email: { contains: s } },
      { company: { contains: s } }
    ];
  }

  const [total, eics] = await Promise.all([
    prisma.eicMaster.count({ where }),
    prisma.eicMaster.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            contracts: true,
            evaluations: true
          }
        },
        contracts: {
          select: {
            id: true,
            poNumber: true,
            contractStatus: true,
            plantCode: true
          }
        },
        evaluations: {
          where: { status: 'APPROVED' },
          select: { percentage: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const sanitized = eics.map(e => {
    const approvedScores = e.evaluations.map(ev => ev.percentage);
    const avgScore = approvedScores.length > 0
      ? Number((approvedScores.reduce((a, b) => a + b, 0) / approvedScores.length).toFixed(2))
      : null;

    return {
      id: e.id,
      userId: e.userId,
      employeeId: e.employeeId,
      name: e.name,
      company: e.company,
      mobile: e.mobile,
      email: e.email,
      status: e.status,
      assignedContractsCount: e._count.contracts,
      completedEvaluationsCount: e._count.evaluations,
      averageEvaluationScore: avgScore,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    };
  });

  return {
    eics: sanitized,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getEicById(eicId: string) {
  const eic = await prisma.eicMaster.findUnique({
    where: { id: eicId },
    include: {
      contracts: {
        include: {
          vendor: { select: { id: true, vendorCode: true, vendorName: true, status: true } },
          evaluations: { select: { id: true, evaluationNumber: true, percentage: true, ratingGrade: true, status: true } }
        },
        orderBy: { poDate: 'desc' }
      },
      evaluations: {
        include: {
          vendor: { select: { id: true, vendorCode: true, vendorName: true } },
          contract: { select: { id: true, poNumber: true, plantCode: true } }
        },
        orderBy: { evaluationDate: 'desc' }
      }
    }
  });

  if (!eic) {
    throw { statusCode: 404, message: 'EIC record not found.', errorCode: 'EIC_NOT_FOUND' };
  }

  // Derive unique assigned vendors
  const assignedVendorsMap = new Map();
  eic.contracts.forEach(c => {
    if (c.vendor && !assignedVendorsMap.has(c.vendor.id)) {
      assignedVendorsMap.set(c.vendor.id, c.vendor);
    }
  });

  const approvedEvals = eic.evaluations.filter(e => e.status === 'APPROVED');
  const avgScore = approvedEvals.length > 0
    ? Number((approvedEvals.reduce((a, b) => a + b.percentage, 0) / approvedEvals.length).toFixed(2))
    : null;

  return {
    ...eic,
    assignedVendors: Array.from(assignedVendorsMap.values()),
    averageEvaluationScore: avgScore,
    totalContracts: eic.contracts.length,
    activeContracts: eic.contracts.filter(c => c.contractStatus === 'ACTIVE' || c.contractStatus === 'NEAR_COMPLETION').length
  };
}

export async function createEic(data: {
  employeeId: string;
  name: string;
  company: string;
  mobile: string;
  email: string;
  initialPassword?: string;
}, adminUser: AuthenticatedUser, ipAddress?: string) {
  if (!validateMobile(data.mobile)) {
    throw { statusCode: 422, message: 'Invalid mobile number. Must be a 10-digit phone number.', errorCode: 'INVALID_MOBILE' };
  }

  const existingEmpId = await prisma.eicMaster.findUnique({ where: { employeeId: data.employeeId.trim().toUpperCase() } });
  if (existingEmpId) {
    throw { statusCode: 409, message: `EIC Employee ID ${data.employeeId} already exists.`, errorCode: 'EMPLOYEE_ID_EXISTS' };
  }

  const existingEmail = await prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
  if (existingEmail) {
    throw { statusCode: 409, message: `Email ${data.email} is already registered.`, errorCode: 'EMAIL_EXISTS' };
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.initialPassword || 'Eic@123', salt);

  const eic = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        passwordHash,
        role: 'EIC'
      }
    });

    const e = await tx.eicMaster.create({
      data: {
        userId: user.id,
        employeeId: data.employeeId.trim().toUpperCase(),
        name: data.name.trim(),
        company: data.company.trim(),
        mobile: data.mobile.trim(),
        email: data.email.trim().toLowerCase(),
        status: 'ACTIVE'
      }
    });

    return e;
  });

  await recordAuditLog({
    userId: adminUser.id,
    userRole: adminUser.role,
    userEmail: adminUser.email,
    action: 'EIC_CREATED',
    entityType: 'EIC',
    entityId: eic.id,
    newValue: { employeeId: eic.employeeId, name: eic.name, company: eic.company },
    ipAddress
  });

  return eic;
}

export async function updateEic(id: string, data: Partial<{
  name: string;
  company: string;
  mobile: string;
  status: string;
}>, adminUser: AuthenticatedUser, ipAddress?: string) {
  const existing = await prisma.eicMaster.findUnique({ where: { id } });
  if (!existing) {
    throw { statusCode: 404, message: 'EIC record not found.', errorCode: 'EIC_NOT_FOUND' };
  }

  if (data.mobile && !validateMobile(data.mobile)) {
    throw { statusCode: 422, message: 'Invalid mobile number.', errorCode: 'INVALID_MOBILE' };
  }

  const updated = await prisma.eicMaster.update({
    where: { id },
    data: {
      name: data.name?.trim() || existing.name,
      company: data.company?.trim() || existing.company,
      mobile: data.mobile?.trim() || existing.mobile,
      status: data.status || existing.status
    }
  });

  await recordAuditLog({
    userId: adminUser.id,
    userRole: adminUser.role,
    userEmail: adminUser.email,
    action: 'EIC_MODIFIED',
    entityType: 'EIC',
    entityId: id,
    oldValue: { name: existing.name, status: existing.status },
    newValue: { name: updated.name, status: updated.status },
    ipAddress
  });

  return updated;
}
