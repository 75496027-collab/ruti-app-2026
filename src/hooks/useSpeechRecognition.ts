import { useCallback, useEffect, useRef, useState } from "react";

type SpeechOpts = {
  lang?: string;
  continuous?: boolean;
  onFinal?: (text: string) => void;
  onInterim?: (text: string) => void;
  onError?: (msg: string) => void;
};

export function useSpeechRecognition(opts: SpeechOpts = {}) {
  const { lang = "es-PE", continuous = false, onFinal, onInterim, onError } = opts;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);
  const callbacksRef = useRef({ onFinal, onInterim, onError });

  useEffect(() => {
    callbacksRef.current = { onFinal, onInterim, onError };
  }, [onFinal, onInterim, onError]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      callbacksRef.current.onError?.("Tu navegador no soporta dictado por voz. Usa Chrome o Edge.");
      return;
    }
    if (recRef.current) {
      try { recRef.current.stop(); } catch {}
    }
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = continuous;

    rec.onresult = (e: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      if (interimText) {
        setInterim(interimText);
        callbacksRef.current.onInterim?.(interimText);
      }
      if (finalText) {
        setInterim("");
        callbacksRef.current.onFinal?.(finalText.trim());
      }
    };
    rec.onerror = (e: any) => {
      callbacksRef.current.onError?.(e?.error || "Error de reconocimiento");
      setListening(false);
    };
    rec.onend = () => setListening(false);

    recRef.current = rec;
    setInterim("");
    setListening(true);
    try {
      rec.start();
    } catch (err) {
      callbacksRef.current.onError?.(err instanceof Error ? err.message : "No se pudo iniciar");
      setListening(false);
    }
  }, [lang, continuous]);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  return { listening, interim, supported, start, stop };
}
