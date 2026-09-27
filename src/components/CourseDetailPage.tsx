import React, { useState } from 'react';
import { Course, CourseModule, Lesson } from '../types';
import { getEffectiveCourseBadge } from '../utils/courseBadgeUtils';

interface CourseDetailPageProps {
  course: Course;
  onBackToHome: () => void;
  onAddToCart: (course: Course) => void;
  onBuyNow?: (course: Course) => void;
  isAdded: boolean;
  onOpenCertificateModal?: () => void;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({
  course,
  onBackToHome,
  onAddToCart,
  onBuyNow,
  isAdded,
  onOpenCertificateModal,
}) => {
  // Accordion state for modules
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (course.modules && course.modules.length > 0) {
      // First module expanded by default
      initial[course.modules[0].id || '0'] = true;
    }
    return initial;
  });

  const [activePreviewLesson, setActivePreviewLesson] = useState<Lesson | null>(null);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const effectiveBadge = getEffectiveCourseBadge(course);
  const totalLessons =
    course.modules && course.modules.length > 0
      ? course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
      : course.lessonsCount || 80;

  const discountAmount = Math.max(0, course.originalPrice - course.currentPrice);
  const discountPercent = course.originalPrice > 0
    ? Math.round((discountAmount / course.originalPrice) * 100)
    : 0;

  return (
    <div className="w-full min-h-screen bg-surface-base text-text-primary flex flex-col pb-24 lg:pb-16 animate-in fade-in duration-300">
      {/* =========================================================================
          1. TOP NAVIGATION BAR (← Voltar para a Home + Breadcrumb)
         ========================================================================= */}
      <div className="sticky top-16 sm:top-20 z-30 w-full bg-surface-raised/95 backdrop-blur-md border-b border-border-subtle shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Back to Home Button */}
          <button
            type="button"
            onClick={onBackToHome}
            className="group px-4 py-2 rounded-xl bg-surface-overlay hover:bg-surface-base border border-border-subtle hover:border-primary/40 text-xs sm:text-sm font-bold text-text-secondary hover:text-primary transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            id="btn-back-to-home"
          >
            <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            <span>Voltar para a Home</span>
          </button>

          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-xs text-text-tertiary">
            <button
              type="button"
              onClick={onBackToHome}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Início
            </button>
            <span>/</span>
            <span className="hover:text-text-secondary transition-colors">Cursos</span>
            <span>/</span>
            <span className="text-text-secondary font-medium">{course.category}</span>
            <span>/</span>
            <span className="text-primary font-bold truncate max-w-[240px]">{course.title}</span>
          </nav>

          {/* Quick action: Certificate check */}
          {onOpenCertificateModal && (
            <button
              type="button"
              onClick={onOpenCertificateModal}
              className="hidden lg:flex items-center gap-1.5 text-xs text-accent-emerald-bright hover:underline cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>Validar Certificado Deds Academy</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. COURSE HERO SECTION (FULL WIDTH)
         ========================================================================= */}
      <section className="relative w-full bg-gradient-to-b from-surface-raised via-surface-base to-surface-base border-b border-border-subtle py-8 lg:py-12 overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-accent-emerald-bright/5 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2.5">
                {effectiveBadge && (
                  <span className="px-3 py-1 rounded-lg bg-primary-container text-on-primary font-bold text-xs shadow-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">local_fire_department</span>
                    {effectiveBadge.text}
                  </span>
                )}
                <span className="px-3 py-1 rounded-lg bg-surface-overlay border border-border-subtle text-text-secondary font-bold text-xs uppercase tracking-wider">
                  {course.category}
                </span>
                {course.level && (
                  <span className="px-3 py-1 rounded-lg bg-surface-overlay border border-border-subtle text-primary font-bold text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">signal_cellular_alt</span>
                    Nível: {course.level}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Válido Lei 9.394/96
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-text-primary leading-tight tracking-tight">
                {course.title}
              </h1>

              {/* Course Subtitle or short pitch */}
              <p className="text-sm sm:text-base lg:text-lg text-text-secondary leading-relaxed max-w-3xl">
                {course.description ||
                  'Domine as melhores práticas, técnicas avançadas e metodologias com aplicação direta no mercado de trabalho. Formação completa com certificado reconhecido em todo território nacional.'}
              </p>

              {/* Meta information row (Instructor, Rating, Hours, Students) */}
              <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-xs sm:text-sm text-text-secondary pt-2 border-t border-border-subtle/60">
                {/* Instructor */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs">
                    {course.instructor.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[11px] text-text-tertiary block leading-none">Criado por</span>
                    <span className="font-bold text-text-primary">{course.instructor}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-accent-gold">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className="material-symbols-outlined text-base"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <span className="font-bold text-text-primary">{course.rating.toFixed(1)}</span>
                  <span className="text-text-tertiary text-xs">({course.reviewsCount} avaliações)</span>
                </div>

                {/* Hours */}
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">schedule</span>
                  <span className="font-medium text-text-primary">{course.hours} horas complementares</span>
                </div>

                {/* Lessons */}
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">play_lesson</span>
                  <span className="font-medium text-text-primary">{totalLessons} videoaulas</span>
                </div>
              </div>
            </div>

            {/* Right Hero Preview Media on large screens */}
            <div className="lg:col-span-4">
              <div className="relative rounded-2xl overflow-hidden bg-surface-raised border border-border-subtle shadow-xl group">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center justify-between text-white text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-accent-emerald-bright">workspace_premium</span>
                      Certificado Incluso
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-primary text-on-primary font-bold">
                      Acesso Imediato
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. MAIN CONTENT: 2-COLUMN RESPONSIVE LAYOUT (DETAILS + SIDEBAR)
         ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* -------------------------------------------------------------
              LEFT COLUMN: Course Syllabus, Video, Description, Highlights (8 Cols)
             ------------------------------------------------------------- */}
          <div className="lg:col-span-8 space-y-8">
            {/* Video Player Presentation (If available) */}
            {course.videoUrl && (
              <div className="p-5 sm:p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-primary text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      play_circle
                    </span>
                    <span>Vídeo de Apresentação do Curso</span>
                  </h3>
                  {course.videoFileName && (
                    <span className="text-xs text-text-tertiary truncate max-w-[200px]">
                      {course.videoFileName}
                    </span>
                  )}
                </div>

                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-border-subtle shadow-md">
                  {course.videoUrl.includes('youtube.com') || course.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={
                        course.videoUrl.includes('watch?v=')
                          ? course.videoUrl.replace('watch?v=', 'embed/')
                          : course.videoUrl.replace('youtu.be/', 'youtube.com/embed/')
                      }
                      title={`Trailer ${course.title}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={course.videoUrl}
                      controls
                      className="w-full h-full object-contain"
                      poster={course.image}
                    >
                      Seu navegador não suporta a reprodução de vídeo.
                    </video>
                  )}
                </div>
                <p className="text-xs text-text-tertiary">
                  Assista à apresentação do instrutor para conhecer a metodologia, ferramentas e projetos desenvolvidos ao longo das aulas.
                </p>
              </div>
            )}

            {/* Key Course Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface-raised border border-border-subtle shadow-xs text-center">
              <div className="p-2">
                <span className="text-xs text-text-tertiary block">Avaliação Média</span>
                <div className="flex items-center justify-center gap-1 text-accent-gold font-bold text-base mt-1">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span>{course.rating.toFixed(1)}</span>
                </div>
                <span className="text-[11px] text-text-tertiary">Nota máxima de 5.0</span>
              </div>

              <div className="p-2 border-l border-border-subtle/60">
                <span className="text-xs text-text-tertiary block">Carga Horária</span>
                <span className="text-base font-bold text-text-primary block mt-1">{course.hours} Horas</span>
                <span className="text-[11px] text-accent-emerald-bright font-medium">Válida para Faculdades</span>
              </div>

              <div className="p-2 border-l border-border-subtle/60">
                <span className="text-xs text-text-tertiary block">Total de Aulas</span>
                <span className="text-base font-bold text-text-primary block mt-1">{totalLessons} Aulas</span>
                <span className="text-[11px] text-text-tertiary">Passo a passo</span>
              </div>

              <div className="p-2 border-l border-border-subtle/60">
                <span className="text-xs text-text-tertiary block">Certificado</span>
                <span className="text-base font-bold text-accent-emerald-bright block mt-1">Digital Autêntico</span>
                <span className="text-[11px] text-text-tertiary">Com QR Code</span>
              </div>
            </div>

            {/* What you will learn / Key competencies */}
            <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                <span>O Que Você Vai Aprender Nesta Formação</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {[
                  'Metodologia prática e estruturada orientada a demandas reais do mercado de trabalho.',
                  'Exercícios aplicados passo a passo com arquivos de apoio para download imediato.',
                  'Técnicas modernas e boas práticas para aumentar sua produtividade profissional.',
                  'Avaliações formativas e quizzes de fixação para garantir o aprendizado consistente.',
                  'Certificado de conclusão digital com autenticação e validação pública por QR Code.',
                  'Acesso a materiais de apoio, apostilas e modelos prontos para utilização profissional.',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-overlay border border-border-subtle">
                    <span className="material-symbols-outlined text-accent-emerald-bright text-base shrink-0 mt-0.5">
                      task_alt
                    </span>
                    <span className="text-xs sm:text-sm text-text-secondary leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Syllabus / Modules & Lessons Structure */}
            <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">auto_stories</span>
                    <span>Conteúdo &amp; Estrutura dos Módulos</span>
                  </h3>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Explore a programação detalhada de aulas e materiais do curso
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-secondary bg-surface-overlay px-3 py-1 rounded-full border border-border-subtle">
                    {course.modules?.length || 1} {(course.modules?.length || 1) === 1 ? 'módulo' : 'módulos'}
                  </span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    {totalLessons} aulas
                  </span>
                </div>
              </div>

              {/* Modules Accordion List */}
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-3">
                  {course.modules.map((mod: CourseModule, modIdx: number) => {
                    const isExpanded = expandedModules[mod.id || `${modIdx}`];
                    return (
                      <div
                        key={mod.id || modIdx}
                        className="rounded-xl border border-border-subtle bg-surface-overlay overflow-hidden transition-all"
                      >
                        {/* Module Accordion Header */}
                        <button
                          type="button"
                          onClick={() => toggleModule(mod.id || `${modIdx}`)}
                          className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-surface-raised/80 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                              {modIdx + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-text-primary leading-tight">
                                {mod.title}
                              </h4>
                              {mod.description && (
                                <p className="text-xs text-text-tertiary line-clamp-1 mt-0.5">
                                  {mod.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-text-tertiary hidden sm:inline">
                              {mod.lessons.length} {mod.lessons.length === 1 ? 'aula' : 'aulas'}
                            </span>
                            {mod.quiz && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Quiz
                              </span>
                            )}
                            <span
                              className={`material-symbols-outlined text-text-secondary text-base transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            >
                              expand_more
                            </span>
                          </div>
                        </button>

                        {/* Module Lessons List */}
                        {isExpanded && (
                          <div className="p-3 pt-0 border-t border-border-subtle/50 space-y-2 bg-surface-raised/40">
                            {mod.lessons && mod.lessons.length > 0 ? (
                              mod.lessons.map((lesson: Lesson, lesIdx: number) => (
                                <div
                                  key={lesson.id || lesIdx}
                                  className="p-3 rounded-lg bg-surface-raised border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-primary/30 transition-colors"
                                >
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <span
                                      className={`material-symbols-outlined text-base shrink-0 mt-0.5 ${
                                        lesson.isFreePreview ? 'text-accent-emerald-bright' : 'text-primary'
                                      }`}
                                    >
                                      {lesson.isFreePreview ? 'lock_open' : 'play_circle'}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-text-primary">
                                          {lesson.title}
                                        </span>
                                        {lesson.isFreePreview && (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30">
                                            Degustação Gratuita
                                          </span>
                                        )}
                                      </div>
                                      {lesson.description && (
                                        <p className="text-[11px] text-text-tertiary line-clamp-1 mt-0.5">
                                          {lesson.description.replace(/[#*`_]/g, '')}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-[11px]">
                                    {lesson.attachments && lesson.attachments.length > 0 && (
                                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">attachment</span>
                                        {lesson.attachments.length} {lesson.attachments.length === 1 ? 'material' : 'materiais'}
                                      </span>
                                    )}

                                    {lesson.quiz && (
                                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">quiz</span>
                                        Quiz
                                      </span>
                                    )}

                                    {lesson.duration && (
                                      <span className="px-2 py-0.5 rounded bg-surface-overlay text-text-tertiary font-mono">
                                        {lesson.duration}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-text-tertiary py-2 text-center">
                                Aulas deste módulo em preparação pelo instrutor.
                              </p>
                            )}

                            {/* Module Quiz Card if exists */}
                            {mod.quiz && (
                              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-amber-400 text-base">
                                    quiz
                                  </span>
                                  <div>
                                    <span className="font-bold text-text-primary block">
                                      {mod.quiz.title || `Quiz Avaliativo - ${mod.title}`}
                                    </span>
                                    <span className="text-[11px] text-text-tertiary">
                                      {mod.quiz.questions?.length || 5} questões com nota de corte para aprovação
                                    </span>
                                  </div>
                                </div>
                                <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-400 font-bold text-[10px]">
                                  Avaliação do Módulo
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : course.syllabus && course.syllabus.length > 0 ? (
                <div className="space-y-2">
                  {course.syllabus.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-surface-overlay border border-border-subtle flex items-center justify-between text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-text-primary">{item}</span>
                      </div>
                      <span className="material-symbols-outlined text-text-tertiary text-base">
                        play_circle
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary py-4 text-center">
                  O conteúdo completo deste treinamento está sendo estruturado pelo instrutor.
                </p>
              )}
            </div>

            {/* Official Certification Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-raised via-surface-raised to-primary/5 border border-primary/20 shadow-sm flex flex-col sm:flex-row items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-4xl">workspace_premium</span>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <h4 className="text-base font-bold text-text-primary">
                  Certificado de Conclusão com Validade Nacional
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Emitido automaticamente ao concluir as aulas e atingir a pontuação mínima na prova final.
                  Válido para horas complementares em faculdades, concursos públicos e enriquecimento de currículo (Lei Federal 9.394/96).
                </p>
              </div>

              {onOpenCertificateModal && (
                <button
                  type="button"
                  onClick={onOpenCertificateModal}
                  className="px-4 py-2 rounded-xl bg-surface-overlay hover:bg-surface-base border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary transition-colors shrink-0 cursor-pointer"
                >
                  Consultar Autenticidade
                </button>
              )}
            </div>

            {/* Instructor Profile Card */}
            <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">school</span>
                <span>Instrutor Responsável</span>
              </h3>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent-emerald-bright/30 text-primary border border-primary/30 flex items-center justify-center text-xl font-bold shrink-0">
                  {course.instructor.charAt(0)}
                </div>

                <div className="space-y-1.5 flex-1">
                  <h4 className="text-base font-bold text-text-primary">{course.instructor}</h4>
                  <p className="text-xs text-accent-emerald-bright font-medium">
                    {course.instructorRole || 'Especialista e Instrutor Sênior na Deds Academy'}
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Profissional com ampla experiência prática no mercado, dedicado a transmitir conhecimento por meio de didática transparente, objetiva e focada na resolução de problemas do mundo real.
                  </p>

                  <div className="flex items-center gap-4 text-xs text-text-tertiary pt-2">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-accent-gold text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {course.rating.toFixed(1)} Avaliação
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-sm">group</span>
                      {course.reviewsCount * 12}+ Alunos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------
              RIGHT COLUMN: Sticky Purchase Card & Included Benefits (4 Cols)
             ------------------------------------------------------------- */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            {/* Purchase Card */}
            <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-xl space-y-6 relative overflow-hidden">
              {/* Top Accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent-emerald-bright to-primary" />

              {/* Price Tag Box */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-tertiary line-through font-mono">
                    De R$ {course.originalPrice.toFixed(2).replace('.', ',')}
                  </span>
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-status-danger/15 text-status-danger border border-status-danger/25">
                      -{discountPercent}% OFF
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-bold text-text-secondary">Por</span>
                  <span className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
                    R$ {course.currentPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <p className="text-xs text-accent-emerald-bright font-bold">
                  ou em até 12x de R$ {(course.currentPrice / 12).toFixed(2).replace('.', ',')} no cartão
                </p>
                <p className="text-[11px] text-text-tertiary">
                  ⚡ Pagamento à vista com desconto especial no Pix
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2.5">
                {/* Primary Button: Adicionar ao Carrinho */}
                <button
                  type="button"
                  onClick={() => onAddToCart(course)}
                  className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                    isAdded
                      ? 'bg-primary text-on-primary ring-2 ring-primary/40'
                      : 'bg-primary-container hover:bg-accent-emerald-bright text-on-primary shadow-[0_0_20px_-3px_rgba(0,176,116,0.4)] hover:shadow-lg'
                  }`}
                  id="btn-add-to-cart-page"
                >
                  <span className="material-symbols-outlined text-lg">
                    {isAdded ? 'check' : 'shopping_cart'}
                  </span>
                  <span>{isAdded ? 'Adicionado ao Carrinho' : 'Adicionar ao Carrinho'}</span>
                </button>

                {/* Direct Checkout Button */}
                {onBuyNow && (
                  <button
                    type="button"
                    onClick={() => onBuyNow(course)}
                    className="w-full py-3 px-5 rounded-xl font-bold text-xs bg-surface-overlay hover:bg-surface-base border border-border-subtle hover:border-primary text-text-primary hover:text-primary transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    id="btn-buy-now-page"
                  >
                    <span className="material-symbols-outlined text-base">flash_on</span>
                    <span>Comprar Agora (Checkout Rápido)</span>
                  </button>
                )}
              </div>

              {/* Security Badges Notice */}
              <div className="pt-2 border-t border-border-subtle/70 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                  <span className="material-symbols-outlined text-accent-emerald-bright text-base">lock</span>
                  <span>Compra 100% segura com criptografia SSL</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                  <span className="material-symbols-outlined text-primary text-base">bolt</span>
                  <span>Acesso imediato liberado após o pagamento</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                  <span className="material-symbols-outlined text-accent-gold text-base">verified_user</span>
                  <span>Garantia incondicional de 7 dias com devolução total</span>
                </div>
              </div>

              {/* Benefits Checklist */}
              <div className="pt-4 border-t border-border-subtle space-y-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Este Curso Inclui:
                </h4>

                <ul className="space-y-2.5 text-xs text-text-secondary">
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-base shrink-0">
                      verified
                    </span>
                    <span>Certificado com QR Code e autenticação</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-base shrink-0">
                      all_inclusive
                    </span>
                    <span>Acesso vitalício e ilimitado aos materiais</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-base shrink-0">
                      forum
                    </span>
                    <span>Comunidade exclusiva e suporte com o instrutor</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-base shrink-0">
                      folder_zip
                    </span>
                    <span>Arquivos de exercícios e planilhas para download</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-base shrink-0">
                      devices
                    </span>
                    <span>Acesso no computador, tablet e celular</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-base shrink-0">
                      fact_check
                    </span>
                    <span>Quizzes avaliativos e prova de certificação</span>
                  </li>
                </ul>
              </div>

              {/* Back to Home Link in Sidebar */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="text-xs text-text-tertiary hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">arrow_back</span>
                  <span>Ver todos os outros cursos disponíveis</span>
                </button>
              </div>
            </div>

            {/* 7-Day Guarantee Badge Box */}
            <div className="p-4 rounded-2xl bg-surface-overlay border border-border-subtle flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent-emerald-bright/10 text-accent-emerald-bright border border-accent-emerald-bright/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">shield</span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-text-primary">Garantia Incondicional de 7 Dias</h5>
                <p className="text-[11px] text-text-tertiary leading-snug">
                  Se em até 7 dias você não estiver satisfeito com o curso, devolvemos 100% do valor pago sem burocracia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. MOBILE STICKY BOTTOM ACTION BAR (FOR SCREENS < LG)
         ========================================================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-raised/95 backdrop-blur-md border-t border-border-subtle p-3.5 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-text-tertiary line-through block">
            De R$ {course.originalPrice.toFixed(2).replace('.', ',')}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-text-secondary">Por</span>
            <span className="text-lg font-black text-text-primary">
              R$ {course.currentPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="p-2.5 rounded-xl bg-surface-overlay border border-border-subtle text-text-secondary hover:text-text-primary cursor-pointer"
            title="Voltar para a Home"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>

          <button
            type="button"
            onClick={() => onAddToCart(course)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md ${
              isAdded
                ? 'bg-primary text-on-primary'
                : 'bg-primary-container text-on-primary shadow-primary/20'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {isAdded ? 'check' : 'shopping_cart'}
            </span>
            <span>{isAdded ? 'No Carrinho' : 'Adicionar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
