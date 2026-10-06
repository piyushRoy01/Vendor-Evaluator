export const USER_ROLES = {
  ADMIN: 'ADMIN',
  EIC: 'EIC',
  VENDOR: 'VENDOR'
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const CONTRACT_TYPES = {
  PO: 'PO',
  LOA: 'LOA'
} as const;

export const CONTRACT_STATUSES = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  NEAR_COMPLETION: 'NEAR_COMPLETION',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  SUSPENDED: 'SUSPENDED'
} as const;

export const EVALUATION_STATUSES = {
  DRAFT: 'DRAFT',
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  REVIEWED: 'REVIEWED',
  APPROVED: 'APPROVED',
  RETURNED: 'RETURNED',
  REVISED: 'REVISED',
  LOCKED: 'LOCKED'
} as const;

export const RATING_GRADES = {
  EXCELLENT: 'EXCELLENT',
  VERY_GOOD: 'VERY_GOOD',
  GOOD: 'GOOD',
  SATISFACTORY: 'SATISFACTORY',
  UNSATISFACTORY: 'UNSATISFACTORY'
} as const;

export const DEFAULT_RATING_THRESHOLDS = [
  { grade: 'EXCELLENT', minScore: 90.0, maxScore: 100.0, description: 'Outstanding performance meeting and exceeding all requirements.' },
  { grade: 'VERY_GOOD', minScore: 75.0, maxScore: 89.99, description: 'Consistently high performance meeting all standards.' },
  { grade: 'GOOD', minScore: 60.0, maxScore: 74.99, description: 'Acceptable performance with minor deficiencies.' },
  { grade: 'SATISFACTORY', minScore: 50.0, maxScore: 59.99, description: 'Marginal performance needing immediate operational attention.' },
  { grade: 'UNSATISFACTORY', minScore: 0.0, maxScore: 49.99, description: 'Substandard performance requiring contractual corrective action.' }
];
