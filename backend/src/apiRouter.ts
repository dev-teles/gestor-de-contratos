import { Router } from 'express';
import contractsRouter from './routes/contracts';
import suppliersRouter from './routes/suppliers';
import usersRouter from './routes/users';
import auditRouter from './routes/audit';
import settingsRouter from './routes/settings';
import statsRouter from './routes/stats';

export const apiRouter = Router();

// Modular Route Mounts
apiRouter.use('/contracts', contractsRouter);
apiRouter.use('/suppliers', suppliersRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/audit', auditRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/stats', statsRouter);

// Backend Health Check
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Mais Contratos Dedicated Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});
