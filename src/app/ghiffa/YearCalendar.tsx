'use client';

import { useMemo, useState } from 'react';
import type { UpcomingStay } from './page';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

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

export function YearCalendar({ stays }: { stays: UpcomingStay[] }) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          aria-label="Previous year"
          className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm hover:border-gray-400 dark:hover:border-gray-500"
        >
          &larr;
        </button>
        <h3 className="text-lg font-semibold w-12 text-center">{year}</h3>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          aria-label="Next year"
          className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm hover:border-gray-400 dark:hover:border-gray-500"
        >
          &rarr;
        </button>
        <div className="flex items-center gap-4 ml-auto text-xs text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-500" /> Confirmed
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" /> Pending
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm border border-gray-300 dark:border-gray-600" /> Free
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700 p-3">
        <div className="min-w-[640px] space-y-1">
          {MONTHS.map((label, m) => {
            const daysInMonth = new Date(year, m + 1, 0).getDate();
            return (
              <div
                key={label}
                className="grid items-center gap-[2px]"
                style={{ gridTemplateColumns: '2.75rem repeat(31, minmax(10px, 1fr))' }}
              >
                <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                  if (d > daysInMonth) {
                    return <span key={d} />;
                  }
                  const iso = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const stay = dayStatus(iso, stays);
                  const isToday = iso === todayIso;
                  return (
                    <span
                      key={d}
                      title={
                        stay
                          ? `${d} ${label} — ${stay.firstName} (${stay.status})`
                          : `${d} ${label} — free`
                      }
                      className={`aspect-square rounded-[3px] border ${
                        stay?.status === 'confirmed'
                          ? 'bg-green-500 border-green-500'
                          : stay?.status === 'pending'
                          ? 'bg-amber-400 border-amber-400'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      } ${isToday ? 'ring-2 ring-inset ring-gray-900 dark:ring-white' : ''}`}
                    />
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
