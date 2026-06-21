import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { allInquiries, getSession, nameMap } from '@/data/cwass';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { Attribution } from '@/components/manage/Attribution';
import { FullPageSpinner } from '@/components/Spinner';
import type { Inquiry, Session } from '@/lib/types';

export function SessionQuestions() {
  const { id } = useParams();
  const sessionId = Number(id);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [s, inq, nm] = await Promise.all([getSession(sessionId), allInquiries(), nameMap()]);
    setSession(s);
    setInquiries(inq.filter((i) => i.session_id === sessionId));
    setNames(nm);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  if (loading) return <FullPageSpinner />;
  if (!session) {
    return (
      <ManageLayout>
        <p className="text-ink-soft">Session not found.</p>
        <Link to="/manage" className="mt-3 inline-block font-semibold text-brand">← All sessions</Link>
      </ManageLayout>
    );
  }

  return (
    <ManageLayout>
      <Link to="/manage" className="text-sm font-medium text-brand hover:text-brand-bright">← All sessions</Link>
      <h1 className="mt-3 text-xl font-bold text-ink">{session.title} · questions from the class</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Questions members sent this session — bring them to class to discuss together. Anonymous
        questions have no record of who asked.
      </p>

      {inquiries.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-sky-100 bg-white/40 p-6 text-center text-sm text-ink-faint">
          No questions from the class yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {inquiries.map((q) => (
            <li key={q.id} className="rounded-xl border border-sky-100 bg-white p-3.5 text-sm shadow-sm">
              <p className="leading-relaxed text-ink">{q.body}</p>
              <div className="mt-2">
                <Attribution anonymous={q.is_anonymous} name={q.author_id ? names[q.author_id] : undefined} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ManageLayout>
  );
}
