#!/usr/bin/env node

/**
 * MVP Realm Seeding Script
 * Creates the necessary realms for the MVP demo
 */

const http = require('http');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ADMIN_API = process.env.ADMIN_API || 'http://localhost:3001';
const API_KEY = process.env.ADMIN_API_KEY || 'admin-key-123';

console.log('🌱 Seeding MVP Realms...\n');
console.log(`📍 Admin API: ${ADMIN_API}`);
console.log(`🔑 API Key: ${API_KEY}\n`);

// Realms to create for MVP
const realms = [
  {
    id: 'mvp',
    display_name: 'MVP Demo Environment',
    realm_type: 'folder',
    description: 'Root realm for MVP demo scenarios',
    parent_id: null,
    policies: []
  },
  {
    id: 'mvp.pricing',
    display_name: 'Pricing Services',
    realm_type: 'service',
    description: 'Pricing and discount calculation services',
    parent_id: null, // Will be set to mvp realm UUID after creation
    policies: []
  },
  {
    id: 'mvp.inventory',
    display_name: 'Inventory Services',
    realm_type: 'service',
    description: 'Stock management and inventory services',
    parent_id: null, // Will be set to mvp realm UUID after creation
    policies: []
  },
  {
    id: 'mvp.demo',
    display_name: 'Demo Scenarios',
    realm_type: 'service',
    description: 'Test and demo scenario realm',
    parent_id: null, // Will be set to mvp realm UUID after creation
    policies: []
  }
];

/**
 * Make HTTP POST request to create realm
 */
function createRealm(realm) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      id: realm.id,
      display_name: realm.display_name,
      realm_type: realm.realm_type,
      description: realm.description,
      parent_id: realm.parent_id,
      policies: realm.policies
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/realms',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-api-key': API_KEY
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const result = JSON.parse(responseData);
            resolve(result);
          } catch (e) {
            resolve({ realm_id: realm.id });
          }
        } else {
          reject(new Error(`Failed to create realm: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Wait for broker to be ready
 */
function waitForBroker(retries = 10, delay = 2000) {
  return new Promise((resolve, reject) => {
    const checkConnection = (attemptsLeft) => {
      const req = http.get(`${ADMIN_API}/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Broker is ready!\n');
          resolve();
        } else {
          retryOrFail(attemptsLeft);
        }
      });

      req.on('error', () => {
        retryOrFail(attemptsLeft);
      });
    };

    const retryOrFail = (attemptsLeft) => {
      if (attemptsLeft > 0) {
        console.log(`⏳ Waiting for broker... (${attemptsLeft} attempts left)`);
        setTimeout(() => checkConnection(attemptsLeft - 1), delay);
      } else {
        reject(new Error('Broker not available after maximum retries'));
      }
    };

    checkConnection(retries);
  });
}

/**
 * Main seeding function
 */
async function seedRealms() {
  try {
    // Wait for broker to be ready
    await waitForBroker();

    console.log('📝 Creating realms...\n');

    let mvpRealmUuid = null;

    for (const realm of realms) {
      try {
        console.log(`  Creating: ${realm.id} (${realm.display_name})`);

        const result = await createRealm(realm);

        // Store MVP realm UUID for children
        if (realm.id === 'mvp') {
          mvpRealmUuid = result.id || result.realm_id;
          console.log(`    ✅ Created (UUID: ${mvpRealmUuid})`);
        } else {
          console.log(`    ✅ Created`);
        }
      } catch (error) {
        if (error.message.includes('409') || error.message.includes('already exists')) {
          console.log(`    ℹ️  Already exists (skipping)`);
        } else {
          console.log(`    ⚠️  Error: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Realm seeding complete!\n');
    console.log('📋 Created realms:');
    realms.forEach(r => console.log(`  - ${r.id}`));
    console.log('');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('\n💡 Make sure the broker is running:');
    console.error('   make broker-dev\n');
    process.exit(1);
  }
}

// Run seeding
seedRealms();
