import React, { useState, useEffect } from 'react';
import { Course, CertificateItem, StudentProgress, UserAccount, StudentOrder } from '../types';
import { INITIAL_ORDERS } from '../data/usersData';
import { CancellationModal } from './CancellationModal';
import { SignatureModal } from './SignatureModal';
import { StudentCoursePlayerModal } from './StudentCoursePlayerModal';

interface StudentPortalProps {
  user: UserAccount;
  onUpdateUser?: (updatedUser: UserAccount) => void;
  enrolledCourses: Course[];
  progressData: Record<string, StudentProgress>;
  certificates: CertificateItem[];
  onNavigateHome: (sectionId?: string) => void;
  onLogout: () => void;
  onOpenCertificateModal: () => void;
  onOpenCatalog?: () => void;
  onCompleteLesson?: (courseId: string, lessonId: string, lessonTitle: string) => void;
  onCancelEnrollment?: (courseIds: string[]) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  user,
  onUpdateUser,
  enrolledCourses,
  progressData,
  certificates,
  onNavigateHome,
  onLogout,
  onOpenCertificateModal,
  onOpenCatalog,
  onCompleteLesson,
  onCancelEnrollment,
}) => {
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [activeTab, setActiveTab] = useState<'cursos' | 'certificados' | 'horas' | 'financeiro' | 'perfil'>('cursos');
  const [orders, setOrders] = useState<StudentOrder[]>(INITIAL_ORDERS);
  const [selectedOrderForCancellation, setSelectedOrderForCancellation] = useState<StudentOrder | null>(null);
  const [cancellationAlertToast, setCancellationAlertToast] = useState<string | null>(null);

  // Form states for profile & address & avatar
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    cpf: user.cpf || '384.920.118-04',
    phone: user.phone || '(11) 98765-4321',
    avatar: user.avatar || '',
    cep: user.address?.cep || '01310-100',
    street: user.address?.street || 'Avenida Paulista',
    number: user.address?.number || '1578',
    complement: user.address?.complement || 'Apto 42',
    neighborhood: user.address?.neighborhood || 'Bela Vista',
    city: user.address?.city || 'São Paulo',
    state: user.address?.state || 'SP',
  });

  // Certificate customization states (Dados para emissão de certificado)
  const [certFormData, setCertFormData] = useState({
    customName: user.certificateData?.customName || user.name || '',
    customCpf: user.certificateData?.customCpf || user.cpf || '384.920.118-04',
    signatureType: (user.certificateData?.signatureType || 'automatic') as 'upload' | 'draw' | 'automatic',
    signatureImage: user.certificateData?.signatureImage || '',
    fontStyle: user.certificateData?.fontStyle || 'font-script',
  });
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      cpf: user.cpf || '384.920.118-04',
      phone: user.phone || '(11) 98765-4321',
      avatar: user.avatar || '',
      cep: user.address?.cep || '01310-100',
      street: user.address?.street || 'Avenida Paulista',
      number: user.address?.number || '1578',
      complement: user.address?.complement || 'Apto 42',
      neighborhood: user.address?.neighborhood || 'Bela Vista',
      city: user.address?.city || 'São Paulo',
      state: user.address?.state || 'SP',
    });
    setCertFormData({
      customName: user.certificateData?.customName || user.name || '',
      customCpf: user.certificateData?.customCpf || user.cpf || '384.920.118-04',
      signatureType: (user.certificateData?.signatureType || 'automatic') as 'upload' | 'draw' | 'automatic',
      signatureImage: user.certificateData?.signatureImage || '',
      fontStyle: user.certificateData?.fontStyle || 'font-script',
    });
    setAvatarLoadFailed(false);
  }, [user]);

  const [activeLessonModal, setActiveLessonModal] = useState<{
    isOpen: boolean;
    course: Course | null;
    lessonTitle: string;
  }>({
    isOpen: false,
    course: null,
    lessonTitle: '',
  });

  const totalHours = enrolledCourses.reduce((acc, c) => acc + c.hours, 0);
  const completedHours = certificates.reduce((acc, cert) => acc + cert.hours, 0);

  const handleOpenLesson = (course: Course) => {
    const progress = progressData[course.id];
    setActiveLessonModal({
      isOpen: true,
      course,
      lessonTitle: progress?.lastLessonTitle || 'Módulo 1: Introdução e Visão Geral',
    });
  };

  const handleConfirmCancellation = (orderId: string, reason: string) => {
    const order = orders.find((o) => o.id === orderId);
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'cancelamento_solicitado',
              cancellationRequestedAt: new Date().toLocaleString('pt-BR'),
              cancellationReason: reason,
            }
          : ord
      )
    );
    // Revoke enrollment for cancelled courses
    if (order && onCancelEnrollment) {
      onCancelEnrollment(order.courseIds);
    }
    setCancellationAlertToast('Cancelamento confirmado! Os cursos foram removidos da sua matrícula.');
    setTimeout(() => {
      setCancellationAlertToast(null);
    }, 6000);
  };

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface py-8">
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop w-full">
        {/* Top Student Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-surface-raised p-6 rounded-2xl border border-border-subtle shadow-md mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user.avatar && !avatarLoadFailed ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  onError={() => setAvatarLoadFailed(true)}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary flex items-center justify-center text-primary font-bold text-xl shadow-inner">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'AL'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-emerald-bright rounded-full border-2 border-surface-raised shadow" title="Online"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-text-primary">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  Área do Aluno
                </span>
              </div>
              <p className="text-sm text-text-tertiary flex items-center gap-2 mt-0.5">
                <span>{user.email}</span>
                <span>•</span>
                <span>Matrícula: #{user.id.toUpperCase()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => (onOpenCatalog ? onOpenCatalog() : onNavigateHome('cursos-section'))}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-accent-emerald-bright text-on-primary text-sm font-semibold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">storefront</span>
              Catálogo de Cursos
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-surface-overlay hover:bg-status-danger/20 text-text-tertiary hover:text-status-danger text-sm font-semibold transition-all flex items-center gap-1.5 border border-border-subtle cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Sair
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-raised p-5 rounded-xl border border-border-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-text-primary">{enrolledCourses.length}</span>
              <p className="text-xs text-text-tertiary">Cursos Matriculados</p>
            </div>
          </div>

          <div className="bg-surface-raised p-5 rounded-xl border border-border-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-gold/10 text-accent-gold flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">schedule</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-text-primary">{totalHours}h</span>
              <p className="text-xs text-text-tertiary">Carga Horária Total</p>
            </div>
          </div>

          <div className="bg-surface-raised p-5 rounded-xl border border-border-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-emerald-bright/10 text-accent-emerald-bright flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-text-primary">{certificates.length}</span>
              <p className="text-xs text-text-tertiary">Certificados Emitidos</p>
            </div>
          </div>

          <div className="bg-surface-raised p-5 rounded-xl border border-border-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-text-primary">100%</span>
              <p className="text-xs text-text-tertiary">Horas Extracurriculares</p>
            </div>
          </div>
        </div>

        {/* Portal Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border-subtle mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('cursos')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'cursos'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
            }`}
          >
            <span className="material-symbols-outlined text-lg">play_circle</span>
            Meus Cursos ({enrolledCourses.length})
          </button>

          <button
            onClick={() => setActiveTab('certificados')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'certificados'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
            }`}
          >
            <span className="material-symbols-outlined text-lg">workspace_premium</span>
            Meus Certificados ({certificates.length})
          </button>

          <button
            onClick={() => setActiveTab('horas')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'horas'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
            }`}
          >
            <span className="material-symbols-outlined text-lg">history_edu</span>
            Horas Complementares
          </button>

          <button
            onClick={() => setActiveTab('financeiro')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'financeiro'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
            }`}
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            Faturas &amp; Comprovantes
          </button>

          <button
            onClick={() => setActiveTab('perfil')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'perfil'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
            }`}
          >
            <span className="material-symbols-outlined text-lg">manage_accounts</span>
            Dados Cadastrais
          </button>
        </div>

        {/* Tab 1: Meus Cursos */}
        {activeTab === 'cursos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Continuar Aprendendo</h2>
                <p className="text-xs text-text-tertiary">Acesse suas salas de aula virtuais e retome suas aulas de onde parou</p>
              </div>
              <button
                onClick={() => (onOpenCatalog ? onOpenCatalog() : onNavigateHome('cursos-section'))}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Adicionar mais cursos <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => {
                const prog = progressData[course.id] || {
                  percent: 0,
                  completedLessons: 0,
                  totalLessons: course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || course.lessonsCount || 0,
                  lastLessonTitle: 'Nenhuma aula iniciada',
                  lastAccessed: 'Nunca acessado',
                };
                const isCompleted = prog.percent === 100;

                return (
                  <div
                    key={course.id}
                    className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden flex flex-col shadow-sm hover:border-primary/50 transition-all group"
                  >
                    <div className="relative h-44 w-full bg-surface-base overflow-hidden">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-transparent to-transparent"></div>
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold bg-surface-dim/80 backdrop-blur-md text-primary">
                        {course.category}
                      </span>
                      {isCompleted ? (
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-bold bg-accent-emerald-bright text-on-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">verified</span> Concluído
                        </span>
                      ) : (
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-bold bg-surface-dim/80 text-accent-gold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">timelapse</span> {prog.percent}%
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
                          <span>{course.instructor}</span>
                          <span>•</span>
                          <span>{course.hours} horas</span>
                        </p>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
                            <span>Progresso</span>
                            <span className="font-bold text-text-primary">{prog.percent}% concluído</span>
                          </div>
                          <div className="w-full h-2 bg-surface-overlay rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${prog.percent}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="mt-3 p-2.5 rounded-lg bg-surface-container-low border border-border-subtle/50 text-xs text-text-secondary">
                          <span className="text-text-tertiary block text-[10px] uppercase font-bold mb-0.5">Última Aula Assistida:</span>
                          <span className="text-text-primary font-medium truncate block">{prog.lastLessonTitle}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-border-subtle flex items-center gap-2">
                        <button
                          onClick={() => handleOpenLesson(course)}
                          className="flex-1 py-2.5 px-4 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">play_arrow</span>
                          {isCompleted ? 'Reassistir Curso' : 'Continuar Aula'}
                        </button>
                        {isCompleted && (
                          <button
                            onClick={onOpenCertificateModal}
                            className="p-2.5 bg-surface-overlay hover:bg-surface-container text-accent-emerald-bright rounded-xl border border-border-subtle transition-all cursor-pointer"
                            title="Ver Certificado"
                          >
                            <span className="material-symbols-outlined text-base">workspace_premium</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Meus Certificados */}
        {activeTab === 'certificados' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Certificados Oficiais Emitidos</h2>
                <p className="text-xs text-text-tertiary">Documentos com código de verificação criptográfica válidos em todo o Brasil</p>
              </div>
              <button
                onClick={onOpenCertificateModal}
                className="px-4 py-2 bg-surface-overlay hover:bg-surface-container text-primary text-xs font-bold rounded-xl border border-border-subtle flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">verified</span>
                Validar Autenticidade
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-surface-raised rounded-2xl border border-border-subtle p-6 flex flex-col justify-between shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none"></div>
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">workspace_premium</span> Oficial Deds Academy
                      </span>
                      <span className="text-xs text-text-tertiary">Emitido em {cert.issueDate}</span>
                    </div>

                    <h3 className="text-base font-bold text-text-primary mt-4">{cert.courseTitle}</h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Titular:{' '}
                      <span className="text-text-primary font-bold">
                        {user.certificateData?.customName || cert.studentName}
                      </span>{' '}
                      (CPF: {user.certificateData?.customCpf || cert.studentCpf})
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">Instrutor: {cert.instructor}</p>

                    <div className="mt-4 p-3 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-text-tertiary block">Código de Autenticidade</span>
                        <span className="font-mono text-primary font-bold">{cert.code}</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-surface-raised text-accent-gold font-bold">{cert.hours}h registradas</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border-subtle flex items-center gap-3">
                    <button
                      onClick={onOpenCertificateModal}
                      className="flex-1 py-2.5 px-4 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      Visualizar Certificado
                    </button>
                    <button
                      onClick={() => alert(`Iniciando download do PDF do certificado ${cert.code}...`)}
                      className="px-4 py-2.5 bg-surface-overlay hover:bg-surface-container text-text-primary text-xs font-bold rounded-xl border border-border-subtle flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      Baixar PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Horas Complementares */}
        {activeTab === 'horas' && (
          <div className="space-y-6">
            <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Dossiê de Atividades Complementares (AACC)</h2>
                  <p className="text-xs text-text-tertiary">Conforme diretrizes da Lei Federal nº 9.394/96 para aproveitamento universitário</p>
                </div>
                <button
                  onClick={() => alert('Dossiê consolidado de horas complementares gerado em PDF com sucesso!')}
                  className="px-4 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                  Exportar Dossiê da Matrícula
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle">
                  <span className="text-xs text-text-tertiary font-bold uppercase">Carga Total Contratada</span>
                  <p className="text-2xl font-bold text-text-primary mt-1">{totalHours} Horas</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle">
                  <span className="text-xs text-text-tertiary font-bold uppercase">Horas Concluídas &amp; Certificadas</span>
                  <p className="text-2xl font-bold text-accent-emerald-bright mt-1">{completedHours} Horas</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle">
                  <span className="text-xs text-text-tertiary font-bold uppercase">Horas em Andamento</span>
                  <p className="text-2xl font-bold text-accent-gold mt-1">{totalHours - completedHours} Horas</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-text-secondary uppercase">
                    <tr>
                      <th className="p-3.5 rounded-l-lg">Curso</th>
                      <th className="p-3.5">Categoria / Área</th>
                      <th className="p-3.5">Carga Horária</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 rounded-r-lg">Certificado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50">
                    {enrolledCourses.map((c) => {
                      const isDone = certificates.some((cert) => cert.courseId === c.id);
                      return (
                        <tr key={c.id} className="hover:bg-surface-overlay/50">
                          <td className="p-3.5 font-bold text-text-primary">{c.title}</td>
                          <td className="p-3.5 text-text-secondary">{c.category}</td>
                          <td className="p-3.5 font-bold text-primary">{c.hours}h</td>
                          <td className="p-3.5">
                            {isDone ? (
                              <span className="px-2 py-0.5 rounded bg-accent-emerald-bright/10 text-accent-emerald-bright font-bold">
                                Concluído
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-accent-gold/10 text-accent-gold font-bold">
                                Em andamento
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {isDone ? (
                              <button
                                onClick={onOpenCertificateModal}
                                className="text-primary hover:underline font-semibold"
                              >
                                Ver código
                              </button>
                            ) : (
                              <span className="text-text-tertiary">Pendente avaliação</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Financeiro */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6">
            {cancellationAlertToast && (
              <div className="p-4 rounded-xl bg-status-danger/15 border border-status-danger/40 flex items-center justify-between gap-3 text-xs text-text-primary animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-status-danger text-lg">check_circle</span>
                  <span>{cancellationAlertToast}</span>
                </div>
                <button
                  onClick={() => setCancellationAlertToast(null)}
                  className="text-text-tertiary hover:text-text-primary text-xs"
                >
                  Fechar
                </button>
              </div>
            )}

            <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Histórico de Pedidos &amp; Matrículas</h2>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Consulte faturas, recibos e gerencie solicitações de cancelamento dentro do prazo legal
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-tertiary bg-surface-overlay px-3 py-1.5 rounded-lg border border-border-subtle self-start sm:self-auto">
                  <span className="material-symbols-outlined text-amber-400 text-sm">schedule</span>
                  <span>Cancelamento em até 24h</span>
                </div>
              </div>

              <div className="space-y-3">
                {orders.map((ord) => {
                  const now = Date.now();
                  const hoursSincePurchase = (now - ord.purchaseTimestamp) / (1000 * 60 * 60);
                  const isWithin24h = hoursSincePurchase <= 24;

                  // Progress check
                  const coursePercentages = ord.courseIds.map((cId) => progressData[cId]?.percent || 0);
                  const maxCourseProgress = coursePercentages.length > 0 ? Math.max(...coursePercentages) : 0;
                  const isProgressAllowed = maxCourseProgress <= 80;

                  // Certificate check
                  const hasIssuedCert = certificates.some((cert) => ord.courseIds.includes(cert.courseId));

                  const isEligible = isWithin24h && isProgressAllowed && !hasIssuedCert;

                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-xl bg-surface-container-low border border-border-subtle flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:border-border-subtle/80 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-primary">Pedido #{ord.orderNumber}</span>
                          {ord.status === 'cancelamento_solicitado' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Cancelamento Solicitado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright">
                              Ativo
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-text-primary mt-1">{ord.title}</h4>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          Realizado em {ord.date} via {ord.paymentMethod} • NF-e #{ord.invoiceNumber}
                        </p>

                        {/* Status detalhado do pedido e das regras */}
                        {ord.status === 'cancelamento_solicitado' ? (
                          <div className="mt-2 text-xs text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 inline-block">
                            Chamado em análise pelo suporte • Aberto em {ord.cancellationRequestedAt}
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-3 text-[11px] text-text-tertiary flex-wrap">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">analytics</span>
                              Aproveitamento: <strong>{maxCourseProgress}%</strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">
                                {hasIssuedCert ? 'verified' : 'pending_actions'}
                              </span>
                              Certificado: <strong>{hasIssuedCert ? 'Já emitido' : 'Não emitido'}</strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              Prazo 24h:{' '}
                              <strong className={isWithin24h ? 'text-accent-emerald-bright' : 'text-text-tertiary'}>
                                {isWithin24h
                                  ? `${Math.max(0, Math.floor(24 - hoursSincePurchase))}h restantes`
                                  : 'Expirado'}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-end lg:self-center flex-wrap">
                        <div className="text-right mr-2">
                          <span className="text-sm font-bold text-primary">
                            R$ {ord.totalPrice.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="block text-[10px] text-accent-emerald-bright font-bold">
                            {ord.status === 'cancelamento_solicitado' ? 'Sob Análise' : 'Pago e Liquidado'}
                          </span>
                        </div>

                        {/* Botão de Solicitar Cancelamento */}
                        {ord.status !== 'cancelamento_solicitado' && (
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForCancellation(ord)}
                            className="px-3.5 py-2 rounded-lg bg-surface-overlay hover:bg-status-danger/15 text-text-secondary hover:text-status-danger border border-border-subtle hover:border-status-danger/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Solicitar cancelamento da matrícula e estorno"
                          >
                            <span className="material-symbols-outlined text-sm">cancel</span>
                            <span>Solicitar Cancelamento</span>
                          </button>
                        )}

                        {/* Botão de Comprovante */}
                        <button
                          onClick={() => alert(`Download do recibo e Nota Fiscal Eletrônica do pedido #${ord.orderNumber} iniciado!`)}
                          className="p-2 bg-surface-overlay hover:bg-surface-container rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          title="Baixar Comprovante & Nota Fiscal"
                        >
                          <span className="material-symbols-outlined text-base">receipt</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Dados Cadastrais */}
        {activeTab === 'perfil' && (
          <div className="space-y-6 max-w-6xl">
            {saveSuccessMsg && (
              <div className="p-4 rounded-xl bg-accent-emerald-bright/15 border border-accent-emerald-bright/40 flex items-center justify-between gap-3 text-xs text-text-primary animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent-emerald-bright text-lg">check_circle</span>
                  <span>{saveSuccessMsg}</span>
                </div>
                <button
                  onClick={() => setSaveSuccessMsg(null)}
                  className="text-text-tertiary hover:text-text-primary text-xs"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Layout em 2 Colunas: Coluna Esquerda (Matrícula, Foto & Endereço) e Coluna Direita (Dados para Emissão de Certificado) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* COLUNA ESQUERDA (7 cols): Dados de Matrícula, Foto & Endereço */}
              <div className="lg:col-span-7 bg-surface-raised rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Dados de Matrícula &amp; Perfil</h2>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Informações cadastrais, endereço do aluno e foto de perfil oficial
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">badge</span>
                    Cadastro Oficial
                  </span>
                </div>

                {/* SEÇÃO 1: FOTO DE PERFIL (Exportar / Upload / Predefinições) */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-border-subtle">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-base">account_circle</span>
                    <h3 className="text-sm font-bold text-text-primary">Foto de Perfil do Aluno</h3>
                  </div>
                  <p className="text-xs text-text-tertiary mb-3">
                    Esta foto será exibida no topo do portal ao lado do seu nome, na barra superior e nos registros acadêmicos.
                  </p>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Avatar Preview */}
                    <div className="relative group shrink-0">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt={formData.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-primary shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary flex items-center justify-center text-primary font-bold text-xl shadow-inner">
                          {formData.name ? formData.name.slice(0, 2).toUpperCase() : 'AL'}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-accent-emerald-bright rounded-full border-2 border-surface-raised shadow" title="Status: Ativo"></span>
                    </div>

                    <div className="flex-1 space-y-2.5 w-full">
                      {/* Botões de upload e exportar */}
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3.5 py-2 bg-primary hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
                          <span className="material-symbols-outlined text-base">upload</span>
                          <span>Exportar / Carregar Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const result = reader.result as string;
                                  setFormData((prev) => ({ ...prev, avatar: result }));
                                  setAvatarLoadFailed(false);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {formData.avatar && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, avatar: '' }));
                              setAvatarLoadFailed(true);
                            }}
                            className="px-3 py-2 bg-surface-overlay hover:bg-status-danger/20 text-text-tertiary hover:text-status-danger text-xs font-bold rounded-xl border border-border-subtle transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span>Remover</span>
                          </button>
                        )}
                      </div>

                      {/* Predefinições de avatares rápidos */}
                      <div>
                        <span className="text-[11px] text-text-tertiary block mb-1 font-medium">Ou escolha uma foto avatar pré-definida:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                          ].map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, avatar: url }));
                                setAvatarLoadFailed(false);
                              }}
                              className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 cursor-pointer ${
                                formData.avatar === url ? 'border-primary ring-2 ring-primary/40' : 'border-border-subtle opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 2: DADOS PESSOAIS */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary text-base">person</span>
                    <h3 className="text-sm font-bold text-text-primary">Identificação Pessoal</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        Nome Completo (Conforme Documento Oficial)
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                        placeholder="Ex: André Silva Costa"
                      />
                      <span className="text-[11px] text-text-tertiary mt-0.5 block">
                        Utilizado no cadastro oficial da instituição.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">E-mail Cadastrado</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">CPF Oficial</label>
                        <input
                          type="text"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Telefone / WhatsApp</label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                          placeholder="(11) 98765-4321"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 3: ENDEREÇO DO ALUNO */}
                <div className="pt-4 border-t border-border-subtle">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary text-base">home_pin</span>
                    <h3 className="text-sm font-bold text-text-primary">Endereço Residencial do Aluno</h3>
                  </div>
                  <p className="text-xs text-text-tertiary mb-3">
                    Endereço para emissão das notas fiscais dos pedidos e comprovação cadastral.
                  </p>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">CEP</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.cep}
                            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                            className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                            placeholder="00000-000"
                          />
                          <span className="material-symbols-outlined absolute right-2.5 top-2 text-text-tertiary text-sm pointer-events-none">
                            pin_drop
                          </span>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-text-secondary mb-1">Logradouro / Rua / Avenida</label>
                        <input
                          type="text"
                          value={formData.street}
                          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                          className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                          placeholder="Ex: Avenida Paulista"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Número</label>
                        <input
                          type="text"
                          value={formData.number}
                          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                          className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                          placeholder="123"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Complemento</label>
                        <input
                          type="text"
                          value={formData.complement}
                          onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                          className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                          placeholder="Apto, Bloco"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Bairro</label>
                        <input
                          type="text"
                          value={formData.neighborhood}
                          onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                          className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                          placeholder="Bairro"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Cidade</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                          placeholder="São Paulo"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">Estado (UF)</label>
                        <select
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer"
                        >
                          {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((uf) => (
                            <option key={uf} value={uf}>{uf}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUNA DIREITA (5 cols): Dados para Emissão de Certificado */}
              <div className="lg:col-span-5 bg-surface-raised rounded-2xl border border-primary/30 p-6 sm:p-7 shadow-sm space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">workspace_premium</span>
                      <h2 className="text-lg font-bold text-text-primary">Dados para Emissão de Certificado</h2>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Configure como seu nome, documento e assinatura aparecerão no certificado
                    </p>
                  </div>
                </div>

                {/* Campo 1: Nome Completo Editável no Certificado */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-text-secondary flex items-center gap-1">
                      <span>Nome Completo no Certificado</span>
                      <span className="material-symbols-outlined text-xs text-primary" title="Editável">edit</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCertFormData((prev) => ({ ...prev, customName: formData.name }))}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Copiar da Matrícula
                    </button>
                  </div>
                  <input
                    type="text"
                    value={certFormData.customName}
                    onChange={(e) => setCertFormData({ ...certFormData, customName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary transition-colors font-medium"
                    placeholder="Nome que você deseja no certificado"
                  />
                  <span className="text-[11px] text-text-tertiary mt-1 block">
                    O aluno pode editar este nome para emissão (ex: inclusão de sobrenome ou nome social).
                  </span>
                </div>

                {/* Campo 2: CPF Editável no Certificado */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-text-secondary flex items-center gap-1">
                      <span>CPF no Certificado</span>
                      <span className="material-symbols-outlined text-xs text-primary" title="Editável">edit</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCertFormData((prev) => ({ ...prev, customCpf: formData.cpf }))}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Copiar da Matrícula
                    </button>
                  </div>
                  <input
                    type="text"
                    value={certFormData.customCpf}
                    onChange={(e) => setCertFormData({ ...certFormData, customCpf: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary transition-colors font-mono"
                    placeholder="000.000.000-00"
                  />
                  <span className="text-[11px] text-text-tertiary mt-1 block">
                    Documento de CPF que constará no verso e validação de autenticidade do certificado.
                  </span>
                </div>

                {/* Campo 3: Campo Assinatura com 3 Opções */}
                <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">draw</span>
                      <span className="text-xs font-bold text-text-primary">Assinatura do Aluno</span>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
                      {certFormData.signatureType === 'upload'
                        ? 'Arquivo Importado'
                        : certFormData.signatureType === 'draw'
                        ? 'Feita na Tela'
                        : 'Pré-definida'}
                    </span>
                  </div>

                  <p className="text-[11px] text-text-tertiary">
                    Esta assinatura será estampada no seu certificado de conclusão.
                  </p>

                  {/* Pré-visualização da Assinatura Atual */}
                  <div className="h-24 w-full bg-surface-raised rounded-xl border border-dashed border-border-subtle p-3 flex items-center justify-center relative overflow-hidden">
                    {certFormData.signatureType === 'automatic' ? (
                      <div className="text-center px-3">
                        <span
                          className={`text-xl text-primary font-bold select-none ${
                            certFormData.fontStyle === 'font-handwriting'
                              ? 'italic font-light tracking-wider'
                              : certFormData.fontStyle === 'font-formal'
                              ? 'font-serif tracking-wide italic'
                              : certFormData.fontStyle === 'font-modern'
                              ? 'font-mono tracking-widest uppercase text-sm'
                              : 'font-serif italic'
                          }`}
                          style={{
                            fontFamily:
                              certFormData.fontStyle === 'font-handwriting'
                                ? 'Brush Script MT, cursive, sans-serif'
                                : certFormData.fontStyle === 'font-formal'
                                ? 'Palatino, serif'
                                : certFormData.fontStyle === 'font-modern'
                                ? 'Courier New, monospace'
                                : 'Georgia, serif',
                          }}
                        >
                          {certFormData.customName || formData.name || 'Assinatura do Aluno'}
                        </span>
                        <div className="w-28 h-[1.5px] bg-primary/40 mx-auto mt-1"></div>
                        <span className="text-[10px] text-text-tertiary block mt-0.5">Assinatura Automática</span>
                      </div>
                    ) : certFormData.signatureImage ? (
                      <div className="flex flex-col items-center justify-center max-h-full">
                        <img
                          src={certFormData.signatureImage}
                          alt="Assinatura"
                          className="max-h-16 max-w-full object-contain filter drop-shadow-sm"
                        />
                        <div className="w-28 h-[1px] bg-border-subtle mx-auto mt-1"></div>
                      </div>
                    ) : (
                      <div className="text-center text-text-tertiary text-xs flex flex-col items-center gap-1">
                        <span className="material-symbols-outlined text-lg">stylus_note</span>
                        <span>Nenhuma assinatura configurada</span>
                      </div>
                    )}
                  </div>

                  {/* Botão de Ação para Assinatura */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSignatureModalOpen(true)}
                      className="flex-1 py-2.5 px-3 bg-primary hover:bg-accent-emerald-bright text-on-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.01]"
                    >
                      <span className="material-symbols-outlined text-base">signature</span>
                      <span>Configurar Assinatura</span>
                    </button>

                    {certFormData.signatureType !== 'automatic' && (
                      <button
                        type="button"
                        onClick={() =>
                          setCertFormData((prev) => ({
                            ...prev,
                            signatureType: 'automatic',
                            signatureImage: '',
                            fontStyle: 'font-script',
                          }))
                        }
                        className="p-2.5 bg-surface-overlay hover:bg-surface-container text-text-tertiary hover:text-accent-crimson rounded-xl border border-border-subtle transition-colors cursor-pointer"
                        title="Restaurar Automático Padrão"
                      >
                        <span className="material-symbols-outlined text-base">refresh</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 pt-1 text-[11px] text-text-tertiary">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-primary">upload_file</span>
                      <span>Opção 1: Exportar assinatura pronta do dispositivo</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-primary">gesture</span>
                      <span>Opção 2: Assinar na tela com caneta ou mouse</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-primary">auto_fix_high</span>
                      <span>Opção 3: Automática com opções de fontes estilizadas</span>
                    </div>
                  </div>
                </div>

                {/* Preview Resumo */}
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                    <span className="material-symbols-outlined text-sm">preview</span>
                    <span>Resumo da Emissão:</span>
                  </div>
                  <p className="text-[11px] text-text-secondary pl-5">
                    <strong className="text-text-primary">Nome:</strong> {certFormData.customName || formData.name}
                  </p>
                  <p className="text-[11px] text-text-secondary pl-5">
                    <strong className="text-text-primary">CPF:</strong> {certFormData.customCpf || formData.cpf}
                  </p>
                </div>
              </div>

            </div>

            {/* BARRA INFERIOR UNIFICADA: Salvar Todos os Dados */}
            <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-between flex-wrap gap-4 shadow-sm">
              <p className="text-xs text-text-tertiary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">lock</span>
                Dados cadastrais e dados de certificação protegidos pela LGPD e salvos na sua matrícula.
              </p>

              <button
                type="button"
                onClick={() => {
                  const updatedUser: UserAccount = {
                    ...user,
                    name: formData.name,
                    email: formData.email,
                    cpf: formData.cpf,
                    phone: formData.phone,
                    avatar: formData.avatar,
                    address: {
                      cep: formData.cep,
                      street: formData.street,
                      number: formData.number,
                      complement: formData.complement,
                      neighborhood: formData.neighborhood,
                      city: formData.city,
                      state: formData.state,
                    },
                    certificateData: {
                      customName: certFormData.customName,
                      customCpf: certFormData.customCpf,
                      signatureType: certFormData.signatureType,
                      signatureImage: certFormData.signatureImage,
                      fontStyle: certFormData.fontStyle,
                    },
                  };
                  if (onUpdateUser) {
                    onUpdateUser(updatedUser);
                  }
                  setAvatarLoadFailed(false);
                  setSaveSuccessMsg('Dados da matrícula, endereço e dados de emissão de certificado salvos com sucesso!');
                  setTimeout(() => setSaveSuccessMsg(null), 5000);
                }}
                className="px-6 py-2.5 bg-primary hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">save</span>
                Salvar Alterações
              </button>
            </div>
          </div>
        )}

        {/* Lesson Player Modal with Modules, Lessons, Videos, Materials (Word/Excel) & Quizzes */}
        <StudentCoursePlayerModal
          isOpen={activeLessonModal.isOpen}
          course={activeLessonModal.course}
          onClose={() => setActiveLessonModal({ isOpen: false, course: null, lessonTitle: '' })}
          onCompleteLesson={(courseId, lessonId, lessonTitle) => {
            setActiveLessonModal((prev) => ({ ...prev, lessonTitle }));
            if (onCompleteLesson) {
              onCompleteLesson(courseId, lessonId, lessonTitle);
            }
          }}
        />

        {/* Cancellation Alert & Reason Modal */}
        <CancellationModal
          isOpen={!!selectedOrderForCancellation}
          order={selectedOrderForCancellation}
          progressData={progressData}
          certificates={certificates}
          onClose={() => setSelectedOrderForCancellation(null)}
          onConfirmCancellation={handleConfirmCancellation}
        />

        {/* Modal de Configuração de Assinatura (Exportar / Desenho / Automático) */}
        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          currentSignature={certFormData.signatureImage}
          currentSignatureType={certFormData.signatureType}
          currentFontStyle={certFormData.fontStyle}
          studentName={certFormData.customName || formData.name || 'Aluno'}
          onSave={(sigImage, sigType, fontStyle) => {
            setCertFormData((prev) => ({
              ...prev,
              signatureImage: sigImage,
              signatureType: sigType,
              fontStyle: fontStyle,
            }));
            setIsSignatureModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};
