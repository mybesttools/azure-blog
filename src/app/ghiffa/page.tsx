import Container from '@/app/_components/container';
import Header from '@/app/_components/header';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import { RequestForm } from './RequestForm';
import { YearCalendar } from './YearCalendar';

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

function formatRange(from: string, to: string) {
  return `${format(new Date(from), 'd MMM yyyy')} – ${format(new Date(to), 'd MMM yyyy')}`;
}

export default async function GhiffaPage() {
  const stays = await getUpcomingStays();

  return (
    <main>
      <Container>
        <Header />
        <section className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-4">
            Ghiffa Apartment
          </h1>
          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 max-w-2xl">
            Our family apartment at {ADDRESS}. See who&apos;s planning to stay below, or
            request your own dates.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-6">
            Availability calendar
          </h2>
          <YearCalendar stays={stays} />
        </section>

        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-6">
            Upcoming stays
          </h2>
          {stays.length > 0 ? (
            <ul className="space-y-3 max-w-2xl">
              {stays.map((stay) => (
                <li
                  key={stay.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-gray-200 dark:border-gray-700 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{stay.firstName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatRange(stay.from, stay.to)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      stay.status === 'confirmed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}
                  >
                    {stay.status === 'confirmed' ? 'Confirmed' : 'Pending approval'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No upcoming stays yet. Be the first to request one below!
            </p>
          )}
        </section>

        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-6">
            Request a stay
          </h2>
          <RequestForm />
        </section>
      </Container>
    </main>
  );
}
