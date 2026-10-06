import { prisma } from '../config/database.js';
import { AuthenticatedUser } from '../middleware/auth.middleware.js';

export async function getDashboardMetrics(currentUser: AuthenticatedUser) {
  const now = new Date();
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

  if (currentUser.role === 'ADMIN') {
    const [
      totalVendors,
      activeVendors,
      totalContracts,
      activeContracts,
      completedContracts,
      nearCompletionContracts,
      totalEics,
      pendingEvaluations,
      submittedEvaluations,
      approvedEvaluations,
      allApprovedScores,
      contractsByPlantRaw,
      evaluationsByGradeRaw,
      vendorScoresRaw
    ] = await Promise.all([
      prisma.vendorMaster.count(),
      prisma.vendorMaster.count({ where: { status: 'ACTIVE' } }),
      prisma.poLoaContract.count(),
      prisma.poLoaContract.count({ where: { contractStatus: 'ACTIVE' } }),
      prisma.poLoaContract.count({ where: { contractStatus: 'COMPLETED' } }),
      prisma.poLoaContract.count({
        where: {
          completionDate: { gte: now, lte: thirtyDaysAhead },
          contractStatus: { in: ['ACTIVE', 'NEAR_COMPLETION'] }
        }
      }),
      prisma.eicMaster.count({ where: { status: 'ACTIVE' } }),
      prisma.evaluation.count({ where: { status: { in: ['DRAFT', 'IN_PROGRESS'] } } }),
      prisma.evaluation.count({ where: { status: 'SUBMITTED' } }),
      prisma.evaluation.count({ where: { status: 'APPROVED' } }),
      prisma.evaluation.findMany({ where: { status: 'APPROVED' }, select: { percentage: true } }),
      prisma.poLoaContract.groupBy({ by: ['plantCode'], _count: { id: true } }),
      prisma.evaluation.groupBy({ by: ['ratingGrade'], where: { status: 'APPROVED' }, _count: { id: true } }),
      prisma.vendorMaster.findMany({
        include: {
          evaluations: { where: { status: 'APPROVED' }, select: { percentage: true } },
          contracts: { select: { poValueWithTax: true } }
        },
        take: 10
      })
    ]);

    const avgScore = allApprovedScores.length > 0
      ? Number((allApprovedScores.reduce((sum, e) => sum + e.percentage, 0) / allApprovedScores.length).toFixed(1))
      : 0;

    const vendorComparison = vendorScoresRaw.map(v => {
      const scores = v.evaluations.map(e => e.percentage);
      const avg = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;
      const totalVal = v.contracts.reduce((a, b) => a + b.poValueWithTax, 0);
      return {
        vendorCode: v.vendorCode,
        vendorName: v.vendorName,
        avgScore: avg,
        totalValue: totalVal
      };
    });

    const poorPerformingVendors = vendorComparison.filter(v => v.avgScore > 0 && v.avgScore < 60);

    return {
      kpis: {
        totalVendors,
        activeVendors,
        totalContracts,
        activeContracts,
        completedContracts,
        nearCompletionContracts,
        totalEics,
        pendingEvaluations,
        submittedEvaluations,
        approvedEvaluations,
        averageVendorScore: avgScore,
        poorPerformingCount: poorPerformingVendors.length
      },
      charts: {
        contractsByPlant: contractsByPlantRaw.map(p => ({ name: p.plantCode, count: p._count.id })),
        evaluationsByGrade: evaluationsByGradeRaw.map(g => ({ grade: g.ratingGrade, count: g._count.id })),
        vendorComparison,
        poorPerformingVendors
      }
    };
  } else if (currentUser.role === 'EIC') {
    const eicRecord = await prisma.eicMaster.findUnique({ where: { userId: currentUser.id } });
    if (!eicRecord) throw { statusCode: 404, message: 'EIC record not found.', errorCode: 'EIC_NOT_FOUND' };

    const [
      assignedContracts,
      activeContracts,
      nearCompletionContracts,
      pendingEvaluations,
      completedEvaluations,
      approvedScores,
      recentContracts
    ] = await Promise.all([
      prisma.poLoaContract.count({ where: { eicId: eicRecord.id } }),
      prisma.poLoaContract.count({ where: { eicId: eicRecord.id, contractStatus: 'ACTIVE' } }),
      prisma.poLoaContract.count({
        where: {
          eicId: eicRecord.id,
          completionDate: { gte: now, lte: thirtyDaysAhead },
          contractStatus: { in: ['ACTIVE', 'NEAR_COMPLETION'] }
        }
      }),
      prisma.evaluation.count({ where: { eicId: eicRecord.id, status: { in: ['DRAFT', 'IN_PROGRESS', 'RETURNED'] } } }),
      prisma.evaluation.count({ where: { eicId: eicRecord.id, status: 'APPROVED' } }),
      prisma.evaluation.findMany({ where: { eicId: eicRecord.id, status: 'APPROVED' }, select: { percentage: true } }),
      prisma.poLoaContract.findMany({
        where: { eicId: eicRecord.id },
        include: { vendor: { select: { vendorCode: true, vendorName: true } } },
        orderBy: { completionDate: 'asc' },
        take: 5
      })
    ]);

    const avgScore = approvedScores.length > 0
      ? Number((approvedScores.reduce((sum, e) => sum + e.percentage, 0) / approvedScores.length).toFixed(1))
      : 0;

    return {
      kpis: {
        assignedContracts,
        activeContracts,
        nearCompletionContracts,
        pendingEvaluations,
        completedEvaluations,
        averageScoreGiven: avgScore
      },
      recentContracts
    };
  } else {
    // Vendor Role
    const vendorRecord = await prisma.vendorMaster.findUnique({ where: { userId: currentUser.id } });
    if (!vendorRecord) throw { statusCode: 404, message: 'Vendor record not found.', errorCode: 'VENDOR_NOT_FOUND' };

    const [
      contracts,
      approvedEvaluations
    ] = await Promise.all([
      prisma.poLoaContract.findMany({
        where: { vendorId: vendorRecord.id },
        include: { eic: { select: { name: true, employeeId: true } } },
        orderBy: { poDate: 'desc' }
      }),
      prisma.evaluation.findMany({
        where: { vendorId: vendorRecord.id, status: 'APPROVED' },
        orderBy: { evaluationDate: 'asc' }
      })
    ]);

    const totalVal = contracts.reduce((sum, c) => sum + c.poValueWithTax, 0);
    const activeCount = contracts.filter(c => c.contractStatus === 'ACTIVE' || c.contractStatus === 'NEAR_COMPLETION').length;
    const completedCount = contracts.filter(c => c.contractStatus === 'COMPLETED').length;

    const scores = approvedEvaluations.map(e => e.percentage);
    const avgScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;
    const latestScore = scores.length > 0 ? scores[scores.length - 1] : 0;

    return {
      vendorInfo: {
        vendorCode: vendorRecord.vendorCode,
        vendorName: vendorRecord.vendorName,
        pan: vendorRecord.pan,
        gstn: vendorRecord.gstn,
        typeOfFirm: vendorRecord.typeOfFirm
      },
      kpis: {
        totalContracts: contracts.length,
        activeContracts: activeCount,
        completedContracts: completedCount,
        totalValue: totalVal,
        currentPerformanceScore: latestScore,
        averagePerformanceScore: avgScore
      },
      performanceTrend: approvedEvaluations.map(e => ({
        date: e.evaluationDate.toISOString().split('T')[0],
        score: e.percentage,
        grade: e.ratingGrade,
        evalNumber: e.evaluationNumber
      })),
      contracts
    };
  }
}

export async function getVendorMasterReport() {
  const vendors = await prisma.vendorMaster.findMany({
    include: {
      _count: { select: { contracts: true } },
      evaluations: { where: { status: 'APPROVED' }, select: { percentage: true } }
    },
    orderBy: { vendorCode: 'asc' }
  });

  return vendors.map(v => {
    const scores = v.evaluations.map(e => e.percentage);
    const avgScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 'N/A';
    return {
      vendorCode: v.vendorCode,
      vendorName: v.vendorName,
      pan: v.pan,
      gstn: v.gstn,
      email: v.email,
      mobile: v.mobile,
      typeOfFirm: v.typeOfFirm,
      status: v.status,
      contractsCount: v._count.contracts,
      averageScore: avgScore,
      createdAt: v.createdAt.toISOString().split('T')[0]
    };
  });
}

export async function getContractReport() {
  const contracts = await prisma.poLoaContract.findMany({
    include: {
      vendor: { select: { vendorCode: true, vendorName: true } },
      eic: { select: { employeeId: true, name: true } }
    },
    orderBy: { poDate: 'desc' }
  });

  return contracts.map(c => ({
    poNumber: c.poNumber,
    type: c.contractType,
    poDate: c.poDate.toISOString().split('T')[0],
    completionDate: c.completionDate.toISOString().split('T')[0],
    valWithoutTax: c.poValueWithoutTax,
    valWithTax: c.poValueWithTax,
    plantCode: c.plantCode,
    vendorCode: c.vendor.vendorCode,
    vendorName: c.vendor.vendorName,
    eicEmpId: c.eic.employeeId,
    eicName: c.eic.name,
    status: c.contractStatus
  }));
}

export async function getPerformanceReport() {
  const evaluations = await prisma.evaluation.findMany({
    where: { status: 'APPROVED' },
    include: {
      vendor: { select: { vendorCode: true, vendorName: true } },
      contract: { select: { poNumber: true, plantCode: true } },
      eic: { select: { employeeId: true, name: true } }
    },
    orderBy: { evaluationDate: 'desc' }
  });

  return evaluations.map(e => ({
    evalNumber: e.evaluationNumber,
    poNumber: e.contract.poNumber,
    plantCode: e.contract.plantCode,
    vendorCode: e.vendor.vendorCode,
    vendorName: e.vendor.vendorName,
    eicName: e.eic.name,
    evalDate: e.evaluationDate.toISOString().split('T')[0],
    percentage: e.percentage,
    grade: e.ratingGrade
  }));
}
