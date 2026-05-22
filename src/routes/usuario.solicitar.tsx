import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import {
  Mic,
  MapPin,
  Navigation,
  Star,
  Shield,
  CheckCircle2,
  Bus as BusIcon,
  Clock,
  Bell,
  Route as RouteIcon,
  TrainFront,
  Loader2,
} from "lucide-react";
import { busesMock, type Bus } from "@/lib/mock-data";
import { PlacesVoiceInput, type PlaceResult } from "@/components/PlacesVoiceInput";
import { RouteMap, nearestMetroStation } from "@/components/RouteMap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/usuario/solicitar")({
  component: UsuarioSolicitar,
});

type RouteInfo = { distanceText: string; durationText: string; distanceKm: number; durationMin: number } | null;

function UsuarioSolicitar() {
  const { user } = useAuth();
  const [origenText, setOrigenText] = useState("");
  const [destinoText, setDestinoText] = useState("");
  const [origenPos, setOrigenPos] = useState<PlaceResult | null>(null);
  const [destinoPos, setDestinoPos] = useState<PlaceResult | null>(null);
  const [busSeleccionado, setBusSeleccionado] = useState<Bus | null>(null);
  const [solicitado, setSolicitado] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>(null);

  const showRoute = origenPos && destinoPos;
  const showBuses = showRoute && !solicitado;

  const metroHint = useMemo(() => {
    if (!origenPos || !destinoPos) return null;
    const oNear = nearestMetroStation(origenPos);
    const dNear = nearestMetroStation(destinoPos);
    if (oNear.distanceKm < 0.6 && dNear.distanceKm < 0.6) {
      return {
        ok: true,
        text: `Tu trayecto se cubre con el Metropolitano: sube en ${oNear.station.nombre} y baja en ${dNear.station.nombre}.`,
      };
    }
    if (oNear.distanceKm < 0.8) {
      return {
        ok: false,
        text: `Estación del Metropolitano cercana al origen: ${oNear.station.nombre} (${oNear.distanceKm.toFixed(1)} km).`,
      };
    }
    return null;
  }, [origenPos, destinoPos]);

  const solicitarViaje = async () => {
    if (!busSeleccionado || !origenPos || !destinoPos) return;
    setSolicitando(true);
    try {
      if (user) {
        const { error } = await supabase.from("rides").insert({
          user_id: user.id,
          start_address: origenPos.address,
          start_lat: origenPos.lat,
          start_lng: origenPos.lng,
          end_address: destinoPos.address,
          end_lat: destinoPos.lat,
          end_lng: destinoPos.lng,
          price: busSeleccionado.precio,
          status: "pending",
        });
        if (error) throw error;
      }
      setSolicitado(true);
      toast.success("Viaje solicitado. El conductor fue notificado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar el viaje.");
    } finally {
      setSolicitando(false);
    }
  };

  if (solicitado && busSeleccionado && origenPos && destinoPos) {
    return (
      <ConductorView
        bus={busSeleccionado}
        origen={origenPos}
        destino={destinoPos}
        routeInfo={routeInfo}
        onBack={() => {
          setSolicitado(false);
          setBusSeleccionado(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Solicitar transporte" />
      <main className="max-w-md mx-auto px-4 py-5">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] space-y-3 mb-4">
          <PlacesVoiceInput
            icon={Navigation}
            placeholder="Punto de inicio"
            value={origenText}
            onChange={setOrigenText}
            onPlaceSelected={(p) => setOrigenPos(p)}
            dotColor="bg-success"
          />
          <div className="border-t border-border" />
          <PlacesVoiceInput
            icon={MapPin}
            placeholder="¿A dónde vas?"
            value={destinoText}
            onChange={setDestinoText}
            onPlaceSelected={(p) => setDestinoPos(p)}
            dotColor="bg-primary"
          />
        </div>

        {showRoute && (
          <>
            <RouteMap
              origin={origenPos}
              destination={destinoPos}
              showMetropolitano
              onRouteInfo={setRouteInfo}
              className="mb-4"
            />
            {routeInfo && (
              <div className="flex items-center justify-between bg-card rounded-xl px-4 py-2.5 mb-4 shadow-sm border border-border">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <RouteIcon className="w-4 h-4 text-primary" />
                  <span>{routeInfo.distanceText}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{routeInfo.durationText}</span>
                </div>
              </div>
            )}
            {metroHint && (
              <div className={`rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2 border ${metroHint.ok ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30"}`}>
                <TrainFront className={`w-4 h-4 shrink-0 mt-0.5 ${metroHint.ok ? "text-success" : "text-warning"}`} />
                <span className="text-xs text-foreground leading-snug">{metroHint.text}</span>
              </div>
            )}
          </>
        )}

        {showBuses && !busSeleccionado && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Buses disponibles
            </h2>
            <div className="space-y-3">
              {busesMock.map((b) => (
                <BusCard key={b.id} bus={b} onSelect={() => setBusSeleccionado(b)} />
              ))}
            </div>
          </>
        )}

        {!showRoute && (
          <div className="text-center py-12 text-muted-foreground">
            <Mic className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Dicta o escribe tu origen y destino para ver la ruta completa</p>
          </div>
        )}

        {busSeleccionado && (
          <ConductorPreview
            bus={busSeleccionado}
            solicitando={solicitando}
            onCancel={() => setBusSeleccionado(null)}
            onSolicitar={solicitarViaje}
          />
        )}
      </main>
    </div>
  );
}

function BusCard({ bus, onSelect }: { bus: Bus; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-[var(--shadow-soft)] hover:border-primary/30 transition-[var(--transition-smooth)] text-left"
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

function ConductorPreview({
  bus,
  solicitando,
  onCancel,
  onSolicitar,
}: {
  bus: Bus;
  solicitando: boolean;
  onCancel: () => void;
  onSolicitar: () => void;
}) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-elevated)] mt-3">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg"
          style={{ background: "var(--gradient-primary)" }}
        >
          {bus.conductor
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">{bus.conductor}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Star className="w-3 h-3 fill-warning text-warning" /> {bus.rating} · Placa {bus.placa}
          </div>
        </div>
      </div>

      <div className="bg-secondary/60 rounded-xl p-3 space-y-2 mb-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Documentación validada
        </div>
        {([
          ["SOAT vigente", bus.soatVigente],
          ["Licencia de conducir", bus.licenciaVigente],
          ["Revisión técnica", bus.revisionTecnica],
          ["Autorización ATU", bus.autorizacionATU],
        ] as const).map(([label, ok]) => (
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
        <button
          onClick={onCancel}
          disabled={solicitando}
          className="py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-accent transition-[var(--transition-smooth)] disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          onClick={onSolicitar}
          disabled={solicitando}
          className="py-3 rounded-xl text-primary-foreground font-semibold shadow-[var(--shadow-soft)] disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "var(--gradient-primary)" }}
        >
          {solicitando && <Loader2 className="w-4 h-4 animate-spin" />}
          {solicitando ? "Solicitando…" : "Solicitar"}
        </button>
      </div>
    </div>
  );
}

function ConductorView({
  bus,
  origen,
  destino,
  routeInfo,
  onBack,
}: {
  bus: Bus;
  origen: PlaceResult;
  destino: PlaceResult;
  routeInfo: RouteInfo;
  onBack: () => void;
}) {
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

        <RouteMap origin={origen} destination={destino} showMetropolitano className="mb-4" />

        {routeInfo && (
          <div className="flex items-center justify-between bg-card rounded-xl px-4 py-2.5 mb-4 shadow-sm border border-border">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <RouteIcon className="w-4 h-4 text-primary" />
              <span>{routeInfo.distanceText}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>{routeInfo.durationText}</span>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-soft)] mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl"
              style={{ background: "var(--gradient-primary)" }}
            >
              {bus.conductor
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <div className="font-bold text-foreground">{bus.conductor}</div>
              <div className="text-sm text-muted-foreground">Placa {bus.placa}</div>
              <div className="text-xs text-success font-medium flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> Llega en {bus.etaMin} min
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              <span className="font-medium text-foreground">Desde:</span> {origen.address}
            </div>
            <div>
              <span className="font-medium text-foreground">Hasta:</span> {destino.address}
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
