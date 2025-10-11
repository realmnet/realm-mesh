const WebSocket = require('ws');

const GATEWAY_URL = process.env.GATEWAY_URL || 'ws://localhost:8080';
const RAPID_FIRE_COUNT = 20; // Number of rapid operations
const DELAY_BETWEEN = 200; // 200ms between operations

console.log('💥 Starting Stress Test Orchestrator...');
console.log(`📡 Connecting to: ${GATEWAY_URL}`);
console.log(`🔥 Will fire ${RAPID_FIRE_COUNT} operations with ${DELAY_BETWEEN}ms delay\n`);

const ws = new WebSocket(GATEWAY_URL);
let operationCount = 0;
let responseCount = 0;
let startTime;

const stats = {
  loopsInitiated: 0,
  servicesCall: 0,
  eventsPublished: 0,
  loopsCompleted: 0,
  serviceResponses: 0,
  loopsFailed: 0
};

ws.on('open', () => {
  console.log('✅ Connected to gateway\n');
  console.log('🚀 Starting stress test in 2 seconds...\n');
  console.log('=' .repeat(60));

  setTimeout(() => {
    startTime = Date.now();
    rapidFire();
  }, 2000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  responseCount++;

  switch (msg.type) {
    case 'loop-recruitment-complete':
      process.stdout.write('.');
      break;

    case 'loop-complete':
      stats.loopsCompleted++;
      process.stdout.write('✓');
      break;

    case 'service-response':
      stats.serviceResponses++;
      process.stdout.write('+');
      break;

    case 'loop-failed':
      stats.loopsFailed++;
      process.stdout.write('✗');
      break;

    case 'event-ack':
      process.stdout.write('~');
      break;
  }

  // Check if we're done
  if (responseCount >= RAPID_FIRE_COUNT) {
    setTimeout(() => printResults(), 2000);
  }
});

function rapidFire() {
  console.log('💥 FIRING RAPID OPERATIONS!\n');

  const operations = [];

  for (let i = 0; i < RAPID_FIRE_COUNT; i++) {
    operations.push(i);
  }

  operations.forEach((i, index) => {
    setTimeout(() => {
      const roll = Math.random();

      if (roll < 0.4) {
        // 40% loops
        fireLoop(i);
      } else if (roll < 0.7) {
        // 30% service calls
        fireServiceCall(i);
      } else {
        // 30% events
        fireEvent(i);
      }

      operationCount++;

    }, index * DELAY_BETWEEN);
  });
}

function fireLoop(index) {
  stats.loopsInitiated++;
  ws.send(JSON.stringify({
    type: 'loop-initiate',
    payload: {
      loopId: `stress-loop-${index}-${Date.now()}`,
      capability: 'pricing',
      loopName: 'PriceCheck',
      input: {
        productId: `PROD-${index}`,
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

function fireServiceCall(index) {
  stats.servicesCall++;
  ws.send(JSON.stringify({
    type: 'service-call',
    payload: {
      requestId: `stress-req-${index}-${Date.now()}`,
      capability: Math.random() > 0.5 ? 'inventory' : 'pricing',
      service: Math.random() > 0.5 ? 'GetInventory' : 'CalculatePrice',
      input: {
        productId: `PROD-${index}`,
        basePrice: Math.floor(Math.random() * 200) + 50,
        quantity: Math.floor(Math.random() * 10) + 1
      }
    }
  }));
}

function fireEvent(index) {
  stats.eventsPublished++;
  ws.send(JSON.stringify({
    type: 'event-publish',
    payload: {
      topic: Math.random() > 0.5 ? 'order.created' : 'inventory.updated',
      payload: {
        id: `stress-event-${index}`,
        productId: `PROD-${index}`,
        value: Math.floor(Math.random() * 1000)
      }
    }
  }));
}

function printResults() {
  const duration = Date.now() - startTime;

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 STRESS TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\n⏱️  Duration: ${duration}ms (${(duration/1000).toFixed(2)}s)`);
  console.log(`🔥 Operations fired: ${operationCount}`);
  console.log(`📥 Responses received: ${responseCount}`);
  console.log(`⚡ Throughput: ${(operationCount / (duration/1000)).toFixed(2)} ops/sec\n`);

  console.log('📈 Breakdown:');
  console.log(`   🔄 Loops initiated: ${stats.loopsInitiated}`);
  console.log(`   ✅ Loops completed: ${stats.loopsCompleted}`);
  console.log(`   ❌ Loops failed: ${stats.loopsFailed}`);
  console.log(`   📞 Service calls: ${stats.servicesCall}`);
  console.log(`   ✅ Service responses: ${stats.serviceResponses}`);
  console.log(`   📨 Events published: ${stats.eventsPublished}\n`);

  if (stats.loopsInitiated > 0) {
    const successRate = (stats.loopsCompleted / stats.loopsInitiated * 100).toFixed(1);
    console.log(`✨ Loop success rate: ${successRate}%`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Stress test complete! Press Ctrl+C to exit.\n');
}

ws.on('close', () => {
  console.log('\n❌ Disconnected from gateway');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down stress test...');
  if (startTime) {
    printResults();
  }
  ws.close();
});
