import { auth } from '@/auth';

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }
  return session;
}
