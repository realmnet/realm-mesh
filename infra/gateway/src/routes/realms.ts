import { Router, Request, Response } from 'express';
import { RealmService } from '../services/realm-service';
import { requireApiKey } from '../middleware/auth';

export function createRealmsRouter(realmService: RealmService, routeTable: Map<string, any>) {
  const router = Router();

  router.get('/', requireApiKey, async (req: Request, res: Response) => {
    try {
      const realms = await realmService.getAllRealms();

      // Add connected clients info to each realm
      const realmsWithClients = realms.map(realm => {
        // Find all clients connected to this realm
        const connectedClients: any[] = [];

        routeTable.forEach((info, clientId) => {
          // Check if this client belongs to this realm (exact match or starts with realm.)
          if (clientId === realm.realm_id || clientId.startsWith(realm.realm_id + '.')) {
            connectedClients.push({
              clientId,
              services: info.services || [],
              capabilities: info.capabilities || [],
              agents: info.agents || [],
              isExternal: info.isExternal,
              connectedAt: info.connectedAt
            });
          }
        });

        return {
          ...realm,
          id: realm.realm_id, // Use realm_id as the public id
          connectedClients,
          clientCount: connectedClients.length,
          // Aggregate all capabilities from connected clients
          availableCapabilities: connectedClients.flatMap(c => c.capabilities),
          availableServices: connectedClients.flatMap(c => c.services),
          availableAgents: connectedClients.flatMap(c => c.agents)
        };
      });

      res.json(realmsWithClients);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/', requireApiKey, async (req: Request, res: Response) => {
    try {
      console.log('📥 [Realms] POST /api/realms - Creating new realm');
      console.log('📋 [Realms] Request body:', JSON.stringify(req.body, null, 2));

      const { id, parent_id, policies } = req.body;

      console.log('🔍 [Realms] Extracted params:', { id, parent_id, policies });

      await realmService.createRealm({ id, parent_id, policies });

      console.log('✅ [Realms] Realm created successfully:', id);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ [Realms] Error creating realm:', error);
      console.error('📝 [Realms] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.put('/:id/policies', requireApiKey, async (req: Request, res: Response) => {
    try {
      const { policies } = req.body;
      await realmService.updateRealmPolicies(req.params.id, policies);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.delete('/:id', requireApiKey, async (req: Request, res: Response) => {
    try {
      const realmId = req.params.id;
      const force = req.query.force === 'true';

      console.log('🗑️  [Realms] DELETE /api/realms/:id - Request to delete realm:', realmId);

      // Check if realm is currently connected
      const isConnected = routeTable.has(realmId);

      // Get database connections (services, clients, connections)
      const connections = await realmService.getRealmConnections(realmId);

      const hasActiveConnections = isConnected ||
        connections.services.length > 0 ||
        connections.clients.length > 0 ||
        connections.connections.length > 0;

      // If has active connections and not forcing, return warning
      if (hasActiveConnections && !force) {
        console.log('⚠️  [Realms] Realm has active connections, returning warning');
        return res.status(409).json({
          error: 'Realm has active connections',
          warning: true,
          connections: {
            isCurrentlyConnected: isConnected,
            services: connections.services,
            clients: connections.clients,
            activeConnections: connections.connections,
            totalCount: connections.services.length + connections.clients.length + connections.connections.length
          },
          message: 'This realm has active connections. Set force=true to delete anyway.'
        });
      }

      // Proceed with deletion
      await realmService.deleteRealm(realmId);

      console.log('✅ [Realms] Realm deleted successfully:', realmId);
      res.json({
        success: true,
        message: `Realm ${realmId} deleted successfully`,
        hadConnections: hasActiveConnections
      });
    } catch (error) {
      console.error('❌ [Realms] Error deleting realm:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}