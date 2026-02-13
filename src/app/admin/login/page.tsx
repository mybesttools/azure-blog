'use client';

import { signIn } from 'next-auth/react';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [requireMfa, setRequireMfa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!requireMfa) {
        // First step: Check password and see if MFA is required
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        // Check for error FIRST (NextAuth bug: ok can be true even with errors)
        if (result?.error) {
          // Login failed - check if user has MFA enabled
          const mfaCheck = await fetch('/api/auth/mfa/check-required', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          if (mfaCheck.ok) {
            const data = await mfaCheck.json();
            if (data.mfaRequired) {
              // User has MFA enabled, show MFA code input
              setRequireMfa(true);
              setError('');
              return;
            }
          }

          // Regular login error (wrong password or no user)
          setError('Invalid email or password');
          return;
        }

        if (result?.ok && !result?.error) {
          // Only redirect if ok=true AND no error
          router.push('/admin');
        }
      } else {
        // Second step: Submit with MFA code
        const result = await signIn('credentials', {
          email,
          password,
          mfaCode,
          redirect: false,
        });

        // Check for error FIRST (NextAuth bug: ok can be true even with errors)
        if (result?.error) {
          setError('Invalid MFA code');
          setMfaCode(''); // Clear the code for retry
          return;
        }

        if (result?.ok && !result?.error) {
          router.push('/admin');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {requireMfa && (
            <div className="rounded-md bg-blue-50 p-4">
              <p className="text-sm text-blue-800">Enter the 6-digit code from your authenticator app</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            {!requireMfa ? (
              <>
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="mfaCode" className="sr-only">
                  Verification Code
                </label>
                <input
                  id="mfaCode"
                  name="mfaCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  autoFocus
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white text-center text-2xl tracking-widest"
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <button
                  type="button"
                  onClick={() => {
                    setRequireMfa(false);
                    setMfaCode('');
                    setError('');
                  }}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                >
                  ← Back to login
                </button>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (requireMfa ? 'Verifying...' : 'Signing in...') : (requireMfa ? 'Verify' : 'Sign in')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
