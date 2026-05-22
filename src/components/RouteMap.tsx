import { useEffect, useRef, useState } from "react";
import { Bus, Loader2, MapPin } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { METROPOLITANO_STATIONS, nearestMetroStation, type MetroStation } from "@/lib/metropolitano-stations";

export type LatLng = { lat: number; lng: number };

type RouteMapProps = {
  origin: LatLng | null;
  destination: LatLng | null;
  /** Marcadores extra opcionales: pasajeros, bus, etc. */
  extraMarkers?: Array<{ id: string; position: LatLng; label?: string; color?: string }>;
  /** Pinta estaciones del Metropolitano cerca al trayecto. */
  showMetropolitano?: boolean;
  /** Devuelve info de la ruta calculada. */
  onRouteInfo?: (info: { distanceText: string; durationText: string; distanceKm: number; durationMin: number } | null) => void;
  className?: string;
};

const LIMA_CENTER: LatLng = { lat: -12.0464, lng: -77.0428 };

export function RouteMap({
  origin,
  destination,
  extraMarkers,
  showMetropolitano = true,
  onRouteInfo,
  className,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const dirRendererRef = useRef<any>(null);
  const dirServiceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const metroMarkersRef = useRef<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Inicializar mapa una vez
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        const map = new google.maps.Map(containerRef.current, {
          center: origin ?? LIMA_CENTER,
          zoom: 13,
          disableDefaultUI: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          styles: [
            { featureType: "poi.business", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "simplified" }] },
          ],
        });
        mapRef.current = map;
        dirServiceRef.current = new google.maps.DirectionsService();
        dirRendererRef.current = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          preserveViewport: false,
          polylineOptions: {
            strokeColor: "#4f46e5",
            strokeOpacity: 0.95,
            strokeWeight: 5,
          },
        });
        setStatus("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "Error al cargar el mapa");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dibujar/limpiar ruta cuando cambia origen/destino
  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    const google = window.google;
    if (!google) return;

    // Limpia marcadores extra antiguos
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (origin && destination && dirServiceRef.current && dirRendererRef.current) {
      dirServiceRef.current.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: false,
          region: "PE",
        },
        (result: any, statusRes: any) => {
          if (statusRes === "OK" && result) {
            dirRendererRef.current.setDirections(result);
            const leg = result.routes?.[0]?.legs?.[0];
            if (leg && onRouteInfo) {
              onRouteInfo({
                distanceText: leg.distance?.text ?? "",
                durationText: leg.duration?.text ?? "",
                distanceKm: (leg.distance?.value ?? 0) / 1000,
                durationMin: Math.round((leg.duration?.value ?? 0) / 60),
              });
            }
          } else {
            dirRendererRef.current.set("directions", null);
            onRouteInfo?.(null);
          }
        }
      );
    } else {
      // Sin ruta: limpia y centra
      dirRendererRef.current?.set("directions", null);
      onRouteInfo?.(null);
      if (origin) mapRef.current.panTo(origin);
      else if (destination) mapRef.current.panTo(destination);
    }

    // Marcadores extra (pasajeros, bus)
    if (extraMarkers && extraMarkers.length) {
      extraMarkers.forEach((mk) => {
        const marker = new google.maps.Marker({
          position: mk.position,
          map: mapRef.current,
          label: mk.label
            ? { text: mk.label, color: "#fff", fontWeight: "700", fontSize: "11px" }
            : undefined,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: mk.color ?? "#0ea5e9",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });
        markersRef.current.push(marker);
      });
    }
  }, [origin, destination, extraMarkers, status, onRouteInfo]);

  // Estaciones del Metropolitano: mostrar las cercanas al trayecto
  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    const google = window.google;
    if (!google) return;

    metroMarkersRef.current.forEach((m) => m.setMap(null));
    metroMarkersRef.current = [];
    if (!showMetropolitano) return;

    const ref = origin ?? destination;
    const stationsToShow: MetroStation[] = ref
      ? METROPOLITANO_STATIONS
          .map((s) => ({ s, d: Math.hypot(s.lat - ref.lat, s.lng - ref.lng) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 10)
          .map((x) => x.s)
      : METROPOLITANO_STATIONS.slice(0, 12);

    stationsToShow.forEach((st) => {
      const marker = new google.maps.Marker({
        position: { lat: st.lat, lng: st.lng },
        map: mapRef.current,
        title: `Metropolitano · ${st.nombre}`,
        icon: {
          path: "M -1,-1 1,-1 1,1 -1,1 z",
          scale: 6,
          fillColor: "#dc2626",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 1.5,
        },
        zIndex: 1,
      });
      metroMarkersRef.current.push(marker);
    });
  }, [origin, destination, showMetropolitano, status]);

  return (
    <div className={`relative w-full h-72 rounded-2xl overflow-hidden shadow-[var(--shadow-soft)] border border-border bg-secondary ${className ?? ""}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/60">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-secondary/80">
          <MapPin className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground max-w-[280px]">{errorMsg}</p>
        </div>
      )}
      {/* Leyenda Metropolitano */}
      {status === "ready" && showMetropolitano && (
        <div className="absolute bottom-2 left-2 bg-card/95 backdrop-blur rounded-lg px-2 py-1 flex items-center gap-1.5 text-[10px] font-medium text-foreground shadow-sm">
          <span className="w-2.5 h-2.5 bg-red-600 rounded-sm" />
          Metropolitano
          <span className="mx-1 text-muted-foreground">·</span>
          <Bus className="w-3 h-3 text-primary" />
          Ruta
        </div>
      )}
    </div>
  );
}

// Util reexportado para que las páginas puedan llamar a "estación más cercana"
export { nearestMetroStation };
