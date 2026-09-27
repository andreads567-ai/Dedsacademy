import React, { useState } from 'react';
import { CertificateItem, UserAccount, Course } from '../../types';
import { CertificateTemplateModal } from './CertificateTemplateModal';

interface CertificatesTabProps {
  certificates: CertificateItem[];
  students: UserAccount[];
  courses: Course[];
  onIssueCertificate: (certificate: CertificateItem) => void;
  onCancelCertificate?: (certId: string, reason?: string) => void;
  onDeleteCertificate?: (certId: string) => void;
}

export const CertificatesTab: React.FC<CertificatesTabProps> = ({
  certificates,
  students,
  courses,
  onIssueCertificate,
  onCancelCertificate,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valido' | 'cancelado'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 3-dot dropdown menu state
  const [openMenuCertId, setOpenMenuCertId] = useState<string | null>(null);
  const [confirmCancelCert, setConfirmCancelCert] = useState<CertificateItem | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('Inconsistência cadastral ou solicitação do aluno');

  // Preview / Autenticar modal
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);

  // Form for manual issuance
  const [studentSelectionType, setStudentSelectionType] = useState<'name' | 'cpf' | 'code'>('name');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [hours, setHours] = useState(40);
  const [instructor, setInstructor] = useState('Prof. Dr. Carlos Mendes');

  const handleOpenIssueModal = () => {
    setSelectedStudentId(students[0]?.id || '');
    const firstCourse = courses[0];
    if (firstCourse) {
      setSelectedCourseId(firstCourse.id);
      setHours(firstCourse.hours || 40);
      setInstructor(firstCourse.instructor || 'Prof. Dr. Carlos Mendes');
    }
    setIsModalOpen(true);
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    const found = courses.find((c) => c.id === courseId);
    if (found) {
      setHours(found.hours);
      setInstructor(found.instructor);
    }
  };

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === selectedStudentId) || students[0];
    const course = courses.find((c) => c.id === selectedCourseId) || courses[0];

    if (!student || !course) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = course.title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'CUR');
    const code = `DEDS-${prefix}-2026-${randomNum}`;

    const newCert: CertificateItem = {
      id: `cert-${Date.now()}`,
      courseId: course.id,
      courseTitle: course.title,
      courseCategory: course.category,
      studentId: student.id,
      studentCode: student.studentCode || `ALU-${student.id.slice(-4).toUpperCase()}`,
      studentName: student.name,
      studentCpf: student.cpf || '384.920.118-04',
      hours: Number(hours),
      issueDate: new Date().toLocaleDateString('pt-BR'),
      code,
      instructor: instructor || course.instructor,
      status: 'valido',
    };

    onIssueCertificate(newCert);
    setIsModalOpen(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExecuteCancel = () => {
    if (confirmCancelCert && onCancelCertificate) {
      onCancelCertificate(confirmCancelCert.id, cancelReasonInput);
    }
    setConfirmCancelCert(null);
    setOpenMenuCertId(null);
  };

  // Filter logic: text search + status filter
  const filteredCertificates = certificates.filter((c) => {
    const certStatus = c.status || 'valido';
    if (statusFilter !== 'all' && certStatus !== statusFilter) {
      return false;
    }

    const query = search.toLowerCase();
    const matchesCode = c.code.toLowerCase().includes(query);
    const matchesStudent = c.studentName.toLowerCase().includes(query);
    const matchesCourse = c.courseTitle.toLowerCase().includes(query);
    const matchesCpf = c.studentCpf ? c.studentCpf.toLowerCase().includes(query) : false;
    const matchesCategory = c.courseCategory ? c.courseCategory.toLowerCase().includes(query) : false;
    const matchesInstructor = c.instructor ? c.instructor.toLowerCase().includes(query) : false;
    const matchesStudentCode = c.studentCode ? c.studentCode.toLowerCase().includes(query) : false;

    return (
      matchesCode ||
      matchesStudent ||
      matchesCourse ||
      matchesCpf ||
      matchesCategory ||
      matchesInstructor ||
      matchesStudentCode
    );
  });

  // KPI counters
  const validCount = certificates.filter((c) => (c.status || 'valido') === 'valido').length;
  const cancelledCount = certificates.filter((c) => c.status === 'cancelado').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">verified</span>
              Livro de Registro &amp; Gestão de Certificados
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-gold/20 text-accent-gold border border-accent-gold/30">
              Conformidade Lei nº 9.394/96
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Registro oficial com código verificador, QR Code, modelo dinâmico editável, autenticação e controle de cancelamento.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-surface-raised hover:bg-surface-overlay border border-border-subtle text-text-primary text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-base text-accent-gold">design_services</span>
            <span>Modelo de Certificado</span>
          </button>

          <button
            type="button"
            onClick={handleOpenIssueModal}
            className="px-4 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">workspace_premium</span>
            <span>Emitir Certificado Oficial</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-text-tertiary font-bold uppercase">Total Registrado</span>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{certificates.length} Documentos</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-primary">menu_book</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-text-tertiary font-bold uppercase">Certificados Válidos</span>
            <p className="text-2xl font-bold text-accent-emerald-bright mt-0.5">{validCount} Ativos</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-accent-emerald-bright">verified_user</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-text-tertiary font-bold uppercase">Cancelados / Revogados</span>
            <p className="text-2xl font-bold text-status-danger mt-0.5">{cancelledCount} Revogados</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-status-danger">cancel</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-text-tertiary font-bold uppercase">Atividades AACC</span>
            <p className="text-2xl font-bold text-accent-gold mt-0.5">Horas Aceitas</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-accent-gold">school</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por código, QR code, aluno, CPF, tipo de curso ou instrutor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
          />
        </div>

        {/* Filter for Valid vs Cancelled */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-raised rounded-xl border border-border-subtle self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-primary text-black shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Todos ({certificates.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('valido')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              statusFilter === 'valido'
                ? 'bg-accent-emerald-bright text-black shadow-xs'
                : 'text-text-secondary hover:text-accent-emerald-bright'
            }`}
          >
            <span className="material-symbols-outlined text-xs">check_circle</span>
            <span>Válidos ({validCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('cancelado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              statusFilter === 'cancelado'
                ? 'bg-status-danger text-white shadow-xs'
                : 'text-text-secondary hover:text-status-danger'
            }`}
          >
            <span className="material-symbols-outlined text-xs">cancel</span>
            <span>Cancelados ({cancelledCount})</span>
          </button>
        </div>
      </div>

      {/* Certificates Table with all requested columns */}
      <div className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-overlay text-text-secondary uppercase border-b border-border-subtle font-bold">
              <tr>
                <th className="p-4 whitespace-nowrap">Código</th>
                <th className="p-4 whitespace-nowrap">QR Code</th>
                <th className="p-4 whitespace-nowrap">Nome do Aluno &amp; CPF</th>
                <th className="p-4 whitespace-nowrap">Tipo de Curso &amp; Categoria</th>
                <th className="p-4 whitespace-nowrap">Instrutor</th>
                <th className="p-4 whitespace-nowrap">Carga Horária</th>
                <th className="p-4 whitespace-nowrap">Data</th>
                <th className="p-4 whitespace-nowrap">Válido e Registrado</th>
                <th className="p-4 whitespace-nowrap text-center">Autenticar</th>
                <th className="p-4 whitespace-nowrap text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-text-tertiary">
                    Nenhum certificado localizado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => {
                  const isValid = (cert.status || 'valido') === 'valido';

                  return (
                    <tr
                      key={cert.id}
                      className={`hover:bg-surface-overlay/50 transition-colors ${
                        !isValid ? 'opacity-80 bg-status-danger/5' : ''
                      }`}
                    >
                      {/* 1. Código do Certificado */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                          <span>{cert.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(cert.code)}
                            className="p-1 rounded hover:bg-surface-overlay text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                            title="Copiar código verificador"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {copiedCode === cert.code ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </div>
                        {copiedCode === cert.code && (
                          <span className="text-[10px] text-accent-emerald-bright font-bold block mt-0.5">
                            Copiado!
                          </span>
                        )}
                        {cert.studentCode && (
                          <span className="text-[10px] text-text-tertiary font-mono block">
                            Cód: {cert.studentCode}
                          </span>
                        )}
                      </td>

                      {/* 2. QR Code do Certificado */}
                      <td className="p-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setPreviewCert(cert)}
                          className="group p-1.5 bg-surface-overlay hover:bg-surface-container rounded-lg border border-border-subtle flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Clique para inspecionar QR Code e Certificado"
                        >
                          {/* Mini QR Code SVG Icon */}
                          <div className="w-7 h-7 bg-white p-0.5 rounded shadow-xs flex items-center justify-center">
                            <svg className="w-6 h-6 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                              <path d="M0 0h30v30H0zM5 5h20v20H5zM10 10h10v10H10z" />
                              <path d="M70 0h30v30H70zM75 5h20v20H75zM80 10h10v10H80z" />
                              <path d="M0 70h30v30H0zM5 75h20v20H5zM10 80h10v10H10z" />
                              <rect x="40" y="40" width="20" height="20" className="text-emerald-600" />
                              <circle cx="50" cy="50" r="4" fill="#ffffff" />
                            </svg>
                          </div>
                          <span className="text-[10px] font-bold text-text-secondary group-hover:text-primary transition-colors">
                            Ver QR
                          </span>
                        </button>
                      </td>

                      {/* 3. Nome do Aluno & CPF */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-bold text-text-primary block text-sm">{cert.studentName}</span>
                        <span className="text-[11px] text-text-tertiary font-mono">CPF: {cert.studentCpf}</span>
                      </td>

                      {/* 4. Tipo de Curso & Categoria */}
                      <td className="p-4">
                        <span className="font-medium text-text-primary block max-w-xs leading-snug">
                          {cert.courseTitle}
                        </span>
                        <span className="text-[11px] text-primary/90 font-semibold block mt-0.5">
                          {cert.courseCategory || 'Extracurricular / Livre'}
                        </span>
                      </td>

                      {/* 5. Nome do Instrutor */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-text-primary font-medium block">{cert.instructor}</span>
                        <span className="text-[10px] text-text-tertiary">Docente Responsável</span>
                      </td>

                      {/* 6. Carga Horária */}
                      <td className="p-4 font-bold text-accent-emerald-bright whitespace-nowrap">
                        {cert.hours}h
                      </td>

                      {/* 7. Data */}
                      <td className="p-4 text-text-secondary whitespace-nowrap">
                        <span>{cert.issueDate}</span>
                        {cert.cancelledAt && (
                          <span className="text-[10px] text-status-danger block font-medium">
                            Revogado: {cert.cancelledAt}
                          </span>
                        )}
                      </td>

                      {/* 8. Válido e Registrado */}
                      <td className="p-4 whitespace-nowrap">
                        {isValid ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-emerald-bright/20 text-accent-emerald-bright inline-flex items-center gap-1 border border-accent-emerald-bright/30">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            Válido &amp; Registrado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-status-danger/20 text-status-danger inline-flex items-center gap-1 border border-status-danger/30">
                            <span className="material-symbols-outlined text-xs">cancel</span>
                            Certificado Cancelado
                          </span>
                        )}
                      </td>

                      {/* 9. Autenticar */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setPreviewCert(cert)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all ${
                            isValid
                              ? 'bg-primary-container/20 text-primary hover:bg-primary-container/30 border border-primary/30'
                              : 'bg-surface-overlay text-text-tertiary border border-border-subtle'
                          }`}
                          title="Abrir painel de autenticação pública oficial"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isValid ? 'verified' : 'history'}
                          </span>
                          <span>Autenticar</span>
                        </button>
                      </td>

                      {/* 10. Três Pontinhos discretos (Ações / Cancelar) */}
                      <td className="p-4 text-right whitespace-nowrap relative">
                        <div className="inline-block text-left">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuCertId(openMenuCertId === cert.id ? null : cert.id)
                            }
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
                            title="Mais opções"
                          >
                            <span className="material-symbols-outlined text-base">more_vert</span>
                          </button>

                          {/* 3-Dot Dropdown Menu */}
                          {openMenuCertId === cert.id && (
                            <div className="absolute right-4 mt-1 w-52 bg-surface-raised border border-border-subtle rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewCert(cert);
                                  setOpenMenuCertId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-text-primary hover:bg-surface-overlay flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                                <span>Visualizar Certificado</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleCopyCode(cert.code);
                                  setOpenMenuCertId(null);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-text-primary hover:bg-surface-overlay flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm text-text-tertiary">content_copy</span>
                                <span>Copiar Código</span>
                              </button>

                              {isValid ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmCancelCert(cert);
                                    setOpenMenuCertId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-status-danger hover:bg-status-danger/10 flex items-center gap-2 cursor-pointer border-t border-border-subtle/60"
                                >
                                  <span className="material-symbols-outlined text-sm">cancel</span>
                                  <span>Cancelar Certificado</span>
                                </button>
                              ) : (
                                <div className="px-3.5 py-2 text-[11px] text-text-tertiary italic border-t border-border-subtle/60">
                                  Certificado já cancelado
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Emitir Novo Certificado Oficial */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-xl bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-overlay">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent-gold/20 text-accent-gold flex items-center justify-center border border-accent-gold/30">
                  <span className="material-symbols-outlined text-xl">workspace_premium</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    Emissão Oficial de Certificado Acadêmico
                  </h3>
                  <p className="text-[11px] text-text-tertiary">
                    Preenchimento automático sincronizado com a categoria de cursos e dados do aluno.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-text-tertiary hover:text-text-primary p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className="p-6 space-y-4">
              {/* Selector Mode: Name, CPF or Student Code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    Localizar / Selecionar Aluno Titular <span className="text-status-danger">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-text-tertiary">Buscar por:</span>
                    <button
                      type="button"
                      onClick={() => setStudentSelectionType('name')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        studentSelectionType === 'name'
                          ? 'bg-primary text-black'
                          : 'bg-surface-overlay text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Nome
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentSelectionType('cpf')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        studentSelectionType === 'cpf'
                          ? 'bg-primary text-black'
                          : 'bg-surface-overlay text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      CPF
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentSelectionType('code')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        studentSelectionType === 'code'
                          ? 'bg-primary text-black'
                          : 'bg-surface-overlay text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Código
                    </button>
                  </div>
                </div>

                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer"
                >
                  {students.map((st) => {
                    const studentCode = st.studentCode || `ALU-${st.id.slice(-4).toUpperCase()}`;
                    let label = `${st.name} — CPF: ${st.cpf || 'Não informado'} (Cód: ${studentCode})`;
                    if (studentSelectionType === 'cpf') {
                      label = `CPF: ${st.cpf || 'Sem CPF'} • ${st.name} (Cód: ${studentCode})`;
                    } else if (studentSelectionType === 'code') {
                      label = `[${studentCode}] • ${st.name} — CPF: ${st.cpf || 'Sem CPF'}`;
                    }

                    return (
                      <option key={st.id} value={st.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Course Selection - Pulls automatically Category, Hours and Instructor */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Curso Concluído (Puxa Categoria, Carga Horária e Instrutor) <span className="text-status-danger">*</span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer"
                >
                  {courses.map((cr) => (
                    <option key={cr.id} value={cr.id}>
                      {cr.title} — {cr.category} ({cr.hours}h • {cr.instructor})
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-filled: Hours and Instructor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Carga Horária Oficial (Horas)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-text-tertiary mt-0.5 block">
                    Puxado automaticamente da categoria do curso
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Instrutor Responsável
                  </label>
                  <input
                    type="text"
                    required
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-text-tertiary mt-0.5 block">
                    Docente associado à categoria
                  </span>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="p-3.5 rounded-xl bg-accent-gold/10 border border-accent-gold/20 text-xs text-text-secondary">
                <div className="flex items-center gap-2 text-accent-gold font-bold mb-1">
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>Geração Criptográfica e QR Code no Verso</span>
                </div>
                O documento será registrado com código verificador e QR code único, pronto para validação pública e comprovação em Atividades Acadêmicas Complementares (AACC) conforme Lei nº 9.394/96.
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-overlay text-text-secondary hover:text-text-primary text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">workspace_premium</span>
                  <span>Registrar e Emitir Certificado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Cancelamento de Certificado */}
      {confirmCancelCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmCancelCert(null)} />
          <div className="relative w-full max-w-md bg-surface-raised border border-status-danger/40 rounded-2xl shadow-2xl z-10 overflow-hidden p-6 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-status-danger/20 text-status-danger flex items-center justify-center mb-4 border border-status-danger/30">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>

            <h3 className="text-base font-bold text-text-primary">
              Cancelar Certificado Oficial?
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Esta ação tornará o certificado com código{' '}
              <strong className="text-status-danger font-mono">{confirmCancelCert.code}</strong> inválido
              no portal público de autenticação e no leitor de QR Code.
            </p>

            <div className="my-4 p-3 bg-surface-overlay rounded-xl border border-border-subtle text-xs space-y-1">
              <span className="text-text-tertiary block">Aluno Titular: <strong className="text-text-primary">{confirmCancelCert.studentName}</strong></span>
              <span className="text-text-tertiary block">Curso: <strong className="text-text-primary">{confirmCancelCert.courseTitle}</strong></span>
              <span className="text-text-tertiary block">Carga Horária: <strong className="text-text-primary">{confirmCancelCert.hours}h</strong></span>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Motivo do Cancelamento / Revogação
              </label>
              <input
                type="text"
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-status-danger"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelCert(null)}
                className="px-4 py-2 rounded-xl bg-surface-overlay text-text-secondary hover:text-text-primary text-xs font-bold cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                className="px-4 py-2 rounded-xl bg-status-danger hover:bg-status-danger/80 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
                <span>Confirmar Cancelamento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Autenticar / Inspecionar Certificado e QR Code */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewCert(null)} />
          <div className="relative w-full max-w-lg bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-overlay">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">verified</span>
                <h3 className="text-sm font-bold text-text-primary">
                  Autenticação Pública do Certificado
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCert(null)}
                className="text-text-tertiary hover:text-text-primary"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status Banner */}
              {(previewCert.status || 'valido') === 'valido' ? (
                <div className="p-3.5 rounded-xl bg-accent-emerald-bright/15 border border-accent-emerald-bright/30 flex items-center gap-3 text-accent-emerald-bright">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wide">
                      Certificado Válido e Registrado
                    </h4>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      Livro de Registro Deds Academy • Amparo Lei nº 9.394/96
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-status-danger/15 border border-status-danger/30 flex items-center gap-3 text-status-danger">
                  <span className="material-symbols-outlined text-2xl">cancel</span>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wide">
                      Certificado Revogado / Cancelado
                    </h4>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      Motivo: {previewCert.cancellationReason || 'Cancelado pela administração'}
                    </p>
                  </div>
                </div>
              )}

              {/* QR Code + Data display */}
              <div className="p-4 bg-surface-overlay rounded-xl border border-border-subtle flex items-center gap-4">
                <div className="w-24 h-24 bg-white p-1 rounded-xl shadow-md shrink-0 flex flex-col items-center justify-center">
                  <svg className="w-20 h-20 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M0 0h30v30H0zM5 5h20v20H5zM10 10h10v10H10z" />
                    <path d="M70 0h30v30H70zM75 5h20v20H75zM80 10h10v10H80z" />
                    <path d="M0 70h30v30H0zM5 75h20v20H5zM10 80h10v10H10z" />
                    <rect x="40" y="40" width="20" height="20" className="text-emerald-600" />
                    <circle cx="50" cy="50" r="4" fill="#ffffff" />
                  </svg>
                  <span className="text-[8px] font-bold text-slate-800 uppercase mt-0.5">QR Válido</span>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="font-mono font-bold text-primary block">{previewCert.code}</span>
                  <p className="font-bold text-text-primary">{previewCert.studentName}</p>
                  <p className="text-text-secondary text-[11px]">CPF: {previewCert.studentCpf}</p>
                  <p className="text-text-secondary text-[11px]">Curso: {previewCert.courseTitle}</p>
                  <p className="text-text-secondary text-[11px]">
                    Carga: <strong className="text-accent-emerald-bright">{previewCert.hours}h</strong> • Docente: {previewCert.instructor}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyCode(previewCert.code)}
                  className="px-3 py-2 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  <span>Copiar Hash</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewCert(null);
                    setIsTemplateModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">design_services</span>
                  <span>Ver no Modelo Gráfico</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Modelo de Certificado (Exportar & Editar campos móveis) */}
      <CertificateTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        sampleCourseTitle={courses[0]?.title}
        sampleHours={courses[0]?.hours}
        sampleInstructor={courses[0]?.instructor}
        sampleStudentName={students[0]?.name}
        sampleCpf={students[0]?.cpf}
      />
    </div>
  );
};
