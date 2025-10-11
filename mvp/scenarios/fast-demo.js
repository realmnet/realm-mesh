const WebSocket = require('ws');

const GATEWAY_URL = process.env.GATEWAY_URL || 'ws://localhost:8080';
const CYCLE_DELAY = 2000; // 2 seconds between patterns - FAST!

console.log('⚡ Starting FAST Demo Orchestrator...');
console.log(`📡 Connecting to: ${GATEWAY_URL}\n`);

const ws = new WebSocket(GATEWAY_URL);
let cycleCount = 0;
let currentPattern = 0;

const patterns = [
  {
    name: '🔄 Loop Coordination',
    action: () => initiateLoop()
  },
  {
    name: '📞 Service Call (RPC)',
    action: () => callService()
  },
  {
    name: '📨 Event Publishing',
    action: () => publishEvent()
  },
  {
    name: '🔗 Multi-Capability Chain',
    action: () => chainedCalls()
  }
];

ws.on('open', () => {
  console.log('✅ Connected to gateway\n');
  console.log('⚡ FAST DEMO - Rapid testing mode!');
  console.log('🎬 Demo will cycle through:');
  patterns.forEach((p, i) => console.log(`   ${i+1}. ${p.name}`));
  console.log(`\n⏱️  Cycle delay: ${CYCLE_DELAY/1000}s (FAST)\n`);
  console.log('=' .repeat(60));

  // Start the continuous cycle
  setTimeout(() => runCycle(), 1000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  switch (msg.type) {
    case 'loop-recruitment-complete':
      console.log(`   ✅ Recruited: ${msg.payload.participantCount} participants`);
      break;

    case 'loop-complete':
      console.log(`   ✅ Loop complete!`);
      console.log(`   📊 Result:`, JSON.stringify(msg.payload.result, null, 2));
      break;

    case 'service-response':
      console.log(`   ✅ Service response: ${JSON.stringify(msg.payload.result)}`);
      break;

    case 'loop-failed':
      console.log(`   ❌ Loop failed: ${msg.payload.reason}`);
      break;

    case 'event-ack':
      console.log(`   ✅ Event acknowledged`);
      break;
  }
});

function runCycle() {
  const pattern = patterns[currentPattern];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`⚡ Cycle #${++cycleCount} - Pattern ${currentPattern + 1}/${patterns.length}`);
  console.log(`${pattern.name}`);
  console.log('='.repeat(60));

  // Execute the pattern
  pattern.action();

  // Move to next pattern
  currentPattern = (currentPattern + 1) % patterns.length;

  // Schedule next cycle
  setTimeout(() => runCycle(), CYCLE_DELAY);
}

// ============================================
// Pattern 1: Loop Coordination
// ============================================

function initiateLoop() {
  const loopId = `loop-${Date.now()}`;

  console.log(`\n🔄 Initiating loop: PriceCheck`);
  console.log(`   Loop ID: ${loopId}`);

  ws.send(JSON.stringify({
    type: 'loop-initiate',
    payload: {
      loopId,
      capability: 'pricing',
      loopName: 'PriceCheck',
      input: {
        productId: 'PROD-' + Math.floor(Math.random() * 1000),
        quantity: Math.floor(Math.random() * 20) + 1
      },
      options: {
        recruitmentTimeout: 2000,
        executionTimeout: 3000,
        minParticipants: 1
      }
    }
  }));
}

// ============================================
// Pattern 2: Service Call (RPC)
// ============================================

function callService() {
  const requestId = `req-${Date.now()}`;

  console.log(`\n📞 Calling service: GetInventory`);
  console.log(`   Request ID: ${requestId}`);

  ws.send(JSON.stringify({
    type: 'service-call',
    payload: {
      requestId,
      capability: 'inventory',
      service: 'GetInventory',
      input: {
        productId: 'PROD-' + Math.floor(Math.random() * 1000)
      }
    }
  }));
}

// ============================================
// Pattern 3: Event Publishing
// ============================================

function publishEvent() {
  console.log(`\n📨 Publishing event: order.created`);

  ws.send(JSON.stringify({
    type: 'event-publish',
    payload: {
      topic: 'order.created',
      payload: {
        orderId: `ORD-${Date.now()}`,
        productId: 'PROD-' + Math.floor(Math.random() * 1000),
        quantity: Math.floor(Math.random() * 10) + 1,
        customer: 'fast-demo-customer'
      }
    }
  }));
}

// ============================================
// Pattern 4: Chained Calls
// ============================================

function chainedCalls() {
  console.log(`\n🔗 Chaining multiple calls...`);

  // Call 1: Check inventory
  ws.send(JSON.stringify({
    type: 'service-call',
    payload: {
      requestId: `req-chain1-${Date.now()}`,
      capability: 'inventory',
      service: 'GetInventory',
      input: { productId: 'PROD-CHAIN' }
    }
  }));

  // Call 2: Calculate price (slightly delayed)
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'service-call',
      payload: {
        requestId: `req-chain2-${Date.now()}`,
        capability: 'pricing',
        service: 'CalculatePrice',
        input: { basePrice: 100, quantity: 5 }
      }
    }));
  }, 500);
}

ws.on('close', () => {
  console.log('\n❌ Disconnected from gateway');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down orchestrator...');
  ws.close();
});
