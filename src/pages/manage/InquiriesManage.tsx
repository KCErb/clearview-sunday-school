import { useCallback, useEffect, useState } from 'react';
import { allInquiries } from '@/data/cwass';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { InquiriesPanel } from '@/components/manage/InquiriesPanel';
import { FullPageSpinner } from '@/components/Spinner';
import type { Inquiry } from '@/lib/types';

export function InquiriesManage() {
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const load = useCallback(async () => {
    setInquiries(await allInquiries());
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  if (loading) return <FullPageSpinner />;

  return (
    <ManageLayout>
      <h1 className="text-xl font-bold text-ink">Questions from the class</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Bring these to class to discuss together — or, if you’d like, post a short note here for
        everyone to see.
      </p>
      <div className="mt-5">
        <InquiriesPanel inquiries={inquiries} onChange={load} />
      </div>
    </ManageLayout>
  );
}
