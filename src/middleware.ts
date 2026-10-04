import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

const OWNER_PAGES = ["/produk", "/kategori", "/pengaturan", "/pengguna", "/dashboard", "/pelanggan", "/stok-masuk"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = await getSessionFromRequest(req);

  if (pathname === "/login") {
    if (user) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Silakan login" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    user.role !== "OWNER" &&
    OWNER_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth/|_next|favicon.ico|.*\\.).*)"],
};