import React, { useState, useEffect, useRef } from 'react';
import { Course, Category, Instructor, CourseStatus, CourseModule } from '../../types';
import { ModuleLessonsManager } from './ModuleLessonsManager';

interface CourseEditModalProps {
  course: Course | null;
  isOpen: boolean;
  categories: Category[];
  instructors: Instructor[];
  onClose: () => void;
  onSave: (updatedCourse: Course) => void;
}

const PRESET_COVERS = [
  { label: 'Tecnologia & IA', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80' },
  { label: 'Finanças & Negócios', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Design UI/UX', url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80' },
  { label: 'Marketing Digital', url: 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=600&auto=format&fit=crop&q=80' },
  { label: 'Liderança & RH', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80' },
  { label: 'Engenharia de Dados', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80' },
];

const PRESET_BANNERS = [
  { label: 'Banner Tech Dark', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Banner Negócios & Finanças', url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Banner Minimal Studio', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Banner Criatividade & Design', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80' },
];

export const CourseEditModal: React.FC<CourseEditModalProps> = ({
  course,
  isOpen,
  categories,
  instructors,
  onClose,
  onSave,
}) => {
  if (!isOpen || !course) return null;

  // Step 1: Dados Gerais, Capa, Banner, Descrição & Ementa
  // Step 2: Módulos & Gestão Completa de Aulas
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Core fields
  const [title, setTitle] = useState(course.title || '');
  const [instructorName, setInstructorName] = useState(course.instructor || '');
  const [instructorRole, setInstructorRole] = useState(course.instructorRole || '');
  const [category, setCategory] = useState(course.category || categories[0]?.name || 'Tecnologia & IA');
  const [hours, setHours] = useState(course.hours || 40);
  const [lessonsCount, setLessonsCount] = useState(course.lessonsCount || 30);
  const [originalPrice, setOriginalPrice] = useState(course.originalPrice || 299.0);
  const [currentPrice, setCurrentPrice] = useState(course.currentPrice || 179.9);
  const [status, setStatus] = useState<CourseStatus>(course.status || 'publicado');

  // Capa do curso (Foto da capa)
  const [imageUrl, setImageUrl] = useState(course.image || PRESET_COVERS[0].url);
  const [imageFileName, setImageFileName] = useState(course.imageFileName || '');
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Banner de destaque do curso (Hero banner horizontal)
  const [bannerImageUrl, setBannerImageUrl] = useState(course.bannerImage || course.image || PRESET_BANNERS[0].url);
  const [bannerFileName, setBannerFileName] = useState(course.bannerFileName || '');
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Badge Promocional
  const initialBadgeMode = course.isAutoLaunchBadge || course.badge?.text === 'Novo Lançamento'
    ? 'auto_launch'
    : course.badge?.text
    ? 'custom'
    : 'none';
  const [badgeMode, setBadgeMode] = useState<'auto_launch' | 'custom' | 'none'>(initialBadgeMode);
  const [badgeText, setBadgeText] = useState(course.badge?.text || 'Novo Lançamento');

  // Descrição do curso
  const [description, setDescription] = useState(course.description || '');

  // Vídeo de apresentação
  const [videoSourceType, setVideoSourceType] = useState<'upload' | 'url'>(course.videoType || 'url');
  const [videoUrl, setVideoUrl] = useState(course.videoUrl || '');
  const [videoFileName, setVideoFileName] = useState(course.videoFileName || '');
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Ementa em tópicos
  const [syllabusModules, setSyllabusModules] = useState<string[]>(
    course.syllabus && course.syllabus.length > 0
      ? course.syllabus
      : ['Módulo 1: Fundamentos & Metodologia', 'Módulo 2: Projetos Práticos & Certificação']
  );
  const [newModuleText, setNewModuleText] = useState('');

  // Módulos estruturados com todas as aulas cadastradas
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);

  // Sincronizar dados quando o curso selecionado abrir
  useEffect(() => {
    if (!course) return;

    setTitle(course.title || '');
    setInstructorName(course.instructor || '');
    setInstructorRole(course.instructorRole || '');
    setCategory(course.category || categories[0]?.name || 'Tecnologia & IA');
    setHours(course.hours || 40);
    setOriginalPrice(course.originalPrice || 299.0);
    setCurrentPrice(course.currentPrice || 179.9);
    setStatus(course.status || 'publicado');

    // Capa e Banner
    setImageUrl(course.image || PRESET_COVERS[0].url);
    setImageFileName(course.imageFileName || '');
    setBannerImageUrl(course.bannerImage || course.image || PRESET_BANNERS[0].url);
    setBannerFileName(course.bannerFileName || '');

    // Descrição
    setDescription(course.description || '');

    // Vídeo
    setVideoUrl(course.videoUrl || '');
    setVideoFileName(course.videoFileName || '');
    setVideoSourceType(course.videoType || (course.videoUrl?.startsWith('blob:') ? 'upload' : 'url'));

    // Badge
    const bMode = course.isAutoLaunchBadge || course.badge?.text === 'Novo Lançamento'
      ? 'auto_launch'
      : course.badge?.text
      ? 'custom'
      : 'none';
    setBadgeMode(bMode);
    setBadgeText(course.badge?.text || 'Novo Lançamento');

    // Ementa
    const rawSyllabus = course.syllabus && course.syllabus.length > 0
      ? course.syllabus
      : ['Módulo 1: Fundamentos & Metodologia', 'Módulo 2: Projetos Práticos & Certificação'];
    setSyllabusModules(rawSyllabus);

    // Módulos e TODAS as aulas cadastradas
    if (course.modules && course.modules.length > 0) {
      setCourseModules(course.modules);
      const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
      setLessonsCount(totalLessons);
    } else {
      // Se for curso legado sem modules, estruturar automaticamente a partir do syllabus
      const synthesized: CourseModule[] = rawSyllabus.map((modTitle, idx) => ({
        id: `mod-${course.id}-${idx}`,
        title: modTitle,
        lessons: [
          {
            id: `lesson-${course.id}-${idx}-1`,
            title: `Aula 1: Introdução ao ${modTitle.split(':')[0] || 'Módulo'}`,
            description: `Conteúdo prático e direcionamento de estudos para ${modTitle}.`,
            duration: '15 min',
            attachments: [],
          },
        ],
      }));
      setCourseModules(synthesized);
      setLessonsCount(synthesized.reduce((sum, m) => sum + m.lessons.length, 0));
    }

    setCurrentStep(1);
  }, [course]);

  // Handle Cover File Upload (Foto da Capa)
  const handleCoverFileUpload = (file: File) => {
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

  // Handle Banner File Upload (Banner de Destaque)
  const handleBannerFileUpload = (file: File) => {
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

  // Handle Video File Upload
  const handleVideoFileUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecione um arquivo de vídeo válido (.mp4, .webm, etc.).');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setVideoFileName(file.name);
    setVideoSourceType('upload');
  };

  // Handle proceed to Step 2 (Módulos & Aulas)
  const handleProceedToModules = () => {
    if (!title.trim()) {
      alert('Por favor, informe o título do curso.');
      return;
    }

    // Se novos módulos foram adicionados na ementa e não estão em courseModules, sincronizar
    const existingMap = new Map(courseModules.map((m) => [m.title, m]));
    const synchronized: CourseModule[] = syllabusModules.map((modTitle, idx) => {
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
            description: `Conteúdo programático e fundamentos para ${modTitle}.`,
            duration: '15 min',
            attachments: [],
          },
        ],
      };
    });

    setCourseModules(synchronized);
    setCurrentStep(2);
  };

  // Save all modifications
  const handleSave = (forcedStatus?: CourseStatus) => {
    if (!title.trim()) {
      alert('O título do curso é obrigatório.');
      return;
    }

    const finalStatus = forcedStatus || status;
    const isAutoLaunch = badgeMode === 'auto_launch';
    const finalBadgeText = badgeMode === 'none' ? '' : isAutoLaunch ? 'Novo Lançamento' : badgeText.trim();
    const expiryIso = isAutoLaunch
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const totalCalculatedLessons = courseModules.reduce((acc, m) => acc + m.lessons.length, 0);

    const updatedCourse: Course = {
      ...course,
      title: title.trim(),
      instructor: instructorName,
      instructorRole: instructorRole,
      category,
      hours: Number(hours),
      lessonsCount: totalCalculatedLessons > 0 ? totalCalculatedLessons : Number(lessonsCount),
      originalPrice: Number(originalPrice),
      currentPrice: Number(currentPrice),
      image: imageUrl || course.image,
      imageFileName: imageFileName || undefined,
      bannerImage: bannerImageUrl || imageUrl || course.image,
      bannerFileName: bannerFileName || undefined,
      status: finalStatus,
      description: description.trim(),
      badge: {
        ...course.badge,
        text: finalBadgeText,
        variant: 'emerald',
        expiresAt: expiryIso,
      },
      filterTags: isAutoLaunch
        ? ['Novos', 'Com Certificação', 'Lançamento']
        : ['Com Certificação', ...(finalBadgeText ? [finalBadgeText] : [])],
      syllabus: courseModules.length > 0 ? courseModules.map((m) => m.title) : syllabusModules,
      modules: courseModules,
      isAutoLaunchBadge: isAutoLaunch,
      videoUrl: videoUrl || undefined,
      videoFileName: videoFileName || undefined,
      videoType: videoUrl ? videoSourceType : undefined,
    };

    onSave(updatedCourse);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200">
        {/* Modal Topbar */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-overlay">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">edit_note</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 uppercase">
                  Editar Curso
                </span>
                <span className="text-xs text-text-tertiary">ID: {course.id}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-text-primary truncate">
                {title || course.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
              title="Fechar editor"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Step Tabs Switcher */}
        <div className="px-4 py-2 bg-surface-overlay/80 border-b border-border-subtle flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              currentStep === 1
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px]">1</span>
            <span>1. Informações Básicas, Capa &amp; Banner</span>
          </button>

          <span className="material-symbols-outlined text-text-tertiary text-sm">arrow_forward</span>

          <button
            type="button"
            onClick={handleProceedToModules}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              currentStep === 2
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px]">2</span>
            <span>2. Módulos &amp; Gestão de Aulas ({courseModules.reduce((acc, m) => acc + m.lessons.length, 0)} aulas)</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {currentStep === 2 ? (
            /* STEP 2: GERENCIAMENTO DE MÓDULOS E AULAS */
            <ModuleLessonsManager
              courseTitle={title}
              modules={courseModules}
              onChangeModules={(mods) => {
                setCourseModules(mods);
                setLessonsCount(mods.reduce((acc, m) => acc + m.lessons.length, 0));
              }}
              onBackToBasicInfo={() => setCurrentStep(1)}
              onSaveDraft={() => handleSave('rascunho')}
              onFinalizePublish={() => handleSave('publicado')}
            />
          ) : (
            /* STEP 1: DADOS GERAIS, CAPA, BANNER, DESCRIÇÃO */
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (8 cols): Title, Category, Instructor, Badges, Description, Media */}
                <div className="lg:col-span-8 space-y-5">
                  {/* Título do Curso */}
                  <div className="p-4 rounded-2xl bg-surface-overlay border border-border-subtle space-y-2">
                    <label className="block text-xs font-bold text-text-secondary">
                      Título Completo do Curso <span className="text-status-danger">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Formação Completa em Inteligência Artificial & Engenharia de Prompts"
                      className="w-full px-4 py-2.5 bg-surface-raised border border-border-subtle rounded-xl text-sm font-semibold text-text-primary outline-none focus:border-primary"
                    />
                  </div>

                  {/* Categoria, Instrutor e Cargo */}
                  <div className="p-4 rounded-2xl bg-surface-overlay border border-border-subtle space-y-4">
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider pb-2 border-b border-border-subtle">
                      Identificação &amp; Instrutor
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">
                          Categoria do Catálogo
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-surface-raised border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary cursor-pointer"
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
                          Instrutor Responsável
                        </label>
                        <input
                          type="text"
                          value={instructorName}
                          onChange={(e) => setInstructorName(e.target.value)}
                          placeholder="Nome do instrutor"
                          className="w-full px-3.5 py-2.5 bg-surface-raised border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        Titulação / Cargo do Instrutor
                      </label>
                      <input
                        type="text"
                        value={instructorRole}
                        onChange={(e) => setInstructorRole(e.target.value)}
                        placeholder="Ex: Especialista Sênior em Inteligência de Dados & Cloud"
                        className="w-full px-3.5 py-2.5 bg-surface-raised border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* FOTO DA CAPA DO CURSO (Imagem Principal) */}
                  <div className="p-4 rounded-2xl bg-surface-overlay border border-border-subtle space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                      <div>
                        <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-base">photo_library</span>
                          Foto da Capa do Curso (Card &amp; Catálogo)
                        </label>
                        <p className="text-[11px] text-text-tertiary">
                          Essa imagem é exibida no card do catálogo, na vitrine e na lista de cursos do aluno
                        </p>
                      </div>
                      {imageFileName && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-raised border border-border-subtle text-text-tertiary truncate max-w-[150px]">
                          {imageFileName}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      {/* Preview da Capa */}
                      <div className="sm:col-span-5">
                        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-primary/40 shadow-md bg-black">
                          <img
                            src={imageUrl}
                            alt="Preview da Capa"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PRESET_COVERS[0].url;
                            }}
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">crop_original</span>
                            Capa Oficial
                          </div>
                        </div>
                      </div>

                      {/* Opções de Upload e URL */}
                      <div className="sm:col-span-7 space-y-3">
                        <input
                          ref={coverFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/jpg"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleCoverFileUpload(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => coverFileInputRef.current?.click()}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">cloud_upload</span>
                            <span>Importar Capa do Computador</span>
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-1">
                            Ou insira a URL da Foto da Capa:
                          </label>
                          <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => {
                              setImageUrl(e.target.value);
                              setImageFileName('');
                            }}
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
                          />
                        </div>

                        {/* Presets de capas */}
                        <div>
                          <span className="text-[10px] font-bold text-text-tertiary block mb-1.5">
                            Ou escolha uma capa predefinida:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_COVERS.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setImageUrl(preset.url);
                                  setImageFileName('');
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border cursor-pointer ${
                                  imageUrl === preset.url
                                    ? 'bg-primary/20 border-primary text-primary font-bold'
                                    : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BANNER DE DESTAQUE DO CURSO (Banner Panorâmico de Topo) */}
                  <div className="p-4 rounded-2xl bg-surface-overlay border border-border-subtle space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                      <div>
                        <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-amber-400 text-base">panorama</span>
                          Banner de Destaque do Curso (Widescreen / Topo)
                        </label>
                        <p className="text-[11px] text-text-tertiary">
                          Exibido no topo da página de detalhes e no banner de apresentação do curso
                        </p>
                      </div>
                      {bannerFileName && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-raised border border-border-subtle text-text-tertiary truncate max-w-[150px]">
                          {bannerFileName}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Preview do Banner em formato horizontal 16:9 / 21:9 */}
                      <div className="relative aspect-[21/9] sm:aspect-[24/9] rounded-xl overflow-hidden border-2 border-amber-500/40 shadow-md bg-black">
                        <img
                          src={bannerImageUrl || imageUrl}
                          alt="Preview do Banner de Destaque"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PRESET_BANNERS[0].url;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                          <div>
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
                              Banner em Destaque
                            </span>
                            <p className="text-xs font-bold text-white mt-1 drop-shadow-sm truncate max-w-md">
                              {title || 'Título do Curso'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Ações para Banner */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <input
                          ref={bannerFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/jpg"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleBannerFileUpload(e.target.files[0]);
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
                            placeholder="Ou cole a URL do banner (https://...)"
                            className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
                          />
                        </div>
                      </div>

                      {/* Presets de Banners */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-text-tertiary font-bold">Banners Rápidos:</span>
                        {PRESET_BANNERS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setBannerImageUrl(preset.url);
                              setBannerFileName('');
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all border cursor-pointer ${
                              bannerImageUrl === preset.url
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                                : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* DESCRIÇÃO COMPLETA DO CURSO */}
                  <div className="p-4 rounded-2xl bg-surface-overlay border border-border-subtle space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base">description</span>
                        Descrição Completa do Curso &amp; Metodologia
                      </label>
                      <span className="text-[11px] text-text-tertiary">
                        {description.length} caracteres
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva detalhadamente o conteúdo, o que o aluno vai aprender, os diferenciais do curso e como ele se aplica no mercado profissional..."
                      className="w-full px-4 py-3 bg-surface-raised border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary outline-none focus:border-primary leading-relaxed"
                    />
                  </div>

                  {/* VÍDEO DE APRESENTAÇÃO */}
                  <div className="p-4 rounded-2xl bg-surface-overlay border border-border-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base">video_library</span>
                        Vídeo de Apresentação / Trailer do Curso
                      </label>
                      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-raised border border-border-subtle">
                        <button
                          type="button"
                          onClick={() => setVideoSourceType('upload')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            videoSourceType === 'upload' ? 'bg-primary text-on-primary' : 'text-text-secondary'
                          }`}
                        >
                          Arquivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoSourceType('url')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            videoSourceType === 'url' ? 'bg-primary text-on-primary' : 'text-text-secondary'
                          }`}
                        >
                          Link / URL
                        </button>
                      </div>
                    </div>

                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleVideoFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {videoSourceType === 'upload' ? (
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle hover:border-primary/50 text-xs font-bold text-text-primary flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">movie</span>
                          <span>{videoFileName ? 'Trocar Vídeo' : 'Selecionar Arquivo de Vídeo'}</span>
                        </button>
                        {videoFileName && (
                          <span className="text-xs font-mono text-text-secondary truncate">{videoFileName}</span>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="Ex: https://www.youtube.com/watch?v=... ou link direto de vídeo"
                        className="w-full px-3.5 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
                      />
                    )}
                  </div>
                </div>

                {/* Right Column (4 cols): Pricing, Hours, Status, Badge, Ementa */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Status e Publicação */}
                  <div className="p-4 rounded-2xl bg-surface-overlay border border-border-subtle space-y-3">
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider pb-1 border-b border-border-subtle">
                      Status de Visibilidade
                    </h3>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as CourseStatus)}
                      className="w-full px-3.5 py-2.5 bg-surface-raised border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="publicado">● Publicado (verde escuro)</option>
                      <option value="rascunho">● Rascunho (azul claro)</option>
                      <option value="inativo">● Inativo (laranja)</option>
                      <option value="previsto">● Previsto (amarelo)</option>
                    </select>

                    {/* Badge Promocional */}
                    <div className="pt-2 border-t border-border-subtle space-y-2">
                      <label className="block text-xs font-bold text-text-secondary">
                        Badge de Destaque
                      </label>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-surface-raised rounded-xl border border-border-subtle">
                        <button
                          type="button"
                          onClick={() => {
                            setBadgeMode('auto_launch');
                            setBadgeText('Novo Lançamento');
                          }}
                          className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            badgeMode === 'auto_launch'
                              ? 'bg-primary text-on-primary'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          1 Mês (Auto)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBadgeMode('custom')}
                          className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            badgeMode === 'custom'
                              ? 'bg-primary text-on-primary'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          Customizado
                        </button>
                        <button
                          type="button"
                          onClick={() => setBadgeMode('none')}
                          className={`py-1 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            badgeMode === 'none'
                              ? 'bg-primary text-on-primary'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          Sem Selo
                        </button>
                      </div>

                      {badgeMode === 'custom' && (
                        <input
                          type="text"
                          value={badgeText}
                          onChange={(e) => setBadgeText(e.target.value)}
                          placeholder="Ex: Mais vendido, Em alta..."
                          className="w-full px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                        />
                      )}
                    </div>
                  </div>

                  {/* Carga Horária & Preços */}
                  <div className="p-4 rounded-2xl bg-surface-overlay border border-border-subtle space-y-3">
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider pb-1 border-b border-border-subtle">
                      Valores &amp; Carga Horária
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1">
                          Carga Horária (h)
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={hours}
                          onChange={(e) => setHours(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none focus:border-primary font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1">
                          Qtd. Aulas Total
                        </label>
                        <input
                          type="number"
                          readOnly
                          value={courseModules.reduce((acc, m) => acc + m.lessons.length, 0) || lessonsCount}
                          className="w-full px-3 py-2 bg-surface-raised/70 border border-border-subtle rounded-xl text-xs font-bold text-primary outline-none font-mono"
                          title="Calculado automaticamente com base nas aulas cadastradas nos módulos"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1">
                          Preço De (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none focus:border-primary font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1">
                          Preço Por (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={currentPrice}
                          onChange={(e) => setCurrentPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs font-bold text-accent-emerald-bright outline-none focus:border-primary font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resumo de Módulos / Ementa */}
                  <div className="p-4 rounded-2xl bg-surface-overlay border border-border-subtle space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-border-subtle">
                      <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Ementa do Curso ({syllabusModules.length})
                      </h3>
                      <button
                        type="button"
                        onClick={handleProceedToModules}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                      >
                        <span>Gerenciar Aulas</span>
                        <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {syllabusModules.map((mod, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-between text-xs"
                        >
                          <span className="text-text-primary font-medium truncate">{mod}</span>
                          <button
                            type="button"
                            onClick={() => setSyllabusModules(syllabusModules.filter((_, i) => i !== idx))}
                            className="text-text-tertiary hover:text-status-danger"
                            title="Remover módulo"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
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
                            if (newModuleText.trim()) {
                              setSyllabusModules([...syllabusModules, newModuleText.trim()]);
                              setNewModuleText('');
                            }
                          }
                        }}
                        placeholder="Adicionar módulo..."
                        className="flex-1 px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newModuleText.trim()) {
                            setSyllabusModules([...syllabusModules, newModuleText.trim()]);
                            setNewModuleText('');
                          }
                        }}
                        className="px-3 py-1.5 bg-surface-raised hover:bg-surface-container text-text-primary text-xs font-bold rounded-xl border border-border-subtle"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions Bar (Step 1) */}
        {currentStep === 1 && (
          <div className="p-4 border-t border-border-subtle bg-surface-overlay flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface-raised text-text-secondary hover:text-text-primary text-xs font-bold border border-border-subtle transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSave('rascunho')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Salvar alterações como rascunho interno"
              >
                <span className="material-symbols-outlined text-base">draft</span>
                <span>Salvar Rascunho</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToModules}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Avançar para visualizar e editar as aulas dos módulos"
              >
                <span>Ver &amp; Editar Aulas ({courseModules.reduce((acc, m) => acc + m.lessons.length, 0)})</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave('publicado')}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Salvar todas as alterações e manter publicado"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Salvar &amp; Publicar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
