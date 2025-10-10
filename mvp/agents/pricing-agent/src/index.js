const WebSocket = require('ws');

const CLIENT_ID = 'pricing-client-1';
const GATEWAY_URL = process.env.GATEWAY_URL || 'ws://localhost:8080';
const AGENT_NAME = 'PricingAgent';

console.log(`🚀 Starting ${AGENT_NAME}...`);
console.log(`📡 Connecting to gateway: ${GATEWAY_URL}`);

const ws = new WebSocket(GATEWAY_URL);
const pendingRequests = new Map();

ws.on('open', () => {
  console.log(`✅ Connected to gateway`);

  // Send client handshake
  ws.send(JSON.stringify({
    type: 'client-handshake',
    payload: {
      clientId: CLIENT_ID,
      authToken: 'demo-token-pricing',
      provides: {
        agents: [
          {
            name: AGENT_NAME,
            participatesIn: ['PriceCheck', 'PriceAggregation'],
            skills: ['dynamic-pricing', 'cost-calculation']
          }
        ],
        services: ['CalculatePrice', 'ApplyDiscount'],
        eventHandlers: ['order.created', 'inventory.updated']
      },
      consumes: {
        services: ['GetInventory'],
        events: ['order.completed']
      }
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  switch (msg.type) {
    case 'client-handshake-ack':
      console.log(`✅ Handshake complete! Client ID: ${msg.payload.clientId}`);
      console.log(`📋 Available capabilities:`, msg.payload.availableCapabilities);

      // Subscribe to events
      ws.send(JSON.stringify({
        type: 'event-subscribe',
        payload: { topic: 'order.created' }
      }));
      break;

    case 'subscription-confirmed':
      console.log(`📫 Subscribed to topic: ${msg.payload.topic}`);
      break;

    case 'loop-recruitment':
      handleRecruitment(msg.payload);
      break;

    case 'loop-execute':
      handleExecution(msg.payload);
      break;

    case 'loop-complete':
      handleLoopComplete(msg.payload);
      break;

    case 'service-call':
      handleServiceCall(msg.payload);
      break;

    case 'service-response':
      handleServiceResponse(msg.payload);
      break;

    case 'event':
      handleEvent(msg.payload);
      break;

    default:
      console.log(`📨 Received: ${msg.type}`);
  }
});

// ============================================
// Loop Participation
// ============================================

function handleRecruitment(payload) {
  const { loopId, loopName, capability, recruitmentMessage } = payload;

  console.log(`\n🔔 Recruitment for loop: ${loopName} (${loopId})`);
  console.log(`   Input:`, recruitmentMessage);

  // Decide whether to participate
  const shouldAccept = true; // For MVP, always accept

  console.log(`   Decision: ${shouldAccept ? '✅ ACCEPT' : '❌ DECLINE'}`);

  // Send response
  ws.send(JSON.stringify({
    type: 'loop-recruitment-response',
    payload: {
      loopId,
      agentId: CLIENT_ID,
      accepts: shouldAccept,
      bid: {
        confidence: 0.95,
        estimatedTime: 100
      }
    }
  }));
}

function handleExecution(payload) {
  const { loopId, loopName, input } = payload;

  console.log(`\n⚡ Executing loop: ${loopName} (${loopId})`);
  console.log(`   Input:`, input);

  // Simulate pricing calculation
  const basePrice = 100;
  const discount = Math.random() * 20;
  const finalPrice = (basePrice - discount).toFixed(2);

  console.log(`   💰 Calculated price: $${finalPrice}`);

  // Send result
  ws.send(JSON.stringify({
    type: 'loop-execute-response',
    payload: {
      loopId,
      agentId: CLIENT_ID,
      result: {
        price: parseFloat(finalPrice),
        confidence: 0.95,
        agent: AGENT_NAME,
        breakdown: {
          basePrice,
          discount: discount.toFixed(2)
        }
      }
    }
  }));
}

function handleLoopComplete(payload) {
  const { loopId, result } = payload;

  console.log(`\n✅ Loop complete: ${loopId}`);
  console.log(`   Final result:`, result);
}

// ============================================
// Service Calls (RPC)
// ============================================

function handleServiceCall(payload) {
  const { requestId, capability, service, input, callerRealm } = payload;

  console.log(`\n📞 Service call: ${service} from ${callerRealm}`);
  console.log(`   Request ID: ${requestId}`);
  console.log(`   Input:`, input);

  // Simulate service processing
  let result;

  if (service.includes('CalculatePrice')) {
    const basePrice = input.basePrice || 100;
    const quantity = input.quantity || 1;
    const discount = input.applyDiscount ? 10 : 0;

    result = {
      price: (basePrice * quantity * (1 - discount/100)).toFixed(2),
      quantity,
      discount: `${discount}%`,
      calculatedBy: AGENT_NAME
    };
  } else if (service.includes('ApplyDiscount')) {
    result = {
      originalPrice: input.price,
      discountedPrice: (input.price * 0.9).toFixed(2),
      discountPercent: 10
    };
  } else {
    result = { error: 'Unknown service' };
  }

  console.log(`   💰 Result:`, result);

  // Send response
  ws.send(JSON.stringify({
    type: 'service-response',
    payload: {
      requestId,
      result
    }
  }));
}

function handleServiceResponse(payload) {
  const { requestId, result, error } = payload;

  console.log(`\n📥 Service response for request: ${requestId}`);
  if (error) {
    console.log(`   ❌ Error:`, error);
  } else {
    console.log(`   ✅ Result:`, result);
  }

  // Resolve pending request
  const resolve = pendingRequests.get(requestId);
  if (resolve) {
    resolve(result);
    pendingRequests.delete(requestId);
  }
}

// Helper to call other services
function callService(capability, service, input) {
  return new Promise((resolve) => {
    const requestId = `req-${Date.now()}-${Math.random()}`;
    pendingRequests.set(requestId, resolve);

    ws.send(JSON.stringify({
      type: 'service-call',
      payload: {
        requestId,
        capability,
        service,
        input
      }
    }));

    // Timeout after 30s
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        resolve({ error: 'timeout' });
      }
    }, 30000);
  });
}

// ============================================
// Event Handling (Pub/Sub)
// ============================================

function handleEvent(payload) {
  const { topic, data, publisher, timestamp } = payload;

  console.log(`\n📨 Event received on topic: ${topic}`);
  console.log(`   Publisher: ${publisher}`);
  console.log(`   Data:`, data);
  console.log(`   Timestamp: ${timestamp}`);

  // Handle different event types
  if (topic === 'order.created') {
    console.log(`   💡 New order detected! Recalculating pricing...`);
  } else if (topic === 'inventory.updated') {
    console.log(`   📦 Inventory updated! Adjusting prices...`);
  }
}

// Helper to publish events
function publishEvent(topic, data) {
  console.log(`\n📤 Publishing event to topic: ${topic}`);
  ws.send(JSON.stringify({
    type: 'event-publish',
    payload: {
      topic,
      payload: data
    }
  }));
}

ws.on('close', () => {
  console.log('❌ Disconnected from gateway');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  ws.close();
});

console.log('⏳ Waiting for connection...');
