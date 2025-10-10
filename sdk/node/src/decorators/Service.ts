import 'reflect-metadata';
import { ServiceRegistry } from '../service/ServiceRegistry';

export interface ServiceMetadata {
  capability: string;
  name: string;
  version?: string;
  timeout?: number;
  retries?: number;
  idempotent?: boolean;
}

const SERVICE_METADATA_KEY = Symbol('interrealm:service');

export function Service(metadata: ServiceMetadata) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(SERVICE_METADATA_KEY, metadata, constructor);

    // Register this service class globally for discovery
    ServiceRegistry.registerServiceClass(constructor, metadata);

    return constructor;
  };
}

export function getServiceMetadata(target: any): ServiceMetadata | undefined {
  return Reflect.getMetadata(SERVICE_METADATA_KEY, target);
}