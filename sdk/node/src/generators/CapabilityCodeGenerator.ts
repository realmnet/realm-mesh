import { pascalCase, camelCase, constantCase } from 'change-case';

interface Capability {
  capability: {
    name: string;
    version: string;
    description?: string;
  };
  metadata?: {
    author?: string;
    tags?: string[];
    license?: string;
  };
  interface?: {
    operations?: Operation[];
    events?: Event[];
    errors?: ErrorDef[];
  };
  configuration?: {
    parameters?: Parameter[];
  };
  authorization?: {
    roles?: string[];
    permissions?: string[];
  };
}

interface Operation {
  name: string;
  description?: string;
  input?: {
    parameters?: Parameter[];
  };
  output?: {
    type: string;
    schema?: any;
  };
}

interface Parameter {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  default?: any;
  enum?: string[];
  schema?: any;
}

interface Event {
  name: string;
  description?: string;
  payload?: {
    type: string;
    schema?: any;
  };
}

interface ErrorDef {
  code: string;
  name: string;
  description?: string;
}

export class CapabilityCodeGenerator {
  generate(capability: Capability): string {
    const lines: string[] = [];

    lines.push('// Auto-generated TypeScript code from capability definition');
    lines.push(`// Capability: ${capability.capability.name} v${capability.capability.version}`);
    if (capability.capability.description) {
      lines.push(`// ${capability.capability.description}`);
    }
    lines.push('');
    lines.push("import { Service, Agent, EventHandler, LoopParticipant, ServiceClient, EventPublisher } from '@interrealm/sdk';");
    lines.push('');

    this.generateMetadata(capability, lines);
    this.generateConfiguration(capability, lines);
    this.generateErrors(capability, lines);
    this.generateEvents(capability, lines);
    this.generateOperations(capability, lines);
    this.generateServiceImplementation(capability, lines);
    this.generateAgentImplementation(capability, lines);

    return lines.join('\n');
  }

  private generateMetadata(capability: Capability, lines: string[]): void {
    if (!capability.metadata) return;

    lines.push('export const CAPABILITY_METADATA = {');
    lines.push(`  name: '${capability.capability.name}',`);
    lines.push(`  version: '${capability.capability.version}',`);
    if (capability.metadata.author) {
      lines.push(`  author: '${capability.metadata.author}',`);
    }
    if (capability.metadata.tags) {
      lines.push(`  tags: [${capability.metadata.tags.map(t => `'${t}'`).join(', ')}],`);
    }
    if (capability.metadata.license) {
      lines.push(`  license: '${capability.metadata.license}',`);
    }
    lines.push('} as const;');
    lines.push('');
  }

  private generateConfiguration(capability: Capability, lines: string[]): void {
    if (!capability.configuration?.parameters) return;

    lines.push('export interface Configuration {');
    for (const param of capability.configuration.parameters) {
      const optional = param.required ? '' : '?';
      lines.push(`  ${camelCase(param.name)}${optional}: ${this.mapType(param.type)};`);
    }
    lines.push('}');
    lines.push('');
  }

  private generateErrors(capability: Capability, lines: string[]): void {
    if (!capability.interface?.errors) return;

    lines.push('export enum ErrorCode {');
    for (const error of capability.interface.errors) {
      lines.push(`  ${constantCase(error.name)} = '${error.code}',`);
    }
    lines.push('}');
    lines.push('');

    lines.push('export class CapabilityError extends Error {');
    lines.push('  constructor(public code: ErrorCode, message: string) {');
    lines.push('    super(message);');
    lines.push('    this.name = \'CapabilityError\';');
    lines.push('  }');
    lines.push('}');
    lines.push('');
  }

  private generateEvents(capability: Capability, lines: string[]): void {
    if (!capability.interface?.events) return;

    for (const event of capability.interface.events) {
      const eventName = pascalCase(event.name);
      lines.push(`export interface ${eventName}Event {`);
      lines.push(`  type: '${event.name}';`);
      if (event.payload) {
        lines.push(`  payload: ${this.mapType(event.payload.type)};`);
      }
      lines.push('}');
      lines.push('');
    }

    lines.push('export type CapabilityEvent = ');
    const eventTypes = capability.interface.events.map(e => `${pascalCase(e.name)}Event`);
    lines.push(`  ${eventTypes.join(' | ')};`);
    lines.push('');
  }

  private generateOperations(capability: Capability, lines: string[]): void {
    if (!capability.interface?.operations) return;

    for (const operation of capability.interface.operations) {
      const opName = pascalCase(operation.name);

      if (operation.input?.parameters) {
        lines.push(`export interface ${opName}Input {`);
        for (const param of operation.input.parameters) {
          const optional = param.required ? '' : '?';
          lines.push(`  ${camelCase(param.name)}${optional}: ${this.mapType(param.type)};`);
        }
        lines.push('}');
        lines.push('');
      }

      if (operation.output) {
        lines.push(`export type ${opName}Output = ${this.mapType(operation.output.type)};`);
        lines.push('');
      }
    }
  }

  private generateServiceImplementation(capability: Capability, lines: string[]): void {
    if (!capability.interface?.operations) return;

    const capabilityName = pascalCase(capability.capability.name);

    lines.push('// ============================================');
    lines.push('// Service Implementation Template');
    lines.push('// ============================================');
    lines.push('');
    lines.push(`@Service({`);
    lines.push(`  capability: '${capability.capability.name}',`);
    lines.push(`  name: '${capabilityName}Service',`);
    lines.push(`  timeout: 30000,`);
    lines.push(`  retries: 2`);
    lines.push(`})`);
    lines.push(`export class ${capabilityName}Service {`);

    if (capability.configuration?.parameters) {
      lines.push('  private config: Configuration;');
      lines.push('');
      lines.push('  constructor(config: Configuration) {');
      lines.push('    this.config = config;');
      lines.push('  }');
      lines.push('');
    }

    for (const operation of capability.interface.operations) {
      const opName = camelCase(operation.name);
      const inputType = operation.input?.parameters ? `${pascalCase(operation.name)}Input` : 'void';
      const outputType = operation.output ? `${pascalCase(operation.name)}Output` : 'void';

      lines.push(`  async ${opName}(input: ${inputType}): Promise<${outputType}> {`);
      lines.push(`    // TODO: Implement ${operation.name}`);
      lines.push(`    throw new Error('Not implemented');`);
      lines.push(`  }`);
      lines.push('');
    }

    lines.push('}');
    lines.push('');
  }

  private generateAgentImplementation(capability: Capability, lines: string[]): void {
    const capabilityName = pascalCase(capability.capability.name);

    lines.push('// ============================================');
    lines.push('// Agent Implementation Template (Optional)');
    lines.push('// ============================================');
    lines.push('');
    lines.push(`/*`);
    lines.push(`@Agent({`);
    lines.push(`  capability: '${capability.capability.name}',`);
    lines.push(`  name: '${capabilityName}Agent',`);
    lines.push(`  participatesIn: ['${capabilityName}Loop'],`);
    lines.push(`  skills: ['${capability.capability.name}']`);
    lines.push(`})`);
    lines.push(`export class ${capabilityName}Agent implements LoopParticipant {`);
    lines.push(`  async onRecruitment(context: any): Promise<boolean> {`);
    lines.push(`    // Decide whether to participate`);
    lines.push(`    return true;`);
    lines.push(`  }`);
    lines.push('');
    lines.push(`  async execute(input: any, context: any): Promise<any> {`);
    lines.push(`    // Implement agent logic`);
    lines.push(`    return {};`);
    lines.push(`  }`);
    lines.push('');
    lines.push(`  async onComplete(result: any, context: any): Promise<void> {`);
    lines.push(`    // Handle completion`);
    lines.push(`  }`);
    lines.push(`}`);
    lines.push(`*/`);
  }

  private mapType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'integer': 'number',
      'number': 'number',
      'boolean': 'boolean',
      'array': 'any[]',
      'object': 'Record<string, any>',
      'any': 'any',
    };
    return typeMap[type.toLowerCase()] || 'any';
  }
}