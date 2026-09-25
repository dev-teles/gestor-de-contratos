import { Router, Request, Response } from 'express';
import { backendDb } from '../db';
import { Supplier } from '../types';

const router = Router();

// GET /api/suppliers - List all suppliers
router.get('/', async (_req: Request, res: Response) => {
  try {
    const suppliers = await backendDb.getSuppliers();
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Erro ao listar fornecedores' });
  }
});

// GET /api/suppliers/:id - Get supplier by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supplier = await backendDb.getSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Fornecedor não encontrado' });
    }
    res.json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/suppliers - Create or update supplier
router.post('/', async (req: Request, res: Response) => {
  try {
    const body: Supplier = req.body;
    if (!body.razaoSocial || !body.id) {
      return res.status(400).json({ success: false, error: 'Dados incompletos (id e razaoSocial obrigatórios)' });
    }
    const saved = await backendDb.saveSupplier(body);

    await backendDb.addAuditLog({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: 'Lucas Teles (CLO)',
      role: 'administrador',
      action: 'Homologação de Parceiro',
      detail: `Novo parceiro homologado (CNPJ: ${body.cnpj}) cadastrado no backend.`,
      resource: body.razaoSocial,
      resourceType: 'fornecedor',
      type: 'add',
      severity: 'baixo',
      ip: req.ip || '127.0.0.1',
    });

    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await backendDb.getSupplierById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Fornecedor não encontrado' });
    }
    const updated = { ...existing, ...req.body, id };
    const saved = await backendDb.saveSupplier(updated);

    res.json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await backendDb.getSupplierById(id);
    const success = await backendDb.deleteSupplier(id);

    if (existing) {
      await backendDb.addAuditLog({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        user: 'Lucas Teles (CLO)',
        role: 'administrador',
        action: 'Descredenciamento de Fornecedor',
        detail: `Parceiro ${existing.razaoSocial} desvinculado e excluído via backend.`,
        resource: existing.razaoSocial,
        resourceType: 'fornecedor',
        type: 'delete',
        severity: 'alto',
        ip: req.ip || '127.0.0.1',
      });
    }

    res.json({ success, message: 'Fornecedor removido com sucesso' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
