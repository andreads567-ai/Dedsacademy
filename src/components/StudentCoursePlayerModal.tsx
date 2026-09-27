import React, { useState, useEffect } from 'react';
import { Course, CourseModule, Lesson, LessonAttachment, LessonQuiz } from '../types';

interface StudentCoursePlayerModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteLesson: (courseId: string, lessonId: string, lessonTitle: string) => void;
}

export const StudentCoursePlayerModal: React.FC<StudentCoursePlayerModalProps> = ({
  course,
  isOpen,
  onClose,
  onCompleteLesson,
}) => {
  if (!isOpen || !course) return null;

  const hasModules = course.modules && course.modules.length > 0;

  // Active module and lesson
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    hasModules ? course.modules![0].id : ''
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    hasModules && course.modules![0].lessons[0] ? course.modules![0].lessons[0].id : ''
  );

  // Active lesson data
  const currentModule = hasModules
    ? course.modules!.find((m) => m.id === selectedModuleId) || course.modules![0]
    : null;

  const currentLesson: Lesson | null = currentModule
    ? currentModule.lessons.find((l) => l.id === selectedLessonId) || currentModule.lessons[0] || null
    : null;

  // Quiz state for current lesson
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizAttemptsUsed, setQuizAttemptsUsed] = useState(0);
  const [quizResult, setQuizResult] = useState<{
    scorePercent: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
  } | null>(null);

  // Reset quiz state whenever lesson changes
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  }, [selectedLessonId]);

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

  // Check if student can still try
  const maxAttempts = currentLesson?.quiz?.maxAttempts ?? 0;
  const canAttemptQuiz = maxAttempts === 0 || quizAttemptsUsed < maxAttempts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Top Navbar */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-overlay">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">play_circle</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-accent-emerald-bright uppercase tracking-wider block truncate">
                Sala de Aula Virtual • {course.category}
              </span>
              <h3 className="text-sm font-bold text-text-primary truncate">
                {course.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-text-tertiary hidden sm:inline">
              Prof. {course.instructor}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
              title="Fechar sala de aula"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Main Body Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Left / Center: Video Player, Content, Materials, Quiz (Col 8) */}
          <div className="lg:col-span-8 p-4 sm:p-6 space-y-6 overflow-y-auto">
            {/* Video Player or Visual Area */}
            <div className="relative bg-black rounded-2xl overflow-hidden border border-border-subtle aspect-video flex items-center justify-center shadow-lg">
              {currentLesson?.videoUrl ? (
                <video
                  key={currentLesson.videoUrl}
                  src={currentLesson.videoUrl}
                  controls
                  autoPlay={false}
                  poster={currentLesson.imageUrl || course.image}
                  className="w-full h-full object-contain"
                >
                  Seu navegador não suporta reprodução de vídeo.
                </video>
              ) : currentLesson?.imageUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={currentLesson.imageUrl}
                    alt={currentLesson.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                    <div className="p-4 rounded-xl bg-black/60 backdrop-blur-sm text-center">
                      <span className="material-symbols-outlined text-3xl text-primary mb-1">image</span>
                      <p className="text-xs font-bold text-white">Conteúdo Teórico &amp; Prático Ilustrado</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <img
                    src={course.image}
                    alt="Capa do curso"
                    className="absolute inset-0 w-full h-full object-cover opacity-25"
                  />
                  <div className="relative z-10 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,176,116,0.6)] cursor-pointer hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl">play_arrow</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {currentLesson ? currentLesson.title : 'Aula em Andamento'}
                      </h4>
                      <p className="text-xs text-white/70 mt-0.5">
                        Duração: {currentLesson?.duration || '15 min'} • Qualidade 1080p HD
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Info Header & Complete Button */}
            <div className="p-4 rounded-2xl bg-surface-overlay border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  {currentModule?.title || 'Módulo Atual'}
                </span>
                <h2 className="text-base font-bold text-text-primary mt-0.5">
                  {currentLesson ? currentLesson.title : 'Visão Geral do Curso'}
                </h2>
                {currentLesson?.duration && (
                  <span className="text-xs text-text-tertiary flex items-center gap-1 mt-1 font-mono">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    Duração: {currentLesson.duration}
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  const lessonId = currentLesson ? currentLesson.id : 'main';
                  const lessonName = currentLesson ? currentLesson.title : 'Aula Principal';
                  onCompleteLesson(course.id, lessonId, lessonName);
                }}
                className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Concluir esta Aula</span>
              </button>
            </div>

            {/* Lesson Detailed Description */}
            {currentLesson?.description && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">description</span>
                  Descrição &amp; Objetivos da Aula
                </h4>
                <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                  {currentLesson.description}
                </div>
              </div>
            )}

            {/* Lesson Materials / Files to Download (Word, Excel, PDF, etc.) */}
            {currentLesson?.attachments && currentLesson.attachments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-blue-400 text-sm">download_for_offline</span>
                    Materiais de Apoio para Download ({currentLesson.attachments.length})
                  </h4>
                  <span className="text-[10px] text-text-tertiary">
                    Clique para baixar Word, Excel ou PDF
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentLesson.attachments.map((att) => {
                    const style = getAttachmentIcon(att.type);

                    return (
                      <div
                        key={att.id}
                        className="p-3.5 rounded-xl bg-surface-overlay border border-border-subtle hover:border-blue-400/40 transition-all flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${style.color}`}>
                            <span className="material-symbols-outlined text-lg">{style.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-text-primary truncate block" title={att.fileName}>
                              {att.name || att.fileName}
                            </span>
                            <span className="text-[10px] text-text-tertiary block truncate font-mono">
                              {style.label} {att.fileSize && `• ${att.fileSize}`}
                            </span>
                          </div>
                        </div>

                        <a
                          href={att.fileUrl || '#'}
                          download={att.fileName || 'material'}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                          title="Baixar material para o computador"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          <span className="hidden sm:inline">Baixar</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lesson Quiz Section (Multiple choice with programmed correct answer and attempts) */}
            {currentLesson?.quiz && (
              <div className="space-y-4 pt-2">
                <div className="p-4 sm:p-5 rounded-2xl bg-surface-overlay border border-amber-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg">quiz</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary">
                          {currentLesson.quiz.title || 'Questionário de Fixação'}
                        </h4>
                        <p className="text-[10px] text-text-tertiary">
                          Nota mínima: {currentLesson.quiz.passingScore || 70}% • {currentLesson.quiz.questions.length} Questões
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-surface-raised border border-border-subtle text-text-secondary">
                        {currentLesson.quiz.maxAttempts === 0
                          ? 'Tentativas Ilimitadas'
                          : `Tentativa ${Math.min(quizAttemptsUsed + (quizSubmitted ? 0 : 1), currentLesson.quiz.maxAttempts)} de ${currentLesson.quiz.maxAttempts}`}
                      </span>
                    </div>
                  </div>

                  {/* Quiz Result Banner */}
                  {quizSubmitted && quizResult && (
                    <div
                      className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                        quizResult.passed
                          ? 'bg-accent-emerald-bright/10 border-accent-emerald-bright/40 text-accent-emerald-bright'
                          : 'bg-status-danger/10 border-status-danger/40 text-status-danger'
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
                          className="px-3 py-1.5 rounded-lg bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary hover:bg-surface-overlay cursor-pointer shrink-0"
                        >
                          Tentar Novamente
                        </button>
                      )}
                    </div>
                  )}

                  {/* Quiz Questions */}
                  <div className="space-y-4">
                    {currentLesson.quiz.questions.map((q, qIndex) => {
                      const selectedOptId = quizAnswers[q.id];

                      return (
                        <div
                          key={q.id}
                          className="p-3.5 sm:p-4 rounded-xl bg-surface-raised border border-border-subtle space-y-3"
                        >
                          <span className="text-xs font-bold text-text-primary block">
                            {qIndex + 1}. {q.question}
                          </span>

                          <div className="space-y-1.5">
                            {q.options.map((opt, optIndex) => {
                              const isSelected = selectedOptId === opt.id;
                              const showFeedback = quizSubmitted;
                              const isProgrammedCorrect = opt.isCorrect;

                              let stateClass = 'border-border-subtle bg-surface-overlay hover:border-primary/40';
                              if (showFeedback) {
                                if (isProgrammedCorrect) {
                                  stateClass = 'border-accent-emerald-bright/60 bg-accent-emerald-bright/10 text-accent-emerald-bright font-bold';
                                } else if (isSelected && !isProgrammedCorrect) {
                                  stateClass = 'border-status-danger/60 bg-status-danger/10 text-status-danger';
                                }
                              } else if (isSelected) {
                                stateClass = 'border-primary bg-primary/10 text-primary font-bold';
                              }

                              return (
                                <label
                                  key={opt.id}
                                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${stateClass}`}
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
                                  <span className="font-mono text-text-tertiary">
                                    {String.fromCharCode(65 + optIndex)})
                                  </span>
                                  <span className="flex-1">{opt.text}</span>
                                  {showFeedback && isProgrammedCorrect && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-emerald-bright/20 text-accent-emerald-bright">
                                      Gabarito Correto
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>

                          {quizSubmitted && q.explanation && (
                            <div className="p-2.5 rounded-lg bg-surface-overlay border border-border-subtle text-[11px] text-text-tertiary">
                              <strong className="text-text-secondary">Explicação do Professor: </strong>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit button */}
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
              </div>
            )}
          </div>

          {/* Right Sidebar: Modules & Lessons Navigation (Col 4) */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-border-subtle bg-surface-overlay/50 p-4 space-y-4 overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-sm">view_list</span>
                Ementa do Curso
              </span>
              <span className="text-[10px] text-text-tertiary">
                {hasModules ? `${course.modules!.length} Módulos` : `${course.syllabus?.length || 0} Tópicos`}
              </span>
            </div>

            {hasModules ? (
              <div className="space-y-3">
                {course.modules!.map((module, modIdx) => (
                  <div
                    key={module.id}
                    className="rounded-xl border border-border-subtle bg-surface-raised overflow-hidden shadow-xs"
                  >
                    <div
                      onClick={() => setSelectedModuleId(module.id)}
                      className={`p-3 cursor-pointer flex items-center justify-between gap-2 border-b border-border-subtle/50 transition-colors ${
                        selectedModuleId === module.id
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'bg-surface-overlay/80 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-surface-raised border border-border-subtle text-[10px] font-bold flex items-center justify-center shrink-0">
                          {modIdx + 1}
                        </span>
                        <span className="text-xs font-bold truncate">{module.title}</span>
                      </div>
                      <span className="text-[10px] text-text-tertiary shrink-0">
                        {module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'}
                      </span>
                    </div>

                    {/* Lessons inside module */}
                    <div className="p-1.5 space-y-1">
                      {module.lessons.map((lesson, lesIdx) => {
                        const isCurrent = lesson.id === selectedLessonId;

                        return (
                          <div
                            key={lesson.id}
                            onClick={() => {
                              setSelectedModuleId(module.id);
                              setSelectedLessonId(lesson.id);
                            }}
                            className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                              isCurrent
                                ? 'bg-primary text-on-primary font-bold shadow-xs'
                                : 'hover:bg-surface-overlay text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="material-symbols-outlined text-sm shrink-0">
                                {isCurrent ? 'play_arrow' : 'play_circle'}
                              </span>
                              <span className="truncate">{lesson.title}</span>
                            </div>

                            <div className="flex items-center gap-1 text-[10px] shrink-0 opacity-80">
                              {lesson.attachments && lesson.attachments.length > 0 && (
                                <span className="material-symbols-outlined text-xs" title="Materiais para download">
                                  attachment
                                </span>
                              )}
                              {lesson.quiz && (
                                <span className="material-symbols-outlined text-xs" title="Quiz disponível">
                                  quiz
                                </span>
                              )}
                              {lesson.duration && <span>{lesson.duration}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback for syllabus without structured modules */
              <div className="space-y-2">
                {course.syllabus?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-raised border border-border-subtle flex items-center gap-2.5 text-xs text-text-secondary"
                  >
                    <span className="w-5 h-5 rounded-md bg-surface-overlay border border-border-subtle text-[10px] font-bold flex items-center justify-center text-primary">
                      {idx + 1}
                    </span>
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
