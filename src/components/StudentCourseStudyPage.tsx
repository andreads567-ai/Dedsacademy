import React, { useState, useEffect, useMemo } from 'react';
import {
  Course,
  CourseModule,
  Lesson,
  LessonAttachment,
  ModuleQuiz,
  CourseReview,
  StudentProgress,
  UserAccount,
  CertificateItem,
  CourseFinalExam,
  CourseExamQuestion,
  CourseExamOption,
} from '../types';
import { downloadCertificatePdf, downloadCertificatePng } from '../utils/certificateGenerator';
import { generateSequentialCertificateCode, saveCertificateToDB } from '../services/certificateService';

export interface StudentCourseStudyPageProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteLesson: (courseId: string, lessonId: string, lessonTitle: string) => void;
  progress?: StudentProgress;
  currentUser?: UserAccount | null;
  onSubmitReview?: (review: CourseReview) => void;
  onOpenCertificateModal?: () => void;
  onSaveCertificate?: (cert: CertificateItem) => void;
}

export const StudentCourseStudyPage: React.FC<StudentCourseStudyPageProps> = ({
  course,
  isOpen,
  onClose,
  onCompleteLesson,
  progress,
  currentUser,
  onSubmitReview,
  onOpenCertificateModal,
  onSaveCertificate,
}) => {
  if (!isOpen || !course) return null;

  // Security Guard: Course study content is strictly restricted to authenticated & enrolled users
  const isAuthorized = Boolean(
    currentUser &&
    (currentUser.role === 'admin' || currentUser.enrolledCourseIds?.includes(course.id))
  );

  if (!currentUser || !isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-surface-raised border border-border-subtle rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-status-danger/10 text-status-danger mx-auto flex items-center justify-center border border-status-danger/20">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h3 className="text-xl font-bold text-text-primary">Acesso Restrito ao Conteúdo</h3>
          <p className="text-xs sm:text-sm text-text-tertiary leading-relaxed">
            {!currentUser
              ? 'O acesso às aulas, vídeos e materiais é restrito a alunos autenticados. Faça login no painel do aluno para continuar seus estudos.'
              : 'Você não possui matrícula ativa neste curso. Conclua a matrícula para ter acesso liberado à sala de aula.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-primary hover:bg-accent-emerald-bright text-on-primary font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Voltar à Apresentação do Curso
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            description: `Seja bem-vindo(a) a esta etapa essencial da formação "${course.title}".\n\nNeste módulo dedicado a "${topic}", exploramos os fundamentos teóricos, as metodologias aplicadas e as melhores práticas do mercado profissional.\n\nOrientações Pedagógicas:\n1. Leia atentamente todos os conceitos e explicações detalhadas apresentados nesta lição.\n2. Revise os materiais de apoio e complementares disponibilizados para fixação.\n3. Após a leitura e conclusão dos exercícios, utilize o botão "Continuar / Próxima Etapa" para validar a sua progressão e desbloquear o módulo seguinte.`,
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
    const list: Array<
      Lesson & {
        moduleId: string;
        moduleTitle: string;
        moduleIndex: number;
        globalIndex: number;
        quiz?: ModuleQuiz;
      }
    > = [];

    modules.forEach((mod, mIdx) => {
      const lessonsList = mod.lessons && mod.lessons.length > 0
        ? mod.lessons
        : [
            {
              id: `lesson-${mod.id}-default`,
              title: mod.title,
              description: mod.description || course.description || '',
              duration: '20 min',
              attachments: [],
            },
          ];

      lessonsList.forEach((les, lIdx) => {
        // Inherit module-level quiz if lesson doesn't have its own
        const effectiveQuiz = (les.quiz as unknown as ModuleQuiz) || (lIdx === lessonsList.length - 1 ? mod.quiz : undefined);
        list.push({
          ...les,
          moduleId: mod.id,
          moduleTitle: mod.title,
          moduleIndex: mIdx,
          globalIndex: list.length,
          quiz: effectiveQuiz,
        });
      });
    });
    return list;
  }, [modules, course.description]);

  const totalLessonsCount = allLessons.length;

  // 2. Completed lesson IDs tracking
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    if (progress?.completedLessonIds && progress.completedLessonIds.length > 0) {
      return progress.completedLessonIds;
    }
    const count = progress?.completedLessons || 0;
    return allLessons.slice(0, count).map((l) => l.id);
  });

  // Calculate first unfinished lesson
  const firstUnfinishedLesson = allLessons.find((l) => !completedLessonIds.includes(l.id));
  const defaultLessonId = firstUnfinishedLesson ? firstUnfinishedLesson.id : allLessons[0]?.id || '';

  // Active view: 'overview' (Ementa & Lista de Lições - Prime Cursos) | 'reading' (Sala de Aula / Leitura) | 'final_exam' (Prova Final Obrigatória) | 'evaluation' (Avaliação Obrigatória) | 'certificate_ready'
  const isAlreadyCompleted = totalLessonsCount > 0 && completedLessonIds.length >= totalLessonsCount;
  const [activeView, setActiveView] = useState<'overview' | 'reading' | 'final_exam' | 'evaluation' | 'certificate_ready'>(() => {
    return isAlreadyCompleted ? 'overview' : 'overview';
  });

  const [selectedLessonId, setSelectedLessonId] = useState<string>(defaultLessonId);

  // Active lesson details
  const currentLessonItem = allLessons.find((l) => l.id === selectedLessonId) || allLessons[0];
  const currentLessonIndex = currentLessonItem ? currentLessonItem.globalIndex : 0;
  const currentModule = modules.find((m) => m.id === currentLessonItem?.moduleId) || modules[0];

  // Toast / Alert for locked attempts
  const [toastAlert, setToastAlert] = useState<{ message: string; type: 'warning' | 'info' | 'success' } | null>(null);

  const showStudyToast = (message: string, type: 'warning' | 'info' | 'success' = 'warning') => {
    setToastAlert({ message, type });
    setTimeout(() => {
      setToastAlert(null);
    }, 4500);
  };

  // 3. Quiz state for current lesson/module
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    scorePercent: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
  } | null>(null);

  // 4. Course Review / Feedback state
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [issuedCertData, setIssuedCertData] = useState<CertificateItem | null>(null);
  const [isGeneratingCertificatePdf, setIsGeneratingCertificatePdf] = useState(false);

  // 5. Final Exam Resolution & Evaluation State
  const effectiveFinalExam: CourseFinalExam = useMemo(() => {
    if (course.finalExam && course.finalExam.questions && course.finalExam.questions.length > 0) {
      return course.finalExam;
    }
    return {
      id: `exam-${course.id}`,
      title: `Prova Final de Certificação: ${course.title}`,
      description: 'Avaliação final obrigatória para verificação de proficiência e emissão do certificado oficial.',
      minPassingPercent: 80,
      maxAttempts: 3,
      immediateResult: true,
      allowRetake: true,
      status: 'publicado',
      questions: [
        {
          id: 'q-f1',
          title: `Qual é o objetivo central e os conceitos metodológicos aplicados na formação "${course.title}"?`,
          type: 'assertiva',
          selectionType: 'unica',
          points: 20,
          options: [
            { id: 'opt-f1-a', letter: 'A', text: 'Capacitar o aluno com fundamentos sólidos e aplicação prática de alto padrão no mercado de trabalho.', isCorrect: true },
            { id: 'opt-f1-b', letter: 'B', text: 'Transmitir teorias desatualizadas sem comprovação técnica ou prática.', isCorrect: false },
            { id: 'opt-f1-c', letter: 'C', text: 'Apenas fornecer uma lista de termos técnicos sem contextualização profissional.', isCorrect: false },
            { id: 'opt-f1-d', letter: 'D', text: 'Restringir a aprendizagem a leituras superficiais sem fixação.', isCorrect: false },
          ],
          explanation: 'O objetivo essencial é consolidar a metodologia prática com rigor conceitual para o mercado de trabalho.',
        },
        {
          id: 'q-f2',
          title: 'Sobre a aplicação de boas práticas e resolução de problemas técnicos, quais condutas são indispensáveis?',
          type: 'assertiva',
          selectionType: 'unica',
          points: 20,
          options: [
            { id: 'opt-f2-a', letter: 'A', text: 'Planejamento analítico, estruturação em etapas, validação contínua e documentação.', isCorrect: true },
            { id: 'opt-f2-b', letter: 'B', text: 'Executar tarefas sem conferir requisitos mínimos de conformidade.', isCorrect: false },
            { id: 'opt-f2-c', letter: 'C', text: 'Ignorar padrões de qualidade estabelecidos na formação.', isCorrect: false },
            { id: 'opt-f2-d', letter: 'D', text: 'Substituir processos consolidados por abordagens improvisadas.', isCorrect: false },
          ],
          explanation: 'Planejamento e validação contínua garantem a conformidade técnica e a excelência profissional.',
        },
        {
          id: 'q-f3',
          title: 'Quais pilares sustentam a segurança, integridade e consistência das soluções desenvolvidas?',
          type: 'assertiva',
          selectionType: 'unica',
          points: 20,
          options: [
            { id: 'opt-f3-a', letter: 'A', text: 'Controle de acesso rigoroso, auditoria periódica e conformidade com diretrizes técnicas.', isCorrect: true },
            { id: 'opt-f3-b', letter: 'B', text: 'Desativação de checagens de validação para economizar tempo.', isCorrect: false },
            { id: 'opt-f3-c', letter: 'C', text: 'Compartilhamento irrestrito de credenciais e permissões.', isCorrect: false },
            { id: 'opt-f3-d', letter: 'D', text: 'Armazenamento de dados sem critérios de proteção e rastreabilidade.', isCorrect: false },
          ],
          explanation: 'Segurança da informação e auditoria são requisitos inegociáveis para soluções profissionais.',
        },
        {
          id: 'q-f4',
          title: 'Na mensuração de resultados e otimização contínua, qual métrica reflete a maturidade operacional?',
          type: 'assertiva',
          selectionType: 'unica',
          points: 20,
          options: [
            { id: 'opt-f4-a', letter: 'A', text: 'Taxa de assertividade elevada, menor índice de retrabalho e entrega dentro dos parâmetros estabelecidos.', isCorrect: true },
            { id: 'opt-f4-b', letter: 'B', text: 'Aumento do tempo de resposta sem agregação de valor.', isCorrect: false },
            { id: 'opt-f4-c', letter: 'C', text: 'Ausência total de monitoramento ou métricas quantitativas.', isCorrect: false },
            { id: 'opt-f4-d', letter: 'D', text: 'Dependência de intervenções emergenciais repetitivas.', isCorrect: false },
          ],
          explanation: 'A maturidade operacional é expressa por eficiência de processos e sustentabilidade dos resultados.',
        },
        {
          id: 'q-f5',
          title: 'Em relação ao código de ética e responsabilidade do formando perante a certificação:',
          type: 'assertiva',
          selectionType: 'unica',
          points: 20,
          options: [
            { id: 'opt-f5-a', letter: 'A', text: 'Compromisso com o aprendizado contínuo, transparência e aplicação ética do conhecimento.', isCorrect: true },
            { id: 'opt-f5-b', letter: 'B', text: 'Uso indevido do certificado em áreas sem qualificação comprovada.', isCorrect: false },
            { id: 'opt-f5-c', letter: 'C', text: 'Omissão de falhas técnicas conhecidas aos clientes ou contratantes.', isCorrect: false },
            { id: 'opt-f5-d', letter: 'D', text: 'Abandono da reciclagem de conceitos perante inovações do setor.', isCorrect: false },
          ],
          explanation: 'O rigor ético e a capacitação contínua são diretrizes fundamentais da Deds Academy.',
        },
      ],
    };
  }, [course]);

  const examStorageKey = `deds_exam_result_${course.id}_${currentUser?.id || 'aluno'}`;
  const [finalExamAnswers, setFinalExamAnswers] = useState<Record<string, string[]>>({});
  const [finalExamSubmitted, setFinalExamSubmitted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(examStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.passed);
      }
    } catch (e) {
      // ignore
    }
    return false;
  });
  const [finalExamResult, setFinalExamResult] = useState<{
    scorePercent: number;
    passed: boolean;
    correctPoints: number;
    totalPoints: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem(examStorageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  });

  const handleGradeFinalExam = () => {
    let earned = 0;
    let total = 0;

    effectiveFinalExam.questions.forEach((q) => {
      const qPoints = q.points || 1;
      total += qPoints;

      const userAns = finalExamAnswers[q.id] || [];
      const correctOptIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);

      if (q.selectionType === 'multipla') {
        const isMatch =
          userAns.length === correctOptIds.length &&
          userAns.every((id) => correctOptIds.includes(id));
        if (isMatch) earned += qPoints;
      } else {
        if (userAns.length > 0 && correctOptIds.includes(userAns[0])) {
          earned += qPoints;
        }
      }
    });

    const score = total > 0 ? Math.round((earned / total) * 100) : 0;
    const minPass = effectiveFinalExam.minPassingPercent || 80;
    const isPassed = score >= minPass;

    const res = {
      scorePercent: score,
      passed: isPassed,
      correctPoints: earned,
      totalPoints: total,
    };

    setFinalExamResult(res);
    setFinalExamSubmitted(true);
    try {
      localStorage.setItem(examStorageKey, JSON.stringify(res));
    } catch (e) {
      // ignore
    }

    if (isPassed) {
      showStudyToast(`Excelente! Você atingiu ${score}% e foi aprovado na Prova Final! Certificado desbloqueado!`, 'success');
    } else {
      showStudyToast(`Aproveitamento: ${score}%. Mínimo exigido: ${minPass}%. Revise o conteúdo e realize uma nova tentativa.`, 'warning');
    }
  };

  const handleRetakeFinalExam = () => {
    setFinalExamAnswers({});
    setFinalExamSubmitted(false);
  };

  // Check if current lesson has real video
  const hasVideo = Boolean(currentLessonItem?.videoUrl && currentLessonItem.videoUrl.trim() !== '');
  const isCurrentLessonCompleted = currentLessonItem ? completedLessonIds.includes(currentLessonItem.id) : false;

  // Reset quiz states when changing lesson
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  }, [selectedLessonId]);

  // Synchronize on course or progress change
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
      }
    }
  }, [course?.id, isOpen]);

  // Padlock & sequential permission check
  // Module 0 / Lesson 0 is unlocked.
  // Lesson N is unlocked if Lesson N-1 is in completedLessonIds.
  const isLessonUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevLesson = allLessons[index - 1];
    return prevLesson ? completedLessonIds.includes(prevLesson.id) : false;
  };

  // Module lock status: Module is unlocked if its first lesson is unlocked
  const isModuleUnlocked = (modIndex: number) => {
    if (modIndex === 0) return true;
    const firstLessonOfMod = allLessons.find((l) => l.moduleIndex === modIndex);
    if (!firstLessonOfMod) return false;
    return isLessonUnlocked(firstLessonOfMod.globalIndex);
  };

  // Module completion status: all lessons in the module are completed
  const isModuleCompleted = (modId: string) => {
    const modLessons = allLessons.filter((l) => l.moduleId === modId);
    if (modLessons.length === 0) return false;
    return modLessons.every((l) => completedLessonIds.includes(l.id));
  };

  // Handle clicking on a module or lesson from the list
  const handleOpenLesson = (lesson: typeof allLessons[0]) => {
    if (!isLessonUnlocked(lesson.globalIndex)) {
      showStudyToast(
        `Etapa bloqueada! Conclua as lições anteriores para liberar "${lesson.title}".`,
        'warning'
      );
      return;
    }
    setSelectedLessonId(lesson.id);
    setActiveView('reading');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle clicking on a module card directly
  const handleOpenModule = (modIndex: number, mod: CourseModule) => {
    const unlocked = isModuleUnlocked(modIndex);
    if (!unlocked) {
      showStudyToast(
        `O "${mod.title}" está bloqueado! Conclua os módulos anteriores para liberar o acesso.`,
        'warning'
      );
      return;
    }
    const firstLessonOfMod = allLessons.find((l) => l.moduleId === mod.id);
    if (firstLessonOfMod) {
      setSelectedLessonId(firstLessonOfMod.id);
      setActiveView('reading');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Progress percentage
  const progressPercent = totalLessonsCount > 0
    ? Math.round((completedLessonIds.length / totalLessonsCount) * 100)
    : 0;

  // Handle Quiz Grading
  const handleGradeQuiz = (quiz: ModuleQuiz) => {
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
    setQuizSubmitted(true);

    if (isPassed) {
      showStudyToast(`Parabéns! Você atingiu ${score}% e foi aprovado no questionário!`, 'success');
    } else {
      showStudyToast(`Nota obtida: ${score}%. A nota mínima é ${passing}%. Revise o conteúdo e tente novamente.`, 'warning');
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  // Check if current lesson has an active unpassed quiz
  const currentQuiz = currentLessonItem?.quiz && currentLessonItem.quiz.enabled !== false && currentLessonItem.quiz.questions?.length > 0
    ? currentLessonItem.quiz
    : null;

  const requiresQuizPass = Boolean(currentQuiz && (!quizSubmitted || (quizResult && !quizResult.passed)) && !isCurrentLessonCompleted);

  // Handle Advancing / Completing current lesson
  const handleAdvanceLesson = () => {
    if (!currentLessonItem) return;

    if (requiresQuizPass) {
      showStudyToast(
        'Você deve responder e ser aprovado no questionário de fixação antes de avançar.',
        'warning'
      );
      return;
    }

    // Mark current lesson as completed
    const isAlreadyMarked = completedLessonIds.includes(currentLessonItem.id);
    let nextCompletedIds = completedLessonIds;
    if (!isAlreadyMarked) {
      nextCompletedIds = [...completedLessonIds, currentLessonItem.id];
      setCompletedLessonIds(nextCompletedIds);
    }

    // Call parent handler to update student progress
    onCompleteLesson(course.id, currentLessonItem.id, currentLessonItem.title);

    // Check if this was the last lesson
    const isLastLesson = currentLessonIndex === totalLessonsCount - 1;

    if (isLastLesson) {
      if (finalExamResult && finalExamResult.passed) {
        // Direct immediately to mandatory course evaluation screen
        setActiveView('evaluation');
      } else {
        // Direct to mandatory final exam before certificate release
        setActiveView('final_exam');
        showStudyToast('Todas as lições foram concluídas! Para desbloquear o seu certificado, conclua a Prova Final Obrigatória (nota mínima: 80%).', 'info');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Unlock next lesson and advance
      const nextLesson = allLessons[currentLessonIndex + 1];
      if (nextLesson) {
        setSelectedLessonId(nextLesson.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showStudyToast(`Etapa concluída! Próximo módulo liberado com sucesso.`, 'success');
      }
    }
  };

  // Submit mandatory course review & generate certificate
  const handleSubmitReviewAndGenerateCertificate = () => {
    if (!finalExamResult || !finalExamResult.passed) {
      showStudyToast('A Prova Final é obrigatória para a emissão do certificado. Conclua a prova com nota mínima de 80%.', 'warning');
      setActiveView('final_exam');
      return;
    }

    if (selectedRating === 0) {
      showStudyToast('Por favor, selecione uma nota de 1 a 5 estrelas para avaliar o curso.', 'warning');
      return;
    }

    setIsSubmittingReview(true);

    const saved = localStorage.getItem('deds_certificates_list');
    const currentList = saved ? JSON.parse(saved) : [];
    const certCode = generateSequentialCertificateCode(currentList);

    const newReview: CourseReview = {
      id: `rev-${Date.now()}`,
      courseId: course.id,
      courseTitle: course.title,
      courseCategory: course.category,
      instructor: course.instructor,
      studentId: currentUser?.id || 'aluno-1',
      studentName: currentUser?.certificateData?.customName || currentUser?.name || 'Aluno Deds Academy',
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

    const generatedCert: CertificateItem = {
      id: `cert-${course.id}-${Date.now()}`,
      courseId: course.id,
      courseTitle: course.title,
      courseCategory: course.category,
      studentId: currentUser?.id,
      studentCode: currentUser?.studentCode,
      studentName: currentUser?.certificateData?.customName || currentUser?.name || 'Aluno Deds Academy',
      studentCpf: currentUser?.certificateData?.customCpf || currentUser?.cpf || '384.920.118-04',
      hours: course.hours,
      issueDate: new Date().toLocaleDateString('pt-BR'),
      code: certCode,
      instructor: course.instructor,
      status: 'valido',
    };

    setIssuedCertData(generatedCert);
    try {
      const saved = localStorage.getItem('deds_certificates_list');
      const currentList = saved ? JSON.parse(saved) : [];
      const filtered = currentList.filter((c: any) => !(c.courseId === course.id && c.studentId === currentUser?.id));
      const nextList = [generatedCert, ...filtered];
      localStorage.setItem('deds_certificates_list', JSON.stringify(nextList));
    } catch (e) {
      console.error('Error saving certificate', e);
    }
    if (onSaveCertificate) {
      onSaveCertificate(generatedCert);
      saveCertificateToDB(generatedCert, currentUser || undefined).catch(console.error);
    }
    setIsSubmittingReview(false);
    setActiveView('certificate_ready');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper for material styling
  const getAttachmentIcon = (type: LessonAttachment['type']) => {
    switch (type) {
      case 'word':
        return { icon: 'description', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', label: 'Documento Word (.docx)' };
      case 'excel':
        return { icon: 'table_chart', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', label: 'Planilha Excel (.xlsx)' };
      case 'pdf':
        return { icon: 'picture_as_pdf', color: 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', label: 'Arquivo PDF (.pdf)' };
      case 'powerpoint':
        return { icon: 'slideshow', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', label: 'Apresentação PowerPoint (.pptx)' };
      default:
        return { icon: 'attach_file', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800', label: 'Material de Apoio' };
    }
  };

  // Rating label helper
  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5: return 'Excelente • Superou as expectativas!';
      case 4: return 'Muito Bom • Recomendo fortemente!';
      case 3: return 'Bom • Atendeu ao que foi proposto.';
      case 2: return 'Regular • Pode melhorar em alguns pontos.';
      case 1: return 'Insatisfeito • Precisa de ajustes.';
      default: return 'Clique nas estrelas para avaliar (1 a 5)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col overflow-y-auto antialiased">
      {/* Toast Alert */}
      {toastAlert && (
        <div
          className={`fixed top-4 right-4 z-[60] max-w-md px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-semibold animate-in fade-in slide-in-from-top-4 ${
            toastAlert.type === 'warning'
              ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
              : toastAlert.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-500/20'
              : 'bg-primary text-white border-primary shadow-primary/20'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {toastAlert.type === 'warning' ? 'lock' : toastAlert.type === 'success' ? 'check_circle' : 'info'}
          </span>
          <span className="flex-1">{toastAlert.message}</span>
          <button
            type="button"
            onClick={() => setToastAlert(null)}
            className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: VISÃO GERAL DA EMENTA E LISTA DE LIÇÕES (ESTILO PRIME CURSOS)
         ========================================================================= */}
      {activeView === 'overview' && (
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Prime Cursos Style Bar */}
          <header className="w-full bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/logo.png"
                alt="Deds Academy"
                className="w-8 h-8 object-contain rounded-full shadow-[0_0_10px_rgba(0,192,160,0.3)] shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                  Deds Academy • Sala de Aula
                </span>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  Estudando: {course.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Voltar para a Área do Aluno"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                <span>Fechar</span>
              </button>
            </div>
          </header>

          {/* Notice Banner (Estilo Prime Cursos) */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40 px-4 sm:px-8 py-2 text-center text-[11px] text-amber-800 dark:text-amber-300 font-medium">
            <strong>Atenção:</strong> Este conteúdo é de autoria exclusiva da Deds Academy. O acesso e a progressão dos módulos são controlados por etapas sequenciais com verificação de aprendizado e emissão de certificado oficial.
          </div>

          <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-10 space-y-8">
            {/* 1. CABEÇALHO E IDENTIDADE DO CURSO: CAPA, CONTRACAPA E DETALHES */}
            <section className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
              {/* Contracapa / Banner Header */}
              <div className="relative w-full h-44 sm:h-56 bg-slate-900 overflow-hidden">
                <img
                  src={course.bannerImage || course.image}
                  alt={course.title}
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full gap-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-primary text-white uppercase tracking-wider">
                        {course.category}
                      </span>
                      <h2 className="text-lg sm:text-2xl font-extrabold text-white mt-1 drop-shadow-md">
                        {course.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-white/90 font-medium shrink-0">
                      <span className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                        <span className="material-symbols-outlined text-sm text-amber-400">schedule</span>
                        {course.hours} Horas
                      </span>
                      <span className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                        <span className="material-symbols-outlined text-sm text-emerald-400">person</span>
                        {course.instructor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações e Descrição / Introdução */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Apresentação &amp; Introdução da Formação
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {course.description ||
                      'Esta formação reúne conhecimentos teóricos aprofundados e diretrizes práticas aplicadas para capacitar você nas competências essenciais desta área profissional. Conclua os módulos em sequência para habilitar o questionário final e emitir o certificado oficial.'}
                  </p>
                </div>

                {/* Barra de Progresso Geral */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Seu Progresso no Curso</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{progressPercent}% Concluído</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {completedLessonIds.length} de {totalLessonsCount} etapas concluídas
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="material-symbols-outlined text-xs">lock_clock</span>
                      Acesso liberado por etapas
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. SISTEMA DE EMENTAS, MÓDULOS E BLOQUEIO POR CADEADOS */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">menu_book</span>
                    Selecione a lição que deseja estudar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Os módulos com cadeado verde estão liberados para estudo. Conclua cada etapa para abrir as seguintes.
                  </p>
                </div>

                {/* Botão de Atalho para Retomar de onde parou */}
                <button
                  type="button"
                  onClick={() => {
                    const nextLesson = allLessons.find((l) => !completedLessonIds.includes(l.id)) || allLessons[0];
                    if (nextLesson) {
                      handleOpenLesson(nextLesson);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                  <span className="hidden sm:inline">
                    {progressPercent === 100 ? 'Revisar Primeira Aula' : 'Continuar de Onde Parou'}
                  </span>
                  <span className="sm:hidden">Continuar</span>
                </button>
              </div>

              {/* Lista Vertical de Módulos / Ementas (Estilo Prime Cursos com Cadeados) */}
              <div className="space-y-2.5">
                {modules.map((mod, modIdx) => {
                  const unlocked = isModuleUnlocked(modIdx);
                  const completed = isModuleCompleted(mod.id);
                  const modLessons = allLessons.filter((l) => l.moduleId === mod.id);

                  return (
                    <div
                      key={mod.id || modIdx}
                      className={`rounded-xl border transition-all ${
                        completed
                          ? 'bg-white dark:bg-[#0F172A] border-emerald-500/40 shadow-xs'
                          : unlocked
                          ? 'bg-white dark:bg-[#0F172A] border-slate-300 dark:border-white/15 hover:border-primary/50 shadow-xs'
                          : 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 opacity-75'
                      }`}
                    >
                      {/* Linha Principal do Módulo */}
                      <div
                        onClick={() => handleOpenModule(modIdx, mod)}
                        className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 ${
                          unlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* ÍCONE DE STATUS: CADEADO VERDE (Desbloqueado) OU VERMELHO (Bloqueado) */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                              completed
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : unlocked
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/15 text-red-500 border-red-500/30'
                            }`}
                            title={
                              completed
                                ? 'Módulo concluído (Liberado)'
                                : unlocked
                                ? 'Cadeado Verde: Módulo liberado para estudo'
                                : 'Cadeado Vermelho: Módulo bloqueado'
                            }
                          >
                            <span className="material-symbols-outlined text-xl">
                              {completed
                                ? 'check_circle'
                                : unlocked
                                ? 'lock_open'
                                : 'lock'}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {modIdx + 1}º Módulo: {mod.title}
                              </span>
                              {mod.quiz && mod.quiz.enabled !== false && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hidden sm:inline">
                                  Quiz
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                              {mod.description || `${modLessons.length} aula(s) de conteúdo teórico`}
                            </span>
                          </div>
                        </div>

                        {/* Selo à Direita */}
                        <div className="flex items-center gap-2 shrink-0">
                          {completed ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">verified</span>
                              Concluído
                            </span>
                          ) : unlocked ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">play_circle</span>
                              Liberado
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">lock</span>
                              Bloqueado
                            </span>
                          )}
                          <span className="material-symbols-outlined text-slate-400 text-sm">
                            chevron_right
                          </span>
                        </div>
                      </div>

                      {/* Sub-aulas do Módulo (se houver mais de uma aula estruturada) */}
                      {modLessons.length > 1 && unlocked && (
                        <div className="px-4 pb-3 pt-1 border-t border-slate-100 dark:border-white/5 space-y-1.5 bg-slate-50/50 dark:bg-slate-950/20">
                          {modLessons.map((les, lIndex) => {
                            const isLesUnlocked = isLessonUnlocked(les.globalIndex);
                            const isLesCompleted = completedLessonIds.includes(les.id);

                            return (
                              <button
                                key={les.id}
                                type="button"
                                onClick={() => handleOpenLesson(les)}
                                className={`w-full p-2.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                  isLesCompleted
                                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    : isLesUnlocked
                                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-medium'
                                    : 'opacity-50 cursor-not-allowed text-slate-400'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="material-symbols-outlined text-sm text-emerald-500">
                                    {isLesCompleted ? 'check_circle' : 'radio_button_unchecked'}
                                  </span>
                                  <span className="truncate">
                                    Aula {lIndex + 1}: {les.title}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {les.duration || '15 min'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* BLOCO DA PROVA FINAL OBRIGATÓRIA (CRITÉRIO PARA EMISSÃO DO CERTIFICADO) */}
              <div className="mt-8 p-6 rounded-2xl border-2 transition-all shadow-md bg-white dark:bg-[#0F172A] border-amber-500/40 dark:border-amber-500/30">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      finalExamResult?.passed
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300'
                        : isAlreadyCompleted
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 animate-pulse'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-white/10'
                    }`}>
                      <span className="material-symbols-outlined text-2xl">
                        {finalExamResult?.passed ? 'verified' : isAlreadyCompleted ? 'quiz' : 'lock'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          finalExamResult?.passed
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : isAlreadyCompleted
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {finalExamResult?.passed
                            ? 'Aprovado na Prova Final'
                            : isAlreadyCompleted
                            ? 'Liberada para Realização'
                            : 'Bloqueada'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Nota de corte: {effectiveFinalExam.minPassingPercent || 80}%
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        Prova Final Obrigatória de Certificação
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                        {finalExamResult?.passed
                          ? `Parabéns! Você alcançou ${finalExamResult.scorePercent}% de aproveitamento. Todos os requisitos acadêmicos foram cumpridos.`
                          : isAlreadyCompleted
                          ? 'Todas as aulas foram concluídas! Responda à prova final para comprovar proficiência e desbloquear o certificado oficial.'
                          : `Para realizar a prova final, você precisa concluir 100% das lições do curso (${completedLessonIds.length} de ${totalLessonsCount} concluídas).`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                    {finalExamResult?.passed ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveView('final_exam');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Ver Respostas
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveView('evaluation');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">workspace_premium</span>
                          <span>Emitir Certificado</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={!isAlreadyCompleted}
                        onClick={() => {
                          if (!isAlreadyCompleted) {
                            showStudyToast('Conclua todas as lições primeiro para liberar o acesso à prova final.', 'warning');
                            return;
                          }
                          setActiveView('final_exam');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                          isAlreadyCompleted
                            ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-amber-500/20 active:scale-95'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {isAlreadyCompleted ? 'edit_document' : 'lock'}
                        </span>
                        <span>
                          {isAlreadyCompleted ? 'Fazer Prova Final Agora' : 'Prova Bloqueada'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: SALA DE LEITURA & CONTEÚDO (ESTILO PRIME CURSOS)
         ========================================================================= */}
      {activeView === 'reading' && (
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Bar com Escolher Lições, Fechar e Imprimir (Idêntico ao Prime Cursos) */}
          <header className="w-full bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-white/10 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                Estudando: {course.title}
              </span>
            </div>

            {/* Três botões oficiais Prime Cursos: Escolher Lições, Fechar, Imprimir */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveView('overview');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Voltar para a lista de lições e ementas"
              >
                <span className="material-symbols-outlined text-sm">list</span>
                <span>Escolher Lições</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sair da sala de aula"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                <span>Fechar</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/20 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Imprimir o conteúdo desta lição"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Imprimir</span>
              </button>
            </div>
          </header>

          {/* Conteúdo Principal de Leitura */}
          <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
            {/* Título e Identificação da Lição */}
            <div className="space-y-2 border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                  {currentModule?.title || `Módulo ${currentLessonItem?.moduleIndex + 1}`}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Etapa {currentLessonIndex + 1} de {totalLessonsCount}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {currentLessonItem?.title}
              </h1>
            </div>

            {/* Reprodutor de Vídeo (se houver cadastrado no ADM) */}
            {hasVideo && (
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-lg border border-slate-200 dark:border-white/10">
                {currentLessonItem.videoUrl?.includes('youtube.com') || currentLessonItem.videoUrl?.includes('youtu.be') ? (
                  <iframe
                    src={
                      currentLessonItem.videoUrl.includes('watch?v=')
                        ? currentLessonItem.videoUrl.replace('watch?v=', 'embed/')
                        : currentLessonItem.videoUrl.replace('youtu.be/', 'youtube.com/embed/')
                    }
                    title={currentLessonItem.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={currentLessonItem.videoUrl}
                    controls
                    poster={currentLessonItem.imageUrl || course.image}
                    className="w-full h-full object-contain"
                  >
                    Seu navegador não suporta reprodução deste vídeo.
                  </video>
                )}
              </div>
            )}

            {/* Imagem Ilustrativa (se cadastrada no ADM) */}
            {currentLessonItem?.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm max-h-96">
                <img
                  src={currentLessonItem.imageUrl}
                  alt={currentLessonItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Conteúdo Formato Texto / Apostila / Ementa Completa */}
            <article className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-5 bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs">
              <div className="whitespace-pre-line">
                {currentLessonItem?.description ||
                  `Seja bem-vindo(a) a esta etapa de aprendizado de "${course.title}".\n\nNesta lição, abordamos detalhadamente os principais conceitos teóricos, as metodologias de mercado e os exemplos práticos necessários para o domínio deste tópico.\n\nDedique atenção aos pontos-chave apresentados nesta apostila e aos materiais complementares anexados.`}
              </div>
            </article>

            {/* Materiais Complementares e Anexos (Word, Excel, PDF) */}
            {currentLessonItem?.attachments && currentLessonItem.attachments.length > 0 && (
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">download_for_offline</span>
                  Materiais e Arquivos Complementares ({currentLessonItem.attachments.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentLessonItem.attachments.map((att) => {
                    const style = getAttachmentIcon(att.type);
                    return (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        download={att.fileName || att.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl border flex items-center justify-between gap-3 group transition-colors bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200 dark:border-white/10"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${style.color}`}>
                            <span className="material-symbols-outlined text-lg">{style.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                              {att.name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                              {style.label} {att.fileSize ? `• ${att.fileSize}` : ''}
                            </span>
                          </div>
                        </div>

                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-base shrink-0">
                          download
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUESTIONÁRIO / QUIZ POR MÓDULO (OPCIONAL) */}
            {currentQuiz && (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-amber-300 dark:border-amber-700/50 shadow-md space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">quiz</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {currentQuiz.title || 'Questionário de Avaliação do Módulo'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Nota mínima exigida para avançar: {currentQuiz.passingScore || 70}% • {currentQuiz.questions.length} Questões
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                    Obrigatório
                  </span>
                </div>

                {/* Feedback do resultado do Quiz */}
                {quizSubmitted && quizResult && (
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                      quizResult.passed
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-2xl">
                        {quizResult.passed ? 'check_circle' : 'cancel'}
                      </span>
                      <div>
                        <p className="text-xs font-bold">
                          {quizResult.passed ? 'Aprovado no Questionário!' : 'Nota abaixo da média mínima necessária.'}
                        </p>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          Acertos: {quizResult.correctCount} de {quizResult.totalQuestions} ({quizResult.scorePercent}%).
                        </p>
                      </div>
                    </div>

                    {!quizResult.passed && (
                      <button
                        type="button"
                        onClick={handleRetakeQuiz}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        Tentar Novamente
                      </button>
                    )}
                  </div>
                )}

                {/* Lista de Questões do Quiz */}
                <div className="space-y-4">
                  {currentQuiz.questions.map((q, qIndex) => {
                    const selectedOptId = quizAnswers[q.id];

                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-3"
                      >
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {qIndex + 1}. {q.question}
                        </span>

                        <div className="space-y-2">
                          {q.options.map((opt, optIndex) => {
                            const isSelected = selectedOptId === opt.id;
                            const showFeedback = quizSubmitted;
                            const isProgrammedCorrect = opt.isCorrect;

                            let optClass = 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                            if (showFeedback) {
                              if (isProgrammedCorrect) {
                                optClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold';
                              } else if (isSelected && !isProgrammedCorrect) {
                                optClass = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300';
                              }
                            } else if (isSelected) {
                              optClass = 'border-primary bg-primary/10 text-primary font-bold';
                            }

                            return (
                              <label
                                key={opt.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${optClass}`}
                              >
                                <input
                                  type="radio"
                                  name={`quiz-${q.id}`}
                                  disabled={quizSubmitted}
                                  checked={isSelected}
                                  onChange={() => {
                                    setQuizAnswers((prev) => ({ ...prev, [q.id]: opt.id }));
                                  }}
                                  className="w-4 h-4 text-primary cursor-pointer"
                                />
                                <span className="font-mono text-slate-400">
                                  {String.fromCharCode(65 + optIndex)})
                                </span>
                                <span className="flex-1">{opt.text}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!quizSubmitted && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleGradeQuiz(currentQuiz)}
                      disabled={Object.keys(quizAnswers).length < currentQuiz.questions.length}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">fact_check</span>
                      <span>Validar Respostas do Quiz</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* BARRA FIXA / EVIDENTE AO FINAL: BOTÃO "CONTINUAR" / "CONCLUIR E PRÓXIMA ETAPA" */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mt-10">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                  Etapa Atual: {currentLessonIndex + 1} de {totalLessonsCount}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
                  {currentLessonItem?.title}
                </h4>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {currentLessonIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const prevLesson = allLessons[currentLessonIndex - 1];
                      if (prevLesson) {
                        setSelectedLessonId(prevLesson.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="px-4 py-3 rounded-xl border border-slate-300 dark:border-white/20 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    <span>Anterior</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAdvanceLesson}
                  disabled={requiresQuizPass}
                  className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                    requiresQuizPass
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                      : 'bg-primary hover:bg-emerald-600 text-white shadow-emerald-500/20 active:scale-95'
                  }`}
                  title={requiresQuizPass ? 'Responda ao questionário acima para liberar o avanço' : 'Concluir esta etapa e avançar'}
                >
                  <span className="material-symbols-outlined text-base">
                    {currentLessonIndex === totalLessonsCount - 1 ? 'workspace_premium' : 'check'}
                  </span>
                  <span>
                    {currentLessonIndex === totalLessonsCount - 1
                      ? 'Concluir Curso & Avaliar'
                      : 'Continuar / Próxima Etapa'}
                  </span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* =========================================================================
          VIEW: PROVA FINAL OBRIGATÓRIA DE CERTIFICAÇÃO
         ========================================================================= */}
      {activeView === 'final_exam' && (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
          {/* Header Superior da Prova */}
          <header className="w-full bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveView('overview');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span className="hidden sm:inline">Voltar à Ementa</span>
              </button>
              <div>
                <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider block">
                  Avaliação Oficial de Certificação
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate max-w-md sm:max-w-xl">
                  {effectiveFinalExam.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Aprovação: {effectiveFinalExam.minPassingPercent || 80}%
              </span>
            </div>
          </header>

          <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Banner Orientativo */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-700 shadow-xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-xl">fact_check</span>
                <h2 className="text-base sm:text-lg font-bold">Instruções da Prova Final</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {effectiveFinalExam.description || 'Esta avaliação final afere o domínio dos conteúdos ministrados ao longo de todos os módulos. Responda com atenção a todas as questões. Para ser aprovado e liberar a emissão do Certificado Oficial, você precisa atingir pontuação mínima de 80%.'}
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400">
                <span>• Total de Questões: <strong>{effectiveFinalExam.questions.length}</strong></span>
                <span>• Nota de Corte: <strong>{effectiveFinalExam.minPassingPercent || 80}%</strong></span>
                <span>• Tentativas: <strong>Ilimitadas</strong> (pode refazer caso não atinja a nota)</span>
              </div>
            </div>

            {/* Resultado Caso Já Tenha Sido Submetida */}
            {finalExamSubmitted && finalExamResult && (
              <div className={`p-6 rounded-2xl border-2 shadow-lg space-y-4 ${
                finalExamResult.passed
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-100'
                  : 'bg-amber-500/10 border-amber-500 text-amber-950 dark:text-amber-100'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    finalExamResult.passed ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">
                      {finalExamResult.passed ? 'emoji_events' : 'priority_high'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold">
                      {finalExamResult.passed
                        ? '🎉 Parabéns! Você foi Aprovado na Prova Final!'
                        : '⚠️ Aproveitamento Insuficiente na Prova'}
                    </h3>
                    <p className="text-xs sm:text-sm mt-1 opacity-90 leading-relaxed">
                      {finalExamResult.passed
                        ? `Você obteve ${finalExamResult.scorePercent}% de aproveitamento (${finalExamResult.correctPoints} de ${finalExamResult.totalPoints} pontos). Seu certificado foi desbloqueado com sucesso!`
                        : `Você obteve ${finalExamResult.scorePercent}% de aproveitamento (${finalExamResult.correctPoints} de ${finalExamResult.totalPoints} pontos). A nota mínima exigida para emissão do certificado é de ${effectiveFinalExam.minPassingPercent || 80}%. Revise o gabarito comentado abaixo e realize uma nova tentativa.`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRetakeFinalExam}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    <span>Tentar Novamente</span>
                  </button>
                  {finalExamResult.passed && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('evaluation');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-5 py-2.5 rounded-xl bg-primary hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">workspace_premium</span>
                      <span>Avançar para Avaliação e Emitir Certificado</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lista de Questões */}
            <div className="space-y-6">
              {effectiveFinalExam.questions.map((q, qIndex) => {
                const userSelected = finalExamAnswers[q.id] || [];
                return (
                  <div
                    key={q.id}
                    className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 shadow-sm space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-extrabold flex items-center justify-center shrink-0">
                          {qIndex + 1}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {q.selectionType === 'multipla' ? 'Múltipla Escolha' : 'Resposta Única'} • {q.points || 1} Ponto(s)
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                            {q.title}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Alternativas */}
                    <div className="space-y-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userSelected.includes(opt.id);
                        const isProgrammedCorrect = opt.isCorrect;

                        let optClass = 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-primary/40';
                        if (finalExamSubmitted) {
                          if (isProgrammedCorrect) {
                            optClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold';
                          } else if (isSelected && !isProgrammedCorrect) {
                            optClass = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300';
                          }
                        } else if (isSelected) {
                          optClass = 'border-primary bg-primary/10 text-primary font-bold';
                        }

                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-colors ${optClass} ${
                              finalExamSubmitted ? 'cursor-default' : ''
                            }`}
                          >
                            <input
                              type={q.selectionType === 'multipla' ? 'checkbox' : 'radio'}
                              name={`final-exam-q-${q.id}`}
                              disabled={finalExamSubmitted}
                              checked={isSelected}
                              onChange={() => {
                                if (finalExamSubmitted) return;
                                if (q.selectionType === 'multipla') {
                                  setFinalExamAnswers((prev) => {
                                    const current = prev[q.id] || [];
                                    const next = current.includes(opt.id)
                                      ? current.filter((id) => id !== opt.id)
                                      : [...current, opt.id];
                                    return { ...prev, [q.id]: next };
                                  });
                                } else {
                                  setFinalExamAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: [opt.id],
                                  }));
                                }
                              }}
                              className="w-4 h-4 text-primary cursor-pointer accent-primary"
                            />
                            <span className="font-mono text-slate-400 font-bold text-xs">
                              {opt.letter || String.fromCharCode(65 + optIdx)})
                            </span>
                            <span className="flex-1 leading-relaxed">{opt.text}</span>
                            {finalExamSubmitted && isProgrammedCorrect && (
                              <span className="material-symbols-outlined text-emerald-600 text-sm">
                                check_circle
                              </span>
                            )}
                            {finalExamSubmitted && isSelected && !isProgrammedCorrect && (
                              <span className="material-symbols-outlined text-red-500 text-sm">
                                cancel
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    {/* Comentário explicativo após envio */}
                    {finalExamSubmitted && q.explanation && (
                      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">lightbulb</span>
                          Comentário Pedagógico:
                        </span>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Barra de Ação Inferior */}
            {!finalExamSubmitted && (
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Respostas preenchidas: <strong>{Object.keys(finalExamAnswers).filter((k) => finalExamAnswers[k]?.length > 0).length}</strong> de <strong>{effectiveFinalExam.questions.length}</strong> questões
                </div>
                <button
                  type="button"
                  onClick={handleGradeFinalExam}
                  disabled={Object.keys(finalExamAnswers).filter((k) => finalExamAnswers[k]?.length > 0).length < effectiveFinalExam.questions.length}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">fact_check</span>
                  <span>Finalizar & Corrigir Prova Final</span>
                </button>
              </div>
            )}
          </main>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: AVALIAÇÃO FINAL OBRIGATÓRIA (FEEDBACK POR ESTRELAS)
         ========================================================================= */}
      {activeView === 'evaluation' && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 bg-slate-100 dark:bg-[#0B0F19]">
          <div className="w-full max-w-xl bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
            {/* Header Comemorativo */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto shadow-inner">
                <span className="material-symbols-outlined text-4xl text-amber-300">emoji_events</span>
              </div>
              <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-white text-emerald-800 inline-block">
                100% Concluído • Parabéns! 🎉
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold">
                Avaliação Obrigatória do Curso
              </h2>
              <p className="text-xs text-white/90 max-w-md mx-auto">
                Para emitir o seu certificado oficial com autenticação criptográfica e QR Code, avalie a formação &quot;{course.title}&quot;.
              </p>
            </div>

            {/* Formulário com Trava de Segurança */}
            {(!finalExamResult || !finalExamResult.passed) ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                  <span className="material-symbols-outlined text-3xl">lock</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Prova Final Obrigatória Pendente</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  A emissão do certificado e a avaliação de conclusão exigem aprovação prévia na Prova Final com aproveitamento mínimo de {effectiveFinalExam.minPassingPercent || 80}%.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('final_exam');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">fact_check</span>
                    <span>Realizar Prova Final Obrigatória</span>
                  </button>
                </div>
              </div>
            ) : (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Classificação por Estrelas (1 a 5) — OBRIGATÓRIO */}
              <div className="text-center space-y-2">
                <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                  Como você classifica a qualidade deste curso? <span className="text-red-500">*</span>
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
                        className={`material-symbols-outlined text-4xl transition-colors ${
                          star <= (hoverRating || selectedRating)
                            ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            : 'text-slate-300 dark:text-slate-700'
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
                    selectedRating > 0 ? 'text-amber-500' : 'text-slate-400'
                  }`}
                >
                  {getRatingLabel(hoverRating || selectedRating)}
                </p>
              </div>

              {/* Comentário / Feedback */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Comentário / Depoimento sobre o curso
                  </label>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Opcional</span>
                </div>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Escreva como foi sua experiência, o que achou da didática do instrutor e como essa formação ajudará na sua carreira..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* TRAVA DE SEGURANÇA: Botão desabilitado se selectedRating === 0 */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSubmitReviewAndGenerateCertificate}
                  disabled={selectedRating === 0 || isSubmittingReview}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                    selectedRating === 0
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-primary hover:bg-emerald-600 text-white cursor-pointer shadow-emerald-500/20 active:scale-95'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">workspace_premium</span>
                  <span>
                    {isSubmittingReview ? 'Gravando Avaliação & Emitindo...' : 'Submeter Avaliação & Liberar Certificado'}
                  </span>
                </button>

                {selectedRating === 0 && (
                  <p className="text-[11px] text-center text-red-500 font-semibold flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-xs">lock</span>
                    Trava de Segurança: A emissão do certificado fica bloqueada até o envio da avaliação por estrelas.
                  </p>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: CERTIFICADO EMITIDO COM SUCESSO & DOWNLOAD
         ========================================================================= */}
      {activeView === 'certificate_ready' && issuedCertData && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 bg-slate-100 dark:bg-[#0B0F19]">
          <div className="w-full max-w-xl bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">verified</span>
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Certificado Oficial Emitido!
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                Parabéns pela Conclusão!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
                Sua avaliação foi sincronizada com sucesso. Seu certificado de <strong>{course.title}</strong> está gerado com autenticação digital válida em todo o Brasil.
              </p>
            </div>

            {/* Código e Metadados do Certificado */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold">Código de Autenticação</span>
                <span className="font-mono font-bold text-primary">{issuedCertData.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Titular:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{issuedCertData.studentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Carga Horária:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{issuedCertData.hours} Horas</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Data de Emissão:</span>
                <span className="text-slate-700 dark:text-slate-300">{issuedCertData.issueDate}</span>
              </div>
            </div>

            {/* Botões de Download */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isGeneratingCertificatePdf}
                onClick={async () => {
                  setIsGeneratingCertificatePdf(true);
                  try {
                    await downloadCertificatePdf({
                      studentName: issuedCertData.studentName,
                      studentCpf: issuedCertData.studentCpf,
                      studentCode: issuedCertData.studentCode,
                      courseTitle: issuedCertData.courseTitle,
                      courseCategory: issuedCertData.courseCategory,
                      hours: issuedCertData.hours,
                      issueDate: issuedCertData.issueDate,
                      code: issuedCertData.code,
                      instructor: issuedCertData.instructor,
                    });
                  } catch (err) {
                    console.error('Erro ao gerar certificado PDF:', err);
                  } finally {
                    setIsGeneratingCertificatePdf(false);
                  }
                }}
                className="p-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                <span>{isGeneratingCertificatePdf ? 'Gerando PDF...' : 'Baixar PDF Oficial'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await downloadCertificatePng({
                      studentName: issuedCertData.studentName,
                      studentCpf: issuedCertData.studentCpf,
                      studentCode: issuedCertData.studentCode,
                      courseTitle: issuedCertData.courseTitle,
                      courseCategory: issuedCertData.courseCategory,
                      hours: issuedCertData.hours,
                      issueDate: issuedCertData.issueDate,
                      code: issuedCertData.code,
                      instructor: issuedCertData.instructor,
                    });
                  } catch (err) {
                    console.error('Erro ao gerar PNG:', err);
                  }
                }}
                className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-base">image</span>
                <span>Baixar Imagem PNG</span>
              </button>
            </div>

            {/* Ações Finais */}
            <div className="pt-2 flex items-center justify-between gap-3">
              {onOpenCertificateModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCertificateModal();
                  }}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  Consultar Autenticidade Oficial
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer ml-auto"
              >
                Voltar aos Meus Cursos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
