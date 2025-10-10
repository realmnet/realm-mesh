// Auto-generated TypeScript code from capability definition
// Capability: finance.invoice-management v1.0.0
// Invoice generation and management service

export const CAPABILITY_METADATA = {
  name: 'finance.invoice-management',
  version: '1.0.0',
  author: 'InterRealm Team',
  tags: ['finance', 'invoicing', 'billing'],
  license: 'MIT',
} as const;

export interface Configuration {
  paymentGatewayUrl: string;
  defaultCurrency?: string;
  autoSendEmail?: boolean;
  taxRate?: number;
}

export enum ErrorCode {
  CUSTOMER_NOT_FOUND = 'INV_001',
  INVALID_ITEMS = 'INV_002',
  INVOICE_NOT_FOUND = 'INV_003',
  PAYMENT_FAILED = 'INV_004',
}

export class CapabilityError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = 'CapabilityError';
  }
}

export interface InvoiceGeneratedEvent {
  type: 'invoice_generated';
  payload: Record<string, any>;
}

export interface PaymentProcessedEvent {
  type: 'payment_processed';
  payload: Record<string, any>;
}

export type CapabilityEvent = 
  InvoiceGeneratedEvent | PaymentProcessedEvent;

export interface GenerateInvoiceInput {
  customerId: string;
  items: any[];
  processPayment?: boolean;
  dueDate?: string;
}

export type GenerateInvoiceOutput = Record<string, any>;

export interface GetInvoiceInput {
  invoiceId: string;
}

export type GetInvoiceOutput = Record<string, any>;

export interface FinanceInvoiceManagementCapability {
  generateInvoice(input: GenerateInvoiceInput): Promise<GenerateInvoiceOutput>;
  getInvoice(input: GetInvoiceInput): Promise<GetInvoiceOutput>;
}

export abstract class FinanceInvoiceManagementBase implements FinanceInvoiceManagementCapability {
  protected config: Configuration;

  constructor(config: Configuration) {
    this.config = config;
  }

  abstract generateInvoice(input: GenerateInvoiceInput): Promise<GenerateInvoiceOutput>;
  abstract getInvoice(input: GetInvoiceInput): Promise<GetInvoiceOutput>;
}