# InterRealm Node.js SDK

A comprehensive SDK for building decentralized mesh services using TypeScript/JavaScript.

## Features

- **Services**: Request/response RPC patterns with dependency injection
- **Agents**: Autonomous loop participants for AI coordination
- **Events**: Pub/sub messaging with filtering
- **Loops**: Multi-agent coordination patterns (aggregation, voting, consensus)
- **Code Generation**: Generate TypeScript types from capability definitions
- **Decorators**: Clean annotation-based architecture
- **Auto-Discovery**: Automatic service and agent registration

## Quick Start

### 1. Installation

```bash
npm install @interrealm/sdk reflect-metadata
```

### 2. Create a Capability Definition

Create `capabilities/my-service.yaml`:

```yaml
capability:
  name: my-domain.my-service
  version: 1.0.0
  description: My awesome service

interface:
  operations:
    - name: process_data
      input:
        parameters:
          - name: data
            type: string
            required: true
      output:
        type: object
```

### 3. Generate TypeScript Types

```bash
# Using the CLI tool from dx/cli
npx @realmmesh/cli generate capabilities/my-service.yaml -o src/generated/types.ts
```

### 4. Implement Your Service

```typescript
import { Service } from '@interrealm/sdk';
import { ProcessDataInput, ProcessDataOutput } from './generated/types';

@Service({
  capability: 'my-domain.my-service',
  name: 'ProcessData'
})
export class MyService {
  async call(input: ProcessDataInput): Promise<ProcessDataOutput> {
    return { result: `Processed: ${input.data}` };
  }
}
```

### 5. Bootstrap Your Application

```typescript
import { Realm, loadRealmConfigFromEnv } from '@interrealm/sdk';
import { config } from 'dotenv';
import 'reflect-metadata';

// Import services to trigger decorators
import './services/MyService';

config();

async function main() {
  const realm = new Realm(loadRealmConfigFromEnv());
  await realm.initialize();
  console.log('Service is ready!');
}

main().catch(console.error);
```

### 6. Environment Configuration

Create `.env`:

```env
REALM_ID=my-domain.my-service
ROUTING_URL=wss://gateway.interrealm.io
CAPABILITIES=my-domain.my-service
COMPONENT_PATHS=./src/services
AUTO_DISCOVERY=true
```

## Core Concepts

### Services

Services handle synchronous request/response operations:

```typescript
@Service({
  capability: 'finance.invoicing',
  name: 'GenerateInvoice',
  timeout: 30000,
  retries: 2
})
export class InvoiceService {
  @Inject('finance.payment', 'ProcessPayment')
  private paymentService!: ServiceClient<PaymentRequest, PaymentResponse>;

  async call(input: InvoiceRequest): Promise<InvoiceResponse> {
    // Service logic here
    const payment = await this.paymentService.call(paymentData);
    return { invoiceId: 'INV-123', total: 100 };
  }
}
```

### Agents

Agents participate in coordination loops:

```typescript
@Agent({
  capability: 'ai.pricing',
  name: 'PricingAgent',
  participatesIn: ['PriceAggregation'],
  skills: ['dynamic-pricing']
})
export class PricingAgent implements LoopParticipant {
  async onRecruitment(context: RecruitmentContext): Promise<boolean> {
    // Decide whether to participate
    return true;
  }

  async execute(input: PricingRequest, context: ExecutionContext): Promise<PricingResponse> {
    // Agent logic
    return { price: 99.99, confidence: 0.95 };
  }

  async onComplete(result: any, context: ExecutionContext): Promise<void> {
    // Handle completion
  }
}
```

### Events

Pub/sub messaging for asynchronous communication:

```typescript
@Service({
  capability: 'notifications.email',
  name: 'EmailService'
})
export class EmailService {
  private emailPublisher!: EventPublisher<EmailSent>;

  @EventHandler({
    capability: 'finance.invoicing',
    eventName: 'InvoiceGenerated',
    topic: 'invoice.generated'
  })
  async onInvoiceGenerated(event: InvoiceGenerated): Promise<void> {
    // Send email notification
    await this.sendEmail(event);

    // Publish email sent event
    await this.emailPublisher.publish({
      emailId: 'email-123',
      recipient: event.customerEmail,
      sentAt: new Date().toISOString()
    });
  }
}
```

### Loops

Coordinate multiple agents:

```typescript
@LoopCoordinator({
  capability: 'ai.pricing',
  loopName: 'PriceAggregation'
})
export class PricingLoop {
  initiator!: LoopInitiator<PricingRequest, AggregatedPrice>;

  async getPrice(request: PricingRequest): Promise<AggregatedPrice> {
    return await this.initiator.initiateWithOptions(request, {
      minParticipants: 2,
      maxParticipants: 5,
      recruitmentTimeout: 5000,
      executionTimeout: 30000
    });
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                          │
├─────────────────────────────────────────────────────────────┤
│  @Service   @Agent   @EventHandler   @LoopCoordinator       │
│  Decorators attach metadata to your classes                  │
├─────────────────────────────────────────────────────────────┤
│                   InterRealm SDK                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Realm   │  │ Service  │  │  Agent   │  │  Event   │   │
│  │  (Core)  │  │ Registry │  │ Registry │  │   Bus    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └─────────────┼─────────────┼─────────────┘          │
│                     │             │                         │
│              ┌──────▼─────────────▼──────┐                 │
│              │   Bridge Manager          │                 │
│              │   (WebSocket Client)      │                 │
│              └──────────┬────────────────┘                 │
└─────────────────────────┼──────────────────────────────────┘
                          │
                    WebSocket
                          │
┌─────────────────────────▼──────────────────────────────────┐
│              InterRealm Gateway/Mesh                        │
│  Handles routing, loop coordination, event distribution     │
└─────────────────────────────────────────────────────────────┘
```

## Example: Complete Invoice Service

See `examples/invoice-service/` for a complete working example that demonstrates:

- Capability definition in YAML
- Generated TypeScript types
- Service implementation with dependency injection
- Event publishing
- Error handling
- Configuration management

To run the example:

```bash
cd examples/invoice-service
npm install
cp .env.example .env
# Edit .env with your configuration
npm run build
npm start
```

## API Reference

### Decorators

- `@Service(metadata)` - Mark a class as a service
- `@Agent(metadata)` - Mark a class as an agent
- `@Inject(capability, service)` - Inject external services
- `@EventHandler(metadata)` - Handle incoming events
- `@LoopCoordinator(metadata)` - Coordinate loops

### Core Classes

- `Realm` - Main application entry point
- `ServiceRegistry` - Manages service instances
- `AgentRegistry` - Manages agent instances
- `EventBus` - Handles event pub/sub
- `BridgeManager` - WebSocket communication

### Configuration

- `loadRealmConfigFromEnv()` - Load config from environment variables
- `RealmConfig` - Configuration interface

## Development

### Building the SDK

```bash
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Code Generation

Generate types from capability definitions:

```bash
# Install CLI tool
npm install -g @realmmesh/cli

# Generate types
realmmesh generate capability.yaml -o types.ts
```

## Advanced Usage

### Custom Configuration

```typescript
const realm = new Realm({
  realmId: 'my-service',
  routingUrl: 'wss://gateway.example.com',
  authToken: 'jwt-token',
  capabilities: ['my-capability'],
  componentPaths: ['./src/services', './src/agents'],
  autoDiscovery: true,
  logging: {
    level: 'info',
    pretty: true
  },
  retry: {
    maxAttempts: 5,
    backoffMs: 1000
  }
});
```

### Manual Service Registration

```typescript
// Disable auto-discovery
const realm = new Realm({
  // ... config
  autoDiscovery: false
});

// Register services manually
realm.getServiceRegistry().register(MyService, metadata);
```

### Event Filtering

```typescript
@EventHandler({
  capability: 'finance.invoicing',
  eventName: 'InvoiceGenerated',
  topic: 'invoice.generated',
  filters: { status: 'paid' }  // Only handle paid invoices
})
async onPaidInvoice(event: InvoiceGenerated): Promise<void> {
  // Handle only paid invoices
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details