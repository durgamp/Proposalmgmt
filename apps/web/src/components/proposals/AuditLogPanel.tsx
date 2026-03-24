import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../services/api';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  proposalId: string;
}

export default function AuditLogPanel({ proposalId }: Props) {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', proposalId, page],
    queryFn: () => auditApi.list(proposalId, page, 25),
  });

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Audit Log</h3>
        <p className="text-xs text-gray-500 mt-0.5">GxP-compliant immutable record of all changes</p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Loading audit log...</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {(data?.items ?? []).map((log) => (
            <div key={log.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge bg-blue-100 text-blue-700 text-xs">{log.action}</span>
                    <span className="text-xs text-gray-600 truncate">{log.details}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    <span className="font-medium text-gray-600">{log.userName}</span>
                    <span className="mx-1.5">·</span>
                    {log.userEmail}
                    <span className="mx-1.5">·</span>
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </div>
                </div>
                {(log.changes || log.snapshot) && (
                  <button
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    {expandedId === log.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
              </div>

              {expandedId === log.id && (log.changes || log.snapshot) && (
                <pre className="mt-2 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(log.changes ?? log.snapshot, null, 2)}
                </pre>
              )}
            </div>
          ))}
          {!data?.items.length && (
            <div className="p-8 text-center text-gray-400 text-sm">No audit records found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 25 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-500 text-xs">
            {(page - 1) * 25 + 1}–{Math.min(page * 25, data.total)} of {data.total} records
          </span>
          <div className="flex gap-2">
            <button className="btn-secondary py-1 px-3 text-xs" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <button className="btn-secondary py-1 px-3 text-xs" disabled={page * 25 >= data.total} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
