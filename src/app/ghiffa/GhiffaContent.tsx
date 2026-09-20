'use client';

import { useState } from 'react';
import { LOCALES } from './i18n';
import { LanguageProvider, useLang } from './LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { MyRequests, type MyRequest } from './MyRequests';
import { PendingRequests, type PendingRequest } from './PendingRequests';
import { PhotoGallery } from './PhotoGallery';
import { RequestForm } from './RequestForm';
import type { UpcomingStay } from './page';
import { YearCalendar } from './YearCalendar';

function formatRange(from: string, to: string, locale: string) {
  return `${new Date(from).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(
    to
  ).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

type Props = {
  address: string;
  stays: UpcomingStay[];
  pendingRequests: PendingRequest[];
  myRequests: MyRequest[];
  isOwner: boolean;
  defaultName: string;
  defaultEmail: string;
  galleryImages: string[];
};

function GhiffaBody({
  address,
  stays,
  pendingRequests,
  myRequests,
  isOwner,
  defaultName,
  defaultEmail,
  galleryImages,
}: Props) {
  const { t, lang } = useLang();
  const [selectedFrom, setSelectedFrom] = useState<string | null>(null);
  const [selectedTo, setSelectedTo] = useState<string | null>(null);

  const handleSelectRange = (from: string, to: string) => {
    setSelectedFrom(from);
    setSelectedTo(to);
    document.getElementById('request-a-stay')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <section className="mb-16">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-4">{t.title}</h1>
            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 max-w-2xl">{t.intro(address)}</p>
          </div>
          <LanguageSelector />
        </div>

        <PhotoGallery images={galleryImages} alt={t.title} />
      </section>

      {isOwner && (
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-6">{t.pendingHeading}</h2>
          <PendingRequests requests={pendingRequests} />
        </section>
      )}

      {myRequests.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-6">{t.myRequestsHeading}</h2>
          <MyRequests requests={myRequests} />
        </section>
      )}

      <section className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-6">{t.calendarHeading}</h2>
        <YearCalendar
          stays={stays}
          selectedFrom={selectedFrom}
          selectedTo={selectedTo}
          onSelectRange={handleSelectRange}
        />
      </section>

      <section className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-6">{t.upcomingHeading}</h2>
        {stays.length > 0 ? (
          <ul className="space-y-3 max-w-2xl">
            {stays.map((stay) => (
              <li
                key={stay.id}
                className="flex items-center justify-between gap-4 rounded-md border border-gray-200 dark:border-gray-700 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{stay.firstName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatRange(stay.from, stay.to, LOCALES[lang])}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    stay.status === 'confirmed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}
                >
                  {stay.status === 'confirmed' ? t.statusConfirmed : t.statusPending}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">{t.noUpcoming}</p>
        )}
      </section>

      <section id="request-a-stay" className="mb-16 scroll-mt-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-6">{t.requestHeading}</h2>
        <RequestForm
          defaultName={defaultName}
          defaultEmail={defaultEmail}
          selectedFrom={selectedFrom}
          selectedTo={selectedTo}
          isOwner={isOwner}
        />
      </section>
    </>
  );
}

export function GhiffaContent(props: Props) {
  return (
    <LanguageProvider>
      <GhiffaBody {...props} />
    </LanguageProvider>
  );
}
