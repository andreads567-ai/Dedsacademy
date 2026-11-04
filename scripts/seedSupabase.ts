import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://berjxxsglkwtciiltvri.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlcmp4eHNnbGt3dGNpaWx0dnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2ODEwOTQsImV4cCI6MjEwOTI1NzA5NH0.L3DF85lkE3ec-A3D1fPt4QsFXj6r3Xxmrw1awUq2xeE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log('--- Iniciando Sincronização do Supabase Deds Academy ---');
  console.log('Supabase URL:', supabaseUrl);

  const storeFile = path.resolve('data', 'platform-store.json');
  if (!fs.existsSync(storeFile)) {
    console.error('Arquivo platform-store.json não encontrado!');
    process.exit(1);
  }

  const raw = fs.readFileSync(storeFile, 'utf8');
  const store = JSON.parse(raw);

  // 1. Categorias
  if (Array.isArray(store.categories) && store.categories.length > 0) {
    console.log(`Sincronizando ${store.categories.length} categorias...`);
    const catRows = store.categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      course_count: c.courseCount || 0,
      icon: c.icon || null,
    }));
    const { error: catErr } = await supabase.from('categories').upsert(catRows);
    if (catErr) {
      console.error('Erro ao sincronizar categorias:', catErr);
    } else {
      console.log('Categorias sincronizadas com sucesso.');
    }
  }

  // 2. Cursos
  if (Array.isArray(store.courses) && store.courses.length > 0) {
    console.log(`Sincronizando ${store.courses.length} cursos...`);
    const courseRows = store.courses.map((c: any) => ({
      id: c.id,
      title: c.title,
      instructor: c.instructor,
      instructor_role: c.instructorRole || null,
      instructor_avatar: c.instructorAvatar || null,
      category: c.category,
      level: c.level || 'Todos os Níveis',
      rating: Number(c.rating) || 5.0,
      reviews_count: Number(c.reviewsCount) || 0,
      students_count: Number(c.studentsCount) || 0,
      hours: Number(c.hours) || 40,
      lessons_count: Number(c.lessonsCount) || 0,
      original_price: Number(c.originalPrice) || 0,
      current_price: Number(c.currentPrice) || 0,
      image: c.image,
      image_file_name: c.imageFileName || null,
      banner_image: c.bannerImage || null,
      banner_file_name: c.bannerFileName || null,
      badge: c.badge || null,
      filter_tags: Array.isArray(c.filterTags) ? c.filterTags : [],
      description: c.description || '',
      syllabus: Array.isArray(c.syllabus) ? c.syllabus : [],
      modules: Array.isArray(c.modules) ? c.modules : [],
      status: c.status || 'publicado',
      is_auto_launch_badge: Boolean(c.isAutoLaunchBadge),
      video_url: c.videoUrl || null,
      video_file_name: c.videoFileName || null,
      video_type: c.videoType || null,
      final_exam: c.finalExam || null,
    }));
    const { error: courseErr } = await supabase.from('courses').upsert(courseRows);
    if (courseErr) {
      console.error('Erro ao sincronizar cursos:', courseErr);
    } else {
      console.log('Cursos sincronizados com sucesso.');
    }
  }

  // 3. Usuários
  if (Array.isArray(store.users) && store.users.length > 0) {
    console.log(`Sincronizando ${store.users.length} usuários...`);
    const userRows = store.users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'aluno',
      password: u.password || null,
      student_code: u.studentCode || null,
      cpf: u.cpf || null,
      phone: u.phone || null,
      avatar: u.avatar || null,
      address: u.address || null,
      certificate_data: u.certificateData || null,
      status: u.status || 'ativo',
      registered_at: u.registeredAt || null,
      last_access: u.lastAccess || null,
      enrolled_course_ids: Array.isArray(u.enrolledCourseIds) ? u.enrolledCourseIds : [],
      completed_course_ids: Array.isArray(u.completedCourseIds) ? u.completedCourseIds : [],
      job_title: u.jobTitle || null,
      department: u.department || null,
      access_level: u.accessLevel || null,
    }));
    const { error: userErr } = await supabase.from('users').upsert(userRows);
    if (userErr) {
      console.error('Erro ao sincronizar usuários:', userErr);
    } else {
      console.log('Usuários sincronizados com sucesso.');
    }
  }

  // 4. Certificados
  if (Array.isArray(store.certificates) && store.certificates.length > 0) {
    console.log(`Sincronizando ${store.certificates.length} certificados...`);
    const certRows = store.certificates.map((cert: any) => ({
      id: cert.id,
      code: cert.code,
      course_id: cert.courseId,
      course_title: cert.courseTitle,
      course_category: cert.courseCategory || null,
      student_id: cert.studentId || '',
      student_code: cert.studentCode || null,
      student_name: cert.studentName,
      student_cpf: cert.studentCpf || null,
      hours: Number(cert.hours) || 40,
      issue_date: cert.issueDate,
      instructor: cert.instructor || 'Deds Academy',
      status: cert.status || 'valido',
      cancellation_reason: cert.cancellationReason || null,
      institution_cnpj: cert.institutionCnpj || null,
      metadata: {
        cancelledAt: cert.cancelledAt || null,
        institutionCnpj: cert.institutionCnpj || null,
      },
    }));
    const { error: certErr } = await supabase.from('certificates').upsert(certRows);
    if (certErr) {
      console.error('Erro ao sincronizar certificados:', certErr);
    } else {
      console.log('Certificados sincronizados com sucesso.');
    }
  }

  // 5. Configurações da Plataforma
  console.log('Sincronizando platform_settings...');
  const settingsRow = {
    id: 'general',
    hero_banner: store.heroBanner || null,
    middle_banner: store.middleBanner || null,
    checkout_banner: store.checkoutBanner || null,
    student_banners: store.studentBanners || null,
    coupons: Array.isArray(store.coupons) ? store.coupons : [],
    campaigns: Array.isArray(store.campaigns) ? store.campaigns : [],
    announcements: Array.isArray(store.announcements) ? store.announcements : [],
    support_whatsapp: '5511999999999',
    updated_at: new Date().toISOString(),
  };
  const { error: setErr } = await supabase.from('platform_settings').upsert(settingsRow);
  if (setErr) {
    console.error('Erro ao sincronizar platform_settings:', setErr);
  } else {
    console.log('platform_settings sincronizado com sucesso.');
  }

  console.log('--- Sincronização Finalizada com Sucesso! ---');
}

runSeed().catch(console.error);
