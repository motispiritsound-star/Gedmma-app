import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

/** Liveness and database readiness, for a load balancer or uptime check. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', database: 'up' })
  } catch (error) {
    logger.error('health.database_unreachable', { error })
    return NextResponse.json({ status: 'degraded', database: 'down' }, { status: 503 })
  }
}
