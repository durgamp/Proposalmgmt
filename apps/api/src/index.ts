import 'reflect-metadata';
import { AppDataSource } from '@biopropose/database';
import { env } from './config/env';
import { logger } from './config/logger';
import { initSentry } from './config/sentry';
import app from './app';
import { startWsServer } from './ws/server';

async function bootstrap() {
  // Initialise Sentry before anything else so all errors are captured
  await initSentry();

  try {
    // Initialize database connection
    await AppDataSource.initialize();
    logger.info('[DB] Database connected successfully');

    // Run seed in development if DB is empty
    if (process.env.NODE_ENV !== 'production') {
      const { runSeed } = await import('@biopropose/database/seed');
      await runSeed();
    }

    // Start HTTP server
    const httpServer = app.listen(env.PORT, () => {
      logger.info(`[API] Server running on port ${env.PORT}`);
    });

    // Start Yjs WebSocket server on PORT+1
    const wsPort = env.PORT + 1;
    const wss = startWsServer(wsPort);
    logger.info(`[WS] WebSocket server running on port ${wsPort}`);

    // Graceful shutdown — force-exit after 30s to avoid hanging
    const shutdown = async (signal: string) => {
      logger.info(`[API] ${signal} received — shutting down gracefully`);
      const forceExit = setTimeout(() => {
        logger.warn('[API] Graceful shutdown timed out after 30s — forcing exit');
        process.exit(1);
      }, 30_000);
      forceExit.unref(); // Don't keep process alive just for this timer

      // Immediately drop all keep-alive connections so the port is freed fast
      // (closeAllConnections added in Node 18.2 — safe to call on older via optional chaining)
      (httpServer as unknown as { closeAllConnections?: () => void }).closeAllConnections?.();
      wss.close();

      httpServer.close(async () => {
        try {
          await AppDataSource.destroy();
          logger.info('[DB] Database connection closed');
        } catch (err) {
          logger.error({ err }, '[DB] Error closing database connection');
        } finally {
          clearTimeout(forceExit);
          process.exit(0);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error({ err }, '[API] Failed to start server');
    process.exit(1);
  }
}

bootstrap();
