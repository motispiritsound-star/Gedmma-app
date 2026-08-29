import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Liveness and readiness in one place. Deliberately leaks nothing useful. */
export async function GET(): Promise<Response> {
  const checks: Record<string, "ok" | "error"> = { app: "ok", database: "ok" };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    checks.database = "error";
  }

  const healthy = Object.values(checks).every((value) => value === "ok");
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      paymentProvider: env().PAYMENT_PROVIDER,
      mediaDriver: env().MEDIA_DRIVER,
    },
    { status: healthy ? 200 : 503 },
  );
}
