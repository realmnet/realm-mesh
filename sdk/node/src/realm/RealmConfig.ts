export interface RealmConfig {
  /** Unique realm identifier */
  realmId: string;

  /** Routing URL for this realm's gateway */
  routingUrl: string;

  /** Optional authentication token */
  authToken?: string;

  /** Capabilities this realm provides */
  capabilities?: string[];

  /** Directory to scan for annotated components */
  componentPaths?: string[];

  /** Enable auto-discovery of services/agents */
  autoDiscovery?: boolean;

  /** Logging configuration */
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    pretty?: boolean;
  };

  /** Connection retry configuration */
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
}