import Container from '@/app/_components/container';
import Header from '@/app/_components/header';
import { auth } from '@/auth';
import { connectDB } from '@/lib/mongodb';
import { isGhiffaOwner } from '@/lib/ghiffaOwner';
import Booking from '@/models/Booking';
import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { redirect } from 'next/navigation';
import { GhiffaContent } from './GhiffaContent';
import type { MyRequest } from './MyRequests';
import type { PendingRequest } from './PendingRequests';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
// Shown first in the gallery; everything else follows in alphabetical order.
const FEATURED_IMAGE = 'ewa_veranda.jpeg';

function getGalleryImages(): string[] {
  try {
    const dir = path.join(process.cwd(), 'public', 'ghiffa', 'gallery');
    return fs
      .readdirSync(dir)
      .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .sort((a, b) => {
        if (a === FEATURED_IMAGE) return -1;
        if (b === FEATURED_IMAGE) return 1;
        return a.localeCompare(b);
      })
      .map((f) => `/ghiffa/gallery/${f}`);
  } catch {
    return [];
  }
}

const ADDRESS = 'Via Cerutti 8, Ghiffa (VB), Italy';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Ghiffa Apartment | My Best Tools',
    description: `Request a stay at ${ADDRESS}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export type UpcomingStay = {
  id: string;
  firstName: string;
  from: string;
  to: string;
  status: 'pending' | 'confirmed';
};

async function getUpcomingStays(): Promise<UpcomingStay[]> {
  try {
    await connectDB();
    const bookings = await Booking.find({ status: { $in: ['confirmed', 'pending'] } })
      .sort({ from: 1 })
      .lean();

    return bookings.map((booking: any) => ({
      id: booking._id.toString(),
      firstName: (booking.name || '').trim().split(/\s+/)[0] || 'Guest',
      from: booking.from.toISOString(),
      to: booking.to.toISOString(),
      status: booking.status,
    }));
  } catch (error) {
    console.error('Error fetching upcoming stays:', error);
    return [];
  }
}

async function getPendingRequests(): Promise<PendingRequest[]> {
  try {
    await connectDB();
    const bookings = await Booking.find({ status: 'pending' }).sort({ from: 1 }).lean();

    return bookings.map((booking: any) => ({
      id: booking._id.toString(),
      name: booking.name,
      email: booking.email,
      from: booking.from.toISOString(),
      to: booking.to.toISOString(),
      notes: booking.notes,
    }));
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return [];
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getMyRequests(email: string): Promise<MyRequest[]> {
  try {
    await connectDB();
    const bookings = await Booking.find({ email: new RegExp(`^${escapeRegExp(email)}$`, 'i') })
      .sort({ from: 1 })
      .lean();

    return bookings.map((booking: any) => ({
      id: booking._id.toString(),
      from: booking.from.toISOString(),
      to: booking.to.toISOString(),
      notes: booking.notes,
      status: booking.status,
    }));
  } catch (error) {
    console.error('Error fetching your requests:', error);
    return [];
  }
}

export default async function GhiffaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login?callbackUrl=/ghiffa');
  }

  const isOwner = isGhiffaOwner(session.user.email);
  const galleryImages = getGalleryImages();

  const [stays, pendingRequests, myRequests] = await Promise.all([
    getUpcomingStays(),
    isOwner ? getPendingRequests() : Promise.resolve([]),
    session.user.email ? getMyRequests(session.user.email) : Promise.resolve([]),
  ]);

  return (
    <main>
      <Container>
        <Header />
        <GhiffaContent
          address={ADDRESS}
          stays={stays}
          pendingRequests={pendingRequests}
          myRequests={myRequests}
          isOwner={isOwner}
          defaultName={session.user.name ?? ''}
          defaultEmail={session.user.email ?? ''}
          galleryImages={galleryImages}
        />
      </Container>
    </main>
  );
}
