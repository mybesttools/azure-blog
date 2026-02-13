'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MFASettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      // Fetch current MFA status
      fetch('/api/auth/mfa/status', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.mfaEnabled) {
            setMfaEnabled(true);
          }
        })
        .catch(err => console.error('Failed to fetch MFA status:', err));
    }
  }, [status, router]);

  const handleSetupMFA = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup MFA');
      }
      
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: verifyCode }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }
      
      setMfaEnabled(true);
      setMessage(data.message);
      setQrCode('');
      setSecret('');
      setVerifyCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!confirm('Are you sure you want to disable MFA?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable MFA');
      }
      
      setMfaEnabled(false);
      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Multi-Factor Authentication</h1>
      
      {message && (
        <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px' }}>
          {message}
        </div>
      )}
      
      {error && (
        <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      
      {!mfaEnabled && !qrCode && (
        <div>
          <p style={{ marginBottom: '1rem' }}>
            Enable two-factor authentication using Google Authenticator or any compatible TOTP app.
          </p>
          <button
            onClick={handleSetupMFA}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
            }}
          >
            {loading ? 'Setting up...' : 'Setup MFA'}
          </button>
        </div>
      )}
      
      {qrCode && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Scan QR Code</h2>
          <p style={{ marginBottom: '1rem' }}>
            Scan this QR code with Google Authenticator:
          </p>
          <img src={qrCode} alt="QR Code" style={{ marginBottom: '1rem' }} />
          <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
            Or manually enter this secret: <code style={{ backgroundColor: '#f5f5f5', padding: '0.25rem 0.5rem', borderRadius: '3px' }}>{secret}</code>
          </p>
          
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Verification Code
            </label>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            />
            <button
              onClick={handleVerifyMFA}
              disabled={loading || verifyCode.length !== 6}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (loading || verifyCode.length !== 6) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}
      
      {mfaEnabled && (
        <div>
          <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px' }}>
            ✓ MFA is currently enabled
          </div>
          <button
            onClick={handleDisableMFA}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
            }}
          >
            {loading ? 'Disabling...' : 'Disable MFA'}
          </button>
        </div>
      )}
    </div>
  );
}
