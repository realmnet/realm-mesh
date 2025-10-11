import WebSocket, { WebSocketServer } from 'ws';
import { Pool } from 'pg';
import { createServer } from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import {
  RealmInfo,
  PendingRequest,
  LoopState,
  Directory,
  Message,
  RegisterRealmPayload,
  ServiceCallPayload,
  ServiceResponsePayload,
  LoopInitiatePayload,
  LoopRecruitmentResponsePayload,
  EventPublishPayload,
  EventSubscribePayload,
  RealmRecord,
  ExtendedWebSocket
} from './types';

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

// Express for admin API
const app = express();
app.use(cors());
app.use(express.json());

// Route table: realmId → { socket, services, capabilities, policies }
const routeTable = new Map<string, RealmInfo>();

// Pending requests: requestId → { fromSocket, timestamp }
const pendingRequests = new Map<string, PendingRequest | LoopState>();

// Event registry: topic → Set of subscriber sockets
const eventRegistry = new Map<string, Set<ExtendedWebSocket>>();

// WebSocket servers
const server = createServer(app);
const internalWss = new WebSocketServer({ port: 8080 });
const externalWss = new WebSocketServer({ port: 8443 });

// Admin WebSocket for console
const adminWss = new WebSocketServer({ server });

// ============================================
// Core Gateway Functions
// ============================================

async function loadRealmPolicies(realmId: string): Promise<string[]> {
  const result = await pool.query(`
    WITH RECURSIVE realm_tree AS (
      SELECT id, parent_id, policies, inherit_policies
      FROM realms
      WHERE id = $1
      UNION ALL
      SELECT r.id, r.parent_id, r.policies, r.inherit_policies
      FROM realms r
      INNER JOIN realm_tree rt ON r.id = rt.parent_id
      WHERE rt.inherit_policies = true
    )
    SELECT array_agg(DISTINCT policy ORDER BY policy) as all_policies
    FROM realm_tree, unnest(policies) as policy
  `, [realmId]);

  return result.rows[0]?.all_policies || [];
}

async function buildDirectory(realmId: string, policies: string[], isExternal: boolean): Promise<Directory> {
  const directory: Directory = {
    availableServices: {},
    availableCapabilities: [],
    events: {}
  };

  // Get all services from route table (real-time)
  for (const [targetRealmId, info] of routeTable.entries()) {
    // External can only see public
    if (isExternal && !targetRealmId.startsWith('public.')) continue;

    if (await canAccess(realmId, targetRealmId, policies, isExternal)) {
      directory.availableServices[targetRealmId] = info.services || [];
      directory.availableCapabilities = [...directory.availableCapabilities, ...info.capabilities];
    }
  }

  // Get available events
  for (const [topic, subscribers] of eventRegistry.entries()) {
    if (canSubscribeToEvent(realmId, topic, policies)) {
      directory.events[topic] = {
        publishers: Array.from(subscribers).map(s => s.subscriberRealmId || '')
      };
    }
  }

  return directory;
}

async function canAccess(fromRealm: string, toRealm: string, policies: string[], isExternal: boolean): Promise<boolean> {
  // External can only access public
  if (isExternal && !toRealm.startsWith('public.')) return false;

  // Check explicit allow policy
  if (policies.includes(`allow:${toRealm}`)) return true;
  if (policies.includes(`allow:*`)) return true;

  // Check pattern-based policies
  for (const policy of policies) {
    if (policy.startsWith('allow:') && policy.includes('*')) {
      const pattern = policy.replace('allow:', '').replace(/\*/g, '.*');
      if (new RegExp(`^${pattern}$`).test(toRealm)) return true;
    }
  }

  // Same namespace = allowed by default
  const fromNamespace = fromRealm.split('.').slice(0, 2).join('.');
  const toNamespace = toRealm.split('.').slice(0, 2).join('.');
  if (fromNamespace === toNamespace) return true;

  return false;
}

function canSubscribeToEvent(realmId: string, topic: string, policies: string[]): boolean {
  if (policies.includes(`subscribe:${topic}`)) return true;
  if (policies.includes('subscribe:*')) return true;

  // Pattern matching
  for (const policy of policies) {
    if (policy.startsWith('subscribe:') && policy.includes('*')) {
      const pattern = policy.replace('subscribe:', '').replace(/\*/g, '.*');
      if (new RegExp(`^${pattern}$`).test(topic)) return true;
    }
  }

  return false;
}

// ============================================
// WebSocket Message Handlers
// ============================================

async function handleConnection(ws: ExtendedWebSocket, isExternal: boolean = false): Promise<void> {
  let realmId: string | null = null;
  let realmInfo: RealmInfo | null = null;

  ws.on('message', async (data) => {
    try {
      const msg: Message = JSON.parse(data.toString());

      switch (msg.type) {
        case 'register-realm':
          await handleRegisterRealm(ws, msg, isExternal);
          realmId = (msg.payload as RegisterRealmPayload).realmId;
          realmInfo = routeTable.get(realmId) || null;
          break;

        case 'service-call':
          await handleServiceCall(ws, msg, realmId, isExternal);
          break;

        case 'service-response':
          handleServiceResponse(msg);
          break;

        case 'loop-initiate':
          await handleLoopInitiate(ws, msg, realmId);
          break;

        case 'loop-recruitment-response':
          handleLoopRecruitmentResponse(msg);
          break;

        case 'event-publish':
          await handleEventPublish(ws, msg, realmId);
          break;

        case 'event-subscribe':
          handleEventSubscribe(ws, msg, realmId);
          break;

        default:
          console.warn(`Unknown message type: ${msg.type}`);
      }
    } catch (error) {
      console.error('Message handling error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        payload: { error: (error as Error).message }
      }));
    }
  });

  ws.on('close', () => {
    if (realmId) {
      routeTable.delete(realmId);

      // Clean up services from database
      pool.query('DELETE FROM realm_services WHERE realm_id = $1', [realmId])
        .catch(err => console.error('Cleanup error:', err));

      // Notify admin console
      broadcastToAdmin({
        type: 'realm-disconnected',
        payload: { realmId }
      });

      console.log(`Disconnected: ${realmId}`);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${realmId}:`, error);
  });
}

async function handleRegisterRealm(ws: ExtendedWebSocket, msg: Message, isExternal: boolean): Promise<void> {
  const { realmId, services = [], capabilities = [], authToken } = msg.payload as RegisterRealmPayload;

  // Verify realm exists in database
  const realmCheck = await pool.query(
    'SELECT id, route_to, auth_token FROM realms WHERE id = $1',
    [realmId]
  );

  if (realmCheck.rows.length === 0) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { error: 'Unknown realm' }
    }));
    ws.close();
    return;
  }

  // Verify auth token if required
  const realm: RealmRecord = realmCheck.rows[0];
  if (realm.auth_token && realm.auth_token !== authToken) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { error: 'Invalid auth token' }
    }));
    ws.close();
    return;
  }

  // Add to route table
  ws.realmId = realmId; // Tag the socket
  routeTable.set(realmId, {
    socket: ws,
    services,
    capabilities,
    isExternal,
    connectedAt: new Date()
  });

  // Store services in database
  if (services.length > 0) {
    await pool.query(
      'INSERT INTO realm_services (realm_id, service_name) VALUES ($1, unnest($2::text[])) ON CONFLICT DO NOTHING',
      [realmId, services]
    );
  }

  // Load policies (inherited from tree)
  const policies = await loadRealmPolicies(realmId);

  // Build discovery directory
  const directory = await buildDirectory(realmId, policies, isExternal);

  // Send discovery response
  ws.send(JSON.stringify({
    type: 'discovery-response',
    payload: {
      realmId,
      policies,
      ...directory
    }
  }));

  // Notify admin console
  broadcastToAdmin({
    type: 'realm-connected',
    payload: {
      realmId,
      services,
      capabilities,
      isExternal,
      connectedAt: new Date()
    }
  });

  // Broadcast service availability to other realms
  broadcastServiceUpdate(realmId, services, capabilities);

  console.log(`Registered: ${realmId} with ${services.length} services`);
}

async function handleServiceCall(ws: ExtendedWebSocket, msg: Message, callerRealmId: string | null, isExternal: boolean): Promise<void> {
  if (!callerRealmId) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { error: 'Not registered' }
    }));
    return;
  }

  const { requestId, capability, service, input } = msg.payload as ServiceCallPayload;

  // Find target realm that handles this capability
  let targetRealm: string | null = null;
  let targetInfo: RealmInfo | null = null;

  for (const [realmId, info] of routeTable.entries()) {
    if (info.capabilities.includes(capability) ||
        info.services.includes(service) ||
        realmId === capability) {
      targetRealm = realmId;
      targetInfo = info;
      break;
    }
  }

  if (!targetInfo) {
    ws.send(JSON.stringify({
      type: 'service-response',
      payload: {
        requestId,
        error: `No realm handles ${capability}.${service}`
      }
    }));
    return;
  }

  // Check access control
  const policies = await loadRealmPolicies(callerRealmId);
  if (!await canAccess(callerRealmId, targetRealm!, policies, isExternal)) {
    ws.send(JSON.stringify({
      type: 'service-response',
      payload: {
        requestId,
        error: 'Access denied'
      }
    }));
    return;
  }

  // Track pending request
  pendingRequests.set(requestId, {
    fromSocket: ws,
    timestamp: Date.now()
  });

  // Forward to target
  targetInfo.socket.send(JSON.stringify({
    type: 'service-call',
    payload: {
      requestId,
      capability,
      service,
      input,
      callerRealm: callerRealmId
    }
  }));

  // Log for monitoring
  console.log(`Routing: ${callerRealmId} → ${targetRealm}.${service}`);
}

function handleServiceResponse(msg: Message): void {
  const { requestId } = msg.payload as ServiceResponsePayload;
  const pending = pendingRequests.get(requestId) as PendingRequest;

  if (pending) {
    pending.fromSocket.send(JSON.stringify(msg));
    pendingRequests.delete(requestId);
  }
}

async function handleLoopInitiate(ws: ExtendedWebSocket, msg: Message, initiatorRealmId: string | null): Promise<void> {
  if (!initiatorRealmId) return;

  const { loopId, capability, loopName, input, options } = msg.payload as LoopInitiatePayload;

  // Broadcast recruitment to all capable agents
  const recruitmentMessage = {
    type: 'loop-recruitment',
    payload: {
      loopId,
      loopName,
      capability,
      initiator: initiatorRealmId,
      recruitmentMessage: input,
      deadline: new Date(Date.now() + (options?.recruitmentTimeout || 5000)),
      options
    }
  };

  // Track loop state
  const loopState: LoopState = {
    id: loopId,
    name: loopName,
    capability,
    input,
    options: options || {},
    initiator: ws,
    initiatorRealmId: initiatorRealmId || 'unknown',
    phase: 'recruitment',
    participants: [],
    recruitmentResponses: [],
    executionResults: [],
    startTime: Date.now()
  };

  pendingRequests.set(loopId, loopState);

  // Broadcast to all realms
  for (const [realmId, info] of routeTable.entries()) {
    if (realmId !== initiatorRealmId) {
      info.socket.send(JSON.stringify(recruitmentMessage));
    }
  }

  // Timeout for recruitment phase
  setTimeout(() => {
    executeLoop(loopId, input);
  }, options?.recruitmentTimeout || 5000);
}

function handleLoopRecruitmentResponse(msg: Message): void {
  const { loopId, agentId, accepts, bid } = msg.payload as LoopRecruitmentResponsePayload;
  const loopState = pendingRequests.get(loopId) as LoopState;

  if (loopState && loopState.phase === 'recruitment') {
    loopState.recruitmentResponses.push({
      agentId,
      accepts,
      bid,
      timestamp: Date.now()
    });

    if (accepts) {
      loopState.participants.push(agentId);
    }
  }
}

function executeLoop(loopId: string, input: any): void {
  const loopState = pendingRequests.get(loopId) as LoopState;
  if (!loopState) return;

  loopState.phase = 'execution';

  // Send execution message to all participants
  for (const participant of loopState.participants) {
    // Implementation depends on your agent coordination logic
  }

  // For now, send a simple completion
  loopState.initiator.send(JSON.stringify({
    type: 'loop-response',
    payload: {
      loopId,
      result: {
        participants: loopState.participants,
        aggregatedResult: {}
      }
    }
  }));

  pendingRequests.delete(loopId);
}

async function handleEventPublish(ws: ExtendedWebSocket, msg: Message, publisherRealmId: string | null): Promise<void> {
  if (!publisherRealmId) return;

  const { capability, eventName, topic, payload } = msg.payload as EventPublishPayload;

  // Get subscribers for this topic
  const subscribers = eventRegistry.get(topic) || new Set();

  // Check publisher's permission to publish
  const policies = await loadRealmPolicies(publisherRealmId);
  if (!policies.includes(`publish:${topic}`) && !policies.includes('publish:*')) {
    console.warn(`${publisherRealmId} not authorized to publish to ${topic}`);
    return;
  }

  // Forward to all subscribers
  for (const subscriberSocket of subscribers) {
    if (subscriberSocket !== ws && subscriberSocket.readyState === WebSocket.OPEN) {
      subscriberSocket.send(JSON.stringify({
        type: 'event',
        payload: {
          capability,
          eventName,
          topic,
          payload,
          publisher: publisherRealmId,
          timestamp: new Date()
        }
      }));
    }
  }

  console.log(`Event: ${publisherRealmId} → ${topic} (${subscribers.size} subscribers)`);
}

function handleEventSubscribe(ws: ExtendedWebSocket, msg: Message, subscriberRealmId: string | null): void {
  if (!subscriberRealmId) return;

  const { topic } = msg.payload as EventSubscribePayload;

  if (!eventRegistry.has(topic)) {
    eventRegistry.set(topic, new Set());
  }

  ws.subscriberRealmId = subscriberRealmId;
  eventRegistry.get(topic)!.add(ws);

  console.log(`${subscriberRealmId} subscribed to ${topic}`);
}

// ============================================
// Admin & Monitoring Functions
// ============================================

function broadcastToAdmin(message: Message): void {
  adminWss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function broadcastServiceUpdate(realmId: string, services: string[], capabilities: string[]): void {
  const updateMessage = {
    type: 'service-available',
    payload: {
      realmId,
      services,
      capabilities
    }
  };

  for (const [otherRealmId, info] of routeTable.entries()) {
    if (otherRealmId !== realmId && info.socket.readyState === WebSocket.OPEN) {
      info.socket.send(JSON.stringify(updateMessage));
    }
  }
}

// ============================================
// API Key Middleware
function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validApiKey = process.env.ADMIN_API_KEY || 'admin-key-123';

  if (!apiKey || apiKey !== validApiKey) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }

  next();
}

// ============================================
// Admin REST API
// ============================================

app.get('/api/realms', requireApiKey, async (req: Request, res: Response) => {
  const result = await pool.query(`
    WITH RECURSIVE realm_tree AS (
      SELECT id, parent_id, policies, 0 as depth, ARRAY[id::varchar] as path
      FROM realms
      WHERE parent_id IS NULL
      UNION ALL
      SELECT r.id, r.parent_id, r.policies, rt.depth + 1, rt.path || r.id::varchar
      FROM realms r
      INNER JOIN realm_tree rt ON r.parent_id = rt.id
    )
    SELECT * FROM realm_tree ORDER BY path
  `);

  // Merge with runtime status
  const realms = result.rows.map(realm => {
    const routeInfo = routeTable.get(realm.id);
    return {
      ...realm,
      status: routeInfo ? 'connected' : 'disconnected',
      services: routeInfo?.services || [],
      capabilities: routeInfo?.capabilities || [],
      connectedAt: routeInfo?.connectedAt
    };
  });

  res.json(realms);
});

app.post('/api/realms', requireApiKey, async (req: Request, res: Response) => {
  const { id, parent_id, policies } = req.body;

  try {
    await pool.query(
      'INSERT INTO realms (id, parent_id, policies) VALUES ($1, $2, $3)',
      [id, parent_id, policies || []]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/api/realms/:id/policies', requireApiKey, async (req: Request, res: Response) => {
  const { policies } = req.body;

  try {
    await pool.query(
      'UPDATE realms SET policies = $1 WHERE id = $2',
      [policies, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/metrics', requireApiKey, (req: Request, res: Response) => {
  const metrics = {
    connectedRealms: routeTable.size,
    totalServices: Array.from(routeTable.values()).reduce(
      (sum, info) => sum + info.services.length, 0
    ),
    pendingRequests: pendingRequests.size,
    eventTopics: eventRegistry.size,
    realms: Array.from(routeTable.entries()).map(([id, info]) => ({
      id,
      services: info.services.length,
      capabilities: info.capabilities.length,
      isExternal: info.isExternal,
      connectedAt: info.connectedAt
    }))
  };
  res.json(metrics);
});

// ============================================
// Admin WebSocket for Console
// ============================================

adminWss.on('connection', (ws: WebSocket) => {
  console.log('Admin console connected');

  // Send current state
  ws.send(JSON.stringify({
    type: 'initial-state',
    payload: {
      realms: Array.from(routeTable.entries()).map(([id, info]) => ({
        id,
        services: info.services,
        capabilities: info.capabilities,
        status: 'connected',
        isExternal: info.isExternal,
        connectedAt: info.connectedAt
      }))
    }
  }));

  ws.on('message', async (data) => {
    const msg: Message = JSON.parse(data.toString());

    if (msg.type === 'get-metrics') {
      ws.send(JSON.stringify({
        type: 'metrics',
        payload: {
          // Real-time metrics
        }
      }));
    }
  });
});

// ============================================
// Startup
// ============================================

internalWss.on('connection', (ws: WebSocket) => handleConnection(ws as ExtendedWebSocket, false));
externalWss.on('connection', (ws: WebSocket) => handleConnection(ws as ExtendedWebSocket, true));

// Kill any processes using our ports before starting
// killPortProcesses([3001, 8080, 8443]); // Commented out temporarily

server.listen(3001, () => {
  console.log('Admin API: http://localhost:3001');
  console.log('Admin WebSocket: ws://localhost:3001');
  console.log('Internal Gateway: ws://localhost:8080');
  console.log('External Gateway: ws://localhost:8443');
});

// Cleanup old requests periodically
setInterval(() => {
  const now = Date.now();
  for (const [requestId, pending] of pendingRequests.entries()) {
    // Check if it's a PendingRequest (has timestamp) or LoopState (has startTime)
    const timestamp = 'timestamp' in pending ? pending.timestamp : pending.startTime;
    if (now - timestamp > 60000) { // 1 minute timeout
      pendingRequests.delete(requestId);
    }
  }
}, 30000);