// Estaciones principales del Metropolitano de Lima (BRT).
// Coordenadas aproximadas para mostrar como marcadores en el mapa.

export type MetroStation = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  troncal: "Norte" | "Centro" | "Sur";
};

export const METROPOLITANO_STATIONS: MetroStation[] = [
  { id: "naranjal", nombre: "Naranjal", lat: -11.9931, lng: -77.0613, troncal: "Norte" },
  { id: "izaguirre", nombre: "Izaguirre", lat: -12.0007, lng: -77.0607, troncal: "Norte" },
  { id: "pacifico", nombre: "Pacífico", lat: -12.0078, lng: -77.0603, troncal: "Norte" },
  { id: "independencia", nombre: "Independencia", lat: -12.0119, lng: -77.0594, troncal: "Norte" },
  { id: "tomas-valle", nombre: "Tomás Valle", lat: -12.0185, lng: -77.0588, troncal: "Norte" },
  { id: "el-milagro", nombre: "El Milagro", lat: -12.0252, lng: -77.0581, troncal: "Norte" },
  { id: "honorio-delgado", nombre: "Honorio Delgado", lat: -12.0314, lng: -77.0572, troncal: "Norte" },
  { id: "uni", nombre: "UNI", lat: -12.0378, lng: -77.0561, troncal: "Norte" },
  { id: "caqueta", nombre: "Caquetá", lat: -12.0489, lng: -77.0532, troncal: "Norte" },
  { id: "2-mayo", nombre: "Dos de Mayo", lat: -12.0518, lng: -77.0492, troncal: "Centro" },
  { id: "quilca", nombre: "Quilca", lat: -12.0532, lng: -77.0435, troncal: "Centro" },
  { id: "central", nombre: "Estación Central", lat: -12.0598, lng: -77.0376, troncal: "Centro" },
  { id: "estadio", nombre: "Estadio Nacional", lat: -12.0676, lng: -77.0335, troncal: "Centro" },
  { id: "mexico", nombre: "México", lat: -12.0738, lng: -77.0312, troncal: "Centro" },
  { id: "canada", nombre: "Canadá", lat: -12.0801, lng: -77.0285, troncal: "Centro" },
  { id: "javier-prado", nombre: "Javier Prado", lat: -12.0901, lng: -77.0238, troncal: "Sur" },
  { id: "canaval-moreyra", nombre: "Canaval y Moreyra", lat: -12.0961, lng: -77.0213, troncal: "Sur" },
  { id: "aramburu", nombre: "Aramburú", lat: -12.1015, lng: -77.0192, troncal: "Sur" },
  { id: "domingo-orue", nombre: "Domingo Orué", lat: -12.1075, lng: -77.0171, troncal: "Sur" },
  { id: "angamos", nombre: "Angamos", lat: -12.1124, lng: -77.0156, troncal: "Sur" },
  { id: "ricardo-palma", nombre: "Ricardo Palma", lat: -12.1184, lng: -77.0148, troncal: "Sur" },
  { id: "benavides", nombre: "Benavides", lat: -12.1247, lng: -77.0148, troncal: "Sur" },
  { id: "28-julio", nombre: "28 de Julio", lat: -12.1305, lng: -77.0148, troncal: "Sur" },
  { id: "plaza-flores", nombre: "Plaza de Flores", lat: -12.1366, lng: -77.0158, troncal: "Sur" },
  { id: "balta", nombre: "Balta", lat: -12.1432, lng: -77.0171, troncal: "Sur" },
  { id: "bulevar", nombre: "Bulevar", lat: -12.1505, lng: -77.0184, troncal: "Sur" },
  { id: "estadio-union", nombre: "Estadio Unión", lat: -12.1568, lng: -77.0192, troncal: "Sur" },
  { id: "escuela-militar", nombre: "Escuela Militar", lat: -12.1648, lng: -77.0185, troncal: "Sur" },
  { id: "teran", nombre: "Terán", lat: -12.1718, lng: -77.0156, troncal: "Sur" },
  { id: "rosario-villa", nombre: "Rosario del Villa", lat: -12.1789, lng: -77.0132, troncal: "Sur" },
  { id: "matellini", nombre: "Matellini", lat: -12.1864, lng: -77.0095, troncal: "Sur" },
];

const R_EARTH_KM = 6371;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sin1 = Math.sin(dLat / 2);
  const sin2 = Math.sin(dLng / 2);
  const h = sin1 * sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2 * sin2;
  return 2 * R_EARTH_KM * Math.asin(Math.sqrt(h));
}

export function nearestMetroStation(point: { lat: number; lng: number }): {
  station: MetroStation;
  distanceKm: number;
} {
  let best = METROPOLITANO_STATIONS[0];
  let bestDist = haversineKm(point, best);
  for (let i = 1; i < METROPOLITANO_STATIONS.length; i++) {
    const d = haversineKm(point, METROPOLITANO_STATIONS[i]);
    if (d < bestDist) {
      best = METROPOLITANO_STATIONS[i];
      bestDist = d;
    }
  }
  return { station: best, distanceKm: bestDist };
}
