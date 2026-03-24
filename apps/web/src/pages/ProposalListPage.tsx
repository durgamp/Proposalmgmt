import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, GitBranch, Copy, RefreshCcw, RotateCcw, FileEdit,
  X, UserPlus, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useProposals, useCreateAmendment, useReopenProposal } from '../hooks/useProposals';
import { useAuthStore } from '../stores/authStore';
import { ProposalStatus } from '@biopropose/shared-types';
import type { Proposal } from '@biopropose/shared-types';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const STAGE_LABELS: Record<number, string> = {
  1: 'Draft Creation',
  2: 'Technical Review',
  3: 'PM Review',
  4: 'Mgmt Review',
  5: 'Client Submission',
};

const STAGE_COLORS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-800 border-blue-200',
  2: 'bg-purple-100 text-purple-800 border-purple-200',
  3: 'bg-orange-100 text-orange-800 border-orange-200',
  4: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  5: 'bg-green-100 text-green-800 border-green-200',
};

// ── Amendment modal state ─────────────────────────────────────────────────────
interface AmendForm {
  sfdcOpportunityId: string;
  sfdcManual: boolean;
  sfdcParentOpportunityId: string;
  name: string;
  client: string;
  proposalCode: string;
  proposalManager: string;
  bdManager: string;
  description: string;
  stakeholderInput: string;
  assignedStakeholders: string[];
}

// ── Reopen modal state ────────────────────────────────────────────────────────
type ReopenMode = 'clone' | 'revise' | 'new' | null;

export default function ProposalListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useProposals({ search, status: status || undefined, page, limit: 20 });
  const { data: allData } = useProposals({ limit: 500 });

  const createAmendment = useCreateAmendment();
  const reopenProposal = useReopenProposal();

  // ── Amendment modal ─────────────────────────────────────────────────────────
  const [amendProposal, setAmendProposal] = useState<Proposal | null>(null);
  const [amendForm, setAmendForm] = useState<AmendForm | null>(null);

  const openAmendModal = (p: Proposal) => {
    const amendCount = (allData?.items ?? []).filter(
      (x) => x.isAmendment && (x as any).parentProposalId === p.id,
    ).length;
    const suffix = `AMD-${String(amendCount + 1).padStart(3, '0')}`;
    setAmendForm({
      sfdcOpportunityId: p.sfdcOpportunityCode ?? '',
      sfdcManual: false,
      sfdcParentOpportunityId: '',
      name: `${p.name} - Amendment`,
      client: p.client,
      proposalCode: `${p.proposalCode}-${suffix}`,
      proposalManager: p.proposalManager ?? user?.email ?? '',
      bdManager: p.bdManager ?? '',
      description: p.description ?? '',
      stakeholderInput: '',
      assignedStakeholders: [...(p.assignedStakeholders ?? [])],
    });
    setAmendProposal(p);
  };

  const closeAmendModal = () => { setAmendProposal(null); setAmendForm(null); };

  const setAmend = <K extends keyof AmendForm>(key: K, val: AmendForm[K]) =>
    setAmendForm((f) => f ? { ...f, [key]: val } : f);

  const addAmendStakeholder = () => {
    if (!amendForm) return;
    const email = amendForm.stakeholderInput.trim();
    if (email && email.includes('@') && !amendForm.assignedStakeholders.includes(email)) {
      setAmendForm((f) => f ? { ...f, assignedStakeholders: [...f.assignedStakeholders, email], stakeholderInput: '' } : f);
    }
  };

  const submitAmendment = () => {
    if (!amendProposal || !amendForm || !user) return;
    createAmendment.mutate(
      {
        id: amendProposal.id,
        dto: {
          name: amendForm.name,
          proposalCode: amendForm.proposalCode,
          client: amendForm.client,
          bdManager: amendForm.bdManager,
          proposalManager: amendForm.proposalManager,
          description: amendForm.description || undefined,
          sfdcOpportunityCode: amendForm.sfdcOpportunityId || undefined,
          assignedStakeholders: amendForm.assignedStakeholders,
          createdBy: user.email,
        },
      },
      {
        onSuccess: (newProposal) => {
          toast.success('Amendment created');
          closeAmendModal();
          navigate(`/proposals/${newProposal.id}`);
        },
      },
    );
  };

  // ── Reopen modal ────────────────────────────────────────────────────────────
  const [reopenProposalTarget, setReopenProposalTarget] = useState<Proposal | null>(null);
  const [reopenMode, setReopenMode] = useState<ReopenMode>(null);

  const openReopenModal = (p: Proposal) => {
    setReopenProposalTarget(p);
    setReopenMode(null);
  };
  const closeReopenModal = () => { setReopenProposalTarget(null); setReopenMode(null); };

  const confirmReopen = () => {
    if (!reopenProposalTarget || !reopenMode || !user) return;

    if (reopenMode === 'new') {
      closeReopenModal();
      navigate('/proposals/new');
      return;
    }

    const p = reopenProposalTarget;
    const newCode = `${p.proposalCode}-R${Date.now().toString().slice(-4)}`;

    reopenProposal.mutate(
      {
        id: p.id,
        dto: {
          mode: reopenMode,
          name: reopenMode === 'clone' ? `Copy of ${p.name}` : p.name,
          proposalCode: reopenMode === 'revise' ? p.proposalCode : newCode,
          client: p.client,
          bdManager: p.bdManager ?? '',
          description: p.description,
          sfdcOpportunityCode: p.sfdcOpportunityCode,
          assignedStakeholders: p.assignedStakeholders ?? [],
          updatedBy: user.email,
        },
      },
      {
        onSuccess: (result) => {
          closeReopenModal();
          if (reopenMode === 'revise') {
            toast.success('Proposal moved back to Stage 4 (Mgmt Review)');
            navigate(`/proposals/${p.id}`);
          } else {
            toast.success('New proposal created from clone');
            navigate(`/proposals/${result.id}`);
          }
        },
      },
    );
  };

  // ── Revise (direct — no modal) ──────────────────────────────────────────────
  const handleRevise = (p: Proposal) => {
    if (!user) return;
    reopenProposal.mutate(
      {
        id: p.id,
        dto: {
          mode: 'revise',
          name: p.name,
          proposalCode: p.proposalCode,
          client: p.client,
          bdManager: p.bdManager ?? '',
          description: p.description,
          sfdcOpportunityCode: p.sfdcOpportunityCode,
          assignedStakeholders: p.assignedStakeholders ?? [],
          updatedBy: user.email,
        },
      },
      {
        onSuccess: () => {
          toast.success('Proposal moved back to Stage 4 (Mgmt Review)');
          navigate(`/proposals/${p.id}`);
        },
      },
    );
  };

  // ── Amendment count map ─────────────────────────────────────────────────────
  const amendmentCountMap: Record<string, number> = {};
  (allData?.items ?? []).forEach((p) => {
    if (p.isAmendment && (p as any).parentProposalId) {
      amendmentCountMap[(p as any).parentProposalId] = (amendmentCountMap[(p as any).parentProposalId] ?? 0) + 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Proposals</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all proposals</p>
      </div>

      {/* Search & filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search proposals..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input w-44"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {Object.values(ProposalStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="btn-primary ml-auto" onClick={() => navigate('/proposals/new')}>
            <Plus size={15} />
            New Proposal
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-medium text-gray-900">
            Proposal Results ({data?.total ?? 0})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading proposals...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.items.map((p) => {
                  const isStage5 = p.currentStage === 5;
                  const amendCount = amendmentCountMap[p.id] ?? 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          className="text-sm font-medium text-brand-800 hover:underline text-left"
                          onClick={() => navigate(`/proposals/${p.id}`)}
                        >
                          {p.name}
                        </button>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {p.businessUnit && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                              {p.businessUnit}
                            </span>
                          )}
                          {p.isAmendment && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200">
                              <GitBranch size={10} />
                              Amendment {(p as any).revisionNumber ?? ''}
                            </span>
                          )}
                          {!p.isAmendment && amendCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 border border-green-200">
                              <GitBranch size={10} />
                              {amendCount} Amendment{amendCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {p.isAmendment && (p as any).parentProposalId && (
                          <button
                            onClick={() => navigate(`/proposals/${(p as any).parentProposalId}`)}
                            className="text-xs text-gray-500 hover:text-brand-700 mt-1 flex items-center gap-1"
                          >
                            <GitBranch size={10} />
                            View original
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{p.client}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {format(new Date(p.createdAt), 'yyyy-MM-dd')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-0.5">
                          <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border', STAGE_COLORS[p.currentStage as number] ?? 'bg-gray-100 text-gray-700 border-gray-200')}>
                            Stage {p.currentStage}
                          </span>
                          <span className="text-xs text-gray-500">{STAGE_LABELS[p.currentStage as number]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-800 rounded-full transition-all"
                              style={{ width: `${p.completionPercentage ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700 min-w-[32px] text-right">
                            {p.completionPercentage ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="font-mono text-xs text-brand-800 hover:underline cursor-pointer"
                          onClick={() => navigate(`/proposals/${p.id}`)}
                        >
                          {p.proposalCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Clone — all proposals */}
                          <button
                            className="inline-flex items-center gap-1 py-1 px-2.5 text-xs rounded font-medium bg-brand-800 text-white hover:bg-brand-900 transition-colors"
                            onClick={() => navigate(`/proposals/new?cloneFrom=${p.id}`)}
                            title="Clone this proposal into a new draft"
                          >
                            <Copy size={11} /> Clone
                          </button>

                          {/* Revise — Stage 5 only */}
                          {isStage5 && (
                            <button
                              className="inline-flex items-center gap-1 py-1 px-2.5 text-xs rounded font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                              onClick={() => handleRevise(p as unknown as Proposal)}
                              disabled={reopenProposal.isPending}
                              title="Move back to Stage 4 (Mgmt Review) for revision"
                            >
                              <RefreshCcw size={11} /> Revise
                            </button>
                          )}

                          {/* Reopen — Stage 5 only */}
                          {isStage5 && (
                            <button
                              className="inline-flex items-center gap-1 py-1 px-2.5 text-xs rounded font-medium border border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                              onClick={() => openReopenModal(p as unknown as Proposal)}
                              title="Reopen this proposal"
                            >
                              <RotateCcw size={11} /> Reopen
                            </button>
                          )}

                          {/* Amend — Stage 5, non-amendment only */}
                          {isStage5 && !p.isAmendment && (
                            <button
                              className="inline-flex items-center gap-1 py-1 px-2.5 text-xs rounded font-medium border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
                              onClick={() => openAmendModal(p as unknown as Proposal)}
                              disabled={createAmendment.isPending}
                              title="Create a formal amendment"
                            >
                              <FileEdit size={11} /> Amend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!data?.items.length && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                      No proposals found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500 text-xs">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <button className="btn-secondary py-1 px-3 text-xs" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
              <button className="btn-secondary py-1 px-3 text-xs" disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Amendment Modal ─────────────────────────────────────────── */}
      {amendProposal && amendForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Create Amendment</h2>
                <p className="text-sm text-gray-500 mt-0.5">Create a new amendment for the selected proposal.</p>
              </div>
              <button onClick={closeAmendModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Salesforce Opportunity ID + Manual toggle */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="label">Salesforce Opportunity ID</label>
                  <input
                    className="input"
                    placeholder="e.g., OPP-2024-001"
                    value={amendForm.sfdcOpportunityId}
                    disabled={!amendForm.sfdcManual}
                    onChange={(e) => setAmend('sfdcOpportunityId', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1.5 pb-2 text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors flex-shrink-0"
                  onClick={() => setAmend('sfdcManual', !amendForm.sfdcManual)}
                >
                  {amendForm.sfdcManual
                    ? <ToggleRight size={22} className="text-brand-700" />
                    : <ToggleLeft size={22} className="text-gray-400" />}
                  Manual
                </button>
              </div>

              {/* Salesforce Parent Opportunity ID */}
              <div>
                <label className="label">Salesforce Parent Opportunity ID</label>
                <input
                  className="input"
                  placeholder="e.g., OPP-PARENT-2024-001"
                  value={amendForm.sfdcParentOpportunityId}
                  onChange={(e) => setAmend('sfdcParentOpportunityId', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Enter the parent opportunity ID from Salesforce if applicable</p>
              </div>

              {/* Proposal Name */}
              <div>
                <label className="label">Proposal Name <span className="text-red-500">*</span></label>
                <input
                  className="input"
                  value={amendForm.name}
                  onChange={(e) => setAmend('name', e.target.value)}
                />
              </div>

              {/* Client Name */}
              <div>
                <label className="label">Client Name <span className="text-red-500">*</span></label>
                <input
                  className="input"
                  value={amendForm.client}
                  onChange={(e) => setAmend('client', e.target.value)}
                />
              </div>

              {/* Proposal Code */}
              <div>
                <label className="label">Proposal Code <span className="text-red-500">*</span></label>
                <input
                  className="input"
                  value={amendForm.proposalCode}
                  onChange={(e) => setAmend('proposalCode', e.target.value)}
                />
              </div>

              {/* Proposal Manager */}
              <div>
                <label className="label">Proposal Manager <span className="text-red-500">*</span></label>
                <input
                  className="input"
                  value={amendForm.proposalManager}
                  onChange={(e) => setAmend('proposalManager', e.target.value)}
                />
              </div>

              {/* BD Manager */}
              <div>
                <label className="label">BD Manager <span className="text-red-500">*</span></label>
                <input
                  className="input"
                  value={amendForm.bdManager}
                  onChange={(e) => setAmend('bdManager', e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                <textarea
                  className="input min-h-[80px] resize-y"
                  value={amendForm.description}
                  onChange={(e) => setAmend('description', e.target.value)}
                  placeholder="Describe the reason or scope of this amendment..."
                />
              </div>

              {/* Stakeholders */}
              <div>
                <label className="label">Assign Stakeholders <span className="text-gray-400 font-normal">(Optional)</span></label>
                <p className="text-xs text-gray-400 mb-2">Assigned stakeholders will get email notification with proposal link. They can view and edit the proposal.</p>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    type="email"
                    placeholder="Enter email address"
                    value={amendForm.stakeholderInput}
                    onChange={(e) => setAmend('stakeholderInput', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmendStakeholder(); } }}
                  />
                  <button type="button" className="btn-secondary flex items-center gap-1.5" onClick={addAmendStakeholder}>
                    <UserPlus size={14} /> Add
                  </button>
                </div>
                {amendForm.assignedStakeholders.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {amendForm.assignedStakeholders.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                        {s}
                        <button
                          type="button"
                          onClick={() => setAmendForm((f) => f ? { ...f, assignedStakeholders: f.assignedStakeholders.filter((x) => x !== s) } : f)}
                          className="ml-0.5 text-blue-400 hover:text-blue-700"
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button type="button" className="btn-secondary" onClick={closeAmendModal}>Cancel</button>
              <button
                type="button"
                className="btn-primary"
                disabled={
                  createAmendment.isPending ||
                  !amendForm.name.trim() ||
                  !amendForm.client.trim() ||
                  !amendForm.proposalCode.trim() ||
                  !amendForm.bdManager.trim()
                }
                onClick={submitAmendment}
              >
                {createAmendment.isPending ? 'Creating...' : 'Create Amendment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reopen Proposal Modal ──────────────────────────────────────────── */}
      {reopenProposalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Reopen Proposal</h2>
                <p className="text-sm text-gray-500 mt-0.5 break-words">
                  How would you like to reopen <span className="font-medium text-gray-700">{reopenProposalTarget.name}</span>?
                </p>
              </div>
              <button onClick={closeReopenModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              {/* Option: Clone */}
              <button
                type="button"
                onClick={() => setReopenMode('clone')}
                className={clsx(
                  'w-full text-left rounded-xl border-2 p-4 transition-all',
                  reopenMode === 'clone' ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', reopenMode === 'clone' ? 'bg-brand-800' : 'bg-gray-100')}>
                    <Copy size={16} className={reopenMode === 'clone' ? 'text-white' : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Clone the proposal</p>
                    <p className="text-xs text-gray-500 mt-0.5">Create a new proposal by copying all content from this one</p>
                  </div>
                </div>
              </button>

              {/* Option: Revise */}
              <button
                type="button"
                onClick={() => setReopenMode('revise')}
                className={clsx(
                  'w-full text-left rounded-xl border-2 p-4 transition-all',
                  reopenMode === 'revise' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', reopenMode === 'revise' ? 'bg-orange-500' : 'bg-gray-100')}>
                    <RefreshCcw size={16} className={reopenMode === 'revise' ? 'text-white' : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Revise the proposal</p>
                    <p className="text-xs text-gray-500 mt-0.5">Move this proposal back to Stage 4 (Mgmt Review) for further edits</p>
                  </div>
                </div>
              </button>

              {/* Option: New */}
              <button
                type="button"
                onClick={() => setReopenMode('new')}
                className={clsx(
                  'w-full text-left rounded-xl border-2 p-4 transition-all',
                  reopenMode === 'new' ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', reopenMode === 'new' ? 'bg-emerald-600' : 'bg-gray-100')}>
                    <Plus size={16} className={reopenMode === 'new' ? 'text-white' : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Create a new proposal</p>
                    <p className="text-xs text-gray-500 mt-0.5">Start a completely new proposal from scratch</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button type="button" className="btn-secondary" onClick={closeReopenModal}>Cancel</button>
              <button
                type="button"
                className="btn-primary"
                disabled={!reopenMode || reopenProposal.isPending}
                onClick={confirmReopen}
              >
                {reopenProposal.isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
