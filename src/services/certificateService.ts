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
 * Gera um código alfanumérico aleatório único e sem duplicidade.
 * Padrão do gerador oficial: DA{ANO}-{LETRA}{2_DIGITOS}-{3_DIGITOS} (ex: DA2026-C65-728)
 */
export function generateUniqueRandomCertificateCode(
  existingCertificates: CertificateItem[] = [],
  customYear?: number
): string {
  const currentYear = customYear || new Date().getFullYear();
  const existingSet = new Set<string>();

  // Coleta códigos existentes passados por parâmetro
  existingCertificates.forEach((cert) => {
    if (cert?.code) {
      existingSet.add(cert.code.trim().toUpperCase());
    }
  });

  // Coleta também códigos salvos em cache local no navegador
  try {
    const saved = localStorage.getItem(DEDS_CERTIFICATES_STORAGE_KEY);
    if (saved) {
      const parsed: CertificateItem[] = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((c) => {
          if (c?.code) {
            existingSet.add(c.code.trim().toUpperCase());
          }
        });
      }
    }
  } catch (e) {
    // Ignora restrições de localStorage
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let candidate = '';
  let attempts = 0;

  do {
    const letter = chars.charAt(Math.floor(Math.random() * chars.length));
    const mid = String(Math.floor(Math.random() * 90 + 10)); // 2 dígitos (10 a 99)
    const end = String(Math.floor(Math.random() * 900 + 100)); // 3 dígitos (100 a 999)
    candidate = `DA${currentYear}-${letter}${mid}-${end}`;
    attempts++;
  } while (existingSet.has(candidate) && attempts < 1000);

  return candidate;
}

/**
 * Verifica se um código de certificado já existe na lista ou no cache local,
 * desconsiderando o próprio certificado caso fornecido seu ID.
 */
export function isCertificateCodeDuplicate(
  code: string,
  existingCertificates: CertificateItem[] = [],
  currentCertId?: string
): boolean {
  if (!code || !code.trim()) return false;
  const clean = code.trim().toUpperCase();

  const inExisting = existingCertificates.some((cert) => {
    if (!cert || !cert.code) return false;
    if (currentCertId && cert.id === currentCertId) return false;
    return cert.code.trim().toUpperCase() === clean;
  });
  if (inExisting) return true;

  try {
    const saved = localStorage.getItem(DEDS_CERTIFICATES_STORAGE_KEY);
    if (saved) {
      const parsed: CertificateItem[] = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.some((cert) => {
          if (!cert || !cert.code) return false;
          if (currentCertId && cert.id === currentCertId) return false;
          return cert.code.trim().toUpperCase() === clean;
        });
      }
    }
  } catch (e) {}

  return false;
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
      institutionCnpj: cert.institutionCnpj ?? null,
    },
  };
}

/**
 * Converte linha do banco para CertificateItem
 */
export function rowToCertificate(row: Record<string, any>): CertificateItem {
  const rowCnpj = row.institution_cnpj ?? row.metadata?.institutionCnpj ?? undefined;
  const activeSavedCnpj = typeof window !== 'undefined' ? localStorage.getItem('deds_institution_cnpj') : undefined;
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
    institutionCnpj:
      (activeSavedCnpj && activeSavedCnpj.trim()) ||
      (rowCnpj && rowCnpj !== '45.678.901/0001-23' ? rowCnpj : undefined) ||
      rowCnpj ||
      undefined,
  };
}

/**
 * Busca todos os certificados persistidos no servidor Hostinger e cache local
 */
export async function fetchCertificatesFromDB(): Promise<CertificateItem[] | null> {
  try {
    const res = await fetch('/api/platform-sync', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.certificates)) {
        return data.certificates;
      }
    }
  } catch (err) {
    console.info('[CertificateService] Servidor offline ou inicializando, usando cache local:', err);
  }

  // Fallback cache local
  try {
    const localSaved = localStorage.getItem(DEDS_CERTIFICATES_STORAGE_KEY);
    if (localSaved) {
      return JSON.parse(localSaved);
    }
  } catch {}

  return null;
}

/**
 * Salva ou atualiza um certificado no Servidor Hostinger e sincroniza no localStorage
 */
export async function saveCertificateToDB(
  certificate: CertificateItem,
  studentUser?: UserAccount
): Promise<{ success: boolean; certificate: CertificateItem; error?: string }> {
  try {
    // 1. Persistência imediata no localStorage para resiliência instantânea
    let updatedList: CertificateItem[] = [];
    try {
      const localSaved = localStorage.getItem(DEDS_CERTIFICATES_STORAGE_KEY);
      const list: CertificateItem[] = localSaved ? JSON.parse(localSaved) : [];
      updatedList = [
        certificate,
        ...list.filter((c) => c.id !== certificate.id && c.code !== certificate.code),
      ];
      localStorage.setItem(DEDS_CERTIFICATES_STORAGE_KEY, JSON.stringify(updatedList));
      if (certificate.institutionCnpj && certificate.institutionCnpj.trim()) {
        localStorage.setItem('deds_institution_cnpj', certificate.institutionCnpj.trim());
      }
    } catch (e) {
      console.warn('Falha ao salvar no localStorage:', e);
    }

    // 2. Se studentUser fornecido, atualiza lista de cursos concluídos no localStorage
    if (studentUser && certificate.courseId) {
      try {
        const usersRaw = localStorage.getItem('deds_users_list');
        if (usersRaw) {
          const users: UserAccount[] = JSON.parse(usersRaw);
          const uIdx = users.findIndex((u) => u.id === studentUser.id);
          if (uIdx >= 0) {
            const completed = users[uIdx].completedCourseIds || [];
            if (!completed.includes(certificate.courseId)) {
              users[uIdx].completedCourseIds = [...completed, certificate.courseId];
              localStorage.setItem('deds_users_list', JSON.stringify(users));
            }
          }
        }
      } catch {}
    }

    // 3. Sincroniza com o servidor Hostinger
    try {
      await fetch('/api/platform-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'certificates', data: updatedList }),
      });
    } catch (netErr) {
      console.info('[CertificateService] Sincronização em background continuará via offline cache.');
    }

    return { success: true, certificate };
  } catch (error: any) {
    console.error('[saveCertificateToDB Error]', error);
    return { success: false, certificate, error: error.message || 'Erro ao salvar certificado' };
  }
}

/**
 * Consulta a autenticidade de um código no banco de dados com tolerância a formatação
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
  const alphaCode = cleanCode.replace(/[^A-Z0-9]/g, '');

  // 1. Consulta no endpoint de validação oficial do servidor Hostinger
  try {
    const res = await fetch(`/api/validate-certificate?code=${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.certificate) {
        const cert = data.certificate;
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
    }
  } catch (apiErr) {
    console.info('[CertificateService] Servidor offline ou indisponível, validando via cache local:', apiErr);
  }

  // 2. Consulta no cache local e sempre verifica o localStorage atualizado (onde o ADM salva)
  let allLocal: CertificateItem[] = [];
  try {
    const saved = localStorage.getItem(DEDS_CERTIFICATES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) allLocal.push(...parsed);
    }
  } catch {}

  localList.forEach((c) => {
    if (!allLocal.some((exist) => exist.id === c.id || exist.code.toUpperCase() === c.code.toUpperCase())) {
      allLocal.push(c);
    }
  });

  const searchDigits = code.replace(/\D/g, '');

  const found = allLocal.find((c) => {
    const cClean = c.code.trim().toUpperCase().replace('#', '');
    const cAlpha = cClean.replace(/[^A-Z0-9]/g, '');
    const cCpfDigits = (c.studentCpf || '').replace(/\D/g, '');
    return (
      cClean === cleanCode ||
      (alphaCode.length >= 4 && cAlpha === alphaCode) ||
      (searchDigits.length >= 8 && cCpfDigits === searchDigits)
    );
  });

  if (found) {
    const activeSavedCnpj = typeof window !== 'undefined' ? localStorage.getItem('deds_institution_cnpj') : undefined;
    const finalFound: CertificateItem = {
      ...found,
      institutionCnpj:
        (activeSavedCnpj && activeSavedCnpj.trim()) ||
        (found.institutionCnpj && found.institutionCnpj !== '45.678.901/0001-23' ? found.institutionCnpj : undefined) ||
        found.institutionCnpj ||
        '45.678.901/0001-23',
    };
    if (found.status === 'cancelado') {
      return {
        valid: false,
        status: 'cancelled',
        certificate: finalFound,
        reason: found.cancellationReason || 'Certificado revogado pela administração acadêmica.',
      };
    }
    return { valid: true, status: 'valid', certificate: finalFound };
  }

  return { valid: false, status: 'invalid', reason: 'Código de certificado não encontrado nos registros oficiais.' };
}
