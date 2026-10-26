import React, { useState, useEffect } from 'react';
import { Course, UserAccount, Category, Instructor, BlogPost, CertificateItem, AdminTab, CourseStatus, CourseReview, SupportTicket, Coupon, PromotionalCampaign, HeroBannerConfig, MiddlePromoBannerConfig, CheckoutPaymentBannerConfig, StudentProgress } from '../types';
import { CATEGORIES } from '../data/coursesData';
import { INITIAL_INSTRUCTORS, INITIAL_BLOG_POSTS, INITIAL_CERTIFICATES, INITIAL_COURSE_REVIEWS, INITIAL_SUPPORT_TICKETS } from '../data/usersData';
import { INITIAL_COUPONS, INITIAL_CAMPAIGNS } from '../data/promotionsData';

import { OverviewTab } from './admin/OverviewTab';
import { AnalyticsTab } from './admin/AnalyticsTab';
import { CoursePostingTab } from './admin/CoursePostingTab';
import { CourseManagementTab } from './admin/CourseManagementTab';
import { CategoriesTab } from './admin/CategoriesTab';
import { InstructorsTab } from './admin/InstructorsTab';
import { StudentsTab } from './admin/StudentsTab';
import { UsersTab } from './admin/UsersTab';
import { BlogTab } from './admin/BlogTab';
import { CertificatesTab } from './admin/CertificatesTab';
import { CourseReviewsTab } from './admin/CourseReviewsTab';
import { SupportTicketsTab } from './admin/SupportTicketsTab';
import { SettingsApiTab } from './admin/SettingsApiTab';
import { PromotionsTab } from './admin/PromotionsTab';
import { CourseEditModal } from './admin/CourseEditModal';
import { sendCouponBroadcastEmail } from '../services/emailService';

interface AdminDashboardProps {
  courses: Course[];
  users: UserAccount[];
  categories?: Category[];
  coupons?: Coupon[];
  campaigns?: PromotionalCampaign[];
  onUpdateCampaigns?: (campaigns: PromotionalCampaign[]) => void;
  onUpdateCoupons?: (coupons: Coupon[]) => void;
  instructors?: Instructor[];
  onUpdateInstructors?: (instructors: Instructor[]) => void;
  blogPosts?: BlogPost[];
  onAddPost?: (post: BlogPost) => void;
  onUpdatePost?: (post: BlogPost) => void;
  onDeletePost?: (postId: string) => void;
  certificates?: CertificateItem[];
  reviews?: CourseReview[];
  onDeleteReview?: (reviewId: string) => void;
  progressMap?: Record<string, Record<string, StudentProgress>>;
  heroBannerConfig?: HeroBannerConfig;
  onUpdateHeroBannerConfig?: (config: HeroBannerConfig) => void;
  middleBannerConfig?: MiddlePromoBannerConfig;
  onUpdateMiddleBannerConfig?: (config: MiddlePromoBannerConfig) => void;
  checkoutBannerConfig?: CheckoutPaymentBannerConfig;
  onUpdateCheckoutBannerConfig?: (config: CheckoutPaymentBannerConfig) => void;
  onAddCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (user: UserAccount) => void;
  onDeleteUser?: (userId: string) => void;
  onUpdateCategories?: (categories: Category[]) => void;
  onIssueCertificate?: (certificate: CertificateItem) => void;
  onCancelCertificate?: (certId: string, reason?: string) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  courses,
  users,
  categories: initialCategories = CATEGORIES,
  coupons: initialCoupons = INITIAL_COUPONS,
  onUpdateCoupons,
  campaigns: initialCampaigns = INITIAL_CAMPAIGNS,
  onUpdateCampaigns,
  instructors: initialInstructors = INITIAL_INSTRUCTORS,
  blogPosts: initialBlogPosts = INITIAL_BLOG_POSTS,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  certificates: initialCertificates = INITIAL_CERTIFICATES,
  reviews,
  onDeleteReview,
  progressMap,
  heroBannerConfig,
  onUpdateHeroBannerConfig,
  middleBannerConfig,
  onUpdateMiddleBannerConfig,
  checkoutBannerConfig,
  onUpdateInstructors,
  onUpdateCheckoutBannerConfig,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onAddUser,
  onUpdateUser,
  onUpdateCategories,
  onIssueCertificate,
  onCancelCertificate,
  onLogout,
}) => {
  // Navigation: 10 options strictly requested by the user
  const [activeTab, setActiveTab] = useState<AdminTab>('visao-geral');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Local state for categories, instructors, blog posts, and certificates
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories);
  const [instructorsList, setInstructorsList] = useState<Instructor[]>(() => {
    try {
      const saved = localStorage.getItem('deds_instructors_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialInstructors;
  });
  const [blogPostsList, setBlogPostsList] = useState<BlogPost[]>(initialBlogPosts);
  useEffect(() => {
    if (initialBlogPosts) {
      setBlogPostsList(initialBlogPosts);
    }
  }, [initialBlogPosts]);
  const [certificatesList, setCertificatesList] = useState<CertificateItem[]>(initialCertificates);
  useEffect(() => {
    if (initialCertificates) {
      setCertificatesList(initialCertificates);
    }
  }, [initialCertificates]);
  const [reviewsList, setReviewsList] = useState<CourseReview[]>(() => {
    if (reviews && reviews.length > 0) return reviews;
    try {
      const saved = localStorage.getItem('deds_course_reviews');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_COURSE_REVIEWS;
  });

  useEffect(() => {
    if (reviews) {
      setReviewsList(reviews);
    }
  }, [reviews]);
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('deds_support_tickets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SUPPORT_TICKETS;
  });
  const [couponsList, setCouponsList] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem('deds_coupons_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialCoupons;
  });

  useEffect(() => {
    if (initialCoupons && Array.isArray(initialCoupons)) {
      setCouponsList(initialCoupons);
    }
  }, [initialCoupons]);

  const [campaignsList, setCampaignsList] = useState<PromotionalCampaign[]>(() => {
    try {
      const saved = localStorage.getItem('deds_campaigns_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialCampaigns;
  });

  useEffect(() => {
    if (initialCampaigns && Array.isArray(initialCampaigns)) {
      setCampaignsList(initialCampaigns);
    }
  }, [initialCampaigns]);

  const handleAddCoupon = (newCoupon: Coupon) => {
    setCouponsList((prev) => {
      const next = [newCoupon, ...prev];
      try { localStorage.setItem('deds_coupons_list', JSON.stringify(next)); } catch {}
      if (onUpdateCoupons) onUpdateCoupons(next);
      window.dispatchEvent(new CustomEvent('deds_coupons_updated', { detail: next }));
      return next;
    });
    sendCouponBroadcastEmail({ coupon: newCoupon, students: users }).catch(console.error);
  };

  const handleUpdateCoupon = (updatedCoupon: Coupon) => {
    setCouponsList((prev) => {
      const next = prev.map((c) => (c.id === updatedCoupon.id ? updatedCoupon : c));
      try { localStorage.setItem('deds_coupons_list', JSON.stringify(next)); } catch {}
      if (onUpdateCoupons) onUpdateCoupons(next);
      window.dispatchEvent(new CustomEvent('deds_coupons_updated', { detail: next }));
      return next;
    });
  };

  const handleDeleteCoupon = (couponId: string) => {
    setCouponsList((prev) => {
      const next = prev.filter((c) => c.id !== couponId);
      try { localStorage.setItem('deds_coupons_list', JSON.stringify(next)); } catch {}
      if (onUpdateCoupons) onUpdateCoupons(next);
      window.dispatchEvent(new CustomEvent('deds_coupons_updated', { detail: next }));
      return next;
    });
  };

  const handleAddCampaign = (newCampaign: PromotionalCampaign) => {
    setCampaignsList((prev) => {
      const next = [newCampaign, ...prev];
      try { localStorage.setItem('deds_campaigns_list', JSON.stringify(next)); } catch {}
      if (onUpdateCampaigns) onUpdateCampaigns(next);
      window.dispatchEvent(new CustomEvent('deds_campaigns_updated', { detail: next }));
      return next;
    });
  };

  const handleUpdateCampaign = (updatedCampaign: PromotionalCampaign) => {
    setCampaignsList((prev) => {
      const next = prev.map((c) => (c.id === updatedCampaign.id ? updatedCampaign : c));
      try { localStorage.setItem('deds_campaigns_list', JSON.stringify(next)); } catch {}
      if (onUpdateCampaigns) onUpdateCampaigns(next);
      window.dispatchEvent(new CustomEvent('deds_campaigns_updated', { detail: next }));
      return next;
    });
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaignsList((prev) => {
      const next = prev.filter((c) => c.id !== campaignId);
      try { localStorage.setItem('deds_campaigns_list', JSON.stringify(next)); } catch {}
      if (onUpdateCampaigns) onUpdateCampaigns(next);
      window.dispatchEvent(new CustomEvent('deds_campaigns_updated', { detail: next }));
      return next;
    });
  };

  // Announcements list
  const [announcements, setAnnouncements] = useState([
    {
      id: 'ann-1',
      title: 'Módulo de Inteligência Artificial Generativa liberado em Python',
      author: 'Coordenação Pedagógica',
      date: '14/09/2026',
      priority: 'alta',
    },
    {
      id: 'ann-2',
      title: 'Novos modelos de certificados digitais com QR Code da Lei Federal 9.394/96',
      author: 'Gestão Acadêmica',
      date: '10/09/2026',
      priority: 'normal',
    },
  ]);

  // Modals for editing Course and User
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '',
    instructor: '',
    instructorRole: '',
    category: 'Tecnologia & IA',
    hours: 40,
    originalPrice: 299,
    currentPrice: 189.9,
    image: '',
    status: 'publicado' as CourseStatus,
    description: '',
    badgeText: 'Lançamento',
  });

  // Category Handlers
  const handleAddCategory = (cat: Category) => {
    setCategoriesList((prev) => {
      const next = [...prev, cat];
      if (onUpdateCategories) onUpdateCategories(next);
      return next;
    });
  };
  const handleUpdateCategory = (cat: Category) => {
    setCategoriesList((prev) => {
      const next = prev.map((c) => (c.id === cat.id ? cat : c));
      if (onUpdateCategories) onUpdateCategories(next);
      return next;
    });
  };
  const handleDeleteCategory = (catId: string) => {
    setCategoriesList((prev) => {
      const next = prev.filter((c) => c.id !== catId);
      if (onUpdateCategories) onUpdateCategories(next);
      return next;
    });
  };

  // Instructor Handlers with full localStorage persistence
  const handleAddInstructor = (inst: Instructor) => {
    setInstructorsList((prev) => {
      const next = [inst, ...prev];
      try {
        localStorage.setItem('deds_instructors_list', JSON.stringify(next));
      } catch {}
      onUpdateInstructors?.(next);
      window.dispatchEvent(new CustomEvent('deds_instructors_updated', { detail: next }));
      return next;
    });
  };
  const handleUpdateInstructor = (inst: Instructor) => {
    setInstructorsList((prev) => {
      const next = prev.map((i) => (i.id === inst.id ? inst : i));
      try {
        localStorage.setItem('deds_instructors_list', JSON.stringify(next));
      } catch {}
      onUpdateInstructors?.(next);
      return next;
    });
  };
  const handleDeleteInstructor = (instId: string) => {
    setInstructorsList((prev) => {
      const next = prev.filter((i) => i.id !== instId);
      try {
        localStorage.setItem('deds_instructors_list', JSON.stringify(next));
      } catch {}
      onUpdateInstructors?.(next);
      return next;
    });
  };

  // Blog Handlers
  const handleAddBlogPost = (post: BlogPost) => {
    setBlogPostsList((prev) => [post, ...prev]);
    onAddPost?.(post);
  };
  const handleUpdateBlogPost = (post: BlogPost) => {
    setBlogPostsList((prev) => prev.map((p) => (p.id === post.id ? post : p)));
    onUpdatePost?.(post);
  };
  const handleDeleteBlogPost = (postId: string) => {
    setBlogPostsList((prev) => prev.filter((p) => p.id !== postId));
    onDeletePost?.(postId);
  };
  const handleAddAnnouncement = (title: string) => {
    setAnnouncements((prev) => [
      {
        id: `ann-${Date.now()}`,
        title,
        author: 'Coordenação Pedagógica',
        date: new Date().toLocaleDateString('pt-BR'),
        priority: 'alta',
      },
      ...prev,
    ]);
  };

  // Certificate Handlers
  const handleIssueCertificate = (cert: CertificateItem) => {
    setCertificatesList((prev) => [cert, ...prev]);
    if (onIssueCertificate) onIssueCertificate(cert);
  };

  const handleCancelCertificate = (certId: string, reason?: string) => {
    setCertificatesList((prev) =>
      prev.map((c) =>
        c.id === certId
          ? {
              ...c,
              status: 'cancelado',
              cancelledAt: new Date().toLocaleDateString('pt-BR'),
              cancellationReason: reason || 'Cancelado pela administração',
            }
          : c
      )
    );
    if (onCancelCertificate) onCancelCertificate(certId, reason);
  };

  // Review Handlers (Botão 11: Avaliação de Curso)
  const handleDeleteReview = (reviewId: string) => {
    setReviewsList((prev) => prev.filter((r) => r.id !== reviewId));
  };

  // Ticket Handlers (Botão 12: Tickets)
  const handleUpdateTicket = (updatedTicket: SupportTicket) => {
    setTicketsList((prev) => {
      const next = prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t));
      try { localStorage.setItem('deds_support_tickets', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleOpenNewTicket = (newTicket: SupportTicket) => {
    setTicketsList((prev) => {
      const next = [newTicket, ...prev];
      try { localStorage.setItem('deds_support_tickets', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTicketsList((prev) => {
      const next = prev.filter((t) => t.id !== ticketId);
      try { localStorage.setItem('deds_support_tickets', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Open Edit Course Modal
  const handleOpenEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  // The 12 items as requested in precise order
  const navigationItems: { id: AdminTab; label: string; icon: string; count?: number }[] = [
    { id: 'visao-geral', label: '1. Visão geral', icon: 'dashboard' },
    { id: 'analise', label: '2. Análise', icon: 'insights' },
    { id: 'postagem-cursos', label: '3. Postagem de cursos', icon: 'add_box' },
    { id: 'gestao-curso', label: '4. Gestão de curso', icon: 'auto_stories', count: courses.length },
    { id: 'categoria', label: '5. Categoria', icon: 'category', count: categoriesList.length },
    { id: 'instrutores', label: '6. Instrutores', icon: 'co_present', count: instructorsList.length },
    { id: 'gestao-aluno', label: '7. Gestão de aluno', icon: 'person_search', count: users.filter(u => u.role === 'aluno').length },
    { id: 'usuarios', label: '8. Usuários', icon: 'manage_accounts', count: users.filter(u => u.role !== 'aluno').length },
    { id: 'blog', label: '9. Blog & Banner Home', icon: 'article', count: blogPostsList.length },
    { id: 'certificado', label: '10. Certificado', icon: 'verified', count: certificatesList.length },
    { id: 'avaliacao-curso', label: '11. Avaliação de curso', icon: 'reviews', count: reviewsList.length },
    { id: 'tickets', label: '12. Tickets', icon: 'contact_support', count: ticketsList.filter(t => t.status !== 'finalizado').length },
    { id: 'configuracoes', label: '13. Configurações & APIs', icon: 'settings_input_composite' },
    {
      id: 'promocoes',
      label: '14. Promoções & Cupons de Desconto',
      icon: 'local_offer',
      count: couponsList.filter((c) => c.status === 'ativo').length,
    },
  ];

  const currentTabItem = navigationItems.find((item) => item.id === activeTab);

  return (
    <div className="min-h-screen bg-[#080B10] text-[#E1E7EF] flex flex-col md:flex-row antialiased selection:bg-primary selection:text-white">
      {/* Mobile Top Header (Only for Admin dashboard toggle & logout) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0B0F17] border-b border-[#1F293D]/60 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Deds Academy"
            className="w-8 h-8 object-contain rounded-full shadow-[0_0_10px_rgba(0,192,160,0.3)] shrink-0"
          />
          <div>
            <span className="font-bold text-sm text-text-primary block">Deds Gestão</span>
            <span className="text-[10px] text-text-tertiary">Painel Administrativo</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-status-danger/10 text-status-danger border border-status-danger/20 hover:bg-status-danger/20 cursor-pointer"
            title="Sair do painel administrativo"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </div>

      {/* Desktop / Collapsible Sidebar with the 10 Sections */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-30 w-72 bg-[#0B0F17] border-r border-[#1F293D]/60 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } h-screen overflow-y-auto`}
      >
        <div className="p-5 flex flex-col h-full justify-between">
          <div>
            {/* Admin Brand Badge */}
            <div className="pb-5 mb-4 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Deds Academy"
                  className="w-10 h-10 object-contain rounded-full shadow-[0_0_15px_rgba(0,192,160,0.35)] shrink-0"
                />
                <div>
                  <h1 className="font-bold text-sm text-text-primary tracking-tight">Deds Academy</h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald-bright" />
                    <span className="text-[11px] text-text-tertiary font-medium">Gestão &amp; Controle</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Menu (10 Ordered Items) */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-3 py-1 block">
                Menu de Administração
              </span>

              {navigationItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-primary-container text-on-primary shadow-[0_2px_10px_rgba(0,176,116,0.25)]'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`material-symbols-outlined text-lg ${
                          isActive ? 'text-on-primary' : 'text-text-tertiary group-hover:text-primary'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.count !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-black/20 text-on-primary'
                            : 'bg-surface-overlay text-text-tertiary group-hover:text-text-primary'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer of Sidebar: Admin profile & Logout button */}
          <div className="pt-4 border-t border-border-subtle mt-4">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-raised border border-border-subtle">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  AD
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text-primary truncate">Administrador Deds</p>
                  <span className="text-[10px] text-text-tertiary block truncate">Super Admin Master</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-status-danger hover:bg-status-danger/10 transition-colors cursor-pointer"
                title="Encerrar Sessão"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Administrative Work Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#080B10]">
        {/* Top Header of the Active Section */}
        <header className="sticky top-0 z-20 bg-[#0B0F17]/90 backdrop-blur-md border-b border-[#1F293D]/50 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">{currentTabItem?.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">{currentTabItem?.label}</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/15 text-primary border border-primary/25">
                  Painel Oficial
                </span>
              </div>
              <p className="text-[11px] text-text-tertiary hidden sm:block">
                Ambiente restrito de gestão acadêmica e operacional
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 rounded-xl bg-surface-raised hover:bg-status-danger/15 text-text-tertiary hover:text-status-danger text-xs font-bold transition-all flex items-center gap-1.5 border border-border-subtle cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </header>

        {/* Content Container based on Active Tab */}
        <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          {/* 1. Visão geral */}
          {activeTab === 'visao-geral' && (
            <OverviewTab
              courses={courses}
              users={users}
              certificatesCount={certificatesList.length}
              instructorsCount={instructorsList.length}
              blogCount={blogPostsList.length}
              categoriesCount={categoriesList.length}
              onNavigateTab={(tabId) => setActiveTab(tabId as AdminTab)}
              onOpenNewCourse={() => setActiveTab('postagem-cursos')}
              onOpenNewUser={() => setActiveTab('usuarios')}
            />
          )}

          {/* 2. Análise */}
          {activeTab === 'analise' && <AnalyticsTab courses={courses} users={users} />}

          {/* 3. Postagem de cursos */}
          {activeTab === 'postagem-cursos' && (
            <CoursePostingTab
              categories={categoriesList}
              instructors={instructorsList}
              onAddCourse={(c) => {
                onAddCourse(c);
              }}
              onNavigateToCourses={() => setActiveTab('gestao-curso')}
            />
          )}

          {/* 4. Gestão de curso */}
          {activeTab === 'gestao-curso' && (
            <CourseManagementTab
              courses={courses}
              categories={categoriesList}
              users={users}
              onEditCourse={handleOpenEditCourse}
              onDeleteCourse={onDeleteCourse}
              onUpdateCourse={onUpdateCourse}
              onUpdateCourseStatus={(courseId, newStatus) => {
                const targetCourse = courses.find((c) => c.id === courseId);
                if (targetCourse) {
                  onUpdateCourse({ ...targetCourse, status: newStatus });
                }
              }}
              onNavigateToPostCourse={() => setActiveTab('postagem-cursos')}
            />
          )}

          {/* 5. Categoria */}
          {activeTab === 'categoria' && (
            <CategoriesTab
              categories={categoriesList}
              courses={courses}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {/* 6. Instrutores */}
          {activeTab === 'instrutores' && (
            <InstructorsTab
              instructors={instructorsList}
              courses={courses}
              onAddInstructor={handleAddInstructor}
              onUpdateInstructor={handleUpdateInstructor}
              onDeleteInstructor={handleDeleteInstructor}
            />
          )}

          {/* 7. Gestão de aluno */}
          {activeTab === 'gestao-aluno' && (
            <StudentsTab
              users={users}
              courses={courses}
              onUpdateUser={onUpdateUser}
              onAddUser={onAddUser}
              onQuickIssueCertificate={(student) => {
                setActiveTab('certificado');
              }}
              reviews={reviewsList}
              progressMap={progressMap}
            />
          )}

          {/* 8. Usuários */}
          {activeTab === 'usuarios' && (
            <UsersTab
              users={users}
              onUpdateUser={onUpdateUser}
              onAddUser={onAddUser}
            />
          )}

          {/* 9. Blog & Banner Home */}
          {activeTab === 'blog' && (
            <BlogTab
              posts={blogPostsList}
              onAddPost={handleAddBlogPost}
              onUpdatePost={handleUpdateBlogPost}
              onDeletePost={handleDeleteBlogPost}
              announcements={announcements}
              onAddAnnouncement={handleAddAnnouncement}
              heroBannerConfig={heroBannerConfig}
              onUpdateHeroBannerConfig={onUpdateHeroBannerConfig}
              middleBannerConfig={middleBannerConfig}
              onUpdateMiddleBannerConfig={onUpdateMiddleBannerConfig}
              checkoutBannerConfig={checkoutBannerConfig}
              onUpdateCheckoutBannerConfig={onUpdateCheckoutBannerConfig}
            />
          )}

          {/* 10. Certificado */}
          {activeTab === 'certificado' && (
            <CertificatesTab
              certificates={certificatesList}
              students={users.filter((u) => u.role === 'aluno')}
              courses={courses}
              onIssueCertificate={handleIssueCertificate}
              onCancelCertificate={handleCancelCertificate}
            />
          )}

          {/* 11. Avaliação de curso */}
          {activeTab === 'avaliacao-curso' && (
            <CourseReviewsTab
              reviews={reviewsList}
              courses={courses}
              categories={categoriesList}
              onDeleteReview={handleDeleteReview}
            />
          )}

          {/* 12. Tickets */}
          {activeTab === 'tickets' && (
            <SupportTicketsTab
              tickets={ticketsList}
              students={users.filter((u) => u.role === 'aluno')}
              courses={courses}
              onUpdateTicket={handleUpdateTicket}
              onOpenNewTicket={handleOpenNewTicket}
              onDeleteTicket={handleDeleteTicket}
            />
          )}

          {/* 13. Configurações & APIs */}
          {activeTab === 'configuracoes' && (
            <SettingsApiTab />
          )}

          {/* 14. Promoções & Cupons de Desconto */}
          {activeTab === 'promocoes' && (
            <PromotionsTab
              courses={courses}
              coupons={couponsList}
              campaigns={campaignsList}
              onAddCoupon={handleAddCoupon}
              onUpdateCoupon={handleUpdateCoupon}
              onDeleteCoupon={handleDeleteCoupon}
              onAddCampaign={handleAddCampaign}
              onUpdateCampaign={handleUpdateCampaign}
              onDeleteCampaign={handleDeleteCampaign}
              onUpdateCourse={onUpdateCourse}
            />
          )}
        </div>
      </main>

      {/* GLOBAL MODAL: EDITAR / ATUALIZAR CURSO */}
      <CourseEditModal
        isOpen={isCourseModalOpen}
        course={editingCourse}
        categories={categoriesList}
        instructors={instructorsList}
        onClose={() => {
          setIsCourseModalOpen(false);
          setEditingCourse(null);
        }}
        onSave={(updatedCourse) => {
          onUpdateCourse(updatedCourse);
          setIsCourseModalOpen(false);
          setEditingCourse(null);
        }}
      />
    </div>
  );
};
