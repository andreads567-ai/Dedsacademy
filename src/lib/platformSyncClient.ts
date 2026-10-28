/**
 * Client-side Realtime Platform Synchronization Service
 *
 * Guarantees cross-browser consistency (Opera, Edge, Chrome, Safari, Firefox, Mobile)
 * and server-activated cache invalidation without content deletion.
 */

export interface PlatformSyncPayload {
  version: number;
  courses?: any[];
  categories?: any[];
  coupons?: any[];
  campaigns?: any[];
  heroBanner?: any;
  middleBanner?: any;
  checkoutBanner?: any;
  instructors?: any[];
  blogPosts?: any[];
  announcements?: any[];
}

let currentKnownVersion = 0;

export function getServerCacheVersion(): number {
  return currentKnownVersion;
}

/**
 * Fetch the latest platform data with server-activated cache revalidation (ETag / If-None-Match)
 */
export async function fetchPlatformSyncData(): Promise<PlatformSyncPayload | null> {
  try {
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    };

    if (currentKnownVersion > 0) {
      headers['If-None-Match'] = `W/"${currentKnownVersion}"`;
    }

    const res = await fetch(`/api/platform-sync?t=${Date.now()}`, { headers });

    // 304 Not Modified: Cache is still 100% valid, no new changes
    if (res.status === 304) {
      return null;
    }

    if (!res.ok) {
      return null;
    }

    const data: PlatformSyncPayload = await res.json();
    if (data && data.version) {
      currentKnownVersion = data.version;
    }
    return data;
  } catch (err) {
    console.warn('[PlatformSyncClient] Server unreachable, maintaining active state:', err);
    return null;
  }
}

/**
 * Persist an update to the shared backend so all other browsers receive it and invalidate their cache
 */
export async function syncUpdateToBackend(
  type:
    | 'courses'
    | 'categories'
    | 'coupons'
    | 'campaigns'
    | 'heroBanner'
    | 'middleBanner'
    | 'checkoutBanner'
    | 'instructors'
    | 'blogPosts'
    | 'announcements'
    | 'full',
  data: any
): Promise<boolean> {
  try {
    const res = await fetch('/api/platform-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data }),
    });

    if (!res.ok) return false;

    const result = await res.json();
    if (result.success && result.version) {
      currentKnownVersion = result.version;
    }

    // Safely update current browser local cache for immediate feedback without deleting other data
    try {
      const storageKeyMap: Record<string, string> = {
        courses: 'deds_courses_list',
        categories: 'deds_categories_list',
        coupons: 'deds_coupons_list',
        campaigns: 'deds_campaigns_list',
        heroBanner: 'deds_hero_banner_config',
        middleBanner: 'deds_middle_banner_config',
        checkoutBanner: 'deds_checkout_banner_config',
        instructors: 'deds_instructors_list',
        blogPosts: 'deds_blog_posts',
      };
      const key = storageKeyMap[type];
      if (key && data !== undefined) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch {}

    // Notify other components in the same window
    window.dispatchEvent(
      new CustomEvent('deds_backend_synced', { detail: { type, data, version: result.version } })
    );

    return true;
  } catch (err) {
    console.error(`[PlatformSyncClient] Failed to push update for "${type}":`, err);
    return false;
  }
}

/**
 * Upload an image file or base64 dataUrl to the shared server.
 * On Vercel / serverless environments, returns an optimized, permanent self-contained URL
 * that never causes 404s. On local server, writes to /uploads/.
 */
export async function uploadImageToServer(
  source: File | string,
  prefix: string = 'image'
): Promise<string> {
  let dataUrl: string;

  if (typeof source === 'string') {
    dataUrl = source;
  } else {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(source);
    });
  }

  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  try {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataUrl,
        prefix,
        filename: typeof source !== 'string' ? source.name : undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('[PlatformSyncClient] Image upload API failed, falling back to dataUrl:', err);
  }

  return dataUrl;
}

/**
 * Start live background polling to synchronize changes across browsers automatically
 * with server-activated invalidation and zero data deletion.
 */
export function startLiveSync(
  onUpdate: (data: PlatformSyncPayload) => void,
  intervalMs: number = 3500
): () => void {
  let isChecking = false;

  const check = async () => {
    if (isChecking) return;
    isChecking = true;
    try {
      const data = await fetchPlatformSyncData();
      if (data && data.version && data.version > currentKnownVersion) {
        currentKnownVersion = data.version;

        // Safely synchronize localStorage without deleting unrelated keys
        try {
          if (data.courses) localStorage.setItem('deds_courses_list', JSON.stringify(data.courses));
          if (data.categories) localStorage.setItem('deds_categories_list', JSON.stringify(data.categories));
          if (data.coupons) localStorage.setItem('deds_coupons_list', JSON.stringify(data.coupons));
          if (data.campaigns) localStorage.setItem('deds_campaigns_list', JSON.stringify(data.campaigns));
          if (data.heroBanner) localStorage.setItem('deds_hero_banner_config', JSON.stringify(data.heroBanner));
          if (data.middleBanner) localStorage.setItem('deds_middle_banner_config', JSON.stringify(data.middleBanner));
          if (data.checkoutBanner) localStorage.setItem('deds_checkout_banner_config', JSON.stringify(data.checkoutBanner));
          if (data.instructors) localStorage.setItem('deds_instructors_list', JSON.stringify(data.instructors));
          if (data.blogPosts) localStorage.setItem('deds_blog_posts', JSON.stringify(data.blogPosts));
        } catch {}

        onUpdate(data);
      }
    } catch {} finally {
      isChecking = false;
    }
  };

  // Immediate check
  check();

  // Periodic interval
  const timer = setInterval(check, intervalMs);

  // Focus and visibility revalidation (triggers immediately when switching tabs / windows)
  const handleFocus = () => check();
  const handleVisibility = () => {
    if (!document.hidden) check();
  };

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    clearInterval(timer);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}
