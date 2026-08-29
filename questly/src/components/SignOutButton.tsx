'use client'

import { useTransition } from 'react'
import { signOutAction } from '@/app/(auth)/auth-actions'
import { Button } from '@/components/ui/Button'

export function SignOutButton({ label }: { label: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
    >
      {label}
    </Button>
  )
}
