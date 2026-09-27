import { supabase } from './supabaseClient';
import type { UserAccount, Course, Category } from '../types';

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
  };
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<UserAccount[] | null> {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('[Supabase] fetchUsers error:', error.message);
    return null;
  }
  return (data ?? []).map(rowToUser);
}

export async function upsertUser(user: UserAccount): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .upsert(userToRow(user), { onConflict: 'id' });
  if (error) {
    console.error('[Supabase] upsertUser error:', error.message);
    return false;
  }
  return true;
}

export async function deleteUser(userId: string): Promise<boolean> {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) {
    console.error('[Supabase] deleteUser error:', error.message);
    return false;
  }
  return true;
}

// ─── Courses ────────────────────────────────────────────────────────────────

export async function fetchCourses(): Promise<Course[] | null> {
  const { data, error } = await supabase.from('courses').select('*');
  if (error) {
    console.error('[Supabase] fetchCourses error:', error.message);
    return null;
  }
  return (data ?? []).map((row) => row.data as Course);
}

export async function upsertCourse(course: Course): Promise<boolean> {
  const { error } = await supabase
    .from('courses')
    .upsert({ id: course.id, data: course }, { onConflict: 'id' });
  if (error) {
    console.error('[Supabase] upsertCourse error:', error.message);
    return false;
  }
  return true;
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) {
    console.error('[Supabase] deleteCourse error:', error.message);
    return false;
  }
  return true;
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[] | null> {
  const { data, error } = await supabase.from('categories').select('*');
  if (error) {
    console.error('[Supabase] fetchCategories error:', error.message);
    return null;
  }
  return (data ?? []).map((row) => row.data as Category);
}

export async function upsertCategories(categories: Category[]): Promise<boolean> {
  const rows = categories.map((c) => ({ id: c.id, data: c }));
  const { error } = await supabase
    .from('categories')
    .upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('[Supabase] upsertCategories error:', error.message);
    return false;
  }
  return true;
}

// ─── Seed ───────────────────────────────────────────────────────────────────

/**
 * Seeds the database with initial data if tables are empty.
 * Called once on app startup.
 */
export async function seedIfEmpty(
  initialUsers: UserAccount[],
  initialCourses: Course[],
  initialCategories: Category[]
): Promise<void> {
  try {
    // Check if users table has data
    const { count: usersCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (usersCount === 0 || usersCount === null) {
      console.log('[Supabase] Seeding users...');
      const rows = initialUsers.map(userToRow);
      const { error } = await supabase.from('users').upsert(rows, { onConflict: 'id' });
      if (error) console.error('[Supabase] Seed users error:', error.message);
    }

    // Check if courses table has data
    const { count: coursesCount } = await supabase
      .from('courses')
      .select('id', { count: 'exact', head: true });

    if (coursesCount === 0 || coursesCount === null) {
      console.log('[Supabase] Seeding courses...');
      const rows = initialCourses.map((c) => ({ id: c.id, data: c }));
      const { error } = await supabase.from('courses').upsert(rows, { onConflict: 'id' });
      if (error) console.error('[Supabase] Seed courses error:', error.message);
    }

    // Check if categories table has data
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true });

    if (categoriesCount === 0 || categoriesCount === null) {
      console.log('[Supabase] Seeding categories...');
      const rows = initialCategories.map((c) => ({ id: c.id, data: c }));
      const { error } = await supabase.from('categories').upsert(rows, { onConflict: 'id' });
      if (error) console.error('[Supabase] Seed categories error:', error.message);
    }

    console.log('[Supabase] Seed check complete.');
  } catch (err) {
    console.error('[Supabase] seedIfEmpty unexpected error:', err);
  }
}
