'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALES } from './i18n';
import { useLang } from './LanguageContext';

export type PendingRequest = {
  id: string;
  name: string;
  email: string;
  from: string;
  to: string;
  notes?: string;
};

function formatRange(from: string, to: string, locale: string) {
  return `${new Date(from).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(
    to
  ).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function PendingRequests({ requests }: { requests: PendingRequest[] }) {
  const router = useRouter();
  const { t, lang } = useLang();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [handled, setHandled] = useState<Set<string>>(new Set());

  const decide = async (id: string, status: 'confirmed' | 'declined') => {
    setBusyId(id);
    setErrorId(null);

    try {
      const res = await fetch(`/api/bookings?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        setErrorId(id);
        return;
      }

      setHandled((prev) => new Set(prev).add(id));
      router.refresh();
    } catch (err) {
      console.error('Error updating booking:', err);
      setErrorId(id);
    } finally {
      setBusyId(null);
    }
  };

  const visible = requests.filter((r) => !handled.has(r.id));

  if (visible.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">{t.noPending}</p>;
  }

  return (
    <ul className="space-y-3 max-w-2xl">
      {visible.map((r) => (
        <li
          key={r.id}
          className="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {r.name} <span className="font-normal text-gray-600 dark:text-gray-400">&lt;{r.email}&gt;</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{formatRange(r.from, r.to, LOCALES[lang])}</p>
              {r.notes && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">&ldquo;{r.notes}&rdquo;</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => decide(r.id, 'confirmed')}
                className="rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.approve}
              </button>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => decide(r.id, 'declined')}
                className="rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.decline}
              </button>
            </div>
          </div>
          {errorId === r.id && (
            <p className="text-sm text-red-700 dark:text-red-400 mt-2">{t.approveError}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
