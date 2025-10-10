import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'yaml';
import { resolve, basename } from 'path';
import { TypeScriptGenerator } from '../generators/typescript';

export const generateCommand = new Command('generate')
  .description('Generate TypeScript code from capability YAML')
  .argument('<capability-file>', 'Path to capability YAML file')
  .option('-o, --output <path>', 'Output file path (defaults to stdout)')
  .option('-s, --schema <path>', 'Path to capability schema', './schemas/capability-schema.yaml')
  .action(async (capabilityFile: string, options: any) => {
    try {
      const capabilityPath = resolve(capabilityFile);
      const capabilityContent = readFileSync(capabilityPath, 'utf-8');
      const capability = parse(capabilityContent);

      console.log(`Generating TypeScript for: ${basename(capabilityFile)}`);

      const generator = new TypeScriptGenerator();
      const code = generator.generate(capability);

      if (options.output) {
        writeFileSync(options.output, code);
        console.log(`Generated TypeScript code written to: ${options.output}`);
      } else {
        console.log('\n--- Generated TypeScript Code ---\n');
        console.log(code);
      }
    } catch (error) {
      console.error('Error generating code:', error);
      process.exit(1);
    }
  });