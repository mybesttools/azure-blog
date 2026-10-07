'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { LanguageProvider, useLang } from '@/app/ghiffa/LanguageContext';
import { LanguageSelector } from '@/app/ghiffa/LanguageSelector';
import { RESET_DICTIONARIES } from './i18n';

export default function ResetPasswordRequestPage() {
  return (
    <LanguageProvider>
      <ResetPasswordRequestForm />
    </LanguageProvider>
  );
}

function ResetPasswordRequestForm() {
  const { lang } = useLang();
  const t = RESET_DICTIONARIES[lang];
  const [username, setUsername] = useState('');
  const [sent, setSent] = useState(false);
  const [errorCode, setErrorCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorCode('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, lang }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorCode(data.code || 'generic');
        return;
      }

      setSent(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      setErrorCode('generic');
    } finally {
      setLoading(false);
    }
  };

  const error = errorCode ? t.errors[errorCode as keyof typeof t.errors] ?? t.genericError : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="flex justify-end">
          <LanguageSelector />
        </div>
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">{t.requestTitle}</h2>
          <p className="mt-2 text-center text-sm text-gray-600">{t.requestIntro}</p>
        </div>
        {sent ? (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{t.requestSent}</p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="username" className="sr-only">
                {t.usernamePlaceholder}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                autoFocus
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white"
                placeholder={t.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.sending : t.sendLink}
              </button>
            </div>
          </form>
        )}
        <p className="text-center text-sm">
          <Link href="/admin/login" className="text-indigo-600 hover:text-indigo-500">
            {t.backToSignIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
