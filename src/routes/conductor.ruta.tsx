import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import {
  Navigation,
  MapPin,
  Users,
  AlertTriangle,
  Play,
  Square,
  Route as RouteIcon,
  Clock,
  TrainFront,
  Loader2,
} from "lucide-react";
import { pasajerosMock } from "@/lib/mock-data";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { PlacesVoiceInput, type PlaceResult } from "@/components/PlacesVoiceInput";
import { RouteMap, nearestMetroStation } from "@/components/RouteMap";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/conductor/ruta")({
  component: ConductorRuta,
});

// Coords aproximadas en Lima para los pasajeros mock — para mostrar sobre el mapa real.
const PASAJERO_COORDS: Record<string, { lat: number; lng: number }> = {
  p1: { lat: -12.0892, lng: -77.0392 }, // Av. Arequipa
  p2: { lat: -12.0512, lng: -77.0345 }, // Jr. Lampa
  p3: { lat: -12.0712, lng: -77.0512 }, // Av. Brasil
  p4: { lat: -12.0907, lng: -77.0185 }, // Av. Javier Prado
  p5: { lat: -12.0533, lng: -77.0345 }, // Plaza San Martín
};

type RouteInfo = { distanceText: string; durationText: string; distanceKm: number; durationMin: number } | null;

function ConductorRuta() {
  const { user } = useAuth();
  const [origenText, setOrigenText] = useState("");
  const [destinoText, setDestinoText] = useState("");
  const [origenPos, setOrigenPos] = useState<PlaceResult | null>(null);
  const [destinoPos, setDestinoPos] = useState<PlaceResult | null>(null);
  const [enRuta, setEnRuta] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [pasajeroSel, setPasajeroSel] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>(null);

  const totalPasajeros = pasajerosMock.reduce((s, p) => s + p.cantidad, 0);

  const metroHint = useMemo(() => {
    if (!origenPos) return null;
    const oNear = nearestMetroStation(origenPos);
    if (oNear.distanceKm < 0.6) {
      return `Tu inicio queda a ${(oNear.distanceKm * 1000).toFixed(0)} m de la estación ${oNear.station.nombre} del Metropolitano.`;
    }
    return null;
  }, [origenPos]);

  const extraMarkers = useMemo(() => {
    if (!enRuta) return undefined;
    return pasajerosMock.map((p) => ({
      id: p.id,
      position: PASAJERO_COORDS[p.id] ?? { lat: -12.05, lng: -77.04 },
      label: String(p.cantidad),
      color: pasajeroSel === p.id ? "#4f46e5" : "#0ea5e9",
    }));
  }, [enRuta, pasajeroSel]);

  const iniciarRuta = async () => {
    if (!origenPos || !destinoPos) return;
    setIniciando(true);
    try {
      if (user) {
        const { error } = await supabase.from("rides").insert({
          user_id: user.id,
          driver_id: user.id,
          start_address: origenPos.address,
          start_lat: origenPos.lat,
          start_lng: origenPos.lng,
          end_address: destinoPos.address,
          end_lat: destinoPos.lat,
          end_lng: destinoPos.lng,
          price: 0,
          status: "accepted",
        });
        if (error) throw error;
      }
      setEnRuta(true);
      toast.success("Ruta iniciada. Los pasajeros pueden verte.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo iniciar la ruta.");
    } finally {
      setIniciando(false);
    }
  };

  const detenerRuta = () => {
    setEnRuta(false);
    setPasajeroSel(null);
    toast.message("Ruta detenida.");
  };

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

        <div className="mb-5">
          <VoiceRecorder />
        </div>

        {/* Inputs ruta con voz + Places */}
        <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] space-y-3 mb-4">
          <PlacesVoiceInput
            icon={Navigation}
            placeholder="Punto de inicio"
            value={origenText}
            onChange={setOrigenText}
            onPlaceSelected={setOrigenPos}
            dotColor="bg-success"
          />
          <div className="border-t border-border" />
          <PlacesVoiceInput
            icon={MapPin}
            placeholder="Punto final"
            value={destinoText}
            onChange={setDestinoText}
            onPlaceSelected={setDestinoPos}
            dotColor="bg-primary"
          />
          {!enRuta ? (
            <button
              onClick={iniciarRuta}
              disabled={!origenPos || !destinoPos || iniciando}
              className="w-full py-3 rounded-xl text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-[var(--shadow-soft)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              {iniciando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {iniciando ? "Iniciando…" : "Iniciar ruta"}
            </button>
          ) : (
            <button
              onClick={detenerRuta}
              className="w-full py-3 rounded-xl bg-destructive/90 text-destructive-foreground font-semibold flex items-center justify-center gap-2 shadow-[var(--shadow-soft)]"
            >
              <Square className="w-4 h-4 fill-current" /> Detener ruta
            </button>
          )}
        </div>

        {(origenPos || destinoPos) && (
          <RouteMap
            origin={origenPos}
            destination={destinoPos}
            extraMarkers={extraMarkers}
            showMetropolitano
            onRouteInfo={setRouteInfo}
            className="mb-4"
          />
        )}

        {routeInfo && (
          <div className="flex items-center justify-between bg-card rounded-xl px-4 py-2.5 mb-3 shadow-sm border border-border">
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
          <div className="rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2 border bg-secondary/60 border-border">
            <TrainFront className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            <span className="text-xs text-foreground leading-snug">{metroHint}</span>
          </div>
        )}

        {enRuta && (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-semibold text-foreground">Pasajeros en ruta</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                <Users className="w-3 h-3" /> {totalPasajeros}
              </span>
            </div>

            <div className="space-y-2">
              {pasajerosMock.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPasajeroSel(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-[var(--transition-smooth)] text-left ${
                    pasajeroSel === p.id ? "bg-primary/5 border-primary/40" : "bg-card border-border hover:border-primary/20"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {p.cantidad}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">
                      {p.nombre} · {p.cantidad} {p.cantidad === 1 ? "persona" : "personas"}
                    </div>
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
