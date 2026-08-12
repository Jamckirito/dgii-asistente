import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const DEFAULT_SUPABASE_URL = "https://datnzwuujgmyolwfpfkl.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdG56d3V1amdteW9sd2ZwZmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1ODY0MDUsImV4cCI6MjA5ODE2MjQwNX0.bKNXv3CqBMyLulsfDumr1w8qhIWAXQ6CtfIUHKKxfuA";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  
  // Buscar una clave que sea un JWT válido (empieza por eyJ)
  let key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || "";
  if (!key.startsWith("eyJ")) {
    key = DEFAULT_SUPABASE_KEY;
  }

  console.log("--------------------------------------------------");
  console.log("[auth/login] Config de Supabase:");
  console.log("  URL:", url);
  console.log("  KEY (10 primeros caracteres):", `${key.substring(0, 10)}...`);
  console.log("--------------------------------------------------");

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
    const token = randomBytes(24).toString("hex");

    console.log("[auth/login] Intentando login vía RPC 'login_user'...");

    // Intentar primero con la función atómica login_user
    const { data: loginData, error: loginError } = await supabase.rpc("login_user", {
      p_email: email,
      p_password: password,
      p_token: token,
    });

    if (!loginError && loginData && loginData.length > 0) {
      const res = loginData[0];
      console.log("[auth/login] Resultado login_user RPC:", res);

      if (!res.is_valid) {
        return NextResponse.json(
          { error: res.msg || "Correo o contraseña incorrectos." },
          { status: 401 }
        );
      }

      const username: string = res.username ?? "";
      console.log("[auth/login] Login exitoso para usuario:", username);

      const response = NextResponse.json({ ok: true, username });
      response.cookies.set("session_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      return response;
    }

    // Fallback: usar verify_user_password RPC si login_user no está instalado aún
    console.log("[auth/login] Fallback a RPC 'verify_user_password'...");
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "verify_user_password",
      { p_email: email, p_password: password }
    );

    console.log("[auth/login] Respuesta verify_user_password (data):", JSON.stringify(rpcData));
    console.log("[auth/login] Respuesta verify_user_password (error):", JSON.stringify(rpcError));

    if (rpcError) {
      console.error("[auth/login] RPC error:", rpcError);
      return NextResponse.json(
        { error: `Error de autenticación: ${rpcError.message}` },
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

    const username: string = result.username ?? "";

    // Actualizar token en public.users (best-effort en caso de RLS)
    try {
      await supabase.from("users").update({ token }).eq("email", email);
    } catch (uErr) {
      console.warn("[auth/login] Warning al actualizar token en DB:", uErr);
    }

    console.log("[auth/login] Login exitoso (fallback) para usuario:", username);

    const response = NextResponse.json({ ok: true, username });
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
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
