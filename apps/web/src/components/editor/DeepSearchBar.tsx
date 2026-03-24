import { useState, useRef, useEffect } from 'react';
import { Search, X, ExternalLink, Loader2 } from 'lucide-react';
import { proposalsApi } from '../../services/api';

interface DeepSearchBarProps {
  sectionKey: string;
  sectionTitle: string;
  currentProposalId?: string;
}

interface SearchResult {
  proposalId: string;
  proposalName: string;
  proposalCode: string;
  client: string;
  status: string;
  context: string;
  lastModified: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DeepSearchBar({ sectionKey, sectionTitle, currentProposalId }: DeepSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await proposalsApi.list({ search: q, limit: 50 });
      const filtered: SearchResult[] = (data.items ?? [])
        .filter((p) => p.id !== currentProposalId)
        .map((p) => ({
          proposalId: p.id,
          proposalName: p.name,
          proposalCode: p.proposalCode ?? '',
          client: p.client ?? '',
          status: p.status ?? '',
          context: `${p.name} — ${p.client ?? ''} — ${p.proposalCode ?? ''}`,
          lastModified: p.updatedAt,
        }));
      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'Approved') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'Draft') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors border border-gray-200"
        title={`Deep search in ${sectionTitle}`}
      >
        <Search size={13} />
        Deep Search
      </button>

      {isOpen && (
        <div className="absolute top-9 right-0 w-[400px] bg-white shadow-xl border-2 border-brand-600 rounded-lg z-50 p-4">
          {/* Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              className="input pl-9 pr-9 text-sm"
              placeholder={`Search proposals by ${sectionTitle}...`}
              value={query}
              onChange={(e) => { setQuery(e.target.value); handleSearch(e.target.value); }}
            />
            {query && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => { setQuery(''); setResults([]); }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {searching ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </div>
            ) : query && results.length === 0 ? (
              <p className="text-center py-8 text-sm text-gray-500">No proposals found</p>
            ) : query && results.length > 0 ? (
              <>
                <p className="text-xs text-gray-500 mb-1">Found {results.length} proposal{results.length !== 1 ? 's' : ''}</p>
                {results.map((r) => (
                  <div
                    key={r.proposalId}
                    onClick={() => window.open(`/proposals/${r.proposalId}`, '_blank')}
                    className="p-3 border border-gray-200 rounded-lg hover:border-brand-600 hover:bg-blue-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">{r.proposalName}</span>
                        <ExternalLink size={12} className="text-gray-400 group-hover:text-brand-700 flex-shrink-0" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs border border-gray-200 bg-gray-50 text-gray-700 font-mono">
                        {r.proposalCode}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${statusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{r.client}</span>
                      <span>{formatDate(r.lastModified)}</span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Type to find proposals with similar {sectionTitle} content</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
