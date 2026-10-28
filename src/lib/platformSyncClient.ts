/**
 * Client-side Realtime Platform Synchronization Service
 *
 * Guarantees cross-browser consistency (Opera, Edge, Chrome, Safari, Firefox, Mobile)
 * by storing and synchronizing state through the shared backend API instead of isolated localStorage.
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

/**
 * Fetch the latest platform data from the shared server
 */
export async function fetchPlatformSyncData(): Promise<PlatformSyncPayload | null> {
  try {
    const res = await fetch(`/api/platform-sync?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!res.ok) {
      return null;
    }

    const data: PlatformSyncPayload = await res.json();
    if (data && data.version) {
      currentKnownVersion = data.version;
    }
    return data;
  } catch (err) {
    console.warn('[PlatformSyncClient] Server unreachable, using local state:', err);
    return null;
  }
}

/**
 * Persist an update to the shared backend so all other browsers receive it
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
 * Upload an image file or base64 dataUrl to the shared server /public/uploads/ directory
 * Returns a public relative URL (e.g. /uploads/hero-banner-xxx.webp) accessible by ALL browsers.
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

  // If not a dataUrl, return as is
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
