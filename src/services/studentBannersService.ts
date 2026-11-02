import { StudentBannersConfig, StudentBannerItem, DEFAULT_STUDENT_BANNERS_CONFIG } from '../types';

const STORAGE_KEY = 'deds_student_banners_config';

/**
 * Garante que a lista de banners tenha exatamente as posições 1 a 6 preenchidas.
 */
function normalizeBanners(banners?: StudentBannerItem[]): StudentBannerItem[] {
  const result: StudentBannerItem[] = [];
  const existingMap = new Map<number, StudentBannerItem>();

  if (Array.isArray(banners)) {
    banners.forEach((b) => {
      if (b && typeof b.position === 'number' && b.position >= 1 && b.position <= 6) {
        existingMap.set(b.position, b);
      }
    });
  }

  for (let pos = 1; pos <= 6; pos++) {
    const existing = existingMap.get(pos);
    const defaultItem = DEFAULT_STUDENT_BANNERS_CONFIG.banners.find((d) => d.position === pos);

    if (existing) {
      result.push({
        id: existing.id || `student-banner-${pos}`,
        position: pos,
        imageUrl: existing.imageUrl || '',
        title: existing.title || `Banner ${pos}`,
        linkUrl: existing.linkUrl || '',
        enabled: Boolean(existing.enabled && existing.imageUrl?.trim()),
      });
    } else if (defaultItem) {
      result.push({ ...defaultItem });
    } else {
      result.push({
        id: `student-banner-${pos}`,
        position: pos,
        imageUrl: '',
        title: `Banner ${pos}`,
        linkUrl: '',
        enabled: false,
      });
    }
  }

  return result;
}

export function getStoredStudentBanners(): StudentBannersConfig {
  if (typeof window === 'undefined') return DEFAULT_STUDENT_BANNERS_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : true,
        intervalSeconds: Number(parsed.intervalSeconds) > 0 ? Number(parsed.intervalSeconds) : 5,
        banners: normalizeBanners(parsed.banners),
      };
    }
  } catch (err) {
    console.error('[studentBannersService] Erro ao carregar banners do aluno:', err);
  }
  return {
    ...DEFAULT_STUDENT_BANNERS_CONFIG,
    banners: normalizeBanners(DEFAULT_STUDENT_BANNERS_CONFIG.banners),
  };
}

export function saveStoredStudentBanners(config: StudentBannersConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: StudentBannersConfig = {
      enabled: Boolean(config.enabled),
      intervalSeconds: Number(config.intervalSeconds) > 0 ? Number(config.intervalSeconds) : 5,
      banners: normalizeBanners(config.banners),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('deds_student_banners_updated', { detail: payload }));
  } catch (err) {
    console.error('[studentBannersService] Erro ao salvar banners do aluno:', err);
  }
}
