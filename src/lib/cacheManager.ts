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
export function getCacheBustedImageUrl(url?: string | null): string {
  if (!url) return FALLBACK_COURSE_IMAGE;

  // Sanitize Google temporary URLs
  if (url.includes('lh3.googleusercontent.com')) {
    return FALLBACK_COURSE_IMAGE;
  }

  // Only bust cache on local internal images
  if (url.startsWith('/images/')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${DEDS_CACHE_VERSION}`;
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
 * Sanitize course list
 */
export function sanitizeCourseList(courses: Course[]): Course[] {
  if (!Array.isArray(courses)) return COURSES;
  return courses.map(sanitizeCourse);
}

/**
 * Automatically synchronize, clean, and migrate local caches on app boot
 */
export function initCacheManager(): void {
  try {
    const storedVersion = localStorage.getItem('deds_cache_version');
    const isVersionMismatch = storedVersion !== DEDS_CACHE_VERSION;

    if (isVersionMismatch) {
      console.log(`[CacheManager] Migrating and synchronizing cache from ${storedVersion || 'initial'} to ${DEDS_CACHE_VERSION}...`);

      // 1. Sanitize & Merge Courses
      try {
        const rawCourses = localStorage.getItem('deds_courses_list');
        if (rawCourses) {
          const parsed = JSON.parse(rawCourses);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sanitized = parsed.map(sanitizeCourse);
            // Ensure any official courses missing from stored list are added
            COURSES.forEach((officialCourse) => {
              const idx = sanitized.findIndex((c) => c.id === officialCourse.id);
              if (idx === -1) {
                sanitized.push(officialCourse);
              } else if (sanitized[idx].image && sanitized[idx].image.includes('lh3.googleusercontent.com')) {
                sanitized[idx].image = officialCourse.image;
              }
            });
            localStorage.setItem('deds_courses_list', JSON.stringify(sanitized));
          } else {
            localStorage.setItem('deds_courses_list', JSON.stringify(COURSES));
          }
        } else {
          localStorage.setItem('deds_courses_list', JSON.stringify(COURSES));
        }
      } catch (err) {
        console.warn('[CacheManager] Course cache reset to official:', err);
        localStorage.setItem('deds_courses_list', JSON.stringify(COURSES));
      }

      // 2. Sanitize & Merge Coupons
      try {
        const rawCoupons = localStorage.getItem('deds_coupons_list');
        if (rawCoupons) {
          const parsed: Coupon[] = JSON.parse(rawCoupons);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mergedCoupons = [...parsed];
            // Ensure official active coupons are present and valid
            INITIAL_COUPONS.forEach((official) => {
              const existingIdx = mergedCoupons.findIndex((c) => c.code.toUpperCase() === official.code.toUpperCase());
              if (existingIdx === -1) {
                mergedCoupons.push(official);
              } else {
                // Keep uses count if any, but ensure active dates and discounts are up to date
                mergedCoupons[existingIdx] = {
                  ...official,
                  currentUses: mergedCoupons[existingIdx].currentUses || official.currentUses,
                  status: official.status,
                };
              }
            });
            localStorage.setItem('deds_coupons_list', JSON.stringify(mergedCoupons));
          } else {
            localStorage.setItem('deds_coupons_list', JSON.stringify(INITIAL_COUPONS));
          }
        } else {
          localStorage.setItem('deds_coupons_list', JSON.stringify(INITIAL_COUPONS));
        }
      } catch (err) {
        console.warn('[CacheManager] Coupon cache reset to official:', err);
        localStorage.setItem('deds_coupons_list', JSON.stringify(INITIAL_COUPONS));
      }

      // 3. Sanitize & Merge Promotional Campaigns
      try {
        const rawCampaigns = localStorage.getItem('deds_campaigns_list');
        if (rawCampaigns) {
          const parsed: PromotionalCampaign[] = JSON.parse(rawCampaigns);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const merged = [...parsed];
            INITIAL_CAMPAIGNS.forEach((off) => {
              if (!merged.some((c) => c.id === off.id)) merged.push(off);
            });
            localStorage.setItem('deds_campaigns_list', JSON.stringify(merged));
          } else {
            localStorage.setItem('deds_campaigns_list', JSON.stringify(INITIAL_CAMPAIGNS));
          }
        } else {
          localStorage.setItem('deds_campaigns_list', JSON.stringify(INITIAL_CAMPAIGNS));
        }
      } catch {
        localStorage.setItem('deds_campaigns_list', JSON.stringify(INITIAL_CAMPAIGNS));
      }

      // 4. Sanitize Hero Banner Config
      try {
        const rawHero = localStorage.getItem('deds_hero_banner_config');
        if (rawHero) {
          const parsed: HeroBannerConfig = JSON.parse(rawHero);
          if (!parsed.imageUrl || parsed.imageUrl.includes('lh3.googleusercontent.com')) {
            localStorage.setItem('deds_hero_banner_config', JSON.stringify(DEFAULT_HERO_BANNER));
          }
        } else {
          localStorage.setItem('deds_hero_banner_config', JSON.stringify(DEFAULT_HERO_BANNER));
        }
      } catch {
        localStorage.setItem('deds_hero_banner_config', JSON.stringify(DEFAULT_HERO_BANNER));
      }

      // 5. Sanitize Middle Banner Config
      try {
        const rawMiddle = localStorage.getItem('deds_middle_banner_config');
        if (rawMiddle) {
          const parsed: MiddlePromoBannerConfig = JSON.parse(rawMiddle);
          if (!parsed.imageUrl || parsed.imageUrl.includes('lh3.googleusercontent.com')) {
            localStorage.setItem('deds_middle_banner_config', JSON.stringify(DEFAULT_MIDDLE_PROMO_BANNER));
          }
        } else {
          localStorage.setItem('deds_middle_banner_config', JSON.stringify(DEFAULT_MIDDLE_PROMO_BANNER));
        }
      } catch {
        localStorage.setItem('deds_middle_banner_config', JSON.stringify(DEFAULT_MIDDLE_PROMO_BANNER));
      }

      // 6. Sanitize Checkout Banner Config
      try {
        const rawCheckout = localStorage.getItem('deds_checkout_banner_config');
        if (rawCheckout) {
          const parsed: CheckoutPaymentBannerConfig = JSON.parse(rawCheckout);
          if (!parsed.imageUrl || parsed.imageUrl.includes('lh3.googleusercontent.com')) {
            localStorage.setItem('deds_checkout_banner_config', JSON.stringify(DEFAULT_CHECKOUT_PAYMENT_BANNER));
          }
        } else {
          localStorage.setItem('deds_checkout_banner_config', JSON.stringify(DEFAULT_CHECKOUT_PAYMENT_BANNER));
        }
      } catch {
        localStorage.setItem('deds_checkout_banner_config', JSON.stringify(DEFAULT_CHECKOUT_PAYMENT_BANNER));
      }

      // 7. Sanitize Categories
      try {
        const rawCats = localStorage.getItem('deds_categories_list');
        if (!rawCats || JSON.parse(rawCats).length < CATEGORIES.length) {
          localStorage.setItem('deds_categories_list', JSON.stringify(CATEGORIES));
        }
      } catch {
        localStorage.setItem('deds_categories_list', JSON.stringify(CATEGORIES));
      }

      // Store updated version
      localStorage.setItem('deds_cache_version', DEDS_CACHE_VERSION);
      console.log(`[CacheManager] Cache successfully synchronized to version ${DEDS_CACHE_VERSION}.`);
    }
  } catch (err) {
    console.warn('[CacheManager] Error during cache initialization:', err);
  }
}

/**
 * Force clear all cached site content and reload immediately
 */
export function forceClearAndResyncSiteCache(): void {
  try {
    const preserveKeys = ['deds_current_session', 'deds_user', 'deds_token'];
    const preserved: Record<string, string | null> = {};
    preserveKeys.forEach((k) => {
      preserved[k] = localStorage.getItem(k);
    });

    localStorage.clear();

    preserveKeys.forEach((k) => {
      if (preserved[k]) localStorage.setItem(k, preserved[k]!);
    });

    // Write baseline
    localStorage.setItem('deds_courses_list', JSON.stringify(COURSES));
    localStorage.setItem('deds_coupons_list', JSON.stringify(INITIAL_COUPONS));
    localStorage.setItem('deds_campaigns_list', JSON.stringify(INITIAL_CAMPAIGNS));
    localStorage.setItem('deds_categories_list', JSON.stringify(CATEGORIES));
    localStorage.setItem('deds_hero_banner_config', JSON.stringify(DEFAULT_HERO_BANNER));
    localStorage.setItem('deds_middle_banner_config', JSON.stringify(DEFAULT_MIDDLE_PROMO_BANNER));
    localStorage.setItem('deds_checkout_banner_config', JSON.stringify(DEFAULT_CHECKOUT_PAYMENT_BANNER));
    localStorage.setItem('deds_cache_version', DEDS_CACHE_VERSION);

    window.dispatchEvent(new CustomEvent('deds_cache_cleared'));
    window.location.reload();
  } catch (err) {
    console.error('[CacheManager] Failed to force-resync cache:', err);
    window.location.reload();
  }
}
