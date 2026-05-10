import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres "Ruti", un asistente experto en transporte urbano formal en Perú.
Ayudas a conductores con dudas sobre documentos vehiculares peruanos:
- Licencia de conducir (categorías A-IIa, A-IIIa, etc.) — se tramita en MTC / Touring (https://www.mtc.gob.pe).
- SOAT — Seguro Obligatorio. Se compra en aseguradoras (Pacífico, Rímac, Mapfre, La Positiva) o en línea.
- Revisión Técnica Vehicular — en plantas autorizadas (Lidercon, Las Begonias, etc.). Consulta calendario en https://www.mtc.gob.pe.
- Tarjeta de propiedad — SUNARP / Notaría.
- Autorización ATU — para transporte público en Lima/Callao, https://www.atu.gob.pe.

Responde SIEMPRE en español, en tono cercano y claro, en máximo 4 oraciones.
Si te preguntan cómo subir un archivo: explica que debe estar legible, en JPG/PNG/PDF, idealmente la foto frontal del documento, y luego ingresar la fecha de vencimiento exacta.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    const userMsg = context
      ? `Contexto: el usuario está cargando el documento "${context}".\nPregunta: ${question}`
      : question;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas consultas. Intenta en un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Saldo IA agotado. Contacta al administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del asistente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content ?? "No tengo respuesta en este momento.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ruti-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});