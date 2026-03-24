import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proposalsApi, type ListProposalsParams } from '../services/api';
import toast from 'react-hot-toast';

export const PROPOSALS_KEY = 'proposals';

export function useProposals(params?: ListProposalsParams) {
  return useQuery({
    queryKey: [PROPOSALS_KEY, params],
    queryFn: () => proposalsApi.list(params),
  });
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: [PROPOSALS_KEY, id],
    queryFn: () => proposalsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: proposalsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
      toast.success('Proposal created successfully');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create proposal'),
  });
}

export function useUpdateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: unknown }) => proposalsApi.update(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [PROPOSALS_KEY, data.id] });
      qc.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update proposal'),
  });
}

export function useAdvanceStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: unknown }) => proposalsApi.advanceStage(id, dto),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [PROPOSALS_KEY, data.id] });
      toast.success('Stage advanced successfully');
    },
    onError: (err: Error) => toast.error(err.message || 'Stage advancement failed'),
  });
}

// Callers (ProposalListPage) provide their own onSuccess toast — hook only handles cache & errors
export function useCreateAmendment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: unknown }) => proposalsApi.createAmendment(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create amendment'),
  });
}

// Callers (ProposalListPage) provide their own onSuccess toast — hook only handles cache & errors
export function useReopenProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: unknown }) => proposalsApi.reopen(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to reopen proposal'),
  });
}
