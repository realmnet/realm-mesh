# InterRealm Protocol & Control Plane API

This directory contains the protocol definitions and code generation for the InterRealm messaging system and Control Plane API.

## Structure

```
protocol/
├── interrealm-protocol.yaml      # OpenAPI spec defining the wire protocol
├── control-plane-api.yaml        # OpenAPI spec defining the Control Plane REST API
├── Makefile                       # Code generation commands
├── package.json                   # Node dependencies for generator
└── generated/                     # Generated code (git-ignored)
    ├── java/                      # InterRealm Java models
    ├── typescript/                # InterRealm TypeScript models
    ├── control-plane-java/        # Control Plane Java models & Spring Boot controllers
    └── control-plane-typescript/  # Control Plane TypeScript models & Axios client
```

## Protocol Overview

### InterRealm Protocol
The InterRealm protocol defines:
- **MessageEnvelope**: Base message structure for all realm-to-realm communication
- **ServiceRequest/Response**: Synchronous request-response patterns
- **Event**: Asynchronous event broadcasting
- **LoopBroadcast**: Loop-scoped message broadcasting

### Control Plane API
The Control Plane API defines:
- **Canvas Management**: CRUD operations for realm canvas configurations
- **Deployment Operations**: Deploy and monitor canvas configurations
- **Realm Canvas Models**: Node/edge graph structures for visual realm topology
- **Spring Boot Controllers**: Type-safe REST API interfaces with validation

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
# Generate everything (InterRealm + Control Plane)
make all

# Generate only InterRealm protocol
make generate

# Generate only Control Plane API
make generate-control-plane

# Generate specific targets
make generate-java                    # InterRealm Java models
make generate-ts                      # InterRealm TypeScript models
make generate-control-plane-java      # Control Plane Java (Spring Boot)
make generate-control-plane-ts        # Control Plane TypeScript (Axios)

# Clean all generated code
make clean
```

### Watch Mode

```bash
# Auto-regenerate on spec changes (watches both specs)
make watch
```

## Integration

### Java Spring Boot Projects (Control Plane)

Add to your `pom.xml`:
```xml
<dependency>
    <groupId>io.realmmesh</groupId>
    <artifactId>control-plane-api</artifactId>
    <version>1.0.0</version>
</dependency>
```

Implement the generated controller interface:
```java
import io.realmmesh.controlplane.controllers.CanvasApi;
import io.realmmesh.controlplane.models.*;

@RestController
@RequestMapping("/api/v1")
public class CanvasController implements CanvasApi {

    @Override
    public ResponseEntity<GetCanvas200Response> getCanvas(UUID clusterId) {
        // Your implementation here
        RealmCanvas canvas = canvasService.getCanvas(clusterId);
        return ResponseEntity.ok(new GetCanvas200Response().canvas(canvas));
    }

    @Override
    public ResponseEntity<SaveCanvasResponse> saveCanvas(SaveCanvasRequest request) {
        // Your implementation here
        RealmCanvas saved = canvasService.saveCanvas(request);
        return ResponseEntity.ok(new SaveCanvasResponse()
            .success(true)
            .canvas(saved)
            .message("Canvas saved successfully"));
    }

    // ... implement other endpoints
}
```

### Java Projects (InterRealm Protocol)

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

### TypeScript Projects (Control Plane Client)

```bash
npm install @realmmesh/control-plane-api
```

Then use:
```typescript
import { CanvasApi, RealmCanvas, SaveCanvasRequest } from '@realmmesh/control-plane-api';

const api = new CanvasApi();

// Get canvas for cluster
const canvas = await api.getCanvas('cluster-uuid');

// Save canvas
const saveRequest: SaveCanvasRequest = {
  clusterId: 'cluster-uuid',
  nodes: [...],
  edges: [...]
};
const result = await api.saveCanvas(saveRequest);
```

### TypeScript Projects (InterRealm Protocol)

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

## Extending the APIs

### Adding to InterRealm Protocol

To add new message types or fields:

1. Edit `interrealm-protocol.yaml`
2. Run `make validate` to check syntax
3. Run `make generate` to update models
4. Commit both the spec and any integration changes

### Adding to Control Plane API

To add new endpoints or modify canvas models:

1. Edit `control-plane-api.yaml`
2. Run `make validate` to check syntax
3. Run `make generate-control-plane` to update models and controllers
4. Implement the new methods in your Spring Boot controller
5. Commit both the spec and implementation changes

## Message Types

### ServiceRequest
Synchronous service calls between realms with correlation tracking.

### ServiceResponse
Responses to service requests, includes success/error status.

### Event
Asynchronous events broadcast to interested realms.

### LoopBroadcast
Messages broadcast within a loop topology with TTL support.