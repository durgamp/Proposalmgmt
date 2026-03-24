import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Augment Express Request so req.id is typed throughout the app
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/**
 * Reads X-Request-ID from the incoming request (set by upstream proxy/client)
 * or generates a new UUID. Attaches it to req.id and echoes it back in the
 * response header so clients can correlate logs.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
}
