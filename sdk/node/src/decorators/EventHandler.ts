import 'reflect-metadata';

export interface EventHandlerMetadata {
  capability: string;
  eventName: string;
  topic: string;
  filters?: Record<string, any>;
  methodName?: string;
}

const EVENT_HANDLER_METADATA_KEY = Symbol('interrealm:event-handler');

export function EventHandler(metadata: Omit<EventHandlerMetadata, 'methodName'>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const handlers = Reflect.getMetadata(EVENT_HANDLER_METADATA_KEY, target.constructor) || [];
    handlers.push({
      ...metadata,
      methodName: propertyKey
    });
    Reflect.defineMetadata(EVENT_HANDLER_METADATA_KEY, handlers, target.constructor);
    return descriptor;
  };
}

export function getEventHandlers(target: any): EventHandlerMetadata[] {
  return Reflect.getMetadata(EVENT_HANDLER_METADATA_KEY, target) || [];
}