export type UserRole = 'ADMIN' | 'EIC' | 'VENDOR';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  profile?: {
    id: string;
    name?: string;
    employeeId?: string;
    vendorCode?: string;
    vendorName?: string;
    company?: string;
    department?: string;
  };
}

export interface Vendor {
  id: string;
  userId: string;
  vendorCode: string;
  vendorName: string;
  pan: string;
  gstn: string;
  email: string;
  mobile: string;
  bankAccountNumber: string;
  ifscCode: string;
  typeOfFirm: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED' | 'SUSPENDED';
  contractsCount?: number;
  evaluationsCount?: number;
  averagePerformanceScore?: number | null;
  createdAt: string;
  updatedAt: string;
  contracts?: Contract[];
  evaluations?: Evaluation[];
}

export interface Eic {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  company: string;
  mobile: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  assignedContractsCount?: number;
  completedEvaluationsCount?: number;
  averageEvaluationScore?: number | null;
  createdAt: string;
  updatedAt: string;
  assignedVendors?: Array<{ id: string; vendorCode: string; vendorName: string }>;
  contracts?: Contract[];
}

export interface Contract {
  id: string;
  poNumber: string;
  contractType: 'PO' | 'LOA';
  poDate: string;
  completionDate: string;
  daysRemaining?: number;
  urgencyLevel?: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OVERDUE' | 'CLOSED';
  poValueWithoutTax: number;
  poValueWithTax: number;
  plantCode: string;
  contractStatus: 'DRAFT' | 'ACTIVE' | 'NEAR_COMPLETION' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  description?: string | null;
  vendorId: string;
  eicId: string;
  vendor?: {
    id: string;
    vendorCode: string;
    vendorName: string;
    email: string;
    mobile: string;
    status: string;
    typeOfFirm?: string;
    pan?: string;
    gstn?: string;
  };
  eic?: {
    id: string;
    employeeId: string;
    name: string;
    company: string;
    email: string;
    mobile: string;
    status?: string;
  };
  evaluationsCount?: number;
  evaluations?: Evaluation[];
  latestEvaluation?: {
    id: string;
    evaluationNumber: string;
    percentage: number;
    ratingGrade: string;
    status: string;
    evaluationDate: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  code: string;
  description: string;
  weight: number;
  maxScore: number;
  sortOrder: number;
  isActive: boolean;
}

export interface EvaluationScoreItem {
  id: string;
  evaluationId: string;
  criterionId: string;
  criterionNameSnapshot: string;
  weightSnapshot: number;
  maxScoreSnapshot: number;
  score: number;
  weightedScore: number;
  remarks?: string | null;
}

export interface Evaluation {
  id: string;
  evaluationNumber: string;
  poId: string;
  eicId: string;
  vendorId: string;
  evaluationDate: string;
  periodStart: string;
  periodEnd: string;
  totalWeightedScore: number;
  percentage: number;
  ratingGrade: 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'SATISFACTORY' | 'UNSATISFACTORY';
  status: 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'RETURNED' | 'REVISED' | 'LOCKED';
  remarks?: string | null;
  observations?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  returnReason?: string | null;
  version: number;
  contract?: Contract;
  vendor?: {
    id: string;
    vendorCode: string;
    vendorName: string;
  };
  eic?: {
    id: string;
    employeeId: string;
    name: string;
    company: string;
  };
  scores?: EvaluationScoreItem[];
}

export interface RatingThreshold {
  id: string;
  grade: string;
  minScore: number;
  maxScore: number;
  description: string;
  badgeStyle: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userRole: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string | null;
  createdAt: string;
}
