import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Mic, MicOff, Upload, CheckCircle2, AlertTriangle, FileText, Bot } from "lucide-react";
import { documentosBase, type DocumentoConductor } from "@/lib/mock-data";

export const Route = createFileRoute("/registro/conductor")({
  component: RegistroConductor,
});

function RegistroConductor() {
  const [step, setStep] = useState<"voz" | "documentos" | "listo">("voz");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);

  const fakeAgentLines = [
    "Hola, soy tu asistente Ruti. ¿Cuál es tu nombre completo?",
    "Perfecto. Ahora dime tu número de DNI.",
    "Excelente. ¿Cuál es la placa de tu vehículo?",
    "Listo. Vamos a subir tus documentos.",
  ];

  const handleMic = () => {
    setListening(true);
    setTimeout(() => {
      setTranscript((t) => [...t, fakeAgentLines[t.length] || ""]);
      setListening(false);
      if (transcript.length + 1 >= fakeAgentLines.length) {
        setTimeout(() => setStep("documentos"), 800);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Registro de Conductor" />
      <main className="max-w-md mx-auto px-4 py-6">
        {step === "voz" && (
          <VozStep listening={listening} transcript={transcript} onMic={handleMic} onSkip={() => setStep("documentos")} />
        )}
        {step === "documentos" && <DocumentosStep onDone={() => setStep("listo")} />}
        {step === "listo" && <ListoStep />}
      </main>
    </div>
  );
}

function VozStep({ listening, transcript, onMic, onSkip }: { listening: boolean; transcript: string[]; onMic: () => void; onSkip: () => void }) {
  return (
    <div>
      <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-soft)] mb-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground font-medium mb-1">Agente IA Ruti</div>
          <p className="text-foreground text-sm">Te guiaré paso a paso. Toca el micrófono y responde con tu voz.</p>
        </div>
      </div>

      <div className="bg-secondary/60 rounded-2xl p-4 min-h-[180px] mb-6 space-y-2">
        {transcript.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-12">La conversación aparecerá aquí…</p>
        )}
        {transcript.map((t, i) => (
          <div key={i} className="bg-card rounded-xl px-3 py-2 text-sm text-foreground shadow-sm animate-in fade-in slide-in-from-bottom-2">
            {t}
          </div>
        ))}
      </div>

      <button
        onClick={onMic}
        disabled={listening}
        className={`relative w-24 h-24 mx-auto rounded-full flex items-center justify-center text-primary-foreground shadow-[var(--shadow-elevated)] transition-[var(--transition-smooth)] ${listening ? "scale-110" : "hover:scale-105"}`}
        style={{ background: "var(--gradient-primary)" }}
      >
        {listening && <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />}
        {listening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
      </button>
      <p className="text-center text-sm text-muted-foreground mt-3">{listening ? "Escuchando…" : "Toca para hablar"}</p>

      <button onClick={onSkip} className="w-full mt-8 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-[var(--transition-smooth)]">
        Saltar y subir documentos
      </button>
    </div>
  );
}

function DocumentosStep({ onDone }: { onDone: () => void }) {
  const [docs, setDocs] = useState<DocumentoConductor[]>(documentosBase);

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

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Documentos requeridos</h2>
      <p className="text-sm text-muted-foreground mb-5">Sube cada documento e indica su fecha de vencimiento.</p>

      <div className="space-y-3">
        {docs.map((d) => (
          <DocCard key={d.id} doc={d} onUpdate={(patch) => update(d.id, patch)} />
        ))}
      </div>

      <button
        onClick={onDone}
        disabled={!todosValidados}
        className="w-full mt-6 py-3.5 rounded-xl font-semibold text-primary-foreground disabled:opacity-50 shadow-[var(--shadow-soft)]"
        style={{ background: "var(--gradient-primary)" }}
      >
        Finalizar registro
      </button>
    </div>
  );
}

function DocCard({ doc, onUpdate }: { doc: DocumentoConductor; onUpdate: (p: Partial<DocumentoConductor>) => void }) {
  const estadoUI = {
    pendiente: { color: "bg-muted text-muted-foreground", icon: FileText, label: "Pendiente" },
    validado: { color: "bg-success/15 text-success", icon: CheckCircle2, label: "Validado" },
    porVencer: { color: "bg-warning/20 text-warning-foreground", icon: AlertTriangle, label: "Por vencer" },
    vencido: { color: "bg-destructive/15 text-destructive", icon: AlertTriangle, label: "Vencido" },
  }[doc.estado];
  const Icon = estadoUI.icon;

  return (
    <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="font-medium text-foreground text-sm">{doc.nombre}</div>
        </div>
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