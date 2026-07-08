import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "spendly_auth";
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 menit

// Simpel in-memory rate limit (reset kalau server restart, cukup untuk personal use)
const attempts = new Map<string, { count: number; blockedUntil: number }>();

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const record = attempts.get(ip) || { count: 0, blockedUntil: 0 };

  if (record.blockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((record.blockedUntil - Date.now()) / 60000);
    return NextResponse.json(
      { message: `Terlalu banyak percobaan. Coba lagi dalam ${minutesLeft} menit.` },
      { status: 429 }
    );
  }

  const { pin } = await request.json();
  const correctPin = process.env.APP_PIN;

  if (pin === correctPin) {
    attempts.delete(ip);
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, "verified", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 hari
      path: "/",
    });
    return response;
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = Date.now() + BLOCK_DURATION_MS;
    record.count = 0;
  }
  attempts.set(ip, record);

  return NextResponse.json({ message: "PIN salah" }, { status: 401 });
}