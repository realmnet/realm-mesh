import { Router, Request, Response } from 'express';
import { RealmService } from '../services/realm-service';
import { requireApiKey } from '../middleware/auth';

export function createRealmsRouter(realmService: RealmService, routeTable: Map<string, any>) {
  const router = Router();

  router.get('/', requireApiKey, async (req: Request, res: Response) => {
    try {
      const realms = await realmService.getAllRealms();

      // Merge with runtime status
      const realmsWithStatus = realms.map(realm => {
        const routeInfo = routeTable.get(realm.realm_id);
        return {
          ...realm,
          id: realm.realm_id, // Use realm_id as the public id
          status: routeInfo ? 'connected' : 'disconnected',
          services: routeInfo?.services || [],
          capabilities: routeInfo?.capabilities || [],
          connectedAt: routeInfo?.connectedAt
        };
      });

      res.json(realmsWithStatus);
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

  return router;
}