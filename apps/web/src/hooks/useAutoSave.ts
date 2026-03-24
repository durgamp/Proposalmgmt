import { useEffect, useRef } from 'react';
import { useUpdateSection } from './useSections';
import { useAuthStore } from '../stores/authStore';

const DEBOUNCE_MS = 2000;

/**
 * Debounced auto-save for section content.
 * Triggers save 2 seconds after the last content change.
 */
export function useAutoSave(
  proposalId: string,
  sectionKey: string,
  content: unknown,
  enabled = true,
) {
  const updateSection = useUpdateSection();
  const user = useAuthStore((s) => s.user);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (!enabled || firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!proposalId || !sectionKey || !user) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      updateSection.mutate(
        {
          proposalId,
          sectionKey,
          dto: {
            content,
            updatedBy: user.email,
          },
        },
        {
          onError: (err) => {
            console.warn('[AutoSave] Failed to save section:', (err as Error).message);
          },
        },
      );
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // updateSection is stable (react-query mutation object); omitting it is safe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, enabled, proposalId, sectionKey, user]);
}
