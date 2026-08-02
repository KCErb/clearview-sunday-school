import { Lock, User } from 'lucide-react';
import type { LiveAttribution } from '@/lib/types';

/**
 * States the prompt's attribution rule in plain language, before anyone answers.
 * The rule is not a UI convention — the insert policy in 0014 enforces it, so an
 * 'anonymous' prompt physically cannot store who responded.
 */
export function AttributionBanner({ attribution }: { attribution: LiveAttribution }) {
  if (attribution === 'anonymous') {
    return (
      <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold">Anonymous</span>
          <span className="block text-xs leading-relaxed text-emerald-800">
            Your name is not recorded. Not even KC will know who answered.
          </span>
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-sky-50 p-3 text-sm text-ink">
      <User className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
      <span>
        <span className="font-semibold">KC sees your name</span>
        <span className="block text-xs leading-relaxed text-ink-soft">
          Your response is linked to you. It stays between you and KC — your name is never shown
          to the class.
        </span>
      </span>
    </div>
  );
}
