import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionsApi, commentsApi } from '../services/api';
import toast from 'react-hot-toast';

const SECTIONS_KEY = 'sections';
const COMMENTS_KEY = 'comments';

export function useSections(proposalId: string) {
  return useQuery({
    queryKey: [SECTIONS_KEY, proposalId],
    queryFn: () => sectionsApi.list(proposalId),
    enabled: !!proposalId,
  });
}

export function useSection(proposalId: string, sectionKey: string) {
  return useQuery({
    queryKey: [SECTIONS_KEY, proposalId, sectionKey],
    queryFn: () => sectionsApi.getOne(proposalId, sectionKey),
    enabled: !!proposalId && !!sectionKey,
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, sectionKey, dto }: { proposalId: string; sectionKey: string; dto: unknown }) =>
      sectionsApi.update(proposalId, sectionKey, dto),
    onSuccess: (_data, { proposalId }) => {
      qc.invalidateQueries({ queryKey: [SECTIONS_KEY, proposalId] });
      qc.invalidateQueries({ queryKey: ['proposals', proposalId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save section'),
    // Errors bubble up to callers (handleManualSave, handleMarkComplete, etc.)
    // which show their own toasts — the onError above is the final safety net.
  });
}

export function useComments(proposalId: string, sectionKey: string) {
  return useQuery({
    queryKey: [COMMENTS_KEY, proposalId, sectionKey],
    queryFn: () => commentsApi.list(proposalId, sectionKey),
    enabled: !!proposalId && !!sectionKey,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, sectionKey, dto }: { proposalId: string; sectionKey: string; dto: unknown }) =>
      commentsApi.create(proposalId, sectionKey, dto),
    onSuccess: (_data, { proposalId, sectionKey }) => {
      qc.invalidateQueries({ queryKey: [COMMENTS_KEY, proposalId, sectionKey] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to add comment'),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, sectionKey, commentId, userEmail }: {
      proposalId: string; sectionKey: string; commentId: string; userEmail: string;
    }) => commentsApi.delete(proposalId, sectionKey, commentId, userEmail),
    onSuccess: (_data, { proposalId, sectionKey }) => {
      qc.invalidateQueries({ queryKey: [COMMENTS_KEY, proposalId, sectionKey] });
    },
  });
}

/** Fetch audit log entries for a specific section (filtered client-side from the proposal audit log) */
export function useSectionRevisions(proposalId: string, sectionKey: string) {
  return useQuery({
    queryKey: ['section-revisions', proposalId, sectionKey],
    queryFn: async () => {
      const { auditApi } = await import('../services/api');
      const data = await auditApi.list(proposalId, 1, 200);
      // Filter audit entries relevant to this section
      return (data.items ?? []).filter((log) => {
        const details = (log.details ?? '').toLowerCase();
        const sectionTitle = sectionKey.replace(/-/g, ' ').toLowerCase();
        return (
          details.includes(sectionTitle) ||
          details.includes(sectionKey) ||
          log.action === 'section_completed' ||
          log.action === 'section_locked' ||
          log.action === 'section_unlocked'
        );
      });
    },
    enabled: !!proposalId && !!sectionKey,
  });
}
