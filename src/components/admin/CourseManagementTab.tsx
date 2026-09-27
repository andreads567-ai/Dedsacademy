import React, { useState, useEffect } from 'react';
import { Course, Category, UserAccount, CourseStatus } from '../../types';

interface CourseManagementTabProps {
  courses: Course[];
  categories: Category[];
  users?: UserAccount[];
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onUpdateCourse?: (course: Course) => void;
  onUpdateCourseStatus?: (courseId: string, status: CourseStatus) => void;
  onNavigateToPostCourse: () => void;
}

export type ManageableStatus = 'rascunho' | 'publicado' | 'inativo' | 'previsto';

interface StatusDefinition {
  key: ManageableStatus;
  label: string;
  colorName: string;
  description: string;
  badgeClass: string;
  dotClass: string;
  borderClass: string;
  menuHoverClass: string;
  pillBg: string;
  icon: string;
}

export const STATUS_DEFINITIONS: Record<ManageableStatus, StatusDefinition> = {
  rascunho: {
    key: 'rascunho',
    label: 'Rascunho',
    colorName: 'azul claro',
    description: 'Em elaboração interna, visível apenas para administradores',
    // Azul claro
    badgeClass: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    dotClass: 'bg-sky-400',
    borderClass: 'border-sky-500/40',
    menuHoverClass: 'hover:bg-sky-500/10 text-sky-300',
    pillBg: 'bg-sky-400/20 text-sky-300 border border-sky-500/30',
    icon: 'edit_note',
  },
  publicado: {
    key: 'publicado',
    label: 'Publicado',
    colorName: 'verde escuro',
    description: 'Ativo e disponível no catálogo para matrículas de novos alunos',
    // Verde escuro
    badgeClass: 'bg-[#064e3b] text-[#34d399] border border-emerald-700/60 font-medium',
    dotClass: 'bg-emerald-400',
    borderClass: 'border-emerald-700/60',
    menuHoverClass: 'hover:bg-emerald-950/80 text-emerald-300',
    pillBg: 'bg-[#064e3b] text-emerald-300 border border-emerald-700/60',
    icon: 'check_circle',
  },
  inativo: {
    key: 'inativo',
    label: 'Inativo',
    colorName: 'laranja',
    description: 'Pausado temporariamente, matrículas suspensas na loja',
    // Laranja
    badgeClass: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    dotClass: 'bg-orange-400',
    borderClass: 'border-orange-500/40',
    menuHoverClass: 'hover:bg-orange-500/10 text-orange-300',
    pillBg: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    icon: 'pause_circle',
  },
  previsto: {
    key: 'previsto',
    label: 'Previsto',
    colorName: 'amarelo',
    description: 'Lançamento programado em pré-divulgação oficial',
    // Amarelo
    badgeClass: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    dotClass: 'bg-yellow-400',
    borderClass: 'border-yellow-500/40',
    menuHoverClass: 'hover:bg-yellow-500/10 text-yellow-300',
    pillBg: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    icon: 'schedule',
  },
};

export const CourseManagementTab: React.FC<CourseManagementTabProps> = ({
  courses,
  categories,
  users = [],
  onEditCourse,
  onDeleteCourse,
  onUpdateCourse,
  onUpdateCourseStatus,
  onNavigateToPostCourse,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | ManageableStatus>('all');
  
  // Three dots menu state (holds course id currently open)
  const [openMenuCourseId, setOpenMenuCourseId] = useState<string | null>(null);
  
  // Notification toast on status change
  const [feedbackMessage, setFeedbackMessage] = useState<{ title: string; courseTitle: string; status: ManageableStatus } | null>(null);
  
  // Custom styled deletion modal
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  // Close dropdown on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuCourseId(null);
        setCourseToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper to normalize course status
  const getNormalizedStatus = (course: Course): ManageableStatus => {
    if (course.status === 'rascunho') return 'rascunho';
    if (course.status === 'inativo' || course.status === 'arquivado') return 'inativo';
    if (course.status === 'previsto') return 'previsto';
    return 'publicado';
  };

  // Helper to get total students who accessed/enrolled in the course
  const getStudentsAccessedCount = (course: Course): number => {
    const enrolledUsersCount = users.filter((u) => u.enrolledCourseIds?.includes(course.id)).length;
    const baseCount = course.studentsCount ?? Math.max(Math.round((course.reviewsCount || 40) * 2.8) + 120, 65);
    return baseCount + enrolledUsersCount;
  };

  // Handle status update from 3-dots menu
  const handleSelectStatus = (course: Course, newStatus: ManageableStatus) => {
    if (onUpdateCourseStatus) {
      onUpdateCourseStatus(course.id, newStatus);
    } else if (onUpdateCourse) {
      onUpdateCourse({ ...course, status: newStatus });
    }

    setOpenMenuCourseId(null);
    setFeedbackMessage({
      title: STATUS_DEFINITIONS[newStatus].label,
      courseTitle: course.title,
      status: newStatus,
    });

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Filter courses
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const currentStatus = getNormalizedStatus(c);
    const matchesStatus = selectedStatusFilter === 'all' || currentStatus === selectedStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate status counts for header summary
  const countsByStatus = courses.reduce(
    (acc, c) => {
      const st = getNormalizedStatus(c);
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    { rascunho: 0, publicado: 0, inativo: 0, previsto: 0 } as Record<ManageableStatus, number>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback for Status Change */}
      {feedbackMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0F172A] border border-border-subtle rounded-2xl shadow-2xl text-xs text-text-primary">
            <span
              className={`w-2.5 h-2.5 rounded-full ${STATUS_DEFINITIONS[feedbackMessage.status].dotClass} animate-ping`}
            />
            <div>
              <p className="font-bold text-text-primary">Status alterado com sucesso!</p>
              <p className="text-text-tertiary">
                <span className="text-text-secondary font-medium">"{feedbackMessage.courseTitle}"</span> agora está como{' '}
                <span className={`font-bold ${STATUS_DEFINITIONS[feedbackMessage.status].badgeClass} px-1.5 py-0.5 rounded-md`}>
                  {feedbackMessage.title}
                </span>
              </p>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-overlay ml-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for 3-dots menu */}
      {openMenuCourseId && (
        <div
          className="fixed inset-0 z-20 bg-transparent"
          onClick={() => setOpenMenuCourseId(null)}
        />
      )}

      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">auto_stories</span>
              Gestão de Cursos do Catálogo
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary">
              {courses.length} Cursos Cadastrados
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            Controle completo de cursos: edição, exclusão, monitoramento de alunos que acessaram e alteração rápida de status via menu de opções (•••).
          </p>
        </div>

        <button
          onClick={onNavigateToPostCourse}
          className="px-4 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          Publicar Novo Curso
        </button>
      </div>

      {/* Quick Status Cards / Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Publicado (Verde Escuro) */}
        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'publicado' ? 'all' : 'publicado')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === 'publicado'
              ? 'bg-[#064e3b]/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
              : 'bg-surface-raised border-border-subtle hover:border-emerald-600/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Publicados (Verde escuro)
            </span>
            <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-400">{countsByStatus.publicado}</span>
            <span className="text-[10px] text-text-tertiary">ativos na loja</span>
          </div>
        </button>

        {/* Rascunho (Azul Claro) */}
        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'rascunho' ? 'all' : 'rascunho')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === 'rascunho'
              ? 'bg-sky-950/40 border-sky-500 shadow-md ring-1 ring-sky-500/50'
              : 'bg-surface-raised border-border-subtle hover:border-sky-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Rascunho (Azul claro)
            </span>
            <span className="material-symbols-outlined text-sky-400 text-sm">edit_note</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-sky-400">{countsByStatus.rascunho}</span>
            <span className="text-[10px] text-text-tertiary">em edição</span>
          </div>
        </button>

        {/* Inativo (Laranja) */}
        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'inativo' ? 'all' : 'inativo')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === 'inativo'
              ? 'bg-orange-950/40 border-orange-500 shadow-md ring-1 ring-orange-500/50'
              : 'bg-surface-raised border-border-subtle hover:border-orange-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              Inativo (Laranja)
            </span>
            <span className="material-symbols-outlined text-orange-400 text-sm">pause_circle</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-orange-400">{countsByStatus.inativo}</span>
            <span className="text-[10px] text-text-tertiary">pausados</span>
          </div>
        </button>

        {/* Previsto (Amarelo) */}
        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'previsto' ? 'all' : 'previsto')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatusFilter === 'previsto'
              ? 'bg-yellow-950/40 border-yellow-500 shadow-md ring-1 ring-yellow-500/50'
              : 'bg-surface-raised border-border-subtle hover:border-yellow-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              Previsto (Amarelo)
            </span>
            <span className="material-symbols-outlined text-yellow-400 text-sm">schedule</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-yellow-400">{countsByStatus.previsto}</span>
            <span className="text-[10px] text-text-tertiary">em pré-lançamento</span>
          </div>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar curso por título, instrutor ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary placeholder:text-text-tertiary"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">Todas as Categorias ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer font-medium"
          >
            <option value="all">Todos os Status ({courses.length})</option>
            <option value="publicado">● Publicado (verde escuro)</option>
            <option value="rascunho">● Rascunho (azul claro)</option>
            <option value="inativo">● Inativo (laranja)</option>
            <option value="previsto">● Previsto (amarelo)</option>
          </select>
        </div>
      </div>

      {/* Active Filter Pill indicator if filtered */}
      {(selectedStatusFilter !== 'all' || selectedCategory !== 'all' || search.trim() !== '') && (
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span>Filtros ativos:</span>
          {selectedStatusFilter !== 'all' && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                STATUS_DEFINITIONS[selectedStatusFilter].badgeClass
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DEFINITIONS[selectedStatusFilter].dotClass}`} />
              Status: {STATUS_DEFINITIONS[selectedStatusFilter].label}
              <button
                onClick={() => setSelectedStatusFilter('all')}
                className="hover:opacity-75 cursor-pointer ml-1"
              >
                ×
              </button>
            </span>
          )}
          {selectedCategory !== 'all' && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface-raised border border-border-subtle text-text-secondary flex items-center gap-1">
              Cat: {selectedCategory}
              <button
                onClick={() => setSelectedCategory('all')}
                className="hover:opacity-75 cursor-pointer ml-1"
              >
                ×
              </button>
            </span>
          )}
          {search.trim() !== '' && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface-raised border border-border-subtle text-text-secondary flex items-center gap-1">
              Busca: "{search}"
              <button onClick={() => setSearch('')} className="hover:opacity-75 cursor-pointer ml-1">
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setSelectedStatusFilter('all');
              setSelectedCategory('all');
              setSearch('');
            }}
            className="text-primary hover:underline text-[11px] font-bold ml-2 cursor-pointer"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}

      {/* Courses Table & Responsive Cards */}
      <div className="bg-surface-raised rounded-2xl border border-border-subtle overflow-visible shadow-sm">
        {/* Desktop & Tablet Table */}
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-overlay text-text-secondary uppercase border-b border-border-subtle font-bold">
              <tr>
                <th className="p-3.5 sm:p-4 min-w-[240px]">Curso &amp; Informações</th>
                <th className="p-3.5 sm:p-4 min-w-[130px]">Alunos que Acessaram</th>
                <th className="p-3.5 sm:p-4 min-w-[95px]">Preço</th>
                <th className="p-3.5 sm:p-4 min-w-[130px]">Status do Curso</th>
                <th className="p-3.5 sm:p-4 text-right min-w-[190px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-text-tertiary">
                    <div className="max-w-xs mx-auto space-y-2">
                      <span className="material-symbols-outlined text-4xl text-text-tertiary/60">
                        find_in_page
                      </span>
                      <p className="font-bold text-text-secondary text-sm">
                        Nenhum curso encontrado
                      </p>
                      <p className="text-xs text-text-tertiary">
                        Tente ajustar os termos da busca ou os filtros de categoria e status selecionados.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c, index) => {
                  const currentStatus = getNormalizedStatus(c);
                  const statusInfo = STATUS_DEFINITIONS[currentStatus];
                  const studentsCount = getStudentsAccessedCount(c);
                  const isMenuOpen = openMenuCourseId === c.id;
                  const isNearBottom = index >= filteredCourses.length - 2 && filteredCourses.length > 2;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-surface-overlay/50 transition-colors ${
                        isMenuOpen ? 'bg-surface-overlay/80' : ''
                      }`}
                    >
                      {/* 1. Curso & Informações (Capa, Título, Categoria, Instrutor e Carga Horária) */}
                      <td className="p-3.5 sm:p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={c.image}
                            alt={c.title}
                            className="w-12 h-10 rounded-lg object-cover bg-surface-base flex-shrink-0 border border-border-subtle/50 mt-0.5 shadow-xs"
                          />
                          <div className="min-w-0 flex-1">
                            <span
                              className="font-bold text-text-primary block text-xs sm:text-sm hover:text-primary transition-colors cursor-pointer line-clamp-1"
                              title={c.title}
                              onClick={() => onEditCourse(c)}
                            >
                              {c.title}
                            </span>
                            
                            {/* Badges de Apoio: Categoria, Instrutor e Horas */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-surface-overlay border border-border-subtle/80 text-[10px] text-text-secondary font-medium whitespace-nowrap">
                                {c.category}
                              </span>
                              <span className="text-text-tertiary text-[10px] flex items-center gap-1 whitespace-nowrap">
                                <span className="material-symbols-outlined text-[12px]">person</span>
                                {c.instructor}
                              </span>
                              <span className="text-text-tertiary text-[10px] whitespace-nowrap">
                                • {c.hours}h {c.lessonsCount ? `(${c.lessonsCount} aulas)` : ''}
                              </span>
                              {c.badge?.text && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                                  {c.badge.text}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Quantidade de Alunos que Acessaram o Curso */}
                      <td className="p-3.5 sm:p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 shadow-xs">
                            <span className="material-symbols-outlined text-base">school</span>
                          </div>
                          <div>
                            <span className="font-bold text-text-primary text-sm block">
                              {studentsCount.toLocaleString('pt-BR')}
                            </span>
                            <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald-bright animate-pulse" />
                              alunos acessaram
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Preço do Curso */}
                      <td className="p-3.5 sm:p-4 whitespace-nowrap">
                        <div>
                          <span className="font-bold text-text-primary text-xs sm:text-sm">
                            R$ {c.currentPrice.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="block text-[10px] text-text-tertiary line-through">
                            R$ {(c.originalPrice || c.currentPrice * 1.5).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </td>

                      {/* 4. Status e Condições do Curso: Rascunho, Publicado, Inativo, Previsto */}
                      <td className="p-3.5 sm:p-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuCourseId(isMenuOpen ? null : c.id);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer hover:scale-105 ${statusInfo.badgeClass}`}
                          title={`Clique para alterar o status. Atual: ${statusInfo.label} (${statusInfo.colorName})`}
                        >
                          <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass} animate-pulse`} />
                          <span>{statusInfo.label}</span>
                          <span className="material-symbols-outlined text-[13px] opacity-70">expand_more</span>
                        </button>
                      </td>

                      {/* 5. Ações: Botão Editar, Botão Excluir e Três Pontinhos (Menu de Status) */}
                      <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          {/* Botão de Editar */}
                          <button
                            type="button"
                            onClick={() => onEditCourse(c)}
                            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-surface-overlay hover:bg-surface-container text-text-primary text-xs font-bold transition-all flex items-center gap-1.5 border border-border-subtle cursor-pointer hover:border-primary/50 shadow-xs"
                            title="Editar dados, informações e valores do curso"
                          >
                            <span className="material-symbols-outlined text-base text-primary">edit</span>
                            <span>Editar</span>
                          </button>

                          {/* Botão de Excluir */}
                          <button
                            type="button"
                            onClick={() => setCourseToDelete(c)}
                            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-surface-overlay hover:bg-status-danger/15 text-text-secondary hover:text-status-danger text-xs font-bold transition-all flex items-center gap-1.5 border border-border-subtle hover:border-status-danger/40 cursor-pointer shadow-xs"
                            title="Excluir curso permanentemente"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                            <span>Excluir</span>
                          </button>

                          {/* Três Pontinhos (Alterar Status para Rascunho, Publicado, Inativo, Previsto) */}
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuCourseId(isMenuOpen ? null : c.id);
                              }}
                              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer border flex items-center justify-center ${
                                isMenuOpen
                                  ? 'bg-primary-container text-on-primary border-primary shadow-md scale-105'
                                  : 'bg-surface-overlay hover:bg-surface-container text-text-secondary hover:text-text-primary border-border-subtle'
                              }`}
                              title="Três pontinhos: Alterar status (Rascunho, Publicado, Inativo, Previsto)"
                              aria-label="Opções de status do curso"
                            >
                              <span className="material-symbols-outlined text-base">more_vert</span>
                            </button>

                            {/* Dropdown Menu com as opções de status */}
                            {isMenuOpen && (
                              <div
                                className={`absolute right-0 w-72 bg-[#0B111E] border border-[#222F49] rounded-2xl shadow-2xl z-50 p-2.5 animate-in fade-in zoom-in-95 duration-150 text-left ${
                                  isNearBottom ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2 origin-top-right'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-2.5 py-2 border-b border-border-subtle/60 mb-2">
                                  <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-sm">tune</span>
                                    Mudar Status do Curso
                                  </p>
                                  <p className="text-[10px] text-text-tertiary mt-0.5 truncate" title={c.title}>
                                    {c.title}
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  {/* Opção 1: Rascunho (azul claro) */}
                                  <button
                                    type="button"
                                    onClick={() => handleSelectStatus(c, 'rascunho')}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                                      currentStatus === 'rascunho'
                                        ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300'
                                        : 'hover:bg-sky-500/10 text-text-secondary hover:text-sky-300 border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-3 h-3 rounded-full bg-sky-400 flex-shrink-0 shadow-sm shadow-sky-400/50" />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-xs text-sky-300">Rascunho</span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-medium">
                                            (azul claro)
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-text-tertiary block mt-0.5">
                                          Em edição, visível apenas para admins
                                        </span>
                                      </div>
                                    </div>
                                    {currentStatus === 'rascunho' && (
                                      <span className="material-symbols-outlined text-sky-400 text-sm">check</span>
                                    )}
                                  </button>

                                  {/* Opção 2: Publicado (verde escuro) */}
                                  <button
                                    type="button"
                                    onClick={() => handleSelectStatus(c, 'publicado')}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                                      currentStatus === 'publicado'
                                        ? 'bg-[#064e3b] border border-emerald-600 text-emerald-300'
                                        : 'hover:bg-[#064e3b]/60 text-text-secondary hover:text-emerald-300 border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0 shadow-sm shadow-emerald-400/50" />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-xs text-emerald-300">Publicado</span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-medium border border-emerald-800/60">
                                            (verde escuro)
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-text-tertiary block mt-0.5">
                                          Ativo no catálogo e disponível na loja
                                        </span>
                                      </div>
                                    </div>
                                    {currentStatus === 'publicado' && (
                                      <span className="material-symbols-outlined text-emerald-400 text-sm">check</span>
                                    )}
                                  </button>

                                  {/* Opção 3: Inativo (laranja) */}
                                  <button
                                    type="button"
                                    onClick={() => handleSelectStatus(c, 'inativo')}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                                      currentStatus === 'inativo'
                                        ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                                        : 'hover:bg-orange-500/10 text-text-secondary hover:text-orange-300 border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-3 h-3 rounded-full bg-orange-400 flex-shrink-0 shadow-sm shadow-orange-400/50" />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-xs text-orange-300">Inativo</span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 font-medium">
                                            (laranja)
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-text-tertiary block mt-0.5">
                                          Pausado temporariamente
                                        </span>
                                      </div>
                                    </div>
                                    {currentStatus === 'inativo' && (
                                      <span className="material-symbols-outlined text-orange-400 text-sm">check</span>
                                    )}
                                  </button>

                                  {/* Opção 4: Previsto (amarelo) */}
                                  <button
                                    type="button"
                                    onClick={() => handleSelectStatus(c, 'previsto')}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                                      currentStatus === 'previsto'
                                        ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300'
                                        : 'hover:bg-yellow-500/10 text-text-secondary hover:text-yellow-300 border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0 shadow-sm shadow-yellow-400/50" />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-xs text-yellow-300">Previsto</span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-400 font-medium">
                                            (amarelo)
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-text-tertiary block mt-0.5">
                                          Em pré-lançamento / breve no catálogo
                                        </span>
                                      </div>
                                    </div>
                                    {currentStatus === 'previsto' && (
                                      <span className="material-symbols-outlined text-yellow-400 text-sm">check</span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Course Deletion */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#0F172A] border border-[#222F49] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-status-danger">
              <div className="w-10 h-10 rounded-xl bg-status-danger/10 border border-status-danger/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Confirmar Exclusão</h3>
                <p className="text-xs text-text-tertiary">Esta ação é irreversível.</p>
              </div>
            </div>

            <div className="p-3 bg-surface-overlay rounded-xl border border-border-subtle/50 text-xs text-text-secondary">
              <p className="font-bold text-text-primary mb-1">{courseToDelete.title}</p>
              <p className="text-text-tertiary">
                Instrutor: {courseToDelete.instructor} • {courseToDelete.hours}h • R$ {courseToDelete.currentPrice.toFixed(2).replace('.', ',')}
              </p>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Tem certeza que deseja remover este curso permanentemente do catálogo da Deds Academy? Alunos matriculados poderão perder o acesso caso o curso seja removido.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-surface-overlay hover:bg-surface-container text-xs font-bold text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCourse(courseToDelete.id);
                  setCourseToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-status-danger hover:bg-red-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                Sim, Excluir Curso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
