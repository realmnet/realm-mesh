# Realm Mesh MVP Scenarios

Quick testing scenarios for the Realm Mesh system. Each scenario tests different aspects of the system with varying speeds and complexity.

## Quick Start

```bash
# From the scenarios directory
node <scenario-name>.js
```

## Available Scenarios

### 🎪 `continuous-demo.js` - Original Continuous Demo
**Duration:** Continuous (8 second cycles)
**Best for:** Long-running demos, presentations, observing system behavior over time

Cycles through 3 core patterns:
- Loop Coordination
- Service Calls (RPC)
- Event Publishing

```bash
node continuous-demo.js
```

---

### ⚡ `fast-demo.js` - Fast Continuous Demo
**Duration:** Continuous (2 second cycles)
**Best for:** Quick validation, rapid UI testing, development feedback

Cycles through 4 patterns with faster timing:
- Loop Coordination
- Service Calls
- Event Publishing
- Chained Operations

```bash
node fast-demo.js
```

---

### 🎯 `all-patterns.js` - Complete Pattern Test
**Duration:** ~10-15 seconds (one-shot)
**Best for:** Quick validation that everything works, CI/CD testing

Runs all patterns once sequentially with summary:
1. Loop Coordination
2. Service Call - Inventory
3. Service Call - Pricing
4. Event - Order Created
5. Event - Inventory Updated
6. Chained Operations

Provides a pass/fail summary at the end.

```bash
node all-patterns.js
```

---

### 💥 `stress-test.js` - Stress Test
**Duration:** ~5-10 seconds (rapid fire)
**Best for:** Performance testing, load testing, identifying bottlenecks

Fires 20 rapid operations (200ms apart) randomly across:
- Loop initiations
- Service calls
- Event publishing

Provides throughput metrics and success rates.

```bash
node stress-test.js
```

---

### 🌐 `multi-realm-coordination.js` - Multi-Realm Coordination
**Duration:** ~25 seconds (4 phases)
**Best for:** Testing complex coordination, multi-capability workflows

Tests advanced coordination patterns:
1. Multi-capability coordination
2. Parallel loops across realms
3. Event cascade with multiple subscribers
4. Complex workflow simulation

```bash
node multi-realm-coordination.js
```

---

### 📞 `price-check-scenario.js` - Single Price Check
**Duration:** ~5 seconds (one-shot)
**Best for:** Basic connectivity test, simple validation

Simple single loop test for basic system validation.

```bash
node price-check-scenario.js
```

## Configuration

All scenarios support the `GATEWAY_URL` environment variable:

```bash
GATEWAY_URL=ws://your-gateway:8080 node fast-demo.js
```

Default: `ws://localhost:8080`

## Recommended Testing Flow

### 1. Initial Validation
```bash
node price-check-scenario.js  # Basic connectivity
node all-patterns.js          # Full pattern validation
```

### 2. Development Testing
```bash
node fast-demo.js            # Quick feedback while coding
```

### 3. Performance Testing
```bash
node stress-test.js          # Load testing
```

### 4. Advanced Testing
```bash
node multi-realm-coordination.js  # Complex workflows
```

### 5. Demo/Presentation
```bash
node continuous-demo.js      # Long-running showcase
```

## Viewing Results

All scenarios output to console with visual indicators:
- ✅ Success
- ❌ Failure
- 📊 Results/Data
- ⏱️ Timing information
- 📈 Statistics

## Tips

1. **Quick UI Testing:** Use `fast-demo.js` to see rapid UI updates
2. **System Validation:** Use `all-patterns.js` before commits
3. **Performance Baseline:** Run `stress-test.js` to establish throughput baselines
4. **Complex Workflows:** Use `multi-realm-coordination.js` to test realistic business scenarios
5. **Continuous Monitoring:** Leave `continuous-demo.js` running to observe long-term stability

## Exit

Press `Ctrl+C` to gracefully shut down any scenario.
