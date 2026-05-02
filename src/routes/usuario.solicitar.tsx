import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Mic, MapPin, Navigation, Star, Shield, CheckCircle2, Bus as BusIcon, Clock, Bell } from "lucide-react";
import { busesMock, type Bus } from "@/lib/mock-data";

export const Route = createFileRoute("/usuario/solicitar")({
  component: UsuarioSolicitar,
});

function UsuarioSolicitar() {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [listening, setListening] = useState<"origen" | "destino" | null>(null);
  const [busSeleccionado, setBusSeleccionado] = useState<Bus | null>(null);
  const [solicitado, setSolicitado] = useState(false);

  const dictar = (campo: "origen" | "destino") => {
    setListening(campo);
    setTimeout(() => {
      if (campo === "origen") setOrigen("Av. Arequipa 1245, Lince");
      else setDestino("Plaza San Martín, Cercado de Lima");
      setListening(null);
    }, 1600);
  };

  const showBuses = origen && destino;

  if (solicitado && busSeleccionado) {
    return <ConductorView bus={busSeleccionado} onBack={() => { setSolicitado(false); setBusSeleccionado(null); }} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Solicitar transporte" />
      <main className="max-w-md mx-auto px-4 py-5">
        <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-soft)] space-y-3 mb-5">
          <VoiceField icon={Navigation} placeholder="Punto de inicio" value={origen} onMic={() => dictar("origen")} listening={listening === "origen"} onChange={setOrigen} dotColor="bg-success" />
          <div className="border-t border-border" />
          <VoiceField icon={MapPin} placeholder="¿A dónde vas?" value={destino} onMic={() => dictar("destino")} listening={listening === "destino"} onChange={setDestino} dotColor="bg-primary" />
        </div>

        {showBuses && !busSeleccionado && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Buses disponibles</h2>
            <div className="space-y-3">
              {busesMock.map((b) => (
                <BusCard key={b.id} bus={b} onSelect={() => setBusSeleccionado(b)} />
              ))}
            </div>
          </>
        )}

        {!showBuses && (
          <div className="text-center py-12 text-muted-foreground">
            <Mic className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Dicta tu origen y destino para ver los buses cercanos</p>
          </div>
        )}

        {busSeleccionado && (
          <ConductorPreview bus={busSeleccionado} onCancel={() => setBusSeleccionado(null)} onSolicitar={() => setSolicitado(true)} />
        )}
      </main>
    </div>
  );
}

function VoiceField({ icon: Icon, placeholder, value, onMic, listening, onChange, dotColor }: { icon: React.ComponentType<{ className?: string }>; placeholder: string; value: string; onMic: () => void; listening: boolean; onChange: (v: string) => void; dotColor: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <button
        onClick={onMic}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-[var(--transition-smooth)] ${listening ? "bg-primary text-primary-foreground scale-110" : "bg-secondary text-primary hover:bg-accent"}`}
      >
        <Mic className="w-4 h-4" />
        {listening && <span className="absolute w-9 h-9 rounded-full bg-primary animate-ping opacity-40" />}
      </button>
    </div>
  );
}

function BusCard({ bus, onSelect }: { bus: Bus; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-border hover:shadow-[var(--shadow-soft)] hover:border-primary/30 transition-[var(--transition-smooth)] text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
          <BusIcon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground text-sm">{bus.ruta}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <Star className="w-3 h-3 fill-warning text-warning" />
            {bus.rating}
            <span>·</span>
            <Clock className="w-3 h-3" />
            {bus.etaMin} min
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-foreground">S/ {bus.precio.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">{bus.asientos} asientos</div>
        </div>
      </div>
    </button>
  );
}

function ConductorPreview({ bus, onCancel, onSolicitar }: { bus: Bus; onCancel: () => void; onSolicitar: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-elevated)] mt-3">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg" style={{ background: "var(--gradient-primary)" }}>
          {bus.conductor.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">{bus.conductor}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Star className="w-3 h-3 fill-warning text-warning" /> {bus.rating} · Placa {bus.placa}
          </div>
        </div>
      </div>

      <div className="bg-secondary/60 rounded-xl p-3 space-y-2 mb-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Documentación validada</div>
        {[
          ["SOAT vigente", bus.soatVigente],
          ["Licencia de conducir", bus.licenciaVigente],
          ["Revisión técnica", bus.revisionTecnica],
          ["Autorización ATU", bus.autorizacionATU],
        ].map(([label, ok]) => (
          <div key={String(label)} className="flex items-center gap-2 text-sm">
            {ok ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Shield className="w-4 h-4 text-muted-foreground" />}
            <span className="text-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-2xl font-bold text-foreground">S/ {bus.precio.toFixed(2)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onCancel} className="py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-accent transition-[var(--transition-smooth)]">
          Cancelar
        </button>
        <button
          onClick={onSolicitar}
          className="py-3 rounded-xl text-primary-foreground font-semibold shadow-[var(--shadow-soft)]"
          style={{ background: "var(--gradient-primary)" }}
        >
          Solicitar
        </button>
      </div>
    </div>
  );
}

function ConductorView({ bus, onBack }: { bus: Bus; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Tu viaje" />
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-success/15 border border-success/30 rounded-xl p-4 flex items-start gap-3 mb-5">
          <Bell className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-foreground text-sm">Notificación enviada al conductor</div>
            <div className="text-xs text-muted-foreground mt-0.5">"Llegar pronto" — {bus.conductor}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-[var(--shadow-soft)] mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl" style={{ background: "var(--gradient-primary)" }}>
              {bus.conductor.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="font-bold text-foreground">{bus.conductor}</div>
              <div className="text-sm text-muted-foreground">Placa {bus.placa}</div>
              <div className="text-xs text-success font-medium flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> Llega en {bus.etaMin} min
              </div>
            </div>
          </div>
        </div>

        <button onClick={onBack} className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium">
          Solicitar otro viaje
        </button>
      </main>
    </div>
  );
}