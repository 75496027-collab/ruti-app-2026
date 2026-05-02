import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Mail, User as UserIcon, Phone, IdCard, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/registro/usuario")({
  component: RegistroUsuario,
});

function RegistroUsuario() {
  const [form, setForm] = useState({ nombre: "", dni: "", celular: "" });
  const [done, setDone] = useState(false);

  const valid = form.nombre.length > 2 && form.dni.length === 8 && form.celular.length >= 9;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valid) setDone(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Registro de Usuario" />
      <main className="max-w-md mx-auto px-4 py-6">
        {done ? (
          <SuccessCard />
        ) : (
          <>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-border rounded-xl py-3 font-medium hover:bg-secondary transition-[var(--transition-smooth)] shadow-sm"
              onClick={() => setDone(true)}
            >
              <Mail className="w-5 h-5 text-primary" />
              Continuar con Google
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">o regístrate con tus datos</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field icon={UserIcon} label="Nombre completo" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} placeholder="Ej. Ana Pérez" />
              <Field icon={IdCard} label="DNI" value={form.dni} onChange={(v) => setForm({ ...form, dni: v.replace(/\D/g, "").slice(0, 8) })} placeholder="8 dígitos" />
              <Field icon={Phone} label="Número de celular" value={form.celular} onChange={(v) => setForm({ ...form, celular: v.replace(/\D/g, "").slice(0, 9) })} placeholder="9XXXXXXXX" />

              <button
                type="submit"
                disabled={!valid}
                className="w-full mt-2 py-3.5 rounded-xl font-semibold text-primary-foreground transition-[var(--transition-smooth)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)]"
                style={{ background: "var(--gradient-primary)" }}
              >
                Crear cuenta
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, placeholder }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground mb-1.5 block">{label}</span>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-3 py-3 bg-white border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-[var(--transition-smooth)]"
        />
      </div>
    </label>
  );
}

function SuccessCard() {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "var(--gradient-primary)" }}>
        <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">¡Bienvenido a Ruti!</h2>
      <p className="text-muted-foreground mb-6">Tu cuenta está lista. Solicita tu primer viaje.</p>
      <Link
        to="/usuario/solicitar"
        className="inline-block w-full py-3.5 rounded-xl font-semibold text-primary-foreground shadow-[var(--shadow-soft)]"
        style={{ background: "var(--gradient-primary)" }}
      >
        Solicitar transporte
      </Link>
    </div>
  );
}