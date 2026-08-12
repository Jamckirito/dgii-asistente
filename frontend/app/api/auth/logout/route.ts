import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;

  // Invalidar token en la BD (best effort)
  if (token) {
    try {
      const url =
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL ||
        "";
      const key =
        process.env.SUPABASE_SERVICE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "";

      if (url && key) {
        const supabase = createClient(url, key, {
          auth: { persistSession: false },
        });
        await supabase
          .from("users")
          .update({ token: "" })
          .eq("token", token);
      }
    } catch {
      // Ignorar errores al invalidar — la cookie ya se borrará
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
