import { WebSocket } from 'ws';

export interface RealmInfo {
  socket: WebSocket;
  services: string[];
  capabilities: string[];
  isExternal: boolean;
  connectedAt: Date;
}

export interface PendingRequest {
  fromSocket: WebSocket;
  timestamp: number;
}

export interface LoopState {
  id: string;
  name: string;
  capability: string;
  input: any;
  options: any;
  initiator: ExtendedWebSocket;
  initiatorRealmId: string;
  phase: 'recruitment' | 'execution' | 'aggregation' | 'complete';
  participants: string[];
  recruitmentResponses: Array<{
    agentId: string;
    accepts: boolean;
    bid?: any;
    timestamp: number;
  }>;
  executionResults: Array<{
    agentId: string;
    result?: any;
    error?: string;
    timestamp: number;
  }>;
  startTime: number;
}

export interface Directory {
  availableServices: Record<string, string[]>;
  availableCapabilities: string[];
  events: Record<string, { publishers: string[] }>;
}

export interface Message {
  type: string;
  payload: any;
}

export interface RegisterRealmPayload {
  realmId: string;
  services?: string[];
  capabilities?: string[];
  authToken?: string;
}

export interface ServiceCallPayload {
  requestId: string;
  capability: string;
  service: string;
  input: any;
  callerRealm?: string;
}

export interface ServiceResponsePayload {
  requestId: string;
  output?: any;
  error?: string;
}

export interface LoopInitiatePayload {
  loopId: string;
  capability: string;
  loopName: string;
  input: any;
  options?: {
    recruitmentTimeout?: number;
    executionTimeout?: number;
    minParticipants?: number;
  };
}

export interface LoopRecruitmentResponsePayload {
  loopId: string;
  agentId: string;
  accepts: boolean;
  bid?: any;
}

export interface EventPublishPayload {
  capability: string;
  eventName: string;
  topic: string;
  payload: any;
}

export interface EventSubscribePayload {
  topic: string;
}

export interface RealmRecord {
  id: string;
  parent_id?: string;
  policies: string[];
  auth_token?: string;
  route_to?: string;
}

export interface ExtendedWebSocket extends WebSocket {
  realmId?: string;
  subscriberRealmId?: string;
}