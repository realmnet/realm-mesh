const WebSocket = require('ws');
const chalk = require('chalk');

console.log(chalk.bold.cyan('\n🎬 Price Check Scenario'));
console.log(chalk.gray('Initiating a loop to check price and inventory...\n'));

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log(chalk.green('✅ Connected to gateway\n'));

  // Send handshake
  ws.send(JSON.stringify({
    type: 'register-realm',
    payload: {
      realmId: 'demo-scenario',
      services: [],
      capabilities: [],
      authToken: 'demo-token'
    }
  }));

  setTimeout(() => {
    console.log(chalk.cyan('📤 Initiating PriceCheck loop...\n'));

    // Initiate a loop
    ws.send(JSON.stringify({
      type: 'loop-initiate',
      payload: {
        loopId: 'demo-loop-' + Date.now(),
        capability: 'pricing',
        loopName: 'PriceCheck',
        input: {
          productId: 'PROD-123',
          quantity: 15
        },
        options: {
          recruitmentTimeout: 5000,
          executionTimeout: 10000,
          minParticipants: 1
        }
      }
    }));
  }, 1000);
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());

  switch (message.type) {
    case 'discovery-response':
      console.log(chalk.green('🤝 Scenario connected\n'));
      break;

    case 'loop-recruitment-complete':
      console.log(chalk.yellow(`📋 Recruitment complete: ${message.payload.participantCount} agents recruited\n`));
      break;

    case 'loop-execution-complete':
      console.log(chalk.blue('⚙️  All agents finished executing\n'));
      break;

    case 'loop-complete':
      console.log(chalk.bold.green('\n✅ LOOP COMPLETE!\n'));
      console.log(chalk.white('Final Result:'));
      console.log(JSON.stringify(message.payload.result, null, 2));
      console.log('');

      setTimeout(() => {
        ws.close();
        process.exit(0);
      }, 1000);
      break;

    case 'loop-failed':
      console.log(chalk.bold.red('\n❌ LOOP FAILED!\n'));
      console.log(chalk.red('Reason:'), message.payload.reason);
      console.log('');

      setTimeout(() => {
        ws.close();
        process.exit(1);
      }, 1000);
      break;
  }
});

ws.on('error', (error) => {
  console.error(chalk.red('❌ Scenario error:'), error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log(chalk.gray('👋 Scenario disconnected'));
});