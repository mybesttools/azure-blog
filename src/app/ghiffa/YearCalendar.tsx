'use client';

import { useMemo, useState } from 'react';
import type { UpcomingStay } from './page';
import { useLang } from './LanguageContext';

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dayStatus(iso: string, stays: UpcomingStay[]) {
  for (const stay of stays) {
    if (iso >= stay.from.slice(0, 10) && iso <= stay.to.slice(0, 10)) {
      return stay;
    }
  }
  return null;
}

type Props = {
  stays: UpcomingStay[];
  selectedFrom?: string | null;
  selectedTo?: string | null;
  onSelectRange?: (from: string, to: string) => void;
};

export function YearCalendar({ stays, selectedFrom, selectedTo, onSelectRange }: Props) {
  const { t } = useLang();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const handleDayClick = (iso: string) => {
    if (!onSelectRange) return;

    if (!pendingStart) {
      setPendingStart(iso);
      return;
    }

    if (iso === pendingStart) {
      setPendingStart(null);
      return;
    }

    const from = iso < pendingStart ? iso : pendingStart;
    const to = iso < pendingStart ? pendingStart : iso;
    onSelectRange(from, to);
    setPendingStart(null);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          aria-label={t.prevYear}
          className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm hover:border-gray-400 dark:hover:border-gray-500"
        >
          &larr;
        </button>
        <h3 className="text-lg font-semibold w-12 text-center">{year}</h3>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          aria-label={t.nextYear}
          className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm hover:border-gray-400 dark:hover:border-gray-500"
        >
          &rarr;
        </button>
        <div className="flex items-center gap-4 ml-auto text-xs text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-500" /> {t.legendConfirmed}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" /> {t.legendPending}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm border border-gray-300 dark:border-gray-600" /> {t.legendFree}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700 p-3">
        <div className="min-w-[860px] space-y-1">
          {t.months.map((label, m) => {
            const daysInMonth = new Date(year, m + 1, 0).getDate();
            return (
              <div
                key={label}
                className="grid items-center gap-[2px]"
                style={{ gridTemplateColumns: '2.75rem repeat(31, minmax(18px, 1fr))' }}
              >
                <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                  if (d > daysInMonth) {
                    return <span key={d} />;
                  }
                  const iso = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const stay = dayStatus(iso, stays);
                  const isToday = iso === todayIso;
                  const isPast = iso < todayIso;
                  const isFree = !stay;
                  const isSelectable = isFree && !isPast;
                  const isPendingStart = iso === pendingStart;
                  const isInSelectedRange = Boolean(
                    selectedFrom && selectedTo && iso >= selectedFrom && iso <= selectedTo
                  );

                  let statusClasses: string;
                  if (stay?.status === 'confirmed') {
                    statusClasses = 'bg-green-500 border-green-500 text-white';
                  } else if (stay?.status === 'pending') {
                    statusClasses = 'bg-amber-400 border-amber-400 text-white';
                  } else if (isPast) {
                    statusClasses = 'bg-gray-100 dark:bg-gray-900 border-gray-100 dark:border-gray-900 text-gray-300 dark:text-gray-700';
                  } else {
                    statusClasses = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500';
                  }

                  const stayStatusLabel = stay?.status === 'confirmed' ? t.legendConfirmed : t.legendPending;
                  const title = stay
                    ? `${d} ${label} — ${stay.firstName} (${stayStatusLabel})`
                    : `${d} ${label} — ${t.legendFree}`;

                  const selectionRing =
                    isPendingStart || isInSelectedRange ? 'ring-2 ring-inset ring-indigo-600 dark:ring-indigo-400' : '';
                  const todayRing = isToday && !isPendingStart && !isInSelectedRange ? 'ring-2 ring-inset ring-gray-900 dark:ring-white' : '';

                  return (
                    <button
                      key={d}
                      type="button"
                      title={title}
                      disabled={!isSelectable}
                      onClick={() => handleDayClick(iso)}
                      className={`aspect-square rounded-[3px] border flex items-center justify-center text-[9px] leading-none tabular-nums ${statusClasses} ${selectionRing} ${todayRing} ${
                        isSelectable ? 'cursor-pointer hover:opacity-70' : 'cursor-not-allowed'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
