import { sendMail } from '@/lib/mail';
import { auth } from '@/auth';
import { isGhiffaOwner } from '@/lib/ghiffaOwner';
import { format } from 'date-fns';

export const ADDRESS = 'Via Cerutti 8, Ghiffa (VB), Italy';

export function formatRange(from: Date, to: Date) {
  return `${format(from, 'd MMM yyyy')} - ${format(to, 'd MMM yyyy')}`;
}

// A stay can't start before today, and must end after it starts. Returns an
// error message if the range is invalid, or null if it's fine.
export function validateStayRange(from: Date | null, to: Date | null): string | null {
  if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) {
    return 'from and to are required';
  }
  if (to <= from) {
    return 'to must be after from';
  }
  const todayStart = new Date(new Date().toISOString().slice(0, 10));
  if (from < todayStart) {
    return 'from must not be in the past';
  }
  return null;
}

// Requester-facing confirm/decline emails, in the language the request was
// originally submitted in (Booking.lang) - not the owner's own language.
export const CONFIRM_EMAIL = {
  en: (name: string, address: string, range: string) => ({
    subject: 'Your stay at Ghiffa is confirmed',
    text: [`Hi ${name},`, '', `Your stay at ${address} has been confirmed for:`, range, '', 'See you there!'].join('\n'),
  }),
  pl: (name: string, address: string, range: string) => ({
    subject: 'Twój pobyt w Ghiffie jest potwierdzony',
    text: [
      `Cześć ${name},`,
      '',
      `Twój pobyt pod adresem ${address} został potwierdzony na:`,
      range,
      '',
      'Do zobaczenia!',
    ].join('\n'),
  }),
  de: (name: string, address: string, range: string) => ({
    subject: 'Dein Aufenthalt in Ghiffa ist bestätigt',
    text: [
      `Hallo ${name},`,
      '',
      `Dein Aufenthalt in ${address} wurde bestätigt für:`,
      range,
      '',
      'Bis dann!',
    ].join('\n'),
  }),
} as const;

export const DECLINE_EMAIL = {
  en: (name: string, address: string, range: string) => ({
    subject: 'Your stay request for Ghiffa',
    text: [
      `Hi ${name},`,
      '',
      `Unfortunately your requested stay at ${address} (${range}) could not be confirmed.`,
      'Please get in touch to find another date.',
    ].join('\n'),
  }),
  pl: (name: string, address: string, range: string) => ({
    subject: 'Twoja prośba o pobyt w Ghiffie',
    text: [
      `Cześć ${name},`,
      '',
      `Niestety Twój wniosek o pobyt pod adresem ${address} (${range}) nie mógł zostać potwierdzony.`,
      'Skontaktuj się, aby ustalić inny termin.',
    ].join('\n'),
  }),
  de: (name: string, address: string, range: string) => ({
    subject: 'Deine Aufenthaltsanfrage für Ghiffa',
    text: [
      `Hallo ${name},`,
      '',
      `Leider konnte dein Aufenthalt in ${address} (${range}) nicht bestätigt werden.`,
      'Bitte melde dich, um einen anderen Termin zu finden.',
    ].join('\n'),
  }),
} as const;

// Being signed in is not enough: anyone with an account in the tenant (family
// members included) can get a session, but only an apartment owner may see
// requester details or approve/decline stays. A requestor may still edit
// their own booking.
export async function getAuthContext() {
  const session = await auth();
  const callerEmail = session?.user?.email?.toLowerCase();
  return {
    callerEmail,
    isOwner: isGhiffaOwner(callerEmail),
  };
}

export async function notifyOwnerOfRequest(booking: {
  _id: unknown;
  name: string;
  email: string;
  from: Date;
  to: Date;
  notes?: string;
}) {
  // Where the notification is delivered can be a distribution address (e.g. a
  // family group) that nobody signs in as - kept separate from OWNER_EMAIL,
  // which is the single account authorized to approve/decline requests.
  const notifyEmail = process.env.NOTIFY_EMAIL || process.env.OWNER_EMAIL;
  if (!notifyEmail) {
    console.warn('[bookings] NOTIFY_EMAIL/OWNER_EMAIL is not configured; owner was not notified of a request.');
    return;
  }

  await sendMail({
    to: notifyEmail,
    subject: `New stay request for Ghiffa: ${booking.name}`,
    text: [
      `${booking.name} (${booking.email}) has requested to stay at ${ADDRESS}.`,
      '',
      `Dates: ${formatRange(booking.from, booking.to)}`,
      booking.notes ? `Notes: ${booking.notes}` : undefined,
      '',
      'Review and approve or decline this request:',
      `${process.env.NEXT_PUBLIC_SITE_URL || ''}/ghiffa`,
    ]
      .filter(Boolean)
      .join('\n'),
  });
}

export async function sendApprovalDecisionEmail(booking: {
  name: string;
  email: string;
  from: Date;
  to: Date;
  status: string;
  lang?: string;
}) {
  const lang: 'pl' | 'en' | 'de' = booking.lang === 'en' || booking.lang === 'de' ? booking.lang : 'pl';
  const range = formatRange(booking.from, booking.to);

  if (booking.status === 'confirmed') {
    const { subject, text } = CONFIRM_EMAIL[lang](booking.name, ADDRESS, range);
    await sendMail({ to: booking.email, subject, text });
  } else {
    const { subject, text } = DECLINE_EMAIL[lang](booking.name, ADDRESS, range);
    await sendMail({ to: booking.email, subject, text });
  }
}
