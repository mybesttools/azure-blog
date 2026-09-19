import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { auth } from '@/auth';
import { isGhiffaOwner } from '@/lib/ghiffaOwner';
import {
  getAuthContext,
  notifyOwnerOfRequest,
  sendApprovalDecisionEmail,
  validateStayRange,
} from '@/lib/ghiffaBookingNotifications';

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

    if (!name || !email) {
      return NextResponse.json({ error: 'name, email, from and to are required' }, { status: 400 });
    }

    const rangeError = validateStayRange(from, to);
    if (rangeError) {
      return NextResponse.json({ error: rangeError }, { status: 400 });
    }

    // Status is always set server-side. An owner booking their own stay
    // needs no approval - it's confirmed immediately; anyone else's request
    // starts out pending.
    const session = await auth();
    const isOwnerBooking = isGhiffaOwner(session?.user?.email);
    const status = isOwnerBooking ? 'confirmed' : 'pending';

    const booking = await Booking.create({ name, email, from, to, notes, lang, status });

    if (!isOwnerBooking) {
      await notifyOwnerOfRequest(booking);
    }

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

      const rangeError = validateStayRange(from, to);
      if (rangeError) {
        return NextResponse.json({ error: rangeError }, { status: 400 });
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
        await sendApprovalDecisionEmail(booking);
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
