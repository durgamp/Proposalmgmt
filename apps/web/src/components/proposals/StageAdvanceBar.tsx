import { useAuthStore } from '../../stores/authStore';
import { useAdvanceStage } from '../../hooks/useProposals';
import { ProposalStage, ProposalStatus, UserRole } from '@biopropose/shared-types';
import type { Proposal, ProposalSection } from '@biopropose/shared-types';
import { CheckCircle2, Circle, ChevronRight, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  proposal: Proposal;
  sections: ProposalSection[];
}

const STAGES = [
  { stage: ProposalStage.DRAFT_CREATION, label: 'Draft Creation', short: 'S1' },
  { stage: ProposalStage.TECHNICAL_REVIEW, label: 'Technical Review', short: 'S2' },
  { stage: ProposalStage.PM_REVIEW, label: 'PM Review', short: 'S3' },
  { stage: ProposalStage.MANAGEMENT_REVIEW, label: 'Mgmt Review', short: 'S4' },
  { stage: ProposalStage.CLIENT_SUBMISSION, label: 'Client Submission', short: 'S5' },
];

export default function StageAdvanceBar({ proposal, sections }: Props) {
  const user = useAuthStore((s) => s.user);
  const advanceStage = useAdvanceStage();
  const isManager = user?.role === UserRole.PROPOSAL_MANAGER || user?.role === UserRole.MANAGEMENT;
  const isClosed = proposal.status === ProposalStatus.CLOSED;

  const currentStage = proposal.currentStage as ProposalStage;

  const handleAdvance = (targetStage?: number) => {
    const next = targetStage ?? currentStage + 1;
    if (next > 5) return;
    advanceStage.mutate({
      id: proposal.id,
      dto: { targetStage: next, updatedBy: user!.email },
    });
  };

  const handleReviewComplete = (reviewType: 'pm' | 'management') => {
    advanceStage.mutate({
      id: proposal.id,
      dto: { reviewType, updatedBy: user!.email },
    });
  };

  const allSectionsComplete = sections.length > 0 && sections.every((s) => s.isComplete);
  const incompleteSections = sections.filter((s) => !s.isComplete).map((s) => s.title);

  // Can auto-advance from stage 4 once both reviews are complete
  const bothReviewsDone = proposal.pmReviewComplete && proposal.managementReviewComplete;

  return (
    <div className="card py-3 px-4">
      {/* Stage progress indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STAGES.map(({ stage, label, short }, idx) => {
          const completed = currentStage > stage;
          const active = currentStage === stage;
          return (
            <div key={stage} className="flex items-center">
              <div className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap',
                active ? 'bg-brand-800 text-white' :
                completed ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-400',
              )}>
                {completed ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                {short}: {label}
              </div>
              {idx < STAGES.length - 1 && (
                <ChevronRight size={14} className="text-gray-300 mx-0.5 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      {!isClosed && isManager && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">

          {/* Stage 1 → 2: All sections must be complete */}
          {currentStage === ProposalStage.DRAFT_CREATION && (
            <>
              {incompleteSections.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-full">
                  <AlertCircle size={13} className="flex-shrink-0" />
                  Complete sections first: {incompleteSections.join(', ')}
                </div>
              )}
              <button
                className="btn-primary text-xs py-1.5"
                onClick={() => handleAdvance(2)}
                disabled={!allSectionsComplete || advanceStage.isPending}
                title={!allSectionsComplete ? 'All sections must be marked complete first' : ''}
              >
                Advance to Technical Review →
              </button>
            </>
          )}

          {/* Stage 2 → 3 */}
          {currentStage === ProposalStage.TECHNICAL_REVIEW && (
            <button
              className="btn-primary text-xs py-1.5"
              onClick={() => handleAdvance(3)}
              disabled={advanceStage.isPending}
            >
              Advance to PM Review →
            </button>
          )}

          {/* Stage 3: PM Review sign-off */}
          {currentStage === ProposalStage.PM_REVIEW && (
            <>
              <button
                className={clsx(
                  'text-xs py-1.5 px-3 rounded border font-medium transition-colors',
                  proposal.pmReviewComplete
                    ? 'bg-green-100 text-green-700 border-green-200 cursor-default'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
                )}
                onClick={() => !proposal.pmReviewComplete && handleReviewComplete('pm')}
                disabled={proposal.pmReviewComplete || advanceStage.isPending}
              >
                {proposal.pmReviewComplete ? '✓ PM Review Done' : 'Mark PM Review Complete'}
              </button>
              {proposal.pmReviewComplete && (
                <button
                  className="btn-primary text-xs py-1.5"
                  onClick={() => handleAdvance(4)}
                  disabled={advanceStage.isPending}
                >
                  Advance to Management Review →
                </button>
              )}
            </>
          )}

          {/* Stage 4: Management Review sign-off (parallel) */}
          {currentStage === ProposalStage.MANAGEMENT_REVIEW && (
            <>
              <button
                className={clsx(
                  'text-xs py-1.5 px-3 rounded border font-medium transition-colors',
                  proposal.managementReviewComplete
                    ? 'bg-green-100 text-green-700 border-green-200 cursor-default'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
                )}
                onClick={() => !proposal.managementReviewComplete && handleReviewComplete('management')}
                disabled={proposal.managementReviewComplete || advanceStage.isPending}
              >
                {proposal.managementReviewComplete ? '✓ Mgmt Review Done' : 'Mark Management Review Complete'}
              </button>
              {bothReviewsDone && (
                <button
                  className="btn-primary text-xs py-1.5"
                  onClick={() => handleAdvance(5)}
                  disabled={advanceStage.isPending}
                >
                  Advance to Client Submission →
                </button>
              )}
            </>
          )}

          {currentStage === ProposalStage.CLIENT_SUBMISSION && (
            <span className="text-xs text-green-600 font-medium py-1.5 flex items-center gap-1">
              <CheckCircle2 size={14} />
              Proposal submitted to client
            </span>
          )}
        </div>
      )}
    </div>
  );
}
