import 'reflect-metadata';

export interface LoopCoordinatorMetadata {
  capability: string;
  loopName: string;
}

const LOOP_COORDINATOR_METADATA_KEY = Symbol('interrealm:loop-coordinator');

export function LoopCoordinator(metadata: LoopCoordinatorMetadata) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(LOOP_COORDINATOR_METADATA_KEY, metadata, constructor);
    return constructor;
  };
}

export function getLoopCoordinatorMetadata(target: any): LoopCoordinatorMetadata | undefined {
  return Reflect.getMetadata(LOOP_COORDINATOR_METADATA_KEY, target);
}