import { EventEmitter } from 'events';
import { RealmConfig } from './RealmConfig';
import { ComponentScanner } from './ComponentScanner';
import { ServiceRegistry } from '../service/ServiceRegistry';
import { AgentRegistry } from '../agent/AgentRegistry';
import { EventBus } from '../event/EventBus';
import { BridgeManager } from './BridgeManager';

export class Realm extends EventEmitter {
  private config: RealmConfig;
  private serviceRegistry: ServiceRegistry;
  private agentRegistry: AgentRegistry;
  private eventBus: EventBus;
  private bridgeManager: BridgeManager;
  private scanner: ComponentScanner;
  private initialized = false;

  constructor(config: RealmConfig) {
    super();
    this.config = this.validateConfig(config);
    this.serviceRegistry = new ServiceRegistry(this);
    this.agentRegistry = new AgentRegistry(this);
    this.eventBus = new EventBus(this);
    this.bridgeManager = new BridgeManager(this);
    this.scanner = new ComponentScanner(this);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error('Realm already initialized');
    }

    console.log(`Initializing realm: ${this.config.realmId}`);

    // 1. Connect to the gateway
    await this.bridgeManager.connect(this.config.routingUrl);

    // 2. Scan for annotated components if auto-discovery enabled
    if (this.config.autoDiscovery) {
      await this.discoverComponents();
    }

    // 3. Register all services
    await this.serviceRegistry.registerAll();

    // 4. Register all agents
    await this.agentRegistry.registerAll();

    // 5. Start event bus
    await this.eventBus.start();

    this.initialized = true;
    this.emit('ready');

    console.log(`Realm ${this.config.realmId} is ready`);
  }

  private async discoverComponents(): Promise<void> {
    const paths = this.config.componentPaths || ['./src/**/*.ts'];
    await this.scanner.scan(paths);
  }

  async shutdown(): Promise<void> {
    console.log(`Shutting down realm: ${this.config.realmId}`);

    await this.eventBus.stop();
    await this.bridgeManager.disconnect();

    this.initialized = false;
    this.emit('shutdown');
  }

  getServiceRegistry(): ServiceRegistry { return this.serviceRegistry; }
  getAgentRegistry(): AgentRegistry { return this.agentRegistry; }
  getEventBus(): EventBus { return this.eventBus; }
  getBridgeManager(): BridgeManager { return this.bridgeManager; }
  getConfig(): RealmConfig { return this.config; }

  private validateConfig(config: RealmConfig): RealmConfig {
    if (!config.realmId) throw new Error('realmId is required');
    if (!config.routingUrl) throw new Error('routingUrl is required');
    return {
      ...config,
      autoDiscovery: config.autoDiscovery ?? true,
      componentPaths: config.componentPaths || ['./src/**/*.ts'],
      logging: config.logging || { level: 'info' },
      retry: config.retry || { maxAttempts: 3, backoffMs: 1000 }
    };
  }
}