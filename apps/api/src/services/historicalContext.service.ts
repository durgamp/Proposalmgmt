/**
 * Historical Context Service — RAG layer for AI draft generation.
 *
 * How it works:
 * 1. Loads all Stage-5 ("Sent") proposals + their sections from the DB
 * 2. Converts TipTap/ProseMirror JSON content to plain text
 * 3. Generates embeddings for each section via Ollama /api/embeddings
 * 4. Caches the resulting vector index in memory (TTL: 10 min)
 * 5. At query time: embeds the request context and retrieves the
 *    top-K most similar historical sections via cosine similarity,
 *    boosted by BU/template-type metadata matching
 *
 * Falls back to pure metadata matching if Ollama embeddings are unavailable.
 *
 * Zero extra npm dependencies — uses Node's built-in http module
 * (same approach as ollama.provider.ts).
 */

import * as http from 'http';
import * as https from 'https';
import { AppDataSource } from '@biopropose/database';
import { ProposalSectionEntity, ProposalEntity } from '@biopropose/database';
import { ProposalStatus } from '@biopropose/shared-types';
import { env } from '../config/env';
import { logger } from '../config/logger';

// ── TipTap / ProseMirror JSON → plain text ────────────────────────────────

interface TipTapNode {
  type: string;
  text?: string;
  content?: TipTapNode[];
}

function tipTapToPlainText(doc: unknown, depth = 0): string {
  if (!doc || typeof doc !== 'object' || depth > 20) return '';
  const node = doc as TipTapNode;
  if (node.text) return node.text;
  if (!node.content) return '';
  const sep = ['paragraph', 'heading', 'blockquote', 'listItem'].includes(node.type) ? ' ' : '';
  return node.content
    .map((child) => tipTapToPlainText(child, depth + 1))
    .join(sep)
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Cosine similarity ─────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Ollama embedding call (same http pattern as ollama.provider.ts) ────────

const EMBED_TIMEOUT_MS = 15_000;

async function fetchEmbedding(text: string): Promise<number[] | null> {
  try {
    // Use a dedicated embedding model when configured, otherwise fall back to
    // the generation model (most Ollama models support /api/embeddings).
    const model = env.OLLAMA_EMBED_MODEL ?? env.OLLAMA_MODEL;
    const payload = JSON.stringify({ model, prompt: text.slice(0, 2_000) });
    const url = new URL(`${env.OLLAMA_BASE_URL}/api/embeddings`);
    const transport = url.protocol === 'https:' ? https : http;

    const raw = await new Promise<string>((resolve, reject) => {
      const req = transport.request(
        {
          hostname: url.hostname,
          port:     url.port || (url.protocol === 'https:' ? 443 : 80),
          path:     url.pathname,
          method:   'POST',
          headers:  {
            'Content-Type':   'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: EMBED_TIMEOUT_MS,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data',  (c: Buffer) => chunks.push(c));
          res.on('end',   () => resolve(Buffer.concat(chunks).toString()));
          res.on('error', reject);
        },
      );
      req.on('error',   reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Embedding timeout')); });
      req.write(payload);
      req.end();
    });

    const data = JSON.parse(raw) as { embedding?: number[] };
    return Array.isArray(data.embedding) ? data.embedding : null;
  } catch (err) {
    logger.warn({ err }, '[HistoricalCtx] Embedding request failed — using metadata fallback');
    return null;
  }
}

// ── Vector index cache ────────────────────────────────────────────────────

interface IndexEntry {
  proposalId:   string;
  sectionKey:   string;
  client:       string;
  businessUnit: string;
  templateType: string;
  plainText:    string;
  embedding:    number[] | null;
}

const CACHE_TTL_MS   = 10 * 60 * 1_000; // 10 minutes
const MIN_TEXT_LEN   = 50;               // skip sections with barely any content
const EMBED_GAP_MS   = 80;               // rate-limit gap between embedding calls

let indexCache:    IndexEntry[] | null = null;
let lastIndexedAt: number              = 0;
let indexBuilding: boolean             = false;

async function buildIndex(): Promise<IndexEntry[]> {
  if (!AppDataSource.isInitialized) return [];

  const sectionRepo  = AppDataSource.getRepository(ProposalSectionEntity);
  const proposalRepo = AppDataSource.getRepository(ProposalEntity);

  // Only index proposals that reached Stage 5 (Client Submission / Sent)
  const completedProposals = await proposalRepo.find({
    where:  { status: ProposalStatus.SENT },
    select: ['id', 'client', 'businessUnit', 'templateType'],
  });

  if (completedProposals.length === 0) {
    logger.info('[HistoricalCtx] No completed proposals found — index empty');
    return [];
  }

  const proposalMap  = new Map(completedProposals.map((p) => [p.id, p]));
  const proposalIds  = completedProposals.map((p) => p.id);

  // Batch-load sections (avoids N+1)
  const sections = await sectionRepo
    .createQueryBuilder('s')
    .where('s.proposalId IN (:...ids)', { ids: proposalIds })
    .select(['s.proposalId', 's.sectionKey', 's.contentJson'])
    .getMany();

  const entries: IndexEntry[] = [];

  for (const section of sections) {
    const proposal = proposalMap.get(section.proposalId);
    if (!proposal) continue;

    const plainText = tipTapToPlainText(section.content);
    if (plainText.trim().length < MIN_TEXT_LEN) continue; // skip empty stubs

    const embedding = await fetchEmbedding(plainText);
    // Brief pause to avoid saturating the local Ollama process
    await new Promise<void>((r) => setTimeout(r, EMBED_GAP_MS));

    entries.push({
      proposalId:   section.proposalId,
      sectionKey:   section.sectionKey,
      client:       proposal.client,
      businessUnit: proposal.businessUnit ?? '',
      templateType: proposal.templateType ?? '',
      plainText,
      embedding,
    });
  }

  logger.info(
    `[HistoricalCtx] Index built — ${entries.length} sections from ${completedProposals.length} proposals`,
  );
  return entries;
}

async function getIndex(): Promise<IndexEntry[]> {
  if (indexCache && (Date.now() - lastIndexedAt) < CACHE_TTL_MS) return indexCache;
  if (indexBuilding) return indexCache ?? [];          // don't stack concurrent builds

  indexBuilding = true;
  try {
    indexCache    = await buildIndex();
    lastIndexedAt = Date.now();
  } finally {
    indexBuilding = false;
  }
  return indexCache;
}

// ── Public API ────────────────────────────────────────────────────────────

export interface HistoricalExample {
  client:       string;
  businessUnit: string;
  sectionKey:   string;
  content:      string;     // truncated plain text
  similarity:   number;     // 0-1 score
}

export interface HistoricalContextResult {
  examples:    HistoricalExample[];
  totalIndexed: number;       // how many sections are in the index
  usingEmbeddings: boolean;   // true = semantic, false = metadata-only
}

/**
 * Returns the top-K most contextually relevant historical section examples
 * for the given request parameters.
 */
export async function getHistoricalExamples(opts: {
  sectionKey:        string;
  businessUnit?:     string;
  templateType?:     string;
  excludeProposalId?: string;
  topK?:             number;
}): Promise<HistoricalContextResult> {
  const { sectionKey, businessUnit, templateType, excludeProposalId, topK = 3 } = opts;

  const empty: HistoricalContextResult = {
    examples: [], totalIndexed: 0, usingEmbeddings: false,
  };

  try {
    const index = await getIndex();
    if (index.length === 0) return empty;

    // Narrow to the same section type, excluding the current proposal
    const candidates = index.filter(
      (e) => e.sectionKey === sectionKey && e.proposalId !== excludeProposalId,
    );
    if (candidates.length === 0) return { ...empty, totalIndexed: index.length };

    // Build a query embedding from the request context
    const queryText      = [businessUnit, templateType, sectionKey].filter(Boolean).join(' ');
    const queryEmbedding = await fetchEmbedding(queryText);
    const usingEmbeddings = queryEmbedding !== null && candidates.some((c) => c.embedding !== null);

    const scored = candidates.map((entry) => {
      let score = 0;

      if (usingEmbeddings && queryEmbedding && entry.embedding) {
        // Primary: semantic similarity (70 % weight)
        score += cosineSimilarity(queryEmbedding, entry.embedding) * 0.7;
      }

      // Secondary: metadata boosts (30 % weight)
      if (businessUnit && entry.businessUnit.toLowerCase() === businessUnit.toLowerCase()) score += 0.20;
      if (templateType && entry.templateType.toLowerCase() === templateType.toLowerCase())  score += 0.10;

      return { entry, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const examples = scored.slice(0, topK).map(({ entry, score }) => ({
      client:       entry.client,
      businessUnit: entry.businessUnit,
      sectionKey:   entry.sectionKey,
      content:      entry.plainText.slice(0, 800), // cap per example to manage prompt size
      similarity:   Math.round(score * 100) / 100,
    }));

    return { examples, totalIndexed: index.length, usingEmbeddings };
  } catch (err) {
    logger.warn({ err }, '[HistoricalCtx] Failed to retrieve examples — proceeding without history');
    return empty;
  }
}

/**
 * Force-expire the in-memory index (call after a proposal reaches Stage 5).
 */
export function invalidateHistoricalIndex(): void {
  indexCache    = null;
  lastIndexedAt = 0;
}
