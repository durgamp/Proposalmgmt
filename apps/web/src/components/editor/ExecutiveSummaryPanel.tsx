import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { costsApi } from '../../services/api';
import { DeepSearchBar } from './DeepSearchBar';
import { TrendingUp, Clock, DollarSign, Package, ExternalLink, Zap } from 'lucide-react';
import type { Proposal } from '@biopropose/shared-types';

interface Props {
  proposal: Proposal;
}

function fmt(n: number) {
  return `$${n.toLocaleString()}`;
}

export function ExecutiveSummaryPanel({ proposal }: Props) {
  const { data: costs } = useQuery({
    queryKey: ['costs', proposal.id],
    queryFn: () => costsApi.getCosts(proposal.id),
  });

  const { data: costSummary } = useQuery({
    queryKey: ['costs-summary', proposal.id],
    queryFn: () => costsApi.getSummary(proposal.id),
  });

  const { data: timelineData } = useQuery({
    queryKey: ['timeline', proposal.id],
    queryFn: () => costsApi.getTimeline(proposal.id),
  });

  // Aggregate cost by stage label
  const stageCosts = useMemo(() => {
    if (!costs) return [];
    const map: Record<string, { service: number; material: number; outsourcing: number; total: number }> = {};
    for (const item of costs) {
      const key = item.stage || 'General';
      if (!map[key]) map[key] = { service: 0, material: 0, outsourcing: 0, total: 0 };
      map[key].service += (item.serviceRate ?? 0) * item.quantity;
      map[key].material += (item.materialRate ?? 0) * item.quantity;
      map[key].outsourcing += (item.outsourcingRate ?? 0) * item.quantity;
      map[key].total += item.totalCost ?? 0;
    }
    return Object.entries(map).map(([stage, v]) => ({ stage, ...v }));
  }, [costs]);

  // Compute min/max weeks per timeline stage
  const stageDurations = useMemo(() => {
    if (!timelineData?.stages) return [];
    return timelineData.stages.map((s) => {
      const days = s.durationDays || 0;
      const minWeeks = Math.round(days / 7);
      const maxWeeks = Math.ceil(days / 7 * 1.2);
      return { stage: s.name, minWeeks, maxWeeks };
    });
  }, [timelineData]);

  // Key highlights
  const longestStage = stageDurations.reduce(
    (prev, cur) => (cur.maxWeeks > prev.maxWeeks ? cur : prev),
    { stage: '—', maxWeeks: 0, minWeeks: 0 },
  );
  const highestCostStage = stageCosts.reduce(
    (prev, cur) => (cur.total > prev.total ? cur : prev),
    { stage: '—', total: 0, service: 0, material: 0, outsourcing: 0 },
  );

  const totalMinWeeks = stageDurations.reduce((s, t) => s + t.minWeeks, 0);
  const totalMaxWeeks = stageDurations.reduce((s, t) => s + t.maxWeeks, 0);
  const grandTotal = (costSummary?.grandTotal as number) ?? 0;
  const serviceTotal = (costSummary?.serviceTotal as number) ?? 0;
  const materialTotal = (costSummary?.materialTotal as number) ?? 0;
  const outsourcingTotal = grandTotal - serviceTotal - materialTotal;

  // Merge stage rows for the combined table
  const allStages = Array.from(
    new Set([...stageCosts.map((s) => s.stage), ...stageDurations.map((s) => s.stage)]),
  );

  return (
    <div className="mb-6 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-700" />
          Auto-Generated Executive Summary
        </h3>
        <DeepSearchBar
          sectionKey="executive-summary"
          sectionTitle="Executive Summary"
          currentProposalId={proposal.id}
        />
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-800">
            {totalMinWeeks > 0 ? `${totalMinWeeks}–${totalMaxWeeks}` : '—'}
          </p>
          <p className="text-xs text-blue-600">Duration (weeks)</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-800">{fmt(serviceTotal)}</p>
          <p className="text-xs text-green-600">Service Cost</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <Package className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-amber-800">{fmt(materialTotal)}</p>
          <p className="text-xs text-amber-600">Material Cost</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <ExternalLink className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-purple-800">{fmt(outsourcingTotal > 0 ? outsourcingTotal : 0)}</p>
          <p className="text-xs text-purple-600">Outsourcing Cost</p>
        </div>
      </div>

      {/* Grand Total banner */}
      <div className="bg-brand-800 rounded-xl px-5 py-3 flex items-center justify-between">
        <span className="text-white text-sm font-medium">Grand Total</span>
        <span className="text-white text-xl font-bold">{fmt(grandTotal)}</span>
      </div>

      {/* Stage cost + duration table */}
      {allStages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Stage Breakdown</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2 text-left font-semibold text-gray-500">Stage</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-500">Min Duration (Weeks)</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-500">Max Duration (Weeks)</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-500">Service</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-500">Material</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-500">Outsourcing</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allStages.map((stage) => {
                  const c = stageCosts.find((s) => s.stage === stage);
                  const d = stageDurations.find((s) => s.stage === stage);
                  return (
                    <tr key={stage} className="hover:bg-blue-50/30">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{stage}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{d?.minWeeks ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{d?.maxWeeks ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{c ? fmt(c.service) : '—'}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{c ? fmt(c.material) : '—'}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{c ? fmt(c.outsourcing) : '—'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{c ? fmt(c.total) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-gray-800">Total</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-800">{totalMinWeeks || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-800">{totalMaxWeeks || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-800">{fmt(serviceTotal)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-800">{fmt(materialTotal)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-800">{fmt(outsourcingTotal > 0 ? outsourcingTotal : 0)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-brand-800">{fmt(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Key Highlights */}
      {(longestStage.stage !== '—' || highestCostStage.stage !== '—') && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-semibold text-orange-700">Longest Stage</p>
            </div>
            <p className="font-bold text-gray-900">{longestStage.stage}</p>
            <p className="text-xs text-gray-500">{longestStage.minWeeks}–{longestStage.maxWeeks} weeks</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-red-600" />
              <p className="text-xs font-semibold text-red-700">Highest Cost Stage</p>
            </div>
            <p className="font-bold text-gray-900">{highestCostStage.stage}</p>
            <p className="text-xs text-gray-500">{fmt(highestCostStage.total)}</p>
          </div>
        </div>
      )}

      {/* No data placeholder */}
      {allStages.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          Add cost items and timeline stages to auto-generate the executive summary data.
        </div>
      )}
    </div>
  );
}
