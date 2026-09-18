'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALES } from './i18n';
import { useLang } from './LanguageContext';

export type MyRequest = {
  id: string;
  from: string;
  to: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'declined';
};

const inputClasses =
  'rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100';

function formatRange(from: string, to: string, locale: string) {
  return `${new Date(from).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(
    to
  ).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function statusBadgeClasses(status: MyRequest['status']) {
  if (status === 'confirmed') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  }
  if (status === 'declined') {
    return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
  return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
}

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export function MyRequests({ requests }: { requests: MyRequest[] }) {
  const router = useRouter();
  const { t, lang } = useLang();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorId, setErrorId] = useState<string | null>(null);

  const startEdit = (r: MyRequest) => {
    setEditingId(r.id);
    setFrom(toDateInputValue(r.from));
    setTo(toDateInputValue(r.to));
    setNotes(r.notes || '');
    setErrorId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setErrorId(null);
  };

  const save = async (id: string) => {
    setSaving(true);
    setErrorId(null);

    try {
      const res = await fetch(`/api/bookings?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, notes: notes || undefined }),
      });

      if (!res.ok) {
        setErrorId(id);
        return;
      }

      setEditingId(null);
      router.refresh();
    } catch (err) {
      console.error('Error saving booking edit:', err);
      setErrorId(id);
    } finally {
      setSaving(false);
    }
  };

  if (requests.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">{t.noMyRequests}</p>;
  }

  return (
    <ul className="space-y-3 max-w-2xl">
      {requests.map((r) => {
        const isEditing = editingId === r.id;
        return (
          <li key={r.id} className="rounded-md border border-gray-200 dark:border-gray-700 px-4 py-3">
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <input
                    type="date"
                    className={inputClasses}
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      if (to && e.target.value && to < e.target.value) setTo('');
                    }}
                  />
                  <input
                    type="date"
                    className={inputClasses}
                    min={from || undefined}
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
                <textarea
                  className={`${inputClasses} w-full`}
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={`${t.formNotes} ${t.formNotesOptional}`}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.editNotice}</p>
                {errorId === r.id && <p className="text-sm text-red-700 dark:text-red-400">{t.saveError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => save(r.id)}
                    className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.save}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={cancelEdit}
                    className="rounded-md border border-gray-300 dark:border-gray-600 text-sm font-medium px-3 py-1.5"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{formatRange(r.from, r.to, LOCALES[lang])}</p>
                  {r.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">&ldquo;{r.notes}&rdquo;</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClasses(r.status)}`}>
                    {r.status === 'confirmed' ? t.statusConfirmed : r.status === 'declined' ? t.statusDeclined : t.statusPending}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(r)}
                    className="rounded-md border border-gray-300 dark:border-gray-600 text-sm font-medium px-3 py-1.5"
                  >
                    {t.edit}
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
