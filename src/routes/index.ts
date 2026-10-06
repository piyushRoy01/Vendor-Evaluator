import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import * as authCtrl from '../controllers/auth.controller.js';
import * as vendorCtrl from '../controllers/vendor.controller.js';
import * as eicCtrl from '../controllers/eic.controller.js';
import * as contractCtrl from '../controllers/contract.controller.js';
import * as evaluationCtrl from '../controllers/evaluation.controller.js';
import * as reportCtrl from '../controllers/report.controller.js';
import * as auditCtrl from '../controllers/audit.controller.js';

const router = Router();

// Authentication
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticateToken, authCtrl.getMe);

// Vendors
router.get('/vendors', authenticateToken, vendorCtrl.listVendors);
router.post('/vendors', authenticateToken, requireRole('ADMIN'), vendorCtrl.createVendor);
router.get('/vendors/:id', authenticateToken, vendorCtrl.getVendor);
router.put('/vendors/:id', authenticateToken, requireRole('ADMIN'), vendorCtrl.updateVendor);
router.patch('/vendors/:id/status', authenticateToken, requireRole('ADMIN'), vendorCtrl.updateVendorStatus);

// EIC
router.get('/eics', authenticateToken, requireRole('ADMIN', 'EIC'), eicCtrl.listEics);
router.post('/eics', authenticateToken, requireRole('ADMIN'), eicCtrl.createEic);
router.get('/eics/:id', authenticateToken, eicCtrl.getEic);
router.put('/eics/:id', authenticateToken, requireRole('ADMIN'), eicCtrl.updateEic);

// Contracts (PO / LOA)
router.get('/contracts', authenticateToken, contractCtrl.listContracts);
router.post('/contracts', authenticateToken, requireRole('ADMIN'), contractCtrl.createContract);
router.get('/contracts/:id', authenticateToken, contractCtrl.getContract);
router.put('/contracts/:id', authenticateToken, requireRole('ADMIN'), contractCtrl.updateContract);
router.patch('/contracts/:id/assign-eic', authenticateToken, requireRole('ADMIN'), contractCtrl.assignEic);
router.patch('/contracts/:id/status', authenticateToken, requireRole('ADMIN'), contractCtrl.updateContractStatus);

// Evaluations
router.get('/evaluations', authenticateToken, evaluationCtrl.listEvaluations);
router.post('/evaluations', authenticateToken, requireRole('EIC'), evaluationCtrl.createEvaluationDraft);
router.get('/evaluations/:id', authenticateToken, evaluationCtrl.getEvaluation);
router.put('/evaluations/:id', authenticateToken, requireRole('EIC'), evaluationCtrl.updateEvaluationScores);
router.post('/evaluations/:id/submit', authenticateToken, requireRole('EIC'), evaluationCtrl.submitEvaluation);
router.post('/evaluations/:id/approve', authenticateToken, requireRole('ADMIN'), evaluationCtrl.approveEvaluation);
router.post('/evaluations/:id/return', authenticateToken, requireRole('ADMIN'), evaluationCtrl.returnEvaluation);

// Reports & Analytics
router.get('/reports/dashboard', authenticateToken, reportCtrl.getDashboard);
router.get('/reports/vendors', authenticateToken, requireRole('ADMIN'), reportCtrl.getVendorMasterReport);
router.get('/reports/contracts', authenticateToken, requireRole('ADMIN'), reportCtrl.getContractReport);
router.get('/reports/performance', authenticateToken, requireRole('ADMIN'), reportCtrl.getPerformanceReport);

// Audit Logs
router.get('/audit', authenticateToken, requireRole('ADMIN'), auditCtrl.listAuditLogs);

// Notifications
router.get('/notifications', authenticateToken, auditCtrl.listNotifications);
router.patch('/notifications/:id/read', authenticateToken, auditCtrl.markNotificationAsRead);
router.post('/notifications/mark-all-read', authenticateToken, auditCtrl.markAllNotificationsRead);

// Criteria & Thresholds
router.get('/criteria', authenticateToken, auditCtrl.listCriteria);
router.put('/criteria/:id', authenticateToken, requireRole('ADMIN'), auditCtrl.updateCriterion);

export default router;
