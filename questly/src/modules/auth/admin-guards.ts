import { redirect } from 'next/navigation'
import { getAuthContext } from './session'
import type { AuthContext } from './session'

/**
 * Page guard for platform administration. Content administrators are sent back
 * to the part of the admin area they do have access to, rather than seeing a
 * bare 403.
 */
export async function requirePlatformAdminPage(): Promise<AuthContext> {
  const context = await getAuthContext()
  if (!context) redirect('/sign-in?next=%2Fadmin')
  if (context.user.role !== 'PLATFORM_ADMIN') redirect('/admin')
  return context
}
