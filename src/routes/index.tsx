import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bus, User, Shield, Mic, MapPin, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const [busy, setBusy] = useState<"user" | "driver" | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    // Si ya tiene rol, redirigir al flujo correspondiente
    if (profile?.role === "user") navigate({ to: "/usuario/solicitar" });
    if (profile?.role === "driver") navigate({ to: "/conductor/registro" });
  }, [user, profile, loading, navigate]);

  const pickRole = async (role: "user" | "driver") => {
    if (!user) return;
    setBusy(role);
    try {
      // Asignar rol en profile + tabla user_roles (app_role)
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", user.id);
      if (pErr) throw pErr;

      const { error: rErr } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role });
      if (rErr && !rErr.message.includes("duplicate")) throw rErr;

      await refreshProfile();
      navigate({ to: role === "user" ? "/usuario/solicitar" : "/conductor/registro" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el rol");
    } finally {
      setBusy(null);
    }
  };

  if (loading || !user || profile?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      {/* Decoración */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-card blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-primary-foreground blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 py-12 min-h-screen flex flex-col">
        <button
          onClick={() => signOut()}
          className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground text-xs flex items-center gap-1"
        >
          <LogOut className="w-3 h-3" /> Salir
        </button>

        {/* Logo */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-card/15 backdrop-blur-sm mb-4 shadow-[var(--shadow-glow)]">
            <Bus className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-bold text-primary-foreground tracking-tight">Ruti</h1>
          <p className="text-primary-foreground/80 mt-2 text-base">Transporte urbano seguro y transparente</p>
        </header>

        {/* Selección */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          <h2 className="text-primary-foreground text-xl font-semibold text-center mb-2">¿Cómo deseas continuar?</h2>

          <button
            onClick={() => pickRole("user")}
            disabled={busy !== null}
            className="group bg-card rounded-2xl p-6 shadow-[var(--shadow-elevated)] hover:scale-[1.02] transition-[var(--transition-smooth)] flex items-center gap-4 disabled:opacity-60"
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              {busy === "user" ? <Loader2 className="w-7 h-7 text-primary-foreground animate-spin" /> : <User className="w-7 h-7 text-primary-foreground" />}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-foreground text-lg">Soy Usuario</div>
              <div className="text-sm text-muted-foreground">Solicita un transporte rápido</div>
            </div>
            <span className="text-primary text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <button
            onClick={() => pickRole("driver")}
            disabled={busy !== null}
            className="group bg-card rounded-2xl p-6 shadow-[var(--shadow-elevated)] hover:scale-[1.02] transition-[var(--transition-smooth)] flex items-center gap-4 disabled:opacity-60"
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-secondary">
              {busy === "driver" ? <Loader2 className="w-7 h-7 text-primary animate-spin" /> : <Bus className="w-7 h-7 text-primary" />}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-foreground text-lg">Soy Conductor</div>
              <div className="text-sm text-muted-foreground">Registra tu unidad y opera</div>
            </div>
            <span className="text-primary text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Features */}
        <footer className="mt-12 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: Shield, label: "Seguro" },
            { icon: Mic, label: "Por voz" },
            { icon: MapPin, label: "En tiempo real" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 text-primary-foreground/90">
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </footer>
      </div>
    </div>
  );
}
