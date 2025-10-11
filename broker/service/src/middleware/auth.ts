import { Request, Response, NextFunction } from 'express';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validApiKey = process.env.ADMIN_API_KEY || 'admin-key-123';

  if (!apiKey || apiKey !== validApiKey) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }

  next();
}