/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { CoursesSection } from './components/CoursesSection';
import { CategoriesSection } from './components/CategoriesSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { CtaSection } from './components/CtaSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CartCheckoutPage } from './components/CartCheckoutPage';
import type { CheckoutData } from './components/CartCheckoutPage';
import { CertificateModal } from './components/CertificateModal';
import { AuthModal } from './components/AuthModal';
import { CourseDetailPage } from './components/CourseDetailPage';
import { StudentPortal } from './components/StudentPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { RegisterPage } from './components/RegisterPage';
import type { RegistrationData } from './components/RegisterPage';
import { BlogPage } from './components/BlogPage';
import { CoursesCatalogPage } from './components/CoursesCatalogPage';
import { ContactPage } from './components/ContactPage';
import { COURSES, CATEGORIES, TESTIMONIALS } from './data/coursesData';
import { INITIAL_USERS, INITIAL_STUDENT_PROGRESS, INITIAL_CERTIFICATES } from './data/usersData';
import { Course, CartItem, UserAccount, StudentProgress, Category, HeroBannerConfig, DEFAULT_HERO_BANNER, MiddlePromoBannerConfig, DEFAULT_MIDDLE_PROMO_BANNER } from './types';
import { fetchUsers, fetchCourses, fetchCategories, upsertUser, upsertCourse, deleteCourse as sbDeleteCourse, upsertCategories, seedIfEmpty } from './lib/supabaseService';

export default function App() {
  // Navigation View: 'inicio' | 'cursos' | 'categorias' | 'planos' | 'certificados' | 'blog' | 'contato' | 'carrinho' | 'aluno' | 'admin' | 'cadastro'
  const [activeNavTab, setActiveNavTab] = useState<string>('inicio');
  const [activeCourseFilter, setActiveCourseFilter] = useState('Em alta');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Global Synchronized State for Courses, Categories, and Users (with immediate cache invalidation and localStorage persistence)
  const [categoriesList, setCategoriesList] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('deds_categories_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return CATEGORIES;
  });

  const [coursesList, setCoursesList] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem('deds_courses_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return COURSES;
  });

  const [usersList, setUsersList] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('deds_users_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_USERS;
  });

  // Hero Banner configuration state synchronized across Home and Admin Module 9
  const [heroBannerConfig, setHeroBannerConfig] = useState<HeroBannerConfig>(() => {
    try {
      const saved = localStorage.getItem('deds_hero_banner_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_HERO_BANNER;
  });

  const handleUpdateHeroBannerConfig = (newConfig: HeroBannerConfig) => {
    setHeroBannerConfig(newConfig);
    try {
      localStorage.setItem('deds_hero_banner_config', JSON.stringify(newConfig));
    } catch {}
    showToast('Banner da Home e selos atualizados com sucesso!');
  };

  // Middle Promotional Banner configuration state synchronized across Home and Admin Module 9
  const [middleBannerConfig, setMiddleBannerConfig] = useState<MiddlePromoBannerConfig>(() => {
    try {
      const saved = localStorage.getItem('deds_middle_banner_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_MIDDLE_PROMO_BANNER;
  });

  const handleUpdateMiddleBannerConfig = (newConfig: MiddlePromoBannerConfig) => {
    setMiddleBannerConfig(newConfig);
    try {
      localStorage.setItem('deds_middle_banner_config', JSON.stringify(newConfig));
    } catch {}
    showToast(
      newConfig.enabled
        ? 'Banner Faixa da Home atualizado e ativado!'
        : 'Banner Faixa desativado e espaço na Home recolhido.'
    );
  };

  const handleNavigateMiddleBanner = (targetUrl: string) => {
    if (!targetUrl) return;

    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const slug = targetUrl.replace(/^\/curso\//, '').replace(/^curso\//, '').trim();
    const matchedCourse = coursesList.find(
      (c) => c.id === slug || c.title.toLowerCase().includes(slug.toLowerCase())
    );
    if (matchedCourse) {
      setSelectedCourse(matchedCourse);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const sectionId = targetUrl.startsWith('#') ? targetUrl.substring(1) : targetUrl;
    scrollToSection(sectionId);
  };

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('deds_current_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Persist currentUser session to localStorage (Fix 7: purchases survive reload)
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('deds_current_session', JSON.stringify(currentUser));
        // Also sync enrolledCourseIds back to usersList for consistency
        setUsersList((prev) => {
          const idx = prev.findIndex((u) => u.id === currentUser.id);
          if (idx === -1) return prev;
          const updated = [...prev];
          updated[idx] = { ...updated[idx], enrolledCourseIds: currentUser.enrolledCourseIds, completedCourseIds: currentUser.completedCourseIds };
          try { localStorage.setItem('deds_users_list', JSON.stringify(updated)); } catch {}
          return updated;
        });
      } catch {}
    } else {
      localStorage.removeItem('deds_current_session');
    }
  }, [currentUser]);

  // Persisted student progress map: { [userId]: { [courseId]: StudentProgress } } (Fix 4)
  const [studentProgressMap, setStudentProgressMap] = useState<Record<string, Record<string, StudentProgress>>>(() => {
    try {
      const saved = localStorage.getItem('deds_student_progress');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Seed with initial demo data for the default student
    return { 'user-aluno-1': INITIAL_STUDENT_PROGRESS, 'user-aluno-alias': INITIAL_STUDENT_PROGRESS };
  });

  // ─── Supabase: Load data on mount, seed if empty ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadFromSupabase() {
      try {
        // Seed Supabase tables if they are empty (first run)
        await seedIfEmpty(INITIAL_USERS, COURSES, CATEGORIES);

        // Fetch fresh data from Supabase
        const [sbUsers, sbCourses, sbCategories] = await Promise.all([
          fetchUsers(),
          fetchCourses(),
          fetchCategories(),
        ]);

        if (cancelled) return;

        if (sbUsers && sbUsers.length > 0) {
          setUsersList(sbUsers);
          try { localStorage.setItem('deds_users_list', JSON.stringify(sbUsers)); } catch {}
        }
        if (sbCourses && sbCourses.length > 0) {
          setCoursesList(sbCourses);
          try { localStorage.setItem('deds_courses_list', JSON.stringify(sbCourses)); } catch {}
        }
        if (sbCategories && sbCategories.length > 0) {
          setCategoriesList(sbCategories);
          try { localStorage.setItem('deds_categories_list', JSON.stringify(sbCategories)); } catch {}
        }

        console.log('[Supabase] Data loaded successfully.');
      } catch (err) {
        console.warn('[Supabase] Failed to load data, using localStorage/defaults:', err);
      }
    }
    loadFromSupabase();
    return () => { cancelled = true; };
  }, []);

  // Modals & Drawers state
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register';
    role?: 'aluno' | 'admin';
  }>({
    isOpen: false,
    mode: 'login',
    role: 'aluno',
  });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Cart state initialized with 3 courses matching the checkout design
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { course: coursesList[0], quantity: 1 },
    { course: coursesList[1], quantity: 1 },
    { course: coursesList[2], quantity: 1 },
  ]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAddToCart = (course: Course) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item.course.id === course.id);
      if (exists) {
        showToast(`"${course.title}" já está no seu carrinho.`);
        return prev;
      }
      showToast(`"${course.title}" adicionado ao carrinho!`);
      return [...prev, { course, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (courseId: string) => {
    setCartItems((prev) => prev.filter((item) => item.course.id !== courseId));
    showToast('Item removido do carrinho.');
  };

  const handleClearCart = () => {
    setCartItems([]);
    showToast('Carrinho esvaziado.');
  };

  const handleCheckoutSuccess = (checkoutData: CheckoutData) => {
    // Add cart courses to current user enrolled list
    if (currentUser) {
      const newCourseIds = cartItems.map((item) => item.course.id);
      const updatedUser = {
        ...currentUser,
        enrolledCourseIds: Array.from(
          new Set([...(currentUser.enrolledCourseIds || []), ...newCourseIds])
        ),
      };
      setCurrentUser(updatedUser);
      // Also update usersList so it persists to localStorage
      handleUpdateUser(updatedUser);
    }
    setCartItems([]);
    setActiveNavTab('aluno');
    showToast('Matrícula confirmada com sucesso! Acesso aos cursos liberado na Área do Aluno.');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveNavTab('cursos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTag = (tag: string) => {
    setSearchQuery(tag);
    setActiveNavTab('cursos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setActiveNavTab('cursos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    setSelectedCourse(null);
    if (activeNavTab !== 'inicio') {
      setActiveNavTab('inicio');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Auth Success Handler: redirects to either 'aluno' or 'admin' based on selected destination
  const handleAuthSuccess = (role: 'aluno' | 'admin', user: UserAccount) => {
    setCurrentUser(user);
    if (role === 'admin') {
      setActiveNavTab('admin');
      showToast(`Bem-vindo(a) ao Painel de Gestão, ${user.name}!`);
    } else {
      setActiveNavTab('aluno');
      showToast(`Bem-vindo(a) à Área do Aluno, ${user.name}!`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveNavTab('inicio');
    showToast('Sessão encerrada com segurança.');
  };

  // Admin Course Management operations (synchronized with immediate cache update)
  const handleAddCourse = (newCourse: Course) => {
    setCoursesList((prev) => {
      const next = [newCourse, ...prev];
      try {
        localStorage.setItem('deds_courses_list', JSON.stringify(next));
      } catch {}
      return next;
    });
    upsertCourse(newCourse).catch(console.error);
    showToast(`Curso "${newCourse.title}" publicado com sucesso!`);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCoursesList((prev) => {
      const next = prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c));
      try {
        localStorage.setItem('deds_courses_list', JSON.stringify(next));
      } catch {}
      return next;
    });
    upsertCourse(updatedCourse).catch(console.error);
    showToast(`Curso "${updatedCourse.title}" atualizado no catálogo!`);
  };

  const handleDeleteCourse = (courseId: string) => {
    setCoursesList((prev) => {
      const next = prev.filter((c) => c.id !== courseId);
      try {
        localStorage.setItem('deds_courses_list', JSON.stringify(next));
      } catch {}
      return next;
    });
    sbDeleteCourse(courseId).catch(console.error);
    showToast('Curso removido do catálogo.');
  };

  // Category Synchronization
  const handleUpdateCategories = (newCategories: Category[]) => {
    setCategoriesList(newCategories);
    try {
      localStorage.setItem('deds_categories_list', JSON.stringify(newCategories));
    } catch {}
    upsertCategories(newCategories).catch(console.error);
    showToast('Categorias sincronizadas em tempo real com todo o sistema!');
  };

  // Admin User Management operations (synchronized with immediate cache update)
  const handleAddUser = (newUser: UserAccount) => {
    setUsersList((prev) => {
      const next = [newUser, ...prev];
      try {
        localStorage.setItem('deds_users_list', JSON.stringify(next));
      } catch {}
      return next;
    });
    upsertUser(newUser).catch(console.error);
    showToast(`Aluno/Usuário "${newUser.name}" cadastrado com sucesso!`);
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUsersList((prev) => {
      const next = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      try {
        localStorage.setItem('deds_users_list', JSON.stringify(next));
      } catch {}
      return next;
    });
    upsertUser(updatedUser).catch(console.error);
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    showToast(`Cadastro de "${updatedUser.name}" atualizado com sucesso!`);
  };

  // Fix 4c: Handle lesson completion — update progress per user/course and persist
  const handleCompleteLesson = (courseId: string, lessonId: string, lessonTitle: string) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    setStudentProgressMap((prev) => {
      const userProgress = prev[userId] || {};
      const existing = userProgress[courseId];
      const course = coursesList.find((c) => c.id === courseId);
      const totalLessons = course?.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || course?.lessonsCount || 1;
      const newCompleted = existing ? Math.min(existing.completedLessons + 1, totalLessons) : 1;
      const newPercent = Math.round((newCompleted / totalLessons) * 100);

      const updated = {
        ...prev,
        [userId]: {
          ...userProgress,
          [courseId]: {
            courseId,
            percent: newPercent,
            completedLessons: newCompleted,
            totalLessons,
            lastLessonTitle: lessonTitle,
            lastAccessed: 'Agora mesmo',
          },
        },
      };
      try { localStorage.setItem('deds_student_progress', JSON.stringify(updated)); } catch {}

      // If course is 100% complete, add to completedCourseIds
      if (newPercent >= 100 && currentUser && !currentUser.completedCourseIds.includes(courseId)) {
        const updatedUser = {
          ...currentUser,
          completedCourseIds: [...currentUser.completedCourseIds, courseId],
        };
        setCurrentUser(updatedUser);
        handleUpdateUser(updatedUser);
        showToast(`Parabéns! Você concluiu 100% do curso! 🎉`);
      } else {
        showToast(`Aula "${lessonTitle}" concluída! Progresso: ${newPercent}%`);
      }

      return updated;
    });
  };

  // Fix 5b: Handle enrollment cancellation — remove courseIds from user's enrollment
  const handleCancelEnrollment = (courseIds: string[]) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      enrolledCourseIds: currentUser.enrolledCourseIds.filter(
        (id) => !courseIds.includes(id)
      ),
    };
    setCurrentUser(updatedUser);
    handleUpdateUser(updatedUser);
    showToast('Cursos removidos da sua matrícula. Cancelamento processado.');
  };

  // Filter courses for public catalog — only 'publicado' status should appear on the public site
  const displayedCourses = coursesList.filter((course) => {
    if (course.status !== 'publicado') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        course.title.toLowerCase().includes(q) ||
        course.instructor.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    if (selectedCategory && selectedCategory !== 'Todos') {
      if (course.category !== selectedCategory) return false;
    }

    return true;
  });

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const addedCourseIds = cartItems.map((item) => item.course.id);

  // Student enrolled courses objects
  const studentEnrolledCourses = coursesList.filter((c) =>
    currentUser?.enrolledCourseIds?.includes(c.id)
  );

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-5 py-3.5 rounded-xl shadow-2xl font-label-lg font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5 border border-primary/30">
          <span className="material-symbols-outlined text-body-lg">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Persistent Header - Hidden in admin mode as per user requirement */}
      {activeNavTab !== 'admin' && (
        <Header
          activeTab={selectedCourse ? '' : activeNavTab}
          setActiveTab={(tab) => {
            setSelectedCourse(null);
            setActiveNavTab(tab);
          }}
          cartCount={cartCount}
          onOpenCart={() => {
            setSelectedCourse(null);
            setActiveNavTab('carrinho');
          }}
          onOpenAuth={(mode, role) => {
            if (mode === 'register') {
              setActiveNavTab('cadastro');
            } else {
              setAuthModal({ isOpen: true, mode, role });
            }
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={handleSearch}
          onNavigateSection={scrollToSection}
          onOpenCertificates={() => setIsCertModalOpen(true)}
          currentUser={currentUser}
          onOpenStudentPortal={() => {
            setSelectedCourse(null);
            setActiveNavTab('aluno');
          }}
          onOpenAdminDashboard={() => {
            setSelectedCourse(null);
            setActiveNavTab('admin');
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Rendered according to View */}
      <main className={`w-full ${activeNavTab === 'admin' ? 'pt-0' : 'pt-20'} bg-surface flex-1`}>
        {selectedCourse ? (
          /* VIEW 0: DETALHES DO CURSO EM PÁGINA INTEIRA (SUBSTITUI A HOME AO SELECIONAR UM CURSO) */
          <CourseDetailPage
            course={selectedCourse}
            onBackToHome={() => {
              setSelectedCourse(null);
              setActiveNavTab('inicio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddToCart={(course) => handleAddToCart(course)}
            onBuyNow={(course) => {
              handleAddToCart(course);
              setSelectedCourse(null);
              setActiveNavTab('carrinho');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isAdded={addedCourseIds.includes(selectedCourse.id)}
            onOpenCertificateModal={() => setIsCertModalOpen(true)}
          />
        ) : activeNavTab === 'carrinho' ? (
          <CartCheckoutPage
            items={cartItems}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onNavigateHome={(sectionId) => scrollToSection(sectionId || 'hero-section')}
            onCheckoutSuccess={handleCheckoutSuccess}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModal({ isOpen: true, mode: 'login', role: 'aluno' })}
          />
        ) : activeNavTab === 'cursos' ? (
          /* VIEW 1.5: CATÁLOGO DEDICADO DE CURSOS (COM SIDEBAR DE CATEGORIAS E OPÇÃO TODOS) */
          <CoursesCatalogPage
            courses={coursesList.filter(c => c.status === 'publicado')}
            categories={categoriesList}
            initialCategory={selectedCategory}
            onAddToCart={handleAddToCart}
            onSelectCourse={(course) => {
              setSelectedCourse(course);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            addedCourseIds={addedCourseIds}
            currentUser={currentUser}
            onOpenStudentPortal={() => setActiveNavTab('aluno')}
            onNavigateHome={(sectionId) => {
              setActiveNavTab('inicio');
              scrollToSection(sectionId || 'hero-section');
            }}
          />
        ) : activeNavTab === 'aluno' ? (
          /* VIEW 2: ÁREA DO ALUNO (ESTUDANTE) — Fix 3: require login */
          currentUser ? (
          <StudentPortal
            user={currentUser}
            onUpdateUser={handleUpdateUser}
            enrolledCourses={studentEnrolledCourses}
            progressData={(currentUser && studentProgressMap[currentUser.id]) || {}}
            certificates={INITIAL_CERTIFICATES.filter((c) => c.studentId === currentUser?.id)}
            onNavigateHome={() => {
              setSelectedCategory(null);
              setActiveNavTab('cursos');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLogout={handleLogout}
            onOpenCertificateModal={() => setIsCertModalOpen(true)}
            onOpenCatalog={() => {
              setSelectedCategory(null);
              setActiveNavTab('cursos');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCompleteLesson={handleCompleteLesson}
            onCancelEnrollment={handleCancelEnrollment}
          />
          ) : (() => {
            // Redirect unauthenticated visitor to login
            setTimeout(() => {
              setActiveNavTab('inicio');
              setAuthModal({ isOpen: true, mode: 'login', role: 'aluno' });
              showToast('Faça login para acessar a Área do Aluno.');
            }, 0);
            return <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4">
                <span className="material-symbols-outlined text-6xl text-text-tertiary">lock</span>
                <p className="text-text-secondary font-label-lg">Redirecionando para o login...</p>
              </div>
            </div>;
          })()
        ) : activeNavTab === 'admin' ? (
          /* VIEW 3: PAINEL DO ADMIN — Fix 1: require admin role */
          currentUser?.role === 'admin' ? (
          <AdminDashboard
            courses={coursesList}
            users={usersList}
            categories={categoriesList}
            heroBannerConfig={heroBannerConfig}
            onUpdateHeroBannerConfig={handleUpdateHeroBannerConfig}
            middleBannerConfig={middleBannerConfig}
            onUpdateMiddleBannerConfig={handleUpdateMiddleBannerConfig}
            onAddCourse={handleAddCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onUpdateCategories={handleUpdateCategories}
            onLogout={handleLogout}
          />
          ) : (() => {
            // Redirect non-admin user
            setTimeout(() => {
              setActiveNavTab('inicio');
              setAuthModal({ isOpen: true, mode: 'login', role: 'admin' });
              showToast('Acesso negado. Faça login com credenciais de administrador.');
            }, 0);
            return <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4">
                <span className="material-symbols-outlined text-6xl text-status-danger">shield</span>
                <p className="text-text-secondary font-label-lg">Acesso restrito — redirecionando...</p>
              </div>
            </div>;
          })()
        ) : activeNavTab === 'cadastro' ? (
          /* VIEW 4: PÁGINA DE CADASTRO COMPLETO */
          <RegisterPage
            onNavigateHome={(sectionId) => scrollToSection(sectionId || 'hero-section')}
            onOpenLogin={() => setAuthModal({ isOpen: true, mode: 'login' })}
            onRegistrationSuccess={(data: RegistrationData) => {
              const newUser: UserAccount = {
                id: `user-${Date.now()}`,
                name: data.name,
                email: data.email || `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@dedsacademy.com.br`,
                password: data.password,
                role: 'aluno',
                cpf: data.cpf || undefined,
                phone: data.phone || undefined,
                address: data.address,
                studentCode: `ALU-${Math.floor(1000 + Math.random() * 9000)}`,
                status: 'ativo',
                registeredAt: new Date().toLocaleDateString('pt-BR'),
                lastAccess: 'Agora mesmo',
                enrolledCourseIds: [],
                completedCourseIds: [],
              };
              handleAddUser(newUser);
              setCurrentUser(newUser);
              setActiveNavTab('aluno');
              showToast(`Cadastro realizado com sucesso! Bem-vindo(a), ${data.name}!`);
            }}
          />
        ) : activeNavTab === 'blog' ? (
          /* VIEW 5: PÁGINA DO BLOG & CENTRAL DE DÚVIDAS */
          <BlogPage
            onNavigateHome={(sectionId) => scrollToSection(sectionId || 'hero-section')}
            onOpenSupportTicket={() => showToast('Canal de suporte ao aluno acionado!')}
            onOpenCertModal={() => setIsCertModalOpen(true)}
            onOpenProfile={() => setActiveNavTab(currentUser?.role === 'admin' ? 'admin' : 'aluno')}
          />
        ) : activeNavTab === 'contato' ? (
          /* VIEW 5.5: PÁGINA DEDICADA DE CONTATO & SUPORTE COM FORMULÁRIO E CANAIS */
          <ContactPage
            currentUser={currentUser}
            onNavigateHome={(sectionId) => {
              setActiveNavTab('inicio');
              scrollToSection(sectionId || 'hero-section');
            }}
            onOpenRegister={() => setActiveNavTab('cadastro')}
          />
        ) : (
          /* VIEW 6: LANDING PAGE PRINCIPAL / CATÁLOGO PÚBLICO */
          <div className="flex flex-col w-full">
            {/* Hero Section */}
            <HeroSection
              heroBannerConfig={heroBannerConfig}
              middleBannerConfig={middleBannerConfig}
              onNavigateTarget={handleNavigateMiddleBanner}
              onSearch={handleSearch}
              onSelectTag={handleSelectTag}
              onOpenCertificateModal={() => setIsCertModalOpen(true)}
              onOpenAuth={(mode, role) => setAuthModal({ isOpen: true, mode, role })}
              onOpenRegister={() => setActiveNavTab('cadastro')}
            />

            {/* Courses Highlight Section */}
            <CoursesSection
              courses={displayedCourses}
              activeFilter={activeCourseFilter}
              setActiveFilter={setActiveCourseFilter}
              onAddToCart={handleAddToCart}
              onSelectCourse={(course) => {
                setSelectedCourse(course);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              addedCourseIds={addedCourseIds}
              onOpenCatalog={() => {
                setSelectedCategory(null);
                setActiveNavTab('cursos');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Categories Section */}
            <CategoriesSection
              categories={categoriesList}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />

            {/* Student Testimonials */}
            <TestimonialsSection testimonials={TESTIMONIALS} />

            {/* Final CTA Banner */}
            <CtaSection
              onExploreCourses={() => {
                setSelectedCategory(null);
                setActiveNavTab('cursos');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenRegister={() => setActiveNavTab('cadastro')}
            />
          </div>
        )}
      </main>

      {/* Footer - Only shown in store & student portal, hidden in admin mode */}
      {activeNavTab !== 'admin' && (
        <Footer
          onOpenCertificateModal={() => setIsCertModalOpen(true)}
          onSelectCategoryFilter={(cat) => {
            setSelectedCategory(cat);
            setActiveNavTab('cursos');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAuth={() => setAuthModal({ isOpen: true, mode: 'login' })}
          onOpenContact={() => {
            setActiveNavTab('contato');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Quick Cart Drawer (Alternative slide-over) */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        items={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCheckout={() => {
          setIsCartDrawerOpen(false);
          setActiveNavTab('carrinho');
        }}
      />

      {/* Certificate Validation Modal */}
      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
      />

      {/* Unified Authentication Modal (Aluno & Admin) */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        initialRole={authModal.role}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        onSuccess={handleAuthSuccess}
        onOpenRegisterPage={() => setActiveNavTab('cadastro')}
        usersList={usersList}
      />
    </div>
  );
}
