import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { CertificateItem, UserAccount, Course } from '../../types';
import {
  downloadCertificatePdf,
  downloadCertificatePng,
  OFFICIAL_FRONT_BG,
  OFFICIAL_BACK_BG,
} from '../../utils/certificateGenerator';
import { generateSequentialCertificateCode, saveCertificateToDB } from '../../services/certificateService';

interface OfficialCertificateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'issue' | 'view';
  initialCertificate?: CertificateItem | null;
  students?: UserAccount[];
  courses?: Course[];
  existingCertificates?: CertificateItem[];
  onCertificateIssued?: (certificate: CertificateItem) => void;
}

export const OfficialCertificateStudioModal: React.FC<OfficialCertificateStudioModalProps> = ({
  isOpen,
  onClose,
  mode = 'issue',
  initialCertificate = null,
  students = [],
  courses = [],
  existingCertificates = [],
  onCertificateIssued,
}) => {
  // Estado dos dados do certificado
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [studentSearch, setStudentSearch] = useState('');

  const [studentName, setStudentName] = useState('André de Souza');
  const [studentCpf, setStudentCpf] = useState('123.456.789-00');
  const [courseTitle, setCourseTitle] = useState('Desenvolvimento Web Full Stack & IA');
  const [hours, setHours] = useState(120);
  const [issueDate, setIssueDate] = useState(new Date().toLocaleDateString('pt-BR'));
  const [code, setCode] = useState('DA2026-0001');
  const [instructor, setInstructor] = useState('Prof. Dr. Carlos Mendes');
  const institutionCnpj = '45.678.901/0001-23';

  // Assinatura
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const canvasSignatureRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Visualização: 'ambos' | 'frente' | 'verso'
  const [viewMode, setViewMode] = useState<'ambos' | 'frente' | 'verso'>('ambos');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Inicialização ao abrir modal
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'view' && initialCertificate) {
      setStudentName(initialCertificate.studentName);
      setStudentCpf(initialCertificate.studentCpf || '123.456.789-00');
      setCourseTitle(initialCertificate.courseTitle);
      setHours(initialCertificate.hours || 40);
      setIssueDate(initialCertificate.issueDate);
      setCode(initialCertificate.code);
      setInstructor(initialCertificate.instructor || 'Deds Academy');
    } else {
      // Modo emissão: calcula próximo código sequencial
      const nextCode = generateSequentialCertificateCode(existingCertificates);
      setCode(nextCode);

      const firstStudent = students[0];
      const firstCourse = courses[0];
      if (firstStudent) {
        setSelectedStudentId(firstStudent.id);
        setStudentName(firstStudent.certificateData?.customName || firstStudent.name);
        setStudentCpf(firstStudent.certificateData?.customCpf || firstStudent.cpf || '123.456.789-00');
      }
      if (firstCourse) {
        setSelectedCourseId(firstCourse.id);
        setCourseTitle(firstCourse.title);
        setHours(firstCourse.hours || 40);
        setInstructor(firstCourse.instructor || 'Prof. Dr. Carlos Mendes');
      }
      setIssueDate(new Date().toLocaleDateString('pt-BR'));
    }
  }, [isOpen, mode, initialCertificate]);

  // Atualiza QR Code dinamicamente
  useEffect(() => {
    if (!code) return;
    const verifyUrl = `https://dedsacademy.vercel.app/validar?codigo=${encodeURIComponent(code)}`;
    QRCode.toDataURL(verifyUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0b2230',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Erro ao gerar QR code:', err));
  }, [code]);

  // Quando o usuário seleciona outro aluno
  const handleStudentChange = (sId: string) => {
    setSelectedStudentId(sId);
    const found = students.find((s) => s.id === sId);
    if (found) {
      setStudentName(found.certificateData?.customName || found.name);
      setStudentCpf(found.certificateData?.customCpf || found.cpf || '123.456.789-00');
      if (found.certificateData?.signatureImage) {
        setSignatureImage(found.certificateData.signatureImage);
      }
    }
  };

  // Quando o usuário seleciona outro curso
  const handleCourseChange = (cId: string) => {
    setSelectedCourseId(cId);
    const found = courses.find((c) => c.id === cId);
    if (found) {
      setCourseTitle(found.title);
      setHours(found.hours || 40);
      setInstructor(found.instructor || 'Prof. Dr. Carlos Mendes');
    }
  };

  // Download do PDF de 2 páginas
  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await downloadCertificatePdf({
        studentName,
        studentCpf,
        courseTitle,
        hours: Number(hours),
        issueDate,
        code,
        instructor,
        institutionCnpj,
        signatureImage,
      });
    } catch (err: any) {
      console.error('Erro ao baixar PDF:', err);
      alert('Não foi possível gerar o PDF. Verifique os dados e tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Salvar / Emitir Certificado
  const handleConfirmIssue = async () => {
    if (!studentName.trim() || !courseTitle.trim()) {
      alert('Por favor, preencha os dados do aluno e do curso.');
      return;
    }

    try {
      setIsSaving(true);
      const student = students.find((s) => s.id === selectedStudentId);

      const newCert: CertificateItem = {
        id: initialCertificate?.id || `cert-${selectedCourseId}-${Date.now()}`,
        courseId: selectedCourseId || 'curso-custom',
        courseTitle,
        courseCategory: courses.find((c) => c.id === selectedCourseId)?.category || 'Tecnologia',
        studentId: selectedStudentId || 'aluno-manual',
        studentCode: student?.studentCode || `ALU-${(selectedStudentId || '0000').slice(-4).toUpperCase()}`,
        studentName,
        studentCpf,
        hours: Number(hours) || 40,
        issueDate,
        code,
        instructor,
        status: 'valido',
      };

      // Salva no backend / Supabase e localStorage
      await saveCertificateToDB(newCert, student);

      if (onCertificateIssued) {
        onCertificateIssued(newCert);
      }

      onClose();
    } catch (err: any) {
      console.error('Erro ao registrar certificado:', err);
      alert('Erro ao registrar certificado no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  // Funções de Canvas para Desenho de Assinatura
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasSignatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasSignatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0b2230';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasSignatureRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignatureFromCanvas = () => {
    const canvas = canvasSignatureRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureImage(dataUrl);
    setIsSignatureModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[96vh] flex flex-col bg-[#0b1320] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Superior */}
        <div className="px-5 py-4 bg-[#070d18] border-b border-border-subtle flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-lg">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {mode === 'issue' ? 'Emissão Automatizada de Certificado Oficial' : 'Visualização Oficial do Certificado'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Frente e Verso A4 • 300 DPI
                </span>
              </div>
              <p className="text-xs text-text-tertiary">
                Código Verificador Sequencial Único • QR Code Dinâmico • Emissão Conforme Lei nº 9.394/96
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">
                {isDownloading ? 'hourglass_top' : 'download'}
              </span>
              <span>{isDownloading ? 'Gerando...' : 'Baixar PDF A4'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-surface-raised hover:bg-surface-overlay text-text-primary text-xs font-bold border border-border-subtle transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-tertiary hover:text-white hover:bg-surface-raised transition-all"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Toolbar de Controle e Modo de Visualização */}
        <div className="px-5 py-3 bg-[#0d1626] border-b border-border-subtle flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 p-1 bg-surface-raised rounded-xl border border-border-subtle">
            <button
              type="button"
              onClick={() => setViewMode('ambos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'ambos' ? 'bg-primary text-black' : 'text-text-secondary hover:text-white'
              }`}
            >
              Frente e Verso
            </button>
            <button
              type="button"
              onClick={() => setViewMode('frente')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'frente' ? 'bg-primary text-black' : 'text-text-secondary hover:text-white'
              }`}
            >
              Apenas Frente
            </button>
            <button
              type="button"
              onClick={() => setViewMode('verso')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'verso' ? 'bg-primary text-black' : 'text-text-secondary hover:text-white'
              }`}
            >
              Apenas Verso
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSignatureModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-surface-overlay text-text-primary border border-border-subtle text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-accent-gold">draw</span>
              <span>{signatureImage ? 'Alterar Assinatura' : '✍️ Assinar na Tela'}</span>
            </button>

            {mode === 'issue' && (
              <button
                type="button"
                onClick={() => setCode(generateSequentialCertificateCode(existingCertificates))}
                className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-surface-overlay text-text-secondary hover:text-white border border-border-subtle text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">autorenew</span>
                <span>Regerar Código</span>
              </button>
            )}
          </div>
        </div>

        {/* Corpo: Painel Dividido (Formulário à esquerda / Palco de visualização à direita) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6 bg-[#080e1a]">
          {/* Coluna de Configuração (Modo Emissão) */}
          <div className="lg:col-span-4 space-y-4 bg-surface-raised/60 p-4 rounded-2xl border border-border-subtle">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">tune</span>
              Dados Dinâmicos de Emissão
            </h4>

            {mode === 'issue' && students.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary uppercase">Selecionar Aluno</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.cpf || s.studentCode || s.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-secondary uppercase">Nome Completo do Aluno</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ex: André de Souza"
                className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary uppercase">CPF do Aluno</label>
                <input
                  type="text"
                  value={studentCpf}
                  onChange={(e) => setStudentCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary uppercase">Carga Horária (h)</label>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  placeholder="Ex: 120"
                  className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                />
              </div>
            </div>

            {mode === 'issue' && courses.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary uppercase">Selecionar Curso</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.hours}h)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-secondary uppercase">Título do Curso</label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Ex: Desenvolvimento Web Full Stack & IA"
                className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary uppercase">Data de Emissão</label>
                <input
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary uppercase">Código de Validação</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="DA2026-0001"
                  className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs font-mono font-bold text-emerald-400 outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-text-secondary uppercase">Instrutor Responsável</label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="Ex: Prof. Dr. Carlos Mendes"
                className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
              />
            </div>

            {mode === 'issue' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmIssue}
                  disabled={isSaving}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">
                    {isSaving ? 'hourglass_top' : 'check_circle'}
                  </span>
                  <span>{isSaving ? 'Gravando no Sistema...' : 'Emitir e Salvar no Sistema'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Coluna do Palco Visual (Renderização Pixel-Perfect) */}
          <div className="lg:col-span-8 flex flex-col items-center gap-6 overflow-x-auto pb-4">
            {/* Página 1: Frente */}
            {(viewMode === 'ambos' || viewMode === 'frente') && (
              <div className="flex flex-col items-center gap-1.5 w-full max-w-[840px]">
                <div className="flex items-center justify-between w-full px-1">
                  <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Página 1: Frente Oficial (A4 Paisagem)
                  </span>
                  <span className="text-[10px] text-text-tertiary">Proporção 1024 x 724px</span>
                </div>

                <div
                  className="relative w-full aspect-[1024/724] bg-cover bg-center rounded-xl shadow-2xl border border-white/10 select-none overflow-hidden"
                  style={{ backgroundImage: `url(${OFFICIAL_FRONT_BG})` }}
                >
                  {/* 1. Nome do Aluno */}
                  <div
                    className="absolute flex items-center justify-center text-center font-['Great_Vibes',cursive] text-[#091e2b] leading-tight select-none pointer-events-none"
                    style={{
                      top: '41.4%',
                      left: '17.1%',
                      width: '65.8%',
                      height: '11.6%',
                      fontSize: 'clamp(20px, 4.4vw, 48px)',
                    }}
                  >
                    {studentName}
                  </div>

                  {/* 2. CPF do Aluno */}
                  <div
                    className="absolute flex items-center justify-center text-center font-['Montserrat'] font-semibold text-[#4b5563] select-none pointer-events-none"
                    style={{
                      top: '53.6%',
                      left: '17.1%',
                      width: '65.8%',
                      fontSize: 'clamp(7px, 1vw, 10.5px)',
                    }}
                  >
                    CPF: {studentCpf}
                  </div>

                  {/* 3. Coluna Curso */}
                  <div
                    className="absolute flex items-center justify-center text-center font-['Montserrat'] font-bold text-[#1a2941] select-none pointer-events-none leading-tight"
                    style={{
                      top: '72%',
                      left: '8%',
                      width: '19.3%',
                      height: '5.2%',
                      fontSize: 'clamp(6px, 0.9vw, 11px)',
                    }}
                  >
                    {courseTitle}
                  </div>

                  {/* 4. Coluna Carga Horária */}
                  <div
                    className="absolute flex items-center justify-center text-center font-['Montserrat'] font-bold text-[#1a2941] select-none pointer-events-none"
                    style={{
                      top: '72%',
                      left: '28.8%',
                      width: '15.8%',
                      height: '5.2%',
                      fontSize: 'clamp(8px, 1.1vw, 13px)',
                    }}
                  >
                    {hours} horas
                  </div>

                  {/* 5. Coluna Data */}
                  <div
                    className="absolute flex items-center justify-center text-center font-['Montserrat'] font-bold text-[#1a2941] select-none pointer-events-none"
                    style={{
                      top: '72%',
                      left: '46.7%',
                      width: '18.7%',
                      height: '5.2%',
                      fontSize: 'clamp(8px, 1.1vw, 13px)',
                    }}
                  >
                    {issueDate}
                  </div>

                  {/* 6. Coluna Código */}
                  <div
                    className="absolute flex items-center justify-center text-center font-['Montserrat'] font-bold text-[#1a2941] select-none pointer-events-none"
                    style={{
                      top: '72%',
                      left: '66.1%',
                      width: '18.5%',
                      height: '5.2%',
                      fontSize: 'clamp(8px, 1.1vw, 13px)',
                    }}
                  >
                    {code}
                  </div>

                  {/* 7. Assinatura do Aluno */}
                  <div
                    className="absolute flex items-center justify-center text-center select-none pointer-events-none"
                    style={{
                      top: '78.2%',
                      left: '13.7%',
                      width: '21%',
                      height: '9.1%',
                    }}
                  >
                    {signatureImage ? (
                      <img src={signatureImage} alt="Assinatura" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="font-['Alex_Brush',cursive] text-[#0b2230] text-[clamp(16px,2.6vw,34px)]">
                        {studentName}
                      </span>
                    )}
                  </div>

                  {/* 8. CPF na Assinatura */}
                  <div
                    className="absolute flex items-center justify-center text-center font-['Montserrat'] font-semibold text-[#475569] select-none pointer-events-none"
                    style={{
                      top: '92.8%',
                      left: '13.7%',
                      width: '21%',
                      fontSize: 'clamp(6px, 0.8vw, 9.5px)',
                    }}
                  >
                    CPF: {studentCpf}
                  </div>

                  {/* 9. CNPJ Deds Academy */}
                  <div
                    className="absolute flex items-center justify-center text-center font-['Montserrat'] font-semibold text-[#475569] select-none pointer-events-none"
                    style={{
                      top: '92.8%',
                      left: '58.6%',
                      width: '27.3%',
                      fontSize: 'clamp(6px, 0.8vw, 9.5px)',
                    }}
                  >
                    CNPJ: {institutionCnpj}
                  </div>
                </div>
              </div>
            )}

            {/* Página 2: Verso */}
            {(viewMode === 'ambos' || viewMode === 'verso') && (
              <div className="flex flex-col items-center gap-1.5 w-full max-w-[840px]">
                <div className="flex items-center justify-between w-full px-1">
                  <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Página 2: Verso Oficial (A4 Paisagem)
                  </span>
                  <span className="text-[10px] text-text-tertiary">Autenticidade e QR Code</span>
                </div>

                <div
                  className="relative w-full aspect-[1024/724] bg-cover bg-center rounded-xl shadow-2xl border border-white/10 select-none overflow-hidden"
                  style={{ backgroundImage: `url(${OFFICIAL_BACK_BG})` }}
                >
                  {/* 1. QR Code Dinâmico */}
                  <div
                    className="absolute flex items-center justify-center bg-white p-1 rounded-lg shadow-sm"
                    style={{
                      top: '47.8%',
                      left: '63.1%',
                      width: '13.7%',
                      height: '19.3%',
                    }}
                  >
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="QR Code Oficial" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 animate-pulse rounded" />
                    )}
                  </div>

                  {/* 2. Link de Validação */}
                  <a
                    href={`https://dedsacademy.vercel.app/validar?codigo=${code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute flex items-center justify-center text-center font-['Montserrat'] font-semibold text-[#006756] hover:underline cursor-pointer"
                    style={{
                      top: '68.2%',
                      left: '60.9%',
                      width: '18%',
                      fontSize: 'clamp(6px, 0.75vw, 8px)',
                    }}
                  >
                    www.dedsacademy.com/validar-certificado
                  </a>

                  {/* 3. Código em Destaque na Pill */}
                  <div
                    className="absolute flex items-center justify-center text-center font-['Montserrat'] font-extrabold text-[#082132] tracking-wider select-none pointer-events-none"
                    style={{
                      top: '76.8%',
                      left: '35.1%',
                      width: '39.5%',
                      height: '6.1%',
                      fontSize: 'clamp(12px, 2.2vw, 25px)',
                    }}
                  >
                    {code}
                  </div>

                  {/* 4. CNPJ Institucional */}
                  <div
                    className="absolute flex items-center font-['Montserrat'] font-semibold text-[#006756] select-none pointer-events-none"
                    style={{
                      top: '67.1%',
                      left: '10.3%',
                      width: '21.5%',
                      fontSize: 'clamp(6px, 0.8vw, 8.5px)',
                    }}
                  >
                    CNPJ: {institutionCnpj}
                  </div>

                  {/* 5. Carimbo Digital de Autenticidade */}
                  <div
                    className="absolute flex items-center justify-center text-center font-['Montserrat'] font-medium text-[#64748b] select-none pointer-events-none px-4"
                    style={{
                      bottom: '3.3%',
                      left: '0',
                      width: '100%',
                      fontSize: 'clamp(6px, 0.75vw, 8.5px)',
                    }}
                  >
                    🔐 Deds Academy • CNPJ: {institutionCnpj} • Aluno: {studentName} (CPF: {studentCpf}) • Lei Federal 14.063/2020
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Secundário: Assinar na Tela */}
        {isSignatureModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#0f172a] border border-border-subtle rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent-gold">draw</span>
                  Desenhe ou Escolha a Assinatura do Aluno
                </h4>
                <button
                  onClick={() => setIsSignatureModalOpen(false)}
                  className="text-text-tertiary hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <p className="text-xs text-text-tertiary">
                Utilize o mouse, touchpad ou o dedo em telas touch para desenhar a rubrica.
              </p>

              <div className="border-2 border-dashed border-border-subtle rounded-xl bg-white p-2">
                <canvas
                  ref={canvasSignatureRef}
                  width={460}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[150px] touch-none cursor-crosshair bg-white"
                />
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearSignatureCanvas}
                    className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-surface-overlay text-text-secondary hover:text-white text-xs font-bold"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureImage(null);
                      setIsSignatureModalOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-surface-overlay text-text-secondary hover:text-white text-xs font-bold"
                  >
                    Usar Fonte Caligráfica
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSignatureModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-surface-overlay text-text-secondary text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={saveSignatureFromCanvas}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                  >
                    Salvar Assinatura
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
