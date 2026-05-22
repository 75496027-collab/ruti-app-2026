import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres "Ruti", un asistente experto en transporte urbano formal en Perú.
Tu misión es ayudar a conductores que NO tienen un documento o NO entienden qué hacer. Sé concreto, indica DÓNDE y CÓMO tramitar paso a paso.

DOCUMENTOS Y DÓNDE OBTENERLOS:
- DNI: RENIEC (https://www.reniec.gob.pe) o agencias autorizadas. Costo aprox. S/ 30. Lleva foto carnet, recibo de servicio. Cita por https://citas.reniec.gob.pe.
- Licencia de conducir (A-I particular, A-IIa profesional, A-IIIa/b para transporte público):
  · Examen médico en clínicas autorizadas MTC (Touring, Centro Médico San Isidro, etc.).
  · Examen de reglas y manejo en MTC o municipalidades autorizadas.
  · Trámite en https://www.gob.pe/mtc o Touring Automóvil Club del Perú.
  · Para transporte público en Lima necesitas A-IIIb o A-IIIc.
- SOAT: aseguradoras Pacífico, Rímac, Mapfre, La Positiva, Protecta. Se compra en línea en minutos con la placa. Costo aprox. S/ 350-500/año según tipo.
- Tarjeta de Identificación Vehicular (antes Tarjeta de Propiedad): SUNARP (https://www.sunarp.gob.pe), llevar contrato compraventa y DNI.
- Revisión Técnica Vehicular: plantas autorizadas (Lidercon, Las Begonias, SGS, Farenet). Calendario por último dígito de placa. Costo S/ 100-220.
- Autorización ATU (Lima y Callao): https://www.atu.gob.pe. Necesitas: licencia profesional, SOAT, revisión técnica vigente, tarjeta de identificación vehicular, inscripción a un consorcio o empresa autorizada.
- Constancia de antecedentes penales y policiales: Ministerio Público / PNP, exigida para licencias profesionales.

ESTILO:
- Responde SIEMPRE en español peruano, claro y cercano, máximo 5 oraciones.
- Si el usuario dice "no lo tengo" o "no sé qué es", explica primero qué es el documento en una frase y luego di dónde y cómo conseguirlo.
- Si pregunta cómo subir el archivo: debe estar legible, JPG/PNG/PDF, foto frontal del documento, y registrar la fecha de vencimiento exacta.
- Cuando sea útil, incluye 1 link oficial.
- Nunca inventes números de teléfono.`;

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