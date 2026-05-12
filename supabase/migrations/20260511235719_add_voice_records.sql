-- Crear tabla para los registros de voz
CREATE TABLE public.voice_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    route_path TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.voice_records ENABLE ROW LEVEL SECURITY;

-- Políticas para voice_records: los usuarios solo pueden ver y crear sus propios audios
CREATE POLICY "voice_records_select_own" ON public.voice_records 
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "voice_records_insert_own" ON public.voice_records 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "voice_records_delete_own" ON public.voice_records 
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Configurar el bucket de Storage para las notas de voz (voice_notes)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice_notes', 'voice_notes', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para objects en el bucket voice_notes
-- Nota: Asumimos que los archivos se guardan en la ruta: user_id/filename.ext
CREATE POLICY "Users can upload their own voice notes" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'voice_notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own voice notes" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'voice_notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone authenticated can read voice notes" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'voice_notes');
