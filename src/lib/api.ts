import { NextResponse } from "next/server";

export function bad(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}
// ponytail: cegah 304/cache pada GET — body kosong membuat r.json() klien melempar "Unexpected end of JSON input"
export function json(data: unknown) {
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}