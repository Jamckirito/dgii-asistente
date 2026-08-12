"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  async function handleSubmit() {
    if (!email || !password) return;
    setLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast.error(`Error de registro: ${error.message}`);
      } else if (data.session) {
        toast.success("¡Cuenta creada exitosamente!");
        router.push("/formulario-606");
        router.refresh();
      } else {
        toast.success("Cuenta registrada. Si se requiere confirmación, revisa tu correo o inicia sesión.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error("Credenciales incorrectas. Verifica tu correo y contraseña o crea una cuenta nueva.");
      } else {
        router.push("/formulario-606");
        router.refresh();
      }
    }
    setLoading(false);
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-600 text-sm focus:outline-none focus:border-blue-500 transition-colors";

  return (
    <div className="space-y-4">
      <div className="flex border-b border-neutral-800 pb-2 mb-2">
        <button
          type="button"
          onClick={() => setIsSignUp(false)}
          className={`flex-1 text-xs font-semibold py-1.5 transition-colors ${
            !isSignUp ? "text-blue-400 border-b-2 border-blue-500" : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setIsSignUp(true)}
          className={`flex-1 text-xs font-semibold py-1.5 transition-colors ${
            isSignUp ? "text-blue-400 border-b-2 border-blue-500" : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
          Correo electrónico
        </label>
        <input
          type="email"
          placeholder="usuario@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
          Contraseña
        </label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className={inputCls}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading || !email || !password}
        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
      >
        {loading
          ? isSignUp
            ? "Creando cuenta..."
            : "Ingresando..."
          : isSignUp
          ? "Registrarse"
          : "Ingresar"}
      </button>
    </div>
  );
}
