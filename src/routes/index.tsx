import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Bus, User, Shield, Mic, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      {/* Decoración */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-primary-foreground blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 py-12 min-h-screen flex flex-col">
        {/* Logo */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm mb-4 shadow-[var(--shadow-glow)]">
            <Bus className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-bold text-primary-foreground tracking-tight">Ruti</h1>
          <p className="text-primary-foreground/80 mt-2 text-base">Transporte urbano seguro y transparente</p>
        </header>

        {/* Selección */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          <h2 className="text-primary-foreground text-xl font-semibold text-center mb-2">¿Cómo deseas continuar?</h2>

          <Link
            to="/registro/usuario"
            className="group bg-white rounded-2xl p-6 shadow-[var(--shadow-elevated)] hover:scale-[1.02] transition-[var(--transition-smooth)] flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <User className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-foreground text-lg">Soy Usuario</div>
              <div className="text-sm text-muted-foreground">Solicita un transporte rápido</div>
            </div>
            <span className="text-primary text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </Link>

          <Link
            to="/registro/conductor"
            className="group bg-white rounded-2xl p-6 shadow-[var(--shadow-elevated)] hover:scale-[1.02] transition-[var(--transition-smooth)] flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-secondary">
              <Bus className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-foreground text-lg">Soy Conductor</div>
              <div className="text-sm text-muted-foreground">Registra tu unidad y opera</div>
            </div>
            <span className="text-primary text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </Link>
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
