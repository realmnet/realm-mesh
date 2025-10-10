const WebSocket = require('ws');

const CLIENT_ID = 'inventory-client-1';
const GATEWAY_URL = process.env.GATEWAY_URL || 'ws://localhost:8080';
const AGENT_NAME = 'InventoryAgent';

console.log(`🚀 Starting ${AGENT_NAME}...`);
console.log(`📡 Connecting to gateway: ${GATEWAY_URL}`);

const ws = new WebSocket(GATEWAY_URL);
let inventory = {
  'PROD-123': { stock: 50, location: 'warehouse-1' },
  'PROD-456': { stock: 25, location: 'warehouse-2' },
  'PROD-789': { stock: 100, location: 'warehouse-1' }
};

ws.on('open', () => {
  console.log(`✅ Connected to gateway`);

  // Send client handshake
  ws.send(JSON.stringify({
    type: 'client-handshake',
    payload: {
      clientId: CLIENT_ID,
      authToken: 'demo-token-inventory',
      provides: {
        agents: [
          {
            name: AGENT_NAME,
            participatesIn: ['PriceCheck', 'InventoryCheck'],
            skills: ['stock-management', 'fulfillment']
          }
        ],
        services: ['GetInventory', 'UpdateStock'],
        eventHandlers: ['order.created']
      },
      consumes: {
        services: ['CalculatePrice'],
        events: ['price.updated']
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
  const { loopId, loopName, recruitmentMessage } = payload;

  console.log(`\n🔔 Recruitment for loop: ${loopName} (${loopId})`);
  console.log(`   Input:`, recruitmentMessage);

  const shouldAccept = true;
  console.log(`   Decision: ${shouldAccept ? '✅ ACCEPT' : '❌ DECLINE'}`);

  ws.send(JSON.stringify({
    type: 'loop-recruitment-response',
    payload: {
      loopId,
      agentId: CLIENT_ID,
      accepts: shouldAccept,
      bid: {
        confidence: 0.90,
        estimatedTime: 150
      }
    }
  }));
}

function handleExecution(payload) {
  const { loopId, loopName, input } = payload;

  console.log(`\n⚡ Executing loop: ${loopName} (${loopId})`);
  console.log(`   Input:`, input);

  // Simulate inventory check
  const productId = input.productId || 'PROD-123';
  const stock = inventory[productId] || { stock: 0, location: 'unknown' };

  const result = {
    productId,
    inStock: stock.stock > 0,
    quantity: stock.stock,
    location: stock.location,
    agent: AGENT_NAME
  };

  console.log(`   📦 Inventory check result:`, result);

  ws.send(JSON.stringify({
    type: 'loop-execute-response',
    payload: {
      loopId,
      agentId: CLIENT_ID,
      result
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
  const { requestId, service, input, callerRealm } = payload;

  console.log(`\n📞 Service call: ${service} from ${callerRealm}`);
  console.log(`   Request ID: ${requestId}`);
  console.log(`   Input:`, input);

  let result;

  if (service.includes('GetInventory')) {
    const productId = input.productId || 'PROD-123';
    result = {
      productId,
      ...inventory[productId],
      timestamp: new Date().toISOString()
    };
  } else if (service.includes('UpdateStock')) {
    const { productId, quantity } = input;
    if (inventory[productId]) {
      inventory[productId].stock = quantity;
      result = { success: true, productId, newStock: quantity };

      // Publish inventory updated event
      publishEvent('inventory.updated', { productId, newStock: quantity });
    } else {
      result = { success: false, error: 'Product not found' };
    }
  } else {
    result = { error: 'Unknown service' };
  }

  console.log(`   📦 Result:`, result);

  ws.send(JSON.stringify({
    type: 'service-response',
    payload: {
      requestId,
      result
    }
  }));
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

  if (topic === 'order.created') {
    console.log(`   💡 New order! Checking inventory...`);
    const productId = data.productId;
    if (inventory[productId]) {
      console.log(`   📦 Current stock for ${productId}:`, inventory[productId].stock);
    }
  }
}

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

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  ws.close();
});

console.log('⏳ Waiting for connection...');
