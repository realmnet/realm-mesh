import 'reflect-metadata';

const INJECT_METADATA_KEY = Symbol('interrealm:inject');

export interface InjectMetadata {
  capability: string;
  service: string;
  version?: string;
  propertyKey: string;
}

export function Inject(capability?: string, service?: string) {
  return function (target: any, propertyKey: string) {
    const metadata: InjectMetadata = {
      capability: capability || '',
      service: service || '',
      propertyKey
    };

    const existing = Reflect.getMetadata(INJECT_METADATA_KEY, target.constructor) || [];
    existing.push(metadata);
    Reflect.defineMetadata(INJECT_METADATA_KEY, existing, target.constructor);
  };
}

export function getInjectMetadata(target: any): InjectMetadata[] {
  return Reflect.getMetadata(INJECT_METADATA_KEY, target) || [];
}