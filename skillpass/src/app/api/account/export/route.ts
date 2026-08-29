import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { exportAccountData } from '@/modules/auth/service';
import { apiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const data = await exportAccountData(user.id);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="skillpass-export-${user.id}.json"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
