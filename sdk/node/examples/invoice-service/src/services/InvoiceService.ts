import { Service, Inject, ServiceClient, EventPublisher } from '@interrealm/sdk';
import {
  GenerateInvoiceInput,
  GenerateInvoiceOutput,
  GetInvoiceInput,
  GetInvoiceOutput,
  InvoiceGeneratedEvent,
  PaymentProcessedEvent,
  ErrorCode,
  CapabilityError,
  Configuration
} from '../generated/invoice-types';

// Mock interfaces for external services
interface PaymentRequest {
  amount: number;
  currency: string;
  customerId: string;
  reference: string;
}

interface PaymentResponse {
  transactionId: string;
  status: 'success' | 'failed';
  processedAt: string;
}

@Service({
  capability: 'finance.invoice-management',
  name: 'GenerateInvoice',
  timeout: 30000,
  retries: 2
})
export class GenerateInvoiceService {
  // Mock external dependencies
  @Inject('finance.payment-processing', 'ProcessPayment')
  private paymentService!: ServiceClient<PaymentRequest, PaymentResponse>;

  // Event publishers
  private invoiceGeneratedPublisher!: EventPublisher<InvoiceGeneratedEvent['payload']>;
  private paymentProcessedPublisher!: EventPublisher<PaymentProcessedEvent['payload']>;

  // In-memory invoice storage (for demo purposes)
  private invoices: Map<string, any> = new Map();

  async call(input: GenerateInvoiceInput): Promise<GenerateInvoiceOutput> {
    console.log(`Generating invoice for customer: ${input.customerId}`);

    // Validate input
    if (!input.items || input.items.length === 0) {
      throw new CapabilityError(ErrorCode.INVALID_ITEMS, 'Items list cannot be empty');
    }

    // Create invoice
    const invoice: GenerateInvoiceOutput = {
      invoiceId: this.generateInvoiceId(),
      customerId: input.customerId,
      total: this.calculateTotal(input.items),
      status: 'draft',
      createdAt: new Date().toISOString()
    };

    // Store invoice
    this.invoices.set(invoice.invoiceId, {
      ...invoice,
      items: input.items,
      dueDate: input.dueDate
    });

    // Process payment if requested
    if (input.processPayment) {
      try {
        const payment = await this.paymentService.call({
          amount: invoice.total,
          currency: 'USD',
          customerId: input.customerId,
          reference: invoice.invoiceId
        });

        if (payment.status === 'success') {
          invoice.paymentId = payment.transactionId;
          invoice.status = 'paid';

          // Publish payment processed event
          await this.paymentProcessedPublisher.publish({
            invoiceId: invoice.invoiceId,
            paymentId: payment.transactionId,
            amount: invoice.total,
            processedAt: payment.processedAt
          });
        } else {
          invoice.status = 'payment_failed';
        }
      } catch (error) {
        console.error('Payment processing failed:', error);
        invoice.status = 'payment_failed';
        throw new CapabilityError(ErrorCode.PAYMENT_FAILED, 'Payment processing failed');
      }
    }

    // Update stored invoice
    this.invoices.set(invoice.invoiceId, {
      ...this.invoices.get(invoice.invoiceId),
      ...invoice
    });

    // Publish invoice generated event
    await this.invoiceGeneratedPublisher.publish({
      invoiceId: invoice.invoiceId,
      customerId: invoice.customerId,
      total: invoice.total,
      generatedAt: invoice.createdAt
    });

    console.log(`✓ Invoice ${invoice.invoiceId} generated successfully`);
    return invoice;
  }

  async getInvoice(input: GetInvoiceInput): Promise<GetInvoiceOutput> {
    console.log(`Retrieving invoice: ${input.invoiceId}`);

    const invoice = this.invoices.get(input.invoiceId);
    if (!invoice) {
      throw new CapabilityError(ErrorCode.INVOICE_NOT_FOUND, `Invoice ${input.invoiceId} not found`);
    }

    return {
      invoiceId: invoice.invoiceId,
      customerId: invoice.customerId,
      items: invoice.items,
      total: invoice.total,
      status: invoice.status
    };
  }

  private generateInvoiceId(): string {
    return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  private calculateTotal(items: any[]): number {
    return items.reduce((sum, item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      return sum + itemTotal;
    }, 0);
  }
}

// Also register the GetInvoice service
@Service({
  capability: 'finance.invoice-management',
  name: 'GetInvoice',
  timeout: 10000,
  retries: 1
})
export class GetInvoiceService extends GenerateInvoiceService {
  async call(input: GetInvoiceInput): Promise<GetInvoiceOutput> {
    return this.getInvoice(input);
  }
}