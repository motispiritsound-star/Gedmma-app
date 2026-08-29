import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, clearSessionCookie } from '@/lib/auth/session';
import { deleteAccount } from '@/modules/auth/service';
import { apiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

const schema = z.object({
  /** Typed confirmation guards against an accidental or forged one-click call. */
  confirm: z.literal('DELETE'),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    schema.parse(await request.json());
    await deleteAccount(user.id);
    await clearSessionCookie();
    return NextResponse.json({ status: 'deleted' });
  } catch (error) {
    return apiError(error);
  }
}
