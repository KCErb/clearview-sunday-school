export function Footer() {
  return (
    <footer className="mx-auto max-w-2xl px-6 pb-10 pt-12">
      <div className="border-t border-sky-100 pt-6 text-center text-xs leading-relaxed text-ink-faint">
        <p>
          This is not an official website of The Church of Jesus Christ of Latter-day Saints.
          Views shared here are those of class members, not the Church.
        </p>
        <p className="mt-2">
          Built by KC + AI ·{' '}
          <a className="underline hover:text-ink-soft" href="mailto:admin@clearviewsunday.school">
            admin@clearviewsunday.school
          </a>
        </p>
      </div>
    </footer>
  );
}
