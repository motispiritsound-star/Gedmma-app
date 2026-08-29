import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { requireFamily } from '@/lib/auth/rbac';
import { bookSession, bookingSchema, listFamilyBookings } from '@/modules/booking/service';
import { consumeRateLimit } from '@/lib/rate-limit';
import { apiError, clientIp } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const familyId = await requireFamily(user);
    const bookings = await listFamilyBookings(familyId);
    return NextResponse.json({
      bookings: bookings.map((booking) => ({
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        creditsCharged: booking.creditsCharged,
        childNickname: booking.childProfile.nickname,
        startsAt: booking.session.startsAt,
        attendance: booking.attendance?.status ?? null,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    consumeRateLimit('booking', clientIp(request));
    const user = await requireUser();
    const familyId = await requireFamily(user);
    const body = bookingSchema.parse(await request.json());
    const result = await bookSession(user, familyId, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
