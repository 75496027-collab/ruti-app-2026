import { useState, useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthContext';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type VoiceRecord = {
  id: string;
  storage_path: string;
  created_at: string;
  url?: string;
};

export function VoiceRecorder() {
  const { user } = useAuth();
  const route = useRouterState();
  const currentPath = route.location.pathname;
  const { isRecording, audioBlob, startRecording, stopRecording, clearAudio } = useAudioRecorder();
  
  const [records, setRecords] = useState<VoiceRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('voice_records')
        .select('*')
        .eq('route_path', currentPath)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Generar URLs firmadas para reproducir
      const recordsWithUrls = await Promise.all(
        (data || []).map(async (record) => {
          const { data: urlData } = await supabase.storage
            .from('voice_notes')
            .createSignedUrl(record.storage_path, 3600); // válido por 1 hora
          return { ...record, url: urlData?.signedUrl };
        })
      );

      setRecords(recordsWithUrls);
    } catch (err) {
      console.error('Error fetching voice records:', err);
      toast.error('Error al cargar las notas de voz');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentPath, user]);

  const handleUpload = async () => {
    if (!audioBlob || !user) return;

    setIsUploading(true);
    try {
      const filename = `${user.id}/${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('voice_notes')
        .upload(filename, audioBlob, {
          contentType: 'audio/webm',
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('voice_records')
        .insert({
          user_id: user.id,
          route_path: currentPath,
          storage_path: filename,
        });

      if (dbError) throw dbError;

      toast.success('Nota de voz guardada correctamente');
      clearAudio();
      fetchRecords(); // Refrescar la lista
    } catch (err) {
      console.error('Error uploading voice note:', err);
      toast.error('No se pudo subir la nota de voz');
    } finally {
      setIsUploading(false);
    }
  };

  // Subir automáticamente cuando el blob de audio está listo (al detener la grabación)
  useEffect(() => {
    if (audioBlob) {
      handleUpload();
    }
  }, [audioBlob]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4 p-4 border border-border/50 rounded-2xl bg-card shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Notas de Voz</h3>
          <p className="text-xs text-muted-foreground">Asociadas a esta pantalla</p>
        </div>
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="icon"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isUploading}
          className={`rounded-full transition-all duration-300 ${isRecording ? 'animate-pulse' : ''}`}
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> :
           isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-2">Cargando...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-xl">
            No hay notas de voz para esta ruta. ¡Graba la primera!
          </p>
        ) : (
          records.map((record) => (
            <div key={record.id} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-xl border border-border/50">
              <span className="text-xs text-muted-foreground font-medium">
                {new Date(record.created_at).toLocaleString()}
              </span>
              {record.url && (
                <audio controls src={record.url} className="w-full h-10" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
