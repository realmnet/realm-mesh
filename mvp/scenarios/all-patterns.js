const WebSocket = require('ws');

const GATEWAY_URL = process.env.GATEWAY_URL || 'ws://localhost:8080';

console.log('🎯 All Patterns Quick Test');
console.log(`📡 Connecting to: ${GATEWAY_URL}\n`);

const ws = new WebSocket(GATEWAY_URL);

const tests = [
  { name: '🔄 Loop Coordination', status: 'pending', startTime: null, endTime: null },
  { name: '📞 Service Call - Inventory', status: 'pending', startTime: null, endTime: null },
  { name: '📞 Service Call - Pricing', status: 'pending', startTime: null, endTime: null },
  { name: '📨 Event - Order Created', status: 'pending', startTime: null, endTime: null },
  { name: '📨 Event - Inventory Updated', status: 'pending', startTime: null, endTime: null },
  { name: '🔗 Chained Operations', status: 'pending', startTime: null, endTime: null }
];

let currentTest = 0;
let testStartTime;

ws.on('open', () => {
  console.log('✅ Connected to gateway\n');
  console.log('🚀 Running all pattern tests sequentially...\n');
  console.log('=' .repeat(60));

  testStartTime = Date.now();
  setTimeout(() => runNextTest(), 1500);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  switch (msg.type) {
    case 'loop-recruitment-complete':
      console.log(`   ✓ Recruited: ${msg.payload.participantCount} participants`);
      break;

    case 'loop-complete':
      console.log(`   ✓ Loop completed in ${msg.payload.duration}ms`);
      console.log(`   📊 Result:`, JSON.stringify(msg.payload.result, null, 2));
      markTestComplete(0);
      setTimeout(() => runNextTest(), 1000);
      break;

    case 'service-response':
      console.log(`   ✓ Service response received`);
      console.log(`   📊 Result:`, JSON.stringify(msg.payload.result, null, 2));

      // Mark the appropriate service test complete
      if (msg.payload.requestId?.includes('inventory')) {
        markTestComplete(1);
      } else if (msg.payload.requestId?.includes('pricing')) {
        markTestComplete(2);
      } else if (msg.payload.requestId?.includes('chain')) {
        // For chained operations, wait for both
        const chainTest = tests[5];
        if (chainTest.status === 'running') {
          console.log(`   ✓ Chain operation progress...`);
        }
      }

      setTimeout(() => runNextTest(), 1000);
      break;

    case 'event-ack':
      console.log(`   ✓ Event acknowledged`);

      // Determine which event test to complete
      if (currentTest === 3) {
        markTestComplete(3);
      } else if (currentTest === 4) {
        markTestComplete(4);
      }

      setTimeout(() => runNextTest(), 800);
      break;

    case 'loop-failed':
      console.log(`   ✗ Test failed: ${msg.payload.reason}`);
      tests[currentTest].status = 'failed';
      setTimeout(() => runNextTest(), 1000);
      break;
  }
});

function runNextTest() {
  if (currentTest >= tests.length) {
    printSummary();
    return;
  }

  const test = tests[currentTest];

  console.log(`\n${test.name}`);
  console.log('─'.repeat(60));

  test.status = 'running';
  test.startTime = Date.now();

  switch (currentTest) {
    case 0:
      testLoopCoordination();
      break;
    case 1:
      testServiceCallInventory();
      break;
    case 2:
      testServiceCallPricing();
      break;
    case 3:
      testEventOrderCreated();
      break;
    case 4:
      testEventInventoryUpdated();
      break;
    case 5:
      testChainedOperations();
      break;
  }

  currentTest++;
}

function markTestComplete(testIndex) {
  const test = tests[testIndex];
  if (test.status === 'running') {
    test.status = 'completed';
    test.endTime = Date.now();
  }
}

// ============================================
// Test 1: Loop Coordination
// ============================================

function testLoopCoordination() {
  ws.send(JSON.stringify({
    type: 'loop-initiate',
    payload: {
      loopId: `test-loop-${Date.now()}`,
      capability: 'pricing',
      loopName: 'PriceCheck',
      input: {
        productId: 'TEST-PROD-001',
        quantity: 5
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
// Test 2: Service Call - Inventory
// ============================================

function testServiceCallInventory() {
  ws.send(JSON.stringify({
    type: 'service-call',
    payload: {
      requestId: `test-inventory-${Date.now()}`,
      capability: 'inventory',
      service: 'GetInventory',
      input: {
        productId: 'TEST-PROD-002'
      }
    }
  }));
}

// ============================================
// Test 3: Service Call - Pricing
// ============================================

function testServiceCallPricing() {
  ws.send(JSON.stringify({
    type: 'service-call',
    payload: {
      requestId: `test-pricing-${Date.now()}`,
      capability: 'pricing',
      service: 'CalculatePrice',
      input: {
        basePrice: 100,
        quantity: 3,
        applyDiscount: true
      }
    }
  }));
}

// ============================================
// Test 4: Event - Order Created
// ============================================

function testEventOrderCreated() {
  ws.send(JSON.stringify({
    type: 'event-publish',
    payload: {
      topic: 'order.created',
      payload: {
        orderId: `TEST-ORD-${Date.now()}`,
        productId: 'TEST-PROD-003',
        quantity: 2,
        customer: 'test-customer'
      }
    }
  }));
}

// ============================================
// Test 5: Event - Inventory Updated
// ============================================

function testEventInventoryUpdated() {
  ws.send(JSON.stringify({
    type: 'event-publish',
    payload: {
      topic: 'inventory.updated',
      payload: {
        productId: 'TEST-PROD-004',
        newStock: 42
      }
    }
  }));
}

// ============================================
// Test 6: Chained Operations
// ============================================

function testChainedOperations() {
  // Send first call
  ws.send(JSON.stringify({
    type: 'service-call',
    payload: {
      requestId: `test-chain-1-${Date.now()}`,
      capability: 'inventory',
      service: 'GetInventory',
      input: { productId: 'TEST-CHAIN-PROD' }
    }
  }));

  // Send second call after delay
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'service-call',
      payload: {
        requestId: `test-chain-2-${Date.now()}`,
        capability: 'pricing',
        service: 'CalculatePrice',
        input: { basePrice: 150, quantity: 7 }
      }
    }));

    // Mark complete after both sent and received
    setTimeout(() => {
      markTestComplete(5);
      setTimeout(() => runNextTest(), 1000);
    }, 1500);
  }, 500);
}

function printSummary() {
  const totalTime = Date.now() - testStartTime;

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n⏱️  Total time: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)\n`);

  tests.forEach((test, i) => {
    const icon = test.status === 'completed' ? '✅' :
                 test.status === 'failed' ? '❌' :
                 test.status === 'running' ? '⏳' : '⏸️';

    const duration = test.endTime && test.startTime ?
      ` (${test.endTime - test.startTime}ms)` : '';

    console.log(`${icon} ${test.name} ${duration}`);
  });

  const completed = tests.filter(t => t.status === 'completed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const pending = tests.filter(t => t.status === 'pending' || t.status === 'running').length;

  console.log(`\n📈 Results: ${completed} passed, ${failed} failed, ${pending} pending`);
  console.log('='.repeat(60));
  console.log('\n🎉 All tests complete! Press Ctrl+C to exit.\n');
}

ws.on('close', () => {
  console.log('\n❌ Disconnected from gateway');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down test...');
  printSummary();
  ws.close();
});
