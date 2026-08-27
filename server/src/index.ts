import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { StorageService } from './services/storage.service.js';
import { SocketService } from './services/socket.service.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { ensureDatabaseReady } from './db/autoInit.js';

import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import systemRoutes from './routes/system.routes.js';

const app = express();
const server = http.createServer(app);

// 1. Trust Proxy (Render / Cloudflare / Nginx reverse proxy)
app.set('trust proxy', 1);

// 2. Initialize Storage
StorageService.init();

// 3. Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general API rate limiting to /api routes
app.use('/api', apiLimiter);

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/system', systemRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 5. Serve Frontend in Production / Hosting
let clientDistPath = path.resolve(process.cwd(), 'client/dist');
if (!fs.existsSync(clientDistPath)) {
  clientDistPath = path.resolve(process.cwd(), '../client/dist');
}

if (fs.existsSync(clientDistPath)) {
  console.log(`📁 Serving client build from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.status(200).send('Private Duo Chat API Server is running. Client build not found in dist.');
  });
}

// 6. Initialize Real-Time WebSockets
SocketService.init(server);

// 7. Initialize Database and Start Pure Standalone Server
async function start() {
  await ensureDatabaseReady();

  server.listen(config.port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 ChatUs PRO Social Messenger Server running on port ${config.port}`);
    console.log(`✨ Universal Multi-User Platform Ready with HD WebRTC Voice & Video`);
    console.log(`🌐 Local Web: http://localhost:${config.port}`);
    console.log(`======================================================\n`);
  });
}

start();

export default app;
