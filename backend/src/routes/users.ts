import { Router, Request, Response } from 'express';
import { backendDb } from '../db';
import { UserAccountItem } from '../types';

const router = Router();

// GET /api/users - List collaborators/users
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await backendDb.getUsers();
    res.json({ success: true, count: users.length, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Erro ao listar colaboradores' });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await backendDb.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Colaborador não encontrado' });
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users - Create new collaborator
router.post('/', async (req: Request, res: Response) => {
  try {
    const body: UserAccountItem = req.body;
    if (!body.name || !body.email || !body.id) {
      return res.status(400).json({ success: false, error: 'Dados obrigatórios faltando (id, name, email)' });
    }
    const created = await backendDb.createUser(body);

    await backendDb.addAuditLog({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: 'Lucas Teles (CLO)',
      role: 'administrador',
      action: 'Admissão de Colaborador',
      detail: `Novo colaborador (${body.email} / Perfil: ${body.role}) provisionado via backend.`,
      resource: body.name,
      resourceType: 'seguranca',
      type: 'add',
      severity: 'baixo',
      ip: req.ip || '127.0.0.1',
    });

    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/users/:id - Update collaborator role/status
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await backendDb.updateUser(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Colaborador não encontrado' });
    }

    await backendDb.addAuditLog({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: 'Lucas Teles (CLO)',
      role: 'administrador',
      action: 'Alteração de Acesso RBAC',
      detail: `Permissões/Status atualizados para o colaborador ${updated.email}.`,
      resource: updated.name,
      resourceType: 'seguranca',
      type: 'permission',
      severity: 'medio',
      ip: req.ip || '127.0.0.1',
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/users/:id - Delete collaborator
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await backendDb.getUserById(id);
    const success = await backendDb.deleteUser(id);

    if (existing) {
      await backendDb.addAuditLog({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        user: 'Lucas Teles (CLO)',
        role: 'administrador',
        action: 'Revogação de Conta',
        detail: `Conta corporativa ${existing.email} revogada no backend.`,
        resource: existing.name,
        resourceType: 'seguranca',
        type: 'delete',
        severity: 'alto',
        ip: req.ip || '127.0.0.1',
      });
    }

    res.json({ success, message: 'Colaborador removido com sucesso' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
