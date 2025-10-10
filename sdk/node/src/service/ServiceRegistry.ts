import { Realm } from '../realm/Realm';
import { ServiceMetadata, getServiceMetadata } from '../decorators/Service';
import { getInjectMetadata, InjectMetadata } from '../decorators/Inject';

interface RegisteredService {
  metadata: ServiceMetadata;
  constructor: any;
  instance?: any;
}

export class ServiceRegistry {
  private static serviceClasses: Map<any, ServiceMetadata> = new Map();
  private services: Map<string, RegisteredService> = new Map();

  constructor(private realm: Realm) {}

  static registerServiceClass(constructor: any, metadata: ServiceMetadata): void {
    this.serviceClasses.set(constructor, metadata);
  }

  async registerAll(): Promise<void> {
    for (const [constructor, metadata] of ServiceRegistry.serviceClasses) {
      await this.register(constructor, metadata);
    }
  }

  private async register(constructor: any, metadata: ServiceMetadata): Promise<void> {
    const key = this.getServiceKey(metadata);

    if (this.services.has(key)) {
      console.warn(`Service ${key} already registered`);
      return;
    }

    // Create instance and inject dependencies
    const instance = await this.createInstance(constructor);

    this.services.set(key, {
      metadata,
      constructor,
      instance
    });

    // Register with bridge manager for incoming calls
    this.realm.getBridgeManager().registerServiceHandler(
      metadata,
      async (input: any) => {
        return await instance.call(input);
      }
    );

    console.log(`Registered service: ${key}`);
  }

  private async createInstance(constructor: any): Promise<any> {
    const instance = new constructor();

    // Inject dependencies
    const injections = getInjectMetadata(constructor);

    for (const injection of injections) {
      const client = this.createServiceClient(injection);
      instance[injection.propertyKey] = client;
    }

    return instance;
  }

  private createServiceClient(injection: InjectMetadata): any {
    return {
      call: async (input: any) => {
        return await this.realm.getBridgeManager().callService(
          injection.capability,
          injection.service,
          input
        );
      },
      callWithOptions: async (input: any, options: any) => {
        return await this.realm.getBridgeManager().callService(
          injection.capability,
          injection.service,
          input,
          options
        );
      }
    };
  }

  private getServiceKey(metadata: ServiceMetadata): string {
    return `${metadata.capability}.${metadata.name}`;
  }

  getService(capability: string, name: string): RegisteredService | undefined {
    return this.services.get(`${capability}.${name}`);
  }
}