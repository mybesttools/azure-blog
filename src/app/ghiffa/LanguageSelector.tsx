'use client';

import { LANGUAGES } from './i18n';
import { useLang } from './LanguageContext';

export function LanguageSelector() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex gap-1">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-md px-2.5 py-1 text-sm font-medium border ${
            lang === code
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
