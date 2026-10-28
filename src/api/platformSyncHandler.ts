import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { COURSES, CATEGORIES } from '../data/coursesData';
import { INITIAL_COUPONS, INITIAL_CAMPAIGNS } from '../data/promotionsData';
import { INITIAL_INSTRUCTORS, INITIAL_BLOG_POSTS } from '../data/usersData';
import {
  DEFAULT_HERO_BANNER,
  DEFAULT_MIDDLE_PROMO_BANNER,
  DEFAULT_CHECKOUT_PAYMENT_BANNER,
} from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);

const projectRoot = process.cwd() || path.resolve(__dirname, '../..');
const PRIMARY_DATA_DIR = path.join(projectRoot, 'data');
const PRIMARY_STORE_FILE = path.join(PRIMARY_DATA_DIR, 'platform-store.json');

const TMP_DATA_DIR = path.join('/tmp', 'data');
const TMP_STORE_FILE = path.join(TMP_DATA_DIR, 'platform-store.json');

const UPLOADS_DIR = path.join(projectRoot, 'public', 'uploads');
const DIST_UPLOADS_DIR = path.join(projectRoot, 'dist', 'uploads');

export interface PlatformStore {
  version: number;
  lastUpdated: string;
  courses: any[];
  categories: any[];
  coupons: any[];
  campaigns: any[];
  heroBanner: any;
  middleBanner: any;
  checkoutBanner: any;
  instructors: any[];
  blogPosts: any[];
  announcements: any[];
}

let inMemoryStore: PlatformStore | null = null;

function getInitialStore(): PlatformStore {
  return {
    version: Date.now(),
    lastUpdated: new Date().toISOString(),
    courses: COURSES,
    categories: CATEGORIES,
    coupons: INITIAL_COUPONS,
    campaigns: INITIAL_CAMPAIGNS,
    heroBanner: DEFAULT_HERO_BANNER,
    middleBanner: DEFAULT_MIDDLE_PROMO_BANNER,
    checkoutBanner: DEFAULT_CHECKOUT_PAYMENT_BANNER,
    instructors: INITIAL_INSTRUCTORS,
    blogPosts: INITIAL_BLOG_POSTS,
    announcements: [
      {
        id: 'ann-1',
        title: 'Módulo de Inteligência Artificial Generativa liberado em Python com certificados da Lei 9.394/96',
        author: 'Coordenação Pedagógica',
        date: new Date().toLocaleDateString('pt-BR'),
        priority: 'alta',
      },
    ],
  };
}

export function ensureStoreFile(): PlatformStore {
  if (inMemoryStore) {
    return inMemoryStore;
  }

  try {
    // 1. Try reading from /tmp on Vercel if it exists
    if (isVercel && fs.existsSync(TMP_STORE_FILE)) {
      try {
        const raw = fs.readFileSync(TMP_STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        inMemoryStore = parsed;
        return parsed;
      } catch {}
    }

    // 2. Try reading from project data/platform-store.json
    if (fs.existsSync(PRIMARY_STORE_FILE)) {
      try {
        const raw = fs.readFileSync(PRIMARY_STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        inMemoryStore = parsed;
        return parsed;
      } catch {}
    }

    // 3. Fallback: create initial store and persist where writable
    const initial = getInitialStore();
    inMemoryStore = initial;

    try {
      if (!fs.existsSync(PRIMARY_DATA_DIR)) {
        fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PRIMARY_STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
    } catch {
      try {
        if (!fs.existsSync(TMP_DATA_DIR)) {
          fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(TMP_STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
      } catch {}
    }

    return initial;
  } catch (err) {
    console.error('[PlatformSyncHandler] Error ensuring store file:', err);
    inMemoryStore = getInitialStore();
    return inMemoryStore;
  }
}

export function getPlatformData(): PlatformStore {
  return ensureStoreFile();
}

export function savePlatformData(payload: {
  type: keyof PlatformStore | 'full';
  data: any;
}): { success: boolean; version: number } {
  try {
    const store = ensureStoreFile();
    const newVersion = Date.now();

    if (payload.type === 'full') {
      Object.assign(store, payload.data);
    } else if (payload.type && payload.data !== undefined) {
      (store as any)[payload.type] = payload.data;
    }

    store.version = newVersion;
    store.lastUpdated = new Date().toISOString();
    inMemoryStore = store;

    const json = JSON.stringify(store, null, 2);

    // Try primary location first
    let saved = false;
    try {
      if (!fs.existsSync(PRIMARY_DATA_DIR)) {
        fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PRIMARY_STORE_FILE, json, 'utf8');
      saved = true;
    } catch {
      // Primary was read-only (e.g. Vercel serverless)
    }

    // Try /tmp location as secondary persistence on serverless
    if (!saved || isVercel) {
      try {
        if (!fs.existsSync(TMP_DATA_DIR)) {
          fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(TMP_STORE_FILE, json, 'utf8');
      } catch {}
    }

    return { success: true, version: newVersion };
  } catch (err: any) {
    console.error('[PlatformSyncHandler] Error saving store file:', err);
    return { success: false, version: 0 };
  }
}

export function handleImageUpload(payload: {
  dataUrl?: string;
  filename?: string;
  prefix?: string;
}): { success: boolean; url?: string; error?: string } {
  try {
    const { dataUrl, filename, prefix = 'upload' } = payload;
    if (!dataUrl || !dataUrl.includes(',')) {
      return { success: false, error: 'DataURL de imagem inválido' };
    }

    // On Vercel, static files cannot be written to Vercel's global CDN at runtime.
    // Returning the self-contained, already compressed Data URL ensures 100% availability
    // across all browsers and devices without 404 errors.
    if (isVercel) {
      return { success: true, url: dataUrl };
    }

    const [header, base64Data] = dataUrl.split(',');
    let ext = 'jpg';
    if (header.includes('image/png')) ext = 'png';
    else if (header.includes('image/webp')) ext = 'webp';
    else if (header.includes('image/svg')) ext = 'svg';
    else if (header.includes('image/jpeg')) ext = 'jpg';

    const safeName = filename
      ? path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_')
      : `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;

    const buffer = Buffer.from(base64Data, 'base64');

    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }

      const publicFilePath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(publicFilePath, buffer);

      if (fs.existsSync(path.join(projectRoot, 'dist'))) {
        if (!fs.existsSync(DIST_UPLOADS_DIR)) {
          fs.mkdirSync(DIST_UPLOADS_DIR, { recursive: true });
        }
        fs.writeFileSync(path.join(DIST_UPLOADS_DIR, safeName), buffer);
      }

      const publicUrl = `/uploads/${safeName}`;
      return { success: true, url: publicUrl };
    } catch (fsErr) {
      console.warn('[PlatformSyncHandler] Filesystem write failed, falling back to dataUrl:', fsErr);
      return { success: true, url: dataUrl };
    }
  } catch (err: any) {
    console.error('[PlatformSyncHandler] Error uploading image:', err);
    return { success: false, error: err.message || 'Erro ao processar imagem' };
  }
}
