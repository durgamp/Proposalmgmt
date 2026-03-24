import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import type { AiDraftDto } from '../validators/cost.validators';

export const aiController = {
  health: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await aiService.checkHealth();
      res.json(status);
    } catch (err) { next(err); }
  },

  draft: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await aiService.generateDraft(req.body as AiDraftDto);
      res.json(result);
    } catch (err) { next(err); }
  },

  stream: async (req: Request, res: Response, _next: NextFunction) => {
    const dto = req.body as AiDraftDto;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      await aiService.streamDraft(
        dto,
        (text) => { res.write(`data: ${JSON.stringify({ text })}\n\n`); },
        (meta) => { res.write(`data: ${JSON.stringify({ meta })}\n\n`); },
      );
      res.write('data: [DONE]\n\n');
    } catch (err) {
      // Headers already sent — write error as SSE event then close
      const msg = err instanceof Error ? err.message : 'AI stream failed';
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    } finally {
      res.end();
    }
  },
};
