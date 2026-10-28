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
const projectRoot = isVercel
  ? '/tmp'
  : (process.cwd() || path.resolve(__dirname, '../..'));

const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(projectRoot, 'data');
const STORE_FILE = path.join(DATA_DIR, 'platform-store.json');
const UPLOADS_DIR = isVercel ? path.join('/tmp', 'uploads') : path.join(projectRoot, 'public', 'uploads');
const DIST_UPLOADS_DIR = isVercel ? path.join('/tmp', 'uploads') : path.join(projectRoot, 'dist', 'uploads');

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
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(STORE_FILE)) {
      const initial = getInitialStore();
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }

    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    // Guarantee all top-level keys exist
    const initial = getInitialStore();
    let needsResave = false;
    for (const key of Object.keys(initial) as (keyof PlatformStore)[]) {
      if (parsed[key] === undefined) {
        (parsed as any)[key] = initial[key];
        needsResave = true;
      }
    }

    if (needsResave) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2), 'utf8');
    }

    return parsed;
  } catch (err) {
    console.error('[PlatformSyncHandler] Error ensuring store file:', err);
    return getInitialStore();
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

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
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

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const publicFilePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(publicFilePath, buffer);

    // If dist exists, also write to dist/uploads so production server immediately serves it
    if (fs.existsSync(path.join(projectRoot, 'dist'))) {
      if (!fs.existsSync(DIST_UPLOADS_DIR)) {
        fs.mkdirSync(DIST_UPLOADS_DIR, { recursive: true });
      }
      fs.writeFileSync(path.join(DIST_UPLOADS_DIR, safeName), buffer);
    }

    const publicUrl = `/uploads/${safeName}`;
    return { success: true, url: publicUrl };
  } catch (err: any) {
    console.error('[PlatformSyncHandler] Error uploading image:', err);
    return { success: false, error: err.message || 'Erro ao salvar imagem no servidor' };
  }
}
