import { useState, useEffect, useRef, forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

interface GrammarError {
  start: number;
  end: number;
  message: string;
  type: 'spelling' | 'grammar' | 'style';
  suggestion?: string;
}

interface GrammarCheckTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const GrammarCheckTextarea = forwardRef<
  HTMLTextAreaElement,
  GrammarCheckTextareaProps
>(({ value, onChange, className, disabled, ...props }, ref) => {
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [hoveredError, setHoveredError] = useState<GrammarError | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const checkGrammar = (text: string): GrammarError[] => {
    const found: GrammarError[] = [];

    // Repeated words
    const repeatedWordsRegex = /\b(\w+)\s+\1\b/gi;
    let match;
    while ((match = repeatedWordsRegex.exec(text)) !== null) {
      found.push({
        start: match.index,
        end: match.index + match[0].length,
        message: `Repeated word: "${match[1]}"`,
        type: 'grammar',
        suggestion: match[1],
      });
    }

    // Common confusion patterns
    const confusions: Array<{ context: RegExp; message: string; suggestion: string }> = [
      { context: /\bthere\s+(proposal|project|team|company)\b/gi, message: "Did you mean 'their'?", suggestion: 'their' },
      { context: /\b(more|less|better|worse)\s+then\b/gi, message: "Did you mean 'than'?", suggestion: 'than' },
    ];
    confusions.forEach(({ context, message, suggestion }) => {
      let m;
      while ((m = context.exec(text)) !== null) {
        found.push({ start: m.index, end: m.index + m[0].length, message, type: 'grammar', suggestion });
      }
    });

    // Sentence capitalization
    const sentenceStart = /([.!?]\s+)([a-z])/g;
    while ((match = sentenceStart.exec(text)) !== null) {
      const idx = match.index + match[1].length;
      found.push({ start: idx, end: idx + 1, message: 'Sentence should start with a capital letter', type: 'grammar', suggestion: match[2].toUpperCase() });
    }
    if (text.length > 0 && /^[a-z]/.test(text)) {
      found.push({ start: 0, end: 1, message: 'First letter should be capitalized', type: 'grammar', suggestion: text[0].toUpperCase() });
    }

    // Double spaces
    const doubleSpace = /  +/g;
    while ((match = doubleSpace.exec(text)) !== null) {
      found.push({ start: match.index, end: match.index + match[0].length, message: 'Extra spaces', type: 'style', suggestion: ' ' });
    }

    // Common misspellings
    const misspellings: Array<{ wrong: RegExp; correct: string }> = [
      { wrong: /\boccured\b/gi, correct: 'occurred' },
      { wrong: /\brecieve\b/gi, correct: 'receive' },
      { wrong: /\bseperate\b/gi, correct: 'separate' },
      { wrong: /\bdefinately\b/gi, correct: 'definitely' },
      { wrong: /\boccassion\b/gi, correct: 'occasion' },
    ];
    misspellings.forEach(({ wrong, correct }) => {
      let m;
      while ((m = wrong.exec(text)) !== null) {
        found.push({ start: m.index, end: m.index + m[0].length, message: 'Possible misspelling', type: 'spelling', suggestion: correct });
      }
    });

    return found;
  };

  useEffect(() => {
    if (!value || disabled) { setErrors([]); return; }
    const timer = setTimeout(() => setErrors(checkGrammar(value)), 500);
    return () => clearTimeout(timer);
  }, [value, disabled]);

  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const escapeHtml = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

  const getHighlightedText = () => {
    if (!value) return '';
    let result = '';
    let lastIndex = 0;
    const sorted = [...errors].sort((a, b) => a.start - b.start);
    sorted.forEach((error, index) => {
      result += escapeHtml(value.substring(lastIndex, error.start));
      const errorText = value.substring(error.start, error.end);
      const colorClass = error.type === 'spelling' ? 'bg-red-200' : error.type === 'grammar' ? 'bg-yellow-200' : 'bg-blue-200';
      result += `<span class="${colorClass} underline decoration-wavy decoration-2 cursor-pointer" data-error-index="${index}">${escapeHtml(errorText)}</span>`;
      lastIndex = error.end;
    });
    result += escapeHtml(value.substring(lastIndex));
    return result;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const idx = target.getAttribute('data-error-index');
    if (idx !== null) {
      setHoveredError(errors[parseInt(idx)]);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredError(null);
    }
  };

  const handleApplySuggestion = (error: GrammarError) => {
    if (!error.suggestion) return;
    onChange(value.substring(0, error.start) + error.suggestion + value.substring(error.end));
    setHoveredError(null);
  };

  const sharedStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontFamily: 'inherit',
  };

  return (
    <div className="relative">
      {/* Highlight overlay */}
      <div
        ref={overlayRef}
        className={clsx('absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words', className)}
        style={{ ...sharedStyle, color: 'transparent', border: '1px solid transparent' }}
        dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
      />

      {/* Actual textarea */}
      <textarea
        ref={(node) => {
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
          (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        disabled={disabled}
        spellCheck
        className={clsx(
          'relative bg-transparent resize-none w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />

      {/* Mouse-event overlay */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-words"
        style={{ ...sharedStyle, color: 'transparent', background: 'transparent' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredError(null)}
        dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
      />

      {/* Tooltip */}
      {hoveredError && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 max-w-xs pointer-events-auto"
          style={{ left: tooltipPosition.x + 10, top: tooltipPosition.y - 40 }}
        >
          <p className="font-medium mb-1">{hoveredError.message}</p>
          {hoveredError.suggestion && (
            <button
              onClick={() => handleApplySuggestion(hoveredError)}
              className="text-blue-300 hover:text-blue-200 underline text-xs mt-1"
            >
              Apply: &ldquo;{hoveredError.suggestion}&rdquo;
            </button>
          )}
        </div>
      )}

      {/* Error summary */}
      {errors.length > 0 && (
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          {errors.filter((e) => e.type === 'spelling').length > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              {errors.filter((e) => e.type === 'spelling').length} spelling
            </span>
          )}
          {errors.filter((e) => e.type === 'grammar').length > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              {errors.filter((e) => e.type === 'grammar').length} grammar
            </span>
          )}
          {errors.filter((e) => e.type === 'style').length > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              {errors.filter((e) => e.type === 'style').length} style
            </span>
          )}
        </div>
      )}
    </div>
  );
});

GrammarCheckTextarea.displayName = 'GrammarCheckTextarea';
