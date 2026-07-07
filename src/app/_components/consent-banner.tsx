'use client';

import { useEffect, useState } from 'react';

const CONSENT_KEY = 'cookie_consent';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

function updateConsent(granted: boolean) {
  const state = granted ? 'granted' : 'denied';
  window.gtag?.('consent', 'update', {
    analytics_storage: state,
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
  });
}

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  const choose = (accepted: boolean) => {
    localStorage.setItem(CONSENT_KEY, accepted ? 'accepted' : 'declined');
    updateConsent(accepted);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-neutral-50 border-t border-neutral-200 dark:bg-slate-800 dark:border-slate-700">
      <div className="container mx-auto px-5 py-4 flex flex-col md:flex-row items-center gap-4">
        <p className="text-sm text-center md:text-left flex-1">
          We use cookies to understand site traffic and improve your experience.
          You can accept or decline analytics cookies.
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => choose(false)}
            className="px-5 py-2 text-sm font-bold border border-black text-black hover:bg-black hover:text-white duration-200 transition-colors dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="px-5 py-2 text-sm font-bold bg-black text-white border border-black hover:bg-white hover:text-black duration-200 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConsentBanner;
