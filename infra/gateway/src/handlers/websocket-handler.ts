import WebSocket from 'ws';
import { Pool } from 'pg';
import { RealmService } from '../services/realm-service';
import {
  ExtendedWebSocket,
  Message,
  RealmInfo,
  PendingRequest,
  LoopState,
  Directory,
  RegisterRealmPayload,
  ServiceCallPayload,
  ServiceResponsePayload,
  LoopInitiatePayload,
  LoopRecruitmentResponsePayload,
  EventPublishPayload,
  EventSubscribePayload
} from '../types';

export class WebSocketHandler {
  constructor(
    private realmService: RealmService,
    private routeTable: Map<string, RealmInfo>,
    private pendingRequests: Map<string, PendingRequest | LoopState>,
    private eventRegistry: Map<string, Set<ExtendedWebSocket>>,
    private adminWss: WebSocket.Server,
    private pool: Pool
  ) {}

  async handleConnection(ws: ExtendedWebSocket, isExternal: boolean = false): Promise<void> {
    let realmId: string | null = null;
    let realmInfo: RealmInfo | null = null;

    ws.on('message', async (data) => {
      try {
        const msg: Message = JSON.parse(data.toString());

        switch (msg.type) {
          case 'register-realm':
            await this.handleRegisterRealm(ws, msg, isExternal);
            realmId = (msg.payload as RegisterRealmPayload).realmId;
            realmInfo = this.routeTable.get(realmId) || null;
            break;

          case 'client-handshake':
            await this.handleClientHandshake(ws, msg, isExternal);
            const clientId = (msg.payload as any).clientId as string;
            if (clientId) {
              realmId = clientId; // For backwards compatibility with route table
              realmInfo = this.routeTable.get(clientId) || null;
            }
            break;

          case 'service-call':
            await this.handleServiceCall(ws, msg, realmId, isExternal);
            break;

          case 'service-response':
            this.handleServiceResponse(msg);
            break;

          case 'loop-initiate':
            await this.handleLoopInitiate(ws, msg, realmId);
            break;

          case 'loop-recruitment-response':
            this.handleLoopRecruitmentResponse(msg);
            break;

          case 'loop-execute-response':
            this.handleLoopExecuteResponse(msg);
            break;

          case 'event-publish':
            await this.handleEventPublish(ws, msg, realmId);
            break;

          case 'event-subscribe':
            this.handleEventSubscribe(ws, msg, realmId);
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
        this.routeTable.delete(realmId);

        // TODO: Clean up services from database when schema is ready
        // this.pool.query('DELETE FROM realm_services WHERE realm_id = $1', [realmId])
        //   .catch(err => console.error('Cleanup error:', err));

        // Notify admin console
        this.broadcastToAdmin({
          type: 'client-disconnected',
          payload: { clientId: realmId }
        });

        console.log(`Client disconnected: ${realmId}`);
      }
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${realmId}:`, error);
    });
  }

  private async handleRegisterRealm(ws: ExtendedWebSocket, msg: Message, isExternal: boolean): Promise<void> {
    const { realmId, services = [], capabilities = [], authToken } = msg.payload as RegisterRealmPayload;

    // TODO: For MVP, skip realm verification. Later: verify realm exists and auth token
    // Verify realm exists in database
    // const realm = await this.realmService.getRealmById(realmId);

    // if (!realm) {
    //   ws.send(JSON.stringify({
    //     type: 'error',
    //     payload: { error: 'Unknown realm' }
    //   }));
    //   ws.close();
    //   return;
    // }

    // // Verify auth token if required
    // if (realm.auth_token && realm.auth_token !== authToken) {
    //   ws.send(JSON.stringify({
    //     type: 'error',
    //     payload: { error: 'Invalid auth token' }
    //   }));
    //   ws.close();
    //   return;
    // }

    // Add to route table
    ws.realmId = realmId;
    this.routeTable.set(realmId, {
      socket: ws,
      services,
      capabilities,
      isExternal,
      connectedAt: new Date()
    });

    // TODO: Store services in database when schema is ready
    // if (services.length > 0) {
    //   await this.pool.query(
    //     'INSERT INTO realm_services (realm_id, service_name) VALUES ($1, unnest($2::text[])) ON CONFLICT DO NOTHING',
    //     [realmId, services]
    //   );
    // }

    // Load policies (for MVP, use empty array if realm doesn't exist in DB)
    let policies: string[] = [];
    try {
      policies = await this.realmService.loadRealmPolicies(realmId);
    } catch (err) {
      console.log(`⚠️  No policies found for ${realmId}, using default (allow all)`);
      policies = ['allow:*'];
    }

    // Build discovery directory
    const directory = await this.buildDirectory(realmId, policies, isExternal);

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
    this.broadcastToAdmin({
      type: 'realm-connected',
      payload: {
        realmId,
        services,
        capabilities,
        isExternal,
        connectedAt: new Date()
      }
    });

    console.log(`Registered: ${realmId} with ${services.length} services`);
  }

  private async handleClientHandshake(ws: ExtendedWebSocket, msg: Message, isExternal: boolean): Promise<void> {
    const { clientId, authToken, provides = {}, consumes = {} } = msg.payload as any;

    console.log(`🤝 Client handshake from: ${clientId}`);

    // TODO: Validate auth token from database
    // const client = await this.pool.query(
    //   'SELECT * FROM clients WHERE id = $1 AND auth_token = $2',
    //   [clientId, authToken]
    // );
    // if (client.rows.length === 0) {
    //   ws.send(JSON.stringify({
    //     type: 'error',
    //     payload: { error: 'Invalid client credentials' }
    //   }));
    //   ws.close();
    //   return;
    // }

    // Extract agent names from provides
    const agents = provides.agents || [];
    const agentNames = agents.map((a: any) => typeof a === 'string' ? a : a.name);

    // Add to route table (using clientId as key)
    ws.realmId = clientId;
    this.routeTable.set(clientId, {
      socket: ws,
      services: provides.services || [],
      capabilities: provides.agents || [],  // Store agents as capabilities for now
      isExternal,
      connectedAt: new Date(),
      agents: agentNames  // Store agent list
    });

    // TODO: Store in database
    // await this.pool.query(
    //   'UPDATE clients SET status = $1, last_connected = NOW(), connection_id = $2 WHERE id = $3',
    //   ['connected', ws.id, clientId]
    // );

    // Load policies (for MVP, use default)
    const policies: string[] = ['allow:*'];

    // Build discovery directory
    const directory = await this.buildDirectory(clientId, policies, isExternal);

    // Send handshake acknowledgment
    ws.send(JSON.stringify({
      type: 'client-handshake-ack',
      payload: {
        clientId,
        status: 'connected',
        policies,
        ...directory
      }
    }));

    // Notify admin console
    this.broadcastToAdmin({
      type: 'client-connected',
      payload: {
        clientId,
        agents: agentNames,
        services: provides.services || [],
        isExternal,
        connectedAt: new Date()
      }
    });

    console.log(`✅ Client connected: ${clientId} with ${agentNames.length} agents`);
  }

  private async buildDirectory(realmId: string, policies: string[], isExternal: boolean): Promise<Directory> {
    const directory: Directory = {
      availableServices: {},
      availableCapabilities: [],
      events: {}
    };

    // Get all services from route table
    for (const [targetRealmId, info] of this.routeTable.entries()) {
      if (isExternal && !targetRealmId.startsWith('public.')) continue;

      if (await this.canAccess(realmId, targetRealmId, policies, isExternal)) {
        directory.availableServices[targetRealmId] = info.services || [];
        directory.availableCapabilities = [...directory.availableCapabilities, ...info.capabilities];
      }
    }

    // Get available events
    for (const [topic, subscribers] of this.eventRegistry.entries()) {
      if (this.canSubscribeToEvent(realmId, topic, policies)) {
        directory.events[topic] = {
          publishers: Array.from(subscribers).map(s => s.subscriberRealmId || '')
        };
      }
    }

    return directory;
  }

  private async canAccess(fromRealm: string, toRealm: string, policies: string[], isExternal: boolean): Promise<boolean> {
    if (isExternal && !toRealm.startsWith('public.')) return false;
    if (policies.includes(`allow:${toRealm}`)) return true;
    if (policies.includes(`allow:*`)) return true;

    // Pattern-based policies
    for (const policy of policies) {
      if (policy.startsWith('allow:') && policy.includes('*')) {
        const pattern = policy.replace('allow:', '').replace(/\*/g, '.*');
        if (new RegExp(`^${pattern}$`).test(toRealm)) return true;
      }
    }

    // Same namespace = allowed by default
    const fromNamespace = fromRealm.split('.').slice(0, 2).join('.');
    const toNamespace = toRealm.split('.').slice(0, 2).join('.');
    return fromNamespace === toNamespace;
  }

  private canSubscribeToEvent(realmId: string, topic: string, policies: string[]): boolean {
    if (policies.includes(`subscribe:${topic}`)) return true;
    if (policies.includes('subscribe:*')) return true;

    for (const policy of policies) {
      if (policy.startsWith('subscribe:') && policy.includes('*')) {
        const pattern = policy.replace('subscribe:', '').replace(/\*/g, '.*');
        if (new RegExp(`^${pattern}$`).test(topic)) return true;
      }
    }

    return false;
  }

  private async handleServiceCall(ws: ExtendedWebSocket, msg: Message, callerRealmId: string | null, isExternal: boolean): Promise<void> {
    const { requestId, capability, service, input } = msg.payload as ServiceCallPayload;
    const targetRealm = service.split('.').slice(0, -1).join('.');
    const targetInfo = this.routeTable.get(targetRealm);

    if (!targetInfo) {
      ws.send(JSON.stringify({
        type: 'service-response',
        payload: {
          requestId,
          error: `Target realm ${targetRealm} not found`
        }
      }));
      return;
    }

    // Store pending request
    this.pendingRequests.set(requestId, {
      fromSocket: ws,
      timestamp: Date.now()
    });

    // Forward the request
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
  }

  private handleServiceResponse(msg: Message): void {
    const { requestId } = msg.payload as ServiceResponsePayload;
    const pendingRequest = this.pendingRequests.get(requestId) as PendingRequest;

    if (pendingRequest) {
      pendingRequest.fromSocket.send(JSON.stringify(msg));
      this.pendingRequests.delete(requestId);
    }
  }

  private async handleLoopInitiate(ws: ExtendedWebSocket, msg: Message, initiatorRealmId: string | null): Promise<void> {
    const { loopId, capability, loopName, input, options } = msg.payload as LoopInitiatePayload;

    console.log(`🔄 Loop initiated: ${loopName} (${loopId}) by ${initiatorRealmId}`);

    // Create loop state
    const loopState: LoopState = {
      id: loopId,
      name: loopName,
      capability: capability,
      input: input,
      options: options || {},
      initiator: ws,
      initiatorRealmId: initiatorRealmId || 'unknown',
      phase: 'recruitment',
      participants: [],
      recruitmentResponses: [],
      executionResults: [],
      startTime: Date.now()
    };

    this.pendingRequests.set(loopId, loopState);

    // Broadcast recruitment to all connected realms
    const recruitmentMessage = {
      type: 'loop-recruitment',
      payload: {
        loopId,
        loopName,
        capability,
        recruitmentMessage: input,
        deadline: new Date(Date.now() + (options?.recruitmentTimeout || 5000)).toISOString(),
        initiator: initiatorRealmId
      }
    };

    let broadcastCount = 0;
    this.routeTable.forEach((info, clientId) => {
      if (info.socket.readyState === WebSocket.OPEN) {
        // Check if this client has agents
        if (info.agents && info.agents.length > 0) {
          // Send recruitment to this client
          info.socket.send(JSON.stringify(recruitmentMessage));
          broadcastCount++;
        } else if (!capability || info.capabilities?.includes(capability)) {
          // Fallback for old-style realm registration
          info.socket.send(JSON.stringify(recruitmentMessage));
          broadcastCount++;
        }
      }
    });

    console.log(`📢 Broadcast recruitment to ${broadcastCount} clients`);

    // Notify admin console
    this.broadcastToAdmin({
      type: 'loop-started',
      payload: {
        loopId,
        loopName,
        capability,
        initiator: initiatorRealmId,
        broadcastTo: broadcastCount
      }
    });

    // Set timeout for recruitment phase
    setTimeout(() => {
      this.finishRecruitment(loopId);
    }, options?.recruitmentTimeout || 5000);
  }

  private handleLoopRecruitmentResponse(msg: Message): void {
    const { loopId, agentId, accepts, bid } = msg.payload as LoopRecruitmentResponsePayload;
    const loopState = this.pendingRequests.get(loopId) as LoopState;

    if (!loopState || loopState.phase !== 'recruitment') {
      console.warn(`Received recruitment response for invalid/completed loop: ${loopId}`);
      return;
    }

    console.log(`📥 Recruitment response from ${agentId}: ${accepts ? '✅ Accept' : '❌ Decline'}`);

    loopState.recruitmentResponses.push({
      agentId,
      accepts,
      bid,
      timestamp: Date.now()
    });

    if (accepts) {
      loopState.participants.push(agentId);

      // Notify admin console
      this.broadcastToAdmin({
        type: 'agent-recruited',
        payload: {
          loopId,
          agentId,
          participantCount: loopState.participants.length
        }
      });
    }
  }

  private async handleEventPublish(ws: ExtendedWebSocket, msg: Message, publisherRealmId: string | null): Promise<void> {
    const { topic, payload: eventPayload } = msg.payload as EventPublishPayload;
    const subscribers = this.eventRegistry.get(topic) || new Set();

    console.log(`📤 Publishing event to topic ${topic}: ${subscribers.size} subscribers`);

    subscribers.forEach(subscriber => {
      if (subscriber.readyState === WebSocket.OPEN) {
        subscriber.send(JSON.stringify({
          type: 'event',
          payload: {
            topic,
            data: eventPayload,
            publisher: publisherRealmId,
            timestamp: new Date().toISOString()
          }
        }));
      }
    });

    // Notify admin console
    this.broadcastToAdmin({
      type: 'event-published',
      payload: {
        topic,
        publisher: publisherRealmId,
        subscriberCount: subscribers.size
      }
    });
  }

  private handleEventSubscribe(ws: ExtendedWebSocket, msg: Message, subscriberRealmId: string | null): void {
    const { topic } = msg.payload as EventSubscribePayload;

    if (!this.eventRegistry.has(topic)) {
      this.eventRegistry.set(topic, new Set());
    }

    ws.subscriberRealmId = subscriberRealmId || undefined;
    this.eventRegistry.get(topic)!.add(ws);

    console.log(`📫 ${subscriberRealmId} subscribed to topic: ${topic}`);

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'subscription-confirmed',
      payload: { topic }
    }));

    // Notify admin console
    this.broadcastToAdmin({
      type: 'event-subscribed',
      payload: {
        topic,
        subscriber: subscriberRealmId,
        totalSubscribers: this.eventRegistry.get(topic)!.size
      }
    });
  }

  private finishRecruitment(loopId: string): void {
    const loopState = this.pendingRequests.get(loopId) as LoopState;

    if (!loopState || loopState.phase !== 'recruitment') {
      return;
    }

    console.log(`✅ Recruitment finished for ${loopId}: ${loopState.participants.length} participants`);

    const minParticipants = loopState.options.minParticipants || 1;

    if (loopState.participants.length < minParticipants) {
      console.warn(`❌ Insufficient participants: ${loopState.participants.length} < ${minParticipants}`);

      // Fail the loop
      if (loopState.initiator.readyState === WebSocket.OPEN) {
        loopState.initiator.send(JSON.stringify({
          type: 'loop-failed',
          payload: {
            loopId,
            reason: 'Insufficient participants',
            required: minParticipants,
            actual: loopState.participants.length
          }
        }));
      }

      this.pendingRequests.delete(loopId);
      return;
    }

    // Move to execution phase
    loopState.phase = 'execution';

    // Notify initiator about recruitment completion
    if (loopState.initiator.readyState === WebSocket.OPEN) {
      loopState.initiator.send(JSON.stringify({
        type: 'loop-recruitment-complete',
        payload: {
          loopId,
          participantCount: loopState.participants.length,
          participants: loopState.participants
        }
      }));
    }

    // Notify admin console
    this.broadcastToAdmin({
      type: 'loop-recruitment-complete',
      payload: {
        loopId,
        loopName: loopState.name,
        participantCount: loopState.participants.length,
        participants: loopState.participants
      }
    });

    // Start execution phase
    this.startExecution(loopId);
  }

  private startExecution(loopId: string): void {
    const loopState = this.pendingRequests.get(loopId) as LoopState;

    if (!loopState || loopState.phase !== 'execution') {
      return;
    }

    console.log(`⚡ Starting execution for ${loopId} with ${loopState.participants.length} participants`);

    // Send execution request to all participants
    const executionMessage = {
      type: 'loop-execute',
      payload: {
        loopId,
        loopName: loopState.name,
        input: loopState.input,
        otherParticipants: loopState.participants
      }
    };

    loopState.participants.forEach(agentId => {
      const realmInfo = this.routeTable.get(agentId);
      if (realmInfo && realmInfo.socket.readyState === WebSocket.OPEN) {
        realmInfo.socket.send(JSON.stringify({
          ...executionMessage,
          payload: {
            ...executionMessage.payload,
            agentId // Add the specific agent ID to the message
          }
        }));
      }
    });

    // Set timeout for execution phase
    setTimeout(() => {
      this.finishExecution(loopId);
    }, loopState.options.executionTimeout || 30000);
  }

  private handleLoopExecuteResponse(msg: Message): void {
    const { loopId, agentId, result, error } = msg.payload;
    const loopState = this.pendingRequests.get(loopId) as LoopState;

    if (!loopState || loopState.phase !== 'execution') {
      console.warn(`Received execution response for invalid/completed loop: ${loopId}`);
      return;
    }

    console.log(`📥 Execution result from ${agentId}`);

    loopState.executionResults.push({
      agentId,
      result,
      error,
      timestamp: Date.now()
    });

    // Notify admin console
    this.broadcastToAdmin({
      type: 'agent-executed',
      payload: {
        loopId,
        agentId,
        hasError: !!error,
        resultCount: loopState.executionResults.length,
        totalParticipants: loopState.participants.length
      }
    });

    // Check if all participants have responded
    if (loopState.executionResults.length === loopState.participants.length) {
      this.finishExecution(loopId);
    }
  }

  private finishExecution(loopId: string): void {
    const loopState = this.pendingRequests.get(loopId) as LoopState;

    if (!loopState || loopState.phase !== 'execution') {
      return;
    }

    console.log(`✅ Execution finished for ${loopId}: ${loopState.executionResults.length}/${loopState.participants.length} results`);

    // Move to aggregation phase
    loopState.phase = 'aggregation';

    // Aggregate results (simple merge for now)
    const aggregatedResult = this.aggregateResults(loopState);

    // Send completion to initiator
    if (loopState.initiator.readyState === WebSocket.OPEN) {
      loopState.initiator.send(JSON.stringify({
        type: 'loop-complete',
        payload: {
          loopId,
          result: aggregatedResult,
          participantCount: loopState.participants.length,
          duration: Date.now() - loopState.startTime
        }
      }));
    }

    // Notify all participants
    loopState.participants.forEach(agentId => {
      const realmInfo = this.routeTable.get(agentId);
      if (realmInfo && realmInfo.socket.readyState === WebSocket.OPEN) {
        realmInfo.socket.send(JSON.stringify({
          type: 'loop-complete',
          payload: {
            loopId,
            result: aggregatedResult,
            participants: loopState.participants
          }
        }));
      }
    });

    // Notify admin console
    this.broadcastToAdmin({
      type: 'loop-complete',
      payload: {
        loopId,
        loopName: loopState.name,
        result: aggregatedResult,
        participantCount: loopState.participants.length,
        duration: Date.now() - loopState.startTime
      }
    });

    // Cleanup
    this.pendingRequests.delete(loopId);
  }

  private aggregateResults(loopState: LoopState): any {
    // Simple aggregation strategy - merge all results
    const aggregated: any = {
      loopId: loopState.id,
      loopName: loopState.name,
      participantResults: [],
      summary: {}
    };

    // Collect all results
    loopState.executionResults.forEach(result => {
      if (!result.error) {
        aggregated.participantResults.push({
          agent: result.agentId,
          result: result.result
        });
      }
    });

    // Calculate summary based on loop type
    // For pricing loops, find min/max/average
    if (loopState.name.toLowerCase().includes('price')) {
      const prices = aggregated.participantResults
        .map((r: any) => r.result?.price)
        .filter((p: any) => p !== undefined);

      if (prices.length > 0) {
        aggregated.summary = {
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          avgPrice: prices.reduce((a: number, b: number) => a + b, 0) / prices.length,
          priceCount: prices.length
        };
        aggregated.finalPrice = aggregated.summary.avgPrice;
      }
    }

    return aggregated;
  }

  private broadcastToAdmin(message: Message): void {
    this.adminWss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Admin WebSocket connection handler
  async handleAdminConnection(ws: WebSocket): Promise<void> {
    console.log('Admin console connected');

    try {
      // Get all realms from database
      const allRealms = await this.realmService.getAllRealms();

      // Add connected clients info to each realm
      const realmsWithClients = allRealms.map(realm => {
        const connectedClients: any[] = [];

        this.routeTable.forEach((info, clientId) => {
          if (clientId === realm.realm_id || clientId.startsWith(realm.realm_id + '.')) {
            connectedClients.push({
              clientId,
              services: info.services || [],
              capabilities: info.capabilities || [],
              agents: info.agents || [],
              isExternal: info.isExternal,
              connectedAt: info.connectedAt
            });
          }
        });

        return {
          ...realm,
          id: realm.realm_id,
          connectedClients,
          clientCount: connectedClients.length,
          availableCapabilities: connectedClients.flatMap(c => c.capabilities),
          availableServices: connectedClients.flatMap(c => c.services),
          availableAgents: connectedClients.flatMap(c => c.agents)
        };
      });

      // Send current state
      ws.send(JSON.stringify({
        type: 'initial-state',
        payload: {
          realms: realmsWithClients
        }
      }));
    } catch (error) {
      console.error('Error sending initial state to admin:', error);
      ws.send(JSON.stringify({
        type: 'error',
        payload: { error: 'Failed to load initial state' }
      }));
    }

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
  }
}