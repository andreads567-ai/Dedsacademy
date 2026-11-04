-- Migration: Criar tabela de auditoria de eventos e webhooks do Stripe / Pagamentos
-- Data: 2026-11-04

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de consulta rápida por tipo de evento e data
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.webhook_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs (created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Permitir inserção via service role / anon no webhook e leitura para auditoria
DROP POLICY IF EXISTS "Permitir inserção de logs de webhook" ON public.webhook_logs;
CREATE POLICY "Permitir inserção de logs de webhook"
  ON public.webhook_logs
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura de logs de webhook por administradores" ON public.webhook_logs;
CREATE POLICY "Permitir leitura de logs de webhook por administradores"
  ON public.webhook_logs
  FOR SELECT
  USING (true);
