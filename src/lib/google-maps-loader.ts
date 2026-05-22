// Carga la API de Google Maps JavaScript una sola vez por sesión.
// Si la API key no está configurada, devuelve una promesa rechazada controlada.

// Tipado laxo: no instalamos @types/google.maps para no añadir peso.
// Usamos `any` controlado dentro de los componentes que tocan la API.
declare global {
  interface Window {
    google?: any;
    __rutiGmapsPromise?: Promise<any>;
  }
}

const SCRIPT_ID = "ruti-gmaps-script";
const LIBRARIES = ["places", "marker"] as const;

export function getGoogleMapsApiKey(): string {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "";
}

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps solo se carga en el navegador"));
  }
  if (window.google?.maps) return Promise.resolve(window.google);
  if (window.__rutiGmapsPromise) return window.__rutiGmapsPromise;

  const key = getGoogleMapsApiKey();
  if (!key) {
    return Promise.reject(
      new Error(
        "Falta VITE_GOOGLE_MAPS_API_KEY en .env. Crea una API key en Google Cloud y habilita Maps JavaScript, Places y Directions."
      )
    );
  }

  window.__rutiGmapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google!));
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps")));
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    const libs = LIBRARIES.join(",");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=${libs}&language=es-PE&region=PE&v=weekly`;
    script.onload = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Google Maps cargó pero no expuso window.google"));
    };
    script.onerror = () => reject(new Error("Error al cargar el script de Google Maps"));
    document.head.appendChild(script);
  });

  return window.__rutiGmapsPromise;
}
