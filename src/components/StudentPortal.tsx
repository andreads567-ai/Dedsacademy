import React, { useState, useEffect, useMemo } from 'react';
import { Course, CertificateItem, StudentProgress, UserAccount, StudentOrder, CourseReview, Category, SupportTicket, StudentBannersConfig } from '../types';
import { INITIAL_ORDERS, INITIAL_SUPPORT_TICKETS } from '../data/usersData';
import { CancellationModal } from './CancellationModal';
import { StudentCourseStudyPage } from './StudentCourseStudyPage';
import { StudentBannerCarousel } from './StudentBannerCarousel';
import { getStoredStudentBanners } from '../services/studentBannersService';
import { downloadCertificatePdf, downloadCertificatePng } from '../utils/certificateGenerator';
import { getCacheBustedImageUrl, FALLBACK_COURSE_IMAGE } from '../lib/cacheManager';

interface StudentPortalProps {
  user: UserAccount;
  onUpdateUser?: (updatedUser: UserAccount) => void;
  enrolledCourses: Course[];
  allCourses?: Course[];
  categories?: Category[];
  progressData: Record<string, StudentProgress>;
  certificates: CertificateItem[];
  studentBannersConfig?: StudentBannersConfig;
  onNavigateHome: (sectionId?: string) => void;
  onLogout: () => void;
  onOpenCertificateModal: (code?: string) => void;
  onOpenCatalog?: () => void;
  onCompleteLesson?: (courseId: string, lessonId: string, lessonTitle: string) => void;
  onCancelEnrollment?: (courseIds: string[]) => void;
  onSubmitReview?: (review: CourseReview) => void;
  onEnrollCourse?: (course: Course) => void;
  onStartCourse?: (course: Course) => void;
  onAddToCart?: (course: Course) => void;
  onSelectCourse?: (course: Course) => void;
  onOpenCart?: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  user,
  onUpdateUser,
  enrolledCourses,
  allCourses = [],
  categories = [],
  progressData,
  certificates,
  studentBannersConfig,
  onNavigateHome,
  onLogout,
  onOpenCertificateModal,
  onOpenCatalog,
  onCompleteLesson,
  onCancelEnrollment,
  onSubmitReview,
  onEnrollCourse,
  onStartCourse,
  onAddToCart,
  onSelectCourse,
  onOpenCart,
}) => {
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [bannersConfig, setBannersConfig] = useState<StudentBannersConfig>(() =>
    studentBannersConfig || getStoredStudentBanners()
  );

  useEffect(() => {
    if (studentBannersConfig) {
      setBannersConfig(studentBannersConfig);
    }
  }, [studentBannersConfig]);

  useEffect(() => {
    const handleSync = () => {
      setBannersConfig(getStoredStudentBanners());
    };
    window.addEventListener('deds_student_banners_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('deds_student_banners_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);
  const [activeTab, setActiveTab] = useState<'cursos' | 'certificados' | 'horas' | 'financeiro' | 'suporte' | 'perfil'>('cursos');
  const [studentTickets, setStudentTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('deds_support_tickets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SUPPORT_TICKETS;
  });
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('Dúvida sobre Aulas e Metodologia');
  const [newTicketPriority, setNewTicketPriority] = useState<'alta' | 'media' | 'baixa'>('media');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [newTicketCourse, setNewTicketCourse] = useState('');
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
    setAvatarLoadFailed(false);
  }, [user]);

  // Consulta automática ao ViaCEP no perfil do aluno
  const handleStudentCepChange = async (val: string) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length > 8) clean = clean.slice(0, 8);
    const masked = clean.replace(/^(\d{5})(\d)/, '$1-$2');
    setFormData((prev) => ({ ...prev, cep: masked }));

    if (clean.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        if (res.ok) {
          const data = await res.json();
          if (!data.erro) {
            setFormData((prev) => ({
              ...prev,
              cep: clean.replace(/^(\d{5})(\d{3})$/, '$1-$2'),
              street: data.logradouro || prev.street,
              neighborhood: data.bairro || prev.neighborhood,
              city: data.localidade || prev.city,
              state: data.uf || prev.state,
            }));
          }
        }
      } catch (e) {
        console.warn('ViaCEP StudentPortal err:', e);
      }
    }
  };

  const [activeLessonModal, setActiveLessonModal] = useState<{
    isOpen: boolean;
    course: Course | null;
    lessonTitle: string;
  }>({
    isOpen: false,
    course: null,
    lessonTitle: '',
  });

  // Unifica todos os cursos do aluno: matriculados + cursos de certificados oficiais emitidos
  const allStudentCourses = useMemo(() => {
    const list: Course[] = [...enrolledCourses];
    certificates.forEach((cert) => {
      const already = list.some(
        (c) => c.id === cert.courseId || c.title.trim().toLowerCase() === cert.courseTitle.trim().toLowerCase()
      );
      if (!already) {
        list.push({
          id: cert.courseId || `cert-course-${cert.id}`,
          title: cert.courseTitle,
          description: `Curso com certificado oficial emitido em ${cert.issueDate}`,
          category: cert.courseCategory || 'Capacitação Profissional',
          hours: cert.hours || 0,
          currentPrice: 0,
          originalPrice: 0,
          rating: 5.0,
          reviewsCount: 1,
          badge: { text: 'Certificado Emitido', variant: 'emerald' },
          filterTags: ['Certificado Emitido'],
          status: 'publicado',
          instructor: cert.instructor || 'Deds Academy',
          image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
          modules: [],
        });
      }
    });
    return list;
  }, [enrolledCourses, certificates]);

  const validCertificates = useMemo(() => {
    return certificates.filter((c) => c.status !== 'cancelado');
  }, [certificates]);

  // Carga horária total concluída e certificada
  const completedHours = useMemo(() => {
    return validCertificates.reduce((acc, cert) => acc + (cert.hours || 0), 0);
  }, [validCertificates]);

  // Cursos em andamento: cursos de allStudentCourses que ainda não possuem certificado válido
  const inProgressCourses = useMemo(() => {
    return allStudentCourses.filter(
      (course) =>
        !validCertificates.some(
          (cert) =>
            cert.courseId === course.id ||
            cert.courseTitle.trim().toLowerCase() === course.title.trim().toLowerCase()
        )
    );
  }, [allStudentCourses, validCertificates]);

  // Horas em andamento: soma das horas dos cursos ainda em andamento (nunca negativo!)
  const inProgressHours = useMemo(() => {
    return inProgressCourses.reduce((acc, c) => acc + (c.hours || 0), 0);
  }, [inProgressCourses]);

  const totalRegisteredHours = completedHours + inProgressHours;
  const totalHours = totalRegisteredHours;

  // Filtros para a aba Meus Certificados
  const [certCourseFilter, setCertCourseFilter] = useState<string>('todos');
  const [certDateOrder, setCertDateOrder] = useState<'recentes' | 'antigos'>('recentes');
  const [certSearchQuery, setCertSearchQuery] = useState<string>('');

  const parseCertDate = (dStr?: string) => {
    if (!dStr) return 0;
    const parts = dStr.trim().split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day).getTime() || 0;
    }
    return new Date(dStr).getTime() || 0;
  };

  const uniqueCertCourses = useMemo(() => {
    const set = new Set<string>();
    certificates.forEach((c) => {
      if (c.courseTitle) set.add(c.courseTitle);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    return certificates
      .filter((cert) => {
        if (certCourseFilter !== 'todos' && cert.courseTitle !== certCourseFilter) {
          return false;
        }
        if (certSearchQuery.trim()) {
          const q = certSearchQuery.toLowerCase();
          const matchTitle = (cert.courseTitle || '').toLowerCase().includes(q);
          const matchCode = (cert.code || '').toLowerCase().includes(q);
          const matchInstructor = (cert.instructor || '').toLowerCase().includes(q);
          if (!matchTitle && !matchCode && !matchInstructor) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = parseCertDate(a.issueDate);
        const timeB = parseCertDate(b.issueDate);
        return certDateOrder === 'recentes' ? timeB - timeA : timeA - timeB;
      });
  }, [certificates, certCourseFilter, certDateOrder, certSearchQuery]);

  // Registros estruturados para a tabela de AACC
  const aaccTableItems = useMemo(() => {
    type AaccItem = {
      id: string;
      courseTitle: string;
      category: string;
      hours: number;
      status: 'concluido' | 'em_andamento' | 'cancelado';
      certCode?: string;
      issueDate?: string;
    };

    const items: AaccItem[] = [];

    // 1. Cursos com certificados válidos (Concluídos)
    validCertificates.forEach((cert) => {
      items.push({
        id: `cert-${cert.id}`,
        courseTitle: cert.courseTitle,
        category: cert.courseCategory || 'Capacitação Profissional',
        hours: cert.hours || 0,
        status: 'concluido',
        certCode: cert.code,
        issueDate: cert.issueDate,
      });
    });

    // 2. Certificados cancelados (se houver)
    certificates
      .filter((c) => c.status === 'cancelado')
      .forEach((cert) => {
        items.push({
          id: `cert-cancelled-${cert.id}`,
          courseTitle: cert.courseTitle,
          category: cert.courseCategory || 'Capacitação Profissional',
          hours: cert.hours || 0,
          status: 'cancelado',
          certCode: cert.code,
          issueDate: cert.issueDate,
        });
      });

    // 3. Cursos em andamento (cursos matriculados que ainda não possuem certificado)
    inProgressCourses.forEach((course) => {
      const isCancelledOrder = orders.some(
        (o) =>
          (o.status === 'cancelado' || o.status === 'cancelamento_solicitado') &&
          o.courseIds.includes(course.id)
      );

      items.push({
        id: `course-${course.id}`,
        courseTitle: course.title,
        category: course.category || 'Geral',
        hours: course.hours || 0,
        status: isCancelledOrder ? 'cancelado' : 'em_andamento',
      });
    });

    return items;
  }, [validCertificates, certificates, inProgressCourses, orders]);

  const handleOpenLesson = (course: Course) => {
    const progress = progressData[course.id];
    setActiveLessonModal({
      isOpen: true,
      course,
      lessonTitle: progress?.lastLessonTitle || 'Módulo 1: Introdução e Visão Geral',
    });
  };

  // Category filter state for enrolled courses and recommended courses
  const [enrolledCategoryFilter, setEnrolledCategoryFilter] = useState<string>('Todos');
  const [recommendedCategoryFilter, setRecommendedCategoryFilter] = useState<string>('Todas');

  const enrolledCategories = useMemo(() => {
    const set = new Set<string>();
    enrolledCourses.forEach((c) => set.add(c.category));
    return ['Todos', ...Array.from(set)];
  }, [enrolledCourses]);

  const displayedEnrolledCourses = useMemo(() => {
    if (enrolledCategoryFilter === 'Todos') return enrolledCourses;
    return enrolledCourses.filter((c) => c.category === enrolledCategoryFilter);
  }, [enrolledCourses, enrolledCategoryFilter]);

  const effectiveCategoriesList = useMemo(() => {
    if (categories && categories.length > 0) return categories.map((c) => c.name);
    const set = new Set<string>();
    allCourses.forEach((c) => set.add(c.category));
    return Array.from(set);
  }, [categories, allCourses]);

  const recommendedCategoriesList = useMemo(() => {
    return effectiveCategoriesList;
  }, [effectiveCategoriesList]);

  const displayedRecommendedCourses = useMemo(() => {
    // Cursos indicados com alta reputação (rating >= 4.0) ou catálogo completo
    const highRated = allCourses.filter((c) => (c.rating || 5) >= 4.0);
    const source = highRated.length > 0 ? highRated : allCourses;
    if (recommendedCategoryFilter === 'Todas') return source;
    return source.filter((c) => c.category.toLowerCase() === recommendedCategoryFilter.toLowerCase());
  }, [allCourses, recommendedCategoryFilter]);

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

        {/* Banner Carrossel Retangular do Painel do Aluno (Até 6 banners com transição e pausa por clique) */}
        <StudentBannerCarousel config={bannersConfig} onOpenCatalog={onOpenCatalog} />

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-raised p-5 rounded-xl border border-border-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-text-primary">{allStudentCourses.length}</span>
              <p className="text-xs text-text-tertiary">Cursos Matriculados</p>
            </div>
          </div>

          <div className="bg-surface-raised p-5 rounded-xl border border-border-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-gold/10 text-accent-gold flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">schedule</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-text-primary">
                {completedHours > 0 ? `${completedHours}h` : `${totalRegisteredHours}h`}
              </span>
              <p className="text-xs text-text-tertiary">Carga Horária Concluída</p>
            </div>
          </div>

          <div className="bg-surface-raised p-5 rounded-xl border border-border-subtle flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-emerald-bright/10 text-accent-emerald-bright flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-text-primary">{validCertificates.length}</span>
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
          <div className="space-y-8">
            {/* Top Bar with Title and Quick Add */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Continuar Aprendendo</h2>
                <p className="text-xs text-text-tertiary mt-0.5">Acesse suas salas de aula virtuais e retome suas aulas de onde parou</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => (onOpenCatalog ? onOpenCatalog() : onNavigateHome('cursos-section'))}
                  className="px-4 py-2 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  title="Acessar todas as categorias e cursos disponíveis"
                >
                  <span className="material-symbols-outlined text-sm">storefront</span>
                  Ver Categoria Completa
                </button>
              </div>
            </div>

            {/* Category Filter Pills for Enrolled Courses */}
            {enrolledCategories.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-text-tertiary shrink-0 font-medium mr-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">filter_alt</span>
                  Filtrar Cursos:
                </span>
                {enrolledCategories.map((cat) => {
                  const isSelected = enrolledCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEnrolledCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                          : 'bg-surface-raised text-text-secondary hover:text-text-primary hover:bg-surface-overlay border border-border-subtle'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Grid of Enrolled Courses */}
            {displayedEnrolledCourses.length === 0 ? (
              <div className="p-8 text-center bg-surface-raised border border-border-subtle rounded-2xl space-y-2">
                <span className="material-symbols-outlined text-4xl text-text-tertiary">school</span>
                <p className="text-sm font-bold text-text-primary">Nenhum curso encontrado nesta categoria.</p>
                <p className="text-xs text-text-tertiary">
                  Tente selecionar "Todos" ou explore as categorias abaixo para matricular-se em novas formações.
                </p>
                <button
                  type="button"
                  onClick={() => setEnrolledCategoryFilter('Todos')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer"
                >
                  Mostrar Todos os Meus Cursos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedEnrolledCourses.map((course) => {
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
                      <div
                        className="relative h-44 w-full bg-surface-base overflow-hidden cursor-pointer"
                        onClick={() => handleOpenLesson(course)}
                        title="Abrir sala de aula"
                      >
                        <img
                          src={getCacheBustedImageUrl(course.image)}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_COURSE_IMAGE;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-transparent to-transparent"></div>
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-bold bg-surface-dim/80 backdrop-blur-md text-primary">
                          {course.category}
                        </span>
                        {isCompleted ? (
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-bold bg-accent-emerald-bright text-on-primary flex items-center gap-1 shadow">
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
                          <h3
                            onClick={() => handleOpenLesson(course)}
                            className="text-base font-bold text-text-primary line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
                          >
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
                            type="button"
                            onClick={() => handleOpenLesson(course)}
                            className="flex-1 py-2.5 px-4 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <span className="material-symbols-outlined text-base">play_arrow</span>
                            {isCompleted ? 'Reassistir Curso' : 'Continuar Aula'}
                          </button>
                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => {
                                const matchCert = certificates.find(
                                  (c) => c.courseTitle.toLowerCase() === course.title.toLowerCase() || c.courseId === course.id
                                );
                                onOpenCertificateModal(matchCert?.code);
                              }}
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
            )}

            {/* ===================================================================
                CURSOS INDICADOS (FORMAÇÕES COM REPUTAÇÃO ENTRE 4 E 5 ESTRELAS)
               =================================================================== */}
            <div id="secao-cursos-indicados" className="pt-8 border-t border-border-subtle space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider block flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-accent-gold" style={{ fontVariationSettings: "'FILL' 1" }}>recommend</span>
                    Seleção Recomendada • Alta Reputação
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-text-primary mt-1">
                    Cursos Indicados
                  </h3>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Formações recomendadas com reputações de excelência entre 4.0 e 5.0 estrelas e grande número de avaliações.
                  </p>
                </div>
              </div>

              {/* Category Pills Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setRecommendedCategoryFilter('Todas')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    recommendedCategoryFilter === 'Todas'
                      ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                      : 'bg-surface-raised text-text-secondary hover:text-text-primary hover:bg-surface-overlay border border-border-subtle'
                  }`}
                >
                  Todas as Categorias
                </button>
                {recommendedCategoriesList.map((catName) => {
                  const isSelected = recommendedCategoryFilter.toLowerCase() === catName.toLowerCase();
                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setRecommendedCategoryFilter(catName)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                          : 'bg-surface-raised text-text-secondary hover:text-text-primary hover:bg-surface-overlay border border-border-subtle'
                      }`}
                    >
                      {catName}
                    </button>
                  );
                })}
              </div>

              {/* Grid of Recommended Courses */}
              {displayedRecommendedCourses.length === 0 ? (
                <div className="p-8 text-center bg-surface-raised border border-border-subtle rounded-2xl space-y-2">
                  <span className="material-symbols-outlined text-3xl text-text-tertiary">search_off</span>
                  <p className="text-sm font-bold text-text-primary">Nenhum curso indicado nesta categoria.</p>
                  <button
                    type="button"
                    onClick={() => setRecommendedCategoryFilter('Todas')}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer"
                  >
                    Ver Todas as Indicações
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedRecommendedCourses.map((course) => {
                    const isEnrolled = enrolledCourses.some((c) => c.id === course.id);

                    return (
                      <div
                        key={course.id}
                        className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden flex flex-col justify-between shadow-sm hover:border-primary/50 transition-all group hover:shadow-md cursor-pointer"
                        onClick={() => {
                          if (isEnrolled) {
                            handleOpenLesson(course);
                          } else if (onSelectCourse) {
                            onSelectCourse(course);
                          } else if (onOpenCatalog) {
                            onOpenCatalog();
                          }
                        }}
                        title={isEnrolled ? "Acessar aula deste curso" : "Ver detalhes do curso"}
                      >
                        <div>
                          <div className="relative h-44 w-full bg-surface-base overflow-hidden">
                            <img
                              src={getCacheBustedImageUrl(course.image)}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = FALLBACK_COURSE_IMAGE;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-transparent to-transparent"></div>
                            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[11px] font-bold bg-surface-dim/80 backdrop-blur-md text-primary">
                              {course.category}
                            </span>
                            <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-accent-gold/95 text-black flex items-center gap-0.5 shadow-sm">
                              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              {(course.rating || 5.0).toFixed(1)}
                            </span>
                            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-white font-mono">
                              {course.hours}h
                            </span>
                          </div>

                          <div className="p-4 space-y-2">
                            <h4 className="text-sm font-bold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
                              {course.title}
                            </h4>
                            <p className="text-xs text-text-tertiary line-clamp-2 leading-relaxed">
                              {course.description}
                            </p>
                            <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border-subtle/50">
                              <span>Instrutor: <strong className="text-text-secondary">{course.instructor}</strong></span>
                              <span className="text-text-tertiary">
                                {course.reviewsCount || 0} avaliações
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          {/* Price preview */}
                          <div className="flex items-center justify-between mb-3 pt-2 border-t border-border-subtle/50">
                            <div>
                              {course.originalPrice > course.currentPrice && (
                                <span className="text-[10px] text-text-tertiary line-through block leading-none">
                                  R$ {course.originalPrice.toFixed(2).replace('.', ',')}
                                </span>
                              )}
                              <span className="text-sm font-black text-accent-emerald-bright">
                                R$ {course.currentPrice.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                              Certificado Incluso
                            </span>
                          </div>

                          {isEnrolled ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenLesson(course);
                              }}
                              className="w-full py-2.5 px-3 rounded-xl bg-accent-emerald-bright hover:bg-primary text-on-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                            >
                              <span className="material-symbols-outlined text-base">play_arrow</span>
                              <span>Já Matriculado • Acessar Aula</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSelectCourse) {
                                    onSelectCourse(course);
                                  } else if (onOpenCatalog) {
                                    onOpenCatalog();
                                  }
                                }}
                                className="flex-1 py-2.5 px-2 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-text-primary text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                                title="Ver conteúdo completo do curso"
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                                <span>Ver Curso</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onAddToCart) {
                                    onAddToCart(course);
                                  }
                                  if (onOpenCart) {
                                    onOpenCart();
                                  }
                                }}
                                className="flex-1 py-2.5 px-2 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md active:scale-95 shadow-[0_0_12px_rgba(0,176,116,0.25)]"
                                title="Adicionar ao carrinho para realizar o pagamento"
                              >
                                <span className="material-symbols-outlined text-sm">shopping_cart</span>
                                <span>Adicionar Carrinho</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Meus Certificados */}
        {activeTab === 'certificados' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text-primary">Certificados Oficiais Emitidos</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {certificates.length} {certificates.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>
                <p className="text-xs text-text-tertiary">Documentos com código de verificação criptográfica válidos em todo o território nacional</p>
              </div>
              <button
                onClick={onOpenCertificateModal}
                className="px-4 py-2 bg-surface-overlay hover:bg-surface-container text-primary text-xs font-bold rounded-xl border border-border-subtle flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-base">verified</span>
                Validar Autenticidade
              </button>
            </div>

            {/* Barra de Filtros: Por Curso, Por Data e Busca */}
            <div className="bg-surface-raised rounded-2xl border border-border-subtle p-4 shadow-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                {/* Filtro por Curso */}
                <div className="lg:col-span-5">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase block mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">school</span>
                    Filtrar por Curso
                  </label>
                  <select
                    value={certCourseFilter}
                    onChange={(e) => setCertCourseFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="todos">Todos os Cursos ({certificates.length})</option>
                    {uniqueCertCourses.map((cTitle) => (
                      <option key={cTitle} value={cTitle}>
                        {cTitle}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro / Ordenação por Data */}
                <div className="lg:col-span-3">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase block mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">calendar_today</span>
                    Filtrar / Ordenar por Data
                  </label>
                  <select
                    value={certDateOrder}
                    onChange={(e) => setCertDateOrder(e.target.value as 'recentes' | 'antigos')}
                    className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="recentes">Mais Recentes Primeiro</option>
                    <option value="antigos">Mais Antigos Primeiro</option>
                  </select>
                </div>

                {/* Busca Rápida */}
                <div className="lg:col-span-4">
                  <label className="text-[11px] font-bold text-text-tertiary uppercase block mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">search</span>
                    Buscar Certificado
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={certSearchQuery}
                      onChange={(e) => setCertSearchQuery(e.target.value)}
                      placeholder="Curso, código (DA...) ou instrutor"
                      className="w-full pl-9 pr-7 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary"
                    />
                    <span className="material-symbols-outlined text-sm text-text-tertiary absolute left-2.5 top-2.5">
                      search
                    </span>
                    {certSearchQuery && (
                      <button
                        onClick={() => setCertSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-text-tertiary hover:text-text-primary cursor-pointer"
                        title="Limpar busca"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Status do Filtro e Botão de Limpar */}
              <div className="flex items-center justify-between text-xs text-text-tertiary pt-2 border-t border-border-subtle/50 flex-wrap gap-2">
                <span>
                  Exibindo <strong className="text-text-primary font-bold">{filteredCertificates.length}</strong> de{' '}
                  <strong className="text-text-primary font-bold">{certificates.length}</strong> certificados emitidos
                </span>

                {(certCourseFilter !== 'todos' || certSearchQuery.trim() || certDateOrder !== 'recentes') && (
                  <button
                    onClick={() => {
                      setCertCourseFilter('todos');
                      setCertSearchQuery('');
                      setCertDateOrder('recentes');
                    }}
                    className="px-2.5 py-1 bg-surface-overlay hover:bg-surface-container text-xs font-bold text-text-secondary hover:text-text-primary rounded-lg border border-border-subtle flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">filter_alt_off</span>
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>

            {filteredCertificates.length === 0 ? (
              <div className="bg-surface-raised rounded-2xl border border-dashed border-border-subtle p-12 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-text-tertiary">filter_none</span>
                <h3 className="text-sm font-bold text-text-primary">Nenhum certificado encontrado</h3>
                <p className="text-xs text-text-tertiary max-w-sm mx-auto">
                  {certificates.length === 0
                    ? 'Você ainda não possui certificados oficiais emitidos. Complete um curso para obter seu certificado com autenticidade reconhecida.'
                    : 'Nenhum certificado corresponde aos filtros selecionados. Tente alterar os critérios de busca.'}
                </p>
                {(certCourseFilter !== 'todos' || certSearchQuery.trim() || certDateOrder !== 'recentes') && (
                  <button
                    onClick={() => {
                      setCertCourseFilter('todos');
                      setCertSearchQuery('');
                      setCertDateOrder('recentes');
                    }}
                    className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCertificates.map((cert) => (
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
                          {cert.studentName || user.name}
                        </span>{' '}
                        (CPF: {cert.studentCpf || user.cpf})
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">Instrutor: {cert.instructor}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        CNPJ Deds Academy:{' '}
                        <span className="font-mono text-text-primary font-medium">
                          {(typeof window !== 'undefined' ? localStorage.getItem('deds_institution_cnpj') : null)?.trim() ||
                            (cert.institutionCnpj && cert.institutionCnpj !== '45.678.901/0001-23'
                              ? cert.institutionCnpj
                              : null) ||
                            cert.institutionCnpj ||
                            '45.678.901/0001-23'}
                        </span>
                      </p>

                      <div className="mt-4 p-3 rounded-xl bg-surface-container-low border border-border-subtle flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-text-tertiary block">Código de Autenticidade</span>
                          <span className="font-mono text-primary font-bold">{cert.code}</span>
                        </div>
                        <span className="px-2 py-1 rounded bg-surface-raised text-accent-gold font-bold">{cert.hours}h registradas</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border-subtle flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => onOpenCertificateModal(cert.code)}
                        className="flex-1 py-2.5 px-4 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                        Visualizar
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const activeCnpj =
                              (typeof window !== 'undefined' ? localStorage.getItem('deds_institution_cnpj') : null)?.trim() ||
                              (cert.institutionCnpj && cert.institutionCnpj !== '45.678.901/0001-23'
                                ? cert.institutionCnpj
                                : null) ||
                              cert.institutionCnpj ||
                              '45.678.901/0001-23';
                            await downloadCertificatePdf({
                              studentName: cert.studentName || user.name,
                              studentCpf: cert.studentCpf || user.cpf,
                              studentCode: cert.studentCode || user.studentCode,
                              courseTitle: cert.courseTitle,
                              courseCategory: cert.courseCategory,
                              hours: cert.hours,
                              issueDate: cert.issueDate,
                              code: cert.code,
                              instructor: cert.instructor,
                              institutionCnpj: activeCnpj,
                            });
                          } catch (err) {
                            console.error('Erro ao gerar certificado:', err);
                            alert('Erro ao gerar PDF do certificado.');
                          }
                        }}
                        className="px-4 py-2.5 bg-accent-gold/20 hover:bg-accent-gold/30 text-accent-gold text-xs font-bold rounded-xl border border-accent-gold/40 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                        title="Baixar Certificado Oficial em PDF A4 Paisagem"
                      >
                        <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                        Baixar PDF Oficial
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Horas Complementares */}
        {activeTab === 'horas' && (
          <div className="space-y-6">
            <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Dossiê de Atividades Complementares (AACC)</h2>
                  <p className="text-xs text-text-tertiary">Conforme diretrizes da Lei Federal nº 9.394/96 para aproveitamento acadêmico e universitário</p>
                </div>
                <button
                  onClick={() => alert('Dossiê consolidado de horas complementares gerado em PDF com sucesso!')}
                  className="px-4 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto transition-all"
                >
                  <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                  Exportar Dossiê da Matrícula
                </button>
              </div>

              {/* 3 Cards: Horas Concluídas, Horas em Andamento e Certificados Emitidos (Sem Carga Total Contratada) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-base text-accent-emerald-bright">check_circle</span>
                    <span className="text-xs text-text-tertiary font-bold uppercase">Horas Concluídas &amp; Certificadas</span>
                  </div>
                  <p className="text-2xl font-bold text-accent-emerald-bright">{completedHours} Horas</p>
                  <span className="text-[11px] text-text-tertiary mt-1 block">Aproveitamento com comprovação oficial</span>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-base text-accent-gold">hourglass_top</span>
                    <span className="text-xs text-text-tertiary font-bold uppercase">Horas em Andamento</span>
                  </div>
                  <p className="text-2xl font-bold text-accent-gold">{inProgressHours} Horas</p>
                  <span className="text-[11px] text-text-tertiary mt-1 block">Cursos matriculados em fase de conclusão</span>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-base text-primary">workspace_premium</span>
                    <span className="text-xs text-text-tertiary font-bold uppercase">Certificados Emitidos</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {validCertificates.length} {validCertificates.length === 1 ? 'Certificado' : 'Certificados'}
                  </p>
                  <span className="text-[11px] text-text-tertiary mt-1 block">Documentos criptografados registrados</span>
                </div>
              </div>

              {/* Tabela de Registro Geral: Concluídos, Em Andamento e Cancelados */}
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
                    {aaccTableItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-text-tertiary">
                          Nenhuma atividade curricular ou complementar registrada no momento.
                        </td>
                      </tr>
                    ) : (
                      aaccTableItems.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-overlay/50 transition-colors">
                          <td className="p-3.5 font-bold text-text-primary">
                            <span>{item.courseTitle}</span>
                            {item.issueDate && (
                              <span className="text-[10px] text-text-tertiary font-normal block">
                                Conclusão em {item.issueDate}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-text-secondary">{item.category}</td>
                          <td className="p-3.5 font-bold text-primary">{item.hours}h</td>
                          <td className="p-3.5">
                            {item.status === 'concluido' ? (
                              <span className="px-2.5 py-1 rounded-md bg-accent-emerald-bright/15 text-accent-emerald-bright font-bold flex items-center gap-1 w-fit">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                Concluído
                              </span>
                            ) : item.status === 'em_andamento' ? (
                              <span className="px-2.5 py-1 rounded-md bg-accent-gold/15 text-accent-gold font-bold flex items-center gap-1 w-fit">
                                <span className="material-symbols-outlined text-xs">hourglass_top</span>
                                Em andamento
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md bg-status-danger/15 text-status-danger font-bold flex items-center gap-1 w-fit">
                                <span className="material-symbols-outlined text-xs">cancel</span>
                                Cancelado
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {item.status === 'concluido' && item.certCode ? (
                              <button
                                onClick={() => onOpenCertificateModal(item.certCode)}
                                className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-mono font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                title="Visualizar Certificado Oficial"
                              >
                                <span className="material-symbols-outlined text-xs">workspace_premium</span>
                                <span>{item.certCode}</span>
                              </button>
                            ) : item.status === 'em_andamento' ? (
                              <span className="text-text-tertiary flex items-center gap-1 font-medium">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                Pendente (Em andamento)
                              </span>
                            ) : (
                              <span className="text-status-danger/80 line-through text-xs font-medium">
                                Cancelado / Revogado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
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

            {/* Dados de Matrícula, Foto & Endereço (Largura Completa) */}
            <div className="w-full bg-surface-raised rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-sm space-y-6">
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
                            onChange={(e) => handleStudentCepChange(e.target.value)}
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

            {/* BARRA INFERIOR: Salvar Todos os Dados */}
            <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-between flex-wrap gap-4 shadow-sm">
              <p className="text-xs text-text-tertiary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">lock</span>
                Dados cadastrais e endereço protegidos pela LGPD e salvos na sua matrícula oficial.
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
                  };
                  if (onUpdateUser) {
                    onUpdateUser(updatedUser);
                  }
                  setAvatarLoadFailed(false);
                  setSaveSuccessMsg('Dados da matrícula e endereço atualizados com sucesso!');
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

        {/* Course Study Page Full Screen (Estilo Prime Cursos com Cadeados e Avaliação Obrigatória) */}
        <StudentCourseStudyPage
          isOpen={activeLessonModal.isOpen}
          course={activeLessonModal.course}
          onClose={() => setActiveLessonModal({ isOpen: false, course: null, lessonTitle: '' })}
          onCompleteLesson={(courseId, lessonId, lessonTitle) => {
            setActiveLessonModal((prev) => ({ ...prev, lessonTitle }));
            if (onCompleteLesson) {
              onCompleteLesson(courseId, lessonId, lessonTitle);
            }
          }}
          progress={activeLessonModal.course ? progressData[activeLessonModal.course.id] : undefined}
          currentUser={user}
          onSubmitReview={onSubmitReview}
          onOpenCertificateModal={onOpenCertificateModal}
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


      </div>
    </div>
  );
};
