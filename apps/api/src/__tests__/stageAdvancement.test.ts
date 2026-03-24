import { ProposalStage } from '@biopropose/shared-types';
import type { ProposalEntity, ProposalSectionEntity } from '@biopropose/database';
import {
  validateStageAdvancement,
  computeCompletionPercentage,
  getStageName,
} from '../utils/stageAdvancement';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeProposal(overrides: Partial<ProposalEntity> = {}): ProposalEntity {
  return {
    id: 'proposal-1',
    currentStage: ProposalStage.DRAFT_CREATION,
    pmReviewComplete: false,
    managementReviewComplete: false,
    ...overrides,
  } as ProposalEntity;
}

function makeSection(isComplete: boolean, title = 'Section'): ProposalSectionEntity {
  return { isComplete, title } as ProposalSectionEntity;
}

// ── validateStageAdvancement ──────────────────────────────────────────────────

describe('validateStageAdvancement', () => {
  test('allows S1 → S2 when all sections are complete', () => {
    const result = validateStageAdvancement({
      proposal: makeProposal({ currentStage: ProposalStage.DRAFT_CREATION }),
      sections: [makeSection(true, 'A'), makeSection(true, 'B')],
      targetStage: ProposalStage.TECHNICAL_REVIEW,
    });
    expect(result.allowed).toBe(true);
  });

  test('blocks S1 → S2 when sections are incomplete', () => {
    const result = validateStageAdvancement({
      proposal: makeProposal({ currentStage: ProposalStage.DRAFT_CREATION }),
      sections: [makeSection(true, 'A'), makeSection(false, 'B')],
      targetStage: ProposalStage.TECHNICAL_REVIEW,
    });
    expect(result.allowed).toBe(false);
    expect(result.missingSections).toContain('B');
  });

  test('blocks S1 → S2 when ALL sections are incomplete', () => {
    const result = validateStageAdvancement({
      proposal: makeProposal({ currentStage: ProposalStage.DRAFT_CREATION }),
      sections: [makeSection(false, 'CEO Letter'), makeSection(false, 'Scope')],
      targetStage: ProposalStage.TECHNICAL_REVIEW,
    });
    expect(result.allowed).toBe(false);
    expect(result.missingSections).toHaveLength(2);
  });

  test('blocks moving backwards without reviewType flag', () => {
    const result = validateStageAdvancement({
      proposal: makeProposal({ currentStage: ProposalStage.TECHNICAL_REVIEW }),
      sections: [],
      targetStage: ProposalStage.DRAFT_CREATION,
    });
    expect(result.allowed).toBe(false);
  });

  test('allows S2 → S3 (PM Review)', () => {
    const result = validateStageAdvancement({
      proposal: makeProposal({ currentStage: ProposalStage.TECHNICAL_REVIEW }),
      sections: [],
      targetStage: ProposalStage.PM_REVIEW,
    });
    expect(result.allowed).toBe(true);
  });

  test('allows S2 → S4 (Management Review)', () => {
    const result = validateStageAdvancement({
      proposal: makeProposal({ currentStage: ProposalStage.TECHNICAL_REVIEW }),
      sections: [],
      targetStage: ProposalStage.MANAGEMENT_REVIEW,
    });
    expect(result.allowed).toBe(true);
  });

  test('blocks S2 → S5 directly', () => {
    const result = validateStageAdvancement({
      proposal: makeProposal({ currentStage: ProposalStage.TECHNICAL_REVIEW }),
      sections: [],
      targetStage: ProposalStage.CLIENT_SUBMISSION,
    });
    expect(result.allowed).toBe(false);
  });

  test('blocks Client Submission when PM review not complete', () => {
    const result = validateStageAdvancement({
      proposal: makeProposal({
        currentStage: ProposalStage.PM_REVIEW,
        pmReviewComplete: false,
        managementReviewComplete: true,
      }),
      sections: [],
      targetStage: ProposalStage.CLIENT_SUBMISSION,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/PM Review/);
  });

  test('blocks Client Submission when Management review not complete', () => {
    const result = validateStageAdvancement({
      proposal: makeProposal({
        currentStage: ProposalStage.PM_REVIEW,
        pmReviewComplete: true,
        managementReviewComplete: false,
      }),
      sections: [],
      targetStage: ProposalStage.CLIENT_SUBMISSION,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Management Review/);
  });

  test('allows Client Submission when both reviews complete', () => {
    const result = validateStageAdvancement({
      proposal: makeProposal({
        currentStage: ProposalStage.PM_REVIEW,
        pmReviewComplete: true,
        managementReviewComplete: true,
      }),
      sections: [],
      targetStage: ProposalStage.CLIENT_SUBMISSION,
    });
    expect(result.allowed).toBe(true);
  });
});

// ── computeCompletionPercentage ───────────────────────────────────────────────

describe('computeCompletionPercentage', () => {
  test('returns 0 when no sections', () => {
    expect(computeCompletionPercentage([], ProposalStage.DRAFT_CREATION, false, false)).toBe(0);
  });

  test('returns 0 when no sections complete and at Stage 1', () => {
    const sections = [makeSection(false), makeSection(false)];
    expect(computeCompletionPercentage(sections, ProposalStage.DRAFT_CREATION, false, false)).toBe(0);
  });

  test('returns 30 when half sections done at Stage 1 (30/60 section weight)', () => {
    const sections = [makeSection(true), makeSection(false)];
    const pct = computeCompletionPercentage(sections, ProposalStage.DRAFT_CREATION, false, false);
    expect(pct).toBe(30); // 50% of 60 = 30, + 0 stage pts
  });

  test('returns 100 when at Stage 5 with all sections done', () => {
    const sections = [makeSection(true), makeSection(true)];
    const pct = computeCompletionPercentage(sections, ProposalStage.CLIENT_SUBMISSION, true, true);
    expect(pct).toBe(100);
  });

  test('returns value between 1 and 99 for partial completion', () => {
    const sections = [makeSection(true), makeSection(false)];
    const pct = computeCompletionPercentage(sections, ProposalStage.TECHNICAL_REVIEW, false, false);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });

  test('never exceeds 100', () => {
    const allDone = [makeSection(true), makeSection(true), makeSection(true)];
    const pct = computeCompletionPercentage(allDone, ProposalStage.CLIENT_SUBMISSION, true, true);
    expect(pct).toBeLessThanOrEqual(100);
  });
});

// ── getStageName ─────────────────────────────────────────────────────────────

describe('getStageName', () => {
  test.each([
    [ProposalStage.DRAFT_CREATION, 'Draft Creation'],
    [ProposalStage.TECHNICAL_REVIEW, 'Technical Review'],
    [ProposalStage.PM_REVIEW, 'PM Review'],
    [ProposalStage.MANAGEMENT_REVIEW, 'Management Review'],
    [ProposalStage.CLIENT_SUBMISSION, 'Client Submission'],
  ])('stage %s → "%s"', (stage, expected) => {
    expect(getStageName(stage)).toBe(expected);
  });

  test('returns "Unknown" for an unmapped stage number', () => {
    expect(getStageName(99 as ProposalStage)).toBe('Unknown');
  });
});
