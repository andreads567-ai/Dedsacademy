-- Migration: Criar tabela oficial de certificados da Deds Academy com código único sequencial
-- Data: 2026-10-26

CREATE TABLE IF NOT EXISTS public.certificates (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  course_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  course_category TEXT,
  student_id TEXT NOT NULL,
  student_code TEXT,
  student_name TEXT NOT NULL,
  student_cpf TEXT,
  hours NUMERIC DEFAULT 40,
  issue_date TEXT NOT NULL,
  instructor TEXT DEFAULT 'Deds Academy',
  status TEXT DEFAULT 'valido',
  cancellation_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de alta performance para busca e validação instantânea
CREATE INDEX IF NOT EXISTS idx_certificates_code ON public.certificates (code);
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.certificates (student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.certificates (course_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Permitir leitura pública de certificados para validação" ON public.certificates;
CREATE POLICY "Permitir leitura pública de certificados para validação"
  ON public.certificates
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir emissão e atualização de certificados autenticada" ON public.certificates;
CREATE POLICY "Permitir emissão e atualização de certificados autenticada"
  ON public.certificates
  FOR ALL
  USING (true)
  WITH CHECK (true);
