#!/usr/bin/env node

import { Command } from 'commander';
import { generateCommand } from './commands/generate';

const program = new Command();

program
  .name('realmmesh')
  .description('RealmMesh CLI for code generation from capability schemas')
  .version('0.1.0');

program.addCommand(generateCommand);

program.parse(process.argv);