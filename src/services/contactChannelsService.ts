import { SupportChannelsSettings } from '../types';
import { supabase } from '../lib/supabaseClient';

export const DEFAULT_SUPPORT_CHANNELS: SupportChannelsSettings = {
  emails: [
    { id: 'sup', label: 'Suporte & Alunos', email: 'suporte@dedsacademy.com.br' },
    { id: 'fin', label: 'Financeiro & Estornos', email: 'financeiro@dedsacademy.com.br' },
    { id: 'gen', label: 'Contato Geral', email: 'contato@dedsacademy.com.br' },
  ],
  whatsappNumber: '(11) 99999-9999',
  whatsappMessage: 'Olá, gostaria de atendimento sobre a Deds Academy.',
  workingHours: [
    { id: 'wh-1', dayLabel: 'Segunda a Sexta', hours: '08:00 às 20:00' },
    { id: 'wh-2', dayLabel: 'Sábados', hours: '09:00 às 14:00' },
    { id: 'wh-3', dayLabel: 'Domingos e Feriados', hours: 'Plantão via chamados' },
  ],
  supportStatus: 'Operacional',
  supportResponseTime:
    'Atendimento técnico, pedagógico e financeiro especializado. O prazo estimado de resposta varia entre 2 horas (em horário de expediente ou dúvidas críticas) e no máximo 24 horas úteis.',
  lastUpdated: undefined,
};

const STORAGE_KEY = 'deds_contact_channels';

export function getStoredSupportChannels(): SupportChannelsSettings {
  if (typeof window === 'undefined') return DEFAULT_SUPPORT_CHANNELS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SUPPORT_CHANNELS,
        ...parsed,
        emails: Array.isArray(parsed.emails) && parsed.emails.length > 0 ? parsed.emails : DEFAULT_SUPPORT_CHANNELS.emails,
        workingHours:
          Array.isArray(parsed.workingHours) && parsed.workingHours.length > 0
            ? parsed.workingHours
            : DEFAULT_SUPPORT_CHANNELS.workingHours,
      };
    }
  } catch (err) {
    console.error('[contactChannelsService] Erro ao carregar configurações de canais:', err);
  }
  return DEFAULT_SUPPORT_CHANNELS;
}

export function saveStoredSupportChannels(settings: SupportChannelsSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      ...settings,
      lastUpdated: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('deds_contact_channels_updated', { detail: payload }));

    // Persiste também no Supabase
    supabase
      .from('platform_settings')
      .upsert(
        {
          id: 'general',
          support_channels: payload,
          support_whatsapp: payload.whatsappNumber,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .then(({ error }) => {
        if (error) console.warn('[contactChannelsService] Aviso ao persistir no Supabase:', error.message);
      })
      .catch(() => {});
  } catch (err) {
    console.error('[contactChannelsService] Erro ao salvar configurações de canais:', err);
  }
}

export async function syncSupportChannelsFromSupabase(): Promise<SupportChannelsSettings> {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('support_channels, support_whatsapp')
      .eq('id', 'general')
      .maybeSingle();

    if (!error && data) {
      let channels: SupportChannelsSettings | null = null;
      if (data.support_channels && typeof data.support_channels === 'object') {
        channels = data.support_channels;
      }
      if (data.support_whatsapp) {
        if (!channels) channels = { ...DEFAULT_SUPPORT_CHANNELS };
        channels.whatsappNumber = data.support_whatsapp;
      }
      if (channels) {
        const merged: SupportChannelsSettings = {
          ...DEFAULT_SUPPORT_CHANNELS,
          ...channels,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('deds_contact_channels_updated', { detail: merged }));
        } catch {}
        return merged;
      }
    }
  } catch (err) {
    console.warn('[contactChannelsService] Falha ao sincronizar canais do Supabase:', err);
  }
  return getStoredSupportChannels();
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '#';
  const cleanNumber = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${cleanNumber}${textParam}`;
}
