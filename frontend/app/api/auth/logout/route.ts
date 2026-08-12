import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;

  // Intentar invalidar el token en el backend (best effort)
  if (token) {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    try {
      await fetch(`${backendUrl}/auth/logout?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
    } catch {
      // Ignorar errores de red en logout
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("session_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
