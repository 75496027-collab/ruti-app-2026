import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Mic, Navigation, MapPin, Users, AlertTriangle, Play, Bus as BusIcon } from "lucide-react";
import { pasajerosMock } from "@/lib/mock-data";

export const Route = createFileRoute("/conductor/ruta")({
  component: ConductorRuta,
});

function ConductorRuta() {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [enRuta, setEnRuta] = useState(false);
  const [pasajeroSel, setPasajeroSel] = useState<string | null>(null);

  const totalPasajeros = pasajerosMock.reduce((s, p) => s + p.cantidad, 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Panel del Conductor" />
      <main className="max-w-md mx-auto px-4 py-5">
        {/* Alerta documentos */}
        <div className="bg-warning/15 border border-warning/30 rounded-xl p-3 flex items-start gap-2.5 mb-4">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <div className="text-xs">
            <div className="font-semibold text-foreground">SOAT vence en 28 días</div>
            <div className="text-muted-foreground">Renueva pronto para mantener tu operación activa.</div>
          </div>
        </div>

        {/* Inputs ruta */}
        <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] space-y-3 mb-5">
          <RutaField icon={Navigation} placeholder="Punto de inicio" value={origen} onChange={setOrigen} dot="bg-success" />
          <div className="border-t border-border" />
          <RutaField icon={MapPin} placeholder="Punto final" value={destino} onChange={setDestino} dot="bg-primary" />
          <button
            onClick={() => setEnRuta(true)}
            disabled={!origen || !destino}
            className="w-full py-3 rounded-xl text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-[var(--shadow-soft)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Play className="w-4 h-4" />
            {enRuta ? "Ruta activa" : "Iniciar simulación"}
          </button>
        </div>

        {enRuta && (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-semibold text-foreground">Pasajeros en ruta</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                <Users className="w-3 h-3" /> {totalPasajeros}
              </span>
            </div>

            <Mapa pasajeroSel={pasajeroSel} onSelect={setPasajeroSel} />

            <div className="mt-4 space-y-2">
              {pasajerosMock.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPasajeroSel(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-[var(--transition-smooth)] text-left ${pasajeroSel === p.id ? "bg-primary/5 border-primary/40" : "bg-card border-border hover:border-primary/20"}`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0" style={{ background: "var(--gradient-primary)" }}>
                    {p.cantidad}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">{p.nombre} · {p.cantidad} {p.cantidad === 1 ? "persona" : "personas"}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.punto}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function RutaField({ icon: Icon, placeholder, value, onChange, dot }: { icon: React.ComponentType<{ className?: string }>; placeholder: string; value: string; onChange: (v: string) => void; dot: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <button className="w-9 h-9 rounded-full bg-secondary text-primary hover:bg-accent flex items-center justify-center transition-[var(--transition-smooth)]">
        <Mic className="w-4 h-4" />
      </button>
    </div>
  );
}

function Mapa({ pasajeroSel, onSelect }: { pasajeroSel: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="relative w-full h-72 rounded-2xl overflow-hidden shadow-[var(--shadow-soft)] border border-border" style={{ background: "var(--gradient-soft)" }}>
      {/* Grid mapa */}
      <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="oklch(0.55 0.18 250)" strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {/* Ruta */}
        <path d="M 20,250 Q 100,180 180,150 T 340,60" fill="none" stroke="oklch(0.55 0.18 250)" strokeWidth="3" strokeDasharray="6 4" strokeLinecap="round" />
      </svg>

      {/* Bus */}
      <div className="absolute bottom-3 left-3 w-11 h-11 rounded-full flex items-center justify-center text-primary-foreground shadow-[var(--shadow-elevated)] z-10" style={{ background: "var(--gradient-primary)" }}>
        <BusIcon className="w-5 h-5" />
      </div>

      {/* Pasajeros */}
      {pasajerosMock.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className="absolute -translate-x-1/2 -translate-y-1/2 group"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <div className={`relative w-9 h-9 rounded-full bg-card border-2 flex items-center justify-center shadow-[var(--shadow-soft)] transition-[var(--transition-smooth)] ${pasajeroSel === p.id ? "border-primary scale-125" : "border-border group-hover:scale-110"}`}>
            <Users className="w-4 h-4 text-primary" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {p.cantidad}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}