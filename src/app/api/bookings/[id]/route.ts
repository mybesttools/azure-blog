import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import {
  getAuthContext,
  notifyOwnerOfRequest,
  sendApprovalDecisionEmail,
  validateStayRange,
} from '@/lib/ghiffaBookingNotifications';

// react-admin's data provider (ra-data-simple-rest) addresses a single
// resource by path - /api/bookings/{id} - rather than the ?id= query style
// used elsewhere in this route group, so it needs its own handlers here.

// GET a single booking (owner only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAuthContext()).isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ ...booking.toObject(), id: booking._id.toString() });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

// PUT - Update a booking (owner only), or a requestor editing their own
// booking's dates/notes (which always resets it to pending - any change
// needs the owner's approval again).
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { callerEmail, isOwner } = await getAuthContext();
    if (!callerEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

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
      const { id: _id, ...rest } = body;
      update = rest;
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

    return NextResponse.json({ ...booking.toObject(), id: booking._id.toString() });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

// DELETE - Delete a booking (owner only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAuthContext()).isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ ...booking.toObject(), id: booking._id.toString() });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
