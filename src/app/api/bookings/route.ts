import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { sendMail } from '@/lib/mail';
import { auth } from '@/auth';
import { format } from 'date-fns';

const ADDRESS = 'Via Cerutti 8, Ghiffa (VB), Italy';

function formatRange(from: Date, to: Date) {
  return `${format(from, 'd MMM yyyy')} - ${format(to, 'd MMM yyyy')}`;
}

// GET all bookings or a single booking (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
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

    if (!name || !email || !from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json({ error: 'name, email, from and to are required' }, { status: 400 });
    }

    if (to <= from) {
      return NextResponse.json({ error: 'to must be after from' }, { status: 400 });
    }

    // Status is always set server-side; requests always start out pending approval.
    const booking = await Booking.create({ name, email, from, to, notes, status: 'pending' });

    const ownerEmail = process.env.OWNER_EMAIL;
    if (ownerEmail) {
      await sendMail({
        to: ownerEmail,
        subject: `New stay request for Ghiffa: ${name}`,
        text: [
          `${name} (${email}) has requested to stay at ${ADDRESS}.`,
          '',
          `Dates: ${formatRange(from, to)}`,
          notes ? `Notes: ${notes}` : undefined,
          '',
          'Review and approve or decline this request in the admin dashboard:',
          `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin#/bookings/${booking._id}`,
        ]
          .filter(Boolean)
          .join('\n'),
      });
    } else {
      console.warn('[bookings] OWNER_EMAIL is not configured; owner was not notified of a new request.');
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

// PUT - Update a booking, e.g. approve/decline (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
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

    const previousStatus = existing.status;
    const body = await request.json();

    const booking = await Booking.findByIdAndUpdate(id, body, { new: true });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Notify the requestor only when the owner's approval decision actually changes.
    if (booking.status !== previousStatus && (booking.status === 'confirmed' || booking.status === 'declined')) {
      if (booking.status === 'confirmed') {
        await sendMail({
          to: booking.email,
          subject: `Your stay at Ghiffa is confirmed`,
          text: [
            `Hi ${booking.name},`,
            '',
            `Your stay at ${ADDRESS} has been confirmed for:`,
            formatRange(booking.from, booking.to),
            '',
            'See you there!',
          ].join('\n'),
        });
      } else {
        await sendMail({
          to: booking.email,
          subject: `Your stay request for Ghiffa`,
          text: [
            `Hi ${booking.name},`,
            '',
            `Unfortunately your requested stay at ${ADDRESS} (${formatRange(booking.from, booking.to)}) could not be confirmed.`,
            'Please get in touch to find another date.',
          ].join('\n'),
        });
      }
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

// DELETE - Delete a booking (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
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
