import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { validatePAN, validateGSTN, validateIFSC, validateMobile, maskBankAccount } from '../utils/validators.js';
import { recordAuditLog } from './audit.service.js';
import { AuthenticatedUser } from '../middleware/auth.middleware.js';

export async function listVendors(query: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  typeOfFirm?: string;
}, currentUser: AuthenticatedUser) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  // Role scoping:
  // If Vendor, can only see own record
  if (currentUser.role === 'VENDOR') {
    where.userId = currentUser.id;
  } else if (currentUser.role === 'EIC') {
    // EIC can only view vendors associated with their assigned contracts
    const eicRecord = await prisma.eicMaster.findUnique({ where: { userId: currentUser.id } });
    if (eicRecord) {
      const assignedContracts = await prisma.poLoaContract.findMany({
        where: { eicId: eicRecord.id },
        select: { vendorId: true }
      });
      const vendorIds = Array.from(new Set(assignedContracts.map(c => c.vendorId)));
      where.id = { in: vendorIds };
    } else {
      return { vendors: [], total: 0, page, totalPages: 0 };
    }
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.typeOfFirm) {
    where.typeOfFirm = query.typeOfFirm;
  }

  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { vendorCode: { contains: s } },
      { vendorName: { contains: s } },
      { pan: { contains: s } },
      { gstn: { contains: s } },
      { email: { contains: s } }
    ];
  }

  const [total, vendors] = await Promise.all([
    prisma.vendorMaster.count({ where }),
    prisma.vendorMaster.findMany({
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
        evaluations: {
          where: { status: 'APPROVED' },
          select: { percentage: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const sanitized = vendors.map(v => {
    const approvedScores = v.evaluations.map(e => e.percentage);
    const avgScore = approvedScores.length > 0 
      ? Number((approvedScores.reduce((a, b) => a + b, 0) / approvedScores.length).toFixed(2)) 
      : null;

    return {
      id: v.id,
      userId: v.userId,
      vendorCode: v.vendorCode,
      vendorName: v.vendorName,
      pan: v.pan,
      gstn: v.gstn,
      email: v.email,
      mobile: v.mobile,
      bankAccountNumber: currentUser.role === 'ADMIN' ? v.bankAccountNumber : maskBankAccount(v.bankAccountNumber),
      ifscCode: v.ifscCode,
      typeOfFirm: v.typeOfFirm,
      status: v.status,
      contractsCount: v._count.contracts,
      evaluationsCount: v._count.evaluations,
      averagePerformanceScore: avgScore,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt
    };
  });

  return {
    vendors: sanitized,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getVendorById(vendorId: string, currentUser: AuthenticatedUser) {
  const vendor = await prisma.vendorMaster.findUnique({
    where: { id: vendorId },
    include: {
      contracts: {
        include: {
          eic: { select: { name: true, employeeId: true, company: true } },
          evaluations: {
            select: { id: true, evaluationNumber: true, percentage: true, ratingGrade: true, status: true, evaluationDate: true }
          }
        },
        orderBy: { poDate: 'desc' }
      },
      evaluations: {
        where: currentUser.role === 'VENDOR' ? { status: 'APPROVED' } : undefined,
        include: {
          contract: { select: { poNumber: true, plantCode: true } },
          eic: { select: { name: true, employeeId: true } }
        },
        orderBy: { evaluationDate: 'desc' }
      }
    }
  });

  if (!vendor) {
    throw { statusCode: 404, message: 'Vendor not found.', errorCode: 'VENDOR_NOT_FOUND' };
  }

  // Authorization check
  if (currentUser.role === 'VENDOR' && vendor.userId !== currentUser.id) {
    throw { statusCode: 403, message: 'Access denied: You can only view your own vendor profile.', errorCode: 'FORBIDDEN' };
  }

  if (currentUser.role === 'EIC') {
    const eicRecord = await prisma.eicMaster.findUnique({ where: { userId: currentUser.id } });
    const hasContractWithEic = vendor.contracts.some(c => c.eicId === eicRecord?.id);
    if (!hasContractWithEic) {
      throw { statusCode: 403, message: 'Access denied: You can only view vendors assigned to your contracts.', errorCode: 'FORBIDDEN' };
    }
  }

  // Compute aggregate stats
  const approvedEvals = vendor.evaluations.filter(e => e.status === 'APPROVED');
  const avgScore = approvedEvals.length > 0
    ? Number((approvedEvals.reduce((sum, e) => sum + e.percentage, 0) / approvedEvals.length).toFixed(2))
    : null;

  return {
    ...vendor,
    bankAccountNumber: currentUser.role === 'ADMIN' ? vendor.bankAccountNumber : maskBankAccount(vendor.bankAccountNumber),
    averagePerformanceScore: avgScore,
    totalContracts: vendor.contracts.length,
    activeContracts: vendor.contracts.filter(c => c.contractStatus === 'ACTIVE' || c.contractStatus === 'NEAR_COMPLETION').length
  };
}

export async function createVendor(data: {
  vendorCode: string;
  vendorName: string;
  pan: string;
  gstn: string;
  email: string;
  mobile: string;
  bankAccountNumber: string;
  ifscCode: string;
  typeOfFirm: string;
  initialPassword?: string;
}, adminUser: AuthenticatedUser, ipAddress?: string) {
  // Validations
  if (!validatePAN(data.pan)) {
    throw { statusCode: 422, message: 'Invalid PAN format. Must be 5 uppercase letters, 4 digits, 1 letter (e.g., AAACA1234A).', errorCode: 'INVALID_PAN' };
  }
  if (!validateGSTN(data.gstn)) {
    throw { statusCode: 422, message: 'Invalid GSTN format. Must be a valid 15-character statutory GSTN (e.g., 27AAACA1234A1Z5).', errorCode: 'INVALID_GSTN' };
  }
  if (!validateIFSC(data.ifscCode)) {
    throw { statusCode: 422, message: 'Invalid IFSC code format (e.g., SBIN0001234).', errorCode: 'INVALID_IFSC' };
  }
  if (!validateMobile(data.mobile)) {
    throw { statusCode: 422, message: 'Invalid mobile number. Must be a 10-digit phone number.', errorCode: 'INVALID_MOBILE' };
  }

  // Check unique code & email
  const existingCode = await prisma.vendorMaster.findUnique({ where: { vendorCode: data.vendorCode.trim().toUpperCase() } });
  if (existingCode) {
    throw { statusCode: 409, message: `Vendor Code ${data.vendorCode} already exists.`, errorCode: 'VENDOR_CODE_EXISTS' };
  }

  const existingEmail = await prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
  if (existingEmail) {
    throw { statusCode: 409, message: `Email ${data.email} is already registered.`, errorCode: 'EMAIL_EXISTS' };
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.initialPassword || 'Vendor@123', salt);

  const vendor = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        passwordHash,
        role: 'VENDOR'
      }
    });

    const v = await tx.vendorMaster.create({
      data: {
        userId: user.id,
        vendorCode: data.vendorCode.trim().toUpperCase(),
        vendorName: data.vendorName.trim(),
        pan: data.pan.trim().toUpperCase(),
        gstn: data.gstn.trim().toUpperCase(),
        email: data.email.trim().toLowerCase(),
        mobile: data.mobile.trim(),
        bankAccountNumber: data.bankAccountNumber.trim(),
        ifscCode: data.ifscCode.trim().toUpperCase(),
        typeOfFirm: data.typeOfFirm
      }
    });

    return v;
  });

  await recordAuditLog({
    userId: adminUser.id,
    userRole: adminUser.role,
    userEmail: adminUser.email,
    action: 'VENDOR_CREATED',
    entityType: 'VENDOR',
    entityId: vendor.id,
    newValue: { vendorCode: vendor.vendorCode, name: vendor.vendorName },
    ipAddress
  });

  return vendor;
}

export async function updateVendor(id: string, data: Partial<{
  vendorName: string;
  pan: string;
  gstn: string;
  email: string;
  mobile: string;
  bankAccountNumber: string;
  ifscCode: string;
  typeOfFirm: string;
  status: string;
}>, adminUser: AuthenticatedUser, ipAddress?: string) {
  const existing = await prisma.vendorMaster.findUnique({ where: { id } });
  if (!existing) {
    throw { statusCode: 404, message: 'Vendor not found.', errorCode: 'VENDOR_NOT_FOUND' };
  }

  if (data.pan && !validatePAN(data.pan)) {
    throw { statusCode: 422, message: 'Invalid PAN format.', errorCode: 'INVALID_PAN' };
  }
  if (data.gstn && !validateGSTN(data.gstn)) {
    throw { statusCode: 422, message: 'Invalid GSTN format.', errorCode: 'INVALID_GSTN' };
  }
  if (data.ifscCode && !validateIFSC(data.ifscCode)) {
    throw { statusCode: 422, message: 'Invalid IFSC code format.', errorCode: 'INVALID_IFSC' };
  }
  if (data.mobile && !validateMobile(data.mobile)) {
    throw { statusCode: 422, message: 'Invalid mobile number.', errorCode: 'INVALID_MOBILE' };
  }

  const updated = await prisma.vendorMaster.update({
    where: { id },
    data: {
      vendorName: data.vendorName?.trim() || existing.vendorName,
      pan: data.pan ? data.pan.trim().toUpperCase() : existing.pan,
      gstn: data.gstn ? data.gstn.trim().toUpperCase() : existing.gstn,
      email: data.email ? data.email.trim().toLowerCase() : existing.email,
      mobile: data.mobile ? data.mobile.trim() : existing.mobile,
      bankAccountNumber: data.bankAccountNumber ? data.bankAccountNumber.trim() : existing.bankAccountNumber,
      ifscCode: data.ifscCode ? data.ifscCode.trim().toUpperCase() : existing.ifscCode,
      typeOfFirm: data.typeOfFirm || existing.typeOfFirm,
      status: data.status || existing.status
    }
  });

  await recordAuditLog({
    userId: adminUser.id,
    userRole: adminUser.role,
    userEmail: adminUser.email,
    action: 'VENDOR_MODIFIED',
    entityType: 'VENDOR',
    entityId: id,
    oldValue: { vendorName: existing.vendorName, status: existing.status },
    newValue: { vendorName: updated.vendorName, status: updated.status },
    ipAddress
  });

  return updated;
}
