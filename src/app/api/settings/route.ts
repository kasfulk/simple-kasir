import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bad, json } from "@/lib/api";
import { parseSettings } from "@/lib/validation";
import { getSettings } from "@/lib/settings";
import { requireOwner } from "@/lib/auth";

export async function GET() {
  return json(await getSettings());
}

export async function PUT(request: NextRequest) {
  if (!(await requireOwner(request))) return bad("Akses khusus Owner", 403);
  const parsed = parseSettings(await request.json());
  if ("error" in parsed) return bad(parsed.error);
  const setting = await db.setting.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });
  return NextResponse.json(setting);
}