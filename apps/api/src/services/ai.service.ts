import { env } from '../config/env';
import { logger } from '../config/logger';
import { SectionKey } from '@biopropose/shared-types';
import type { AiDraftDto } from '../validators/cost.validators';
import type { IAiProvider, AiDraftResult, AiHealthResult } from './providers/ai.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { ClaudeProvider } from './providers/claude.provider';
import {
  getHistoricalExamples,
  type HistoricalExample,
  type HistoricalContextResult,
} from './historicalContext.service';

// ── Section prompt templates ──────────────────────────────────────────────

const SECTION_PROMPTS: Record<string, string> = {
  [SectionKey.CEO_LETTER]: `Write a professional CEO letter for a biologics CRO/CDMO proposal.
The letter should be formal, confident, and highlight the organisation's expertise and commitment.
Include: warm opening, company expertise statement, specific project commitment, and professional closing.`,

  [SectionKey.EXECUTIVE_SUMMARY]: `Write a comprehensive executive summary for a biologics RFP/RFI proposal.
Include: project overview, key objectives, proposed approach, timeline highlights, and expected outcomes.
Be concise and impactful — this is the first section read by decision-makers.`,

  [SectionKey.SCOPE_OF_WORK]: `Write a detailed scope of work for a biologics proposal.
Include: specific deliverables, work breakdown, exclusions, assumptions, and measurable success criteria.
Be precise and unambiguous to eliminate scope disputes.`,

  [SectionKey.PROJECT_DETAILS]: `Write comprehensive project details for a biologics proposal.
Include: methodology, key activities, milestones, team structure, technical approach, and quality controls.
Reference industry-standard biologics development practices (ICH, GMP, USP).`,

  [SectionKey.TERMS_CONDITIONS]: `Write professional terms and conditions for a biologics services proposal.
Include: payment terms, IP ownership, confidentiality obligations, change-order process, force majeure, and liability caps.
Use clear legal language appropriate for a CRO/CDMO engagement.`,

  [SectionKey.AMENDMENT_DETAILS]: `Write the amendment details section for a biologics proposal amendment.
Include: reason for amendment, specific changes from the original proposal, revised scope/timeline/cost, and approval requirements.`,
};

// ── Prompt builder ────────────────────────────────────────────────────────

function buildExamplesBlock(examples: HistoricalExample[]): string {
  if (examples.length === 0) return '';
  const formatted = examples
    .map((ex, i) =>
      `[Example ${i + 1}] Client: ${ex.client} | BU: ${ex.businessUnit}\n${ex.content}`,
    )
    .join('\n\n---\n\n');
  return `\nRELEVANT HISTORICAL EXAMPLES (from past completed proposals — use as stylistic reference only, do NOT copy verbatim):\n${formatted}\n\n---\nNow write the section for the CURRENT proposal:\n`;
}

function buildPrompt(dto: AiDraftDto, historical: HistoricalContextResult): string {
  const sectionPrompt =
    SECTION_PROMPTS[dto.sectionKey] ??
    `Write the "${dto.sectionKey}" section for a biologics proposal.`;

  const contextBlock = [
    'PROPOSAL CONTEXT:',
    `- Proposal Name:  ${dto.proposalContext.name}`,
    `- Client:         ${dto.proposalContext.client}`,
    `- Business Unit:  ${dto.proposalContext.businessUnit ?? 'Biologics'}`,
    `- Template Type:  ${dto.proposalContext.templateType ?? 'General'}`,
    `- Description:    ${dto.proposalContext.description ?? 'Not provided'}`,
  ].join('\n');

  const examplesBlock    = buildExamplesBlock(historical.examples);
  const existingBlock    = dto.existingContent ? `\nEXISTING CONTENT TO IMPROVE:\n${dto.existingContent}` : '';
  const instructionBlock = dto.userInstruction  ? `\nSPECIFIC INSTRUCTIONS: ${dto.userInstruction}` : '';

  return `You are an expert technical writer specialising in biologics CRO/CDMO proposals.

${contextBlock}

TASK: ${sectionPrompt}
${examplesBlock}${existingBlock}${instructionBlock}

Write professional, clear, and scientifically accurate content.
Format the response as clean prose suitable for a business proposal.
Do not include meta-commentary, section headings, or notes — output only the section body content.`;
}

// ── Provider factory ──────────────────────────────────────────────────────

function createProvider(): IAiProvider {
  if (env.AI_PROVIDER === 'claude') {
    logger.info('[AI] Using Claude (Anthropic API) provider');
    return new ClaudeProvider();
  }
  logger.info('[AI] Using Ollama (local LLM) provider');
  return new OllamaProvider();
}

// ── AiService ─────────────────────────────────────────────────────────────

export interface AiDraftResultWithMeta extends AiDraftResult {
  historicalExamplesUsed: number;
  usingEmbeddings:        boolean;
}

export class AiService {
  private readonly provider: IAiProvider;

  constructor() {
    this.provider = createProvider();
  }

  async generateDraft(dto: AiDraftDto): Promise<AiDraftResultWithMeta> {
    logger.info(`[AI] generateDraft — section: ${dto.sectionKey}, provider: ${env.AI_PROVIDER}`);

    const historical = await getHistoricalExamples({
      sectionKey:        dto.sectionKey,
      businessUnit:      dto.proposalContext.businessUnit,
      templateType:      dto.proposalContext.templateType,
      excludeProposalId: dto.proposalId,
      topK:              3,
    });

    logger.info(
      `[AI] RAG — ${historical.examples.length} examples, ` +
      `indexed: ${historical.totalIndexed}, semantic: ${historical.usingEmbeddings}`,
    );

    const prompt = buildPrompt(dto, historical);
    const result = await this.provider.generateDraft({ ...dto, prompt });

    return {
      ...result,
      historicalExamplesUsed: historical.examples.length,
      usingEmbeddings:        historical.usingEmbeddings,
    };
  }

  async streamDraft(
    dto: AiDraftDto,
    onChunk: (text: string) => void,
    onMeta?: (meta: { historicalExamplesUsed: number; usingEmbeddings: boolean }) => void,
  ): Promise<void> {
    logger.info(`[AI] streamDraft — section: ${dto.sectionKey}, provider: ${env.AI_PROVIDER}`);

    const historical = await getHistoricalExamples({
      sectionKey:        dto.sectionKey,
      businessUnit:      dto.proposalContext.businessUnit,
      templateType:      dto.proposalContext.templateType,
      excludeProposalId: dto.proposalId,
      topK:              3,
    });

    logger.info(
      `[AI] RAG — ${historical.examples.length} examples, ` +
      `indexed: ${historical.totalIndexed}, semantic: ${historical.usingEmbeddings}`,
    );

    // Signal metadata before first token so the UI can show the RAG badge
    onMeta?.({
      historicalExamplesUsed: historical.examples.length,
      usingEmbeddings:        historical.usingEmbeddings,
    });

    const prompt = buildPrompt(dto, historical);
    return this.provider.streamDraft({ ...dto, prompt }, onChunk);
  }

  async checkHealth(): Promise<AiHealthResult> {
    return this.provider.checkHealth();
  }
}

export const aiService = new AiService();
