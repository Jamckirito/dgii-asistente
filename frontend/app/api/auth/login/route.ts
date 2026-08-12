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

  console.log("--------------------------------------------------");
  console.log("[auth/login] Config de Supabase:");
  console.log("  URL:", url || "⚠️ NO CONFIGURADA");
  console.log("  KEY (10 primeros caracteres):", key ? `${key.substring(0, 10)}...` : "⚠️ NO CONFIGURADA");
  console.log("--------------------------------------------------");

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

    console.log("[auth/login] Petición recibida para el email:", email);

    if (!email || !password) {
      console.warn("[auth/login] Faltan campos email o password.");
      return NextResponse.json(
        { error: "Correo y contraseña son requeridos." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    console.log("[auth/login] Ejecutando RPC 'verify_user_password' en Supabase...");
    console.log("  Parametros enviados:", { p_email: email, p_password: "***" });

    // Verificar contraseña usando la función RPC con pgcrypto
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "verify_user_password",
      { p_email: email, p_password: password }
    );

    console.log("[auth/login] Respuesta Supabase RPC (data):", JSON.stringify(rpcData, null, 2));
    console.log("[auth/login] Respuesta Supabase RPC (error):", JSON.stringify(rpcError, null, 2));

    if (rpcError) {
      console.error("[auth/login] RPC error de Supabase:", rpcError);
      return NextResponse.json(
        { error: `Error en base de datos: ${rpcError.message || rpcError.details || "RPC Error"}` },
        { status: 500 }
      );
    }

    const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;

    if (!result || !result.is_valid) {
      console.warn("[auth/login] Credenciales inválidas para email:", email);
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos." },
        { status: 401 }
      );
    }

    // Generar token de sesión (24 bytes hex = 48 chars, cabe en VARCHAR(50))
    const token = randomBytes(24).toString("hex");

    console.log("[auth/login] Usuario verificado correctamente. Generado token:", token);
    console.log("[auth/login] Actualizando token en tabla public.users...");

    // Guardar token en public.users
    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update({ token })
      .eq("email", email)
      .select();

    console.log("[auth/login] Respuesta Supabase Update (data):", JSON.stringify(updateData, null, 2));
    console.log("[auth/login] Respuesta Supabase Update (error):", JSON.stringify(updateError, null, 2));

    if (updateError) {
      console.error("[auth/login] Update token error de Supabase:", updateError);
      return NextResponse.json(
        { error: `Error al guardar sesión: ${updateError.message}` },
        { status: 500 }
      );
    }

    const username: string = result.username ?? "";

    console.log("[auth/login] Login exitoso para usuario:", username);

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
  } catch (err: any) {
    console.error("[auth/login] Excepción inesperada:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno del servidor." },
      { status: 500 }
    );
  }
}
