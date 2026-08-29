import { redirect } from 'next/navigation';
import { api } from './api';
import type { AgeBand } from '@focusfamily/domain';

export interface Me {
  user: {
    id: string;
    displayName: string;
    locale: 'nl' | 'en';
    platformRole: 'member' | 'support_admin';
  };
  membership: {
    id: string;
    role: 'guardian' | 'child';
    familyId: string;
    familyName: string;
    ageBand: AgeBand;
  } | null;
  permissions: { allowed: string[]; neverOffered: string[] };
}

export async function requireMe(): Promise<Me> {
  const result = await api.get<Me>('/auth/me');
  if (!result.ok || !result.data) redirect('/signin');
  return result.data;
}

export async function requireFamilyMe(): Promise<Me & { membership: NonNullable<Me['membership']> }> {
  const me = await requireMe();
  if (!me.membership) redirect('/app/onboarding');
  return me as Me & { membership: NonNullable<Me['membership']> };
}

export function may(me: Me, permission: string): boolean {
  return me.permissions.allowed.includes(permission);
}
