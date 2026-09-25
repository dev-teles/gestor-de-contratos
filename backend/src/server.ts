import express from 'express';
import { apiRouter } from './apiRouter';
import { backendDb } from './db';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

// CORS Configuration for frontend repository connection
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Payload parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root welcome & API info
app.get('/', (_req, res) => {
  res.json({
    name: 'Mais Contratos - Backend API Server',
    description: 'API REST Corporativa para Gestão de Contratos, Fornecedores e Auditoria',
    status: 'online',
    docs: '/api/health',
    endpoints: [
      '/api/health',
      '/api/contracts',
      '/api/suppliers',
      '/api/users',
      '/api/audit',
      '/api/settings',
      '/api/stats',
    ],
  });
});

// Mount API Gateway
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Backend Server Error]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Erro interno no servidor backend',
  });
});

async function main() {
  await backendDb.init();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 [Backend API] Servidor iniciado na porta ${PORT}`);
    console.log(`🔗 URL Base: http://localhost:${PORT}`);
    console.log(`🩺 Healthcheck: http://localhost:${PORT}/api/health`);
    console.log(`📋 Contratos: http://localhost:${PORT}/api/contracts`);
    console.log(`🏢 Fornecedores: http://localhost:${PORT}/api/suppliers`);
    console.log(`👥 Usuários: http://localhost:${PORT}/api/users`);
    console.log(`=======================================================`);
  });
}

main().catch((err) => {
  console.error('Falha crítica ao iniciar o backend:', err);
  process.exit(1);
});
