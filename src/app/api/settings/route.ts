import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { parseSettings } from "@/lib/validation";
import { getSettings } from "@/lib/settings";
import { getSessionFromRequest, requireOwner } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  if (!user) return bad("Silakan login", 401);
  return json(await getSettings(user.tenantId));
}

export async function PUT(request: NextRequest) {
  const me = await requireOwner(request);
  if (!me) return bad("Akses khusus Owner", 403);
  const parsed = parseSettings(await request.json());
  if ("error" in parsed) return bad(parsed.error);
  const setting = await db.setting.upsert({
    where: { tenantId: me.tenantId },
    update: parsed.data,
    create: { tenantId: me.tenantId, ...parsed.data },
  });
  return NextResponse.json(setting);
}
