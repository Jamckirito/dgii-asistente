import { LoginForm } from "@/components/shared/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">DGII Asistente</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Accede a tu cuenta para continuar
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
