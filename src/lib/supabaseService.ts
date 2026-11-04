import { supabase } from './supabaseClient';
import type { UserAccount, Course, Category, StudentProgress } from '../types';
import { sanitizeCourse, sanitizeCourseList } from './cacheManager';

// ─── Helpers: User ──────────────────────────────────────────────────────────

/** Convert a UserAccount to database row format (snake_case) */
export function userToRow(user: UserAccount) {
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
    updated_at: new Date().toISOString(),
  };
}

/** Convert a database row (snake_case) back to UserAccount */
export function rowToUser(row: Record<string, any>): UserAccount {
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
    jobTitle: (row.job_title as string) ?? undefined,
    department: (row.department as string) ?? undefined,
    accessLevel: (row.access_level as string) ?? undefined,
  };
}

// ─── Helpers: Course ────────────────────────────────────────────────────────

/** Convert a Course to database row format */
export function courseToRow(course: Course) {
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

/** Convert a database row to Course */
export function rowToCourse(row: Record<string, any>): Course {
  return sanitizeCourse({
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
    badge: row.badge ?? { text: 'Novo', variant: 'emerald' },
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
  });
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<UserAccount[] | null> {
  // 1. Consulta prioritária no Supabase
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      const users = data.map(rowToUser);
      try {
        localStorage.setItem('deds_users_list', JSON.stringify(users));
      } catch {}
      return users;
    }
  } catch (err) {
    console.warn('[SupabaseService] Erro ao buscar usuários no Supabase:', err);
  }

  // 2. Fallback no servidor local
  try {
    const res = await fetch('/api/platform-sync', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.users) && data.users.length > 0) {
        return data.users;
      }
    }
  } catch {}

  // 3. Fallback no cache local
  try {
    const saved = localStorage.getItem('deds_users_list');
    if (saved) return JSON.parse(saved);
  } catch {}

  return null;
}

export async function upsertUser(user: UserAccount): Promise<boolean> {
  // 1. Atualiza cache local instantâneo
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

    // Notifica servidor local de backup
    fetch('/api/platform-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'users', data: list }),
    }).catch(() => {});
  } catch {}

  // 2. Grava na nuvem Supabase em tempo real
  try {
    const row = userToRow(user);
    const { error } = await supabase.from('users').upsert(row);
    if (error) {
      console.error('[SupabaseService] Falha ao persistir usuário no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[SupabaseService] upsertUser erro:', err);
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

    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
      console.error('[SupabaseService] Falha ao excluir usuário do Supabase:', error.message);
    }
    return true;
  } catch (err) {
    console.error('[SupabaseService] deleteUser erro:', err);
    return false;
  }
}

// ─── Courses ────────────────────────────────────────────────────────────────

export async function fetchCourses(): Promise<Course[] | null> {
  // 1. Consulta prioritária no Supabase
  try {
    const { data, error } = await supabase.from('courses').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      const courses = data.map(rowToCourse);
      const sanitized = sanitizeCourseList(courses);
      try {
        localStorage.setItem('deds_courses_list', JSON.stringify(sanitized));
      } catch {}
      return sanitized;
    }
  } catch (err) {
    console.warn('[SupabaseService] Erro ao buscar cursos no Supabase:', err);
  }

  // 2. Fallback no servidor local
  try {
    const res = await fetch('/api/platform-sync', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.courses) && data.courses.length > 0) {
        return sanitizeCourseList(data.courses);
      }
    }
  } catch {}

  // 3. Fallback no cache local
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
  // 1. Atualiza cache local instantâneo
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

    // Notifica servidor local de backup
    fetch('/api/platform-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'courses', data: list }),
    }).catch(() => {});
  } catch {}

  // 2. Grava na nuvem Supabase em tempo real
  try {
    const row = courseToRow(course);
    const { error } = await supabase.from('courses').upsert(row);
    if (error) {
      console.error('[SupabaseService] Falha ao persistir curso no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[SupabaseService] upsertCourse erro:', err);
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

    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) {
      console.error('[SupabaseService] Falha ao excluir curso do Supabase:', error.message);
    }
    return true;
  } catch (err) {
    console.error('[SupabaseService] deleteCourse erro:', err);
    return false;
  }
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[] | null> {
  // 1. Consulta prioritária no Supabase
  try {
    const { data, error } = await supabase.from('categories').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      const categories: Category[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        courseCount: Number(c.course_count) || 0,
        icon: c.icon || 'folder',
      }));
      try {
        localStorage.setItem('deds_categories_list', JSON.stringify(categories));
      } catch {}
      return categories;
    }
  } catch (err) {
    console.warn('[SupabaseService] Erro ao buscar categorias no Supabase:', err);
  }

  // 2. Fallback no servidor local
  try {
    const res = await fetch('/api/platform-sync', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.categories) && data.categories.length > 0) {
        return data.categories;
      }
    }
  } catch {}

  // 3. Fallback no cache local
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

    const rows = categories.map((c) => ({
      id: c.id,
      name: c.name,
      course_count: c.courseCount,
      icon: c.icon,
    }));
    const { error } = await supabase.from('categories').upsert(rows);
    if (error) {
      console.warn('[SupabaseService] Falha ao salvar categorias no Supabase:', error.message);
    }
    return true;
  } catch (err) {
    console.error('[CategoryService] upsertCategories erro:', err);
    return false;
  }
}

// ─── Student Progress ───────────────────────────────────────────────────────

export async function fetchStudentProgressFromDB(userId: string): Promise<Record<string, StudentProgress> | null> {
  try {
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('user_id', userId);

    if (!error && Array.isArray(data) && data.length > 0) {
      const map: Record<string, StudentProgress> = {};
      data.forEach((row: any) => {
        map[row.course_id] = {
          courseId: row.course_id,
          percent: Number(row.percent) || 0,
          completedLessons: Number(row.completed_lessons) || 0,
          totalLessons: Number(row.total_lessons) || 0,
          lastLessonTitle: row.last_lesson_title || '',
          lastAccessed: row.last_accessed || '',
          completionDate: row.completion_date || undefined,
          rating: row.rating ? Number(row.rating) : undefined,
          reviewComment: row.review_comment || undefined,
          completedLessonIds: Array.isArray(row.completed_lesson_ids) ? row.completed_lesson_ids : [],
        };
      });
      return map;
    }
  } catch (err) {
    console.warn('[SupabaseService] Erro ao buscar progresso no Supabase:', err);
  }
  return null;
}

export async function saveStudentProgressToDB(userId: string, courseId: string, progress: StudentProgress): Promise<boolean> {
  try {
    const row = {
      user_id: userId,
      course_id: courseId,
      percent: progress.percent,
      completed_lessons: progress.completedLessons,
      total_lessons: progress.totalLessons,
      last_lesson_title: progress.lastLessonTitle,
      last_accessed: progress.lastAccessed,
      completion_date: progress.completionDate || null,
      rating: progress.rating || null,
      review_comment: progress.reviewComment || null,
      completed_lesson_ids: progress.completedLessonIds || [],
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('student_progress').upsert(row, { onConflict: 'user_id,course_id' });
    if (error) {
      console.warn('[SupabaseService] Erro ao salvar progresso no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[SupabaseService] Erro ao salvar progresso:', err);
    return false;
  }
}

// ─── Seed ───────────────────────────────────────────────────────────────────

export async function seedIfEmpty(
  _initialUsers: UserAccount[],
  _initialCourses: Course[],
  _initialCategories: Category[]
): Promise<void> {
  // A persistência já está conectada e os dados iniciais provisionados no Supabase.
  return Promise.resolve();
}
