// OWNER_EMAIL may list more than one account (comma-separated) - anyone
// signed in with one of these addresses can approve/decline stay requests.
export function isGhiffaOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  const owners = (process.env.OWNER_EMAIL || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return owners.includes(email.toLowerCase());
}
