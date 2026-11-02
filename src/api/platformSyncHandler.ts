import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { COURSES, CATEGORIES } from '../data/coursesData';
import { INITIAL_COUPONS, INITIAL_CAMPAIGNS } from '../data/promotionsData';
import { INITIAL_INSTRUCTORS, INITIAL_BLOG_POSTS, INITIAL_USERS, INITIAL_CERTIFICATES } from '../data/usersData';
import {
  DEFAULT_HERO_BANNER,
  DEFAULT_MIDDLE_PROMO_BANNER,
  DEFAULT_CHECKOUT_PAYMENT_BANNER,
  DEFAULT_STUDENT_BANNERS_CONFIG,
} from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isInsideDist = path.basename(__dirname) === 'dist';
const projectRoot = isInsideDist ? path.resolve(__dirname, '..') : (process.cwd() || __dirname);
const PRIMARY_DATA_DIR = path.join(projectRoot, 'data');
const PRIMARY_STORE_FILE = path.join(PRIMARY_DATA_DIR, 'platform-store.json');

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
  studentBanners?: any;
  instructors: any[];
  blogPosts: any[];
  announcements: any[];
  users: any[];
  certificates: any[];
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
    studentBanners: DEFAULT_STUDENT_BANNERS_CONFIG,
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
    users: INITIAL_USERS,
    certificates: INITIAL_CERTIFICATES,
  };
}

export function ensureStoreFile(): PlatformStore {
  if (inMemoryStore) {
    return inMemoryStore;
  }

  try {
    // 1. Try reading from project data/platform-store.json
    if (fs.existsSync(PRIMARY_STORE_FILE)) {
      try {
        const raw = fs.readFileSync(PRIMARY_STORE_FILE, 'utf8');
        const parsed: PlatformStore = JSON.parse(raw);

        // Ensure users and certificates arrays exist
        let modified = false;
        if (!parsed.users || !Array.isArray(parsed.users)) {
          parsed.users = INITIAL_USERS;
          modified = true;
        }
        if (!parsed.certificates || !Array.isArray(parsed.certificates)) {
          parsed.certificates = INITIAL_CERTIFICATES;
          modified = true;
        }

        if (modified) {
          try {
            fs.writeFileSync(PRIMARY_STORE_FILE, JSON.stringify(parsed, null, 2), 'utf8');
          } catch {}
        }

        inMemoryStore = parsed;
        return parsed;
      } catch (err) {
        console.error('[PlatformSyncHandler] Error parsing primary store, recreating:', err);
      }
    }

    // 2. Fallback: create initial store and persist
    const initial = getInitialStore();
    inMemoryStore = initial;

    try {
      if (!fs.existsSync(PRIMARY_DATA_DIR)) {
        fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PRIMARY_STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
    } catch (writeErr) {
      console.warn('[PlatformSyncHandler] Primary data write warning:', writeErr);
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

    try {
      if (!fs.existsSync(PRIMARY_DATA_DIR)) {
        fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PRIMARY_STORE_FILE, json, 'utf8');
    } catch (fsErr) {
      console.error('[PlatformSyncHandler] Error writing to data file:', fsErr);
    }

    return { success: true, version: newVersion };
  } catch (err: any) {
    console.error('[PlatformSyncHandler] Error saving store file:', err);
    return { success: false, version: 0 };
  }
}

// ─── Helpers Específicos para Usuários e Certificados (Hostinger Database) ───

export function getPlatformCertificates(): any[] {
  const store = ensureStoreFile();
  return store.certificates || [];
}

export function saveCertificate(cert: any): { success: boolean; certificate: any; version: number } {
  const store = ensureStoreFile();
  const certs = store.certificates || [];
  const idx = certs.findIndex((c: any) => c.id === cert.id || (c.code && c.code.toUpperCase() === cert.code.toUpperCase()));
  if (idx >= 0) {
    certs[idx] = { ...certs[idx], ...cert };
  } else {
    certs.unshift(cert);
  }
  const result = savePlatformData({ type: 'certificates', data: certs });
  return { success: result.success, certificate: cert, version: result.version };
}

export function findCertificateByCode(rawCode: string): any | null {
  if (!rawCode) return null;
  const store = ensureStoreFile();
  const certs = store.certificates || [];
  const cleanCode = rawCode.trim().toUpperCase().replace('#', '');
  const alphaCode = cleanCode.replace(/[^A-Z0-9]/g, '');

  return certs.find((c: any) => {
    if (!c || !c.code) return false;
    const cClean = c.code.trim().toUpperCase().replace('#', '');
    const cAlpha = cClean.replace(/[^A-Z0-9]/g, '');
    return cClean === cleanCode || (alphaCode.length >= 4 && cAlpha === alphaCode);
  }) || null;
}

export function getPlatformUsers(): any[] {
  const store = ensureStoreFile();
  return store.users || [];
}

export function upsertPlatformUser(user: any): { success: boolean; user: any } {
  const store = ensureStoreFile();
  const users = store.users || [];
  const idx = users.findIndex((u: any) => u.id === user.id || (user.email && u.email?.toLowerCase() === user.email?.toLowerCase()));
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push(user);
  }
  savePlatformData({ type: 'users', data: users });
  return { success: true, user: idx >= 0 ? users[idx] : user };
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
