import { NextResponse } from 'next/server'
import { requireFamily } from '@/modules/auth/guards'
import { exportFamilyData } from '@/modules/privacy/service'
import { isAppError } from '@/lib/errors'
import { logger } from '@/lib/logger'

/** Downloads everything the platform holds about the caller's family. */
export async function GET() {
  try {
    const context = await requireFamily()
    const data = await exportFamilyData({
      familyId: context.family.id,
      userId: context.user.id,
    })
    const filename = `questly-export-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ error: error.code }, { status: error.status })
    }
    logger.error('export.failed', { error })
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
