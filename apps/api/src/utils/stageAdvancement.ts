import { ProposalStage, StageValidationResult } from '@biopropose/shared-types';
import { ProposalEntity } from '@biopropose/database';
import { ProposalSectionEntity } from '@biopropose/database';

export interface StageAdvancementContext {
  proposal: ProposalEntity;
  sections: ProposalSectionEntity[];
  targetStage: ProposalStage;
  reviewType?: 'pm' | 'management';
}

export function validateStageAdvancement(ctx: StageAdvancementContext): StageValidationResult {
  const { proposal, sections, targetStage, reviewType } = ctx;
  const current = proposal.currentStage as ProposalStage;

  // Cannot go backwards (except via revise/reopen flows)
  if (targetStage <= current && !reviewType) {
    return { allowed: false, reason: `Cannot move from Stage ${current} to Stage ${targetStage}` };
  }

  // Stage 1 → 2: All sections must be complete
  if (current === ProposalStage.DRAFT_CREATION && targetStage === ProposalStage.TECHNICAL_REVIEW) {
    const incompleteSections = sections
      .filter((s) => !s.isComplete)
      .map((s) => s.title);

    if (incompleteSections.length > 0) {
      return {
        allowed: false,
        reason: 'All sections must be marked complete before Technical Review',
        missingSections: incompleteSections,
      };
    }
  }

  // Stage 2 → 3/4: No prerequisite beyond being in Stage 2
  if (current === ProposalStage.TECHNICAL_REVIEW) {
    if (targetStage !== ProposalStage.PM_REVIEW && targetStage !== ProposalStage.MANAGEMENT_REVIEW) {
      return { allowed: false, reason: 'From Technical Review you can only advance to PM Review or Management Review' };
    }
  }

  // Stage 3/4 → 5: Both parallel reviews must be complete
  if (targetStage === ProposalStage.CLIENT_SUBMISSION) {
    if (!proposal.pmReviewComplete) {
      return { allowed: false, reason: 'PM Review must be completed before Client Submission' };
    }
    if (!proposal.managementReviewComplete) {
      return { allowed: false, reason: 'Management Review must be completed before Client Submission' };
    }
  }

  return { allowed: true };
}

export function computeCompletionPercentage(
  sections: ProposalSectionEntity[],
  currentStage: ProposalStage,
  pmReviewComplete: boolean,
  managementReviewComplete: boolean,
): number {
  if (sections.length === 0) return 0;

  const sectionWeight = 60; // 60% for sections
  const stageWeight = 40;   // 40% for stages

  const sectionsDone = sections.filter((s) => s.isComplete).length;
  const sectionPct = (sectionsDone / sections.length) * sectionWeight;

  // Stage 5 = 100%
  const stagePct =
    currentStage === ProposalStage.CLIENT_SUBMISSION
      ? stageWeight
      : currentStage === ProposalStage.MANAGEMENT_REVIEW || currentStage === ProposalStage.PM_REVIEW
        ? (pmReviewComplete && managementReviewComplete ? 35 : 25)
        : currentStage === ProposalStage.TECHNICAL_REVIEW
          ? 15
          : 0;

  return Math.min(100, Math.round(sectionPct + stagePct));
}

export function getStageName(stage: ProposalStage): string {
  const names: Record<ProposalStage, string> = {
    [ProposalStage.DRAFT_CREATION]: 'Draft Creation',
    [ProposalStage.TECHNICAL_REVIEW]: 'Technical Review',
    [ProposalStage.PM_REVIEW]: 'PM Review',
    [ProposalStage.MANAGEMENT_REVIEW]: 'Management Review',
    [ProposalStage.CLIENT_SUBMISSION]: 'Client Submission',
  };
  return names[stage] ?? 'Unknown';
}
