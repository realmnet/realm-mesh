// Auto-generated TypeScript code from capability definition
// Capability: messaging-service v1.0.0
// A capability for sending and receiving messages

export const CAPABILITY_METADATA = {
  name: 'messaging-service',
  version: '1.0.0',
  author: 'RealmMesh Team',
  tags: ['messaging', 'communication', 'async'],
  license: 'MIT',
} as const;

export interface Configuration {
  maxMessageSize?: number;
  queueUrl: string;
  retryAttempts?: number;
  timeoutSeconds?: number;
}

export enum ErrorCode {
  INVALID_RECIPIENT = 'MSG_001',
  MESSAGE_TOO_LARGE = 'MSG_002',
  MESSAGE_NOT_FOUND = 'MSG_003',
  QUOTA_EXCEEDED = 'MSG_004',
}

export class CapabilityError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = 'CapabilityError';
  }
}

export interface MessageReceivedEvent {
  type: 'message_received';
  payload: Record<string, any>;
}

export interface MessageDeletedEvent {
  type: 'message_deleted';
  payload: Record<string, any>;
}

export type CapabilityEvent = 
  MessageReceivedEvent | MessageDeletedEvent;

export interface SendMessageInput {
  recipient: string;
  content: string;
  priority?: string;
}

export type SendMessageOutput = Record<string, any>;

export interface GetMessagesInput {
  limit?: number;
  since?: string;
}

export type GetMessagesOutput = any[];

export interface DeleteMessageInput {
  messageId: string;
}

export type DeleteMessageOutput = boolean;

export interface MessagingServiceCapability {
  sendMessage(input: SendMessageInput): Promise<SendMessageOutput>;
  getMessages(input: GetMessagesInput): Promise<GetMessagesOutput>;
  deleteMessage(input: DeleteMessageInput): Promise<DeleteMessageOutput>;
}

export abstract class MessagingServiceBase implements MessagingServiceCapability {
  protected config: Configuration;

  constructor(config: Configuration) {
    this.config = config;
  }

  abstract sendMessage(input: SendMessageInput): Promise<SendMessageOutput>;
  abstract getMessages(input: GetMessagesInput): Promise<GetMessagesOutput>;
  abstract deleteMessage(input: DeleteMessageInput): Promise<DeleteMessageOutput>;
}