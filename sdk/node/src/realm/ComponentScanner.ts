import * as glob from 'glob';
import * as path from 'path';
import { Realm } from './Realm';
import { getServiceMetadata } from '../decorators/Service';
import { getAgentMetadata } from '../decorators/Agent';

export class ComponentScanner {
  constructor(private realm: Realm) {}

  async scan(patterns: string[]): Promise<void> {
    console.log('Scanning for components...', patterns);

    for (const pattern of patterns) {
      const files = glob.sync(pattern, { absolute: true });

      for (const file of files) {
        if (file.endsWith('.d.ts')) continue; // Skip type definitions

        try {
          await this.loadModule(file);
        } catch (error) {
          console.error(`Error loading module ${file}:`, error);
        }
      }
    }
  }

  private async loadModule(filepath: string): Promise<void> {
    const module = await import(filepath);

    // Check all exports for decorated classes
    for (const key of Object.keys(module)) {
      const exported = module[key];

      if (typeof exported === 'function') {
        // Check if it's a service
        const serviceMetadata = getServiceMetadata(exported);
        if (serviceMetadata) {
          console.log(`Found service: ${serviceMetadata.capability}.${serviceMetadata.name}`);
          // Already registered via decorator
        }

        // Check if it's an agent
        const agentMetadata = getAgentMetadata(exported);
        if (agentMetadata) {
          console.log(`Found agent: ${agentMetadata.capability}.${agentMetadata.name}`);
          // Already registered via decorator
        }
      }
    }
  }
}