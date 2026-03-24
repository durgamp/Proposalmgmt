import { Clock, User, FileEdit, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export interface RevisionEntry {
  id: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  fieldEdited: string;
  beforeValue: string;
  afterValue: string;
  action: 'created' | 'updated' | 'deleted';
}

interface RevisionHistoryProps {
  sectionId: string;
  sectionTitle: string;
  revisions: RevisionEntry[];
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actionColor(action: string): string {
  switch (action) {
    case 'created': return 'bg-green-100 text-green-800 border-green-200';
    case 'updated': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'deleted': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function RevisionHistory({ sectionId, sectionTitle, revisions }: RevisionHistoryProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-sm text-gray-800">Revision History</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            ISO Audit Ready
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
            {revisions.length} {revisions.length === 1 ? 'change' : 'changes'}
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-200 max-h-[300px] overflow-y-auto px-4 pb-4 pt-3 space-y-4">
          {revisions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileEdit className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No changes recorded yet</p>
            </div>
          ) : (
            revisions.map((rev) => (
              <div key={rev.id} className="border-l-2 border-brand-600 pl-4 pb-2 relative">
                <div className="absolute left-[-5px] top-[6px] w-2 h-2 rounded-full bg-brand-600" />
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm text-gray-900">{rev.userName}</p>
                        <p className="text-xs text-gray-500">{rev.userEmail}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${actionColor(rev.action)}`}>
                      {rev.action}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(rev.timestamp)}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Field: </span>
                      <span className="text-gray-900">{rev.fieldEdited}</span>
                    </div>
                    {rev.action !== 'created' && (
                      <>
                        <div>
                          <span className="font-medium text-red-700">Before: </span>
                          <span className="text-gray-600 line-through">{rev.beforeValue || '(empty)'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">After: </span>
                          <span className="text-gray-900">{rev.afterValue || '(empty)'}</span>
                        </div>
                      </>
                    )}
                    {rev.action === 'created' && (
                      <div>
                        <span className="font-medium text-green-700">Value: </span>
                        <span className="text-gray-900">{rev.afterValue}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
