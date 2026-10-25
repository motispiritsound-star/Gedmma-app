import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { env } from '../../../../lib/env.ts';
import { prisma } from '../../../../lib/db.ts';
import { currentActor } from '../../../../lib/auth/session.ts';
import { can } from '../../../../lib/auth/roles.ts';
import { placeOrder } from '../../../../server/orders.ts';
import { DomainError } from '../../../../lib/errors.ts';

/**
 * One-off box purchase. A parent without an address is sent to add one first,
 * because an order without somewhere to send it is not an order.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const actor = await currentActor();
  const form = await request.formData();
  const boxProductId = String(form.get('boxProductId') ?? '');

  if (!actor || !actor.familyId || !can(actor.roles, 'order.write')) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent('/boxes')}`, env.APP_URL),
      { status: 303 },
    );
  }

  const address = await prisma.address.findFirst({
    where: { familyId: actor.familyId },
    orderBy: [{ isDefaultShipping: 'desc' }, { createdAt: 'asc' }],
  });
  if (!address) {
    return NextResponse.redirect(new URL('/account/addresses?needed=1', env.APP_URL), {
      status: 303,
    });
  }

  try {
    const placed = await placeOrder({
      familyId: actor.familyId,
      lines: [{ boxProductId, quantity: 1 }],
      shippingAddressId: address.id,
      // A fresh key per submission: this is a deliberate new purchase, and the
      // duplicate-click guard lives in the checkout page's own hidden field.
      idempotencyKey: `box:${actor.familyId}:${boxProductId}:${randomUUID()}`,
      actorUserId: actor.id,
    });
    return NextResponse.redirect(new URL(placed.checkoutUrl, env.APP_URL), { status: 303 });
  } catch (error) {
    const code = error instanceof DomainError ? error.code : 'unexpected';
    return NextResponse.redirect(new URL(`/boxes?error=${code}`, env.APP_URL), { status: 303 });
  }
}
