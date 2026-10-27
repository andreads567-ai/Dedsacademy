import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Course, CourseModule, Lesson, LessonAttachment, LessonQuiz, CourseReview, StudentProgress, UserAccount } from '../types';
import { downloadCertificatePdf, downloadCertificatePng } from '../utils/certificateGenerator';

interface StudentCoursePlayerModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteLesson: (courseId: string, lessonId: string, lessonTitle: string) => void;
  progress?: StudentProgress;
  currentUser?: UserAccount | null;
  onSubmitReview?: (review: CourseReview) => void;
  onOpenCertificateModal?: () => void;
}

export const StudentCoursePlayerModal: React.FC<StudentCoursePlayerModalProps> = ({
  course,
  isOpen,
  onClose,
  onCompleteLesson,
  progress,
  currentUser,
  onSubmitReview,
  onOpenCertificateModal,
}) => {
  if (!isOpen || !course) return null;

  // 1. Synthesize structured modules & lessons if course only has legacy syllabus
  const modules: CourseModule[] = useMemo(() => {
    if (course.modules && course.modules.length > 0) {
      return course.modules;
    }
    if (course.syllabus && course.syllabus.length > 0) {
      return course.syllabus.map((topic, idx) => ({
        id: `mod-${course.id}-${idx}`,
        title: topic.includes(':') ? topic.split(':')[0].trim() : `Módulo ${idx + 1}`,
        description: topic.includes(':') ? topic.split(':')[1].trim() : topic,
        lessons: [
          {
            id: `lesson-${course.id}-${idx}-1`,
            title: topic.includes(':') ? topic.split(':')[1].trim() : topic,
            description: `Seja bem-vindo(a) a esta etapa essencial do curso "${course.title}".\n\nNesta aula dedicada a "${topic}", abordamos os principais conceitos técnicos, metodologias consolidadas no mercado e boas práticas de execução.\n\nOrientações de Estudo:\n1. Leia com atenção todas as diretrizes teóricas e práticas apresentadas abaixo.\n2. Revise os materiais complementares e arquivos de apoio disponibilizados.\n3. Após a leitura completa até o final deste documento, o botão de conclusão será habilitado automaticamente para liberar o seu próximo passo no treinamento.`,
            duration: '20 min',
            attachments: [],
          },
        ],
      }));
    }
    return [
      {
        id: `mod-${course.id}-0`,
        title: 'Módulo 1: Fundamentos & Apresentação',
        description: 'Visão geral da formação',
        lessons: [
          {
            id: `lesson-${course.id}-0-1`,
            title: 'Aula 1: Introdução & Metodologia',
            description: course.description || 'Apresentação detalhada da formação com visão holística do aprendizado.',
            duration: '15 min',
            attachments: [],
          },
        ],
      },
    ];
  }, [course]);

  // Flatten all lessons into a continuous sequential list
  const allLessons = useMemo(() => {
    const list: Array<Lesson & { moduleId: string; moduleTitle: string; globalIndex: number }> = [];
    modules.forEach((mod) => {
      mod.lessons.forEach((les) => {
        list.push({
          ...les,
          moduleId: mod.id,
          moduleTitle: mod.title,
          globalIndex: list.length,
        });
      });
    });
    return list;
  }, [modules]);

  const totalLessonsCount = allLessons.length;

  // 2. Track completed lesson IDs for strictly sequential locking
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    if (progress?.completedLessonIds && progress.completedLessonIds.length > 0) {
      return progress.completedLessonIds;
    }
    const count = progress?.completedLessons || 0;
    return allLessons.slice(0, count).map((l) => l.id);
  });

  // Calculate current unlocked index
  const firstUnfinishedLesson = allLessons.find((l) => !completedLessonIds.includes(l.id));
  const defaultLessonId = firstUnfinishedLesson ? firstUnfinishedLesson.id : allLessons[0]?.id || '';
  const defaultModuleId = firstUnfinishedLesson ? firstUnfinishedLesson.moduleId : modules[0]?.id || '';

  // Active module and lesson states
  const [selectedModuleId, setSelectedModuleId] = useState<string>(defaultModuleId);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(defaultLessonId);

  // Module folders accordion state (open/close)
  const [openModuleIds, setOpenModuleIds] = useState<string[]>(() => modules.map((m) => m.id));

  const toggleModuleOpen = (modId: string) => {
    setOpenModuleIds((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  // Active lesson details
  const currentLessonItem = allLessons.find((l) => l.id === selectedLessonId) || allLessons[0];
  const currentLessonIndex = currentLessonItem ? currentLessonItem.globalIndex : 0;
  const currentModule = modules.find((m) => m.id === (currentLessonItem?.moduleId || selectedModuleId)) || modules[0];
  const currentLesson = currentLessonItem || null;

  // 3. Drawer / Lateral sidebar state (toggle via menu button in top-left)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 4. Reading scroll detection state
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const readingContentRef = useRef<HTMLDivElement>(null);

  // Alert/toast for locked attempts
  const [lockAlert, setLockAlert] = useState<string | null>(null);

  // 5. Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizAttemptsUsed, setQuizAttemptsUsed] = useState(0);
  const [quizResult, setQuizResult] = useState<{
    scorePercent: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
  } | null>(null);

  // 6. Course Evaluation Modal state (Mandatory on completing last lesson)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmittedSuccess, setReviewSubmittedSuccess] = useState(false);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);

  // Check if current lesson has a real video
  const hasVideo = Boolean(currentLesson?.videoUrl && currentLesson.videoUrl.trim() !== '');
  const isCurrentLessonCompleted = currentLesson ? completedLessonIds.includes(currentLesson.id) : false;

  // Reset states when switching lessons
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);

    // If already completed or has video, scroll requirement is waived
    if (isCurrentLessonCompleted || hasVideo) {
      setHasScrolledToBottom(true);
    } else {
      setHasScrolledToBottom(false);
      // Check if text content fits on screen without needing scrolling
      setTimeout(() => {
        if (readingContentRef.current) {
          const el = readingContentRef.current;
          if (el.scrollHeight <= el.clientHeight + 40) {
            setHasScrolledToBottom(true);
          }
        }
      }, 150);
    }
  }, [selectedLessonId, isCurrentLessonCompleted, hasVideo]);

  // Synchronize when opening or changing course
  useEffect(() => {
    if (isOpen && course) {
      const initialCompleted = progress?.completedLessonIds && progress.completedLessonIds.length > 0
        ? progress.completedLessonIds
        : allLessons.slice(0, progress?.completedLessons || 0).map((l) => l.id);
      setCompletedLessonIds(initialCompleted);

      const firstUnfinished = allLessons.find((l) => !initialCompleted.includes(l.id));
      const targetLesson = firstUnfinished || allLessons[0];
      if (targetLesson) {
        setSelectedLessonId(targetLesson.id);
        setSelectedModuleId(targetLesson.moduleId);
        setOpenModuleIds((prev) => Array.from(new Set([...prev, targetLesson.moduleId])));
      }
      setIsReviewModalOpen(false);
      setReviewSubmittedSuccess(false);
      setSelectedRating(0);
      setReviewComment('');
    }
  }, [course?.id, isOpen]);

  // Scroll listener for reading text container
  const handleReadingScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (hasScrolledToBottom) return;
    const el = e.currentTarget;
    const reachedBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 45;
    if (reachedBottom) {
      setHasScrolledToBottom(true);
    }
  };

  // Helper for sequential permission check: lesson 0 is unlocked; lesson N unlocked only if lesson N-1 is completed
  const isLessonUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevLesson = allLessons[index - 1];
    return prevLesson ? completedLessonIds.includes(prevLesson.id) : false;
  };

  const handleSelectLesson = (lesson: Lesson & { moduleId: string; globalIndex: number }) => {
    if (!isLessonUnlocked(lesson.globalIndex)) {
      setLockAlert(`A aula "${lesson.title}" está bloqueada! Conclua as aulas anteriores em ordem sequencial.`);
      setTimeout(() => setLockAlert(null), 4000);
      return;
    }
    setSelectedModuleId(lesson.moduleId);
    setSelectedLessonId(lesson.id);
    setOpenModuleIds((prev) => Array.from(new Set([...prev, lesson.moduleId])));
  };

  // Progress percentage
  const progressPercent = totalLessonsCount > 0
    ? Math.round((completedLessonIds.length / totalLessonsCount) * 100)
    : 0;

  // Handle advancing / completing current lesson
  const handleCompleteCurrentLesson = () => {
    if (!currentLesson) return;

    // Add to completed if not already
    const isAlreadyCompleted = completedLessonIds.includes(currentLesson.id);
    let nextCompletedIds = completedLessonIds;
    if (!isAlreadyCompleted) {
      nextCompletedIds = [...completedLessonIds, currentLesson.id];
      setCompletedLessonIds(nextCompletedIds);
    }

    // Call parent handler
    onCompleteLesson(course.id, currentLesson.id, currentLesson.title);

    // Check if this was the last lesson
    const isLastLesson = currentLessonIndex === totalLessonsCount - 1;

    if (isLastLesson) {
      // MANDATORY: Intercept completion of last lesson to show the Course Evaluation Modal
      setIsReviewModalOpen(true);
    } else {
      // Auto advance to the next sequential lesson
      const nextLesson = allLessons[currentLessonIndex + 1];
      if (nextLesson) {
        setSelectedModuleId(nextLesson.moduleId);
        setSelectedLessonId(nextLesson.id);
        setOpenModuleIds((prev) => Array.from(new Set([...prev, nextLesson.moduleId])));
      }
    }
  };

  // Submit Course Evaluation
  const handleSubmitReviewAndProceed = () => {
    if (selectedRating === 0) return;

    const newReview: CourseReview = {
      id: `rev-${Date.now()}`,
      courseId: course.id,
      courseTitle: course.title,
      courseCategory: course.category,
      instructor: course.instructor,
      studentId: currentUser?.id || 'aluno-1',
      studentName: currentUser?.name || 'Aluno Deds Academy',
      studentEmail: currentUser?.email || 'aluno@dedsacademy.com.br',
      studentAvatar: currentUser?.avatar,
      studentCode: currentUser?.studentCode || `ALU-${currentUser?.id?.replace(/\D/g, '').slice(-4) || '9842'}`,
      rating: selectedRating,
      comment: reviewComment.trim(),
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'aprovado',
    };

    if (onSubmitReview) {
      onSubmitReview(newReview);
    }

    setReviewSubmittedSuccess(true);
  };

  // Helper for material styling
  const getAttachmentIcon = (type: LessonAttachment['type']) => {
    switch (type) {
      case 'word':
        return { icon: 'description', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', label: 'Documento Word (.docx)' };
      case 'excel':
        return { icon: 'table_chart', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Planilha Excel (.xlsx)' };
      case 'pdf':
        return { icon: 'picture_as_pdf', color: 'text-red-400 bg-red-500/10 border-red-500/30', label: 'Arquivo PDF (.pdf)' };
      case 'powerpoint':
        return { icon: 'slideshow', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'Apresentação PowerPoint (.pptx)' };
      default:
        return { icon: 'attach_file', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', label: 'Arquivo de Apoio' };
    }
  };

  // Evaluate quiz
  const handleGradeQuiz = (quiz: LessonQuiz) => {
    let correct = 0;
    quiz.questions.forEach((q) => {
      const selectedOptionId = quizAnswers[q.id];
      const correctOption = q.options.find((o) => o.isCorrect);
      if (correctOption && selectedOptionId === correctOption.id) {
        correct++;
      }
    });

    const total = quiz.questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passing = quiz.passingScore || 70;
    const isPassed = score >= passing;

    setQuizResult({
      scorePercent: score,
      passed: isPassed,
      correctCount: correct,
      totalQuestions: total,
    });
    setQuizAttemptsUsed((prev) => prev + 1);
    setQuizSubmitted(true);
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  const canAttemptQuiz = currentLesson?.quiz
    ? currentLesson.quiz.maxAttempts === 0 || quizAttemptsUsed < currentLesson.quiz.maxAttempts
    : false;

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5: return 'Excelente • Superou as expectativas!';
      case 4: return 'Muito Bom • Recomendo fortemente!';
      case 3: return 'Bom • Atendeu ao que foi proposto.';
      case 2: return 'Regular • Pode melhorar em alguns pontos.';
      case 1: return 'Insatisfeito • Precisa de melhorias.';
      default: return 'Clique nas estrelas para avaliar (1 a 5)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen bg-[#0B0F19] text-white flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* =========================================================================
          TOP HEADER: MENU GAVETA, TÍTULO DO CURSO, PROGRESSO E FECHAR
         ========================================================================= */}
      <header className="h-16 px-4 sm:px-6 border-b border-white/10 bg-[#0F172A] flex items-center justify-between gap-4 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Menu Lateral / Gaveta Toggle Button no Canto Superior Esquerdo */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isSidebarOpen
                ? 'bg-primary/20 text-accent-emerald-bright border-primary/40 shadow-[0_0_12px_rgba(0,176,116,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
            }`}
            title={isSidebarOpen ? 'Recolher menu lateral de ementa' : 'Abrir menu lateral com ementas e pastas'}
            aria-label="Abrir ou recolher menu lateral"
          >
            <span className="material-symbols-outlined text-xl">
              {isSidebarOpen ? 'menu_open' : 'menu'}
            </span>
          </button>

          {/* Sair da Sala / Voltar */}
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Voltar para Meus Cursos"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Voltar</span>
          </button>

          {/* Identificação da Aula e Curso */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-accent-emerald-bright border border-primary/30 uppercase tracking-wider hidden md:inline">
                {course.category}
              </span>
              <span className="text-[11px] text-slate-400 font-medium truncate">
                Aula {currentLessonIndex + 1} de {totalLessonsCount}
              </span>
            </div>
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-xl">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Canto Direito: Barra de Progresso e Fechar */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs font-bold text-accent-emerald-bright">{progressPercent}%</span>
            <div className="w-16 sm:w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent-emerald-bright rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Sair da sala de aula"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </header>

      {/* Floating Lock Alert Toast */}
      {lockAlert && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-300 text-xs py-2.5 px-4 flex items-center justify-center gap-2 z-40 animate-in fade-in slide-in-from-top-2 shadow-lg">
          <span className="material-symbols-outlined text-base">lock</span>
          <span className="font-semibold">{lockAlert}</span>
        </div>
      )}

      {/* =========================================================================
          CORPO PRINCIPAL: BARRA LATERAL À ESQUERDA + ÁREA DA AULA À DIREITA
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* =======================================================================
            BARRA LATERAL ESQUERDA: EMENTA, PASTAS DOS MÓDULOS E ACESSO SEQUENCIAL
           ======================================================================= */}
        {isSidebarOpen && (
          <aside className="w-80 sm:w-96 border-r border-white/10 bg-[#0F172A] flex flex-col h-full shrink-0 z-20 shadow-xl overflow-hidden animate-in slide-in-from-left-5 duration-200">
            {/* Cabeçalho da Gaveta com Progresso Geral */}
            <div className="p-4 border-b border-white/10 bg-slate-900/90 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">folder_open</span>
                  Ementa &amp; Pastas do Curso
                </span>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer lg:hidden"
                  title="Recolher menu lateral"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Card de Progresso */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Progresso na Formação</span>
                  <span className="font-bold text-accent-emerald-bright">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-accent-emerald-bright rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{completedLessonIds.length} de {totalLessonsCount} aulas</span>
                  <span className="text-accent-emerald-bright font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">lock_clock</span>
                    Acesso Sequencial
                  </span>
                </div>
              </div>
            </div>

            {/* Lista de Módulos (Pastas) e Tópicos */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {modules.map((mod, modIdx) => {
                const isExpanded = openModuleIds.includes(mod.id);
                const modCompletedCount = mod.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
                const isModCompleted = mod.lessons.length > 0 && modCompletedCount === mod.lessons.length;

                return (
                  <div
                    key={mod.id || modIdx}
                    className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xs"
                  >
                    {/* Botão da Pasta do Módulo */}
                    <button
                      type="button"
                      onClick={() => toggleModuleOpen(mod.id)}
                      className="w-full p-3 bg-slate-800/60 hover:bg-slate-800 border-b border-white/5 flex items-center justify-between gap-2.5 text-left cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="material-symbols-outlined text-amber-400 text-lg shrink-0">
                          {isExpanded ? 'folder_open' : 'folder'}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white truncate block">
                            {mod.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {modCompletedCount} de {mod.lessons.length} concluídas
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isModCompleted && (
                          <span className="material-symbols-outlined text-accent-emerald-bright text-base" title="Módulo Concluído">
                            check_circle
                          </span>
                        )}
                        <span className="material-symbols-outlined text-slate-400 text-base transition-transform duration-200">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </button>

                    {/* Aulas do Módulo com Bloqueio Estritamente Sequencial */}
                    {isExpanded && (
                      <div className="p-1.5 space-y-1 bg-slate-950/40">
                        {mod.lessons.map((les) => {
                          const match = allLessons.find((l) => l.id === les.id);
                          const globalIdx = match ? match.globalIndex : 0;
                          const isUnlocked = isLessonUnlocked(globalIdx);
                          const isCompleted = completedLessonIds.includes(les.id);
                          const isCurrent = les.id === selectedLessonId;
                          const isVideo = Boolean(les.videoUrl && les.videoUrl.trim() !== '');

                          return (
                            <div
                              key={les.id}
                              onClick={() => match && handleSelectLesson(match)}
                              className={`p-2.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                                isCurrent
                                  ? 'bg-primary/20 border border-primary/40 text-white font-bold shadow-sm'
                                  : isCompleted
                                  ? 'bg-slate-800/40 text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer border border-white/5'
                                  : isUnlocked
                                  ? 'bg-slate-800/20 text-slate-300 hover:bg-slate-800/50 hover:text-white cursor-pointer'
                                  : 'opacity-40 bg-slate-900/30 text-slate-500 cursor-not-allowed border border-transparent select-none'
                              }`}
                              title={
                                !isUnlocked
                                  ? 'Aula bloqueada. Conclua as etapas anteriores para desbloquear.'
                                  : les.title
                              }
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {/* Ícone de Estado */}
                                {isCompleted ? (
                                  <span className="material-symbols-outlined text-accent-emerald-bright text-base shrink-0">
                                    check_circle
                                  </span>
                                ) : isCurrent ? (
                                  <span className="material-symbols-outlined text-primary text-base shrink-0 animate-pulse">
                                    play_circle
                                  </span>
                                ) : isUnlocked ? (
                                  <span className="material-symbols-outlined text-slate-400 text-base shrink-0">
                                    radio_button_unchecked
                                  </span>
                                ) : (
                                  <span className="material-symbols-outlined text-amber-500/80 text-base shrink-0">
                                    lock
                                  </span>
                                )}

                                <div className="min-w-0">
                                  <span className="truncate block leading-snug">
                                    {les.title}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] opacity-75 mt-0.5">
                                    <span className="flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[11px]">
                                        {isVideo ? 'videocam' : 'menu_book'}
                                      </span>
                                      <span>{isVideo ? 'Vídeo' : 'Leitura'}</span>
                                    </span>
                                    {les.duration && <span>• {les.duration}</span>}
                                    {les.quiz && <span>• Quiz</span>}
                                  </div>
                                </div>
                              </div>

                              {/* Selo à direita */}
                              <div className="shrink-0 ml-2">
                                {!isUnlocked ? (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[10px]">lock</span>
                                    Bloqueado
                                  </span>
                                ) : isCompleted ? (
                                  <span className="text-[10px] font-semibold text-accent-emerald-bright">
                                    Concluído
                                  </span>
                                ) : isCurrent ? (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-on-primary">
                                    Em Curso
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* =======================================================================
            ÁREA PRINCIPAL / DIREITA: REPRODUTOR DE VÍDEO OU ARTIGO DE LEITURA
           ======================================================================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 flex flex-col justify-between bg-[#0B0F19]">
          <div className="space-y-6 max-w-5xl mx-auto w-full">
            {/* REPRODUTOR DE VÍDEO (Exibido APENAS se houver videoUrl preenchida) */}
            {hasVideo ? (
              <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10 aspect-video flex items-center justify-center shadow-2xl">
                {currentLesson?.videoUrl?.includes('youtube.com') || currentLesson?.videoUrl?.includes('youtu.be') ? (
                  <iframe
                    src={
                      currentLesson.videoUrl.includes('watch?v=')
                        ? currentLesson.videoUrl.replace('watch?v=', 'embed/')
                        : currentLesson.videoUrl.replace('youtu.be/', 'youtube.com/embed/')
                    }
                    title={currentLesson.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    key={currentLesson?.videoUrl}
                    src={currentLesson?.videoUrl}
                    controls
                    autoPlay={false}
                    poster={currentLesson?.imageUrl || course.image}
                    className="w-full h-full object-contain"
                  >
                    Seu navegador não suporta a reprodução deste vídeo.
                  </video>
                )}
              </div>
            ) : null}

            {/* ARTIGO DE LEITURA E TEXTO FORMATADO (SEM CAIXA PRETA, SEM PLAYER VAZIO) */}
            {!hasVideo && (
              <div className="space-y-5">
                {/* Banner de Apresentação da Aula Teórica */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-primary/10 border border-primary/25 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 text-accent-emerald-bright border border-primary/30 flex items-center justify-center shrink-0 shadow-inner">
                      <span className="material-symbols-outlined text-2xl">menu_book</span>
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-primary text-on-primary uppercase tracking-wider">
                        Material de Leitura Teórico
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                        {currentLesson?.title}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
                    <span className="material-symbols-outlined text-sm text-accent-emerald-bright">schedule</span>
                    <span>{currentLesson?.duration || '15 min de leitura'}</span>
                  </div>
                </div>

                {/* Imagem Ilustrativa (se houver) */}
                {currentLesson?.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg max-h-80">
                    <img
                      src={currentLesson.imageUrl}
                      alt={currentLesson.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* CONTAINER DE LEITURA COM DETECÇÃO OBRIGATÓRIA DE ROLAGEM ATÉ O FIM */}
                <div
                  ref={readingContentRef}
                  onScroll={handleReadingScroll}
                  className="p-6 sm:p-8 rounded-2xl bg-[#0F172A] border border-white/10 shadow-xl max-h-[500px] overflow-y-auto space-y-5 leading-relaxed text-slate-200 text-sm sm:text-base border-l-4 border-l-primary custom-scrollbar"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-slate-400">
                    <span className="font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-sm">article</span>
                      Conteúdo Programático da Aula
                    </span>
                    <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      Módulo: {currentModule?.title}
                    </span>
                  </div>

                  <div className="prose prose-invert max-w-none space-y-4 whitespace-pre-line text-slate-300">
                    {currentLesson?.description ||
                      `Bem-vindo(a) à aula teórica "${currentLesson?.title}".\n\nNeste tópico fundamental, exploramos conceitos teóricos consolidados, arquitetura de soluções, padrões de projeto e diretrizes práticas recomendadas para o mercado profissional contemporâneo.\n\nDedique atenção especial aos tópicos aprofundados, pois os conhecimentos abordados aqui formam a base para as próximas etapas sequenciais da formação.`}
                  </div>

                  {/* Destaque / Conclusão da Leitura */}
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-primary/20 text-xs text-slate-300 flex items-start gap-3 mt-6">
                    <span className="material-symbols-outlined text-accent-emerald-bright text-xl shrink-0">
                      verified
                    </span>
                    <div>
                      <strong className="text-white block mb-0.5">Fim do Conteúdo de Leitura</strong>
                      Role até o rodapé deste bloco para validar sua leitura e desbloquear o botão de avanço abaixo.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MATERIAIS DE APOIO / DOWNLOADS (Word, Excel, PDF, etc.) */}
            {currentLesson?.attachments && currentLesson.attachments.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-white/10 shadow-md space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-base">download_for_offline</span>
                  Arquivos e Materiais Complementares ({currentLesson.attachments.length})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentLesson.attachments.map((att) => {
                    const style = getAttachmentIcon(att.type);
                    return (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 flex items-center justify-between gap-3 group transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${style.color}`}>
                            <span className="material-symbols-outlined text-xl">{style.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white truncate block group-hover:text-primary transition-colors">
                              {att.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {style.label} {att.size ? `• ${att.size}` : ''}
                            </span>
                          </div>
                        </div>

                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-lg transition-transform group-hover:translate-x-1 shrink-0">
                          download
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUIZ / QUESTIONÁRIO INTERATIVO (Se houver) */}
            {currentLesson?.quiz && currentLesson.quiz.questions.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#0F172A] border border-white/10 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">quiz</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {currentLesson.quiz.title || 'Questionário de Fixação'}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Nota mínima: {currentLesson.quiz.passingScore || 70}% • {currentLesson.quiz.questions.length} Questões
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-white/10 text-slate-300">
                    {currentLesson.quiz.maxAttempts === 0
                      ? 'Tentativas Ilimitadas'
                      : `Tentativa ${Math.min(quizAttemptsUsed + (quizSubmitted ? 0 : 1), currentLesson.quiz.maxAttempts)} de ${currentLesson.quiz.maxAttempts}`}
                  </span>
                </div>

                {/* Resultado do Quiz */}
                {quizSubmitted && quizResult && (
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                      quizResult.passed
                        ? 'bg-accent-emerald-bright/15 border-accent-emerald-bright/40 text-accent-emerald-bright'
                        : 'bg-red-500/15 border-red-500/40 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-2xl">
                        {quizResult.passed ? 'check_circle' : 'cancel'}
                      </span>
                      <div>
                        <p className="text-xs font-bold">
                          {quizResult.passed ? 'Parabéns, você foi aprovado no Quiz!' : 'Nota abaixo da média mínima necessária.'}
                        </p>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          Você acertou {quizResult.correctCount} de {quizResult.totalQuestions} questões ({quizResult.scorePercent}% de aproveitamento).
                        </p>
                      </div>
                    </div>

                    {canAttemptQuiz && (
                      <button
                        type="button"
                        onClick={handleRetakeQuiz}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs font-bold text-white hover:bg-slate-700 cursor-pointer shrink-0"
                      >
                        Tentar Novamente
                      </button>
                    )}
                  </div>
                )}

                {/* Lista de Questões */}
                <div className="space-y-4">
                  {currentLesson.quiz.questions.map((q, qIndex) => {
                    const selectedOptId = quizAnswers[q.id];

                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl bg-slate-850 border border-white/10 space-y-3"
                      >
                        <span className="text-xs font-bold text-white block">
                          {qIndex + 1}. {q.question}
                        </span>

                        <div className="space-y-2">
                          {q.options.map((opt, optIndex) => {
                            const isSelected = selectedOptId === opt.id;
                            const showFeedback = quizSubmitted;
                            const isProgrammedCorrect = opt.isCorrect;

                            let stateClass = 'border-white/10 bg-slate-900 hover:border-primary/50 text-slate-300';
                            if (showFeedback) {
                              if (isProgrammedCorrect) {
                                stateClass = 'border-accent-emerald-bright/60 bg-accent-emerald-bright/15 text-accent-emerald-bright font-bold';
                              } else if (isSelected && !isProgrammedCorrect) {
                                stateClass = 'border-red-500/60 bg-red-500/15 text-red-300';
                              }
                            } else if (isSelected) {
                              stateClass = 'border-primary bg-primary/20 text-white font-bold';
                            }

                            return (
                              <label
                                key={opt.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${stateClass}`}
                              >
                                <input
                                  type="radio"
                                  name={`quiz-q-${q.id}`}
                                  disabled={quizSubmitted}
                                  checked={isSelected}
                                  onChange={() => {
                                    setQuizAnswers((prev) => ({ ...prev, [q.id]: opt.id }));
                                  }}
                                  className="w-4 h-4 text-primary focus:ring-0 cursor-pointer"
                                />
                                <span className="font-mono text-slate-400">
                                  {String.fromCharCode(65 + optIndex)})
                                </span>
                                <span className="flex-1">{opt.text}</span>
                                {showFeedback && isProgrammedCorrect && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-emerald-bright/20 text-accent-emerald-bright">
                                    Correto
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!quizSubmitted && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleGradeQuiz(currentLesson.quiz!)}
                      disabled={Object.keys(quizAnswers).length < currentLesson.quiz.questions.length}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">fact_check</span>
                      <span>Enviar Respostas para Correção</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =====================================================================
              BARRA DE AÇÃO INFERIOR: VALIDAÇÃO DE ROLAGEM + BOTÃO DE CONCLUIR/AVANÇAR
             ===================================================================== */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 max-w-5xl mx-auto w-full">
            <div className="text-left w-full sm:w-auto">
              <span className="text-[11px] font-bold text-slate-400 block">
                Etapa {currentLessonIndex + 1} de {totalLessonsCount} • {currentModule?.title}
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                {currentLesson?.title}
              </h4>

              {/* Feedback de Validação de Leitura */}
              {!hasVideo && !isCurrentLessonCompleted && (
                <div className="mt-1.5">
                  {!hasScrolledToBottom ? (
                    <span className="text-xs text-amber-400 flex items-center gap-1.5 font-medium animate-pulse">
                      <span className="material-symbols-outlined text-sm animate-bounce">south</span>
                      Role o texto acima até o final para liberar a conclusão
                    </span>
                  ) : (
                    <span className="text-xs text-accent-emerald-bright flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Leitura concluída! Você já pode avançar
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Botão de Avanço / Conclusão */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {currentLessonIndex > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const prevLesson = allLessons[currentLessonIndex - 1];
                    if (prevLesson) {
                      setSelectedModuleId(prevLesson.moduleId);
                      setSelectedLessonId(prevLesson.id);
                    }
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-white/10 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  <span>Anterior</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCompleteCurrentLesson}
                disabled={!hasVideo && !hasScrolledToBottom && !isCurrentLessonCompleted}
                className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  !hasVideo && !hasScrolledToBottom && !isCurrentLessonCompleted
                    ? 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed opacity-50'
                    : 'bg-primary-container hover:bg-accent-emerald-bright text-on-primary cursor-pointer active:scale-95 shadow-[0_0_20px_-3px_rgba(0,176,116,0.6)]'
                }`}
                title={
                  !hasVideo && !hasScrolledToBottom && !isCurrentLessonCompleted
                    ? 'Role até o final do texto para desbloquear este botão'
                    : 'Concluir esta etapa e avançar'
                }
              >
                <span className="material-symbols-outlined text-base">
                  {currentLessonIndex === totalLessonsCount - 1 ? 'workspace_premium' : 'check'}
                </span>
                <span>
                  {currentLessonIndex === totalLessonsCount - 1
                    ? 'Concluir Curso & Avaliar'
                    : isCurrentLessonCompleted
                    ? 'Próxima Aula'
                    : 'Concluir Aula / Avançar'}
                </span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODAL DE AVALIAÇÃO OBRIGATÓRIA (AO CONCLUIR A ÚLTIMA AULA)
         ========================================================================= */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-on-surface">
            {/* Cabeçalho do Modal */}
            <div className="p-6 bg-surface-overlay border-b border-border-subtle text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-accent-gold/20 text-accent-gold border border-accent-gold/30 flex items-center justify-center mx-auto shadow-lg">
                <span className="material-symbols-outlined text-4xl">emoji_events</span>
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-emerald-bright/20 text-accent-emerald-bright border border-accent-emerald-bright/30">
                  100% Concluído • Parabéns! 🎉
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-text-primary mt-2">
                  Avaliação Obrigatória do Curso
                </h3>
                <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                  Para emitir o seu certificado oficial com autenticação digital, avalie a sua experiência na formação &quot;{course.title}&quot;.
                </p>
              </div>
            </div>

            {/* Formulário de Avaliação */}
            {!reviewSubmittedSuccess ? (
              <div className="p-6 space-y-5">
                {/* 1. Estrelas (1 a 5) — OBRIGATÓRIO */}
                <div className="space-y-2 text-center">
                  <label className="text-xs font-bold text-text-primary block">
                    Como você avalia a qualidade deste curso? <span className="text-status-danger">*</span>
                  </label>

                  <div className="flex items-center justify-center gap-2 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setSelectedRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                        aria-label={`Avaliar com ${star} estrelas`}
                      >
                        <span
                          className={`material-symbols-outlined text-3xl sm:text-4xl transition-colors ${
                            star <= (hoverRating || selectedRating)
                              ? 'text-accent-gold drop-shadow-[0_0_10px_rgba(255,184,0,0.6)]'
                              : 'text-text-tertiary/40'
                          }`}
                          style={{
                            fontVariationSettings: star <= (hoverRating || selectedRating) ? "'FILL' 1" : "'FILL' 0",
                          }}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>

                  <p
                    className={`text-xs font-bold transition-colors ${
                      selectedRating > 0 ? 'text-accent-gold' : 'text-amber-400'
                    }`}
                  >
                    {getRatingLabel(hoverRating || selectedRating)}
                  </p>
                </div>

                {/* 2. Depoimento / Comentário — OPCIONAL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-primary">
                      Depoimento / Comentário sobre o curso
                    </label>
                    <span className="text-[10px] text-text-tertiary uppercase font-medium">Opcional</span>
                  </div>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Conte como foi sua experiência, o que mais gostou na didática do professor e como esse conhecimento ajudará na sua carreira..."
                    className="w-full p-3 bg-surface-base border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors resize-none"
                  />
                  <p className="text-[11px] text-text-tertiary">
                    Seu depoimento poderá ser publicado na página inicial da Deds Academy para inspirar outros alunos.
                  </p>
                </div>

                {/* 3. Botão de Envio (Bloqueado se rating === 0) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSubmitReviewAndProceed}
                    disabled={selectedRating === 0}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                      selectedRating === 0
                        ? 'bg-surface-overlay text-text-tertiary border border-border-subtle cursor-not-allowed opacity-50'
                        : 'bg-primary-container hover:bg-accent-emerald-bright text-on-primary cursor-pointer active:scale-95 shadow-[0_0_20px_-3px_rgba(0,176,116,0.6)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">workspace_premium</span>
                    <span>Prosseguir para Emissão do Certificado</span>
                  </button>

                  {selectedRating === 0 && (
                    <p className="text-[11px] text-center text-status-danger font-medium mt-2">
                      * Por favor, selecione ao menos 1 estrela para liberar a emissão do certificado.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Sucesso e Liberação do Certificado Oficial */
              <div className="p-6 text-center space-y-5">
                <div className="w-14 h-14 rounded-full bg-accent-emerald-bright/20 text-accent-emerald-bright border border-accent-emerald-bright/40 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">verified</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-text-primary">
                    Avaliação Registrada com Sucesso!
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Sua nota e depoimento foram sincronizados com sucesso. O seu certificado oficial de &quot;{course.title}&quot; já está 100% liberado para download em PDF e PNG com verificação QR Code.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isGeneratingCertificate}
                    onClick={async () => {
                      setIsGeneratingCertificate(true);
                      try {
                        await downloadCertificatePdf({
                          studentName: currentUser?.certificateData?.customName || currentUser?.name || 'Aluno Deds Academy',
                          studentCpf: currentUser?.certificateData?.customCpf || currentUser?.cpf || '384.920.118-04',
                          studentCode: currentUser?.studentCode || 'ALU-9842',
                          courseTitle: course.title,
                          courseCategory: course.category,
                          hours: course.hours,
                          issueDate: new Date().toLocaleDateString('pt-BR'),
                          code: `DA-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
                          instructor: course.instructor,
                        });
                      } catch (err) {
                        console.error('Erro ao baixar certificado PDF:', err);
                      } finally {
                        setIsGeneratingCertificate(false);
                      }
                    }}
                    className="p-3 rounded-xl bg-accent-gold/20 hover:bg-accent-gold/30 text-accent-gold border border-accent-gold/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                    <span>{isGeneratingCertificate ? 'Gerando PDF...' : 'Baixar PDF Oficial'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await downloadCertificatePng({
                          studentName: currentUser?.certificateData?.customName || currentUser?.name || 'Aluno Deds Academy',
                          studentCpf: currentUser?.certificateData?.customCpf || currentUser?.cpf || '384.920.118-04',
                          studentCode: currentUser?.studentCode || 'ALU-9842',
                          courseTitle: course.title,
                          courseCategory: course.category,
                          hours: course.hours,
                          issueDate: new Date().toLocaleDateString('pt-BR'),
                          code: `DA-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
                          instructor: course.instructor,
                        });
                      } catch (err) {
                        console.error('Erro ao baixar PNG:', err);
                      }
                    }}
                    className="p-3 rounded-xl bg-accent-emerald-bright/20 hover:bg-accent-emerald-bright/30 text-accent-emerald-bright border border-accent-emerald-bright/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span className="material-symbols-outlined text-base">image</span>
                    <span>Baixar Imagem PNG</span>
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  {onOpenCertificateModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReviewModalOpen(false);
                        onClose();
                        onOpenCertificateModal();
                      }}
                      className="text-xs text-primary font-bold hover:underline cursor-pointer"
                    >
                      Consultar Autenticidade do Certificado
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsReviewModalOpen(false);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-surface-overlay hover:bg-surface-base border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer transition-all ml-auto"
                  >
                    Concluir &amp; Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
