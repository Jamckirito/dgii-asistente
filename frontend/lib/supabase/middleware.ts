import { type NextRequest, NextResponse } from "next/server";

/**
 * Función mantenida por compatibilidad con imports existentes.
 * La verificación de sesión ahora se realiza en middleware.ts principal
 * usando la cookie `session_token`.
 */
export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request });
}
