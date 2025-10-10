import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { Realm } from './Realm';
import { ServiceMetadata } from '../decorators/Service';
import { AgentMetadata } from '../decorators/Agent';
import { RecruitmentContext, ExecutionContext } from '../agent/LoopParticipant';

interface ServiceHandler {
  metadata: ServiceMetadata;
  handler: (input: any) => Promise<any>;
}

interface AgentHandler {
  metadata: AgentMetadata;
  handler: {
    onRecruitment: (context: RecruitmentContext) => Promise<boolean>;
    execute: (input: any, context: ExecutionContext) => Promise<any>;
    onComplete: (result: any, context: ExecutionContext) => Promise<void>;
  };
}

export class BridgeManager extends EventEmitter {
  private ws?: WebSocket;
  private serviceHandlers: Map<string, ServiceHandler> = new Map();
  private agentHandlers: Map<string, AgentHandler> = new Map();
  private pendingRequests: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();

  constructor(private realm: Realm) {
    super();
  }

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Connecting to gateway: ${url}`);

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        console.log('Connected to gateway');
        this.sendHandshake();
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('Disconnected from gateway');
        this.emit('disconnected');
      });
    });
  }

  private sendHandshake(): void {
    const config = this.realm.getConfig();

    this.send({
      type: 'handshake',
      payload: {
        realmId: config.realmId,
        capabilities: config.capabilities || [],
        authToken: config.authToken
      }
    });
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'service-call':
          this.handleServiceCall(message);
          break;
        case 'service-response':
          this.handleServiceResponse(message);
          break;
        case 'loop-recruitment':
          this.handleLoopRecruitment(message);
          break;
        case 'loop-execute':
          this.handleLoopExecute(message);
          break;
        case 'loop-complete':
          this.handleLoopComplete(message);
          break;
        case 'loop-stack-response':
          this.handleLoopStackResponse(message);
          break;
        case 'loop-stack-progress':
          this.handleLoopStackProgress(message);
          break;
        case 'event':
          this.handleEvent(message);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private async handleServiceCall(message: any): Promise<void> {
    const { requestId, capability, service, input } = message.payload;
    const key = `${capability}.${service}`;

    const handler = this.serviceHandlers.get(key);

    if (!handler) {
      this.send({
        type: 'service-response',
        payload: {
          requestId,
          error: `Service not found: ${key}`
        }
      });
      return;
    }

    try {
      const result = await handler.handler(input);

      this.send({
        type: 'service-response',
        payload: {
          requestId,
          result
        }
      });
    } catch (error: any) {
      this.send({
        type: 'service-response',
        payload: {
          requestId,
          error: error.message
        }
      });
    }
  }

  private handleServiceResponse(message: any): void {
    const { requestId, result, error } = message.payload;

    const pending = this.pendingRequests.get(requestId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(requestId);

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  }

  private async handleLoopRecruitment(message: any): Promise<void> {
    const { loopId, loopName, capability, recruitmentMessage, deadline, initiator } = message.payload;

    // Find agents that can participate in this loop
    const candidates = this.realm.getAgentRegistry().findAgentsForLoop(loopName);

    const context: RecruitmentContext = {
      loopId,
      loopName,
      initiator,
      recruitmentMessage,
      deadline: new Date(deadline)
    };

    // Ask each candidate if they want to participate
    const responses = await Promise.all(
      candidates.map(async (agent) => {
        const handler = this.agentHandlers.get(`${agent.metadata.capability}.${agent.metadata.name}`);
        if (!handler) return null;

        try {
          const accepts = await handler.handler.onRecruitment(context);
          return accepts ? {
            agentId: `${agent.metadata.capability}.${agent.metadata.name}`,
            skills: agent.metadata.skills
          } : null;
        } catch (error) {
          console.error(`Agent recruitment error:`, error);
          return null;
        }
      })
    );

    // Send back agents that accepted
    const acceptedAgents = responses.filter(r => r !== null);

    this.send({
      type: 'loop-recruitment-response',
      payload: {
        loopId,
        agents: acceptedAgents
      }
    });
  }

  private async handleLoopExecute(message: any): Promise<void> {
    const { loopId, loopName, agentId, input, otherParticipants } = message.payload;

    const handler = this.agentHandlers.get(agentId);
    if (!handler) {
      this.send({
        type: 'loop-execute-response',
        payload: {
          loopId,
          agentId,
          error: 'Agent not found'
        }
      });
      return;
    }

    const context: ExecutionContext = {
      loopId,
      loopName,
      participantId: agentId,
      otherParticipants
    };

    try {
      const result = await handler.handler.execute(input, context);

      this.send({
        type: 'loop-execute-response',
        payload: {
          loopId,
          agentId,
          result
        }
      });
    } catch (error: any) {
      this.send({
        type: 'loop-execute-response',
        payload: {
          loopId,
          agentId,
          error: error.message
        }
      });
    }
  }

  private async handleLoopComplete(message: any): Promise<void> {
    const { loopId, loopName, result, participants } = message.payload;

    // Notify all participating agents that the loop is complete
    for (const agentId of participants) {
      const handler = this.agentHandlers.get(agentId);
      if (handler && handler.handler.onComplete) {
        const context: ExecutionContext = {
          loopId,
          loopName,
          participantId: agentId,
          otherParticipants: participants.filter((p: string) => p !== agentId)
        };

        try {
          await handler.handler.onComplete(result, context);
        } catch (error) {
          console.error(`Agent onComplete error:`, error);
        }
      }
    }
  }

  private handleLoopStackResponse(message: any): void {
    const { stackId, result, error } = message.payload;

    const pending = this.pendingRequests.get(stackId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(stackId);

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  }

  private handleLoopStackProgress(message: any): void {
    const { stackId, stepIndex, stepName, status, result, error } = message.payload;

    // Emit progress event for monitoring
    this.emit('loop-stack-progress', {
      stackId,
      stepIndex,
      stepName,
      status,
      result,
      error
    });

    console.log(`Loop Stack Progress [${stackId}]: Step ${stepIndex} (${stepName}) - ${status}`);
  }

  private handleEvent(message: any): void {
    const { capability, eventName, topic, payload } = message.payload;

    // Emit to event bus
    this.realm.getEventBus().handleIncomingEvent({
      capability,
      eventName,
      topic,
      payload
    });
  }

  async callService(
    capability: string,
    service: string,
    input: any,
    options?: { timeout?: number; retries?: number }
  ): Promise<any> {
    const requestId = this.generateRequestId();
    const timeout = options?.timeout || 30000;

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Service call timeout: ${capability}.${service}`));
      }, timeout);

      this.pendingRequests.set(requestId, { resolve, reject, timeout: timeoutHandle });

      this.send({
        type: 'service-call',
        payload: {
          requestId,
          capability,
          service,
          input
        }
      });
    });
  }

  async initiateLoop(
    capability: string,
    loopName: string,
    input: any,
    options?: {
      recruitmentTimeout?: number;
      executionTimeout?: number;
      minParticipants?: number;
      maxParticipants?: number;
    }
  ): Promise<any> {
    const loopId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      const totalTimeout = (options?.recruitmentTimeout || 5000) + (options?.executionTimeout || 30000);

      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(loopId);
        reject(new Error(`Loop timeout: ${loopName}`));
      }, totalTimeout);

      this.pendingRequests.set(loopId, { resolve, reject, timeout: timeoutHandle });

      this.send({
        type: 'loop-initiate',
        payload: {
          loopId,
          capability,
          loopName,
          input,
          options
        }
      });
    });
  }

  async initiateLoopStack(
    capability: string,
    stackName: string,
    input: any,
    options?: {
      timeout?: number;
      errorStrategy?: 'abort' | 'continue' | 'rollback';
      allowNestedStacks?: boolean;
      maxDepth?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    const stackId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      const timeout = options?.timeout || 90000; // 90 seconds default for stack

      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(stackId);
        reject(new Error(`Loop stack timeout: ${stackName}`));
      }, timeout);

      this.pendingRequests.set(stackId, { resolve, reject, timeout: timeoutHandle });

      this.send({
        type: 'loop-stack-initiate',
        payload: {
          stackId,
          capability,
          stackName,
          input,
          options
        }
      });
    });
  }

  registerServiceHandler(metadata: ServiceMetadata, handler: (input: any) => Promise<any>): void {
    const key = `${metadata.capability}.${metadata.name}`;
    this.serviceHandlers.set(key, { metadata, handler });
  }

  registerAgentHandler(
    metadata: AgentMetadata,
    handler: {
      onRecruitment: (context: RecruitmentContext) => Promise<boolean>;
      execute: (input: any, context: ExecutionContext) => Promise<any>;
      onComplete: (result: any, context: ExecutionContext) => Promise<void>;
    }
  ): void {
    const key = `${metadata.capability}.${metadata.name}`;
    this.agentHandlers.set(key, { metadata, handler });
  }

  async publishEvent(capability: string, eventName: string, topic: string, payload: any): Promise<void> {
    this.send({
      type: 'event-publish',
      payload: {
        capability,
        eventName,
        topic,
        payload
      }
    });
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}