const WebSocket = require('ws');
const chalk = require('chalk');

class InventoryAgent {
  constructor() {
    this.agentId = 'inventory-agent-1';
    this.ws = null;
    this.inventory = {
      'PROD-123': 50,
      'PROD-456': 30,
      'PROD-789': 100
    };
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log(chalk.blue('📦 InventoryAgent connecting to gateway...'));

      this.ws = new WebSocket('ws://localhost:8080');

      this.ws.on('open', () => {
        console.log(chalk.blue('✅ InventoryAgent connected!'));
        this.sendHandshake();
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        console.error(chalk.red('❌ InventoryAgent error:'), error.message);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log(chalk.yellow('👋 InventoryAgent disconnected'));
      });
    });
  }

  sendHandshake() {
    this.send({
      type: 'register-realm',
      payload: {
        realmId: this.agentId,
        services: ['stock-check', 'availability'],
        capabilities: ['inventory'],
        authToken: 'demo-token'
      }
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'discovery-response':
        console.log(chalk.blue('🤝 Handshake acknowledged'));
        break;

      case 'loop-recruitment':
        this.handleRecruitment(message.payload);
        break;

      case 'loop-execute':
        this.handleExecution(message.payload);
        break;

      case 'loop-complete':
        this.handleComplete(message.payload);
        break;
    }
  }

  handleRecruitment(payload) {
    const { loopId, loopName, recruitmentMessage } = payload;

    console.log(chalk.cyan(`\n🔔 Recruited for loop: ${loopName}`));
    console.log(chalk.gray(`   Loop ID: ${loopId}`));

    // Check if we have this product
    const hasProduct = this.inventory[recruitmentMessage.productId] !== undefined;

    if (hasProduct) {
      console.log(chalk.green(`   ✓ We have stock for ${recruitmentMessage.productId}`));
    } else {
      console.log(chalk.yellow(`   ✗ No stock info for ${recruitmentMessage.productId}`));
    }

    this.send({
      type: 'loop-recruitment-response',
      payload: {
        loopId,
        agentId: this.agentId,
        accepts: hasProduct,
        bid: {
          confidence: hasProduct ? 1.0 : 0,
          estimatedTime: 50
        }
      }
    });
  }

  async handleExecution(payload) {
    const { loopId, loopName, input } = payload;

    console.log(chalk.magenta(`\n⚡ Executing: ${loopName}`));
    console.log(chalk.gray(`   Checking stock for: ${input.productId}`));

    // Simulate stock check
    await this.sleep(800);

    const available = this.inventory[input.productId] || 0;
    const canFulfill = available >= input.quantity;

    const result = {
      available,
      requested: input.quantity,
      canFulfill,
      status: canFulfill ? 'in-stock' : 'insufficient',
      source: 'InventoryAgent'
    };

    if (canFulfill) {
      console.log(chalk.green(`   ✓ In stock: ${available} units available`));
    } else {
      console.log(chalk.yellow(`   ⚠️  Low stock: only ${available} available`));
    }

    this.send({
      type: 'loop-execute-response',
      payload: {
        loopId,
        agentId: this.agentId,
        result
      }
    });
  }

  handleComplete(payload) {
    const { loopId, result } = payload;
    console.log(chalk.blue(`\n✅ Loop complete!`));
    console.log(chalk.gray(`   Final result: ${JSON.stringify(result, null, 2)}`));
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the agent
const agent = new InventoryAgent();
agent.connect().catch(err => {
  console.error('Failed to start agent:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 Shutting down InventoryAgent...'));
  if (agent.ws) {
    agent.ws.close();
  }
  process.exit(0);
});