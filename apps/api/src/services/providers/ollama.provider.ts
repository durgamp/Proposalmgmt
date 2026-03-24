import * as http from 'http';
import * as https from 'https';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { AiDraftDto } from '../../validators/cost.validators';
import type { IAiProvider, AiDraftResult, AiHealthResult } from './ai.provider';

interface OllamaStreamChunk {
  model: string;
  response: string;
  done: boolean;
}

/** POST to Ollama using Node's built-in http module (reliable streaming). */
function ollamaPost(path: string, body: object, timeout: number): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(env.OLLAMA_BASE_URL + path);
    const transport = url.protocol === 'https:' ? https : http;

    const req = transport.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout,
      },
      (res) => resolve(res),
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Ollama request timed out after ${timeout / 1000}s`));
    });

    req.write(payload);
    req.end();
  });
}

export class OllamaProvider implements IAiProvider {
  async generateDraft(dto: AiDraftDto & { prompt: string }): Promise<AiDraftResult> {
    logger.info(`[AI:Ollama] Generating draft — model: ${env.OLLAMA_MODEL}`);

    const res = await ollamaPost(
      '/api/generate',
      { model: env.OLLAMA_MODEL, prompt: dto.prompt, stream: false, think: false, options: { temperature: 0.7, top_p: 0.9, num_predict: 2000 } },
      env.OLLAMA_TIMEOUT,
    );

    const raw = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
      res.on('error', reject);
    });

    const data = JSON.parse(raw) as OllamaStreamChunk;
    return { content: data.response.trim(), model: data.model, provider: 'ollama' };
  }

  async streamDraft(dto: AiDraftDto & { prompt: string }, onChunk: (text: string) => void): Promise<void> {
    logger.info(`[AI:Ollama] Streaming draft — model: ${env.OLLAMA_MODEL}, url: ${env.OLLAMA_BASE_URL}`);

    const res = await ollamaPost(
      '/api/generate',
      { model: env.OLLAMA_MODEL, prompt: dto.prompt, stream: true, think: false, options: { temperature: 0.7, top_p: 0.9, num_predict: 2000 } },
      env.OLLAMA_TIMEOUT,
    );

    if (res.statusCode !== 200) {
      const body = await new Promise<string>((resolve) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString()));
      });
      throw new Error(`Ollama error ${res.statusCode}: ${body}`);
    }

    return new Promise((resolve, reject) => {
      let buffer = '';

      res.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';   // keep incomplete last line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed) as OllamaStreamChunk;
            if (parsed.response) onChunk(parsed.response);
          } catch {
            logger.warn(`[AI:Ollama] Could not parse chunk: ${trimmed.slice(0, 80)}`);
          }
        }
      });

      res.on('end', () => {
        // flush any remaining buffer content
        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer.trim()) as OllamaStreamChunk;
            if (parsed.response) onChunk(parsed.response);
          } catch { /* ignore */ }
        }
        logger.info('[AI:Ollama] Stream complete');
        resolve();
      });

      res.on('error', (err) => {
        logger.error({ err }, '[AI:Ollama] Stream error');
        reject(err);
      });
    });
  }

  async checkHealth(): Promise<AiHealthResult> {
    try {
      const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
        const url = new URL(env.OLLAMA_BASE_URL + '/api/version');
        const transport = url.protocol === 'https:' ? https : http;
        const req = transport.get(url.href, (r) => resolve(r));
        req.on('error', reject);
        req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
      });

      const body = await new Promise<string>((resolve) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString()));
      });

      const data = JSON.parse(body) as { version?: string };
      return { available: true, provider: 'ollama', model: env.OLLAMA_MODEL, version: data.version };
    } catch {
      return { available: false, provider: 'ollama', model: env.OLLAMA_MODEL };
    }
  }
}
