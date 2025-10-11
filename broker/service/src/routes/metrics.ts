import { Router, Request, Response } from 'express';
import { requireApiKey } from '../middleware/auth';

export function createMetricsRouter(
  routeTable: Map<string, any>,
  pendingRequests: Map<string, any>,
  eventRegistry: Map<string, any>
) {
  const router = Router();

  router.get('/', requireApiKey, (req: Request, res: Response) => {
    const metrics = {
      connectedRealms: routeTable.size,
      totalServices: Array.from(routeTable.values()).reduce(
        (sum, info) => sum + info.services.length, 0
      ),
      pendingRequests: pendingRequests.size,
      eventTopics: eventRegistry.size,
      realms: Array.from(routeTable.entries()).map(([id, info]) => ({
        id,
        services: info.services.length,
        capabilities: info.capabilities.length,
        isExternal: info.isExternal,
        connectedAt: info.connectedAt
      }))
    };
    res.json(metrics);
  });

  return router;
}