import { NextResponse } from "next/server";
import { getSessionUser } from "@/modules/auth/session";
import { exportFamilyData } from "@/modules/privacy";

export const dynamic = "force-dynamic";

/** Full family export as a downloadable JSON file. */
export async function GET(): Promise<Response> {
  const user = await getSessionUser();
  if (!user?.familyId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const data = await exportFamilyData({ familyId: user.familyId, userId: user.id });
  const filename = `questly-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
