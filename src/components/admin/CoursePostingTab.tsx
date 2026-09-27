import React, { useState, useRef, useMemo } from 'react';
import { Course, Category, Instructor, CourseStatus, CourseModule, CourseFinalExam, CourseLevel } from '../../types';
import { ModuleLessonsManager } from './ModuleLessonsManager';
import { ModuleQuizManager } from './ModuleQuizManager';
import { CourseExamEditor } from './CourseExamEditor';

interface CoursePostingTabProps {
  categories: Category[];
  instructors: Instructor[];
  onAddCourse: (course: Course) => void;
  onNavigateToCourses: () => void;
}

const PRESET_COVERS = [
  { label: 'Tecnologia & IA', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80' },
  { label: 'Finanças & Negócios', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Design UI/UX', url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80' },
  { label: 'Marketing Digital', url: 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=600&auto=format&fit=crop&q=80' },
  { label: 'Liderança & RH', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80' },
];

const PRESET_BANNERS = [
  { label: 'Banner Tech Dark', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Banner Finanças & Negócios', url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Banner Minimal Studio', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Banner Design Criativo', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80' },
];

export const CoursePostingTab: React.FC<CoursePostingTabProps> = ({
  categories,
  instructors,
  onAddCourse,
  onNavigateToCourses,
}) => {
  // Step 1: Dados Gerais & Nível | Step 2: Módulos & Gestão de Aulas (Word + Mídia) | Step 3: Quizzes dos Módulos | Step 4: Prova Final Obrigatória
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [level, setLevel] = useState<CourseLevel>('Intermediário');

  const [title, setTitle] = useState('');
  const [instructorName, setInstructorName] = useState(instructors[0]?.name || 'Prof. Carlos Mendes');
  const [instructorRole, setInstructorRole] = useState(instructors[0]?.role || 'Especialista Sênior');
  const [category, setCategory] = useState(categories[0]?.name || 'Tecnologia & IA');
  const [hours, setHours] = useState(40);
  const [lessonsCount, setLessonsCount] = useState(36);
  const [originalPrice, setOriginalPrice] = useState(299.0);
  const [currentPrice, setCurrentPrice] = useState(179.9);
  
  // Foto da Capa
  const [imageUrl, setImageUrl] = useState(PRESET_COVERS[0].url);
  const [imageFileName, setImageFileName] = useState('');
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Banner de Destaque
  const [bannerImageUrl, setBannerImageUrl] = useState(PRESET_BANNERS[0].url);
  const [bannerFileName, setBannerFileName] = useState('');
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Badge configuration: 'auto_launch' (default - 1 month auto-expiry), 'custom', or 'none'
  const [badgeMode, setBadgeMode] = useState<'auto_launch' | 'custom' | 'none'>('auto_launch');
  const [badgeText, setBadgeText] = useState('Novo Lançamento');

  // Video import state (Upload file or direct URL)
  const [videoSourceType, setVideoSourceType] = useState<'upload' | 'url'>('upload');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFileName, setVideoFileName] = useState('');
  const [videoFileSize, setVideoFileSize] = useState('');
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<CourseStatus>('publicado');
  const [lastSavedStatus, setLastSavedStatus] = useState<CourseStatus>('publicado');
  const [description, setDescription] = useState(
    'Formação prática estruturada para preparar o aluno para as demandas reais do mercado de trabalho, com certificado válido para horas complementares.'
  );

  // Auto-launch expiration date calculation (30 days / 1 month)
  const autoExpiryDateFormatted = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('pt-BR');
  }, []);

  // Dynamic syllabus modules builder (Step 1)
  const [syllabusModules, setSyllabusModules] = useState<string[]>([
    'Módulo 1: Fundamentos & Metodologia Aplicada',
    'Módulo 2: Exercícios Práticos e Ferramentas do Mercado',
    'Módulo 3: Projeto Final & Emissão de Certificado Oficial',
  ]);
  const [newModuleText, setNewModuleText] = useState('');

  // Structured Course Modules with Lessons, Materials and Quizzes (Step 2)
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);

  // Mandatory Course Final Exam with 80% passing grade for certification (Step 3)
  const [courseExam, setCourseExam] = useState<CourseFinalExam | undefined>(undefined);

  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // Handle Video file upload
  const handleVideoFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecione um arquivo de vídeo válido (.mp4, .webm, .mov, etc.)');
      return;
    }
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setVideoFileName(file.name);
    setVideoFileSize(`${sizeMb} MB`);
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setVideoSourceType('upload');
  };

  const handleCoverFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setImageFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida (PNG, JPG, WebP) para o banner.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBannerImageUrl(reader.result);
        setBannerFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveVideo = () => {
    setVideoUrl('');
    setVideoFileName('');
    setVideoFileSize('');
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleAddModule = () => {
    if (!newModuleText.trim()) return;
    setSyllabusModules([...syllabusModules, newModuleText.trim()]);
    setNewModuleText('');
  };

  const handleRemoveModule = (index: number) => {
    setSyllabusModules(syllabusModules.filter((_, i) => i !== index));
  };

  const handleInstructorChange = (selectedName: string) => {
    setInstructorName(selectedName);
    const found = instructors.find((i) => i.name === selectedName);
    if (found) {
      setInstructorRole(found.role);
    }
  };

  const handleProceedToModules = () => {
    if (!title.trim()) {
      alert('Por favor, informe o título do curso antes de prosseguir para os módulos.');
      return;
    }

    // Synchronize courseModules with syllabusModules entered in Step 1
    const effectiveSyllabus = syllabusModules.length > 0
      ? syllabusModules
      : ['Módulo 1: Fundamentos & Metodologia Aplicada', 'Módulo 2: Exercícios Práticos e Ferramentas do Mercado'];

    const existingMap = new Map(courseModules.map((m) => [m.title, m]));
    const synchronized: CourseModule[] = effectiveSyllabus.map((modTitle, idx) => {
      if (existingMap.has(modTitle)) {
        return existingMap.get(modTitle)!;
      }
      return {
        id: `mod-${Date.now()}-${idx}`,
        title: modTitle,
        lessons: [
          {
            id: `lesson-${Date.now()}-${idx}-1`,
            title: `Aula 1: Introdução ao ${modTitle.split(':')[0] || 'Módulo'}`,
            description: `Fundamentos essenciais, objetivos de estudo e diretrizes práticas para ${modTitle}.`,
            duration: '15 min',
            attachments: [],
          },
        ],
      };
    });

    setCourseModules(synchronized);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (
    e?: React.FormEvent,
    forcedStatus?: CourseStatus,
    modulesData?: CourseModule[],
    examData?: CourseFinalExam
  ) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, informe o título do curso.');
      return;
    }

    const finalStatus: CourseStatus = forcedStatus || status;
    setLastSavedStatus(finalStatus);

    const isAutoLaunch = badgeMode === 'auto_launch';
    const finalBadgeText =
      badgeMode === 'none' ? '' : isAutoLaunch ? 'Novo Lançamento' : badgeText.trim();
    const expiryIso = isAutoLaunch
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const activeModules = modulesData || (courseModules.length > 0 ? courseModules : undefined);
    const calculatedTotalLessons = activeModules?.reduce((acc, m) => acc + m.lessons.length, 0) || 0;
    const activeExam = examData || courseExam;

    const newCourse: Course = {
      id: `curso-${Date.now()}`,
      title: title.trim(),
      instructor: instructorName,
      instructorRole: instructorRole,
      category,
      level: level,
      hours: Number(hours),
      lessonsCount: calculatedTotalLessons > 0 ? calculatedTotalLessons : Number(lessonsCount),
      originalPrice: Number(originalPrice),
      currentPrice: Number(currentPrice),
      image: imageUrl || PRESET_COVERS[0].url,
      imageFileName: imageFileName || undefined,
      bannerImage: bannerImageUrl || imageUrl || PRESET_BANNERS[0].url,
      bannerFileName: bannerFileName || undefined,
      rating: 5.0,
      reviewsCount: 1,
      badge: {
        text: finalBadgeText,
        variant: 'emerald',
        expiresAt: expiryIso,
      },
      filterTags: isAutoLaunch
        ? ['Novos', 'Com Certificação', 'Lançamento']
        : ['Com Certificação', ...(finalBadgeText ? [finalBadgeText] : [])],
      description: description.trim(),
      syllabus: activeModules && activeModules.length > 0
        ? activeModules.map((m) => m.title)
        : (syllabusModules.length > 0 ? syllabusModules : ['Módulo 1: Introdução Geral', 'Módulo 2: Certificação Oficial']),
      modules: activeModules,
      finalExam: activeExam,
      status: finalStatus,
      studentsCount: 0,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      publishedAt: new Date().toISOString(),
      isAutoLaunchBadge: isAutoLaunch,
      videoUrl: videoUrl || undefined,
      videoFileName: videoFileName || undefined,
      videoType: videoUrl ? videoSourceType : undefined,
    };

    onAddCourse(newCourse);
    setPublishedSuccess(true);
  };

  const handleResetForm = () => {
    setTitle('');
    setHours(40);
    setLessonsCount(36);
    setOriginalPrice(299.0);
    setCurrentPrice(179.9);
    setBadgeMode('auto_launch');
    setBadgeText('Novo Lançamento');
    setVideoUrl('');
    setVideoFileName('');
    setVideoFileSize('');
    setImageUrl(PRESET_COVERS[0].url);
    setStatus('publicado');
    setCurrentStep(1);
    setCourseModules([]);
    setPublishedSuccess(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">add_box</span>
              Postagem &amp; Criação de Cursos
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary">
              Estúdio de Publicação
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Cadastre novas formações com ementa modular, precificação e liberação imediata no catálogo.
          </p>
        </div>

        <button
          onClick={onNavigateToCourses}
          className="px-4 py-2 rounded-xl bg-surface-raised hover:bg-surface-overlay border border-border-subtle text-xs font-bold text-text-primary transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">auto_stories</span>
          Ir para Gestão de Cursos
        </button>
      </div>

      {publishedSuccess ? (
        <div className={`p-8 rounded-2xl bg-surface-raised border shadow-lg text-center max-w-xl mx-auto space-y-4 ${
          lastSavedStatus === 'rascunho' ? 'border-sky-500/40' : 'border-accent-emerald-bright/40'
        }`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
            lastSavedStatus === 'rascunho' ? 'bg-sky-500/15 text-sky-400' : 'bg-accent-emerald-bright/10 text-accent-emerald-bright'
          }`}>
            <span className="material-symbols-outlined text-4xl">
              {lastSavedStatus === 'rascunho' ? 'draft' : 'check_circle'}
            </span>
          </div>
          <h3 className="text-lg font-bold text-text-primary">
            {lastSavedStatus === 'rascunho' ? 'Curso Salvo como Rascunho!' : 'Curso Publicado com Sucesso!'}
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            {lastSavedStatus === 'rascunho' ? (
              <>
                O curso <strong className="text-text-primary">"{title}"</strong> foi salvo com status <span className="font-bold text-sky-400">Rascunho (azul claro)</span>. Ele está disponível na gestão de cursos para edições antes de ir à vitrine.
              </>
            ) : (
              <>
                O curso <strong className="text-text-primary">"{title}"</strong> foi registrado e já está sincronizado com a vitrine pública e a área administrativa.
              </>
            )}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleResetForm}
              className="px-4 py-2.5 rounded-xl bg-surface-overlay text-text-secondary hover:text-text-primary text-xs font-bold cursor-pointer"
            >
              Criar Outro Curso
            </button>
            <button
              onClick={onNavigateToCourses}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all ${
                lastSavedStatus === 'rascunho'
                  ? 'bg-sky-500 hover:bg-sky-400 text-white'
                  : 'bg-primary-container hover:bg-accent-emerald-bright text-on-primary'
              }`}
            >
              Ver na Gestão de Cursos
            </button>
          </div>
        </div>
      ) : currentStep === 4 ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-surface-raised border border-border-subtle rounded-2xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-overlay flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-accent-emerald-bright/20 text-accent-emerald-bright flex items-center justify-center text-[10px]">✓</span>
              <span>1. Informações Básicas &amp; Nível</span>
            </button>
            <span className="material-symbols-outlined text-text-tertiary text-sm shrink-0">arrow_forward</span>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-overlay flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-accent-emerald-bright/20 text-accent-emerald-bright flex items-center justify-center text-[10px]">✓</span>
              <span>2. Módulos &amp; Aulas ({courseModules.reduce((acc, m) => acc + m.lessons.length, 0)} aulas)</span>
            </button>
            <span className="material-symbols-outlined text-text-tertiary text-sm shrink-0">arrow_forward</span>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-overlay flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-accent-emerald-bright/20 text-accent-emerald-bright flex items-center justify-center text-[10px]">✓</span>
              <span>3. Quizzes dos Módulos</span>
            </button>
            <span className="material-symbols-outlined text-text-tertiary text-sm shrink-0">arrow_forward</span>
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500 text-black shadow-xs flex items-center gap-2 cursor-default shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-black/20 text-black flex items-center justify-center text-[10px] font-black">4</span>
              <span>4. Prova Final Obrigatória (80% p/ Certificado)</span>
            </button>
          </div>

          <CourseExamEditor
            courseTitle={title || 'Curso em Criação'}
            initialExam={courseExam}
            onBackToQuizzes={() => {
              setCurrentStep(3);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSaveDraft={(exam) => {
              setCourseExam(exam);
              handleSubmit(undefined, 'rascunho', courseModules, exam);
            }}
            onPublishExam={(exam) => {
              setCourseExam(exam);
              handleSubmit(undefined, 'publicado', courseModules, exam);
            }}
          />
        </div>
      ) : currentStep === 3 ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-surface-raised border border-border-subtle rounded-2xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-overlay flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-accent-emerald-bright/20 text-accent-emerald-bright flex items-center justify-center text-[10px]">✓</span>
              <span>1. Informações Básicas &amp; Nível</span>
            </button>
            <span className="material-symbols-outlined text-text-tertiary text-sm shrink-0">arrow_forward</span>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-overlay flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-accent-emerald-bright/20 text-accent-emerald-bright flex items-center justify-center text-[10px]">✓</span>
              <span>2. Módulos &amp; Aulas ({courseModules.reduce((acc, m) => acc + m.lessons.length, 0)} aulas)</span>
            </button>
            <span className="material-symbols-outlined text-text-tertiary text-sm shrink-0">arrow_forward</span>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-on-primary shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">3</span>
              <span>3. Quizzes dos Módulos</span>
            </button>
            <span className="material-symbols-outlined text-text-tertiary text-sm shrink-0">arrow_forward</span>
            <button
              type="button"
              onClick={() => {
                setCurrentStep(4);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">4</span>
              <span>4. Prova Final Obrigatória</span>
            </button>
          </div>

          <ModuleQuizManager
            courseTitle={title || 'Curso em Criação'}
            modules={courseModules}
            onChangeModules={(mods) => setCourseModules(mods)}
            onBackToLessons={() => {
              setCurrentStep(2);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSaveDraft={() => handleSubmit(undefined, 'rascunho', courseModules)}
            onProceedToFinalExam={() => {
              setCurrentStep(4);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      ) : currentStep === 2 ? (
        <div className="space-y-6">
          {/* Stepper Navigation Indicator */}
          <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-surface-raised border border-border-subtle rounded-2xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-overlay flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-accent-emerald-bright/20 text-accent-emerald-bright flex items-center justify-center text-[10px]">
                ✓
              </span>
              <span>1. Informações Básicas &amp; Nível</span>
            </button>

            <span className="material-symbols-outlined text-text-tertiary text-sm shrink-0">arrow_forward</span>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-on-primary shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">2</span>
              <span>2. Módulos &amp; Gestão de Aulas ({courseModules.reduce((acc, m) => acc + m.lessons.length, 0)} aulas)</span>
            </button>

            <span className="material-symbols-outlined text-text-tertiary text-sm shrink-0">arrow_forward</span>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-overlay flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-surface-overlay border border-border-subtle text-text-tertiary flex items-center justify-center text-[10px]">3</span>
              <span>3. Quizzes dos Módulos</span>
            </button>

            <span className="material-symbols-outlined text-text-tertiary text-sm shrink-0">arrow_forward</span>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(4);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">4</span>
              <span>4. Prova Final Obrigatória (80% p/ Certificado)</span>
            </button>
          </div>

          <ModuleLessonsManager
            courseTitle={title}
            modules={courseModules}
            onChangeModules={(mods) => setCourseModules(mods)}
            onBackToBasicInfo={() => setCurrentStep(1)}
            onSaveDraft={() => handleSubmit(undefined, 'rascunho', courseModules)}
            onProceedToQuizzes={() => {
              setCurrentStep(3);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stepper Navigation Indicator */}
          <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-surface-raised border border-border-subtle rounded-2xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-on-primary shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">1</span>
              <span>1. Informações Básicas &amp; Nível</span>
            </button>

            <span className="material-symbols-outlined text-text-tertiary text-sm shrink-0">arrow_forward</span>

            <button
              type="button"
              onClick={handleProceedToModules}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-overlay flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-surface-overlay border border-border-subtle text-text-tertiary flex items-center justify-center text-[10px]">2</span>
              <span>2. Módulos &amp; Gestão de Aulas ({courseModules.reduce((acc, m) => acc + m.lessons.length, 0)} aulas)</span>
            </button>

            <span className="material-symbols-outlined text-text-tertiary text-sm shrink-0">arrow_forward</span>

            <button
              type="button"
              onClick={() => {
                if (!title.trim()) {
                  alert('Por favor, informe o título do curso antes de prosseguir.');
                  return;
                }
                setCurrentStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-overlay flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-surface-overlay border border-border-subtle text-text-tertiary flex items-center justify-center text-[10px]">3</span>
              <span>3. Quizzes dos Módulos</span>
            </button>

            <span className="material-symbols-outlined text-text-tertiary text-sm shrink-0">arrow_forward</span>

            <button
              type="button"
              onClick={() => {
                if (!title.trim()) {
                  alert('Por favor, informe o título do curso antes de prosseguir.');
                  return;
                }
                setCurrentStep(4);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:text-amber-400 hover:bg-amber-500/10 flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span className="w-5 h-5 rounded-full bg-surface-overlay border border-border-subtle text-text-tertiary flex items-center justify-center text-[10px]">4</span>
              <span>4. Prova Final Obrigatória (80% p/ Certificado)</span>
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleProceedToModules(); }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Core Details */}
            <div className="lg:col-span-8 bg-surface-raised p-6 rounded-2xl border border-border-subtle shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider pb-2 border-b border-border-subtle">
                1. Informações Básicas do Curso
              </h3>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Título Completo do Curso <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Formação Completa em Inteligência Artificial & Engenharia de Prompts"
                  className="w-full px-4 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Categoria <span className="text-status-danger">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Instrutor Responsável <span className="text-status-danger">*</span>
                  </label>
                  <select
                    value={instructorName}
                    onChange={(e) => handleInstructorChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary cursor-pointer"
                  >
                    {instructors.map((inst) => (
                      <option key={inst.id} value={inst.name}>
                        {inst.name} ({inst.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Titulação / Cargo do Instrutor
                  </label>
                  <input
                    type="text"
                    value={instructorRole}
                    onChange={(e) => setInstructorRole(e.target.value)}
                    placeholder="Ex: Especialista em Machine Learning & Big Data"
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>

                {/* Badge Promocional with Automatic 1-month Launch */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-text-secondary">
                      Badge Promocional
                    </label>
                    <span className="text-[11px] font-semibold text-accent-emerald-bright flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">rocket_launch</span>
                      Lançamento Automático
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 p-1 bg-surface-overlay rounded-xl border border-border-subtle">
                    <button
                      type="button"
                      onClick={() => {
                        setBadgeMode('auto_launch');
                        setBadgeText('Novo Lançamento');
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        badgeMode === 'auto_launch'
                          ? 'bg-primary-container text-on-primary shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">rocket_launch</span>
                      <span>1 Mês (Auto)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBadgeMode('custom')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        badgeMode === 'custom'
                          ? 'bg-primary-container text-on-primary shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">edit_note</span>
                      <span>Personalizado</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBadgeMode('none')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        badgeMode === 'none'
                          ? 'bg-primary-container text-on-primary shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">block</span>
                      <span>Sem Badge</span>
                    </button>
                  </div>

                  {badgeMode === 'auto_launch' && (
                    <div className="p-2 rounded-xl bg-accent-emerald-bright/10 border border-accent-emerald-bright/30 text-xs flex items-start gap-2 text-accent-emerald-bright">
                      <span className="material-symbols-outlined text-base shrink-0 mt-0.5">verified</span>
                      <div>
                        <p className="font-bold">Selo "Novo Lançamento" ativo por 1 mês</p>
                        <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                          O selo fica ativo automaticamente até <strong>{autoExpiryDateFormatted}</strong>. Após completado 1 mês da publicação, sai automaticamente do catálogo.
                        </p>
                      </div>
                    </div>
                  )}

                  {badgeMode === 'custom' && (
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="Ex: Mais vendido, Em alta, Edição Limitada"
                      className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Descrição e Objetivos de Aprendizagem
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Apresente um resumo do conteúdo, benefícios para a carreira e público-alvo..."
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              {/* FOTO DA CAPA DO CURSO */}
              <div className="pt-3 border-t border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">photo_library</span>
                      Foto da Capa do Curso (Card &amp; Catálogo)
                    </label>
                    <p className="text-[11px] text-text-tertiary">
                      Exibida no card do catálogo e na listagem de cursos
                    </p>
                  </div>
                  {imageFileName && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-overlay border border-border-subtle text-text-tertiary truncate max-w-[140px]">
                      {imageFileName}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-5">
                    <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-primary/40 shadow-sm bg-black">
                      <img
                        src={imageUrl}
                        alt="Capa do Curso"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PRESET_COVERS[0].url;
                        }}
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                        Capa Oficial
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-7 space-y-2.5">
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleCoverFileChange(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      <span>Importar Capa do Computador</span>
                    </button>

                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImageFileName('');
                      }}
                      placeholder="Ou informe link direto da imagem..."
                      className="w-full px-3 py-1.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
                    />

                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[10px] text-text-tertiary block w-full">Capas rápidas:</span>
                      {PRESET_COVERS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setImageUrl(preset.url);
                            setImageFileName('');
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] transition-all border cursor-pointer ${
                            imageUrl === preset.url
                              ? 'bg-primary/20 border-primary text-primary font-bold'
                              : 'bg-surface-overlay border-border-subtle text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BANNER DE DESTAQUE DO CURSO */}
              <div className="pt-3 border-t border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-amber-400 text-base">panorama</span>
                      Banner de Destaque (Widescreen / Topo do Curso)
                    </label>
                    <p className="text-[11px] text-text-tertiary">
                      Exibido no topo do curso na área de detalhes e sala de aula
                    </p>
                  </div>
                  {bannerFileName && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-overlay border border-border-subtle text-text-tertiary truncate max-w-[140px]">
                      {bannerFileName}
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div className="relative aspect-[21/9] sm:aspect-[24/9] rounded-xl overflow-hidden border-2 border-amber-500/40 shadow-sm bg-black">
                    <img
                      src={bannerImageUrl || imageUrl}
                      alt="Banner de Destaque"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PRESET_BANNERS[0].url;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-black uppercase">
                        Banner de Destaque
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <input
                      ref={bannerFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleBannerFileChange(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    <div className="sm:col-span-5">
                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">upload_file</span>
                        <span>Importar Banner do Computador</span>
                      </button>
                    </div>

                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        value={bannerImageUrl}
                        onChange={(e) => {
                          setBannerImageUrl(e.target.value);
                          setBannerFileName('');
                        }}
                        placeholder="Ou cole a URL do banner..."
                        className="w-full px-3 py-1.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className="text-[10px] text-text-tertiary block w-full">Banners rápidos:</span>
                    {PRESET_BANNERS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setBannerImageUrl(preset.url);
                          setBannerFileName('');
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] transition-all border cursor-pointer ${
                          bannerImageUrl === preset.url
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                            : 'bg-surface-overlay border-border-subtle text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Option to Import Video for Course */}
              <div className="pt-3 border-t border-border-subtle space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">video_library</span>
                      Vídeo de Apresentação / Aula Demonstrativa (Opcional)
                    </label>
                    <p className="text-[11px] text-text-tertiary">
                      Importe um arquivo de vídeo do seu computador ou informe um link do YouTube / Vimeo
                    </p>
                  </div>

                  {/* Mode switcher tabs */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-overlay border border-border-subtle self-start">
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('upload')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        videoSourceType === 'upload'
                          ? 'bg-primary-container text-on-primary shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">upload_file</span>
                      <span>Importar Arquivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('url')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        videoSourceType === 'url'
                          ? 'bg-primary-container text-on-primary shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">link</span>
                      <span>Link / URL</span>
                    </button>
                  </div>
                </div>

                {/* Upload File Mode */}
                {videoSourceType === 'upload' && (
                  <div>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleVideoFileChange(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {!videoUrl ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsVideoDragging(true);
                        }}
                        onDragLeave={() => setIsVideoDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsVideoDragging(false);
                          if (e.dataTransfer.files?.[0]) {
                            handleVideoFileChange(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => videoInputRef.current?.click()}
                        className={`p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                          isVideoDragging
                            ? 'border-primary bg-primary/10 scale-[1.01]'
                            : 'border-border-subtle hover:border-primary/50 bg-surface-overlay hover:bg-surface-overlay/80'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl">movie</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-primary">
                            Clique para importar ou arraste o arquivo de vídeo
                          </p>
                          <p className="text-[11px] text-text-tertiary mt-0.5">
                            Formatos aceitos: MP4, WebM, MOV, MKV
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-surface-raised border border-border-subtle text-[11px] font-bold text-text-secondary hover:text-text-primary">
                          Importar Vídeo do Computador
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-accent-emerald-bright/15 text-accent-emerald-bright flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-text-primary truncate">
                                {videoFileName || 'Vídeo importado'}
                              </p>
                              {videoFileSize && (
                                <p className="text-[10px] text-text-tertiary font-mono">{videoFileSize}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => videoInputRef.current?.click()}
                              className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface-overlay border border-border-subtle text-[11px] font-bold text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                            >
                              Trocar Vídeo
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveVideo}
                              className="px-2.5 py-1 rounded-lg bg-status-danger/10 hover:bg-status-danger/20 border border-status-danger/30 text-[11px] font-bold text-status-danger cursor-pointer transition-colors"
                            >
                              Remover
                            </button>
                          </div>
                        </div>

                        {/* Video Preview Player */}
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border-subtle shadow-md max-h-56">
                          <video
                            src={videoUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* URL Link Mode */}
                {videoSourceType === 'url' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => {
                          setVideoUrl(e.target.value);
                          setVideoFileName(e.target.value ? 'Vídeo externo via Link' : '');
                        }}
                        placeholder="Ex: https://www.youtube.com/watch?v=... ou https://.../trailer.mp4"
                        className="flex-1 px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                      />
                      {videoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveVideo}
                          className="px-3 py-2 rounded-xl bg-status-danger/10 hover:bg-status-danger/20 border border-status-danger/30 text-xs font-bold text-status-danger cursor-pointer"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    {videoUrl && (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border-subtle shadow-md max-h-52">
                        {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={
                              videoUrl.includes('watch?v=')
                                ? videoUrl.replace('watch?v=', 'embed/')
                                : videoUrl.replace('youtu.be/', 'youtube.com/embed/')
                            }
                            title="Preview do Vídeo"
                            className="w-full h-full"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={videoUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Syllabus Builder */}
              <div className="pt-3 border-t border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Ementa &amp; Módulos Programáticos ({syllabusModules.length})
                  </label>
                  <span className="text-[11px] text-text-tertiary">Aparecerão no verso do certificado e detalhes</span>
                </div>

                <div className="space-y-2">
                  {syllabusModules.map((mod, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-overlay border border-border-subtle text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="text-text-primary font-medium">{mod}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveModule(idx)}
                        className="text-text-tertiary hover:text-status-danger transition-colors cursor-pointer"
                        title="Remover módulo"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newModuleText}
                    onChange={(e) => setNewModuleText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddModule();
                      }
                    }}
                    placeholder="Ex: Módulo 4: Deploy de Modelos em Nuvem com Docker..."
                    className="flex-1 px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="px-4 py-2 bg-surface-overlay hover:bg-surface-container text-text-primary text-xs font-bold rounded-xl border border-border-subtle transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Pricing, Hours & Controls */}
            <div className="lg:col-span-4 space-y-6">
              {/* Carga Horária, Preço & Ações */}
              <div className="bg-surface-raised p-6 rounded-2xl border border-border-subtle shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                    2. Carga Horária &amp; Preço
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-emerald-bright/10 text-accent-emerald-bright border border-accent-emerald-bright/20">
                    Definições
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      Carga Horária (h)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      Qtd. de Aulas
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={lessonsCount}
                      onChange={(e) => setLessonsCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      Preço Original (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      Preço com Desconto (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={currentPrice}
                      onChange={(e) => setCurrentPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                {/* Botão de Opções para Níveis do Curso (Básico, Intermediário, Avançado, Dedicado, etc.) */}
                <div className="space-y-2 pt-1 border-t border-border-subtle/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-sm">signal_cellular_alt</span>
                      <span>Nível do Curso</span>
                      <span className="text-primary font-black">*</span>
                    </label>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {level}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'Básico', label: 'Básico', icon: 'school', desc: 'Iniciante / Fundamentos' },
                      { id: 'Intermediário', label: 'Intermediário', icon: 'trending_up', desc: 'Prático e Aplicado' },
                      { id: 'Avançado', label: 'Avançado', icon: 'psychology', desc: 'Aprofundamento' },
                      { id: 'Dedicado', label: 'Dedicado', icon: 'star', desc: 'Imersão / Mentoria' },
                    ].map((lvl) => {
                      const isSelected = level === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setLevel(lvl.id as CourseLevel)}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-0.5 ${
                            isSelected
                              ? 'bg-primary/15 border-primary text-primary shadow-xs ring-1 ring-primary/30'
                              : 'bg-surface-overlay border-border-subtle text-text-secondary hover:border-border-subtle/80 hover:text-text-primary'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">{lvl.icon}</span>
                            <span className="text-xs font-bold">{lvl.label}</span>
                          </div>
                          <span className="text-[9px] text-text-tertiary leading-tight">{lvl.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dropdown selector for extended levels if user prefers */}
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as CourseLevel)}
                    className="w-full px-3 py-1.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer mt-1"
                  >
                    <option value="Básico">Nível: Básico (Iniciante)</option>
                    <option value="Intermediário">Nível: Intermediário (Prático)</option>
                    <option value="Avançado">Nível: Avançado (Técnico)</option>
                    <option value="Dedicado">Nível: Dedicado (Imersão Intensiva)</option>
                    <option value="Especialista">Nível: Especialista (Masterclass)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CourseStatus)}
                    className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="publicado">● Publicado (verde escuro)</option>
                    <option value="rascunho">● Rascunho (azul claro)</option>
                    <option value="inativo">● Inativo (laranja)</option>
                    <option value="previsto">● Previsto (amarelo)</option>
                  </select>
                </div>

                {/* Action Buttons: Rascunho (Light Blue) and Prosseguir (Green) side-by-side */}
                <div className="pt-3 border-t border-border-subtle">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, 'rascunho')}
                      className="py-3.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Salvar como Rascunho (azul claro)"
                    >
                      <span className="material-symbols-outlined text-lg">draft</span>
                      <span>Rascunho</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleProceedToModules}
                      className="py-3.5 px-3 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Prosseguir para listar módulos programáticos e cadastrar aulas"
                    >
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      <span>Prosseguir</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
        </div>
      )}
    </div>
  );
};
