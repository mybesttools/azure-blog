'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { LanguageProvider, useLang } from '@/app/ghiffa/LanguageContext';
import { LanguageSelector } from '@/app/ghiffa/LanguageSelector';
import { RESET_DICTIONARIES } from '../i18n';

export default function ResetPasswordConfirmPage() {
  return (
    <LanguageProvider>
      <Suspense fallback={null}>
        <ResetPasswordConfirmForm />
      </Suspense>
    </LanguageProvider>
  );
}

function ResetPasswordConfirmForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const linkLang = searchParams.get('lang');
  const { lang, setLang } = useLang();
  const t = RESET_DICTIONARIES[lang];
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // The emailed link carries the language the reset was requested in, since
  // it may be opened on a device that never stored a language choice.
  useEffect(() => {
    if (linkLang === 'pl' || linkLang === 'en' || linkLang === 'de') {
      setLang(linkLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkLang]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorCode('');

    if (password !== confirmPassword) {
      setErrorCode('password_mismatch');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorCode(data.code || 'generic');
        return;
      }

      setDone(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setErrorCode('generic');
    } finally {
      setLoading(false);
    }
  };

  const error = errorCode ? t.errors[errorCode as keyof typeof t.errors] ?? t.genericError : '';

  const inputClass =
    'appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="flex justify-end">
          <LanguageSelector />
        </div>
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">{t.confirmTitle}</h2>
        </div>
        {!token ? (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {t.incompleteLink}{' '}
              <Link href="/reset-password" className="underline">{t.requestNewOne}</Link>.
            </p>
          </div>
        ) : done ? (
          <div className="space-y-6">
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{t.passwordChanged}</p>
            </div>
            <Link
              href="/admin/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {t.signIn}
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  {error}{' '}
                  {errorCode === 'invalid_token' && (
                    <Link href="/reset-password" className="underline">{t.requestNewLink}</Link>
                  )}
                </p>
              </div>
            )}
            <div>
              <label htmlFor="password" className="sr-only">
                {t.newPasswordPlaceholder}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                autoFocus
                className={inputClass}
                placeholder={t.newPasswordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                {t.confirmPasswordPlaceholder}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className={inputClass}
                placeholder={t.confirmPasswordPlaceholder}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.saving : t.setPassword}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
