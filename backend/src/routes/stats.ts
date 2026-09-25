import { Router, Request, Response } from 'express';
import { backendDb } from '../db';

const router = Router();

// GET /api/stats - Executive and operational metrics aggregated by the backend
router.get('/', async (_req: Request, res: Response) => {
  try {
    const contracts = await backendDb.getContracts();
    const suppliers = await backendDb.getSuppliers();
    const users = await backendDb.getUsers();

    const totalFinancialValue = contracts.reduce((acc, c) => acc + (c.totalValue || 0), 0);
    const activeContracts = contracts.filter((c) => c.status === 'vigente').length;
    const expiringSoonContracts = contracts.filter((c) => c.status === 'avencer').length;
    const pendingSignatureContracts = contracts.filter((c) => c.status === 'sem_assinatura').length;
    const expiredContracts = contracts.filter((c) => c.status === 'expirado').length;

    res.json({
      success: true,
      data: {
        totalContracts: contracts.length,
        totalFinancialValue,
        activeContracts,
        expiringSoonContracts,
        pendingSignatureContracts,
        expiredContracts,
        totalSuppliers: suppliers.length,
        totalUsers: users.length,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Erro ao calcular métricas' });
  }
});

export default router;
