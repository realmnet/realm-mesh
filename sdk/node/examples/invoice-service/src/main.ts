import { Realm, loadRealmConfigFromEnv } from '@interrealm/sdk';
import { config } from 'dotenv';
import 'reflect-metadata';

// Import service implementations to trigger decorators
import './services/InvoiceService';

// Load environment variables
config();

async function main() {
  try {
    // Create realm from environment configuration
    const realm = new Realm(loadRealmConfigFromEnv());

    // Initialize the realm
    await realm.initialize();
    console.log('✓ Invoice service is ready');

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('\nShutting down invoice service...');
      await realm.shutdown();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Keep process alive
    process.stdin.resume();
  } catch (error) {
    console.error('Failed to start invoice service:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});