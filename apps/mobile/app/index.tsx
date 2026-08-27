import React from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '@/store/session';

/**
 * The one place that decides where a launch lands: the professional tabs for a
 * pro with a profile, the customer tabs for everyone signed in, and the
 * welcome screen otherwise.
 */
export default function Index() {
  const hydrated = useSession((state) => state.hydrated);
  const accessToken = useSession((state) => state.accessToken);
  const user = useSession((state) => state.user);

  if (!hydrated) return null;
  if (!accessToken) return <Redirect href="/(auth)/welcome" />;
  if (user?.role === 'PRO' && user.hasProProfile) return <Redirect href="/(pro)/leads" />;
  if (user?.role === 'PRO') return <Redirect href="/pro-onboarding" />;
  return <Redirect href="/(customer)" />;
}
