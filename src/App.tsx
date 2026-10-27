/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
import { BlogHomeSection } from './components/BlogHomeSection';
import { safeSaveLocalStorage } from './lib/imageOptimizer';
import { CoursesCatalogPage } from './components/CoursesCatalogPage';
import { ContactPage } from './components/ContactPage';
import { StudentCourseStudyPage } from './components/StudentCourseStudyPage';
import { CertificateSection } from './components/CertificateSection';
import { FloatingCouponPopup } from './components/FloatingCouponPopup';
import { COURSES, CATEGORIES, TESTIMONIALS } from './data/coursesData';
import { INITIAL_COUPONS, INITIAL_CAMPAIGNS } from './data/promotionsData';
import { INITIAL_USERS, INITIAL_STUDENT_PROGRESS, INITIAL_CERTIFICATES, INITIAL_COURSE_REVIEWS, INITIAL_BLOG_POSTS, INITIAL_INSTRUCTORS } from './data/usersData';
import { Course, CartItem, Coupon, PromotionalCampaign, BlogPost, UserAccount, StudentProgress, Category, HeroBannerConfig, DEFAULT_HERO_BANNER, MiddlePromoBannerConfig, DEFAULT_MIDDLE_PROMO_BANNER, CheckoutPaymentBannerConfig, DEFAULT_CHECKOUT_PAYMENT_BANNER, CourseReview, CertificateItem, Testimonial, Instructor } from './types';
import { fetchUsers, fetchCourses, fetchCategories, upsertUser, upsertCourse, deleteCourse as sbDeleteCourse, upsertCategories, seedIfEmpty } from './lib/supabaseService';
import { sendWelcomeEmail, sendLessonCompleteEmail, sendCertificateEmail, sendNewCourseBroadcastEmail } from './services/emailService';
import { generateSequentialCertificateCode, saveCertificateToDB, fetchCertificatesFromDB } from './services/certificateService';
import { sanitizeCourseList, getCacheBustedImageUrl, forceClearAndResyncSiteCache, DEDS_CACHE_VERSION } from './lib/cacheManager';

/**
 * SECURITY: Blocks unauthorized access to admin panel.
 * Renders a "restricted" screen and triggers redirect on mount via useEffect.
 * This ensures no admin content is ever rendered for non-admin users.
 */
const AdminAccessBlocked: React.FC<{ onRedirect: () => void }> = ({ onRedirect }) => {
  useEffect(() => {
    onRedirect();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-status-danger">shield</span>
        <p className="text-text-secondary font-label-lg">Acesso restrito — redirecionando...</p>
      </div>
    </div>
  );
};

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
      const savedCoursesRaw = localStorage.getItem('deds_courses_list');
      if (savedCoursesRaw) {
        const parsed = JSON.parse(savedCoursesRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeCourseList(parsed);
        }
      }
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

  // Instructors state synchronized across Home and Admin Module 6
  const [instructorsList, setInstructorsList] = useState<Instructor[]>(() => {
    try {
      const saved = localStorage.getItem('deds_instructors_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_INSTRUCTORS;
  });

  const handleUpdateInstructors = (newList: Instructor[]) => {
    setInstructorsList(newList);
    try {
      localStorage.setItem('deds_instructors_list', JSON.stringify(newList));
    } catch {}
    window.dispatchEvent(new CustomEvent('deds_instructors_updated', { detail: newList }));
  };

  useEffect(() => {
    const syncInstructors = () => {
      try {
        const saved = localStorage.getItem('deds_instructors_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInstructorsList(parsed);
          }
        }
      } catch {}
    };
    window.addEventListener('deds_instructors_updated', syncInstructors);
    window.addEventListener('storage', syncInstructors);
    return () => {
      window.removeEventListener('deds_instructors_updated', syncInstructors);
      window.removeEventListener('storage', syncInstructors);
    };
  }, []);

  // Checkout Payment Banner configuration state synchronized across Checkout and Admin Module 9
  const [checkoutBannerConfig, setCheckoutBannerConfig] = useState<CheckoutPaymentBannerConfig>(() => {
    try {
      const saved = localStorage.getItem('deds_checkout_banner_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CHECKOUT_PAYMENT_BANNER;
  });

  const handleUpdateCheckoutBannerConfig = (newConfig: CheckoutPaymentBannerConfig) => {
    setCheckoutBannerConfig(newConfig);
    try {
      safeSaveLocalStorage('deds_checkout_banner_config', newConfig);
      window.dispatchEvent(new CustomEvent('deds_checkout_banner_updated', { detail: newConfig }));
    } catch {}
    showToast('Banner de Pagamento atualizado com sucesso!');
  };

  // Hero Banner configuration state synchronized across Home and Admin Module 9
  const [heroBannerConfig, setHeroBannerConfig] = useState<HeroBannerConfig>(() => {
    try {
      const savedHeroRaw = localStorage.getItem('deds_hero_banner_config');
      const saved = savedHeroRaw && !savedHeroRaw.includes('lh3.googleusercontent.com') ? savedHeroRaw : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_HERO_BANNER;
  });

  const handleUpdateHeroBannerConfig = (newConfig: HeroBannerConfig) => {
    setHeroBannerConfig(newConfig);
    try {
      safeSaveLocalStorage('deds_hero_banner_config', newConfig);
      window.dispatchEvent(new CustomEvent('deds_hero_banner_updated', { detail: newConfig }));
    } catch {}
    showToast('Banner da Home e selos atualizados com sucesso!');
  };

  // Synchronized Coupons State across App, Header, Home, Checkout, and Admin Module 14
  const [couponsList, setCouponsList] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem('deds_coupons_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_COUPONS;
  });

  const handleUpdateCoupons = (newList: Coupon[]) => {
    setCouponsList(newList);
    try {
      localStorage.setItem('deds_coupons_list', JSON.stringify(newList));
    } catch {}
    window.dispatchEvent(new CustomEvent('deds_coupons_updated', { detail: newList }));
  };

  useEffect(() => {
    const handleCouponsSync = () => {
      try {
        const saved = localStorage.getItem('deds_coupons_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setCouponsList(parsed);
        }
      } catch {}
    };

    window.addEventListener('storage', handleCouponsSync);
    window.addEventListener('deds_coupons_updated', handleCouponsSync);
    return () => {
      window.removeEventListener('storage', handleCouponsSync);
      window.removeEventListener('deds_coupons_updated', handleCouponsSync);
    };
  }, []);

  // Synchronized Campaigns State across App, Header, Home and Admin Module 14
  const [campaignsList, setCampaignsList] = useState<PromotionalCampaign[]>(() => {
    try {
      const saved = localStorage.getItem('deds_campaigns_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CAMPAIGNS;
  });

  const handleUpdateCampaigns = (newList: PromotionalCampaign[]) => {
    setCampaignsList(newList);
    try {
      localStorage.setItem('deds_campaigns_list', JSON.stringify(newList));
    } catch {}
    window.dispatchEvent(new CustomEvent('deds_campaigns_updated', { detail: newList }));
  };

  useEffect(() => {
    const handleCampaignsSync = () => {
      try {
        const saved = localStorage.getItem('deds_campaigns_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setCampaignsList(parsed);
        }
      } catch {}
    };

    window.addEventListener('storage', handleCampaignsSync);
    window.addEventListener('deds_campaigns_updated', handleCampaignsSync);
    return () => {
      window.removeEventListener('storage', handleCampaignsSync);
      window.removeEventListener('deds_campaigns_updated', handleCampaignsSync);
    };
  }, []);

  // Middle Promotional Banner configuration state synchronized across Home and Admin Module 9
  const [middleBannerConfig, setMiddleBannerConfig] = useState<MiddlePromoBannerConfig>(() => {
    try {
      const savedMiddleRaw = localStorage.getItem('deds_middle_banner_config');
      const saved = savedMiddleRaw && !savedMiddleRaw.includes('lh3.googleusercontent.com') ? savedMiddleRaw : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_MIDDLE_PROMO_BANNER;
  });

  const handleUpdateMiddleBannerConfig = (newConfig: MiddlePromoBannerConfig) => {
    setMiddleBannerConfig(newConfig);
    try {
      safeSaveLocalStorage('deds_middle_banner_config', newConfig);
      window.dispatchEvent(new CustomEvent('deds_middle_banner_updated', { detail: newConfig }));
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

    const rawSectionId = targetUrl.startsWith('#') ? targetUrl.substring(1) : targetUrl;
    const sectionId = rawSectionId === 'courses-section' ? 'cursos-section' : rawSectionId;
    scrollToSection(sectionId);
  };

  // Blog posts state synchronized between Blog and Admin Module 9
  const [blogPostsList, setBlogPostsList] = useState<BlogPost[]>(() => {
    try {
      const saved = localStorage.getItem('deds_blog_posts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_BLOG_POSTS;
  });

  const handleAddBlogPost = (post: BlogPost) => {
    setBlogPostsList((prev) => {
      const updated = [post, ...prev];
      try {
        safeSaveLocalStorage('deds_blog_posts', updated);
        window.dispatchEvent(new CustomEvent('deds_blog_posts_updated', { detail: updated }));
      } catch {}
      return updated;
    });
    showToast('Artigo publicado no blog com sucesso!');
  };

  const handleUpdateBlogPost = (post: BlogPost) => {
    setBlogPostsList((prev) => {
      const updated = prev.map((p) => (p.id === post.id ? post : p));
      try {
        safeSaveLocalStorage('deds_blog_posts', updated);
        window.dispatchEvent(new CustomEvent('deds_blog_posts_updated', { detail: updated }));
      } catch {}
      return updated;
    });
    showToast('Artigo atualizado no blog com sucesso!');
  };

  const handleDeleteBlogPost = (postId: string) => {
    setBlogPostsList((prev) => {
      const updated = prev.filter((p) => p.id !== postId);
      try {
        safeSaveLocalStorage('deds_blog_posts', updated);
        window.dispatchEvent(new CustomEvent('deds_blog_posts_updated', { detail: updated }));
      } catch {}
      return updated;
    });
    showToast('Artigo removido com sucesso!');
  };

  // Synchronized Announcements state between Admin Module 9, Home Blog Section, and Student Portal
  const [announcementsList, setAnnouncementsList] = useState<
    { id: string; title: string; author: string; date: string; priority: string }[]
  >(() => {
    try {
      const saved = localStorage.getItem('deds_announcements_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'ann-1',
        title: 'Módulo de Inteligência Artificial Generativa liberado em Python com certificados da Lei 9.394/96',
        author: 'Coordenação Pedagógica',
        date: new Date().toLocaleDateString('pt-BR'),
        priority: 'alta',
      },
    ];
  });

  const handleAddAnnouncement = (title: string) => {
    setAnnouncementsList((prev) => {
      const updated = [
        {
          id: `ann-${Date.now()}`,
          title,
          author: 'Coordenação Pedagógica',
          date: new Date().toLocaleDateString('pt-BR'),
          priority: 'alta',
        },
        ...prev,
      ];
      safeSaveLocalStorage('deds_announcements_list', updated);
      window.dispatchEvent(new CustomEvent('deds_announcements_updated', { detail: updated }));
      return updated;
    });
    showToast('Comunicado emitido e sincronizado no portal!');
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
        const [sbUsers, sbCourses, sbCategories, sbCertificates] = await Promise.all([
          fetchUsers(),
          fetchCourses(),
          fetchCategories(),
          fetchCertificatesFromDB(),
        ]);

        if (cancelled) return;

        if (sbCertificates && sbCertificates.length > 0) {
          setCertificatesList((prev) => {
            const merged = [...sbCertificates];
            prev.forEach((p) => {
              if (!merged.some((m) => m.id === p.id || m.code === p.code)) {
                merged.push(p);
              }
            });
            try { localStorage.setItem('deds_certificates_list', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }

        if (sbUsers && sbUsers.length > 0) {
          setUsersList(sbUsers);
          try { localStorage.setItem('deds_users_list', JSON.stringify(sbUsers)); } catch {}
        }
        if (sbCourses && sbCourses.length > 0) {
          const sanitizedSb = sanitizeCourseList(sbCourses);
          setCoursesList((prev) => {
            const merged = [...sanitizedSb];
            COURSES.forEach((official) => {
              if (!merged.some((m) => m.id === official.id)) {
                merged.push(official);
              }
            });
            try { localStorage.setItem('deds_courses_list', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
        if (sbCategories && sbCategories.length > 0) {
          setCategoriesList((prev) => {
            const merged = [...sbCategories];
            CATEGORIES.forEach((official) => {
              if (!merged.some((m) => m.id === official.id)) {
                merged.push(official);
              }
            });
            try { localStorage.setItem('deds_categories_list', JSON.stringify(merged)); } catch {}
            return merged;
          });
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
  const [playerCourse, setPlayerCourse] = useState<Course | null>(null);

  // Security guard: If current user logs out or is not enrolled, clear active course player
  useEffect(() => {
    if (playerCourse) {
      if (!currentUser || (currentUser.role !== 'admin' && !currentUser.enrolledCourseIds?.includes(playerCourse.id))) {
        setPlayerCourse(null);
      }
    }
  }, [currentUser, playerCourse]);

  // Persistent reviews list synchronized across Home, Admin and Student flow
  const [reviewsList, setReviewsList] = useState<CourseReview[]>(() => {
    try {
      const saved = localStorage.getItem('deds_course_reviews');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_COURSE_REVIEWS;
  });

  const [certificatesList, setCertificatesList] = useState<CertificateItem[]>(() => {
    try {
      const saved = localStorage.getItem('deds_certificates_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CERTIFICATES;
  });

  // Dynamic recalculation of course ratings and review counts based on real student reviews
  const enrichedCoursesList = useMemo(() => {
    return coursesList.map((course) => {
      const courseReviews = reviewsList.filter((r) => r.courseId === course.id);
      if (courseReviews.length > 0) {
        const sumRatings = courseReviews.reduce((sum, r) => sum + r.rating, 0);
        const avg = sumRatings / courseReviews.length;
        return {
          ...course,
          rating: Number(avg.toFixed(1)),
          reviewsCount: Math.max(course.reviewsCount, courseReviews.length),
        };
      }
      return course;
    });
  }, [coursesList, reviewsList]);

  // Dynamic testimonials for the Home page derived from student reviews
  const dynamicTestimonials: Testimonial[] = useMemo(() => {
    const fromReviews: Testimonial[] = reviewsList
      .filter((r) => r.comment && r.comment.trim().length > 8 && r.rating >= 4)
      .map((r) => ({
        id: `test-rev-${r.id}`,
        name: r.studentName,
        role: `Aluno(a) de ${r.courseTitle}`,
        quote: `"${r.comment}"`,
        avatar: r.studentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      }));
    return [...fromReviews, ...TESTIMONIALS].slice(0, 8);
  }, [reviewsList]);

  // Cart state initialized empty or loaded from localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('deds_cart_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // State for pending registration when a student completes Stripe payment without an existing account or clicks Quero me Matricular
  const [pendingRegistrationData, setPendingRegistrationData] = useState<{
    name?: string;
    email?: string;
    cpf?: string;
    pendingCourseIds?: string[];
    isFromPayment?: boolean;
  } | null>(null);

  // Open registration page (Cadastre-se) from course presentation / CTA
  const handleOpenRegisterFromCourse = (course?: Course) => {
    if (course) {
      setPendingRegistrationData({
        pendingCourseIds: [course.id],
        isFromPayment: false,
      });
    } else {
      setPendingRegistrationData(null);
    }
    setSelectedCourse(null);
    setActiveNavTab('cadastro');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Synchronize cart items with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('deds_cart_items', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

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
    const newCourseIds =
      checkoutData.courseIds && checkoutData.courseIds.length > 0
        ? checkoutData.courseIds
        : cartItems.map((item) => item.course.id);
    let targetUser: UserAccount;

    if (currentUser) {
      targetUser = {
        ...currentUser,
        enrolledCourseIds: Array.from(
          new Set([...(currentUser.enrolledCourseIds || []), ...newCourseIds])
        ),
      };
    } else {
      const normalizedEmail = (checkoutData.studentEmail || '').trim().toLowerCase();
      const existingUser = usersList.find(
        (u) => u.email.trim().toLowerCase() === normalizedEmail
      );

      if (existingUser) {
        targetUser = {
          ...existingUser,
          name: checkoutData.studentName?.trim() || existingUser.name,
          cpf: checkoutData.studentCpf?.trim() || existingUser.cpf,
          enrolledCourseIds: Array.from(
            new Set([...(existingUser.enrolledCourseIds || []), ...newCourseIds])
          ),
        };
      } else {
        targetUser = {
          id: `user-aluno-${Date.now()}`,
          name: checkoutData.studentName?.trim() || 'Novo Aluno',
          email: checkoutData.studentEmail?.trim() || 'aluno@dedsacademy.com.br',
          role: 'aluno',
          cpf: checkoutData.studentCpf?.trim() || '384.920.118-04',
          studentCode: `ALU-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'ativo',
          registeredAt: new Date().toISOString().split('T')[0],
          enrolledCourseIds: newCourseIds,
          completedCourseIds: [],
        };
      }
    }

    // Initialize progress in studentProgressMap for each enrolled course
    setStudentProgressMap((prev) => {
      const userProg = prev[targetUser.id] || {};
      const updatedProg = { ...userProg };
      newCourseIds.forEach((cId) => {
        if (!updatedProg[cId]) {
          const cObj = coursesList.find((c) => c.id === cId);
          const totalLes = cObj?.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || cObj?.lessonsCount || 1;
          updatedProg[cId] = {
            courseId: cId,
            percent: 0,
            completedLessons: 0,
            totalLessons: totalLes,
            lastLessonTitle: 'Módulo 1: Introdução e Visão Geral',
            lastAccessed: 'Agora mesmo',
            completedLessonIds: [],
          };
        }
      });
      const nextMap = { ...prev, [targetUser.id]: updatedProg };
      try { localStorage.setItem('deds_student_progress', JSON.stringify(nextMap)); } catch {}
      return nextMap;
    });

    setCurrentUser(targetUser);
    handleUpdateUser(targetUser);
    try {
      localStorage.setItem('deds_current_session', JSON.stringify(targetUser));
    } catch {}

    setCartItems([]);
    setSelectedCourse(null);
    setActiveNavTab('aluno');
    showToast(`Matrícula confirmada! Bem-vindo(a) ${targetUser.name}, seus cursos estão disponíveis.`);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');

    if (paymentStatus === 'success') {
      try {
        const saved = localStorage.getItem('deds_pending_checkout');
        let pendingData = {
          studentName: '',
          studentEmail: '',
          studentCpf: '',
          courseIds: [] as string[],
        };

        if (saved) {
          const parsed = JSON.parse(saved);
          pendingData = {
            studentName: parsed.studentName || '',
            studentEmail: parsed.studentEmail || '',
            studentCpf: parsed.studentCpf || '',
            courseIds: parsed.courseIds || [],
          };
          localStorage.removeItem('deds_pending_checkout');
        }

        // Clear cart
        setCartItems([]);
        try {
          localStorage.removeItem('deds_cart_items');
        } catch {}

        // Identify if user already exists by email or CPF
        const normalizedEmail = (pendingData.studentEmail || '').trim().toLowerCase();
        const cleanCpf = (pendingData.studentCpf || '').replace(/\D/g, '');

        const existingUser = usersList.find((u) => {
          const userEmail = (u.email || '').trim().toLowerCase();
          const userCpf = (u.cpf || '').replace(/\D/g, '');
          return (
            (normalizedEmail && userEmail === normalizedEmail) ||
            (cleanCpf.length >= 11 && userCpf && userCpf === cleanCpf)
          );
        });

        // Initialize progress for each enrolled course
        const initProgress = (userId: string, courseIds: string[]) => {
          setStudentProgressMap((prev) => {
            const userProg = prev[userId] || {};
            const updatedProg = { ...userProg };
            courseIds.forEach((cId) => {
              if (!updatedProg[cId]) {
                const cObj = coursesList.find((c) => c.id === cId);
                const totalLes =
                  cObj?.modules?.reduce((acc, m) => acc + m.lessons.length, 0) ||
                  cObj?.lessonsCount ||
                  1;
                updatedProg[cId] = {
                  courseId: cId,
                  percent: 0,
                  completedLessons: 0,
                  totalLessons: totalLes,
                  lastLessonTitle: 'Módulo 1: Introdução e Visão Geral',
                  lastAccessed: 'Agora mesmo',
                  completedLessonIds: [],
                };
              }
            });
            const nextMap = { ...prev, [userId]: updatedProg };
            try {
              localStorage.setItem('deds_student_progress', JSON.stringify(nextMap));
            } catch {}
            return nextMap;
          });
        };

        if (existingUser) {
          // Student ALREADY has an account: enroll and unlock courses
          const updatedEnrolled = Array.from(
            new Set([...(existingUser.enrolledCourseIds || []), ...pendingData.courseIds])
          );
          const updatedUser: UserAccount = {
            ...existingUser,
            name: pendingData.studentName?.trim() || existingUser.name,
            cpf: pendingData.studentCpf?.trim() || existingUser.cpf,
            enrolledCourseIds: updatedEnrolled,
            status: 'ativo',
          };

          handleUpdateUser(updatedUser);
          initProgress(updatedUser.id, pendingData.courseIds);

          if (currentUser && currentUser.id === existingUser.id) {
            setCurrentUser(updatedUser);
            try {
              localStorage.setItem('deds_current_session', JSON.stringify(updatedUser));
            } catch {}
            setActiveNavTab('aluno');
            showToast(`🎉 Pagamento aprovado na Stripe! Olá ${updatedUser.name}, seus novos cursos já estão liberados no seu painel.`);
          } else {
            setActiveNavTab('inicio');
            setAuthModal({ isOpen: true, mode: 'login', role: 'aluno' });
            showToast(`🎉 Pagamento confirmado! Identificamos sua conta cadastrada (${updatedUser.email}). Faça login para acessar seus cursos liberados.`);
          }
        } else {
          // Student does NOT have an account: redirect to registration with prefilled details
          setPendingRegistrationData({
            name: pendingData.studentName,
            email: pendingData.studentEmail,
            cpf: pendingData.studentCpf,
            pendingCourseIds: pendingData.courseIds,
            isFromPayment: true,
          });
          setActiveNavTab('cadastro');
          showToast(`🎉 Pagamento aprovado na Stripe! Crie sua senha de acesso para liberar seus cursos na plataforma.`);
        }

        // Record simulated confirmation email log
        try {
          const emailLogs = JSON.parse(localStorage.getItem('deds_email_logs') || '[]');
          emailLogs.unshift({
            id: `mail-${Date.now()}`,
            to: pendingData.studentEmail,
            studentName: pendingData.studentName,
            subject: existingUser
              ? 'Matrícula Confirmada - Seus novos cursos na Deds Academy'
              : 'Compra Confirmada - Conclua seu cadastro na Deds Academy',
            type: existingUser ? 'enrollment_confirmation' : 'registration_invite',
            timestamp: new Date().toISOString(),
            courseIds: pendingData.courseIds,
          });
          localStorage.setItem('deds_email_logs', JSON.stringify(emailLogs.slice(0, 50)));
        } catch {}

      } catch (err) {
        console.error('[Stripe Return Error]', err);
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancel') {
      showToast('O pagamento na Stripe foi cancelado. Seus itens continuam salvos no carrinho.');
      setActiveNavTab('carrinho');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [usersList, currentUser, coursesList]);
  const _stripeInit = () => {

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
    // 5. Notificação de divulgação de cursos novos
    sendNewCourseBroadcastEmail({ course: newCourse, students: usersList }).catch(console.error);
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
      const existingLessonIds = existing?.completedLessonIds || [];
      const updatedLessonIds = lessonId ? Array.from(new Set([...existingLessonIds, lessonId])) : existingLessonIds;

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
            completedLessonIds: updatedLessonIds,
          },
        },
      };
      try { localStorage.setItem('deds_student_progress', JSON.stringify(updated)); } catch {}

      // 3. Notificação de conclusão de aula
      sendLessonCompleteEmail({
        studentEmail: currentUser.email,
        studentName: currentUser.name,
        courseTitle: course?.title || 'Curso Deds Academy',
        lessonTitle: lessonTitle,
        progressPercent: newPercent,
      }).catch(console.error);

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

  // Handle student course review submission and certificate issuance
  const handleStudentSubmitReview = (review: CourseReview) => {
    setReviewsList((prev) => {
      const updated = [review, ...prev.filter((r) => r.id !== review.id)];
      try { localStorage.setItem('deds_course_reviews', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (currentUser) {
      const userId = currentUser.id;
      const courseId = review.courseId;
      const course = coursesList.find((c) => c.id === courseId);
      const totalLessons = course?.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || course?.lessonsCount || 1;

      setStudentProgressMap((prev) => {
        const userProgress = prev[userId] || {};
        const existing = userProgress[courseId];
        const allLessonIds = course?.modules?.flatMap((m) => m.lessons.map((l) => l.id)) || (existing?.completedLessonIds || []);

        const updated = {
          ...prev,
          [userId]: {
            ...userProgress,
            [courseId]: {
              courseId,
              percent: 100,
              completedLessons: totalLessons,
              totalLessons,
              lastLessonTitle: 'Curso 100% Concluído',
              lastAccessed: 'Hoje (Concluído)',
              completionDate: review.date,
              rating: review.rating,
              reviewComment: review.comment,
              completedLessonIds: allLessonIds,
            },
          },
        };
        try { localStorage.setItem('deds_student_progress', JSON.stringify(updated)); } catch {}
        return updated;
      });

      if (!currentUser.completedCourseIds.includes(courseId)) {
        const updatedUser: UserAccount = {
          ...currentUser,
          completedCourseIds: [...currentUser.completedCourseIds, courseId],
        };
        setCurrentUser(updatedUser);
        handleUpdateUser(updatedUser);
      }

      // Generate sequential unique validation code
      const uniqueCode = generateSequentialCertificateCode(certificatesList);

      // Add to certificates list
      const newCert: CertificateItem = {
        id: `cert-${courseId}-${Date.now()}`,
        courseId,
        courseTitle: review.courseTitle,
        courseCategory: review.courseCategory,
        studentId: currentUser.id,
        studentCode: currentUser.studentCode || `ALU-${currentUser.id.replace(/\D/g, '').slice(-4) || '9842'}`,
        studentName: currentUser.certificateData?.customName || currentUser.name,
        studentCpf: currentUser.certificateData?.customCpf || currentUser.cpf || '384.920.118-04',
        hours: course?.hours || 40,
        issueDate: review.date,
        code: uniqueCode,
        instructor: review.instructor || course?.instructor || 'Deds Academy',
        status: 'valido',
      };
      setCertificatesList((prev) => {
        const next = [newCert, ...prev.filter((c) => !(c.courseId === courseId && c.studentId === currentUser.id))];
        try { localStorage.setItem('deds_certificates_list', JSON.stringify(next)); } catch {}
        return next;
      });

      // Salva no backend / Supabase
      saveCertificateToDB(newCert, currentUser).catch(console.error);

      // 3b. Notificação de emissão do certificado com PDF automático
      sendCertificateEmail({
        studentEmail: currentUser.email,
        studentName: currentUser.certificateData?.customName || currentUser.name,
        courseTitle: review.courseTitle,
        hours: course?.hours || 40,
        instructor: review.instructor || course?.instructor || 'Deds Academy',
        certCode: newCert.code,
      }).catch(console.error);

      showToast(`Avaliação confirmada! Certificado de "${review.courseTitle}" liberado! 🎉`);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviewsList((prev) => {
      const updated = prev.filter((r) => r.id !== reviewId);
      try { localStorage.setItem('deds_course_reviews', JSON.stringify(updated)); } catch {}
      return updated;
    });
    showToast('Avaliação removida com sucesso.');
  };

  const handleAdminIssueCertificate = (newCert: CertificateItem) => {
    setCertificatesList((prev) => {
      const next = [newCert, ...prev];
      try { localStorage.setItem('deds_certificates_list', JSON.stringify(next)); } catch {}
      return next;
    });
    // Salva no backend / Supabase
    saveCertificateToDB(newCert).catch(console.error);
    showToast(`Certificado para "${newCert.studentName}" emitido com sucesso!`);
  };

  const handleAdminCancelCertificate = (certId: string, reason?: string) => {
    setCertificatesList((prev) => {
      const next = prev.map((c) =>
        c.id === certId
          ? {
              ...c,
              status: 'cancelado' as const,
              cancelledAt: new Date().toLocaleDateString('pt-BR'),
              cancellationReason: reason || 'Cancelado pela administração',
            }
          : c
      );
      try { localStorage.setItem('deds_certificates_list', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast('Certificado cancelado e revogado.');
  };
  // Direct student enrollment in a course - strictly restricted to authenticated users
  const handleEnrollCourse = (course: Course) => {
    if (!currentUser) {
      showToast('Acesso restrito. Faça login ou crie sua conta para se matricular no curso.');
      setAuthModal({ isOpen: true, mode: 'login', role: 'aluno' });
      return;
    }

    const targetUser: UserAccount = {
      ...currentUser,
      enrolledCourseIds: Array.from(new Set([...(currentUser.enrolledCourseIds || []), course.id])),
    };

    // Initialize progress if not set
    setStudentProgressMap((prev) => {
      const userProg = prev[targetUser.id] || {};
      if (!userProg[course.id]) {
        const totalLes = course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || course.lessonsCount || 1;
        const nextMap = {
          ...prev,
          [targetUser.id]: {
            ...userProg,
            [course.id]: {
              courseId: course.id,
              percent: 0,
              completedLessons: 0,
              totalLessons: totalLes,
              lastLessonTitle: 'Módulo 1: Introdução e Visão Geral',
              lastAccessed: 'Agora mesmo',
              completedLessonIds: [],
            },
          },
        };
        try { localStorage.setItem('deds_student_progress', JSON.stringify(nextMap)); } catch {}
        return nextMap;
      }
      return prev;
    });

    setCurrentUser(targetUser);
    handleUpdateUser(targetUser);
    try {
      localStorage.setItem('deds_current_session', JSON.stringify(targetUser));
    } catch {}
    showToast(`Matrícula confirmada! "${course.title}" foi adicionado à sua lista de cursos.`);
  };

  // Launch classroom directly from presentation screen - RESTRICTED TO AUTHENTICATED & ENROLLED USERS
  const handleStartCourseFromPresentation = (course: Course) => {
    // 1. Must be authenticated
    if (!currentUser) {
      showToast('Acesso restrito. Faça login para acessar o conteúdo deste curso.');
      setAuthModal({ isOpen: true, mode: 'login', role: 'aluno' });
      return;
    }

    // 2. Must be enrolled (or admin)
    const isEnrolled = currentUser.role === 'admin' || currentUser.enrolledCourseIds?.includes(course.id);
    if (!isEnrolled) {
      showToast('Você ainda não está matriculado neste curso. Adquira o curso para liberar o acesso.');
      return;
    }

    // 3. User is valid and enrolled: initialize progress if needed and launch player
    setStudentProgressMap((prev) => {
      const userProg = prev[currentUser.id] || {};
      if (!userProg[course.id]) {
        const totalLes = course.modules?.reduce((acc, m) => acc + m.lessons.length, 0) || course.lessonsCount || 1;
        const nextMap = {
          ...prev,
          [currentUser.id]: {
            ...userProg,
            [course.id]: {
              courseId: course.id,
              percent: 0,
              completedLessons: 0,
              totalLessons: totalLes,
              lastLessonTitle: 'Módulo 1: Introdução e Visão Geral',
              lastAccessed: 'Agora mesmo',
              completedLessonIds: [],
            },
          },
        };
        try { localStorage.setItem('deds_student_progress', JSON.stringify(nextMap)); } catch {}
        return nextMap;
      }
      return prev;
    });

    setPlayerCourse(course);
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
  const displayedCourses = enrichedCoursesList.filter((course) => {
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
  const studentEnrolledCourses = enrichedCoursesList.filter((c) =>
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
            // SECURITY: Block non-admin users from navigating to admin panel
            if (tab === 'admin' && currentUser?.role !== 'admin') {
              setAuthModal({ isOpen: true, mode: 'login', role: 'admin' });
              showToast('Acesso negado. Faça login com credenciais de administrador.');
              return;
            }
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
            // SECURITY: Verify admin role before granting access
            if (!currentUser || currentUser.role !== 'admin') {
              setAuthModal({ isOpen: true, mode: 'login', role: 'admin' });
              showToast('Acesso negado. Faça login com credenciais de administrador.');
              return;
            }
            setSelectedCourse(null);
            setActiveNavTab('admin');
          }}
          onLogout={handleLogout}
          coupons={couponsList}
          campaigns={campaignsList}
        />
      )}

      {/* Main Content Rendered according to View */}
      <main className={`w-full ${activeNavTab === 'admin' ? 'pt-0' : 'pt-20'} bg-surface flex-1`}>
        {selectedCourse ? (
          /* VIEW 0: DETALHES DO CURSO EM PÁGINA INTEIRA (SUBSTITUI A HOME AO SELECIONAR UM CURSO) */
          <CourseDetailPage
            instructors={instructorsList}
            course={enrichedCoursesList.find((c) => c.id === selectedCourse.id) || selectedCourse}
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
            onRegister={(course) => handleOpenRegisterFromCourse(course)}
            onOpenRegister={() => handleOpenRegisterFromCourse(selectedCourse || undefined)}
            isAdded={addedCourseIds.includes(selectedCourse.id)}
            onOpenCertificateModal={() => setIsCertModalOpen(true)}
            onStartCourse={handleStartCourseFromPresentation}
            isEnrolled={Boolean(currentUser && (currentUser.role === 'admin' || currentUser.enrolledCourseIds?.includes(selectedCourse.id)))}
            progressPercent={currentUser ? studentProgressMap[currentUser.id]?.[selectedCourse.id]?.percent : 0}
            currentUser={currentUser}
            onOpenAuthModal={() => setAuthModal({ isOpen: true, mode: 'login', role: 'aluno' })}
          />
        ) : activeNavTab === 'carrinho' ? (
          <CartCheckoutPage
            checkoutBannerConfig={checkoutBannerConfig}
            coupons={couponsList}
            items={cartItems}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onNavigateHome={(sectionId) => scrollToSection(sectionId || 'hero-section')}
            onCheckoutSuccess={handleCheckoutSuccess}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModal({ isOpen: true, mode: 'login', role: 'aluno' })}
            usersList={usersList}
          />
        ) : activeNavTab === 'cursos' ? (
          /* VIEW 1.5: CATÁLOGO DEDICADO DE CURSOS (COM SIDEBAR DE CATEGORIAS E OPÇÃO TODOS) */
          <CoursesCatalogPage
            courses={enrichedCoursesList.filter((c) => c.status === 'publicado')}
            categories={categoriesList}
            instructors={instructorsList}
            onUpdateInstructors={handleUpdateInstructors}
            initialCategory={selectedCategory}
            onAddToCart={handleAddToCart}
            onSelectCourse={(course) => {
              setSelectedCourse(course);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            addedCourseIds={addedCourseIds}
            currentUser={currentUser}
            onOpenStudentPortal={() => setActiveNavTab('aluno')}
            onEnrollCourse={handleEnrollCourse}
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
            allCourses={enrichedCoursesList.filter((c) => c.status === 'publicado')}
            categories={categoriesList}
            progressData={(currentUser && studentProgressMap[currentUser.id]) || {}}
            certificates={certificatesList.filter((c) => c.studentId === currentUser?.id)}
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
            onSubmitReview={handleStudentSubmitReview}
            onEnrollCourse={handleEnrollCourse}
            onStartCourse={handleStartCourseFromPresentation}
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
          /* VIEW 3: PAINEL DO ADMIN — SECURITY: strict admin role guard */
          currentUser?.role === 'admin' ? (
          <AdminDashboard
            courses={enrichedCoursesList}
            users={usersList}
            blogPosts={blogPostsList}
            onAddPost={handleAddBlogPost}
            onUpdatePost={handleUpdateBlogPost}
            onDeletePost={handleDeleteBlogPost}
            categories={categoriesList}
            certificates={certificatesList}
            onIssueCertificate={handleAdminIssueCertificate}
            onCancelCertificate={handleAdminCancelCertificate}
            heroBannerConfig={heroBannerConfig}
            onUpdateHeroBannerConfig={handleUpdateHeroBannerConfig}
            middleBannerConfig={middleBannerConfig}
            onUpdateMiddleBannerConfig={handleUpdateMiddleBannerConfig}
            checkoutBannerConfig={checkoutBannerConfig}
            onUpdateCheckoutBannerConfig={handleUpdateCheckoutBannerConfig}
            announcements={announcementsList}
            onAddAnnouncement={handleAddAnnouncement}
            onAddCourse={handleAddCourse}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onUpdateCategories={handleUpdateCategories}
            onLogout={handleLogout}
            reviews={reviewsList}
            onDeleteReview={handleDeleteReview}
            progressMap={studentProgressMap}
            coupons={couponsList}
            onUpdateCoupons={handleUpdateCoupons}
            campaigns={campaignsList}
            onUpdateCampaigns={handleUpdateCampaigns}
          />
          ) : (
            /* SECURITY: Non-admin access — show blocked screen and redirect immediately */
            <AdminAccessBlocked
              onRedirect={() => {
                setActiveNavTab('inicio');
                setAuthModal({ isOpen: true, mode: 'login', role: 'admin' });
                showToast('Acesso negado. Faça login com credenciais de administrador.');
              }}
            />
          )
        ) : activeNavTab === 'cadastro' ? (
          /* VIEW 4: PÁGINA DE CADASTRO COMPLETO */
          <RegisterPage
            onNavigateHome={(sectionId) => scrollToSection(sectionId || 'hero-section')}
            onOpenLogin={() => setAuthModal({ isOpen: true, mode: 'login' })}
            initialData={pendingRegistrationData}
            isPostCheckoutNotice={Boolean(pendingRegistrationData?.isFromPayment)}
            onRegistrationSuccess={(data: RegistrationData) => {
              const pendingCourses = pendingRegistrationData?.pendingCourseIds || [];
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
                enrolledCourseIds: pendingCourses,
                completedCourseIds: [],
              };
              handleAddUser(newUser);
              setCurrentUser(newUser);
              // 1. Notificação de boas-vindas e orientação de acesso
              sendWelcomeEmail(newUser).catch(console.error);
              setPendingRegistrationData(null);
              setActiveNavTab('aluno');
              showToast(`Cadastro realizado com sucesso! Bem-vindo(a), ${data.name}! Seus cursos já estão disponíveis.`);
            }}
          />
        ) : activeNavTab === 'blog' ? (
          /* VIEW 5: PÁGINA DO BLOG & CENTRAL DE DÚVIDAS */
          <BlogPage
            blogPosts={blogPostsList}
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

            {/* Certificate Section with Real Validation (Área Pública) */}
            <CertificateSection
              certificatesList={certificatesList}
              onOpenCertificateModal={() => setIsCertModalOpen(true)}
            />

            {/* Student Testimonials */}
            <TestimonialsSection testimonials={dynamicTestimonials} />

            {/* Blog & Announcements Section (Sincronizado com Módulo 9 do ADM) */}
            <BlogHomeSection
              blogPosts={blogPostsList}
              announcements={announcementsList}
              onOpenBlogPage={() => {
                setActiveNavTab('blog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

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

      {/* Floating Coupon Pop-up visible on specific sections */}
      <FloatingCouponPopup
        activeTab={activeNavTab}
        coupons={couponsList}
        onNavigateSection={(sec) => scrollToSection(sec)}
      />

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
        certificatesList={certificatesList}
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

      {/* Student Course Classroom Study Page for courses launched from Presentation screen - PROTECTED ACCESS */}
      {playerCourse && currentUser && (currentUser.role === 'admin' || currentUser.enrolledCourseIds?.includes(playerCourse.id)) && (
        <StudentCourseStudyPage
          isOpen={!!playerCourse}
          course={playerCourse}
          onClose={() => setPlayerCourse(null)}
          onCompleteLesson={handleCompleteLesson}
          progress={studentProgressMap[currentUser.id]?.[playerCourse.id]}
          currentUser={currentUser}
          onSubmitReview={handleStudentSubmitReview}
          onOpenCertificateModal={() => setIsCertModalOpen(true)}
        />
      )}
    </div>
  );
}
