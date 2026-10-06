import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[DEVELOPMENT SEED DATA] Initializing database seeding...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.evaluationScore.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.poLoaContract.deleteMany();
  await prisma.evaluationCriteria.deleteMany();
  await prisma.ratingThreshold.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.eicMaster.deleteMany();
  await prisma.vendorMaster.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('Admin@123', salt);
  const eicPasswordHash = await bcrypt.hash('Eic@123', salt);
  const vendorPasswordHash = await bcrypt.hash('Vendor@123', salt);

  // 1. Create Rating Thresholds
  console.log('[DEVELOPMENT SEED DATA] Creating rating thresholds...');
  await prisma.ratingThreshold.createMany({
    data: [
      { grade: 'EXCELLENT', minScore: 90.0, maxScore: 100.0, description: 'Outstanding performance meeting and exceeding all requirements.', badgeStyle: 'emerald' },
      { grade: 'VERY_GOOD', minScore: 75.0, maxScore: 89.99, description: 'Consistently high performance meeting all standards.', badgeStyle: 'blue' },
      { grade: 'GOOD', minScore: 60.0, maxScore: 74.99, description: 'Acceptable performance with minor deficiencies.', badgeStyle: 'slate' },
      { grade: 'SATISFACTORY', minScore: 50.0, maxScore: 59.99, description: 'Marginal performance needing immediate operational attention.', badgeStyle: 'amber' },
      { grade: 'UNSATISFACTORY', minScore: 0.0, maxScore: 49.99, description: 'Substandard performance requiring contractual corrective action.', badgeStyle: 'crimson' }
    ]
  });

  // 2. Create 10 Evaluation Criteria (Total Weight = 100%)
  console.log('[DEVELOPMENT SEED DATA] Creating evaluation criteria...');
  const criteriaData = [
    { name: 'Quality of Work', code: 'QUAL_WORK', description: 'Adherence to engineering specifications and material standards', weight: 20.0, maxScore: 5, sortOrder: 1 },
    { name: 'Timeliness & Milestone Adherence', code: 'TIME_MILESTONE', description: 'Meeting contractual schedule without unapproved delays', weight: 15.0, maxScore: 5, sortOrder: 2 },
    { name: 'Safety Compliance', code: 'SAFE_COMP', description: 'Zero accidents, PPE enforcement, and safety protocols', weight: 15.0, maxScore: 5, sortOrder: 3 },
    { name: 'Contractual Compliance', code: 'CONT_COMP', description: 'Strict adherence to technical specifications and contract terms', weight: 15.0, maxScore: 5, sortOrder: 4 },
    { name: 'Manpower & Equipment Deployment', code: 'MAN_EQUIP', description: 'Adequate skilled manpower and certified machinery deployed', weight: 10.0, maxScore: 5, sortOrder: 5 },
    { name: 'Documentation & Submittals', code: 'DOC_SUBMIT', description: 'Timely submission of test certificates, invoices, and logs', weight: 5.0, maxScore: 5, sortOrder: 6 },
    { name: 'Communication & Interfacing', code: 'COMM_INTF', description: 'Proactive communication and coordination with site engineers', weight: 5.0, maxScore: 5, sortOrder: 7 },
    { name: 'Responsiveness & Issue Resolution', code: 'RESP_RESOLV', description: 'Speed and effectiveness in rectifying site observations', weight: 5.0, maxScore: 5, sortOrder: 8 },
    { name: 'Workmanship & Testing Standards', code: 'WORK_TEST', description: 'Finish quality, weld tests, non-destructive test compliance', weight: 5.0, maxScore: 5, sortOrder: 9 },
    { name: 'Housekeeping & Environmental Norms', code: 'HOUSE_ENV', description: 'Debris removal, environmental compliance, waste management', weight: 5.0, maxScore: 5, sortOrder: 10 }
  ];

  for (const c of criteriaData) {
    await prisma.evaluationCriteria.create({ data: c });
  }
  const createdCriteria = await prisma.evaluationCriteria.findMany({ orderBy: { sortOrder: 'asc' } });

  // 3. Create 3 Admin Users
  console.log('[DEVELOPMENT SEED DATA] Creating 3 Admin users...');
  const admins = [
    { email: 'admin@enterprise.org', name: 'Alok Nath Mathur', department: 'Central Procurement & Contracts', mobile: '9820011223' },
    { email: 'admin.finance@enterprise.org', name: 'Sunita Deshmukh', department: 'Finance & Commercial Audit', mobile: '9820011224' },
    { email: 'admin.auditor@enterprise.org', name: 'Vikramaditya Rao', department: 'Quality Assurance & Vigilance', mobile: '9820011225' }
  ];

  for (const a of admins) {
    const user = await prisma.user.create({
      data: {
        email: a.email,
        passwordHash: commonPasswordHash,
        role: 'ADMIN',
        adminProfile: {
          create: {
            name: a.name,
            department: a.department,
            mobile: a.mobile
          }
        }
      }
    });
  }

  // 4. Create 5 EIC Users
  console.log('[DEVELOPMENT SEED DATA] Creating 5 EIC users...');
  const eicList = [
    { email: 'eic.sharma@enterprise.org', empId: 'EMP-EIC-101', name: 'Rajesh Sharma', company: 'Heavy Engineering Div', mobile: '9811022334' },
    { email: 'eic.patel@enterprise.org', empId: 'EMP-EIC-102', name: 'Suresh Patel', company: 'Thermal & Energy Systems', mobile: '9811022335' },
    { email: 'eic.verma@enterprise.org', empId: 'EMP-EIC-103', name: 'Ananya Verma', company: 'Civil Infrastructure Works', mobile: '9811022336' },
    { email: 'eic.nair@enterprise.org', empId: 'EMP-EIC-104', name: 'Arun Nair', company: 'Electrical & Automation Div', mobile: '9811022337' },
    { email: 'eic.gupta@enterprise.org', empId: 'EMP-EIC-105', name: 'Meenakshi Gupta', company: 'Safety & Quality Oversight', mobile: '9811022338' }
  ];

  const createdEics = [];
  for (const e of eicList) {
    const user = await prisma.user.create({
      data: {
        email: e.email,
        passwordHash: eicPasswordHash,
        role: 'EIC',
        eicMaster: {
          create: {
            employeeId: e.empId,
            name: e.name,
            company: e.company,
            mobile: e.mobile,
            email: e.email,
            status: 'ACTIVE'
          }
        }
      },
      include: { eicMaster: true }
    });
    if (user.eicMaster) {
      createdEics.push(user.eicMaster);
    }
  }

  // 5. Create 10 Vendors
  console.log('[DEVELOPMENT SEED DATA] Creating 10 Vendor users...');
  const vendorList = [
    { code: 'VND-2024-001', name: 'Apex Industrial Fabricators Ltd', email: 'vendor.apex@enterprise.org', pan: 'AAACA1234A', gstn: '27AAACA1234A1Z5', mobile: '9876543210', bankAcc: '109283746501', ifsc: 'SBIN0001234', firm: 'PUBLIC_LIMITED' },
    { code: 'VND-2024-002', name: 'Bharat Heavy Power Infra Pvt Ltd', email: 'vendor.bharat@enterprise.org', pan: 'AABCB2345B', gstn: '07AABCB2345B1Z2', mobile: '9876543211', bankAcc: '109283746502', ifsc: 'HDFC0000456', firm: 'PRIVATE_LIMITED' },
    { code: 'VND-2024-003', name: 'Crestline Logistics & Haulage LLP', email: 'vendor.crestline@enterprise.org', pan: 'AACCC3456C', gstn: '24AACCC3456C1Z9', mobile: '9876543212', bankAcc: '109283746503', ifsc: 'ICIC0000789', firm: 'LLP' },
    { code: 'VND-2024-004', name: 'Delta High-Voltage Solutions', email: 'vendor.delta@enterprise.org', pan: 'AAACD4567D', gstn: '29AAACD4567D1Z6', mobile: '9876543213', bankAcc: '109283746504', ifsc: 'PUNB0001011', firm: 'PARTNERSHIP' },
    { code: 'VND-2024-005', name: 'Eastern Steel Foundry Works', email: 'vendor.eastern@enterprise.org', pan: 'AAACE5678E', gstn: '19AAACE5678E1Z3', mobile: '9876543214', bankAcc: '109283746505', ifsc: 'BARB0KOLKAT', firm: 'PROPRIETORSHIP' },
    { code: 'VND-2024-006', name: 'Frontier Instrumentation Systems', email: 'vendor.frontier@enterprise.org', pan: 'AAACF6789F', gstn: '33AAACF6789F1Z0', mobile: '9876543215', bankAcc: '109283746506', ifsc: 'UTIB0001213', firm: 'PRIVATE_LIMITED' },
    { code: 'VND-2024-007', name: 'Global Valve & Piping Tech', email: 'vendor.global@enterprise.org', pan: 'AAACG7890G', gstn: '06AAACG7890G1Z7', mobile: '9876543216', bankAcc: '109283746507', ifsc: 'CNRB0001415', firm: 'PUBLIC_LIMITED' },
    { code: 'VND-2024-008', name: 'Horizon Civil Engineering JV', email: 'vendor.horizon@enterprise.org', pan: 'AAACH8901H', gstn: '23AAACH8901H1Z4', mobile: '9876543217', bankAcc: '109283746508', ifsc: 'IDIB0001617', firm: 'JOINT_VENTURE' },
    { code: 'VND-2024-009', name: 'Indus Automated Controls Ltd', email: 'vendor.indus@enterprise.org', pan: 'AAACI9012I', gstn: '03AAACI9012I1Z1', mobile: '9876543218', bankAcc: '109283746509', ifsc: 'KKBK0001819', firm: 'PUBLIC_LIMITED' },
    { code: 'VND-2024-010', name: 'Jupiter Industrial Safety Supplies', email: 'vendor.jupiter@enterprise.org', pan: 'AAACJ0123J', gstn: '36AAACJ0123J1Z8', mobile: '9876543219', bankAcc: '109283746510', ifsc: 'YESB0002021', firm: 'PROPRIETORSHIP' }
  ];

  const createdVendors = [];
  for (const v of vendorList) {
    const user = await prisma.user.create({
      data: {
        email: v.email,
        passwordHash: vendorPasswordHash,
        role: 'VENDOR',
        vendorMaster: {
          create: {
            vendorCode: v.code,
            vendorName: v.name,
            pan: v.pan,
            gstn: v.gstn,
            email: v.email,
            mobile: v.mobile,
            bankAccountNumber: v.bankAcc,
            ifscCode: v.ifsc,
            typeOfFirm: v.firm,
            status: 'ACTIVE'
          }
        }
      },
      include: { vendorMaster: true }
    });
    if (user.vendorMaster) {
      createdVendors.push(user.vendorMaster);
    }
  }

  // 6. Create 15 PO / LOA Contracts
  console.log('[DEVELOPMENT SEED DATA] Creating 15 PO/LOA contracts with realistic milestones...');
  const now = new Date();
  
  // Date helper functions
  const daysFromNow = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };
  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };

  const contractSpecs = [
    // Contract 1: Active, Normal (>30 days remaining)
    { poNum: 'PO/2026/PLANT-1/0101', type: 'PO', poDate: daysAgo(60), compDate: daysFromNow(120), valWoTax: 4500000.00, valWTax: 5310000.00, plant: 'PLANT-01', vIdx: 0, eIdx: 0, status: 'ACTIVE', desc: 'Fabrication and erection of heavy structural columns for boiler house' },
    // Contract 2: Near completion warning (15-30 days)
    { poNum: 'LOA/2026/PLANT-2/0202', type: 'LOA', poDate: daysAgo(90), compDate: daysFromNow(22), valWoTax: 7800000.00, valWTax: 9204000.00, plant: 'PLANT-02', vIdx: 1, eIdx: 1, status: 'NEAR_COMPLETION', desc: 'Turbine auxiliary overhaul, insulation and piping works' },
    // Contract 3: Critical (<15 days remaining)
    { poNum: 'PO/2026/PLANT-1/0103', type: 'PO', poDate: daysAgo(150), compDate: daysFromNow(8), valWoTax: 2400000.00, valWTax: 2832000.00, plant: 'PLANT-01', vIdx: 2, eIdx: 0, status: 'NEAR_COMPLETION', desc: 'Inter-plant coal and raw material bulk haulage contract' },
    // Contract 4: Completed
    { poNum: 'PO/2025/PLANT-3/0304', type: 'PO', poDate: daysAgo(200), compDate: daysAgo(20), valWoTax: 3200000.00, valWTax: 3776000.00, plant: 'PLANT-03', vIdx: 3, eIdx: 3, status: 'COMPLETED', desc: 'Installation and testing of 33kV switchyard switchgear panels' },
    // Contract 5: Active
    { poNum: 'LOA/2026/PLANT-4/0405', type: 'LOA', poDate: daysAgo(45), compDate: daysFromNow(95), valWoTax: 1850000.00, valWTax: 2183000.00, plant: 'PLANT-04', vIdx: 4, eIdx: 2, status: 'ACTIVE', desc: 'Foundry casting supply for slurry pump liners and impellers' },
    // Contract 6: Active
    { poNum: 'PO/2026/PLANT-2/0206', type: 'PO', poDate: daysAgo(30), compDate: daysFromNow(150), valWoTax: 6200000.00, valWTax: 7316000.00, plant: 'PLANT-02', vIdx: 5, eIdx: 3, status: 'ACTIVE', desc: 'DCS control loop transmitters and flow-meter calibration services' },
    // Contract 7: Active
    { poNum: 'PO/2026/PLANT-5/0507', type: 'PO', poDate: daysAgo(75), compDate: daysFromNow(60), valWoTax: 5100000.00, valWTax: 6018000.00, plant: 'PLANT-05', vIdx: 6, eIdx: 1, status: 'ACTIVE', desc: 'High-pressure steam bypass valve overhaul and pneumatic testing' },
    // Contract 8: Near completion (<15 days)
    { poNum: 'LOA/2026/PLANT-3/0308', type: 'LOA', poDate: daysAgo(110), compDate: daysFromNow(12), valWoTax: 9500000.00, valWTax: 11210000.00, plant: 'PLANT-03', vIdx: 7, eIdx: 2, status: 'NEAR_COMPLETION', desc: 'Construction of peripheral RCC drainage and heavy equipment bay' },
    // Contract 9: Active
    { poNum: 'PO/2026/PLANT-1/0109', type: 'PO', poDate: daysAgo(40), compDate: daysFromNow(180), valWoTax: 3900000.00, valWTax: 4602000.00, plant: 'PLANT-01', vIdx: 8, eIdx: 3, status: 'ACTIVE', desc: 'PLC programming, SCADA interface upgrade, and redundant servers' },
    // Contract 10: Active
    { poNum: 'PO/2026/PLANT-2/0210', type: 'PO', poDate: daysAgo(20), compDate: daysFromNow(100), valWoTax: 1200000.00, valWTax: 1416000.00, plant: 'PLANT-02', vIdx: 9, eIdx: 4, status: 'ACTIVE', desc: 'Annual supply of fire-retardant suits, breathing apparatus, and PPE' },
    // Contract 11: Active
    { poNum: 'PO/2026/PLANT-4/0411', type: 'PO', poDate: daysAgo(50), compDate: daysFromNow(70), valWoTax: 2800000.00, valWTax: 3304000.00, plant: 'PLANT-04', vIdx: 0, eIdx: 0, status: 'ACTIVE', desc: 'Auxiliary cooling tower structural bracing and pipe rack alignment' },
    // Contract 12: Active
    { poNum: 'LOA/2026/PLANT-5/0512', type: 'LOA', poDate: daysAgo(80), compDate: daysFromNow(40), valWoTax: 8100000.00, valWTax: 9558000.00, plant: 'PLANT-05', vIdx: 1, eIdx: 1, status: 'ACTIVE', desc: 'Boiler feed water pump motor re-winding and vibration analysis' },
    // Contract 13: Completed
    { poNum: 'PO/2025/PLANT-1/0113', type: 'PO', poDate: daysAgo(220), compDate: daysAgo(40), valWoTax: 1950000.00, valWTax: 2301000.00, plant: 'PLANT-01', vIdx: 6, eIdx: 0, status: 'COMPLETED', desc: 'Condenser tube cleaning and eddy current non-destructive testing' },
    // Contract 14: Draft
    { poNum: 'PO/2026/PLANT-2/0214', type: 'PO', poDate: now, compDate: daysFromNow(240), valWoTax: 6700000.00, valWTax: 7906000.00, plant: 'PLANT-02', vIdx: 3, eIdx: 3, status: 'DRAFT', desc: 'Substation transformer oil filtration and nitrogen purging' },
    // Contract 15: Active
    { poNum: 'LOA/2026/PLANT-3/0315', type: 'LOA', poDate: daysAgo(65), compDate: daysFromNow(85), valWoTax: 4400000.00, valWTax: 5192000.00, plant: 'PLANT-03', vIdx: 7, eIdx: 2, status: 'ACTIVE', desc: 'Site grading, road asphalt surfacing, and stormwater culverts' }
  ];

  const createdContracts = [];
  for (const c of contractSpecs) {
    const contract = await prisma.poLoaContract.create({
      data: {
        poNumber: c.poNum,
        contractType: c.type,
        poDate: c.poDate,
        completionDate: c.compDate,
        poValueWithoutTax: c.valWoTax,
        poValueWithTax: c.valWTax,
        plantCode: c.plant,
        vendorId: createdVendors[c.vIdx].id,
        eicId: createdEics[c.eIdx].id,
        contractStatus: c.status,
        description: c.desc
      }
    });
    createdContracts.push(contract);
  }

  // 7. Create Multiple Evaluations with Line-Item Deterministic Scores
  console.log('[DEVELOPMENT SEED DATA] Creating deterministic evaluation scorecards and snapshots...');

  // Helper function to create evaluation and line items
  async function createEvaluationRecord(opts: {
    evalNum: string;
    contract: any;
    eic: any;
    vendor: any;
    evalDate: Date;
    periodStart: Date;
    periodEnd: Date;
    scorePreset: number[]; // 10 scores from 1 to 5
    status: string;
    remarks: string;
    observations: string;
    submittedBy?: string;
    reviewedBy?: string;
    returnReason?: string;
  }) {
    let totalWeightedScore = 0;
    const scoresToInsert: any[] = [];

    createdCriteria.forEach((crit, idx) => {
      const rawScore = opts.scorePreset[idx] || 4;
      // Formula: (rawScore / maxScore) * weight
      const weighted = Number(((rawScore / crit.maxScore) * crit.weight).toFixed(2));
      totalWeightedScore += weighted;

      scoresToInsert.push({
        criterionId: crit.id,
        criterionNameSnapshot: crit.name,
        weightSnapshot: crit.weight,
        maxScoreSnapshot: crit.maxScore,
        score: rawScore,
        weightedScore: weighted,
        remarks: rawScore >= 4 ? 'Met technical parameters' : 'Requires site improvements'
      });
    });

    totalWeightedScore = Number(totalWeightedScore.toFixed(2));
    const percentage = totalWeightedScore; // Since total weight is 100%

    let ratingGrade = 'UNSATISFACTORY';
    if (percentage >= 90.0) ratingGrade = 'EXCELLENT';
    else if (percentage >= 75.0) ratingGrade = 'VERY_GOOD';
    else if (percentage >= 60.0) ratingGrade = 'GOOD';
    else if (percentage >= 50.0) ratingGrade = 'SATISFACTORY';

    const evaluation = await prisma.evaluation.create({
      data: {
        evaluationNumber: opts.evalNum,
        poId: opts.contract.id,
        eicId: opts.eic.id,
        vendorId: opts.vendor.id,
        evaluationDate: opts.evalDate,
        periodStart: opts.periodStart,
        periodEnd: opts.periodEnd,
        totalWeightedScore,
        percentage,
        ratingGrade,
        status: opts.status,
        remarks: opts.remarks,
        observations: opts.observations,
        submittedBy: opts.submittedBy || null,
        submittedAt: opts.submittedBy ? opts.evalDate : null,
        reviewedBy: opts.reviewedBy || null,
        reviewedAt: opts.reviewedBy ? opts.evalDate : null,
        returnReason: opts.returnReason || null,
        version: 1,
        scores: {
          create: scoresToInsert
        }
      }
    });

    return evaluation;
  }

  // Evaluation 1: Contract 1 (Apex Industrial) - APPROVED (Excellent)
  await createEvaluationRecord({
    evalNum: 'EVL-2026-00001',
    contract: createdContracts[0],
    eic: createdEics[0],
    vendor: createdVendors[0],
    evalDate: daysAgo(15),
    periodStart: daysAgo(60),
    periodEnd: daysAgo(16),
    scorePreset: [5, 5, 5, 4, 5, 5, 4, 5, 5, 4], // ~94%
    status: 'APPROVED',
    remarks: 'Outstanding fabrication quality and strict adherence to ASME Section IX welding norms.',
    observations: 'All test certificates submitted promptly. Zero safety incidents noted on site.',
    submittedBy: createdEics[0].userId,
    reviewedBy: 'Admin Lead'
  });

  // Evaluation 2: Contract 2 (Bharat Heavy) - SUBMITTED (Very Good)
  await createEvaluationRecord({
    evalNum: 'EVL-2026-00002',
    contract: createdContracts[1],
    eic: createdEics[1],
    vendor: createdVendors[1],
    evalDate: daysAgo(5),
    periodStart: daysAgo(60),
    periodEnd: daysAgo(6),
    scorePreset: [4, 4, 5, 4, 4, 4, 4, 4, 4, 4], // ~82%
    status: 'SUBMITTED',
    remarks: 'Consistent execution on turbine piping insulation with certified fitters.',
    observations: 'Piping hydro-test completed ahead of planned date. Recommended for timely milestone release.',
    submittedBy: createdEics[1].userId
  });

  // Evaluation 3: Contract 3 (Crestline Logistics) - RETURNED (Marginal / Satisfactory)
  await createEvaluationRecord({
    evalNum: 'EVL-2026-00003',
    contract: createdContracts[2],
    eic: createdEics[0],
    vendor: createdVendors[2],
    evalDate: daysAgo(7),
    periodStart: daysAgo(90),
    periodEnd: daysAgo(8),
    scorePreset: [3, 2, 3, 3, 2, 2, 3, 3, 3, 3], // ~54%
    status: 'RETURNED',
    remarks: 'Logistics fleet turnaround delayed due to maintenance downtime.',
    observations: 'Vehicle fitness certificates pending submission. Haulage tonnage met only 78% of target.',
    submittedBy: createdEics[0].userId,
    reviewedBy: 'Admin Lead',
    returnReason: 'Please re-verify the equipment breakdown logs and provide breakdown of delay penalties before resubmission.'
  });

  // Evaluation 4: Contract 4 (Delta HV Solutions) - APPROVED (Good)
  await createEvaluationRecord({
    evalNum: 'EVL-2026-00004',
    contract: createdContracts[3],
    eic: createdEics[3],
    vendor: createdVendors[3],
    evalDate: daysAgo(25),
    periodStart: daysAgo(120),
    periodEnd: daysAgo(26),
    scorePreset: [4, 3, 4, 4, 3, 4, 3, 3, 4, 4], // ~72%
    status: 'APPROVED',
    remarks: 'Final energization of 33kV switchyard completed safely.',
    observations: 'Relay coordination tests verified by regional grid inspectorate.',
    submittedBy: createdEics[3].userId,
    reviewedBy: 'Admin Lead'
  });

  // Evaluation 5: Contract 5 (Eastern Steel) - DRAFT (In Progress by EIC Ananya Verma)
  await createEvaluationRecord({
    evalNum: 'EVL-2026-00005',
    contract: createdContracts[4],
    eic: createdEics[2],
    vendor: createdVendors[4],
    evalDate: daysAgo(2),
    periodStart: daysAgo(40),
    periodEnd: daysAgo(2),
    scorePreset: [4, 4, 4, 3, 4, 3, 4, 3, 4, 3], // ~74%
    status: 'DRAFT',
    remarks: 'Preliminary foundry trial lot inspection satisfactory.',
    observations: 'Spectrometry chemical composition of high-chrome liners within specified tolerance.'
  });

  // 8. Create Sample Audit Trail
  console.log('[DEVELOPMENT SEED DATA] Creating audit trail entries...');
  await prisma.auditLog.createMany({
    data: [
      {
        userRole: 'ADMIN',
        userEmail: 'admin@enterprise.org',
        action: 'VENDOR_CREATED',
        entityType: 'VENDOR',
        entityId: createdVendors[0].id,
        newValue: JSON.stringify({ vendorCode: 'VND-2024-001', name: 'Apex Industrial Fabricators Ltd' }),
        ipAddress: '192.168.1.101',
        createdAt: daysAgo(65)
      },
      {
        userRole: 'ADMIN',
        userEmail: 'admin@enterprise.org',
        action: 'CONTRACT_CREATED',
        entityType: 'PO_LOA',
        entityId: createdContracts[0].id,
        newValue: JSON.stringify({ poNumber: 'PO/2026/PLANT-1/0101', valueWithTax: 5310000.00 }),
        ipAddress: '192.168.1.101',
        createdAt: daysAgo(60)
      },
      {
        userRole: 'ADMIN',
        userEmail: 'admin@enterprise.org',
        action: 'EIC_ASSIGNED',
        entityType: 'PO_LOA',
        entityId: createdContracts[0].id,
        newValue: JSON.stringify({ eicEmployeeId: 'EMP-EIC-101', eicName: 'Rajesh Sharma' }),
        ipAddress: '192.168.1.101',
        createdAt: daysAgo(60)
      },
      {
        userRole: 'EIC',
        userEmail: 'eic.sharma@enterprise.org',
        action: 'EVALUATION_SUBMITTED',
        entityType: 'EVALUATION',
        entityId: 'EVL-2026-00001',
        newValue: JSON.stringify({ totalWeightedScore: 94.0, ratingGrade: 'EXCELLENT' }),
        ipAddress: '192.168.1.145',
        createdAt: daysAgo(15)
      },
      {
        userRole: 'ADMIN',
        userEmail: 'admin@enterprise.org',
        action: 'EVALUATION_APPROVED',
        entityType: 'EVALUATION',
        entityId: 'EVL-2026-00001',
        newValue: JSON.stringify({ status: 'APPROVED', approvedBy: 'Alok Nath Mathur' }),
        ipAddress: '192.168.1.101',
        createdAt: daysAgo(14)
      }
    ]
  });

  // 9. Create Notifications
  console.log('[DEVELOPMENT SEED DATA] Creating notifications...');
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@enterprise.org' } });
  const eicUser = await prisma.user.findUnique({ where: { email: 'eic.sharma@enterprise.org' } });
  const vendorUser = await prisma.user.findUnique({ where: { email: 'vendor.apex@enterprise.org' } });

  if (adminUser) {
    await prisma.notification.create({
      data: {
        userId: adminUser.id,
        title: 'New Evaluation Submitted',
        message: 'EIC Suresh Patel submitted evaluation EVL-2026-00002 for LOA/2026/PLANT-2/0202 (Bharat Heavy Power Infra).',
        type: 'EVALUATION_SUBMITTED',
        actionUrl: '/evaluations/EVL-2026-00002'
      }
    });
  }

  if (eicUser) {
    await prisma.notification.create({
      data: {
        userId: eicUser.id,
        title: 'Evaluation Returned for Clarification',
        message: 'Evaluation EVL-2026-00003 for Crestline Logistics was returned with feedback: Please re-verify equipment breakdown logs.',
        type: 'EVALUATION_RETURNED',
        actionUrl: '/evaluations/EVL-2026-00003'
      }
    });
  }

  if (vendorUser) {
    await prisma.notification.create({
      data: {
        userId: vendorUser.id,
        title: 'Evaluation Approved and Published',
        message: 'Performance evaluation EVL-2026-00001 for PO/2026/PLANT-1/0101 has been approved with grade EXCELLENT (94.0%).',
        type: 'EVALUATION_APPROVED',
        actionUrl: '/my-evaluations'
      }
    });
  }

  console.log('[DEVELOPMENT SEED DATA] Successfully seeded all enterprise models.');
  console.log('[DEVELOPMENT SEED DATA] Admin login: admin@enterprise.org / Admin@123');
  console.log('[DEVELOPMENT SEED DATA] EIC login:   eic.sharma@enterprise.org / Eic@123');
  console.log('[DEVELOPMENT SEED DATA] Vendor login: vendor.apex@enterprise.org / Vendor@123');
}

main()
  .catch((e) => {
    console.error('[DEVELOPMENT SEED DATA] Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
