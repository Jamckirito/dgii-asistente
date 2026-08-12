import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

function getSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Supabase admin credentials are not configured.");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo y contraseña son requeridos." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verificar contraseña usando la función RPC con pgcrypto
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "verify_user_password",
      { p_email: email, p_password: password }
    );

    if (rpcError) {
      console.error("[auth/login] RPC error:", rpcError);
      return NextResponse.json(
        { error: "Error al verificar credenciales. Intenta de nuevo." },
        { status: 500 }
      );
    }

    const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;

    if (!result || !result.is_valid) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos." },
        { status: 401 }
      );
    }

    // Generar token de sesión (32 bytes hex = 64 chars)
    const token = randomBytes(32).toString("hex");

    // Guardar token en public.users
    const { error: updateError } = await supabase
      .from("users")
      .update({ token })
      .eq("email", email);

    if (updateError) {
      console.error("[auth/login] Update token error:", updateError);
      return NextResponse.json(
        { error: "Error interno al crear sesión." },
        { status: 500 }
      );
    }

    const username: string = result.username ?? "";

    // Establecer cookie httpOnly con el token de sesión
    const response = NextResponse.json({ ok: true, username });
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[auth/login] Unexpected error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
