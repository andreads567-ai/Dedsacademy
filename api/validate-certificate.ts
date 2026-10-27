import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const code = (req.query.codigo || req.query.code || req.body?.code) as string;

  if (!code) {
    return res.status(400).json({ error: 'Código de certificado não informado.' });
  }

  try {
    const cleanCode = code.trim().toUpperCase().replace('#', '');
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .ilike('code', cleanCode)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ valid: false, error: 'Certificado não encontrado.' });
    }

    return res.status(200).json({
      valid: data.status === 'valido',
      status: data.status,
      certificate: data,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro interno ao validar certificado' });
  }
}
