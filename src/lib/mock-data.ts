export type Bus = {
  id: string;
  placa: string;
  conductor: string;
  rating: number;
  asientos: number;
  precio: number;
  etaMin: number;
  ruta: string;
  soatVigente: boolean;
  licenciaVigente: boolean;
  revisionTecnica: boolean;
  autorizacionATU: boolean;
};

export const busesMock: Bus[] = [
  {
    id: "b1",
    placa: "ABC-123",
    conductor: "Carlos Mendoza Ríos",
    rating: 4.8,
    asientos: 12,
    precio: 3.5,
    etaMin: 4,
    ruta: "Línea 12 — Centro",
    soatVigente: true,
    licenciaVigente: true,
    revisionTecnica: true,
    autorizacionATU: true,
  },
  {
    id: "b2",
    placa: "XYZ-789",
    conductor: "María López Torres",
    rating: 4.6,
    asientos: 8,
    precio: 2.8,
    etaMin: 7,
    ruta: "Línea 8 — Av. Brasil",
    soatVigente: true,
    licenciaVigente: true,
    revisionTecnica: true,
    autorizacionATU: true,
  },
  {
    id: "b3",
    placa: "DEF-456",
    conductor: "José Quispe Huamán",
    rating: 4.9,
    asientos: 15,
    precio: 4.0,
    etaMin: 2,
    ruta: "Línea 22 — Express",
    soatVigente: true,
    licenciaVigente: true,
    revisionTecnica: true,
    autorizacionATU: true,
  },
];

export type Pasajero = {
  id: string;
  nombre: string;
  cantidad: number;
  punto: string;
  x: number; // % en mapa
  y: number;
};

export const pasajerosMock: Pasajero[] = [
  { id: "p1", nombre: "Ana", cantidad: 2, punto: "Av. Arequipa 1200", x: 25, y: 30 },
  { id: "p2", nombre: "Luis", cantidad: 1, punto: "Jr. Lampa 450", x: 55, y: 50 },
  { id: "p3", nombre: "Sofía", cantidad: 3, punto: "Av. Brasil 890", x: 70, y: 25 },
  { id: "p4", nombre: "Diego", cantidad: 1, punto: "Av. Javier Prado", x: 40, y: 70 },
  { id: "p5", nombre: "Rosa", cantidad: 2, punto: "Plaza San Martín", x: 80, y: 65 },
];

export type DocumentoConductor = {
  id: string;
  nombre: string;
  archivo: string | null;
  vencimiento: string;
  estado: "pendiente" | "validado" | "vencido" | "porVencer";
};

export const documentosBase: DocumentoConductor[] = [
  { id: "dni", nombre: "DNI", archivo: null, vencimiento: "", estado: "pendiente" },
  { id: "licencia", nombre: "Licencia de conducir", archivo: null, vencimiento: "", estado: "pendiente" },
  { id: "placa", nombre: "Placa de rodaje", archivo: null, vencimiento: "", estado: "pendiente" },
  { id: "tarjeta", nombre: "Tarjeta de identificación vehicular (ATU)", archivo: null, vencimiento: "", estado: "pendiente" },
  { id: "soat", nombre: "SOAT vigente", archivo: null, vencimiento: "", estado: "pendiente" },
  { id: "revision", nombre: "Revisión técnica", archivo: null, vencimiento: "", estado: "pendiente" },
  { id: "autorizacion", nombre: "Autorización de operación ATU", archivo: null, vencimiento: "", estado: "pendiente" },
];