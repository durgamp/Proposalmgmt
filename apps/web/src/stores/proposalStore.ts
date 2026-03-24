import { create } from 'zustand';
import type { Proposal } from '@biopropose/shared-types';

interface ProposalState {
  // Currently open proposal (detail view)
  currentProposal: Proposal | null;
  setCurrentProposal: (proposal: Proposal | null) => void;

  // Active section key in the editor
  activeSectionKey: string | null;
  setActiveSectionKey: (key: string | null) => void;

  // Dirty tracking for auto-save
  dirtyContent: Record<string, unknown> | null;
  setDirtyContent: (content: Record<string, unknown> | null) => void;

  // UI state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useProposalStore = create<ProposalState>((set) => ({
  currentProposal: null,
  setCurrentProposal: (proposal) => set({ currentProposal: proposal }),

  activeSectionKey: null,
  setActiveSectionKey: (key) => set({ activeSectionKey: key }),

  dirtyContent: null,
  setDirtyContent: (content) => set({ dirtyContent: content }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
