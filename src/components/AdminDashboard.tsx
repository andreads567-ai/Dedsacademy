import React, { useState } from 'react';
import { Course, UserAccount, Category, Instructor, BlogPost, CertificateItem, AdminTab, CourseStatus, CourseReview, SupportTicket, Coupon, PromotionalCampaign, HeroBannerConfig, MiddlePromoBannerConfig } from '../types';
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

interface AdminDashboardProps {
  courses: Course[];
  users: UserAccount[];
  categories?: Category[];
  instructors?: Instructor[];
  blogPosts?: BlogPost[];
  certificates?: CertificateItem[];
  heroBannerConfig?: HeroBannerConfig;
  onUpdateHeroBannerConfig?: (config: HeroBannerConfig) => void;
  middleBannerConfig?: MiddlePromoBannerConfig;
  onUpdateMiddleBannerConfig?: (config: MiddlePromoBannerConfig) => void;
  onAddCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (user: UserAccount) => void;
  onDeleteUser?: (userId: string) => void;
  onUpdateCategories?: (categories: Category[]) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  courses,
  users,
  categories: initialCategories = CATEGORIES,
  instructors: initialInstructors = INITIAL_INSTRUCTORS,
  blogPosts: initialBlogPosts = INITIAL_BLOG_POSTS,
  certificates: initialCertificates = INITIAL_CERTIFICATES,
  heroBannerConfig,
  onUpdateHeroBannerConfig,
  middleBannerConfig,
  onUpdateMiddleBannerConfig,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onAddUser,
  onUpdateUser,
  onUpdateCategories,
  onLogout,
}) => {
  // Navigation: 10 options strictly requested by the user
  const [activeTab, setActiveTab] = useState<AdminTab>('visao-geral');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Local state for categories, instructors, blog posts, and certificates
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories);
  const [instructorsList, setInstructorsList] = useState<Instructor[]>(initialInstructors);
  const [blogPostsList, setBlogPostsList] = useState<BlogPost[]>(initialBlogPosts);
  const [certificatesList, setCertificatesList] = useState<CertificateItem[]>(initialCertificates);
  const [reviewsList, setReviewsList] = useState<CourseReview[]>(INITIAL_COURSE_REVIEWS);
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [couponsList, setCouponsList] = useState<Coupon[]>(INITIAL_COUPONS);
  const [campaignsList, setCampaignsList] = useState<PromotionalCampaign[]>(INITIAL_CAMPAIGNS);

  const handleAddCoupon = (newCoupon: Coupon) => {
    setCouponsList((prev) => [newCoupon, ...prev]);
  };

  const handleUpdateCoupon = (updatedCoupon: Coupon) => {
    setCouponsList((prev) => prev.map((c) => (c.id === updatedCoupon.id ? updatedCoupon : c)));
  };

  const handleDeleteCoupon = (couponId: string) => {
    setCouponsList((prev) => prev.filter((c) => c.id !== couponId));
  };

  const handleAddCampaign = (newCampaign: PromotionalCampaign) => {
    setCampaignsList((prev) => [newCampaign, ...prev]);
  };

  const handleUpdateCampaign = (updatedCampaign: PromotionalCampaign) => {
    setCampaignsList((prev) => prev.map((c) => (c.id === updatedCampaign.id ? updatedCampaign : c)));
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaignsList((prev) => prev.filter((c) => c.id !== campaignId));
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

  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'aluno' as 'aluno' | 'admin',
    cpf: '',
    phone: '',
    status: 'ativo' as 'ativo' | 'inativo' | 'pendente',
    enrolledCourseIds: [] as string[],
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

  // Instructor Handlers
  const handleAddInstructor = (inst: Instructor) => {
    setInstructorsList((prev) => [inst, ...prev]);
  };
  const handleUpdateInstructor = (inst: Instructor) => {
    setInstructorsList((prev) => prev.map((i) => (i.id === inst.id ? inst : i)));
  };
  const handleDeleteInstructor = (instId: string) => {
    setInstructorsList((prev) => prev.filter((i) => i.id !== instId));
  };

  // Blog Handlers
  const handleAddBlogPost = (post: BlogPost) => {
    setBlogPostsList((prev) => [post, ...prev]);
  };
  const handleUpdateBlogPost = (post: BlogPost) => {
    setBlogPostsList((prev) => prev.map((p) => (p.id === post.id ? post : p)));
  };
  const handleDeleteBlogPost = (postId: string) => {
    setBlogPostsList((prev) => prev.filter((p) => p.id !== postId));
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
  };

  // Review Handlers (Botão 11: Avaliação de Curso)
  const handleDeleteReview = (reviewId: string) => {
    setReviewsList((prev) => prev.filter((r) => r.id !== reviewId));
  };

  // Ticket Handlers (Botão 12: Tickets)
  const handleUpdateTicket = (updatedTicket: SupportTicket) => {
    setTicketsList((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
  };

  const handleOpenNewTicket = (newTicket: SupportTicket) => {
    setTicketsList((prev) => [newTicket, ...prev]);
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTicketsList((prev) => prev.filter((t) => t.id !== ticketId));
  };

  // Open Edit Course Modal
  const handleOpenEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  // Open Edit / Create User Modal
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      role: 'aluno',
      cpf: '',
      phone: '',
      status: 'ativo',
      enrolledCourseIds: [],
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserAccount) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      role: u.role,
      cpf: u.cpf || '',
      phone: u.phone || '',
      status: u.status,
      enrolledCourseIds: u.enrolledCourseIds || [],
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUserModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updated: UserAccount = {
        ...editingUser,
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        cpf: userForm.cpf,
        phone: userForm.phone,
        status: userForm.status,
        enrolledCourseIds: userForm.enrolledCourseIds,
      };
      onUpdateUser(updated);
    } else {
      const newUser: UserAccount = {
        id: `user-${Date.now()}`,
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        cpf: userForm.cpf,
        phone: userForm.phone,
        status: userForm.status,
        registeredAt: new Date().toLocaleDateString('pt-BR'),
        enrolledCourseIds: userForm.enrolledCourseIds,
        completedCourseIds: [],
      };
      onAddUser(newUser);
    }
    setIsUserModalOpen(false);
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
    { id: 'usuarios', label: '8. Usuários', icon: 'manage_accounts', count: users.length },
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
          <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-lg">shield_person</span>
          </div>
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
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary/40 text-primary flex items-center justify-center shadow-[0_0_15px_rgba(0,176,116,0.2)]">
                  <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                </div>
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
              onOpenNewUser={handleOpenNewUser}
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
              onEditStudent={handleOpenEditUser}
              onOpenNewStudent={handleOpenNewUser}
              onQuickIssueCertificate={(student) => {
                setActiveTab('certificado');
              }}
            />
          )}

          {/* 8. Usuários */}
          {activeTab === 'usuarios' && (
            <UsersTab
              users={users}
              onEditUser={handleOpenEditUser}
              onOpenNewUser={handleOpenNewUser}
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

      {/* GLOBAL MODAL: EDITAR / CADASTRAR USUÁRIO OU ALUNO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)} />
          <div className="relative w-full max-w-xl bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-overlay">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">manage_accounts</span>
                <h3 className="text-base font-bold text-text-primary">
                  {editingUser ? 'Atualizar Dados do Aluno / Usuário' : 'Cadastrar Novo Aluno ou Usuário'}
                </h3>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="text-text-tertiary hover:text-text-primary">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveUserModal} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Ex: André Silva"
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="aluno@email.com"
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">CPF (Identificação Oficial)</label>
                  <input
                    type="text"
                    value={userForm.cpf}
                    onChange={(e) => setUserForm({ ...userForm, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Papel / Nível de Acesso</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="aluno">Aluno (Acesso aos Cursos)</option>
                    <option value="admin">Administrador (Acesso à Gestão)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">Status da Conta</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="ativo">Ativo (Acesso Liberado)</option>
                    <option value="pendente">Pendente</option>
                    <option value="inativo">Inativo / Bloqueado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Cursos Liberados para Matrícula
                </label>
                <div className="p-3 bg-surface-overlay border border-border-subtle rounded-xl max-h-36 overflow-y-auto space-y-2">
                  {courses.map((c) => {
                    const isChecked = userForm.enrolledCourseIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserForm({
                                ...userForm,
                                enrolledCourseIds: [...userForm.enrolledCourseIds, c.id],
                              });
                            } else {
                              setUserForm({
                                ...userForm,
                                enrolledCourseIds: userForm.enrolledCourseIds.filter((id) => id !== c.id),
                              });
                            }
                          }}
                          className="rounded border-border-subtle text-primary focus:ring-primary"
                        />
                        <span>{c.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-overlay text-text-secondary hover:text-text-primary text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingUser ? 'Salvar Atualizações' : 'Cadastrar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
