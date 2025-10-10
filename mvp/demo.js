const { spawn } = require('child_process');
const chalk = require('chalk');
const path = require('path');

console.log(chalk.bold.cyan('\n🚀 RealmMesh MVP Demo\n'));
console.log(chalk.gray('Starting all components...\n'));

const processes = [];

// Helper to spawn process with nice output
function spawnProcess(name, command, args, cwd, color = 'white') {
  const proc = spawn(command, args, {
    cwd: cwd,
    stdio: 'pipe',
    shell: process.platform === 'win32' // Only use shell on Windows if needed
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    lines.forEach(line => {
      console.log(chalk[color](`[${name}]`), line);
    });
  });

  proc.stderr.on('data', (data) => {
    console.error(chalk.red(`[${name} ERROR]`), data.toString());
  });

  proc.on('close', (code) => {
    if (code !== 0) {
      console.error(chalk.red(`[${name}] Process exited with code ${code}`));
    }
  });

  processes.push({ name, proc });
  return proc;
}

// 1. Start Gateway
console.log(chalk.yellow('📡 Starting Gateway...\n'));
const gateway = spawnProcess(
  'Gateway',
  'npm',
  ['run', 'dev'],
  path.join(__dirname, '../infra/gateway'),
  'yellow'
);

// Wait for gateway to be ready
setTimeout(() => {

  // 2. Open Web Console
  console.log(chalk.magenta('\n🖥️  Opening Web Console...\n'));
  import('open').then(({ default: open }) => {
    return open('http://localhost:3000');
  }).catch(err => {
    console.log(chalk.gray('Could not auto-open browser. Visit http://localhost:3000'));
  });

  // 3. Start Agents
  setTimeout(() => {
    console.log(chalk.green('\n🤖 Starting Agents...\n'));

    const pricingAgent = spawnProcess(
      'PricingAgent',
      'npm',
      ['start'],
      path.join(__dirname, 'agents/pricing-agent'),
      'green'
    );

    const inventoryAgent = spawnProcess(
      'InventoryAgent',
      'npm',
      ['start'],
      path.join(__dirname, 'agents/inventory-agent'),
      'blue'
    );

    // 4. Run Demo Scenario
    setTimeout(() => {
      console.log(chalk.cyan('\n🎬 Running demo scenario...\n'));
      const scenario = spawnProcess(
        'Scenario',
        'node',
        ['scenarios/price-check-scenario.js'],
        __dirname,
        'cyan'
      );
    }, 4000);

  }, 2000);

}, 3000);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Shutting down demo...\n'));

  processes.forEach(({ name, proc }) => {
    console.log(chalk.gray(`Stopping ${name}...`));
    proc.kill();
  });

  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

console.log(chalk.gray('\nPress Ctrl+C to stop the demo\n'));