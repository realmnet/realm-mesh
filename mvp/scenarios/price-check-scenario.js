const WebSocket = require('ws');

console.log('🎬 Starting Price Check Scenario...\n');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('✅ Connected to gateway\n');
  
  // Wait a moment for agents to be ready
  setTimeout(() => {
    console.log('🚀 Initiating PriceCheck loop...\n');
    
    ws.send(JSON.stringify({
      type: 'loop-initiate',
      payload: {
        loopId: 'demo-loop-' + Date.now(),
        capability: 'pricing',
        loopName: 'PriceCheck',
        input: {
          productId: 'PROD-123',
          quantity: 10
        },
        options: {
          recruitmentTimeout: 5000,
          executionTimeout: 10000,
          minParticipants: 1
        }
      }
    }));
  }, 2000);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  
  switch (msg.type) {
    case 'loop-recruitment-complete':
      console.log(`📋 Recruitment complete: ${msg.payload.participantCount} participants\n`);
      break;
      
    case 'loop-complete':
      console.log('\n✅ Loop Complete!');
      console.log('━'.repeat(50));
      console.log(JSON.stringify(msg.payload.result, null, 2));
      console.log('━'.repeat(50));
      console.log(`\nDuration: ${msg.payload.duration}ms`);
      console.log(`\n🎉 Demo complete! Press Ctrl+C to exit.\n`);
      break;
      
    case 'loop-failed':
      console.error('\n❌ Loop Failed!');
      console.error(msg.payload);
      process.exit(1);
      break;
  }
});

ws.on('error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('\nMake sure the gateway is running on ws://localhost:8080');
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down scenario...');
  ws.close();
  process.exit(0);
});
