import { useCallback, useEffect, useState } from 'react';
import { allInquiries, nameMap } from '@/data/cwass';
import { ManageLayout } from '@/components/manage/ManageLayout';
import { InquiriesPanel } from '@/components/manage/InquiriesPanel';
import { FullPageSpinner } from '@/components/Spinner';
import type { Inquiry } from '@/lib/types';

export function InquiriesManage() {
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [inq, nm] = await Promise.all([allInquiries(), nameMap()]);
    setInquiries(inq);
    setNames(nm);
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
        Questions members have sent you — bring them to class to discuss together.
      </p>
      <div className="mt-5">
        <InquiriesPanel inquiries={inquiries} names={names} />
      </div>
    </ManageLayout>
  );
}
