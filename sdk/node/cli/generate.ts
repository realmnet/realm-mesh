#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'yaml';
import { resolve, basename } from 'path';
import { CapabilityCodeGenerator } from '../src/generators/CapabilityCodeGenerator';

const program = new Command();

program
  .name('interrealm-generate')
  .description('Generate TypeScript code from capability YAML')
  .version('1.0.0')
  .argument('<capability-file>', 'Path to capability YAML file')
  .option('-o, --output <path>', 'Output file path (defaults to stdout)')
  .action(async (capabilityFile: string, options: any) => {
    try {
      const capabilityPath = resolve(capabilityFile);
      const capabilityContent = readFileSync(capabilityPath, 'utf-8');
      const capability = parse(capabilityContent);

      console.log(`Generating TypeScript for: ${basename(capabilityFile)}`);

      const generator = new CapabilityCodeGenerator();
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

program.parse();