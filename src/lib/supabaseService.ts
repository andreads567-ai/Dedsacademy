import { supabase } from './supabaseClient';
import type { UserAccount, Course, Category } from '../types';
import { sanitizeCourse, sanitizeCourseList } from './cacheManager';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a UserAccount to database row format (snake_case) */
function userToRow(user: UserAccount) {
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
    status: user.status,
    registered_at: user.registeredAt,
    last_access: user.lastAccess ?? null,
    enrolled_course_ids: user.enrolledCourseIds ?? [],
    completed_course_ids: user.completedCourseIds ?? [],
    job_title: user.jobTitle ?? null,
    department: user.department ?? null,
    access_level: user.accessLevel ?? null,
  };
}

/** Convert a database row (snake_case) back to UserAccount */
function rowToUser(row: Record<string, unknown>): UserAccount {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    role: row.role as 'aluno' | 'admin',
    password: row.password as string | undefined,
    studentCode: row.student_code as string | undefined,
    cpf: row.cpf as string | undefined,
    phone: row.phone as string | undefined,
    avatar: row.avatar as string | undefined,
    address: row.address as UserAccount['address'],
    certificateData: row.certificate_data as UserAccount['certificateData'],
    status: row.status as 'ativo' | 'inativo' | 'pendente',
    registeredAt: row.registered_at as string,
    lastAccess: row.last_access as string | undefined,
    enrolledCourseIds: (row.enrolled_course_ids as string[]) ?? [],
    completedCourseIds: (row.completed_course_ids as string[]) ?? [],
    jobTitle: (row.job_title as string) ?? (row.jobTitle as string) ?? undefined,
    department: (row.department as string) ?? undefined,
    accessLevel: (row.access_level as string) ?? (row.accessLevel as string) ?? undefined,
  };
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<UserAccount[] | null> {
  try {
    const res = await fetch('/api/platform-sync', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.users) && data.users.length > 0) {
        return data.users;
      }
    }
  } catch {}

  try {
    const saved = localStorage.getItem('deds_users_list');
    if (saved) return JSON.parse(saved);
  } catch {}

  return null;
}

export async function upsertUser(user: UserAccount): Promise<boolean> {
  try {
    const saved = localStorage.getItem('deds_users_list');
    const list: UserAccount[] = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    localStorage.setItem('deds_users_list', JSON.stringify(list));
    fetch('/api/platform-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'users', data: list }),
    }).catch(() => {});
    return true;
  } catch (err) {
    console.error('[UserService] upsertUser error:', err);
    return false;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const saved = localStorage.getItem('deds_users_list');
    if (saved) {
      const list: UserAccount[] = JSON.parse(saved);
      const filtered = list.filter((u) => u.id !== userId);
      localStorage.setItem('deds_users_list', JSON.stringify(filtered));
      fetch('/api/platform-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'users', data: filtered }),
      }).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error('[UserService] deleteUser error:', err);
    return false;
  }
}

// ─── Courses ────────────────────────────────────────────────────────────────

export async function fetchCourses(): Promise<Course[] | null> {
  try {
    const res = await fetch('/api/platform-sync', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.courses) && data.courses.length > 0) {
        return sanitizeCourseList(data.courses);
      }
    }
  } catch {}

  try {
    const saved = localStorage.getItem('deds_courses_list');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeCourseList(parsed);
      }
    }
  } catch {}

  return null;
}

export async function upsertCourse(course: Course): Promise<boolean> {
  try {
    const saved = localStorage.getItem('deds_courses_list');
    const list: Course[] = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex((c) => c.id === course.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...course };
    } else {
      list.push(course);
    }
    localStorage.setItem('deds_courses_list', JSON.stringify(list));
    fetch('/api/platform-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'courses', data: list }),
    }).catch(() => {});
    return true;
  } catch (err) {
    console.error('[CourseService] upsertCourse error:', err);
    return false;
  }
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  try {
    const saved = localStorage.getItem('deds_courses_list');
    if (saved) {
      const list: Course[] = JSON.parse(saved);
      const filtered = list.filter((c) => c.id !== courseId);
      localStorage.setItem('deds_courses_list', JSON.stringify(filtered));
      fetch('/api/platform-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'courses', data: filtered }),
      }).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error('[CourseService] deleteCourse error:', err);
    return false;
  }
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[] | null> {
  try {
    const res = await fetch('/api/platform-sync', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.categories) && data.categories.length > 0) {
        return data.categories;
      }
    }
  } catch {}

  try {
    const saved = localStorage.getItem('deds_categories_list');
    if (saved) return JSON.parse(saved);
  } catch {}

  return null;
}

export async function upsertCategories(categories: Category[]): Promise<boolean> {
  try {
    localStorage.setItem('deds_categories_list', JSON.stringify(categories));
    fetch('/api/platform-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'categories', data: categories }),
    }).catch(() => {});
    return true;
  } catch (err) {
    console.error('[CategoryService] upsertCategories error:', err);
    return false;
  }
}

// ─── Seed ───────────────────────────────────────────────────────────────────

/**
 * Verifica e sincroniza dados iniciais (servidor Hostinger já inicializa com platform-store.json)
 */
export async function seedIfEmpty(
  _initialUsers: UserAccount[],
  _initialCourses: Course[],
  _initialCategories: Category[]
): Promise<void> {
  // O servidor Hostinger garante a persistência via data/platform-store.json
  return Promise.resolve();
}
