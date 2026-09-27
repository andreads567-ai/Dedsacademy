import React, { useState, useRef } from 'react';
import { CourseModule, Lesson, LessonAttachment } from '../../types';
import { WordLikeEditor } from './WordLikeEditor';

interface ModuleLessonsManagerProps {
  courseTitle: string;
  modules: CourseModule[];
  onChangeModules: (modules: CourseModule[]) => void;
  onBackToBasicInfo: () => void;
  onSaveDraft: () => void;
  onProceedToQuizzes: () => void;
}

export const ModuleLessonsManager: React.FC<ModuleLessonsManagerProps> = ({
  courseTitle,
  modules,
  onChangeModules,
  onBackToBasicInfo,
  onSaveDraft,
  onProceedToQuizzes,
}) => {
  // Selected module in the list
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || '');
  const [newModuleName, setNewModuleName] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState('');

  // Lesson editor expanded screen state
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Lesson form state - Estrutura & Ordem da Aula
  const [lessonOrder, setLessonOrder] = useState<number>(1);
  const [targetModuleId, setTargetModuleId] = useState<string>(modules[0]?.id || '');
  const [lessonTitle, setLessonTitle] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [lessonDuration, setLessonDuration] = useState('20 min');
  const [lessonIsFreePreview, setLessonIsFreePreview] = useState(false);
  const [lessonDescription, setLessonDescription] = useState('');

  // Lesson Media: Video upload or URL
  const [lessonVideoType, setLessonVideoType] = useState<'upload' | 'url'>('url');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonVideoFileName, setLessonVideoFileName] = useState('');
  const [lessonVideoFileSize, setLessonVideoFileSize] = useState('');
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Lesson Attachments
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);

  // Studio View Mode: Split (Word + Media) | Word Focus (100%) | Media Focus (100%)
  const [activeViewTab, setActiveViewTab] = useState<'split' | 'word' | 'media'>('split');

  // Find active module
  const currentModule = modules.find((m) => m.id === selectedModuleId) || modules[0];
  const totalLessonsCount = modules.reduce((acc, m) => acc + m.lessons.length, 0);

  // Add new module
  const handleAddNewModule = () => {
    if (!newModuleName.trim()) return;
    const newMod: CourseModule = {
      id: `mod-${Date.now()}`,
      title: newModuleName.trim(),
      lessons: [],
    };
    const updated = [...modules, newMod];
    onChangeModules(updated);
    setSelectedModuleId(newMod.id);
    setNewModuleName('');
    setIsAddingModule(false);
  };

  // Start editing module title
  const handleStartEditModule = (mod: CourseModule) => {
    setEditingModuleId(mod.id);
    setEditingModuleTitle(mod.title);
  };

  // Save edited module title
  const handleSaveModuleTitle = () => {
    if (!editingModuleTitle.trim() || !editingModuleId) return;
    const updated = modules.map((m) =>
      m.id === editingModuleId ? { ...m, title: editingModuleTitle.trim() } : m
    );
    onChangeModules(updated);
    setEditingModuleId(null);
  };

  // Remove module
  const handleRemoveModule = (modId: string) => {
    if (modules.length <= 1) {
      alert('O curso deve conter ao menos um módulo.');
      return;
    }
    if (confirm('Deseja realmente remover este módulo e todas as suas aulas?')) {
      const updated = modules.filter((m) => m.id !== modId);
      onChangeModules(updated);
      if (selectedModuleId === modId && updated.length > 0) {
        setSelectedModuleId(updated[0].id);
      }
    }
  };

  // Reorder lessons inside current module (Move Up)
  const handleMoveLessonUp = (index: number) => {
    if (!currentModule || index <= 0) return;
    const lessons = [...currentModule.lessons];
    const [moved] = lessons.splice(index, 1);
    lessons.splice(index - 1, 0, moved);

    // Update order numbers
    const reordered = lessons.map((l, i) => ({ ...l, order: i + 1 }));
    const updatedModules = modules.map((m) =>
      m.id === currentModule.id ? { ...m, lessons: reordered } : m
    );
    onChangeModules(updatedModules);
  };

  // Reorder lessons inside current module (Move Down)
  const handleMoveLessonDown = (index: number) => {
    if (!currentModule || index >= currentModule.lessons.length - 1) return;
    const lessons = [...currentModule.lessons];
    const [moved] = lessons.splice(index, 1);
    lessons.splice(index + 1, 0, moved);

    // Update order numbers
    const reordered = lessons.map((l, i) => ({ ...l, order: i + 1 }));
    const updatedModules = modules.map((m) =>
      m.id === currentModule.id ? { ...m, lessons: reordered } : m
    );
    onChangeModules(updatedModules);
  };

  // Delete Lesson
  const handleDeleteLesson = (lessonId: string) => {
    if (!currentModule) return;
    if (confirm('Deseja remover esta aula do módulo?')) {
      const updatedLessons = currentModule.lessons
        .filter((l) => l.id !== lessonId)
        .map((l, idx) => ({ ...l, order: idx + 1 }));
      const updatedModules = modules.map((m) =>
        m.id === currentModule.id ? { ...m, lessons: updatedLessons } : m
      );
      onChangeModules(updatedModules);
      if (editingLessonId === lessonId) {
        setIsEditingLesson(false);
      }
    }
  };

  // Open Lesson Editor (New or Existing) - EXPANDS SCREEN
  const handleOpenLessonEditor = (lessonToEdit?: Lesson) => {
    setTitleError(false);
    const activeModId = currentModule?.id || modules[0]?.id || '';
    setTargetModuleId(activeModId);

    if (lessonToEdit) {
      const existingIdx = currentModule?.lessons.findIndex((l) => l.id === lessonToEdit.id) ?? -1;
      const orderVal = lessonToEdit.order || (existingIdx >= 0 ? existingIdx + 1 : 1);

      setEditingLessonId(lessonToEdit.id);
      setLessonOrder(orderVal);
      setLessonTitle(lessonToEdit.title);
      setLessonDescription(lessonToEdit.description || '');
      setLessonDuration(lessonToEdit.duration || '20 min');
      setLessonIsFreePreview(Boolean(lessonToEdit.isFreePreview));
      setLessonVideoType(lessonToEdit.videoType || (lessonToEdit.videoFileName ? 'upload' : 'url'));
      setLessonVideoUrl(lessonToEdit.videoUrl || '');
      setLessonVideoFileName(lessonToEdit.videoFileName || '');
      setLessonVideoFileSize('');
      setAttachments(lessonToEdit.attachments || []);
    } else {
      const currentLessonCount = currentModule?.lessons.length || 0;
      setEditingLessonId(null);
      setLessonOrder(currentLessonCount + 1);
      setLessonTitle(`Aula ${currentLessonCount + 1}: `);
      setLessonDescription(
        `# Introdução ao Conteúdo\n\nNesta aula, abordaremos as diretrizes fundamentais, metodologias práticas e ferramentas essenciais aplicadas ao tema.\n\n### Objetivos de Aprendizagem\n• Compreender os conceitos estruturantes da matéria\n• Aplicar a metodologia prática com exemplos reais do mercado\n• Analisar casos de uso práticos e mitigar erros comuns\n\n| Tópico Principal | Metodologia | Aplicação Prática |\n| :--- | :--- | :--- |\n| 1. Fundamentação Teórica | Leitura guiada e estudo de caso | Base conceitual |\n| 2. Implementação Passo a Passo | Execução guiada | Projeto de fixação |\n\n> 💡 **Dica do Instrutor:** Acompanhe o vídeo demonstrativo ao lado e faça o download dos materiais de apoio para exercitar.`
      );
      setLessonDuration('20 min');
      setLessonIsFreePreview(false);
      setLessonVideoType('url');
      setLessonVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      setLessonVideoFileName('');
      setLessonVideoFileSize('');
      setAttachments([]);
    }

    // EXPAND SCREEN
    setIsEditingLesson(true);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Video File Upload Handler
  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecione um arquivo de vídeo válido (MP4, WebM, etc.)');
      return;
    }
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setLessonVideoFileName(file.name);
    setLessonVideoFileSize(`${sizeMb} MB`);
    const objectUrl = URL.createObjectURL(file);
    setLessonVideoUrl(objectUrl);
    setLessonVideoType('upload');
  };

  // Save Lesson Handler
  const handleSaveLesson = () => {
    if (!lessonTitle.trim()) {
      setTitleError(true);
      alert('O título da aula é obrigatório. Por favor, informe um título.');
      return;
    }

    const savedLesson: Lesson = {
      id: editingLessonId || `lesson-${Date.now()}`,
      title: lessonTitle.trim(),
      description: lessonDescription.trim(),
      order: Number(lessonOrder) || 1,
      duration: lessonDuration.trim() || '20 min',
      videoUrl: lessonVideoUrl.trim() || undefined,
      videoFileName: lessonVideoFileName || undefined,
      videoType: lessonVideoUrl ? lessonVideoType : undefined,
      attachments: attachments,
      isFreePreview: lessonIsFreePreview,
    };

    const destModuleId = targetModuleId || currentModule.id;

    // Place lesson in destination module
    const updatedModules = modules.map((mod) => {
      if (mod.id === destModuleId) {
        let newLessons = [...mod.lessons];
        if (editingLessonId && mod.lessons.some((l) => l.id === editingLessonId)) {
          // Update in place
          newLessons = newLessons.map((l) => (l.id === editingLessonId ? savedLesson : l));
        } else {
          // If editing in another module, remove from old
          newLessons.push(savedLesson);
        }

        // Sort by order
        newLessons.sort((a, b) => (a.order || 0) - (b.order || 0));
        // Normalize order numbering
        newLessons = newLessons.map((l, i) => ({ ...l, order: i + 1 }));

        return { ...mod, lessons: newLessons };
      } else if (editingLessonId && mod.lessons.some((l) => l.id === editingLessonId)) {
        // Remove from previous module if transferred
        return {
          ...mod,
          lessons: mod.lessons
            .filter((l) => l.id !== editingLessonId)
            .map((l, i) => ({ ...l, order: i + 1 })),
        };
      }
      return mod;
    });

    onChangeModules(updatedModules);
    setSelectedModuleId(destModuleId);
    setIsEditingLesson(false);
    setIsMaximized(false);
  };

  // Calculate order options (e.g. 1st, 2nd, 3rd up to count+1)
  const maxOrderOptions = Math.max(
    (currentModule?.lessons.length || 0) + (editingLessonId ? 0 : 1),
    lessonOrder,
    5
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">auto_stories</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">
              Estrutura de Módulos &amp; Conteúdo das Aulas
            </h2>
            <p className="text-xs text-text-secondary">
              Gerencie a ordem sequencial das aulas, elabore descrições completas estilo Word e anexe mídias de vídeo e downloads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-surface-overlay border border-border-subtle text-text-secondary">
            {modules.length} {modules.length === 1 ? 'módulo' : 'módulos'}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/25">
            {totalLessonsCount} {totalLessonsCount === 1 ? 'aula cadastrada' : 'aulas no total'}
          </span>
        </div>
      </div>

      {/* =========================================================================
          CONDITIONAL VIEW:
          IF isEditingLesson === true -> EXPANDED SCREEN WITH FULL STUDIO
          IF isEditingLesson === false -> STANDARD 2-COLUMN VIEW (MODULES + LESSONS)
         ========================================================================= */}

      {isEditingLesson ? (
        /* EXPANDED FULL-WIDTH SCREEN FOR LESSON CREATION & DETAILED DESCRIPTION */
        <div
          className={`${
            isMaximized
              ? 'fixed inset-0 z-50 overflow-y-auto bg-surface-base/95 backdrop-blur-md p-4 sm:p-6 lg:p-8 space-y-6'
              : 'space-y-6 w-full'
          }`}
        >
          {/* Top Sticky Header Bar with Navigation & Actions */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja sair da edição da aula? Alterações não salvas serão perdidas.')) {
                    setIsEditingLesson(false);
                    setIsMaximized(false);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Voltar aos Módulos</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="text-text-tertiary">Módulo:</span>
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold border border-primary/20">
                  {currentModule?.title || 'Módulo Ativo'}
                </span>
                <span className="text-text-tertiary">•</span>
                <span className="text-xs font-bold text-text-primary">
                  {editingLessonId ? 'Atualizando Conteúdo & Estrutura' : 'Nova Aula em Tela Expandida'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Maximize / Minimize Viewport Toggle */}
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="px-3 py-2 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
                title={isMaximized ? 'Restaurar tamanho padrão' : 'Maximizar para Tela Cheia'}
              >
                <span className="material-symbols-outlined text-sm">
                  {isMaximized ? 'fullscreen_exit' : 'fullscreen'}
                </span>
                <span className="hidden md:inline">
                  {isMaximized ? 'Modo Padrão' : 'Tela Cheia'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditingLesson(false);
                  setIsMaximized(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-tertiary hover:text-text-primary cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveLesson}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Salvar Aula no Módulo</span>
              </button>
            </div>
          </div>

          {/* CARD 1: ESTRUTURA & ORDEM DA AULA */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-sm">
                  #
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <span>Estrutura &amp; Ordem da Aula</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      Ordem Sequencial do Curso
                    </span>
                  </h3>
                  <p className="text-[11px] text-text-tertiary">
                    Defina a posição no módulo, título obrigatório, duração e permissão de degustação
                  </p>
                </div>
              </div>

              {/* Free Preview Toggle */}
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-overlay border border-border-subtle cursor-pointer hover:border-border-subtle/80 transition-colors">
                <input
                  type="checkbox"
                  checked={lessonIsFreePreview}
                  onChange={(e) => setLessonIsFreePreview(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-border-subtle focus:ring-primary cursor-pointer"
                />
                <div className="text-left">
                  <span className="text-xs font-bold text-text-primary block flex items-center gap-1">
                    <span className="material-symbols-outlined text-amber-400 text-xs">lock_open</span>
                    Aula Gratuita / Degustação
                  </span>
                  <span className="text-[10px] text-text-tertiary block">
                    Liberada para visitantes antes da compra
                  </span>
                </div>
              </label>
            </div>

            {/* Grid of Lesson Hierarchy: Order, Module, Title, Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-start">
              {/* Order Number */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Ordem da Aula
                </label>
                <div className="relative">
                  <select
                    value={lessonOrder}
                    onChange={(e) => setLessonOrder(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary font-bold outline-none focus:border-primary cursor-pointer"
                  >
                    {Array.from({ length: maxOrderOptions }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num}ª Aula ({num < 10 ? `0${num}` : num})
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-text-tertiary mt-1 block">
                  Sequência no módulo
                </span>
              </div>

              {/* Module Destination */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Módulo Vinculado
                </label>
                <select
                  value={targetModuleId}
                  onChange={(e) => setTargetModuleId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer truncate"
                >
                  {modules.map((mod, idx) => (
                    <option key={mod.id} value={mod.id}>
                      Módulo {idx + 1}: {mod.title}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-text-tertiary mt-1 block">
                  Mover de módulo se necessário
                </span>
              </div>

              {/* Mandatory Title */}
              <div className="lg:col-span-5">
                <label className="block text-xs font-bold text-text-primary mb-1">
                  Título da Aula <span className="text-status-danger font-black">* (Obrigatório)</span>
                </label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => {
                    setLessonTitle(e.target.value);
                    if (e.target.value.trim()) setTitleError(false);
                  }}
                  placeholder="Ex: Aula 01: Fundamentos de Arquitetura e Estruturação Prática"
                  className={`w-full px-3.5 py-2.5 bg-surface-overlay border rounded-xl text-xs sm:text-sm text-text-primary outline-none focus:border-primary transition-all font-medium ${
                    titleError
                      ? 'border-status-danger ring-1 ring-status-danger bg-status-danger/5'
                      : 'border-border-subtle'
                  }`}
                />
                {titleError && (
                  <p className="text-[11px] text-status-danger mt-1 flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-xs">error</span>
                    O título da aula é obrigatório antes de prosseguir.
                  </p>
                )}
              </div>

              {/* Estimated Duration with Quick Click Chips */}
              <div className="lg:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-text-secondary">
                  Duração Estimada
                </label>
                <input
                  type="text"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  placeholder="Ex: 25 min"
                  className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary text-center font-mono"
                />
                <div className="flex items-center justify-between gap-1">
                  {['15 min', '25 min', '45 min', '60 min'].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setLessonDuration(dur)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors cursor-pointer ${
                        lessonDuration === dur
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : 'bg-surface-overlay border-border-subtle/80 text-text-tertiary hover:text-text-primary'
                      }`}
                    >
                      {dur.replace(' min', 'm')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* VIEW SELECTOR: Split (Word + Media) | Word Focus (100%) | Media Focus (100%) */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-1.5 bg-surface-raised p-1 rounded-xl border border-border-subtle shadow-xs">
              <button
                type="button"
                onClick={() => setActiveViewTab('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === 'split'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                }`}
              >
                <span className="material-symbols-outlined text-sm">view_column</span>
                <span>Layout Dividido (Word 65% + Vídeo 35%)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewTab('word')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === 'word'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                }`}
              >
                <span className="material-symbols-outlined text-sm">article</span>
                <span>Modo Foco Documento Word (100% Largura)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewTab('media')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === 'media'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                }`}
              >
                <span className="material-symbols-outlined text-sm">video_library</span>
                <span>Modo Foco Mídia &amp; Vídeo (100% Largura)</span>
              </button>
            </div>

            <span className="text-[11px] text-text-tertiary hidden lg:inline">
              ✨ Visualização expandida sem aperto de tela
            </span>
          </div>

          {/* MAIN BODY: SPACIOUS WORD EDITOR & VIDEO MEDIA */}
          <div
            className={`grid gap-6 items-start ${
              activeViewTab === 'split'
                ? 'grid-cols-1 lg:grid-cols-12'
                : 'grid-cols-1'
            }`}
          >
            {/* LEFT / MAIN: WORD-LIKE EDITOR (65% in split or 100% in word focus) */}
            {(activeViewTab === 'split' || activeViewTab === 'word') && (
              <div
                className={`space-y-3 ${
                  activeViewTab === 'split' ? 'lg:col-span-7 xl:col-span-8' : 'w-full'
                }`}
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                      W
                    </span>
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Descrição Detalhada da Aula (Estrutura Word)
                    </h3>
                  </div>
                  <span className="text-[11px] text-text-tertiary">
                    Formatação de texto, títulos, links, imagens e download
                  </span>
                </div>

                {/* Word Editor Component with generous width */}
                <WordLikeEditor
                  value={lessonDescription}
                  onChange={(val) => setLessonDescription(val)}
                  attachments={attachments}
                  onAddAttachment={(att) => setAttachments((prev) => [...prev, att])}
                  onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
                />
              </div>
            )}

            {/* RIGHT: VIDEO & MEDIA MANAGEMENT (35% in split or 100% in media focus) */}
            {(activeViewTab === 'split' || activeViewTab === 'media') && (
              <div
                className={`space-y-4 ${
                  activeViewTab === 'split' ? 'lg:col-span-5 xl:col-span-4' : 'w-full'
                }`}
              >
                <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-4">
                  {/* Media Header & Type Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
                    <div>
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base">video_library</span>
                        Mídia ou Vídeo da Aula
                      </h4>
                      <p className="text-[11px] text-text-tertiary">
                        Adicione vídeo do computador ou URL externa
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-surface-overlay p-0.5 rounded-lg border border-border-subtle">
                      <button
                        type="button"
                        onClick={() => setLessonVideoType('url')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          lessonVideoType === 'url'
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'text-text-tertiary hover:text-text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">link</span>
                        <span>Link URL</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLessonVideoType('upload')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          lessonVideoType === 'upload'
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'text-text-tertiary hover:text-text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">upload</span>
                        <span>Upload</span>
                      </button>
                    </div>
                  </div>

                  {/* Video URL Input */}
                  {lessonVideoType === 'url' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-text-secondary">
                        URL do Vídeo (YouTube, Vimeo, Panda, Loom)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={lessonVideoUrl}
                          onChange={(e) => {
                            setLessonVideoUrl(e.target.value);
                            setLessonVideoFileName('');
                          }}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="flex-1 px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
                        />
                        {lessonVideoUrl && (
                          <button
                            type="button"
                            onClick={() => setLessonVideoUrl('')}
                            className="px-3 py-1 text-xs font-bold text-status-danger hover:bg-status-danger/10 border border-status-danger/20 rounded-xl cursor-pointer"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-text-tertiary pt-1">
                        <span className="px-1.5 py-0.5 rounded bg-surface-overlay border border-border-subtle font-mono">
                          YouTube
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-overlay border border-border-subtle font-mono">
                          Vimeo
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-overlay border border-border-subtle font-mono">
                          Panda Video
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-overlay border border-border-subtle font-mono">
                          MP4 Direto
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Video Upload Mode */}
                  {lessonVideoType === 'upload' && (
                    <div className="space-y-3">
                      <input
                        ref={videoFileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => videoFileInputRef.current?.click()}
                        className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-border-subtle hover:border-primary bg-surface-overlay hover:bg-surface-raised text-xs font-bold text-text-secondary hover:text-primary transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl">upload</span>
                        </div>
                        <span className="text-text-primary">Clique para selecionar o arquivo de vídeo</span>
                        <span className="text-[11px] text-text-tertiary">
                          Suporta formatos MP4, WebM ou MOV (até 2GB)
                        </span>

                        {lessonVideoFileName && (
                          <div className="mt-2 px-3 py-1.5 rounded-lg bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30 font-mono text-[11px] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            <span>{lessonVideoFileName} ({lessonVideoFileSize})</span>
                          </div>
                        )}
                      </button>
                    </div>
                  )}

                  {/* High Quality 16:9 Video Player Preview */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-text-tertiary uppercase">
                      <span>Visualização Prévia do Player (16:9)</span>
                      {lessonVideoUrl && <span className="text-accent-emerald-bright">Pronto para reprodução</span>}
                    </div>

                    {lessonVideoUrl ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border-subtle shadow-md">
                        {lessonVideoUrl.includes('youtube.com') || lessonVideoUrl.includes('youtu.be') ? (
                          <iframe
                            src={
                              lessonVideoUrl.includes('watch?v=')
                                ? lessonVideoUrl.replace('watch?v=', 'embed/')
                                : lessonVideoUrl.replace('youtu.be/', 'youtube.com/embed/')
                            }
                            title="Preview da Aula"
                            className="w-full h-full"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={lessonVideoUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video rounded-xl border border-dashed border-border-subtle flex flex-col items-center justify-center text-text-tertiary gap-1 bg-surface-overlay/50">
                        <span className="material-symbols-outlined text-3xl">play_circle</span>
                        <span className="text-xs">Nenhum vídeo vinculado ainda</span>
                        <span className="text-[10px]">Insira uma URL ou envie um arquivo para assistir aqui</span>
                      </div>
                    )}
                  </div>

                  {/* Materials / Download Files Summary */}
                  <div className="pt-2 border-t border-border-subtle">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-primary">folder_zip</span>
                        Materiais de Apoio
                      </span>
                      <span className="text-[11px] font-bold text-text-tertiary">
                        {attachments.length} {attachments.length === 1 ? 'arquivo' : 'arquivos'}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-1">
                      Você pode anexar apostilas Word, planilhas Excel e PDFs diretamente na barra de ferramentas do Editor Word acima.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Floating / Fixed Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja sair da edição da aula? Alterações não salvas serão perdidas.')) {
                  setIsEditingLesson(false);
                  setIsMaximized(false);
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              Cancelar e Fechar Tela Expandida
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveLesson}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Salvar Aula no Módulo</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD 2-COLUMN VIEW: MODULES LIST (4 COLS) + LESSONS DIRECTORY (8 COLS) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Modules List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-surface-raised p-4 rounded-2xl border border-border-subtle shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <div>
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-base">format_list_bulleted</span>
                    Módulos do Curso
                  </h3>
                  <p className="text-[11px] text-text-tertiary">
                    Clique no módulo para gerenciar suas aulas
                  </p>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-overlay border border-border-subtle text-text-secondary">
                  {modules.length} {modules.length === 1 ? 'módulo' : 'módulos'}
                </span>
              </div>

              {/* List of Modules */}
              <div className="space-y-2">
                {modules.map((mod, idx) => {
                  const isSelected = mod.id === selectedModuleId;
                  const isEditingTitle = editingModuleId === mod.id;

                  return (
                    <div
                      key={mod.id}
                      onClick={() => {
                        setSelectedModuleId(mod.id);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                        isSelected
                          ? 'bg-primary/10 border-primary ring-1 ring-primary/30 shadow-sm'
                          : 'bg-surface-overlay border-border-subtle hover:border-border-subtle/80 hover:bg-surface-raised'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'bg-surface-raised border border-border-subtle text-text-secondary'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        {isEditingTitle ? (
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editingModuleTitle}
                              onChange={(e) => setEditingModuleTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveModuleTitle();
                              }}
                              className="w-full px-2 py-1 bg-surface-raised border border-primary rounded text-xs text-text-primary outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSaveModuleTitle}
                              className="p-1 text-accent-emerald-bright hover:bg-accent-emerald-bright/10 rounded"
                            >
                              <span className="material-symbols-outlined text-sm">check</span>
                            </button>
                          </div>
                        ) : (
                          <h4
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-primary' : 'text-text-primary'
                            }`}
                          >
                            {mod.title}
                          </h4>
                        )}

                        <div className="flex items-center justify-between mt-1 text-[11px] text-text-tertiary">
                          <span>
                            {mod.lessons.length === 0
                              ? 'Nenhuma aula'
                              : `${mod.lessons.length} ${mod.lessons.length === 1 ? 'aula' : 'aulas'}`}
                          </span>

                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleStartEditModule(mod)}
                              className="p-1 hover:text-text-primary text-text-tertiary rounded transition-colors"
                              title="Renomear módulo"
                            >
                              <span className="material-symbols-outlined text-xs">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveModule(mod.id)}
                              className="p-1 hover:text-status-danger text-text-tertiary rounded transition-colors"
                              title="Remover módulo"
                            >
                              <span className="material-symbols-outlined text-xs">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Module */}
              {isAddingModule ? (
                <div className="p-3 bg-surface-overlay border border-border-subtle rounded-xl space-y-2">
                  <label className="block text-[11px] font-bold text-text-secondary">
                    Nome do Novo Módulo:
                  </label>
                  <input
                    type="text"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    placeholder="Ex: Módulo 4: Prática Avançada..."
                    className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-lg text-xs text-text-primary outline-none focus:border-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNewModule();
                    }}
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingModule(false);
                        setNewModuleName('');
                      }}
                      className="px-2.5 py-1 text-xs text-text-tertiary hover:text-text-primary cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewModule}
                      className="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-bold hover:brightness-110 cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingModule(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-border-subtle hover:border-primary bg-surface-overlay hover:bg-surface-raised text-xs font-bold text-text-secondary hover:text-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Adicionar Novo Módulo</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Module Lessons Directory */}
          <div className="lg:col-span-8 space-y-6">
            {currentModule ? (
              <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                        Módulo Selecionado
                      </span>
                      <span className="text-xs text-text-tertiary">•</span>
                      <span className="text-xs text-text-secondary">
                        {currentModule.lessons.length} {currentModule.lessons.length === 1 ? 'aula cadastrada' : 'aulas cadastradas'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-text-primary mt-1">
                      {currentModule.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenLessonEditor()}
                    className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                    title="Clique para abrir a tela expandida e criar a aula"
                  >
                    <span className="material-symbols-outlined text-base">open_in_full</span>
                    <span>Criar Nova Aula (Expandir Tela)</span>
                  </button>
                </div>

                {/* List of Lessons in Current Module */}
                {currentModule.lessons.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-text-tertiary px-1">
                      <span>Aulas deste Módulo (Organize a sequência e clique para editar em tela ampla)</span>
                      <span>Ordem &amp; Ações</span>
                    </div>

                    {currentModule.lessons.map((lesson, idx) => (
                      <div
                        key={lesson.id}
                        onClick={() => handleOpenLessonEditor(lesson)}
                        className="p-4 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Order Number Badge */}
                          <div className="w-8 h-8 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center font-bold text-xs text-primary shrink-0 group-hover:border-primary/40">
                            {idx + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                                {lesson.title}
                              </h5>
                              {lesson.isFreePreview && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                  Degustação Gratuita
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-text-tertiary">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                <span>{lesson.duration || '20 min'}</span>
                              </span>

                              <span>•</span>

                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">
                                  {lesson.videoUrl ? 'videocam' : 'videocam_off'}
                                </span>
                                <span>{lesson.videoUrl ? 'Vídeo configurado' : 'Sem vídeo'}</span>
                              </span>

                              {lesson.attachments && lesson.attachments.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-primary">
                                    <span className="material-symbols-outlined text-xs">attachment</span>
                                    <span>{lesson.attachments.length} arquivos para download</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Reorder Buttons & Action Buttons */}
                        <div
                          className="flex items-center gap-1.5 self-end sm:self-center shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Order Up */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveLessonUp(idx)}
                            className="p-1.5 rounded-lg border border-border-subtle bg-surface-raised hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                            title="Mover para cima na sequência"
                          >
                            <span className="material-symbols-outlined text-sm">arrow_upward</span>
                          </button>

                          {/* Order Down */}
                          <button
                            type="button"
                            disabled={idx === currentModule.lessons.length - 1}
                            onClick={() => handleMoveLessonDown(idx)}
                            className="p-1.5 rounded-lg border border-border-subtle bg-surface-raised hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                            title="Mover para baixo na sequência"
                          >
                            <span className="material-symbols-outlined text-sm">arrow_downward</span>
                          </button>

                          {/* Edit Lesson Button (Expands screen) */}
                          <button
                            type="button"
                            onClick={() => handleOpenLessonEditor(lesson)}
                            className="px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-primary hover:text-on-primary border border-border-subtle text-xs font-bold text-text-secondary transition-all flex items-center gap-1 cursor-pointer"
                            title="Editar Conteúdo & Descrição Detalhada em Tela Expandida"
                          >
                            <span className="material-symbols-outlined text-sm">edit_document</span>
                            <span>Editar</span>
                          </button>

                          {/* Delete Lesson Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-1.5 rounded-lg hover:bg-status-danger/10 text-text-tertiary hover:text-status-danger transition-colors cursor-pointer"
                            title="Remover aula"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-surface-overlay border border-border-subtle space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border-subtle text-text-tertiary flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-2xl">post_add</span>
                    </div>
                    <h4 className="text-sm font-bold text-text-primary">
                      Nenhuma aula cadastrada neste módulo
                    </h4>
                    <p className="text-xs text-text-tertiary max-w-md mx-auto">
                      Clique no botão abaixo para expandir a tela e redigir a primeira aula, estruturando a ordem sequencial, utilizando a formatação rica estilo Word e vinculando mídias e arquivos.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenLessonEditor()}
                      className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm hover:brightness-110 flex items-center gap-2 mx-auto cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">open_in_full</span>
                      <span>+ Criar Primeira Aula (Expandir Tela)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-surface-raised border border-border-subtle text-text-tertiary">
                Nenhum módulo selecionado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Navigation Bar (Only visible when NOT in expanded lesson editing mode) */}
      {!isEditingLesson && (
        <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToBasicInfo}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Voltar para Informações Básicas</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onSaveDraft}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Salvar como Rascunho (azul claro)"
            >
              <span className="material-symbols-outlined text-base">draft</span>
              <span>Salvar Rascunho</span>
            </button>

            <button
              type="button"
              onClick={onProceedToQuizzes}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Prosseguir para a etapa de Quizzes dos Módulos"
            >
              <span>Prosseguir para Quizzes dos Módulos</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
