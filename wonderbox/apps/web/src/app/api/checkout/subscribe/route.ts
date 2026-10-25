import { NextResponse, type NextRequest } from 'next/server';
import { env } from '../../../../lib/env.ts';
import { currentActor } from '../../../../lib/auth/session.ts';
import { can } from '../../../../lib/auth/roles.ts';
import { createSubscription } from '../../../../server/subscriptions.ts';
import { DomainError } from '../../../../lib/errors.ts';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actor = await currentActor();
  const form = await request.formData();
  const planCode = String(form.get('planCode') ?? '');

  if (!actor?.familyId || !can(actor.roles, 'subscription.manage')) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent('/boxes')}`, env.APP_URL),
      { status: 303 },
    );
  }

  try {
    await createSubscription({ familyId: actor.familyId, planCode, actorUserId: actor.id });
    return NextResponse.redirect(new URL('/account/subscription?started=1', env.APP_URL), {
      status: 303,
    });
  } catch (error) {
    const code = error instanceof DomainError ? error.code : 'unexpected';
    return NextResponse.redirect(new URL(`/account/subscription?error=${code}`, env.APP_URL), {
      status: 303,
    });
  }
}
