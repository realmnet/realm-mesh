import WebSocket, { WebSocketServer } from 'ws';
import { Pool } from 'pg';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

import { RealmService } from './services/realm-service';
import { WebSocketHandler } from './handlers/websocket-handler';
import { createRealmsRouter } from './routes/realms';
import { createMetricsRouter } from './routes/metrics';
import { RealmInfo, PendingRequest, LoopState, ExtendedWebSocket } from './types';

dotenv.config();

// Function to kill processes on specified ports
function killPortProcesses(ports: number[]): void {
  ports.forEach(port => {
    try {
      const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
      if (pid) {
        execSync(`kill -9 ${pid}`);
        console.log(`Killed process ${pid} on port ${port}`);
      }
    } catch (error) {
      // Port not in use, which is fine
    }
  });
}

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/realmmesh'
});

// Services
const realmService = new RealmService(pool);

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// In-memory state
const routeTable = new Map<string, RealmInfo>();
const pendingRequests = new Map<string, PendingRequest | LoopState>();
const eventRegistry = new Map<string, Set<ExtendedWebSocket>>();

// WebSocket servers
const server = createServer(app);
const internalWss = new WebSocketServer({ port: 8080 });
const externalWss = new WebSocketServer({ port: 8443 });
const adminWss = new WebSocketServer({ server });

// WebSocket handler
const wsHandler = new WebSocketHandler(
  realmService,
  routeTable,
  pendingRequests,
  eventRegistry,
  adminWss,
  pool
);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'RealmMesh Gateway', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Routes
app.use('/api/realms', createRealmsRouter(realmService, routeTable));
app.use('/api/metrics', createMetricsRouter(routeTable, pendingRequests, eventRegistry));

// WebSocket connections
internalWss.on('connection', (ws: WebSocket) =>
  wsHandler.handleConnection(ws as ExtendedWebSocket, false)
);

externalWss.on('connection', (ws: WebSocket) =>
  wsHandler.handleConnection(ws as ExtendedWebSocket, true)
);

adminWss.on('connection', async (ws: WebSocket) =>
  await wsHandler.handleAdminConnection(ws)
);

// Startup
// killPortProcesses([3001, 8080, 8443]); // Temporarily disabled - causing issues

server.listen(3001, () => {
  console.log('🚀 RealmMesh Gateway started');
  console.log('📊 Admin API: http://localhost:3001');
  console.log('🔌 Admin WebSocket: ws://localhost:3001');
  console.log('🏠 Internal Gateway: ws://localhost:8080');
  console.log('🌐 External Gateway: ws://localhost:8443');
});

// Cleanup old requests periodically
setInterval(() => {
  const now = Date.now();
  for (const [requestId, pending] of pendingRequests.entries()) {
    // Check if it's a PendingRequest (has timestamp) or LoopState (has startTime)
    const timestamp = 'timestamp' in pending ? pending.timestamp : (pending as LoopState).startTime;
    if (now - timestamp > 60000) { // 1 minute timeout
      pendingRequests.delete(requestId);
    }
  }
}, 30000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gateway...');
  pool.end();
  process.exit(0);
});