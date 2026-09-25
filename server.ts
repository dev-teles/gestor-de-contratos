import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './backend/src/apiRouter';
import { backendDb } from './backend/src/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Middleware for parsing JSON and URL-encoded bodies
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Basic CORS & Security headers for backend
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Initialize Backend DB connection
  await backendDb.init();

  // Mount Dedicated Backend API
  app.use('/api', apiRouter);

  // Frontend Integration Layer
  if (!isProd) {
    // Mount Vite Dev Server in middleware mode
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Full-Stack Server] Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 [Backend API] Available at http://0.0.0.0:${PORT}/api`);
  });
}

startServer().catch((err) => {
  console.error('[Full-Stack Server] Fatal server startup error:', err);
  process.exit(1);
});
