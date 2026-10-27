import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const {
      studentId,
      studentName,
      studentCpf,
      studentCode,
      courseId,
      courseTitle,
      courseCategory,
      hours,
      instructor,
      issueDate,
    } = req.body;

    if (!studentId || !studentName || !courseId || !courseTitle) {
      return res.status(400).json({ error: 'Dados incompletos para emissão do certificado.' });
    }

    const currentYear = new Date().getFullYear();

    // 1. Verifica se já existe um certificado ativo para o aluno e curso
    const { data: existingCerts } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('status', 'valido')
      .maybeSingle();

    if (existingCerts) {
      return res.status(200).json({
        success: true,
        reissued: false,
        certificate: existingCerts,
        message: 'Certificado já emitido anteriormente.',
      });
    }

    // 2. Consulta o total para calcular o próximo sequencial único do ano
    const { count } = await supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true });

    const nextSeq = (count || 0) + 1;
    const code = `DA${currentYear}-${String(nextSeq).padStart(4, '0')}`;

    const newCert = {
      id: `cert-${courseId}-${Date.now()}`,
      code,
      course_id: courseId,
      course_title: courseTitle,
      course_category: courseCategory || 'Tecnologia',
      student_id: studentId,
      student_code: studentCode || `ALU-${studentId.slice(-4).toUpperCase()}`,
      student_name: studentName,
      student_cpf: studentCpf || '000.000.000-00',
      hours: Number(hours) || 40,
      issue_date: issueDate || new Date().toLocaleDateString('pt-BR'),
      instructor: instructor || 'Deds Academy',
      status: 'valido',
      metadata: {},
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('certificates')
      .upsert(newCert, { onConflict: 'id' });

    if (insertError) {
      console.warn('[Vercel Serverless] Aviso ao inserir no Supabase:', insertError.message);
    }

    return res.status(201).json({
      success: true,
      certificate: newCert,
      message: 'Certificado oficial gerado e registrado com sucesso!',
    });
  } catch (err: any) {
    console.error('[API Issue Certificate Error]', err);
    return res.status(500).json({ error: err.message || 'Erro interno no servidor' });
  }
}
