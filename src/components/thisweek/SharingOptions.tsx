/**
 * The two independent consents on a submission:
 *  - anonymous: not even KC knows who (opt-in; default off → KC sees your name)
 *  - nameInClass: OK to show your name/photo in class (opt-in; default off)
 */
export function SharingOptions({
  anonymous,
  setAnonymous,
  nameInClass,
  setNameInClass,
}: {
  anonymous: boolean;
  setAnonymous: (v: boolean) => void;
  nameInClass: boolean;
  setNameInClass: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl bg-sky-50/70 p-3">
      <span className="text-sm font-medium text-ink">Sharing</span>

      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-brand"
        />
        <span>
          <span className="font-medium text-ink">Post anonymously</span>
          <span className="block text-xs text-ink-faint">
            On = not even KC will know it’s from you{anonymous && ' (and you won’t be able to edit it later)'}.
            By default KC sees your name (only KC).
          </span>
        </span>
      </label>

      {!anonymous && (
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={nameInClass}
            onChange={(e) => setNameInClass(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand"
          />
          <span>
            <span className="font-medium text-ink">You can use my name in class</span>
            <span className="block text-xs text-ink-faint">
              Off (default) = KC may share your thought but won’t put your name on it. On = your
              name and photo may appear on a slide in class.
            </span>
          </span>
        </label>
      )}
    </div>
  );
}
