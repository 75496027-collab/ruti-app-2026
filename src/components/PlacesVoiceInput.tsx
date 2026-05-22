import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { toast } from "sonner";

export type PlaceResult = {
  address: string;
  lat: number;
  lng: number;
};

type Props = {
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  onPlaceSelected: (place: PlaceResult) => void;
  dotColor?: string;
  /** Acota resultados a Lima/Perú. */
  country?: string;
};

export function PlacesVoiceInput({
  icon: Icon,
  placeholder,
  value,
  onChange,
  onPlaceSelected,
  dotColor = "bg-primary",
  country = "pe",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<any>(null);
  const [acReady, setAcReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const { listening, interim, start, stop } = useSpeechRecognition({
    lang: "es-PE",
    onFinal: (text) => {
      onChange(text);
      // Tras dictar, intenta geocodificar la dirección dictada.
      geocodeText(text);
    },
    onError: (msg) => {
      toast.error(msg.includes("micr") || msg.includes("denied") ? "Permite el micrófono para dictar." : "No se pudo escuchar.");
    },
  });

  // Inicializa Places Autocomplete
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "name"],
          componentRestrictions: { country },
          types: ["geocode", "establishment"],
        });
        ac.addListener("place_changed", () => {
          const p = ac.getPlace();
          const loc = p?.geometry?.location;
          if (!loc) return;
          const place: PlaceResult = {
            address: p.formatted_address || p.name || inputRef.current?.value || "",
            lat: loc.lat(),
            lng: loc.lng(),
          };
          onChange(place.address);
          onPlaceSelected(place);
        });
        acRef.current = ac;
        setAcReady(true);
      })
      .catch(() => {
        // sin Maps: el input sigue funcionando como texto plano
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const geocodeText = async (text: string) => {
    if (!text.trim()) return;
    try {
      const google = await loadGoogleMaps();
      const geocoder = new google.maps.Geocoder();
      setGeocoding(true);
      geocoder.geocode(
        { address: text, region: "PE", componentRestrictions: { country } },
        (results: any[], status: string) => {
          setGeocoding(false);
          if (status === "OK" && results?.[0]) {
            const r = results[0];
            onPlaceSelected({
              address: r.formatted_address,
              lat: r.geometry.location.lat(),
              lng: r.geometry.location.lng(),
            });
            onChange(r.formatted_address);
          }
        }
      );
    } catch {
      setGeocoding(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <input
        ref={inputRef}
        value={listening && interim ? interim : value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          // Si el usuario escribió sin elegir sugerencia, intentamos geocodificar
          if (value && acReady) geocodeText(value);
        }}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      {geocoding && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      <button
        type="button"
        onClick={listening ? stop : start}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-[var(--transition-smooth)] ${
          listening ? "bg-primary text-primary-foreground scale-110" : "bg-secondary text-primary hover:bg-accent"
        }`}
        aria-label={listening ? "Detener dictado" : "Dictar"}
      >
        {listening && <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-40" />}
        {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>
    </div>
  );
}
