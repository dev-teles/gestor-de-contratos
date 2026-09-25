import { Router, Request, Response } from 'express';
import { backendDb } from '../db';
import { Contract } from '../types';

const router = Router();

// GET /api/contracts - List all contracts
router.get('/', async (_req: Request, res: Response) => {
  try {
    const contracts = await backendDb.getContracts();
    res.json({ success: true, count: contracts.length, data: contracts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Erro ao listar contratos' });
  }
});

// GET /api/contracts/:id - Get contract by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contract = await backendDb.getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contrato não encontrado' });
    }
    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/contracts - Create or save a contract
router.post('/', async (req: Request, res: Response) => {
  try {
    const body: Contract = req.body;
    if (!body.title || !body.id) {
      return res.status(400).json({ success: false, error: 'Dados incompletos do contrato (id e title obrigatórios)' });
    }
    const saved = await backendDb.saveContract(body);

    // Auto-record audit log in backend
    await backendDb.addAuditLog({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: 'Lucas Teles (CLO)',
      role: 'administrador',
      action: 'Criação de Instrumento',
      detail: `Novo instrumento ${body.code || body.id} cadastrado via API Backend.`,
      resource: body.title,
      resourceType: 'contrato',
      type: 'add',
      severity: 'baixo',
      ip: req.ip || '127.0.0.1',
    });

    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/contracts/:id - Update contract
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await backendDb.getContractById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Contrato não encontrado' });
    }
    const updatedContract = { ...existing, ...req.body, id };
    const saved = await backendDb.saveContract(updatedContract);

    await backendDb.addAuditLog({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: 'Lucas Teles (CLO)',
      role: 'administrador',
      action: 'Atualização de Instrumento',
      detail: `Instrumento ${saved.code || id} atualizado no backend.`,
      resource: saved.title,
      resourceType: 'contrato',
      type: 'update',
      severity: 'baixo',
      ip: req.ip || '127.0.0.1',
    });

    res.json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/contracts/:id - Delete contract
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await backendDb.getContractById(id);
    const success = await backendDb.deleteContract(id);

    if (existing) {
      await backendDb.addAuditLog({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        user: 'Lucas Teles (CLO)',
        role: 'administrador',
        action: 'Exclusão de Instrumento',
        detail: `Instrumento ${existing.code || id} expurgado via Backend API.`,
        resource: existing.title,
        resourceType: 'contrato',
        type: 'delete',
        severity: 'alto',
        ip: req.ip || '127.0.0.1',
      });
    }

    res.json({ success, message: 'Contrato excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
