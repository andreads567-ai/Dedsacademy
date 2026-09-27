import { Course } from '../types';

export interface EffectiveBadge {
  text: string;
  variant: 'emerald' | 'secondary' | 'dark';
  isAutoLaunch?: boolean;
  daysRemaining?: number;
  isExpired?: boolean;
  publishedAtFormatted?: string;
  expiresAtFormatted?: string;
}

/**
 * Calculates the effective promotional badge for a course.
 * If the badge is configured as "Lançamento Automático" (Novo Lançamento),
 * it stays active for exactly 30 days (1 month) from the publication date.
 * After this period, it automatically exits/expires and is no longer shown.
 */
export function getEffectiveCourseBadge(course: Course | null | undefined): EffectiveBadge | null {
  if (!course || !course.badge || !course.badge.text || course.badge.text.trim() === '') {
    return null;
  }

  const badgeText = course.badge.text.trim();
  const isAutoLaunch =
    course.isAutoLaunchBadge === true ||
    badgeText.toLowerCase() === 'novo lançamento' ||
    badgeText.toLowerCase() === 'lançamento' ||
    badgeText.toLowerCase() === 'novo lancamento' ||
    badgeText.toLowerCase() === 'lancamento';

  // If a specific expiration date is defined
  if (course.badge.expiresAt) {
    const expDate = new Date(course.badge.expiresAt);
    if (!isNaN(expDate.getTime()) && Date.now() > expDate.getTime()) {
      return null;
    }
  }

  if (isAutoLaunch) {
    // Parse creation or publication date
    let pubDate: Date | null = null;
    if (course.publishedAt) {
      pubDate = new Date(course.publishedAt);
    } else if (course.createdAt) {
      if (course.createdAt.includes('/')) {
        const parts = course.createdAt.split('/');
        if (parts.length === 3) {
          pubDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      } else {
        pubDate = new Date(course.createdAt);
      }
    }

    if (pubDate && !isNaN(pubDate.getTime())) {
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const elapsedMs = Date.now() - pubDate.getTime();

      // If more than 30 days (1 month) have passed -> automatically expired!
      if (elapsedMs > THIRTY_DAYS_MS) {
        return null;
      }

      const daysRemaining = Math.max(1, Math.ceil((THIRTY_DAYS_MS - elapsedMs) / (24 * 60 * 60 * 1000)));
      return {
        text: badgeText,
        variant: course.badge.variant || 'emerald',
        isAutoLaunch: true,
        daysRemaining,
      };
    }

    // Default for newly published courses without date yet
    return {
      text: badgeText,
      variant: course.badge.variant || 'emerald',
      isAutoLaunch: true,
      daysRemaining: 30,
    };
  }

  return {
    text: badgeText,
    variant: course.badge.variant || 'emerald',
    isAutoLaunch: false,
  };
}
