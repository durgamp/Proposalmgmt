import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs';

// Standard proposal section definitions (order matters for detection)
const KNOWN_SECTIONS = [
  { key: 'ceo-letter',         title: 'CEO Letter',          aliases: ['ceo letter', 'letter from ceo', 'from the ceo', 'dear'] },
  { key: 'executive-summary',  title: 'Executive Summary',   aliases: ['executive summary', 'exec summary', 'overview', 'introduction'] },
  { key: 'scope-of-work',      title: 'Scope of Work',       aliases: ['scope of work', 'scope', 'statement of work', 'sow', 'deliverables'] },
  { key: 'project-details',    title: 'Project Details',     aliases: ['project details', 'project information', 'methodology', 'approach', 'timeline', 'schedule', 'work plan'] },
  { key: 'terms-conditions',   title: 'Terms & Conditions',  aliases: ['terms and conditions', 'terms & conditions', 'terms', 'conditions', 'legal', 'agreement', 'payment'] },
];

interface DetectedSection {
  sectionKey: string;
  title: string;
  sortOrder: number;
  defaultContent: object;
}

/**
 * Convert plain text paragraphs to TipTap/ProseMirror JSON.
 */
function textToTipTapDoc(text: string): object {
  const paragraphs = text
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 50); // cap at 50 paragraphs per section

  if (paragraphs.length === 0) {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }

  return {
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    })),
  };
}

/**
 * Match a heading line to a known section (case-insensitive).
 */
function matchSection(heading: string): typeof KNOWN_SECTIONS[0] | null {
  const lower = heading.toLowerCase().trim();
  for (const sec of KNOWN_SECTIONS) {
    if (sec.aliases.some((alias) => lower.includes(alias))) return sec;
  }
  return null;
}

/**
 * Parse a DOCX buffer and extract section content.
 */
async function parseDocx(buffer: Buffer): Promise<DetectedSection[]> {
  const result = await mammoth.extractRawText({ buffer });
  return parseTextContent(result.value);
}

/**
 * Parse plain text (from PDF or DOCX raw extraction) into sections.
 * Strategy: split by lines, look for headings that match known section names,
 * then accumulate body lines until the next heading.
 */
function parseTextContent(rawText: string): DetectedSection[] {
  const lines = rawText.split('\n');
  const sectionMap: Map<string, { title: string; lines: string[] }> = new Map();
  const sectionOrder: string[] = [];

  let currentKey: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentKey) sectionMap.get(currentKey)!.lines.push('');
      continue;
    }

    // A heading candidate: short line (< 80 chars), doesn't end with period/comma
    const isHeadingCandidate = trimmed.length < 80 && !/[,;]$/.test(trimmed);
    if (isHeadingCandidate) {
      const match = matchSection(trimmed);
      if (match) {
        if (!sectionMap.has(match.key)) {
          sectionMap.set(match.key, { title: match.title, lines: [] });
          sectionOrder.push(match.key);
        }
        currentKey = match.key;
        continue;
      }
    }

    if (currentKey) {
      sectionMap.get(currentKey)!.lines.push(trimmed);
    }
  }

  // Build results — include all known sections even if not detected (empty content)
  const results: DetectedSection[] = [];
  KNOWN_SECTIONS.forEach((sec, idx) => {
    const found = sectionMap.get(sec.key);
    const bodyText = found ? found.lines.filter((l) => l.trim()).join('\n') : '';
    results.push({
      sectionKey: sec.key,
      title: sec.title,
      sortOrder: idx,
      defaultContent: textToTipTapDoc(bodyText),
    });
  });

  return results;
}

/**
 * Parse an uploaded template file (DOCX or PDF) and return detected sections.
 */
export async function parseTemplateFile(
  filePath: string,
  mimeType: string,
): Promise<DetectedSection[]> {
  const buffer = fs.readFileSync(filePath);

  const isDocx =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    filePath.endsWith('.docx');

  const isPdf = mimeType === 'application/pdf' || filePath.endsWith('.pdf');

  if (isDocx) {
    return parseDocx(buffer);
  }

  if (isPdf) {
    // Lazy-load pdf-parse to avoid startup cost
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return parseTextContent(data.text);
    } catch {
      // pdf-parse not installed — return empty sections
      return KNOWN_SECTIONS.map((sec, idx) => ({
        sectionKey: sec.key,
        title: sec.title,
        sortOrder: idx,
        defaultContent: { type: 'doc', content: [{ type: 'paragraph' }] },
      }));
    }
  }

  throw new Error('Unsupported file type. Upload a .docx or .pdf file.');
}
