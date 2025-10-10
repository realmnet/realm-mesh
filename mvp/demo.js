const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting RealmMesh MVP Demo...\n');

const processes = [];

// Function to check if a service is running
function checkService(url, callback) {
  const checkInterval = setInterval(() => {
    http.get(url, (res) => {
      if (res.statusCode === 200) {
        clearInterval(checkInterval);
        callback();
      }
    }).on('error', () => {
      // Still waiting...
    });
  }, 500);
}

// Function to spawn a process with colored output
function spawnProcess(name, command, args, options = {}) {
  const proc = spawn(command, args, {
    ...options,
    stdio: 'inherit',
    shell: true
  });
  
  proc.on('error', (err) => {
    console.error(`❌ Failed to start ${name}:`, err.message);
  });
  
  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`⚠️  ${name} exited with code ${code}`);
    }
  });
  
  processes.push({ name, proc });
  return proc;
}

// Start gateway
console.log('📡 Starting Gateway...');
const gateway = spawnProcess(
  'Gateway',
  'npm',
  ['run', 'dev'],
  { cwd: '../infra/gateway' }
);

// Wait for gateway to be ready
console.log('⏳ Waiting for gateway to be ready...\n');

setTimeout(() => {
  // Check if gateway is responding (admin API on port 3001)
  checkService('http://localhost:3001', () => {
    console.log('✅ Gateway is ready!\n');
    
    // Start web console
    console.log('🖥️  Starting Web Console...');
    const console_proc = spawnProcess(
      'Console',
      'npm',
      ['run', 'dev'],
      { cwd: '../apps/console' }
    );
    
    // Wait a bit for console to start
    setTimeout(() => {
      console.log('✅ Console should be running at http://localhost:3000\n');
      
      // Start pricing agent
      console.log('🤖 Starting Pricing Agent...');
      const pricingAgent = spawnProcess(
        'PricingAgent',
        'npm',
        ['start'],
        { cwd: './agents/pricing-agent' }
      );
      
      // Start inventory agent
      setTimeout(() => {
        console.log('🤖 Starting Inventory Agent...\n');
        const inventoryAgent = spawnProcess(
          'InventoryAgent',
          'npm',
          ['start'],
          { cwd: './agents/inventory-agent' }
        );
        
        // Run continuous orchestrator after agents are connected
        setTimeout(() => {
          console.log('🎪 Starting Continuous Demo Orchestrator...\n');
          console.log('━'.repeat(60));
          console.log('   This will cycle through:');
          console.log('   1. 🔄 Loop Coordination');
          console.log('   2. 📞 Service Calls (RPC)');
          console.log('   3. 📨 Event Publishing');
          console.log('━'.repeat(60) + '\n');

          const orchestrator = spawnProcess(
            'Orchestrator',
            'node',
            ['./scenarios/continuous-demo.js']
          );
        }, 3000);
      }, 2000);
    }, 2000);
  });
}, 3000);

// Cleanup on exit
function cleanup() {
  console.log('\n\n👋 Shutting down all processes...\n');
  processes.forEach(({ name, proc }) => {
    console.log(`   Stopping ${name}...`);
    proc.kill('SIGTERM');
  });
  
  setTimeout(() => {
    processes.forEach(({ proc }) => proc.kill('SIGKILL'));
    process.exit(0);
  }, 2000);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Keep the script running
console.log('\n📊 All services started!');
console.log('━'.repeat(60));
console.log('   Gateway:      http://localhost:8080');
console.log('   Web Console:  http://localhost:3000');
console.log('   Agents:       2 active');
console.log('━'.repeat(60));
console.log('\nPress Ctrl+C to stop all services.\n');
