const WebSocket = require('ws');
const chalk = require('chalk');

class PricingAgent {
  constructor() {
    this.agentId = 'pricing-agent-1';
    this.ws = null;
    this.activeLoops = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log(chalk.green('💰 PricingAgent connecting to gateway...'));

      this.ws = new WebSocket('ws://localhost:8080');

      this.ws.on('open', () => {
        console.log(chalk.green('✅ PricingAgent connected!'));
        this.sendHandshake();
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        console.error(chalk.red('❌ PricingAgent error:'), error.message);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log(chalk.yellow('👋 PricingAgent disconnected'));
      });
    });
  }

  sendHandshake() {
    this.send({
      type: 'register-realm',
      payload: {
        realmId: this.agentId,
        services: ['price-calculation', 'discount-calculation'],
        capabilities: ['pricing'],
        authToken: 'demo-token'
      }
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'discovery-response':
        console.log(chalk.green('🤝 Handshake acknowledged'));
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
    console.log(chalk.gray(`   Request: ${JSON.stringify(recruitmentMessage)}`));

    // Accept participation
    const accepts = true;
    console.log(chalk.green(`   ✓ Accepting participation`));

    this.send({
      type: 'loop-recruitment-response',
      payload: {
        loopId,
        agentId: this.agentId,
        accepts,
        bid: {
          confidence: 0.95,
          estimatedTime: 100
        }
      }
    });
  }

  async handleExecution(payload) {
    const { loopId, loopName, input } = payload;

    console.log(chalk.magenta(`\n⚡ Executing: ${loopName}`));
    console.log(chalk.gray(`   Product: ${input.productId}`));
    console.log(chalk.gray(`   Quantity: ${input.quantity}`));

    // Simulate pricing calculation
    await this.sleep(1000);

    const basePrice = 100;
    const bulkDiscount = input.quantity >= 10 ? 15 : 0;
    const dynamicDiscount = Math.floor(Math.random() * 10);
    const finalPrice = basePrice - bulkDiscount - dynamicDiscount;

    const result = {
      price: finalPrice,
      breakdown: {
        basePrice,
        bulkDiscount,
        dynamicDiscount
      },
      confidence: 0.95,
      source: 'PricingAgent'
    };

    console.log(chalk.green(`   💵 Calculated price: ${finalPrice}`));
    console.log(chalk.gray(`   Confidence: 95%`));

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
const agent = new PricingAgent();
agent.connect().catch(err => {
  console.error('Failed to start agent:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 Shutting down PricingAgent...'));
  if (agent.ws) {
    agent.ws.close();
  }
  process.exit(0);
});