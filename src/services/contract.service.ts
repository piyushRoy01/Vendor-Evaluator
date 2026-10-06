import { prisma } from '../config/database.js';
import { recordAuditLog } from './audit.service.js';
import { AuthenticatedUser } from '../middleware/auth.middleware.js';

export async function listContracts(query: {
  page?: number;
  limit?: number;
  search?: string;
  contractType?: string;
  contractStatus?: string;
  plantCode?: string;
  vendorId?: string;
  eicId?: string;
  nearCompletionOnly?: string;
}, currentUser: AuthenticatedUser) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  // Strict RBAC Scoping
  if (currentUser.role === 'VENDOR') {
    const vendorRecord = await prisma.vendorMaster.findUnique({ where: { userId: currentUser.id } });
    if (!vendorRecord) return { contracts: [], total: 0, page, totalPages: 0 };
    where.vendorId = vendorRecord.id;
  } else if (currentUser.role === 'EIC') {
    const eicRecord = await prisma.eicMaster.findUnique({ where: { userId: currentUser.id } });
    if (!eicRecord) return { contracts: [], total: 0, page, totalPages: 0 };
    where.eicId = eicRecord.id;
  } else {
    // Admin can filter by specific vendor or EIC if requested
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.eicId) where.eicId = query.eicId;
  }

  if (query.contractType) where.contractType = query.contractType;
  if (query.contractStatus) where.contractStatus = query.contractStatus;
  if (query.plantCode) where.plantCode = query.plantCode;

  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { poNumber: { contains: s } },
      { plantCode: { contains: s } },
      { description: { contains: s } }
    ];
  }

  const now = new Date();
  if (query.nearCompletionOnly === 'true') {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    where.completionDate = { gte: now, lte: thirtyDaysFromNow };
    where.contractStatus = { in: ['ACTIVE', 'NEAR_COMPLETION'] };
  }

  const [total, contracts] = await Promise.all([
    prisma.poLoaContract.count({ where }),
    prisma.poLoaContract.findMany({
      where,
      skip,
      take: limit,
      include: {
        vendor: {
          select: {
            id: true,
            vendorCode: true,
            vendorName: true,
            email: true,
            mobile: true,
            status: true
          }
        },
        eic: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            company: true,
            email: true,
            mobile: true
          }
        },
        evaluations: {
          select: {
            id: true,
            evaluationNumber: true,
            percentage: true,
            ratingGrade: true,
            status: true,
            evaluationDate: true
          },
          orderBy: { evaluationDate: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // Compute remaining days and dynamic health indicator
  const mapped = contracts.map(c => {
    const diffTime = new Date(c.completionDate).getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let urgencyLevel = 'NORMAL';
    if (c.contractStatus === 'COMPLETED' || c.contractStatus === 'CANCELLED') {
      urgencyLevel = 'CLOSED';
    } else if (daysRemaining < 0) {
      urgencyLevel = 'OVERDUE';
    } else if (daysRemaining <= 15) {
      urgencyLevel = 'CRITICAL';
    } else if (daysRemaining <= 30) {
      urgencyLevel = 'WARNING';
    }

    return {
      id: c.id,
      poNumber: c.poNumber,
      contractType: c.contractType,
      poDate: c.poDate,
      completionDate: c.completionDate,
      daysRemaining,
      urgencyLevel,
      // Hide full financial values from vendor if needed, but per requirements vendor can view contract details
      poValueWithoutTax: c.poValueWithoutTax,
      poValueWithTax: c.poValueWithTax,
      plantCode: c.plantCode,
      contractStatus: c.contractStatus,
      description: c.description,
      vendor: c.vendor,
      eic: c.eic,
      evaluationsCount: c.evaluations.length,
      latestEvaluation: c.evaluations[0] || null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    };
  });

  return {
    contracts: mapped,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getContractById(contractId: string, currentUser: AuthenticatedUser) {
  const contract = await prisma.poLoaContract.findUnique({
    where: { id: contractId },
    include: {
      vendor: {
        select: {
          id: true,
          vendorCode: true,
          vendorName: true,
          email: true,
          mobile: true,
          status: true,
          typeOfFirm: true,
          pan: true,
          gstn: true
        }
      },
      eic: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          company: true,
          email: true,
          mobile: true,
          status: true
        }
      },
      evaluations: {
        where: currentUser.role === 'VENDOR' ? { status: 'APPROVED' } : undefined,
        include: {
          scores: true
        },
        orderBy: { evaluationDate: 'desc' }
      }
    }
  });

  if (!contract) {
    throw { statusCode: 404, message: 'Contract not found.', errorCode: 'CONTRACT_NOT_FOUND' };
  }

  // Authorization check
  if (currentUser.role === 'VENDOR') {
    const vendorRecord = await prisma.vendorMaster.findUnique({ where: { userId: currentUser.id } });
    if (contract.vendorId !== vendorRecord?.id) {
      throw { statusCode: 403, message: 'Access denied: You can only view contracts awarded to your vendor profile.', errorCode: 'FORBIDDEN' };
    }
  }

  if (currentUser.role === 'EIC') {
    const eicRecord = await prisma.eicMaster.findUnique({ where: { userId: currentUser.id } });
    if (contract.eicId !== eicRecord?.id) {
      throw { statusCode: 403, message: 'Access denied: You can only view contracts assigned to you as EIC.', errorCode: 'FORBIDDEN' };
    }
  }

  const now = new Date();
  const diffTime = new Date(contract.completionDate).getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let urgencyLevel = 'NORMAL';
  if (contract.contractStatus === 'COMPLETED' || contract.contractStatus === 'CANCELLED') {
    urgencyLevel = 'CLOSED';
  } else if (daysRemaining < 0) {
    urgencyLevel = 'OVERDUE';
  } else if (daysRemaining <= 15) {
    urgencyLevel = 'CRITICAL';
  } else if (daysRemaining <= 30) {
    urgencyLevel = 'WARNING';
  }

  return {
    ...contract,
    daysRemaining,
    urgencyLevel
  };
}

export async function createContract(data: {
  poNumber: string;
  contractType: 'PO' | 'LOA';
  poDate: string | Date;
  completionDate: string | Date;
  poValueWithoutTax: number;
  poValueWithTax: number;
  plantCode: string;
  vendorId: string;
  eicId: string;
  description?: string;
}, adminUser: AuthenticatedUser, ipAddress?: string) {
  const poDate = new Date(data.poDate);
  const completionDate = new Date(data.completionDate);

  if (isNaN(poDate.getTime()) || isNaN(completionDate.getTime())) {
    throw { statusCode: 422, message: 'Invalid PO date or completion date provided.', errorCode: 'INVALID_DATES' };
  }

  if (poDate > completionDate) {
    throw { statusCode: 422, message: 'Contract completion date cannot precede the PO/LOA issuance date.', errorCode: 'INVALID_DATE_RANGE' };
  }

  const valWoTax = Number(data.poValueWithoutTax);
  const valWTax = Number(data.poValueWithTax);

  if (isNaN(valWoTax) || valWoTax < 0 || isNaN(valWTax) || valWTax < 0) {
    throw { statusCode: 422, message: 'Contract values must be non-negative numeric figures.', errorCode: 'INVALID_FINANCIAL_VALUE' };
  }

  if (valWTax < valWoTax) {
    throw { statusCode: 422, message: 'PO Value with Tax must be greater than or equal to PO Value without Tax.', errorCode: 'TAX_VALUE_MISMATCH' };
  }

  const existingPo = await prisma.poLoaContract.findUnique({ where: { poNumber: data.poNumber.trim().toUpperCase() } });
  if (existingPo) {
    throw { statusCode: 409, message: `Contract PO Number ${data.poNumber} already exists.`, errorCode: 'PO_NUMBER_EXISTS' };
  }

  const vendor = await prisma.vendorMaster.findUnique({ where: { id: data.vendorId } });
  if (!vendor) {
    throw { statusCode: 404, message: 'Selected vendor does not exist.', errorCode: 'VENDOR_NOT_FOUND' };
  }

  const eic = await prisma.eicMaster.findUnique({ where: { id: data.eicId } });
  if (!eic) {
    throw { statusCode: 404, message: 'Selected EIC does not exist.', errorCode: 'EIC_NOT_FOUND' };
  }

  const contract = await prisma.poLoaContract.create({
    data: {
      poNumber: data.poNumber.trim().toUpperCase(),
      contractType: data.contractType,
      poDate,
      completionDate,
      poValueWithoutTax: valWoTax,
      poValueWithTax: valWTax,
      plantCode: data.plantCode.trim().toUpperCase(),
      vendorId: data.vendorId,
      eicId: data.eicId,
      contractStatus: 'ACTIVE',
      description: data.description?.trim() || null
    },
    include: { vendor: true, eic: true }
  });

  await recordAuditLog({
    userId: adminUser.id,
    userRole: adminUser.role,
    userEmail: adminUser.email,
    action: 'CONTRACT_CREATED',
    entityType: 'PO_LOA',
    entityId: contract.id,
    newValue: {
      poNumber: contract.poNumber,
      vendorCode: vendor.vendorCode,
      eicEmpId: eic.employeeId,
      valueWithTax: contract.poValueWithTax
    },
    ipAddress
  });

  // Notify EIC
  await prisma.notification.create({
    data: {
      userId: eic.userId,
      title: 'New Contract Supervision Assigned',
      message: `You have been appointed as EIC for contract ${contract.poNumber} (${contract.contractType}) awarded to ${vendor.vendorName} at ${contract.plantCode}.`,
      type: 'CONTRACT_ASSIGNMENT',
      actionUrl: `/contracts/${contract.id}`
    }
  });

  return contract;
}

export async function updateContract(id: string, data: Partial<{
  poDate: string | Date;
  completionDate: string | Date;
  poValueWithoutTax: number;
  poValueWithTax: number;
  plantCode: string;
  contractStatus: string;
  description: string;
}>, adminUser: AuthenticatedUser, ipAddress?: string) {
  const existing = await prisma.poLoaContract.findUnique({ where: { id } });
  if (!existing) {
    throw { statusCode: 404, message: 'Contract not found.', errorCode: 'CONTRACT_NOT_FOUND' };
  }

  const updateData: any = {};

  if (data.poDate) updateData.poDate = new Date(data.poDate);
  if (data.completionDate) updateData.completionDate = new Date(data.completionDate);

  const poDate = updateData.poDate || existing.poDate;
  const compDate = updateData.completionDate || existing.completionDate;

  if (poDate > compDate) {
    throw { statusCode: 422, message: 'Completion date cannot precede PO issuance date.', errorCode: 'INVALID_DATE_RANGE' };
  }

  if (data.poValueWithoutTax !== undefined) updateData.poValueWithoutTax = Number(data.poValueWithoutTax);
  if (data.poValueWithTax !== undefined) updateData.poValueWithTax = Number(data.poValueWithTax);

  const valWoTax = updateData.poValueWithoutTax !== undefined ? updateData.poValueWithoutTax : existing.poValueWithoutTax;
  const valWTax = updateData.poValueWithTax !== undefined ? updateData.poValueWithTax : existing.poValueWithTax;

  if (valWTax < valWoTax) {
    throw { statusCode: 422, message: 'PO Value with Tax must be >= PO Value without Tax.', errorCode: 'TAX_VALUE_MISMATCH' };
  }

  if (data.plantCode) updateData.plantCode = data.plantCode.trim().toUpperCase();
  if (data.contractStatus) updateData.contractStatus = data.contractStatus;
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;

  const updated = await prisma.poLoaContract.update({
    where: { id },
    data: updateData
  });

  await recordAuditLog({
    userId: adminUser.id,
    userRole: adminUser.role,
    userEmail: adminUser.email,
    action: 'CONTRACT_MODIFIED',
    entityType: 'PO_LOA',
    entityId: id,
    oldValue: { status: existing.contractStatus, completionDate: existing.completionDate },
    newValue: { status: updated.contractStatus, completionDate: updated.completionDate },
    ipAddress
  });

  return updated;
}

export async function assignEic(contractId: string, newEicId: string, adminUser: AuthenticatedUser, ipAddress?: string) {
  const contract = await prisma.poLoaContract.findUnique({
    where: { id: contractId },
    include: { eic: true, vendor: true }
  });

  if (!contract) {
    throw { statusCode: 404, message: 'Contract not found.', errorCode: 'CONTRACT_NOT_FOUND' };
  }

  const newEic = await prisma.eicMaster.findUnique({ where: { id: newEicId } });
  if (!newEic) {
    throw { statusCode: 404, message: 'Target EIC not found.', errorCode: 'EIC_NOT_FOUND' };
  }

  const oldEicEmpId = contract.eic.employeeId;

  const updated = await prisma.poLoaContract.update({
    where: { id: contractId },
    data: { eicId: newEicId },
    include: { eic: true, vendor: true }
  });

  await recordAuditLog({
    userId: adminUser.id,
    userRole: adminUser.role,
    userEmail: adminUser.email,
    action: 'EIC_REASSIGNED',
    entityType: 'PO_LOA',
    entityId: contractId,
    oldValue: { eicEmployeeId: oldEicEmpId, eicName: contract.eic.name },
    newValue: { eicEmployeeId: newEic.employeeId, eicName: newEic.name },
    ipAddress
  });

  // Notify the newly assigned EIC
  await prisma.notification.create({
    data: {
      userId: newEic.userId,
      title: 'Contract Supervisory Assignment',
      message: `You have been reassigned as EIC for contract ${contract.poNumber} (${contract.vendor.vendorName}).`,
      type: 'CONTRACT_ASSIGNMENT',
      actionUrl: `/contracts/${contract.id}`
    }
  });

  return updated;
}
