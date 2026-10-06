import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import * as evaluationService from '../services/evaluation.service.js';

export async function listEvaluations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await evaluationService.listEvaluations(req.query, req.user!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getEvaluation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const evaluation = await evaluationService.getEvaluationById(String(req.params.id), req.user!);
    res.json({ success: true, evaluation });
  } catch (error) {
    next(error);
  }
}

export async function createEvaluationDraft(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const evaluation = await evaluationService.createEvaluationDraft(req.body, req.user!, ip);
    res.status(201).json({ success: true, evaluation });
  } catch (error) {
    next(error);
  }
}

export async function updateEvaluationScores(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const evaluation = await evaluationService.updateEvaluationScores(String(req.params.id), req.body, req.user!, ip);
    res.json({ success: true, evaluation });
  } catch (error) {
    next(error);
  }
}

export async function submitEvaluation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const evaluation = await evaluationService.submitEvaluation(String(req.params.id), req.user!, ip);
    res.json({ success: true, evaluation });
  } catch (error) {
    next(error);
  }
}

export async function approveEvaluation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const evaluation = await evaluationService.approveEvaluation(String(req.params.id), req.user!, ip);
    res.json({ success: true, evaluation });
  } catch (error) {
    next(error);
  }
}

export async function returnEvaluation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reason } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const evaluation = await evaluationService.returnEvaluation(String(req.params.id), reason, req.user!, ip);
    res.json({ success: true, evaluation });
  } catch (error) {
    next(error);
  }
}
