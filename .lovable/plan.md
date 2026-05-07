## Plan: Ruti MVP funcional (React + Lovable Cloud)

Voy a convertir el prototipo actual en un MVP funcional equivalente al stack Flutter+Firebase que pediste, usando el stack soportado por Lovable: **React + TanStack Start + Lovable Cloud (Postgres + Auth en tiempo real)** + **Google Maps JS API** + **Web Speech API**.

### Equivalencias de stack

| Tu pedido (Flutter) | Implementación (Lovable) |
|---|---|
| Firebase Auth (Google + Email) | Lovable Cloud Auth (Google + Email/Password) |
| Cloud Firestore | Postgres + Realtime subscriptions |
| `google_maps_flutter` | `@vis.gl/react-google-maps` |
| Google Directions API | Directions API vía fetch desde server function |
| `speech_to_text` | Web Speech API (`SpeechRecognition`) |
| Provider/Riverpod | TanStack Query + React Context |
| Clean Architecture / MVVM | Carpetas: `routes/`, `features/<modulo>/`, `lib/`, `integrations/` |

### Estructura de carpetas
```text
src/
├── routes/                      # páginas (file-based routing)
│   ├── index.tsx                # selección de rol
│   ├── auth.login.tsx
│   ├── _authenticated/
│   │   ├── usuario.solicitar.tsx
│   │   ├── conductor.registro.tsx
│   │   └── conductor.ruta.tsx
│   └── api/public/...
├── features/
│   ├── auth/                    # hooks, contexto de sesión
│   ├── driver/                  # validación docs, alertas vencimiento
│   ├── rides/                   # crear/escuchar rides en realtime
│   └── voice/                   # hook useSpeechRecognition
├── integrations/supabase/       # clients (auto-generados)
├── lib/                         # helpers, validators (zod)
└── components/                  # UI compartida
```

### Esquema de base de datos (Postgres, equivalente a Firestore)

- `profiles` — `id (uid)`, `full_name`, `dni`, `phone`, `role ('user'|'driver')`, `created_at`
- `driver_docs` — `user_id`, `license_type`, `license_expiry`, `plate_number`, `soat_expiry`, `revision_expiry`, `atu_auth`, `is_verified`
- `rides` — `id`, `user_id`, `driver_id`, `start_lat/lng`, `end_lat/lng`, `price`, `status ('pending'|'accepted'|'completed')`, `created_at`

RLS: cada usuario lee/escribe lo suyo; conductores verificados leen `rides` con `status='pending'`. Roles en tabla `user_roles` separada (anti-escalación).

### Módulos (en orden)

**MÓDULO A — Auth + Selección de rol**
- Habilitar Lovable Cloud y activar Google + Email/Password.
- `/auth/login` con tabs (email/password + botón Google).
- Trigger SQL que crea `profiles` al registrarse.
- `/` pide elegir rol y persiste en `profiles.role`.

**MÓDULO B — Conductor: registro asistido + validación docs**
- Formulario `/conductor/registro` con botón micrófono por campo (Web Speech API, es-PE).
- Subida de fechas a `driver_docs`.
- Helper `getDocStatus(date)` → `valid | expiring (<30d) | expired`. Badges rojos automáticos.

**MÓDULO C — Usuario: solicitud por voz + mapa**
- `/usuario/solicitar` con Google Maps.
- Botón mic dicta destino → geocoding → marker.
- Mock de buses cercanos + botón "Solicitar por S/ X" → INSERT en `rides` con `status='pending'`.

**MÓDULO D — Conductor: ruta en tiempo real**
- `/conductor/ruta` con mapa + suscripción Realtime a `rides where status='pending'`.
- Markers de pasajeros en vivo.
- Banner de alertas cuando SOAT/Revisión vencen en <30 días.

### Configuración requerida
1. Acepto el plan → habilito Lovable Cloud (crea Postgres + Auth).
2. Te pediré la **Google Maps API key** (con Maps JavaScript API, Geocoding y Directions habilitadas) como secret runtime.
3. Configuro Google OAuth en el panel de Cloud (te guío).

### Entregable por iteración
Implementaré **Módulo A primero** y esperaré tu OK antes de seguir con B, C y D, tal como pediste para el formato Flutter.
