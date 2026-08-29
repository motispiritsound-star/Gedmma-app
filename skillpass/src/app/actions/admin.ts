'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { requireAdmin } from '@/lib/auth/rbac';
import { AppError } from '@/lib/errors';
import { approveProvider, decideVerification, rejectProvider, suspendProvider } from '@/modules/catalog/providers';
import { escalateToSafeguarding, resolveIncident, updateSafeguardingCase } from '@/modules/safeguarding/service';
import { adjustCredits, refundPayment } from '@/modules/billing/subscriptions';
import type { ActionState } from './guardian';

function fail(error: unknown): ActionState {
  if (error instanceof AppError) return { error: error.message };
  console.error('[admin action] unexpected failure', error);
  return { error: 'Something went wrong. Please try again.' };
}

export async function decideVerificationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    requireAdmin(user);
    await decideVerification(
      user,
      String(formData.get('verificationId')),
      String(formData.get('decision')) as 'APPROVED' | 'REJECTED' | 'MORE_INFO_REQUIRED',
      String(formData.get('note') ?? ''),
    );
    revalidatePath('/[locale]/admin/providers', 'page');
    return { success: 'decided' };
  } catch (error) {
    return fail(error);
  }
}

export async function providerDecisionAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    requireAdmin(user);
    const providerId = String(formData.get('providerId'));
    const intent = String(formData.get('intent'));
    if (intent === 'approve') await approveProvider(user, providerId, String(formData.get('note') ?? ''));
    else if (intent === 'reject') await rejectProvider(user, providerId, String(formData.get('note') ?? 'not specified'));
    else if (intent === 'suspend') await suspendProvider(user, providerId, String(formData.get('note') ?? 'not specified'));
    revalidatePath('/[locale]/admin/providers', 'page');
    return { success: intent };
  } catch (error) {
    return fail(error);
  }
}

export async function incidentAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    requireAdmin(user);
    const intent = String(formData.get('intent'));
    if (intent === 'escalate') {
      await escalateToSafeguarding(String(formData.get('incidentId')), String(formData.get('note') ?? ''), user);
    } else if (intent === 'resolve') {
      await resolveIncident(user, String(formData.get('incidentId')), String(formData.get('note') ?? 'resolved'));
    } else if (intent === 'case') {
      await updateSafeguardingCase(user, String(formData.get('caseId')), {
        status: String(formData.get('status')) as 'OPEN' | 'INVESTIGATING' | 'REFERRED_TO_AUTHORITY' | 'CLOSED',
        caseNotes: String(formData.get('note') ?? ''),
      });
    }
    revalidatePath('/[locale]/admin/incidents', 'page');
    return { success: intent };
  } catch (error) {
    return fail(error);
  }
}

export async function refundAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    requireAdmin(user);
    await refundPayment(
      user,
      String(formData.get('paymentId')),
      Number(formData.get('amountCents')),
      String(formData.get('reason') ?? 'goodwill'),
    );
    revalidatePath('/[locale]/admin', 'page');
    return { success: 'refunded' };
  } catch (error) {
    return fail(error);
  }
}

export async function adjustCreditsAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    requireAdmin(user);
    await adjustCredits(
      user,
      String(formData.get('familyId')),
      Number(formData.get('delta')),
      String(formData.get('reason') ?? 'goodwill'),
    );
    revalidatePath('/[locale]/admin', 'page');
    return { success: 'adjusted' };
  } catch (error) {
    return fail(error);
  }
}
