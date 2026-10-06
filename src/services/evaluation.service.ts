import { prisma } from '../config/database.js';
import { recordAuditLog } from './audit.service.js';
import { AuthenticatedUser } from '../middleware/auth.middleware.js';

export async function listEvaluations(query: {
  page?: number;
  limit?: number;
  contractId?: string;
  vendorId?: string;
  eicId?: string;
  status?: string;
  ratingGrade?: string;
  search?: string;
}, currentUser: AuthenticatedUser) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (currentUser.role === 'VENDOR') {
    const vendorRecord = await prisma.vendorMaster.findUnique({ where: { userId: currentUser.id } });
    if (!vendorRecord) return { evaluations: [], total: 0, page, totalPages: 0 };
    where.vendorId = vendorRecord.id;
    where.status = 'APPROVED'; // Vendors only see approved evaluations
  } else if (currentUser.role === 'EIC') {
    const eicRecord = await prisma.eicMaster.findUnique({ where: { userId: currentUser.id } });
    if (!eicRecord) return { evaluations: [], total: 0, page, totalPages: 0 };
    where.eicId = eicRecord.id;
  } else {
    // Admin
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.eicId) where.eicId = query.eicId;
  }

  if (query.contractId) where.poId = query.contractId;
  if (query.status) where.status = query.status;
  if (query.ratingGrade) where.ratingGrade = query.ratingGrade;

  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { evaluationNumber: { contains: s } },
      { contract: { poNumber: { contains: s } } },
      { vendor: { vendorName: { contains: s } } },
      { vendor: { vendorCode: { contains: s } } }
    ];
  }

  const [total, evaluations] = await Promise.all([
    prisma.evaluation.count({ where }),
    prisma.evaluation.findMany({
      where,
      skip,
      take: limit,
      include: {
        contract: {
          select: {
            id: true,
            poNumber: true,
            contractType: true,
            plantCode: true,
            poValueWithTax: true
          }
        },
        vendor: {
          select: {
            id: true,
            vendorCode: true,
            vendorName: true
          }
        },
        eic: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            company: true
          }
        },
        scores: {
          select: {
            id: true,
            criterionNameSnapshot: true,
            weightSnapshot: true,
            maxScoreSnapshot: true,
            score: true,
            weightedScore: true
          }
        }
      },
      orderBy: { evaluationDate: 'desc' }
    })
  ]);

  return {
    evaluations,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getEvaluationById(id: string, currentUser: AuthenticatedUser) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: {
      contract: {
        select: {
          id: true,
          poNumber: true,
          contractType: true,
          poDate: true,
          completionDate: true,
          plantCode: true,
          poValueWithoutTax: true,
          poValueWithTax: true,
          contractStatus: true
        }
      },
      vendor: {
        select: {
          id: true,
          userId: true,
          vendorCode: true,
          vendorName: true,
          email: true,
          mobile: true,
          typeOfFirm: true
        }
      },
      eic: {
        select: {
          id: true,
          userId: true,
          employeeId: true,
          name: true,
          company: true,
          email: true,
          mobile: true
        }
      },
      scores: {
        include: {
          criterion: true
        }
      }
    }
  });

  if (!evaluation) {
    throw { statusCode: 404, message: 'Evaluation not found.', errorCode: 'EVALUATION_NOT_FOUND' };
  }

  // Scoping
  if (currentUser.role === 'VENDOR') {
    if (evaluation.vendor.userId !== currentUser.id) {
      throw { statusCode: 403, message: 'Access denied: You cannot view evaluations for another vendor.', errorCode: 'FORBIDDEN' };
    }
    if (evaluation.status !== 'APPROVED') {
      throw { statusCode: 403, message: 'Evaluation is pending administrative approval and is not yet published.', errorCode: 'FORBIDDEN' };
    }
  }

  if (currentUser.role === 'EIC') {
    if (evaluation.eic.userId !== currentUser.id) {
      throw { statusCode: 403, message: 'Access denied: You can only view evaluations assigned to you.', errorCode: 'FORBIDDEN' };
    }
  }

  return evaluation;
}

export async function createEvaluationDraft(data: {
  poId: string;
  periodStart: string | Date;
  periodEnd: string | Date;
}, eicUser: AuthenticatedUser, ipAddress?: string) {
  const eicRecord = await prisma.eicMaster.findUnique({ where: { userId: eicUser.id } });
  if (!eicRecord) {
    throw { statusCode: 403, message: 'EIC profile not linked to user.', errorCode: 'EIC_NOT_FOUND' };
  }

  const contract = await prisma.poLoaContract.findUnique({
    where: { id: data.poId },
    include: { vendor: true }
  });

  if (!contract) {
    throw { statusCode: 404, message: 'Contract not found.', errorCode: 'CONTRACT_NOT_FOUND' };
  }

  if (contract.eicId !== eicRecord.id) {
    throw { statusCode: 403, message: 'You are not the designated EIC for this contract.', errorCode: 'UNAUTHORIZED_EIC' };
  }

  const periodStart = new Date(data.periodStart);
  const periodEnd = new Date(data.periodEnd);

  if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
    throw { statusCode: 422, message: 'Invalid period dates.', errorCode: 'INVALID_DATES' };
  }

  if (periodStart > periodEnd) {
    throw { statusCode: 422, message: 'Period start cannot be after period end.', errorCode: 'INVALID_PERIOD' };
  }

  // Generate unique evaluation number: EVL-YYYY-XXXXX
  const count = await prisma.evaluation.count();
  const evaluationNumber = `EVL-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  // Fetch active criteria to initialize snapshots
  const criteria = await prisma.evaluationCriteria.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  });

  if (criteria.length === 0) {
    throw { statusCode: 500, message: 'No active evaluation criteria configured in system.', errorCode: 'NO_CRITERIA' };
  }

  const evaluation = await prisma.$transaction(async (tx) => {
    const ev = await tx.evaluation.create({
      data: {
        evaluationNumber,
        poId: contract.id,
        eicId: eicRecord.id,
        vendorId: contract.vendorId,
        evaluationDate: new Date(),
        periodStart,
        periodEnd,
        totalWeightedScore: 0.0,
        percentage: 0.0,
        ratingGrade: 'UNSATISFACTORY',
        status: 'DRAFT',
        scores: {
          create: criteria.map(c => ({
            criterionId: c.id,
            criterionNameSnapshot: c.name,
            weightSnapshot: c.weight,
            maxScoreSnapshot: c.maxScore,
            score: 0,
            weightedScore: 0,
            remarks: ''
          }))
        }
      },
      include: { scores: true }
    });

    return ev;
  });

  await recordAuditLog({
    userId: eicUser.id,
    userRole: eicUser.role,
    userEmail: eicUser.email,
    action: 'EVALUATION_DRAFT_CREATED',
    entityType: 'EVALUATION',
    entityId: evaluation.id,
    newValue: { evaluationNumber, poNumber: contract.poNumber },
    ipAddress
  });

  return evaluation;
}

export async function updateEvaluationScores(id: string, data: {
  scores: Array<{ scoreId: string; score: number; remarks?: string }>;
  remarks?: string;
  observations?: string;
}, eicUser: AuthenticatedUser, ipAddress?: string) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: { scores: true, eic: true, contract: true }
  });

  if (!evaluation) {
    throw { statusCode: 404, message: 'Evaluation not found.', errorCode: 'EVALUATION_NOT_FOUND' };
  }

  if (evaluation.eic.userId !== eicUser.id) {
    throw { statusCode: 403, message: 'You are not authorized to update this evaluation.', errorCode: 'FORBIDDEN' };
  }

  if (evaluation.status !== 'DRAFT' && evaluation.status !== 'IN_PROGRESS' && evaluation.status !== 'RETURNED') {
    throw { statusCode: 409, message: `Cannot edit evaluation in '${evaluation.status}' status. Only DRAFT, IN_PROGRESS, or RETURNED evaluations can be edited.`, errorCode: 'RECORD_LOCKED' };
  }

  // Calculate scores deterministically
  const scoreMap = new Map(data.scores.map(s => [s.scoreId, s]));
  let totalWeightedScore = 0;
  let totalWeight = 0;

  const scoreUpdates = evaluation.scores.map(item => {
    const input = scoreMap.get(item.id);
    const rawScore = input !== undefined ? Math.max(0, Math.min(item.maxScoreSnapshot, Number(input.score))) : item.score;
    const weighted = Number(((rawScore / item.maxScoreSnapshot) * item.weightSnapshot).toFixed(2));
    
    totalWeightedScore += weighted;
    totalWeight += item.weightSnapshot;

    return {
      id: item.id,
      score: rawScore,
      weightedScore: weighted,
      remarks: input?.remarks !== undefined ? input.remarks : item.remarks
    };
  });

  totalWeightedScore = Number(totalWeightedScore.toFixed(2));
  const percentage = totalWeight > 0 ? Number(((totalWeightedScore / totalWeight) * 100).toFixed(2)) : 0;

  let ratingGrade = 'UNSATISFACTORY';
  if (percentage >= 90.0) ratingGrade = 'EXCELLENT';
  else if (percentage >= 75.0) ratingGrade = 'VERY_GOOD';
  else if (percentage >= 60.0) ratingGrade = 'GOOD';
  else if (percentage >= 50.0) ratingGrade = 'SATISFACTORY';

  const updatedStatus = evaluation.status === 'RETURNED' ? 'REVISED' : 'IN_PROGRESS';

  const updated = await prisma.$transaction(async (tx) => {
    for (const su of scoreUpdates) {
      await tx.evaluationScore.update({
        where: { id: su.id },
        data: {
          score: su.score,
          weightedScore: su.weightedScore,
          remarks: su.remarks
        }
      });
    }

    return await tx.evaluation.update({
      where: { id },
      data: {
        totalWeightedScore,
        percentage,
        ratingGrade,
        status: updatedStatus,
        remarks: data.remarks !== undefined ? data.remarks : evaluation.remarks,
        observations: data.observations !== undefined ? data.observations : evaluation.observations
      },
      include: { scores: true }
    });
  });

  return updated;
}

export async function submitEvaluation(id: string, eicUser: AuthenticatedUser, ipAddress?: string) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: { scores: true, eic: true, contract: { include: { vendor: true } } }
  });

  if (!evaluation) {
    throw { statusCode: 404, message: 'Evaluation not found.', errorCode: 'EVALUATION_NOT_FOUND' };
  }

  if (evaluation.eic.userId !== eicUser.id) {
    throw { statusCode: 403, message: 'You are not authorized to submit this evaluation.', errorCode: 'FORBIDDEN' };
  }

  if (evaluation.status !== 'DRAFT' && evaluation.status !== 'IN_PROGRESS' && evaluation.status !== 'REVISED') {
    throw { statusCode: 409, message: `Evaluation is in '${evaluation.status}' state and cannot be submitted.`, errorCode: 'INVALID_STATUS' };
  }

  // Ensure all criteria have a non-zero score entered
  const unScored = evaluation.scores.filter(s => s.score <= 0);
  if (unScored.length > 0) {
    throw {
      statusCode: 422,
      message: `All evaluation criteria must be scored before submission. Missing: ${unScored.map(u => u.criterionNameSnapshot).join(', ')}`,
      errorCode: 'INCOMPLETE_EVALUATION'
    };
  }

  const updated = await prisma.evaluation.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedBy: eicUser.id,
      submittedAt: new Date()
    }
  });

  await recordAuditLog({
    userId: eicUser.id,
    userRole: eicUser.role,
    userEmail: eicUser.email,
    action: 'EVALUATION_SUBMITTED',
    entityType: 'EVALUATION',
    entityId: id,
    newValue: {
      totalWeightedScore: evaluation.totalWeightedScore,
      percentage: evaluation.percentage,
      ratingGrade: evaluation.ratingGrade
    },
    ipAddress
  });

  // Notify Admins
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true } });
  for (const adm of admins) {
    await prisma.notification.create({
      data: {
        userId: adm.id,
        title: 'New Evaluation Pending Review',
        message: `EIC ${evaluation.eic.name} submitted evaluation ${evaluation.evaluationNumber} for contract ${evaluation.contract.poNumber} (${evaluation.contract.vendor.vendorName}).`,
        type: 'EVALUATION_SUBMITTED',
        actionUrl: `/evaluations/${evaluation.id}`
      }
    });
  }

  return updated;
}

export async function approveEvaluation(id: string, adminUser: AuthenticatedUser, ipAddress?: string) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: {
      scores: true,
      eic: true,
      vendor: true,
      contract: true
    }
  });

  if (!evaluation) {
    throw { statusCode: 404, message: 'Evaluation not found.', errorCode: 'EVALUATION_NOT_FOUND' };
  }

  if (evaluation.status !== 'SUBMITTED' && evaluation.status !== 'REVIEWED') {
    throw { statusCode: 409, message: `Only SUBMITTED evaluations can be approved. Current status: ${evaluation.status}`, errorCode: 'INVALID_STATUS' };
  }

  const updated = await prisma.evaluation.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewedBy: adminUser.email,
      reviewedAt: new Date()
    }
  });

  await recordAuditLog({
    userId: adminUser.id,
    userRole: adminUser.role,
    userEmail: adminUser.email,
    action: 'EVALUATION_APPROVED',
    entityType: 'EVALUATION',
    entityId: id,
    newValue: {
      approvedBy: adminUser.email,
      grade: evaluation.ratingGrade,
      percentage: evaluation.percentage
    },
    ipAddress
  });

  // Notify Vendor
  await prisma.notification.create({
    data: {
      userId: evaluation.vendor.userId,
      title: 'Performance Evaluation Approved',
      message: `Performance evaluation ${evaluation.evaluationNumber} for contract ${evaluation.contract.poNumber} is finalized with grade ${evaluation.ratingGrade} (${evaluation.percentage}%).`,
      type: 'EVALUATION_APPROVED',
      actionUrl: `/evaluations/${evaluation.id}`
    }
  });

  // Notify EIC
  await prisma.notification.create({
    data: {
      userId: evaluation.eic.userId,
      title: 'Evaluation Approved by Management',
      message: `Your evaluation ${evaluation.evaluationNumber} for ${evaluation.contract.poNumber} has been approved by admin.`,
      type: 'EVALUATION_APPROVED',
      actionUrl: `/evaluations/${evaluation.id}`
    }
  });

  return updated;
}

export async function returnEvaluation(id: string, reason: string, adminUser: AuthenticatedUser, ipAddress?: string) {
  if (!reason || reason.trim().length === 0) {
    throw { statusCode: 422, message: 'A specific return justification is required.', errorCode: 'RETURN_REASON_REQUIRED' };
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: { eic: true, contract: true }
  });

  if (!evaluation) {
    throw { statusCode: 404, message: 'Evaluation not found.', errorCode: 'EVALUATION_NOT_FOUND' };
  }

  if (evaluation.status !== 'SUBMITTED') {
    throw { statusCode: 409, message: `Only SUBMITTED evaluations can be returned for clarification. Current: ${evaluation.status}`, errorCode: 'INVALID_STATUS' };
  }

  const updated = await prisma.evaluation.update({
    where: { id },
    data: {
      status: 'RETURNED',
      returnReason: reason.trim(),
      version: evaluation.version + 1
    }
  });

  await recordAuditLog({
    userId: adminUser.id,
    userRole: adminUser.role,
    userEmail: adminUser.email,
    action: 'EVALUATION_RETURNED',
    entityType: 'EVALUATION',
    entityId: id,
    newValue: { returnReason: reason.trim(), version: updated.version },
    ipAddress
  });

  // Notify EIC
  await prisma.notification.create({
    data: {
      userId: evaluation.eic.userId,
      title: 'Evaluation Returned for Clarification',
      message: `Evaluation ${evaluation.evaluationNumber} for contract ${evaluation.contract.poNumber} was returned by admin. Reason: ${reason.trim()}`,
      type: 'EVALUATION_RETURNED',
      actionUrl: `/evaluations/${evaluation.id}`
    }
  });

  return updated;
}
