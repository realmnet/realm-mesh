# InterRealm Protocol

This directory contains the protocol definitions and code generation for the InterRealm messaging system.

## Structure

```
protocol/
├── interrealm-protocol.yaml   # OpenAPI spec defining the wire protocol
├── Makefile                    # Code generation commands
├── package.json               # Node dependencies for generator
└── generated/                 # Generated code (git-ignored)
    ├── java/                  # Java models
    └── typescript/            # TypeScript models
```

## Protocol Overview

The InterRealm protocol defines:
- **MessageEnvelope**: Base message structure for all realm-to-realm communication
- **ServiceRequest/Response**: Synchronous request-response patterns
- **Event**: Asynchronous event broadcasting
- **LoopBroadcast**: Loop-scoped message broadcasting

## Setup

```bash
# Install dependencies
npm install

# Validate the OpenAPI spec
make validate

# Generate all code
make generate
```

## Usage

### Generate Code

```bash
# Generate everything
make generate

# Generate only Java
make generate-java

# Generate only TypeScript
make generate-ts

# Clean and regenerate
make all
```

### Watch Mode

```bash
# Auto-regenerate on spec changes
make watch
```

## Integration

### Java Projects

Add to your `pom.xml`:
```xml
<dependency>
    <groupId>io.realmmesh</groupId>
    <artifactId>interrealm-protocol</artifactId>
    <version>1.0.0</version>
</dependency>
```

Then use:
```java
import io.realmmesh.protocol.models.*;

MessageEnvelope envelope = new MessageEnvelope()
    .messageId(UUID.randomUUID().toString())
    .sourceRealm("realm://org.cluster.source")
    .targetRealm("realm://org.cluster.target")
    .messageType(MessageEnvelope.MessageTypeEnum.SERVICE_REQUEST)
    .timestamp(OffsetDateTime.now())
    .payload(payloadObject);
```

### TypeScript Projects

```bash
npm install @realmmesh/protocol
```

Then use:
```typescript
import { MessageEnvelope, ServiceRequest } from '@realmmesh/protocol';

const request: ServiceRequest = {
  messageId: generateUUID(),
  sourceRealm: 'realm://org.cluster.source',
  targetRealm: 'realm://org.cluster.target',
  messageType: 'service-request',
  correlationId: generateUUID(),
  timestamp: new Date().toISOString(),
  payload: { /* your data */ }
};
```

## Extending the Protocol

To add new message types or fields:

1. Edit `interrealm-protocol.yaml`
2. Run `make validate` to check syntax
3. Run `make generate` to update models
4. Commit both the spec and any integration changes

## Message Types

### ServiceRequest
Synchronous service calls between realms with correlation tracking.

### ServiceResponse
Responses to service requests, includes success/error status.

### Event
Asynchronous events broadcast to interested realms.

### LoopBroadcast
Messages broadcast within a loop topology with TTL support.