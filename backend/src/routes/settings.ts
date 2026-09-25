import { Router, Request, Response } from 'express';
import { backendDb } from '../db';

const router = Router();

// GET /api/settings - Get system settings
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await backendDb.getSettings();
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Erro ao carregar configurações' });
  }
});

// PUT /api/settings - Update system settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const updated = await backendDb.updateSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
