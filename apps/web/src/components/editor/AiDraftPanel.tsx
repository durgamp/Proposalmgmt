import { useState, useRef, useEffect } from 'react';
import { Sparkles, Copy, CheckCheck, RotateCcw, AlertCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { aiApi } from '../../services/api';
import type { Proposal } from '@biopropose/shared-types';

interface Props {
  proposalId: string;
  sectionKey: string;
  proposal: Proposal;
  onInsert: (text: string) => void;
}

type HealthState = 'checking' | 'ok' | 'error';

export default function AiDraftPanel({ sectionKey, proposal, onInsert }: Props) {
  const [instruction, setInstruction] = useState('');
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [health, setHealth] = useState<HealthState>('checking');
  const [modelName, setModelName] = useState('');
  const [ragMeta, setRagMeta] = useState<{ historicalExamplesUsed: number; usingEmbeddings: boolean } | null>(null);
  const streamRef = useRef<{ close: () => void } | null>(null);

  // Check Ollama health on mount
  useEffect(() => {
    let cancelled = false;
    aiApi.health()
      .then((h: { available: boolean; model?: string; provider?: string; version?: string }) => {
        if (cancelled) return;
        if (h.available) {
          setHealth('ok');
          setModelName(h.model ?? '');
        } else {
          setHealth('error');
        }
      })
      .catch(() => {
        if (!cancelled) setHealth('error');
      });
    return () => { cancelled = true; };
  }, []);

  const generate = () => {
    if (health === 'error') return;
    if (streamRef.current) {
      streamRef.current.close();
    }

    setDraft('');
    setError(null);
    setIsGenerating(true);
    setRagMeta(null);

    const dto = {
      sectionKey,
      proposalId: proposal.id,
      userInstruction: instruction.trim() || undefined,
      proposalContext: {
        name: proposal.name,
        client: proposal.client,
        businessUnit: proposal.businessUnit,
        templateType: proposal.templateType,
        description: proposal.description,
      },
    };

    const eventSource = aiApi.streamDraft(
      dto,
      (text) => setDraft((prev) => prev + text),
      () => setIsGenerating(false),
      (errMsg) => setError(errMsg),
      (meta) => setRagMeta(meta),
    );

    streamRef.current = { close: () => (eventSource as EventSource).close?.() };
  };

  // Expose error channel: patch api.streamDraft to surface errors
  // We do this by wrapping the call and watching for empty draft after done
  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <span className="font-semibold text-sm text-gray-800">AI Draft Generator</span>
        </div>
        {/* Health indicator */}
        {health === 'checking' && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Loader2 size={12} className="animate-spin" /> Connecting...
          </span>
        )}
        {health === 'ok' && (
          <span className="flex items-center gap-1 text-xs text-green-600" title={`Ollama ${modelName} ready`}>
            <Wifi size={12} />
            {modelName || 'Ollama'}
          </span>
        )}
        {health === 'error' && (
          <span className="flex items-center gap-1 text-xs text-red-500" title="Ollama not reachable">
            <WifiOff size={12} /> Offline
          </span>
        )}
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {/* Ollama offline warning */}
        {health === 'error' && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Ollama not reachable</p>
              <p>Make sure the Ollama Docker container is running on port 11434.</p>
              <button
                className="mt-1.5 underline hover:no-underline"
                onClick={() => {
                  setHealth('checking');
                  aiApi.health()
                    .then((h: { available: boolean; model?: string }) => {
                      setHealth(h.available ? 'ok' : 'error');
                      if (h.available) setModelName(h.model ?? '');
                    })
                    .catch(() => setHealth('error'));
                }}
              >
                Retry connection
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="label text-xs">Custom Instructions (optional)</label>
          <textarea
            className="input text-xs resize-none"
            rows={3}
            placeholder="e.g., Focus on mAb expression systems, emphasize GMP compliance..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={health !== 'ok'}
          />
        </div>

        <button
          className="btn-primary w-full justify-center text-sm"
          onClick={generate}
          disabled={isGenerating || health !== 'ok'}
        >
          {isGenerating ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Generate Draft
            </>
          )}
        </button>

        {/* RAG badge */}
        {ragMeta && ragMeta.historicalExamplesUsed > 0 && (
          <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-xs text-purple-700">
            <Sparkles size={12} className="flex-shrink-0" />
            <span>
              Based on {ragMeta.historicalExamplesUsed} historical proposal{ragMeta.historicalExamplesUsed > 1 ? 's' : ''}
              {ragMeta.usingEmbeddings ? ' — semantic match' : ' — keyword match'}
            </span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {draft && (
          <div className="space-y-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
              {draft}
              {isGenerating && <span className="animate-pulse ml-1">▋</span>}
            </div>

            <div className="flex gap-2">
              <button
                className="btn-secondary text-xs py-1 flex-1 justify-center"
                onClick={handleCopy}
              >
                {copied ? <CheckCheck size={13} className="text-green-500" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                className="btn-primary text-xs py-1 flex-1 justify-center"
                onClick={() => onInsert(draft)}
                disabled={isGenerating}
              >
                Insert to Editor
              </button>
            </div>

            <button
              className="btn-secondary text-xs w-full justify-center"
              onClick={generate}
              disabled={isGenerating || health !== 'ok'}
            >
              <RotateCcw size={12} />
              Regenerate
            </button>
          </div>
        )}

        {!draft && !isGenerating && health === 'ok' && !error && (
          <p className="text-xs text-gray-400 text-center py-4">
            Click "Generate Draft" to get an AI-written draft for this section based on your proposal context.
          </p>
        )}
      </div>
    </div>
  );
}
