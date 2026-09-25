import { Router, Request, Response } from 'express';
import { backendDb } from '../db';
import { AuditLog } from '../types';

const router = Router();

// GET /api/audit - List audit logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const logs = await backendDb.getAuditLogs(limit);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Erro ao carregar auditoria' });
  }
});

// POST /api/audit - Add manual or external audit log
router.post('/', async (req: Request, res: Response) => {
  try {
    const body: AuditLog = req.body;
    if (!body.action || !body.user) {
      return res.status(400).json({ success: false, error: 'Ação e usuário são obrigatórios para auditoria' });
    }
    const log: AuditLog = {
      ...body,
      id: body.id || `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: body.timestamp || new Date().toISOString(),
      ip: req.ip || body.ip || '127.0.0.1',
    };
    const saved = await backendDb.addAuditLog(log);
    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
