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
import { supabase } from '../lib/supabaseClient';

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

function courseToRowFormat(course: any) {
  return {
    id: course.id,
    title: course.title,
    instructor: course.instructor,
    instructor_role: course.instructorRole ?? null,
    instructor_avatar: course.instructorAvatar ?? null,
    category: course.category,
    level: course.level ?? 'Todos os Níveis',
    rating: Number(course.rating) || 5.0,
    reviews_count: Number(course.reviewsCount) || 0,
    students_count: Number(course.studentsCount) || 0,
    hours: Number(course.hours) || 40,
    lessons_count: Number(course.lessonsCount) || 0,
    original_price: Number(course.originalPrice) || 0,
    current_price: Number(course.currentPrice) || 0,
    image: course.image,
    image_file_name: course.imageFileName ?? null,
    banner_image: course.bannerImage ?? null,
    banner_file_name: course.bannerFileName ?? null,
    badge: course.badge ?? null,
    filter_tags: Array.isArray(course.filterTags) ? course.filterTags : [],
    description: course.description ?? '',
    syllabus: Array.isArray(course.syllabus) ? course.syllabus : [],
    modules: Array.isArray(course.modules) ? course.modules : [],
    status: course.status ?? 'publicado',
    is_auto_launch_badge: Boolean(course.isAutoLaunchBadge),
    video_url: course.videoUrl ?? null,
    video_file_name: course.videoFileName ?? null,
    video_type: course.videoType ?? null,
    final_exam: course.finalExam ?? null,
    updated_at: new Date().toISOString(),
  };
}

function rowToCourseFormat(row: Record<string, any>) {
  return {
    id: row.id,
    title: row.title,
    instructor: row.instructor,
    instructorRole: row.instructor_role ?? undefined,
    instructorAvatar: row.instructor_avatar ?? undefined,
    category: row.category,
    level: row.level ?? 'Todos os Níveis',
    rating: Number(row.rating) || 5.0,
    reviewsCount: Number(row.reviews_count) || 0,
    studentsCount: Number(row.students_count) || 0,
    hours: Number(row.hours) || 40,
    lessonsCount: Number(row.lessons_count) || 0,
    originalPrice: Number(row.original_price) || 0,
    currentPrice: Number(row.current_price) || 0,
    image: row.image,
    imageFileName: row.image_file_name ?? undefined,
    bannerImage: row.banner_image ?? undefined,
    bannerFileName: row.banner_file_name ?? undefined,
    badge: row.badge ?? undefined,
    filterTags: Array.isArray(row.filter_tags) ? row.filter_tags : [],
    description: row.description ?? '',
    syllabus: Array.isArray(row.syllabus) ? row.syllabus : [],
    modules: Array.isArray(row.modules) ? row.modules : [],
    status: row.status ?? 'publicado',
    isAutoLaunchBadge: Boolean(row.is_auto_launch_badge),
    videoUrl: row.video_url ?? undefined,
    videoFileName: row.video_file_name ?? undefined,
    videoType: row.video_type ?? undefined,
    finalExam: row.final_exam ?? undefined,
  };
}

function userToRowFormat(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    password: user.password ?? null,
    student_code: user.studentCode ?? null,
    cpf: user.cpf ?? null,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
    address: user.address ?? null,
    certificate_data: user.certificateData ?? null,
    status: user.status ?? 'ativo',
    registered_at: user.registeredAt ?? new Date().toISOString(),
    last_access: user.lastAccess ?? null,
    enrolled_course_ids: user.enrolledCourseIds ?? [],
    completed_course_ids: user.completedCourseIds ?? [],
    job_title: user.jobTitle ?? null,
    department: user.department ?? null,
    access_level: user.accessLevel ?? null,
    updated_at: new Date().toISOString(),
  };
}

function rowToUserFormat(row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    password: row.password ?? undefined,
    studentCode: row.student_code ?? undefined,
    cpf: row.cpf ?? undefined,
    phone: row.phone ?? undefined,
    avatar: row.avatar ?? undefined,
    address: row.address ?? undefined,
    certificateData: row.certificate_data ?? undefined,
    status: row.status ?? 'ativo',
    registeredAt: row.registered_at ?? new Date().toISOString(),
    lastAccess: row.last_access ?? undefined,
    enrolledCourseIds: row.enrolled_course_ids ?? [],
    completedCourseIds: row.completed_course_ids ?? [],
    jobTitle: row.job_title ?? undefined,
    department: row.department ?? undefined,
    accessLevel: row.access_level ?? undefined,
  };
}

export async function syncFromSupabase(): Promise<PlatformStore> {
  const store = ensureStoreFile();
  try {
    const [coursesRes, catsRes, usersRes, certsRes] = await Promise.all([
      supabase.from('courses').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('users').select('*'),
      supabase.from('certificates').select('*'),
    ]);

    let modified = false;

    if (!coursesRes.error && Array.isArray(coursesRes.data) && coursesRes.data.length > 0) {
      store.courses = coursesRes.data.map(rowToCourseFormat);
      modified = true;
    }

    if (!catsRes.error && Array.isArray(catsRes.data) && catsRes.data.length > 0) {
      store.categories = catsRes.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        courseCount: Number(c.course_count) || 0,
        icon: c.icon || 'folder',
      }));
      modified = true;
    }

    if (!usersRes.error && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
      store.users = usersRes.data.map(rowToUserFormat);
      modified = true;
    }

    if (!certsRes.error && Array.isArray(certsRes.data) && certsRes.data.length > 0) {
      store.certificates = certsRes.data;
      modified = true;
    }

    if (modified) {
      store.version = Date.now();
      store.lastUpdated = new Date().toISOString();
      inMemoryStore = store;
      try {
        if (!fs.existsSync(PRIMARY_DATA_DIR)) {
          fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(PRIMARY_STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
      } catch {}
      console.log(`[PlatformSyncHandler] Sincronizado com sucesso com o Supabase: ${store.courses.length} cursos, ${store.users.length} usuários`);
    }
  } catch (err) {
    console.warn('[PlatformSyncHandler] Aviso na sincronização com o Supabase:', err);
  }
  return store;
}

async function syncToSupabase(type: string, data: any) {
  try {
    if (type === 'courses' && Array.isArray(data)) {
      const rows = data.map(courseToRowFormat);
      const { error } = await supabase.from('courses').upsert(rows);
      if (error) console.warn('[PlatformSyncHandler] Falha ao upsert cursos no Supabase:', error.message);
    } else if (type === 'users' && Array.isArray(data)) {
      const rows = data.map(userToRowFormat);
      const { error } = await supabase.from('users').upsert(rows);
      if (error) console.warn('[PlatformSyncHandler] Falha ao upsert usuários no Supabase:', error.message);
    } else if (type === 'categories' && Array.isArray(data)) {
      const rows = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        course_count: c.courseCount ?? c.course_count ?? 0,
        icon: c.icon || 'folder',
      }));
      const { error } = await supabase.from('categories').upsert(rows);
      if (error) console.warn('[PlatformSyncHandler] Falha ao upsert categorias no Supabase:', error.message);
    } else if (type === 'certificates' && Array.isArray(data)) {
      const { error } = await supabase.from('certificates').upsert(data);
      if (error) console.warn('[PlatformSyncHandler] Falha ao upsert certificados no Supabase:', error.message);
    }
  } catch (err) {
    console.warn('[PlatformSyncHandler] syncToSupabase erro:', err);
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

    // Persiste também no Supabase em segundo plano
    syncToSupabase(payload.type as string, payload.data).catch(() => {});

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
