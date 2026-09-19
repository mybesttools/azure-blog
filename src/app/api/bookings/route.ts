import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { sendMail } from '@/lib/mail';
import { auth } from '@/auth';
import { isGhiffaOwner } from '@/lib/ghiffaOwner';
import { format } from 'date-fns';

const ADDRESS = 'Via Cerutti 8, Ghiffa (VB), Italy';

function formatRange(from: Date, to: Date) {
  return `${format(from, 'd MMM yyyy')} - ${format(to, 'd MMM yyyy')}`;
}

// Requester-facing confirm/decline emails, in the language the request was
// originally submitted in (Booking.lang) - not the owner's own language.
const CONFIRM_EMAIL = {
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

const DECLINE_EMAIL = {
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
// their own booking - see the isRequestOwner branch in PUT below.
async function getAuthContext() {
  const session = await auth();
  const callerEmail = session?.user?.email?.toLowerCase();
  return {
    callerEmail,
    isOwner: isGhiffaOwner(callerEmail),
  };
}

async function notifyOwnerOfRequest(booking: {
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

// GET all bookings or a single booking (owner only)
export async function GET(request: NextRequest) {
  try {
    if (!(await getAuthContext()).isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const booking = await Booking.findById(id);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      return NextResponse.json(booking);
    }

    const bookings = await Booking.find().sort({ from: 1 }).lean();

    // Support React Admin pagination
    const start = parseInt(searchParams.get('_start') || '0');
    const end = parseInt(searchParams.get('_end') || String(bookings.length));
    const sort = searchParams.get('_sort') || 'from';
    const order = searchParams.get('_order') || 'ASC';

    let result = [...bookings];

    if (sort) {
      result.sort((a: any, b: any) => {
        if (order === 'DESC') {
          return b[sort] > a[sort] ? 1 : -1;
        }
        return a[sort] > b[sort] ? 1 : -1;
      });
    }

    const total = result.length;
    result = result.slice(start, end);

    const transformedResult = result.map((booking: any) => ({
      ...booking,
      id: booking._id.toString(),
    }));

    return NextResponse.json(transformedResult, {
      headers: {
        'Content-Range': `bookings ${start}-${Math.min(end, total)}/${total}`,
        'Access-Control-Expose-Headers': 'Content-Range',
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST - Create a new booking request (public - anyone can request a stay)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const notes = typeof body.notes === 'string' ? body.notes.trim() : undefined;
    const from = body.from ? new Date(body.from) : null;
    const to = body.to ? new Date(body.to) : null;
    const lang = body.lang === 'pl' || body.lang === 'en' || body.lang === 'de' ? body.lang : 'pl';

    if (!name || !email || !from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json({ error: 'name, email, from and to are required' }, { status: 400 });
    }

    if (to <= from) {
      return NextResponse.json({ error: 'to must be after from' }, { status: 400 });
    }

    // Status is always set server-side; requests always start out pending approval.
    const booking = await Booking.create({ name, email, from, to, notes, lang, status: 'pending' });

    await notifyOwnerOfRequest(booking);

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

// PUT - Update a booking (owner only), or a requestor editing their own
// booking's dates/notes (which always resets it to pending - any change
// needs the owner's approval again).
export async function PUT(request: NextRequest) {
  try {
    const { callerEmail, isOwner } = await getAuthContext();
    if (!callerEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const existing = await Booking.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isRequestOwner = callerEmail === existing.email.toLowerCase();
    if (!isOwner && !isRequestOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const previousStatus = existing.status;
    const body = await request.json();

    let update: Record<string, unknown>;

    if (isOwner) {
      // Full control: approve/decline, edit any field.
      update = body;
    } else {
      // The requestor may only change their own dates/notes, never the
      // status directly - any edit sends it back through approval.
      const from = body.from ? new Date(body.from) : null;
      const to = body.to ? new Date(body.to) : null;

      if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) {
        return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
      }
      if (to <= from) {
        return NextResponse.json({ error: 'to must be after from' }, { status: 400 });
      }

      const notes = typeof body.notes === 'string' ? body.notes.trim() : undefined;
      update = { from, to, notes, status: 'pending' };
    }

    const booking = await Booking.findByIdAndUpdate(id, update, { new: true });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (isOwner) {
      // Notify the requestor only when the owner's approval decision actually changes.
      if (booking.status !== previousStatus && (booking.status === 'confirmed' || booking.status === 'declined')) {
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
    } else {
      // The requestor changed their own booking - it needs the owner's attention again.
      await notifyOwnerOfRequest(booking);
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

// DELETE - Delete a booking (owner only)
export async function DELETE(request: NextRequest) {
  try {
    if (!(await getAuthContext()).isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
