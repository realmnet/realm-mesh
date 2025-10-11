const WebSocket = require('ws');

const GATEWAY_URL = process.env.GATEWAY_URL || 'ws://localhost:8080';

console.log('🌐 Multi-Realm Coordination Scenario');
console.log(`📡 Connecting to: ${GATEWAY_URL}\n`);

const ws = new WebSocket(GATEWAY_URL);

let scenarioPhase = 0;
const phases = [
  '1️⃣ Initial multi-capability coordination',
  '2️⃣ Parallel loops across realms',
  '3️⃣ Event cascade with multiple subscribers',
  '4️⃣ Complex workflow simulation'
];

const responses = {
  loops: [],
  services: [],
  events: []
};

ws.on('open', () => {
  console.log('✅ Connected to gateway\n');
  console.log('🌐 Testing multi-realm coordination patterns...');
  console.log('\n' + '='.repeat(60));

  setTimeout(() => runPhase(), 2000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  switch (msg.type) {
    case 'loop-recruitment-complete':
      console.log(`   ✓ Loop recruited ${msg.payload.participantCount} participants`);
      break;

    case 'loop-complete':
      responses.loops.push(msg);
      console.log(`   ✓ Loop completed: ${msg.payload.loopId}`);
      console.log(`   📊 Result:`, JSON.stringify(msg.payload.result, null, 2));
      break;

    case 'service-response':
      responses.services.push(msg);
      console.log(`   ✓ Service response: ${msg.payload.requestId}`);
      console.log(`   📊 Result:`, JSON.stringify(msg.payload.result, null, 2));
      break;

    case 'event-ack':
      responses.events.push(msg);
      console.log(`   ✓ Event acknowledged`);
      break;

    case 'loop-failed':
      console.log(`   ✗ Loop failed: ${msg.payload.reason}`);
      break;
  }
});

function runPhase() {
  if (scenarioPhase >= phases.length) {
    setTimeout(() => printResults(), 2000);
    return;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(phases[scenarioPhase]);
  console.log('='.repeat(60));

  switch (scenarioPhase) {
    case 0:
      phase1_MultiCapabilityCoordination();
      break;
    case 1:
      phase2_ParallelLoops();
      break;
    case 2:
      phase3_EventCascade();
      break;
    case 3:
      phase4_ComplexWorkflow();
      break;
  }

  scenarioPhase++;
  setTimeout(() => runPhase(), 6000); // 6 seconds per phase
}

// ============================================
// Phase 1: Multi-Capability Coordination
// ============================================

function phase1_MultiCapabilityCoordination() {
  console.log('\n🎯 Coordinating across inventory and pricing realms...\n');

  // Loop requiring inventory capability
  ws.send(JSON.stringify({
    type: 'loop-initiate',
    payload: {
      loopId: `multi-inv-${Date.now()}`,
      capability: 'inventory',
      loopName: 'InventoryCheck',
      input: {
        productId: 'MULTI-PROD-001',
        warehouseId: 'WH-MAIN'
      },
      options: {
        recruitmentTimeout: 2500,
        executionTimeout: 4000,
        minParticipants: 1
      }
    }
  }));

  // Concurrent loop requiring pricing capability
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'loop-initiate',
      payload: {
        loopId: `multi-price-${Date.now()}`,
        capability: 'pricing',
        loopName: 'PriceCheck',
        input: {
          productId: 'MULTI-PROD-001',
          quantity: 15,
          customerTier: 'premium'
        },
        options: {
          recruitmentTimeout: 2500,
          executionTimeout: 4000,
          minParticipants: 1
        }
      }
    }));
  }, 500);
}

// ============================================
// Phase 2: Parallel Loops
// ============================================

function phase2_ParallelLoops() {
  console.log('\n🎯 Running 3 parallel loops across different capabilities...\n');

  const products = ['PROD-A', 'PROD-B', 'PROD-C'];

  products.forEach((productId, index) => {
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'loop-initiate',
        payload: {
          loopId: `parallel-${productId}-${Date.now()}`,
          capability: index === 0 ? 'inventory' : 'pricing',
          loopName: index === 0 ? 'InventoryCheck' : 'PriceCheck',
          input: {
            productId,
            quantity: Math.floor(Math.random() * 20) + 5
          },
          options: {
            recruitmentTimeout: 2000,
            executionTimeout: 3500,
            minParticipants: 1
          }
        }
      }));
    }, index * 300);
  });
}

// ============================================
// Phase 3: Event Cascade
// ============================================

function phase3_EventCascade() {
  console.log('\n🎯 Creating event cascade across realms...\n');

  // Primary event
  ws.send(JSON.stringify({
    type: 'event-publish',
    payload: {
      topic: 'order.created',
      payload: {
        orderId: `CASCADE-ORD-${Date.now()}`,
        productId: 'CASCADE-PROD',
        quantity: 10,
        priority: 'high'
      }
    }
  }));

  // Cascading events
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'event-publish',
      payload: {
        topic: 'inventory.reserved',
        payload: {
          orderId: `CASCADE-ORD-${Date.now()}`,
          productId: 'CASCADE-PROD',
          quantity: 10
        }
      }
    }));
  }, 1000);

  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'event-publish',
      payload: {
        topic: 'payment.initiated',
        payload: {
          orderId: `CASCADE-ORD-${Date.now()}`,
          amount: 1500,
          currency: 'USD'
        }
      }
    }));
  }, 2000);
}

// ============================================
// Phase 4: Complex Workflow
// ============================================

function phase4_ComplexWorkflow() {
  console.log('\n🎯 Simulating complex multi-realm workflow...\n');

  // Step 1: Check inventory via service call
  console.log('   Step 1: Check inventory availability');
  ws.send(JSON.stringify({
    type: 'service-call',
    payload: {
      requestId: `workflow-inv-${Date.now()}`,
      capability: 'inventory',
      service: 'GetInventory',
      input: {
        productId: 'WORKFLOW-PROD',
        includeReserved: true
      }
    }
  }));

  // Step 2: Calculate price via loop
  setTimeout(() => {
    console.log('   Step 2: Calculate optimal price via loop');
    ws.send(JSON.stringify({
      type: 'loop-initiate',
      payload: {
        loopId: `workflow-price-${Date.now()}`,
        capability: 'pricing',
        loopName: 'OptimalPriceCalculation',
        input: {
          productId: 'WORKFLOW-PROD',
          marketConditions: 'high-demand',
          competitorPrices: [99, 105, 110]
        },
        options: {
          recruitmentTimeout: 2500,
          executionTimeout: 4000,
          minParticipants: 2
        }
      }
    }));
  }, 1500);

  // Step 3: Create order event
  setTimeout(() => {
    console.log('   Step 3: Create order and notify realms');
    ws.send(JSON.stringify({
      type: 'event-publish',
      payload: {
        topic: 'order.created',
        payload: {
          orderId: `WORKFLOW-ORD-${Date.now()}`,
          productId: 'WORKFLOW-PROD',
          quantity: 3,
          totalPrice: 315,
          workflow: 'multi-realm-coordination'
        }
      }
    }));
  }, 3000);

  // Step 4: Confirm via service call
  setTimeout(() => {
    console.log('   Step 4: Confirm order processing');
    ws.send(JSON.stringify({
      type: 'service-call',
      payload: {
        requestId: `workflow-confirm-${Date.now()}`,
        capability: 'order',
        service: 'ConfirmOrder',
        input: {
          orderId: `WORKFLOW-ORD-${Date.now()}`
        }
      }
    }));
  }, 4000);
}

function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MULTI-REALM COORDINATION RESULTS');
  console.log('='.repeat(60));
  console.log(`\n✅ Loops completed: ${responses.loops.length}`);
  console.log(`✅ Service responses: ${responses.services.length}`);
  console.log(`✅ Events acknowledged: ${responses.events.length}`);

  console.log('\n🌐 Coordination patterns tested:');
  console.log('   ✓ Multi-capability coordination');
  console.log('   ✓ Parallel loop execution');
  console.log('   ✓ Event cascade propagation');
  console.log('   ✓ Complex workflow orchestration');

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Multi-realm coordination test complete!\n');
  console.log('💡 This demonstrates how multiple realms can coordinate');
  console.log('   to handle complex business workflows.\n');
  console.log('Press Ctrl+C to exit.\n');
}

ws.on('close', () => {
  console.log('\n❌ Disconnected from gateway');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down scenario...');
  printResults();
  ws.close();
});
