import { supabase } from '../lib/supabaseClient';
import type { CertificateItem, UserAccount } from '../types';

export const DEDS_CERTIFICATES_STORAGE_KEY = 'deds_certificates_list';

/**
 * Gera um código sequencial único para o certificado.
 * Padrão: DA{ANO}-{SEQUENCIA_4_DIGITOS} (ex: DA2026-0001, DA2026-0002)
 */
export function generateSequentialCertificateCode(
  existingCertificates: CertificateItem[] = [],
  customYear?: number
): string {
  const currentYear = customYear || new Date().getFullYear();
  const yearPrefix = `DA${currentYear}-`;

  // Localiza o maior número sequencial existente para o ano corrente
  let maxSequence = 0;

  existingCertificates.forEach((cert) => {
    if (!cert || !cert.code) return;

    // Normaliza código (remove espaços e caracteres indesejados)
    const code = cert.code.toUpperCase().trim();

    // Regex para capturar padrões: DA2026-0001, DA-2026-0001, DEDS-2026-0001, etc.
    const match =
      code.match(new RegExp(`^DA-?${currentYear}-(\\d+)`)) ||
      code.match(new RegExp(`^DEDS-?${currentYear}-(\\d+)`)) ||
      code.match(/(\d{4})-(\d+)$/);

    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSequence) {
        maxSequence = num;
      }
    } else if (match && match[2]) {
      const num = parseInt(match[2], 10);
      if (!isNaN(num) && num > maxSequence) {
        maxSequence = num;
      }
    }
  });

  const nextSequence = maxSequence + 1;
  const paddedSequence = String(nextSequence).padStart(4, '0');
  return `DA${currentYear}-${paddedSequence}`;
}

/**
 * Converte CertificateItem para formato de linha do Supabase
 */
export function certificateToRow(cert: CertificateItem) {
  return {
    id: cert.id,
    code: cert.code,
    course_id: cert.courseId,
    course_title: cert.courseTitle,
    course_category: cert.courseCategory ?? null,
    student_id: cert.studentId,
    student_code: cert.studentCode ?? null,
    student_name: cert.studentName,
    student_cpf: cert.studentCpf ?? null,
    hours: cert.hours,
    issue_date: cert.issueDate,
    instructor: cert.instructor,
    status: cert.status ?? 'valido',
    cancellation_reason: cert.cancellationReason ?? null,
    metadata: {
      cancelledAt: cert.cancelledAt ?? null,
    },
  };
}

/**
 * Converte linha do banco para CertificateItem
 */
export function rowToCertificate(row: Record<string, any>): CertificateItem {
  return {
    id: row.id,
    code: row.code,
    courseId: row.course_id,
    courseTitle: row.course_title,
    courseCategory: row.course_category ?? undefined,
    studentId: row.student_id,
    studentCode: row.student_code ?? '',
    studentName: row.student_name,
    studentCpf: row.student_cpf ?? '',
    hours: Number(row.hours) || 40,
    issueDate: row.issue_date,
    instructor: row.instructor ?? 'Deds Academy',
    status: (row.status as 'valido' | 'cancelado') ?? 'valido',
    cancellationReason: row.cancellation_reason ?? undefined,
    cancelledAt: row.metadata?.cancelledAt ?? undefined,
  };
}

/**
 * Busca todos os certificados persistidos no Supabase
 */
export async function fetchCertificatesFromDB(): Promise<CertificateItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Se tabela ainda não foi criada, registra aviso discreto
      console.warn('[Supabase] fetchCertificates avisou:', error.message);
      return null;
    }

    if (!data) return null;
    return data.map(rowToCertificate);
  } catch (err) {
    console.warn('[Supabase] Erro ao consultar certificados:', err);
    return null;
  }
}

/**
 * Salva ou atualiza um certificado no Supabase e sincroniza no localStorage
 */
export async function saveCertificateToDB(
  certificate: CertificateItem,
  studentUser?: UserAccount
): Promise<{ success: boolean; certificate: CertificateItem; error?: string }> {
  try {
    // 1. Tenta salvar na tabela dedicada 'certificates'
    const row = certificateToRow(certificate);
    const { error: certError } = await supabase
      .from('certificates')
      .upsert(row, { onConflict: 'id' });

    if (certError) {
      console.warn('[Supabase] Aviso ao gravar na tabela certificates (usando fallback seguro):', certError.message);
    }

    // 2. Se o aluno foi fornecido ou temos seu ID, atualiza cursos concluídos no perfil do usuário
    if (studentUser || certificate.studentId) {
      const studentId = studentUser?.id || certificate.studentId;
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', studentId)
          .maybeSingle();

        if (userData) {
          const currentCompleted: string[] = userData.completed_course_ids || [];
          if (!currentCompleted.includes(certificate.courseId)) {
            await supabase
              .from('users')
              .update({
                completed_course_ids: [...currentCompleted, certificate.courseId],
              })
              .eq('id', studentId);
          }
        }
      } catch (userSyncErr) {
        console.warn('[Supabase] Sincronização de usuário concluído avisou:', userSyncErr);
      }
    }

    // 3. Persistência de redundância no localStorage para resiliência offline
    try {
      const localSaved = localStorage.getItem(DEDS_CERTIFICATES_STORAGE_KEY);
      const list: CertificateItem[] = localSaved ? JSON.parse(localSaved) : [];
      const updatedList = [
        certificate,
        ...list.filter((c) => c.id !== certificate.id && c.code !== certificate.code),
      ];
      localStorage.setItem(DEDS_CERTIFICATES_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Falha ao salvar no localStorage:', e);
    }

    return { success: true, certificate };
  } catch (error: any) {
    console.error('[Supabase saveCertificateToDB Error]', error);
    return { success: false, certificate, error: error.message || 'Erro ao salvar certificado' };
  }
}

/**
 * Consulta a autenticidade de um código no banco de dados
 */
export async function validateCertificateInDB(
  code: string,
  localList: CertificateItem[] = []
): Promise<{
  valid: boolean;
  status: 'valid' | 'cancelled' | 'invalid';
  certificate?: CertificateItem;
  reason?: string;
}> {
  const cleanCode = code.trim().toUpperCase().replace('#', '');

  // 1. Consulta no Supabase
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .ilike('code', cleanCode)
      .maybeSingle();

    if (!error && data) {
      const cert = rowToCertificate(data);
      if (cert.status === 'cancelado') {
        return {
          valid: false,
          status: 'cancelled',
          certificate: cert,
          reason: cert.cancellationReason || 'Certificado revogado pela administração acadêmica.',
        };
      }
      return { valid: true, status: 'valid', certificate: cert };
    }
  } catch (dbErr) {
    console.warn('[Supabase] Falha ao consultar código online, buscando em cache local:', dbErr);
  }

  // 2. Consulta no cache local de certificados
  const found = localList.find((c) => c.code.trim().toUpperCase().replace('#', '') === cleanCode);
  if (found) {
    if (found.status === 'cancelado') {
      return {
        valid: false,
        status: 'cancelled',
        certificate: found,
        reason: found.cancellationReason || 'Certificado revogado pela administração acadêmica.',
      };
    }
    return { valid: true, status: 'valid', certificate: found };
  }

  return { valid: false, status: 'invalid', reason: 'Código de certificado não encontrado nos registros oficiais.' };
}
