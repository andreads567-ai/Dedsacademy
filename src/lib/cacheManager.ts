/**
 * Cache Management & Cross-Browser Synchronization Utility
 *
 * Solves:
 * 1. Stale localStorage pinning across different browsers (Chrome, Safari, Firefox, Edge).
 * 2. Corrupted or expired Google usercontent images (lh3.googleusercontent.com).
 * 3. Cache invalidation on new deployments.
 * 4. Synchronization of coupons, courses, campaigns, and banners.
 */

import { COURSES, CATEGORIES } from '../data/coursesData';
import { INITIAL_COUPONS, INITIAL_CAMPAIGNS } from '../data/promotionsData';
import {
  DEFAULT_HERO_BANNER,
  DEFAULT_MIDDLE_PROMO_BANNER,
  DEFAULT_CHECKOUT_PAYMENT_BANNER,
  Course,
  Coupon,
  PromotionalCampaign,
  Category,
  HeroBannerConfig,
  MiddlePromoBannerConfig,
  CheckoutPaymentBannerConfig,
} from '../types';

export const DEDS_CACHE_VERSION = '2026.10.28-v2';

export const FALLBACK_COURSE_IMAGE = '/images/courses/web-dev.jpg';
export const FALLBACK_HERO_IMAGE = '/images/hero-banner.jpg';
export const FALLBACK_MIDDLE_BANNER_IMAGE = '/images/estude-no-seu-ritmo.jpg';

const COURSE_IMAGE_MAP: Record<string, string> = {
  'python-zero-avancado': '/images/courses/python.jpg',
  'excel-basico-avancado': '/images/courses/excel.jpg',
  'marketing-digital-pratica': '/images/courses/marketing.jpg',
  'ui-ux-design': '/images/courses/ui-ux.jpg',
  'desenvolvimento-web-completo': '/images/courses/web-dev.jpg',
  'desenvolvimento-web-fullstack': '/images/courses/web-dev.jpg',
};

/**
 * Returns an image URL with cache-busting version query string for static local assets
 */
export function getCacheBustedImageUrl(url?: string | null, version?: number | string): string {
  if (!url) return FALLBACK_COURSE_IMAGE;

  // Sanitize Google temporary URLs
  if (url.includes('lh3.googleusercontent.com')) {
    return FALLBACK_COURSE_IMAGE;
  }

  // Data URLs or blobs are self-contained and require no cache busting
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Local assets: bust cache using current server version or timestamp
  if (url.startsWith('/images/') || url.startsWith('/uploads/')) {
    const v = version || DEDS_CACHE_VERSION;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${v}`;
  }

  return url;
}

/**
 * Sanitize a course object to guarantee valid image paths and complete data
 */
export function sanitizeCourse(course: Course): Course {
  let img = course.image || '';
  if (!img || img.includes('lh3.googleusercontent.com')) {
    img = COURSE_IMAGE_MAP[course.id] || COURSES.find((c) => c.id === course.id)?.image || FALLBACK_COURSE_IMAGE;
  }
  return {
    ...course,
    image: img,
  };
}

/**
 * Sanitize course list without deleting custom courses
 */
export function sanitizeCourseList(courses: Course[]): Course[] {
  if (!Array.isArray(courses)) return COURSES;
  return courses.map(sanitizeCourse);
}

/**
 * Safely ensure baseline keys exist in localStorage WITHOUT overwriting or removing any user/admin content
 */
export function initCacheManager(): void {
  try {
    // 1. Courses: only populate if completely absent
    const rawCourses = localStorage.getItem('deds_courses_list');
    if (!rawCourses) {
      localStorage.setItem('deds_courses_list', JSON.stringify(COURSES));
    }

    // 2. Coupons: only populate if completely absent
    const rawCoupons = localStorage.getItem('deds_coupons_list');
    if (!rawCoupons) {
      localStorage.setItem('deds_coupons_list', JSON.stringify(INITIAL_COUPONS));
    }

    // 3. Campaigns: only populate if completely absent
    const rawCampaigns = localStorage.getItem('deds_campaigns_list');
    if (!rawCampaigns) {
      localStorage.setItem('deds_campaigns_list', JSON.stringify(INITIAL_CAMPAIGNS));
    }

    // 4. Hero Banner Config: only populate if completely absent
    const rawHero = localStorage.getItem('deds_hero_banner_config');
    if (!rawHero) {
      localStorage.setItem('deds_hero_banner_config', JSON.stringify(DEFAULT_HERO_BANNER));
    }

    // 5. Middle Banner Config: only populate if completely absent
    const rawMiddle = localStorage.getItem('deds_middle_banner_config');
    if (!rawMiddle) {
      localStorage.setItem('deds_middle_banner_config', JSON.stringify(DEFAULT_MIDDLE_PROMO_BANNER));
    }

    // 6. Checkout Banner Config: only populate if completely absent
    const rawCheckout = localStorage.getItem('deds_checkout_banner_config');
    if (!rawCheckout) {
      localStorage.setItem('deds_checkout_banner_config', JSON.stringify(DEFAULT_CHECKOUT_PAYMENT_BANNER));
    }

    // 7. Categories: only populate if completely absent
    const rawCats = localStorage.getItem('deds_categories_list');
    if (!rawCats) {
      localStorage.setItem('deds_categories_list', JSON.stringify(CATEGORIES));
    }

    localStorage.setItem('deds_cache_version', DEDS_CACHE_VERSION);
  } catch (err) {
    console.warn('[CacheManager] Error during cache initialization:', err);
  }
}

/**
 * Safe, non-destructive reload that preserves all content
 */
export function safeReloadSite(): void {
  window.location.reload();
}
