import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Mic, MicOff, Upload, CheckCircle2, AlertTriangle, FileText, Bot, HelpCircle, Loader2, Send, X, LogIn, MapPin } from "lucide-react";
import { documentosBase, type DocumentoConductor } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/registro/conductor")({
  component: RegistroConductor,
});

function RegistroConductor() {
  const [step, setStep] = useState<"voz" | "documentos" | "listo">(() => {
    if (typeof window === "undefined") return "voz";
    return (localStorage.getItem("ruti.reg.step") as any) || "voz";
  });

  useEffect(() => {
    localStorage.setItem("ruti.reg.step", step);
  }, [step]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Registro de Conductor" to="/" />
      <main className="max-w-md mx-auto px-4 py-6">
        <Stepper step={step} />
        {step === "voz" && <VozStep onContinue={() => setStep("documentos")} />}
        {step === "documentos" && <DocumentosStep onDone={() => setStep("listo")} />}
        {step === "listo" && <ListoStep />}
        {step !== "listo" && (
          <div className="mt-8 text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogIn className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function Stepper({ step }: { step: "voz" | "documentos" | "listo" }) {
  const steps = [
    { id: "voz", label: "Datos por voz" },
    { id: "documentos", label: "Documentos" },
    { id: "listo", label: "Listo" },
  ] as const;
  const idx = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s.id} className="flex-1 flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              i <= idx ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {i < idx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          <span className={`text-xs ${i <= idx ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s.label}</span>
          {i < steps.length - 1 && <div className={`flex-1 h-px ${i < idx ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

// =============== VOZ (Web Speech API real) ===============

type VozMsg = { from: "agent" | "user"; text: string };

const VOZ_PROMPTS = [
  { key: "full_name", q: "Hola, soy tu asistente Ruti. ¿Cuál es tu nombre completo?" },
  { key: "dni", q: "Perfecto. Ahora dime tu número de DNI, dígito por dígito." },
  { key: "phone", q: "¿Cuál es tu número de celular?" },
  { key: "plate", q: "Excelente. Por último, dime la placa de tu vehículo." },
] as const;

function VozStep({ onContinue }: { onContinue: () => void }) {
  const { user, refreshProfile } = useAuth();
  const [msgs, setMsgs] = useState<VozMsg[]>(() => {
    if (typeof window === "undefined") return [{ from: "agent", text: VOZ_PROMPTS[0].q }];
    try {
      const raw = localStorage.getItem("ruti.reg.msgs");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [{ from: "agent", text: VOZ_PROMPTS[0].q }];
  });
  const [stepIdx, setStepIdx] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("ruti.reg.stepIdx") || "0");
  });
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("ruti.reg.answers") || "{}");
    } catch {
      return {};
    }
  });
  const [saving, setSaving] = useState(false);
  const recognitionRef = useRef<any>(null);
  const supportedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    supportedRef.current = !!SR;
  }, []);

  useEffect(() => {
    localStorage.setItem("ruti.reg.msgs", JSON.stringify(msgs));
  }, [msgs]);
  useEffect(() => {
    localStorage.setItem("ruti.reg.stepIdx", String(stepIdx));
  }, [stepIdx]);
  useEffect(() => {
    localStorage.setItem("ruti.reg.answers", JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, interim]);

  const handleAnswer = (text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    const current = VOZ_PROMPTS[stepIdx];
    let value = cleaned;
    if (current.key === "dni") value = cleaned.replace(/\D/g, "").slice(0, 8);
    if (current.key === "phone") value = cleaned.replace(/\D/g, "").slice(0, 9);
    if (current.key === "plate") value = cleaned.toUpperCase().replace(/\s+/g, "").replace(/[^\w-]/g, "");
    setAnswers((a) => ({ ...a, [current.key]: value }));
    setMsgs((m) => [...m, { from: "user", text: value }]);

    const next = stepIdx + 1;
    if (next < VOZ_PROMPTS.length) {
      setStepIdx(next);
      setTimeout(() => setMsgs((m) => [...m, { from: "agent", text: VOZ_PROMPTS[next].q }]), 400);
    } else {
      setTimeout(() => setMsgs((m) => [...m, { from: "agent", text: "¡Excelente! Ahora vamos a subir tus documentos." }]), 400);
    }
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }
    const rec = new SR();
    rec.lang = "es-PE";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      setInterim(interimText);
      if (finalText) {
        setInterim("");
        handleAnswer(finalText);
      }
    };
    rec.onerror = (e: any) => {
      console.error("speech error", e);
      toast.error("No se pudo escuchar. Revisa el micrófono.");
      setListening(false);
    };
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    setListening(true);
    setInterim("");
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const allAnswered = stepIdx >= VOZ_PROMPTS.length;

  const saveAndContinue = async () => {
    if (!user) return onContinue();
    setSaving(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          full_name: answers.full_name || null,
          dni: answers.dni || null,
          phone: answers.phone || null,
        })
        .eq("id", user.id);
      if (pErr) throw pErr;

      if (answers.plate) {
        const { error: dErr } = await supabase.from("driver_docs").upsert(
          { user_id: user.id, plate_number: answers.plate },
          { onConflict: "user_id" }
        );
        if (dErr && !dErr.message.includes("no unique")) {
          // si no hay constraint, fallback a insert sencillo
          await supabase.from("driver_docs").insert({ user_id: user.id, plate_number: answers.plate });
        }
      }
      await refreshProfile();
      onContinue();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  // Edición manual fallback
  const [manualText, setManualText] = useState("");
  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim() || allAnswered) return;
    handleAnswer(manualText);
    setManualText("");
  };

  return (
    <div>
      <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] mb-3 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground font-medium mb-1">Agente IA Ruti</div>
          <p className="text-foreground text-sm">Toca el micrófono y responde. También puedes escribir si lo prefieres.</p>
        </div>
      </div>

      <div ref={scrollRef} className="bg-secondary/60 rounded-2xl p-4 h-[280px] overflow-y-auto mb-4 space-y-2">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm animate-in fade-in slide-in-from-bottom-2 ${
              m.from === "agent" ? "bg-card text-foreground" : "bg-primary text-primary-foreground ml-auto"
            }`}
          >
            {m.text}
          </div>
        ))}
        {interim && (
          <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-primary/40 text-primary-foreground ml-auto italic">
            {interim}…
          </div>
        )}
      </div>

      {!allAnswered ? (
        <>
          <button
            onClick={listening ? stopListening : startListening}
            className={`relative w-20 h-20 mx-auto rounded-full flex items-center justify-center text-primary-foreground shadow-[var(--shadow-elevated)] transition-[var(--transition-smooth)] ${listening ? "scale-110" : "hover:scale-105"}`}
            style={{ background: "var(--gradient-primary)" }}
          >
            {listening && <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />}
            {listening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            {listening ? "Escuchando…" : "Toca para hablar"}
          </p>

          <form onSubmit={submitManual} className="mt-4 flex gap-2">
            <input
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="O escribe tu respuesta…"
              className="flex-1 px-3 py-2 bg-card border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" className="px-4 rounded-xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      ) : (
        <button
          onClick={saveAndContinue}
          disabled={saving}
          className="w-full mt-2 py-3.5 rounded-xl font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Continuar a documentos"}
        </button>
      )}
    </div>
  );
}

function DocumentosStep({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocumentoConductor[]>(() => {
    if (typeof window === "undefined") return documentosBase;
    try {
      const raw = localStorage.getItem("ruti.reg.docs");
      if (raw) return JSON.parse(raw);
    } catch {}
    return documentosBase;
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem("ruti.reg.docs", JSON.stringify(docs));
  }, [docs]);

  const evaluarEstado = (vencimiento: string): DocumentoConductor["estado"] => {
    if (!vencimiento) return "pendiente";
    const v = new Date(vencimiento);
    const hoy = new Date();
    const diff = (v.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return "vencido";
    if (diff < 30) return "porVencer";
    return "validado";
  };

  const update = (id: string, patch: Partial<DocumentoConductor>) => {
    setDocs((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, ...patch };
        next.estado = next.archivo ? evaluarEstado(next.vencimiento) : "pendiente";
        return next;
      })
    );
  };

  const todosValidados = docs.every((d) => d.estado === "validado" || d.estado === "porVencer");

  const finalizar = async () => {
    if (!user) return onDone();
    setSaving(true);
    try {
      const get = (id: string) => docs.find((d) => d.id === id)?.vencimiento || null;
      const payload = {
        user_id: user.id,
        license_expiry: get("licencia"),
        soat_expiry: get("soat"),
        revision_expiry: get("revision"),
        atu_auth: get("autorizacion"),
      };
      // intentar update primero
      const { error: uErr } = await supabase
        .from("driver_docs")
        .update(payload)
        .eq("user_id", user.id);
      if (uErr) {
        await supabase.from("driver_docs").insert(payload);
      }
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Documentos requeridos</h2>
      <p className="text-sm text-muted-foreground mb-3">Sube cada documento e indica su fecha de vencimiento. Pulsa <HelpCircle className="inline w-3.5 h-3.5" /> si tienes dudas.</p>

      <div className="space-y-3">
        {docs.map((d) => (
          <DocCard key={d.id} doc={d} onUpdate={(patch) => update(d.id, patch)} />
        ))}
      </div>

      <button
        onClick={finalizar}
        disabled={!todosValidados || saving}
        className="w-full mt-6 py-3.5 rounded-xl font-semibold text-primary-foreground disabled:opacity-50 shadow-[var(--shadow-soft)]"
        style={{ background: "var(--gradient-primary)" }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Finalizar registro"}
      </button>
    </div>
  );
}

function DocCard({ doc, onUpdate }: { doc: DocumentoConductor; onUpdate: (p: Partial<DocumentoConductor>) => void }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSeed, setHelpSeed] = useState<string | null>(null);
  const estadoUI = {
    pendiente: { color: "bg-muted text-muted-foreground", icon: FileText, label: "Pendiente" },
    validado: { color: "bg-success/15 text-success", icon: CheckCircle2, label: "Validado" },
    porVencer: { color: "bg-warning/20 text-warning-foreground", icon: AlertTriangle, label: "Por vencer" },
    vencido: { color: "bg-destructive/15 text-destructive", icon: AlertTriangle, label: "Vencido" },
  }[doc.estado];
  const Icon = estadoUI.icon;

  const abrirAyuda = (seed: string | null) => {
    setHelpSeed(seed);
    setHelpOpen(true);
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="font-medium text-foreground text-sm">{doc.nombre}</div>
        </div>
        <button
          type="button"
          onClick={() => abrirAyuda(null)}
          className="text-primary hover:bg-secondary p-1 rounded-md"
          title="Pedir ayuda al asistente IA"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${estadoUI.color}`}>
          <Icon className="w-3 h-3" />
          {estadoUI.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary rounded-lg text-xs font-medium text-foreground cursor-pointer hover:bg-accent transition-[var(--transition-smooth)]">
          <Upload className="w-3.5 h-3.5" />
          {doc.archivo ? "Cambiar" : "Subir"}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpdate({ archivo: f.name });
            }}
          />
        </label>
        <input
          type="date"
          value={doc.vencimiento}
          onChange={(e) => onUpdate({ vencimiento: e.target.value })}
          className="px-2 py-2 text-xs bg-secondary rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
        />
      </div>
      {doc.archivo && (
        <div className="text-xs text-muted-foreground mt-2 truncate">📎 {doc.archivo}</div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          type="button"
          onClick={() => abrirAyuda(`No tengo mi ${doc.nombre} a la mano. ¿Dónde lo tramito paso a paso en Lima y cuánto cuesta?`)}
          className="text-xs px-2 py-2 rounded-lg bg-warning/15 text-warning-foreground border border-warning/30 flex items-center justify-center gap-1 hover:bg-warning/25 transition-[var(--transition-smooth)]"
        >
          <MapPin className="w-3.5 h-3.5" />
          No lo tengo
        </button>
        <button
          type="button"
          onClick={() => abrirAyuda(`No entiendo qué es ${doc.nombre}. Explícamelo en simple y dime si lo necesito para ser conductor en Perú.`)}
          className="text-xs px-2 py-2 rounded-lg bg-secondary text-foreground border border-border flex items-center justify-center gap-1 hover:bg-accent transition-[var(--transition-smooth)]"
        >
          <Bot className="w-3.5 h-3.5" />
          Explícame
        </button>
      </div>

      {helpOpen && <AssistantModal docName={doc.nombre} seedQuestion={helpSeed} onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

function AssistantModal({
  docName,
  seedQuestion,
  onClose,
}: {
  docName: string;
  seedQuestion?: string | null;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  const ask = async (q?: string) => {
    const finalQ = (q ?? question).trim();
    if (!finalQ) return;
    setLoading(true);
    setAnswer(null);
    setLastQuestion(finalQ);
    try {
      const { data, error } = await supabase.functions.invoke("ruti-assistant", {
        body: { question: finalQ, context: docName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnswer(data?.answer ?? "Sin respuesta.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error del asistente");
    } finally {
      setLoading(false);
    }
  };

  // Pre-rellena con la pregunta semilla si llega
  useEffect(() => {
    if (seedQuestion) {
      ask(seedQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedQuestion]);

  const sugerencias = [
    `No tengo mi ${docName}. ¿Dónde lo tramito en Lima y cuánto cuesta?`,
    `¿Qué es ${docName} y por qué lo necesito como conductor?`,
    `¿Cómo subo correctamente mi ${docName}?`,
    "¿Qué formato de archivo se acepta?",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-md shadow-[var(--shadow-elevated)] animate-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">Asistente Ruti</div>
              <div className="text-xs text-muted-foreground truncate max-w-[200px]">Sobre: {docName}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">
          {lastQuestion && (
            <div className="bg-primary text-primary-foreground rounded-xl px-3 py-2 text-sm ml-auto max-w-[90%] w-fit">
              {lastQuestion}
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
              <Loader2 className="w-4 h-4 animate-spin" /> Consultando a la IA…
            </div>
          )}
          {answer && !loading && (
            <div className="bg-secondary/60 rounded-xl p-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {answer}
            </div>
          )}
          {!loading && (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-muted-foreground">Preguntas frecuentes:</p>
              {sugerencias.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="w-full text-left text-sm p-3 rounded-xl bg-secondary hover:bg-accent transition-[var(--transition-smooth)]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); ask(); }}
          className="p-3 border-t border-border flex gap-2"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Escribe tu pregunta…"
            className="flex-1 px-3 py-2 bg-secondary border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" disabled={loading || !question.trim()} className="px-4 rounded-xl text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-primary)" }}>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function ListoStep() {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "var(--gradient-primary)" }}>
        <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">¡Registro completo!</h2>
      <p className="text-muted-foreground mb-6">Ya puedes empezar a recibir solicitudes en tu ruta.</p>
      <Link
        to="/conductor/ruta"
        className="inline-block w-full py-3.5 rounded-xl font-semibold text-primary-foreground shadow-[var(--shadow-soft)]"
        style={{ background: "var(--gradient-primary)" }}
      >
        Ir al panel de conductor
      </Link>
    </div>
  );
}