import 'reflect-metadata';
import { AgentRegistry } from '../agent/AgentRegistry';

export interface AgentMetadata {
  capability: string;
  name: string;
  version?: string;
  participatesIn?: string[];
  skills?: string[];
}

const AGENT_METADATA_KEY = Symbol('interrealm:agent');

export function Agent(metadata: AgentMetadata) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(AGENT_METADATA_KEY, metadata, constructor);

    // Register agent class for discovery
    AgentRegistry.registerAgentClass(constructor, metadata);

    return constructor;
  };
}

export function getAgentMetadata(target: any): AgentMetadata | undefined {
  return Reflect.getMetadata(AGENT_METADATA_KEY, target);
}