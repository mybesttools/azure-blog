'use client';

import { SessionProvider } from 'next-auth/react';
import AdminApp from '@/components/AdminApp';

export default function AdminPage() {
  return (
    <SessionProvider>
      <AdminApp />
    </SessionProvider>
  );
}
