import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.LOG_FORMAT === 'pretty'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
});

/** Returns a child logger that stamps every line with the request correlation ID. */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}
