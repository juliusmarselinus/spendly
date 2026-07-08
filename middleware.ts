import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "spendly_auth";
const PUBLIC_PATHS = ["/login", "/api/verify-pin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Izinkan akses ke halaman login & api verifikasi tanpa dicek
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Izinkan static assets (icon, manifest, dll)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/asset") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js"
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(COOKIE_NAME);

  if (authCookie?.value !== "verified") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};