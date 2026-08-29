import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      adapters: {
        payments: env().PAYMENT_PROVIDER,
        email: env().EMAIL_PROVIDER,
        storage: env().STORAGE_PROVIDER,
        geo: env().GEO_PROVIDER,
      },
    });
  } catch {
    return NextResponse.json({ status: 'degraded', database: 'unreachable' }, { status: 503 });
  }
}
