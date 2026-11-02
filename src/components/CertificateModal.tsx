import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { CertificateItem, UserAccount } from '../types';
import {
  downloadCertificatePdf,
  downloadCertificatePng,
  OFFICIAL_FRONT_BG,
  OFFICIAL_BACK_BG,
} from '../utils/certificateGenerator';
import { validateCertificateInDB } from '../services/certificateService';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificatesList?: CertificateItem[];
  initialCode?: string;
  students?: UserAccount[];
}

/**
 * Máscara de sigilo do CPF para conformidade com a LGPD
 * Exemplo: '384.920.118-04' -> '384.XXX.XXX-04'
 */
export const maskCpf = (rawCpf?: string): string => {
  if (!rawCpf) return 'XXX.XXX.XXX-XX';
  const clean = rawCpf.trim();
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.XXX.XXX-${digits.slice(9, 11)}`;
  }
  const parts = clean.split(/[-.]/);
  if (parts.length >= 4) {
    return `${parts[0]}.XXX.XXX-${parts[3]}`;
  }
  return clean.replace(/^(\d{3}).*(\d{2})$/, '$1.XXX.XXX-$2');
};

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  certificatesList = [],
  initialCode,
  students = [],
}) => {
  const [certCode, setCertCode] = useState<string>('');
  const [viewMode, setViewMode] = useState<'ambos' | 'frente' | 'verso'>('ambos');
  const [isValidating, setIsValidating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const [validationResult, setValidationResult] = useState<{
    status: 'valid' | 'invalid' | 'cancelled' | 'idle';
    studentName: string;
    studentCpf: string;
    studentCode: string;
    courseName: string;
    courseCategory: string;
    workload: string;
    hoursNumber: number;
    issuedDate: string;
    instructor: string;
    code: string;
    institutionCnpj?: string;
    signatureImage?: string | null;
    cancellationReason?: string;
    cancelledAt?: string;
  }>({
    status: 'idle',
    studentName: '',
    studentCpf: '',
    studentCode: '',
    courseName: '',
    courseCategory: '',
    workload: '',
    hoursNumber: 0,
    issuedDate: '',
    instructor: '',
    code: '',
  });

  const institutionCnpj =
    (typeof window !== 'undefined' ? localStorage.getItem('deds_institution_cnpj') : null)?.trim() ||
    (validationResult.institutionCnpj && validationResult.institutionCnpj !== '45.678.901/0001-23'
      ? validationResult.institutionCnpj
      : null) ||
    validationResult.institutionCnpj ||
    '45.678.901/0001-23';

  // URL dinâmica para exibição fiel do certificado no gerador oficial incorporado
  const generatorIframeUrl = useMemo(() => {
    if (validationResult.status !== 'valid' && validationResult.status !== 'cancelled') return '';
    const p = new URLSearchParams();
    p.set('nome', validationResult.studentName || 'Aluno');
    p.set('cpf', validationResult.studentCpf || '');
    p.set('cnpj', institutionCnpj);
    p.set('curso', validationResult.courseName || '');
    p.set('horas', validationResult.workload || `${validationResult.hoursNumber} Horas`);
    p.set('data', validationResult.issuedDate || '');
    p.set('codigo', validationResult.code || '');
    p.set('url', `${window.location.origin}/validar-certificado`);
    p.set('preview', '1');
    p.set('readonly', '1');
    p.set('lado', viewMode);
    return `/certificate-generator/index.html?${p.toString()}`;
  }, [validationResult, institutionCnpj, viewMode]);

  // Função central para executar a validação de um código ou termo digitado
  const executeValidation = async (searchQuery: string) => {
    const rawClean = searchQuery.trim();
    if (!rawClean) {
      setValidationResult((prev) => ({ ...prev, status: 'idle' }));
      return;
    }

    setIsValidating(true);
    const cleanNoHash = rawClean.replace('#', '').trim();
    const cleanLower = cleanNoHash.toLowerCase();
    const cleanAlpha = cleanLower.replace(/[^a-z0-9]/g, '');
    const searchDigits = rawClean.replace(/\D/g, '');

    // 1. Sempre carrega a lista viva e atualizada do localStorage (onde o painel ADM grava)
    let allCerts: CertificateItem[] = [];
    try {
      const savedStorage = localStorage.getItem('deds_certificates_list');
      if (savedStorage) {
        const parsed: CertificateItem[] = JSON.parse(savedStorage);
        if (Array.isArray(parsed)) allCerts.push(...parsed);
      }
    } catch {}

    certificatesList.forEach((item) => {
      if (!allCerts.some((c) => c.id === item.id || c.code.toLowerCase() === item.code.toLowerCase())) {
        allCerts.push(item);
      }
    });

    // 2. Consulta no Supabase com tolerância a formatação e traços
    try {
      const dbCheck = await validateCertificateInDB(cleanNoHash, allCerts);
      const savedCnpjFallback = typeof window !== 'undefined' ? localStorage.getItem('deds_institution_cnpj') : null;
      const resolveEffectiveCnpj = (certCnpj?: string) => {
        if (savedCnpjFallback && savedCnpjFallback.trim()) {
          return savedCnpjFallback.trim();
        }
        if (certCnpj && certCnpj.trim() && certCnpj.trim() !== '45.678.901/0001-23') {
          return certCnpj.trim();
        }
        return certCnpj?.trim() || '45.678.901/0001-23';
      };

      if (dbCheck.valid && dbCheck.certificate) {
        const c = dbCheck.certificate;
        const matchingStudent = students.find(
          (s) => s.id === c.studentId || s.name.toLowerCase() === c.studentName.toLowerCase()
        );
        setValidationResult({
          status: 'valid',
          studentName: c.studentName,
          studentCpf: c.studentCpf || matchingStudent?.cpf || '384.920.118-04',
          studentCode: c.studentCode || matchingStudent?.studentCode || 'ALU-8921',
          courseName: c.courseTitle,
          courseCategory: c.courseCategory || 'Certificação Profissional',
          workload: `${c.hours} Horas`,
          hoursNumber: c.hours,
          issuedDate: c.issueDate,
          instructor: c.instructor || 'Coordenação Acadêmica Deds',
          code: c.code,
          institutionCnpj: resolveEffectiveCnpj(c.institutionCnpj),
          signatureImage: matchingStudent?.certificateData?.signatureImage || null,
        });
        setIsValidating(false);
        return;
      }

      if (dbCheck.status === 'cancelled' && dbCheck.certificate) {
        const c = dbCheck.certificate;
        setValidationResult({
          status: 'cancelled',
          studentName: c.studentName,
          studentCpf: c.studentCpf || '384.920.118-04',
          studentCode: c.studentCode || 'ALU-8921',
          courseName: c.courseTitle,
          courseCategory: c.courseCategory || 'Certificação Profissional',
          workload: `${c.hours} Horas`,
          hoursNumber: c.hours,
          issuedDate: c.issueDate,
          instructor: c.instructor || 'Coordenação Acadêmica Deds',
          code: c.code,
          institutionCnpj: resolveEffectiveCnpj(c.institutionCnpj),
          cancellationReason: dbCheck.reason || c.cancellationReason || 'Revogado pela administração acadêmica.',
          cancelledAt: c.cancelledAt || 'Registrado no sistema',
        });
        setIsValidating(false);
        return;
      }
    } catch (e) {
      console.warn('Erro ao consultar banco, usando busca direta em certificados:', e);
    }

    // 3. Busca abrangente na lista local (por código alfanumérico, CPF, matrícula ou nome)
    const savedCnpjFallback = typeof window !== 'undefined' ? localStorage.getItem('deds_institution_cnpj') : null;
    const resolveEffectiveCnpj = (certCnpj?: string) => {
      if (savedCnpjFallback && savedCnpjFallback.trim()) {
        return savedCnpjFallback.trim();
      }
      if (certCnpj && certCnpj.trim() && certCnpj.trim() !== '45.678.901/0001-23') {
        return certCnpj.trim();
      }
      return certCnpj?.trim() || '45.678.901/0001-23';
    };

    const foundCert = allCerts.find((c) => {
      const cCodeClean = c.code.replace('#', '').trim().toLowerCase();
      const cAlpha = cCodeClean.replace(/[^a-z0-9]/g, '');
      const cCpfClean = (c.studentCpf || '').replace(/\D/g, '');
      const cStudentCode = (c.studentCode || '').toLowerCase();
      const cStudentName = (c.studentName || '').toLowerCase();

      return (
        cCodeClean === cleanLower ||
        (cleanAlpha.length >= 4 && cAlpha === cleanAlpha) ||
        (searchDigits.length >= 8 && cCpfClean === searchDigits) ||
        (cStudentCode && cStudentCode === cleanLower) ||
        (cleanLower.length >= 4 && cStudentName.includes(cleanLower))
      );
    });

    if (foundCert) {
      const matchingStudent = students.find(
        (s) => s.id === foundCert.studentId || s.name.toLowerCase() === foundCert.studentName.toLowerCase()
      );
      if (foundCert.status === 'cancelado') {
        setValidationResult({
          status: 'cancelled',
          studentName: foundCert.studentName,
          studentCpf: foundCert.studentCpf || matchingStudent?.cpf || '384.920.118-04',
          studentCode: foundCert.studentCode || matchingStudent?.studentCode || 'ALU-8921',
          courseName: foundCert.courseTitle,
          courseCategory: foundCert.courseCategory || 'Certificação Profissional',
          workload: `${foundCert.hours} Horas`,
          hoursNumber: foundCert.hours,
          issuedDate: foundCert.issueDate,
          instructor: foundCert.instructor || 'Coordenação Acadêmica Deds',
          code: foundCert.code,
          institutionCnpj: resolveEffectiveCnpj(foundCert.institutionCnpj),
          cancellationReason: foundCert.cancellationReason || 'Revogado pela coordenação pedagógica',
          cancelledAt: foundCert.cancelledAt || 'Registrado no sistema',
        });
      } else {
        setValidationResult({
          status: 'valid',
          studentName: foundCert.studentName,
          studentCpf: foundCert.studentCpf || matchingStudent?.cpf || '384.920.118-04',
          studentCode: foundCert.studentCode || matchingStudent?.studentCode || 'ALU-8921',
          courseName: foundCert.courseTitle,
          courseCategory: foundCert.courseCategory || 'Certificação Profissional',
          workload: `${foundCert.hours} Horas`,
          hoursNumber: foundCert.hours,
          issuedDate: foundCert.issueDate,
          instructor: foundCert.instructor || 'Coordenação Acadêmica Deds',
          code: foundCert.code,
          institutionCnpj: resolveEffectiveCnpj(foundCert.institutionCnpj),
          signatureImage: matchingStudent?.certificateData?.signatureImage || null,
        });
      }
      setIsValidating(false);
      return;
    }

    // 3. Fallback especial para códigos de homologação se digitados exatamente
    if (cleanLower === 'da-2025-99841' || cleanLower === 'da202599841') {
      setValidationResult({
        status: 'valid',
        studentName: 'Lucas M. Silveira',
        studentCpf: '384.920.118-04',
        studentCode: 'ALU-8921',
        courseName: 'Inteligência Artificial & Machine Learning',
        courseCategory: 'Tecnologia & Inovação',
        workload: '60 Horas',
        hoursNumber: 60,
        issuedDate: '15/02/2025',
        instructor: 'Prof. Lucas M. Silveira',
        code: 'DA-2025-99841',
        institutionCnpj: resolveEffectiveCnpj(),
      });
      setIsValidating(false);
      return;
    }

    if (cleanLower === 'deds-exc-2025-9842') {
      setValidationResult({
        status: 'valid',
        studentName: 'André Silva',
        studentCpf: '384.920.118-04',
        studentCode: 'ALUNO-ALIAS',
        courseName: 'Excel do Básico ao Avançado & Dashboards Dinâmicos',
        courseCategory: 'Produtividade & Negócios',
        workload: '40 Horas',
        hoursNumber: 40,
        issuedDate: '10/02/2025',
        instructor: 'Prof. Camila Barros',
        code: 'DEDS-EXC-2025-9842',
        institutionCnpj: resolveEffectiveCnpj(),
      });
      setIsValidating(false);
      return;
    }

    // Código digitado não encontrado nos registros do admin
    setValidationResult((prev) => ({
      ...prev,
      status: 'invalid',
    }));
    setIsValidating(false);
  };

  // Carrega ao abrir o modal: só consulta se houver código inicial fornecido
  useEffect(() => {
    if (!isOpen) return;

    if (initialCode && initialCode.trim()) {
      setCertCode(initialCode.trim());
      executeValidation(initialCode.trim());
    } else {
      setCertCode('');
      setValidationResult((prev) => ({
        ...prev,
        status: 'idle',
      }));
    }
  }, [isOpen, initialCode]);

  // Atualiza QR Code dinâmico do verso
  useEffect(() => {
    const activeCode = validationResult.code || certCode.replace('#', '').trim();
    if (!activeCode || validationResult.status !== 'valid') return;

    const verifyUrl = `https://dedsacademy.vercel.app/validar?codigo=${encodeURIComponent(activeCode)}`;
    QRCode.toDataURL(verifyUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: '#0b2230',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Erro ao gerar QR code:', err));
  }, [validationResult.code, certCode, validationResult.status]);

  // Handler do formulário de busca
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certCode.trim()) return;
    executeValidation(certCode);
  };

  // Copiar código
  const handleCopyCode = () => {
    const codeToCopy = validationResult.code || certCode;
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copiar link de validação
  const handleCopyValidationLink = () => {
    const codeVal = validationResult.code || certCode.replace('#', '').trim();
    const url = `${window.location.origin}/?validar=${encodeURIComponent(codeVal)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Download do PDF oficial em 300 DPI com CPF protegido
  const handleDownloadPdf = async () => {
    if (validationResult.status !== 'valid') return;
    setIsDownloadingPdf(true);
    try {
      await downloadCertificatePdf(
        {
          studentName: validationResult.studentName,
          studentCpf: maskCpf(validationResult.studentCpf),
          studentCode: validationResult.studentCode,
          courseTitle: validationResult.courseName,
          courseCategory: validationResult.courseCategory,
          hours: validationResult.hoursNumber || 60,
          issueDate: validationResult.issuedDate,
          code: validationResult.code,
          instructor: validationResult.instructor,
          institutionCnpj,
          signatureImage: validationResult.signatureImage || null,
        },
        undefined,
        true // Inclui Frente e Verso
      );
    } catch (err) {
      console.error('Erro ao gerar PDF do certificado:', err);
      alert('Houve um problema ao processar o download do PDF. Tente novamente.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Download PNG com CPF protegido
  const handleDownloadPng = async (side: 'frente' | 'verso') => {
    if (validationResult.status !== 'valid') return;
    try {
      await downloadCertificatePng(
        {
          studentName: validationResult.studentName,
          studentCpf: maskCpf(validationResult.studentCpf),
          studentCode: validationResult.studentCode,
          courseTitle: validationResult.courseName,
          courseCategory: validationResult.courseCategory,
          hours: validationResult.hoursNumber || 60,
          issueDate: validationResult.issuedDate,
          code: validationResult.code,
          instructor: validationResult.instructor,
          institutionCnpj,
          signatureImage: validationResult.signatureImage || null,
        },
        undefined,
        side
      );
    } catch (err) {
      console.error('Erro ao gerar PNG:', err);
    }
  };

  // Compartilhamento no LinkedIn
  const handleLinkedInShare = () => {
    const certName = encodeURIComponent(validationResult.courseName);
    const orgName = encodeURIComponent('Deds Academy');
    const certId = encodeURIComponent(validationResult.code);
    const certUrl = encodeURIComponent(`https://dedsacademy.vercel.app/validar?codigo=${certId}`);
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${certName}&organizationName=${orgName}&certId=${certId}&certUrl=${certUrl}`;
    window.open(linkedInUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-5xl max-h-[96vh] flex flex-col bg-[#0b1320] border border-emerald-500/30 rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Superior */}
        <div className="px-5 py-4 bg-[#070d18] border-b border-border-subtle flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-lg shrink-0">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                  Portal de Validação Oficial de Certificados
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Modelo Oficial Deds Academy • A4
                </span>
              </div>
              <p className="text-xs text-text-tertiary">
                Chancela Legal • Conformidade com a Lei nº 9.394/96 e Decreto nº 5.154/04
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {validationResult.status === 'valid' && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Baixar via oficial completa em PDF A4 de alta resolução (300 DPI)"
                >
                  <span className="material-symbols-outlined text-base">
                    {isDownloadingPdf ? 'hourglass_top' : 'picture_as_pdf'}
                  </span>
                  <span>{isDownloadingPdf ? 'Gerando...' : 'Baixar PDF com Assinatura'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hidden sm:flex px-3 py-2 rounded-xl bg-surface-raised hover:bg-surface-overlay text-text-primary text-xs font-bold border border-border-subtle transition-all items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  <span>Imprimir</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-tertiary hover:text-white hover:bg-surface-raised transition-colors cursor-pointer"
              title="Fechar"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Corpo com Barra de Consulta e Palco Visual */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Barra de Consulta e Busca de Certificados */}
          <div className="bg-surface-raised p-4 rounded-2xl border border-border-subtle shadow-md">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-text-tertiary text-lg">
                  qr_code_scanner
                </span>
                <input
                  type="text"
                  value={certCode}
                  onChange={(e) => setCertCode(e.target.value)}
                  placeholder="Insira o código do certificado (ex: DA-2026-60862, DEDS-EXC-2025-9842)"
                  className="w-full pl-11 pr-4 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isValidating || !certCode.trim()}
                className="px-6 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">
                  {isValidating ? 'hourglass_top' : 'search'}
                </span>
                <span>{isValidating ? 'Consultando...' : 'Consultar'}</span>
              </button>
            </form>
          </div>

          {/* Estado Inicial: Aguardando digitação do código */}
          {validationResult.status === 'idle' && (
            <div className="py-12 px-6 text-center rounded-2xl bg-surface-raised border border-border-subtle shadow-md space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className="font-bold text-base text-text-primary">
                  Consulta Oficial de Certificados Deds Academy
                </h4>
                <p className="text-xs text-text-tertiary leading-relaxed">
                  Digite o código do certificado no campo de busca acima e clique em <strong>Consultar</strong> para validar as informações cadastradas no sistema e visualizar o modelo oficial frente e verso.
                </p>
              </div>
            </div>
          )}

          {/* Resultado da Validação: Certificado Válido */}
          {validationResult.status === 'valid' && (
            <div className="space-y-6">
              {/* Top Banner de Autenticidade e Alternador de Páginas */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-surface-raised to-surface-raised border border-emerald-500/30">
                <div className="flex items-center gap-2.5 text-accent-emerald-bright font-bold text-sm">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  <span>CERTIFICADO OFICIAL VÁLIDO E AUTENTICADO</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-surface-overlay p-1 rounded-xl border border-border-subtle">
                    <button
                      type="button"
                      onClick={() => setViewMode('frente')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'frente' ? 'bg-primary text-black' : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      Página 1 (Frente)
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('verso')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'verso' ? 'bg-primary text-black' : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      Página 2 (Verso)
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('ambos')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === 'ambos' ? 'bg-primary text-black' : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      Frente &amp; Verso
                    </button>
                  </div>

                  <span
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Clique para copiar código"
                  >
                    <span>{validationResult.code}</span>
                    <span className="material-symbols-outlined text-xs">
                      {copiedCode ? 'check' : 'content_copy'}
                    </span>
                  </span>
                </div>
              </div>

              {/* PALCO VISUAL: MODELO OFICIAL DO CERTIFICADO (Incorporação Direta e Fiel do Gerador Oficial) */}
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-text-tertiary px-1 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 text-accent-gold">
                    <span className="material-symbols-outlined text-base">workspace_premium</span>
                    <span>Documento Oficial Registrado • A4 Paisagem (Alta Resolução 300 DPI)</span>
                  </span>
                </div>

                <div className={`w-full rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl bg-[#0b1320] relative ${
                  viewMode === 'ambos' ? 'h-[750px] sm:h-[1550px]' : 'h-[520px] sm:h-[780px]'
                }`}>
                  <iframe
                    key={`${validationResult.code}-${viewMode}`}
                    src={generatorIframeUrl}
                    title="Certificado Oficial Deds Academy"
                    className="w-full h-full border-0 bg-transparent"
                    allow="clipboard-write"
                    onLoad={(e) => {
                      try {
                        const iframeEl = e.target as HTMLIFrameElement;
                        const iframeDoc = iframeEl?.contentDocument;
                        if (iframeDoc) {
                          iframeDoc.documentElement.classList.add('modo-preview');
                          iframeDoc.body?.classList.add('modo-preview');
                          const painel = iframeDoc.querySelector('.painel-controle') as HTMLElement | null;
                          if (painel) painel.style.display = 'none';
                        }
                        const win = iframeEl?.contentWindow as any;
                        if (win && typeof win.sincronizarCertificado === 'function') {
                          win.sincronizarCertificado({
                            nome: validationResult.studentName,
                            cpf: validationResult.studentCpf,
                            cnpj: institutionCnpj,
                            curso: validationResult.courseName,
                            horas: validationResult.workload || `${validationResult.hoursNumber} Horas`,
                            data: validationResult.issuedDate,
                            codigo: validationResult.code,
                            url: `${window.location.origin}/validar-certificado`,
                            assinaturaImg: validationResult.signatureImage || null,
                            lado: viewMode,
                          });
                        }
                      } catch (err) {}
                    }}
                  />
                </div>
              </div>

              {/* Informações Cadastrais Oficiais: Ficha de Registro Acadêmico & Dados Cadastrados Deds */}
              <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">badge</span>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Ficha de Registro Acadêmico &amp; Dados Cadastrados Deds
                    </h4>
                  </div>
                  <span className="text-[11px] text-text-tertiary">
                    Registro nº {validationResult.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-text-tertiary text-[11px] block">Nome do Aluno</span>
                    <span className="font-bold text-text-primary block text-sm">{validationResult.studentName}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-text-tertiary text-[11px] block">CPF do Aluno</span>
                    <span className="font-mono font-medium text-text-primary block">{maskCpf(validationResult.studentCpf)}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-text-tertiary text-[11px] block">Matrícula / Cód. Aluno</span>
                    <span className="font-mono text-primary font-bold block">{validationResult.studentCode}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-text-tertiary text-[11px] block">Carga Horária</span>
                    <span className="font-bold text-accent-emerald-bright block">{validationResult.workload}</span>
                  </div>

                  <div className="sm:col-span-2 space-y-0.5">
                    <span className="text-text-tertiary text-[11px] block">Curso Concluído</span>
                    <span className="font-bold text-text-primary block">{validationResult.courseName}</span>
                    <span className="text-[10px] text-text-tertiary">{validationResult.courseCategory}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-text-tertiary text-[11px] block">Data de Emissão</span>
                    <span className="font-medium text-text-primary block">{validationResult.issuedDate}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-text-tertiary text-[11px] block">Instrutor Responsável</span>
                    <span className="font-medium text-text-primary block">{validationResult.instructor}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-text-tertiary text-[11px] block">CNPJ Institucional</span>
                    <span className="font-mono text-text-primary block font-medium">{institutionCnpj}</span>
                  </div>
                </div>

                {/* Botões de Ação Complementares */}
                <div className="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyValidationLink}
                      className="px-3 py-1.5 rounded-lg bg-surface-overlay hover:bg-surface-container text-text-secondary hover:text-text-primary text-xs font-semibold flex items-center gap-1.5 border border-border-subtle transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">link</span>
                      <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link de Autenticação'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLinkedInShare}
                      className="px-3 py-1.5 rounded-lg bg-surface-overlay hover:bg-surface-container text-text-secondary hover:text-text-primary text-xs font-semibold flex items-center gap-1.5 border border-border-subtle transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">share</span>
                      <span>Adicionar ao LinkedIn</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-accent-emerald-bright flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    Válido em todo o território nacional
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Estado de Cancelado / Revogado */}
          {validationResult.status === 'cancelled' && (
            <div className="p-6 text-center text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-2xl space-y-3">
              <span className="material-symbols-outlined text-4xl">cancel</span>
              <h4 className="font-bold text-base">Certificado Revogado / Cancelado</h4>
              <p className="text-sm text-text-secondary max-w-lg mx-auto">
                O documento emitido sob o código <strong>{validationResult.code}</strong> para{' '}
                <strong>{validationResult.studentName}</strong> referente ao curso{' '}
                <strong>{validationResult.courseName}</strong> foi cancelado pela coordenação acadêmica.
              </p>
              {validationResult.cancellationReason && (
                <div className="p-3 bg-black/40 rounded-xl inline-block max-w-md text-xs text-status-danger italic border border-status-danger/20">
                  Motivo: {validationResult.cancellationReason}
                </div>
              )}
            </div>
          )}

          {/* Estado de Código Não Localizado */}
          {validationResult.status === 'invalid' && (
            <div className="p-6 text-center text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-2xl space-y-3">
              <span className="material-symbols-outlined text-4xl">error</span>
              <h4 className="font-bold text-base">Certificado não localizado nos registros oficiais</h4>
              <p className="text-sm text-text-secondary max-w-lg mx-auto">
                Não encontramos nenhum documento emitido correspondente ao código digitado. Verifique a digitação ou contate a secretaria acadêmica da Deds Academy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
