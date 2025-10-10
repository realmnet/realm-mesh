export interface RealmEnvConfig {
  REALM_ID: string;
  ROUTING_URL: string;
  AUTH_TOKEN?: string;
  CAPABILITIES?: string; // comma-separated
  COMPONENT_PATHS?: string; // comma-separated
  AUTO_DISCOVERY?: string; // "true" or "false"
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  LOG_PRETTY?: string; // "true" or "false"
}

export function loadRealmConfigFromEnv(): {
  realmId: string;
  routingUrl: string;
  authToken?: string;
  capabilities?: string[];
  componentPaths?: string[];
  autoDiscovery?: boolean;
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    pretty?: boolean;
  };
} {
  const env = process.env as unknown as RealmEnvConfig;

  if (!env.REALM_ID) {
    throw new Error('REALM_ID environment variable is required');
  }

  if (!env.ROUTING_URL) {
    throw new Error('ROUTING_URL environment variable is required');
  }

  return {
    realmId: env.REALM_ID,
    routingUrl: env.ROUTING_URL,
    authToken: env.AUTH_TOKEN,
    capabilities: env.CAPABILITIES?.split(',').map(c => c.trim()),
    componentPaths: env.COMPONENT_PATHS?.split(',').map(p => p.trim()),
    autoDiscovery: env.AUTO_DISCOVERY !== 'false',
    logging: {
      level: env.LOG_LEVEL || 'info',
      pretty: env.LOG_PRETTY === 'true'
    }
  };
}