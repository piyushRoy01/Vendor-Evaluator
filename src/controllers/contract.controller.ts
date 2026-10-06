import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import * as contractService from '../services/contract.service.js';

export async function listContracts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await contractService.listContracts(req.query, req.user!);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getContract(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const contract = await contractService.getContractById(String(req.params.id), req.user!);
    res.json({ success: true, contract });
  } catch (error) {
    next(error);
  }
}

export async function createContract(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const contract = await contractService.createContract(req.body, req.user!, ip);
    res.status(201).json({ success: true, contract });
  } catch (error) {
    next(error);
  }
}

export async function updateContract(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const contract = await contractService.updateContract(String(req.params.id), req.body, req.user!, ip);
    res.json({ success: true, contract });
  } catch (error) {
    next(error);
  }
}

export async function assignEic(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { eicId } = req.body;
    if (!eicId) {
      res.status(400).json({ success: false, message: 'eicId is required for assignment.', errorCode: 'MISSING_EIC_ID' });
      return;
    }
    const ip = req.ip || req.socket.remoteAddress;
    const contract = await contractService.assignEic(String(req.params.id), eicId, req.user!, ip);
    res.json({ success: true, contract });
  } catch (error) {
    next(error);
  }
}

export async function updateContractStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const contract = await contractService.updateContract(String(req.params.id), { contractStatus: status }, req.user!, ip);
    res.json({ success: true, contract });
  } catch (error) {
    next(error);
  }
}
