import React, { useState, useMemo } from 'react';
import { Course, Category, UserAccount } from '../types';
import { getEffectiveCourseBadge } from '../utils/courseBadgeUtils';

interface CoursesCatalogPageProps {
  courses: Course[];
  categories: Category[];
  initialCategory?: string | null;
  onAddToCart: (course: Course) => void;
  onSelectCourse: (course: Course) => void;
  addedCourseIds: string[];
  onNavigateHome: (sectionId?: string) => void;
  currentUser?: UserAccount | null;
  onOpenStudentPortal?: () => void;
}

export const CoursesCatalogPage: React.FC<CoursesCatalogPageProps> = ({
  courses,
  categories,
  initialCategory = null,
  onAddToCart,
  onSelectCourse,
  addedCourseIds,
  onNavigateHome,
  currentUser,
  onOpenStudentPortal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTag, setActiveFilterTag] = useState('Todos');
  const [sortBy, setSortBy] = useState<'populares' | 'menor_preco' | 'maior_preco' | 'avaliados'>('populares');

  // Calculate course count per category dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      counts[cat.name] = courses.filter(
        (c) => c.category.toLowerCase() === cat.name.toLowerCase()
      ).length;
    });
    return counts;
  }, [categories, courses]);

  // Filter and sort courses
  const displayedCourses = useMemo(() => {
    return courses
      .filter((course) => {
        // Category filter: null means "Todos"
        if (selectedCategory && course.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }

        // Sub-filter tag (Em alta, Mais vendidos, etc.)
        if (activeFilterTag !== 'Todos' && !course.filterTags.includes(activeFilterTag)) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = course.title.toLowerCase().includes(q);
          const matchInstructor = course.instructor.toLowerCase().includes(q);
          const matchCategory = course.category.toLowerCase().includes(q);
          const matchDesc = course.description.toLowerCase().includes(q);
          return matchTitle || matchInstructor || matchCategory || matchDesc;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'menor_preco') return a.currentPrice - b.currentPrice;
        if (sortBy === 'maior_preco') return b.currentPrice - a.currentPrice;
        if (sortBy === 'avaliados') return b.rating - a.rating;
        // Default: Populares (by reviewsCount)
        return b.reviewsCount - a.reviewsCount;
      });
  }, [courses, selectedCategory, activeFilterTag, searchQuery, sortBy]);

  const filterPills = ['Todos', 'Em alta', 'Mais vendidos', 'Lançamentos', 'Com Certificação'];

  return (
    <div className="w-full min-h-screen bg-surface-base text-text-primary pt-24 pb-20">
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop">
        {/* Breadcrumbs & Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-3 flex-wrap">
            {currentUser && onOpenStudentPortal ? (
              <button
                onClick={onOpenStudentPortal}
                className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-1 border border-primary/20 mr-1"
                title="Voltar para sua Área do Aluno"
              >
                <span className="material-symbols-outlined text-xs">school</span>
                Minha Área do Aluno
              </button>
            ) : (
              <button
                onClick={() => onNavigateHome('hero-section')}
                className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">home</span>
                Início
              </button>
            )}
            <span>/</span>
            <span className="text-text-primary font-semibold">Catálogo de Cursos</span>
            {selectedCategory && (
              <>
                <span>/</span>
                <span className="text-primary font-semibold">{selectedCategory}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                Catálogo Completo de Formações
              </span>
              <h1 className="text-3xl lg:text-4xl font-black text-text-primary mt-1 tracking-tight">
                {selectedCategory ? `Cursos de ${selectedCategory}` : 'Todos os Cursos Disponíveis'}
              </h1>
              <p className="text-sm text-text-secondary mt-1.5 max-w-2xl">
                Cursos práticos com certificado para atividades complementares universitárias, projetos reais para portfólio e suporte direto com especialistas.
              </p>
            </div>

            {/* Quick Search & Sort Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex items-center min-w-[240px]">
                <span className="material-symbols-outlined absolute left-3 text-text-tertiary text-base">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar no catálogo..."
                  className="w-full pl-9 pr-8 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary focus:border-primary focus:outline-none placeholder:text-text-tertiary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-text-tertiary hover:text-text-primary text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle rounded-xl px-3 py-2">
                <span className="material-symbols-outlined text-text-tertiary text-base">sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs text-text-primary font-semibold outline-none cursor-pointer"
                >
                  <option value="populares" className="bg-surface-raised">Mais Populares</option>
                  <option value="avaliados" className="bg-surface-raised">Melhor Avaliados</option>
                  <option value="menor_preco" className="bg-surface-raised">Menor Preço</option>
                  <option value="maior_preco" className="bg-surface-raised">Maior Preço</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Layout: Left Sidebar (Categorias) + Center (Todos os Cursos) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* LADO ESQUERDO: CATEGORIAS */}
          <aside className="lg:col-span-1 bg-surface-raised border border-border-subtle rounded-2xl p-5 shadow-lg lg:sticky lg:top-28">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">category</span>
                <h3 className="font-bold text-sm text-text-primary">Categorias</h3>
              </div>
              <span className="text-[11px] text-text-tertiary font-mono">
                {courses.length} cursos
              </span>
            </div>

            {/* OPÇÃO 'TODOS' NO TOPO */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  selectedCategory === null
                    ? 'bg-primary text-on-primary font-bold shadow-[0_0_18px_-3px_rgba(0,176,116,0.4)]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base">apps</span>
                  <span>Todos os Cursos</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedCategory === null
                      ? 'bg-black/20 text-white'
                      : 'bg-surface-overlay text-text-tertiary'
                  }`}
                >
                  {courses.length}
                </span>
              </button>

              {/* LISTA DE CATEGORIAS DISPONÍVEIS */}
              {categories.map((cat) => {
                const isSelected = selectedCategory?.toLowerCase() === cat.name.toLowerCase();
                const count = categoryCounts[cat.name] ?? 0;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary font-bold shadow-[0_0_18px_-3px_rgba(0,176,116,0.4)]'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="material-symbols-outlined text-base">
                        {cat.icon || 'folder'}
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isSelected
                          ? 'bg-black/20 text-white'
                          : 'bg-surface-overlay text-text-tertiary'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Banner de Certificação Extracurricular */}
            <div className="mt-6 pt-5 border-t border-border-subtle">
              <div className="p-3.5 bg-surface-overlay rounded-xl border border-border-subtle flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                  verified
                </span>
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    Certificado Válido no Brasil
                  </span>
                  <p className="text-[11px] text-text-tertiary mt-1 leading-relaxed">
                    Todos os cursos acompanham certificação com carga horária reconhecida para horas complementares.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* CENTRO: EXIBIÇÃO DE TODOS OS CURSOS */}
          <main className="lg:col-span-3">
            {/* Filter Pills Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {filterPills.map((pill) => {
                  const isActive = activeFilterTag === pill;
                  return (
                    <button
                      key={pill}
                      onClick={() => setActiveFilterTag(pill)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary-container text-on-primary shadow-sm font-bold'
                          : 'bg-surface-raised text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                      }`}
                    >
                      {pill}
                    </button>
                  );
                })}
              </div>

              <span className="text-xs text-text-tertiary whitespace-nowrap">
                Mostrando <strong className="text-text-primary">{displayedCourses.length}</strong> de {courses.length} cursos
              </span>
            </div>

            {/* Lista Vazia */}
            {displayedCourses.length === 0 ? (
              <div className="p-12 text-center bg-surface-raised border border-border-subtle rounded-2xl">
                <span className="material-symbols-outlined text-5xl text-text-tertiary mb-3 block">
                  search_off
                </span>
                <h3 className="text-base font-bold text-text-primary mb-1">
                  Nenhum curso encontrado nesta categoria ou busca
                </h3>
                <p className="text-xs text-text-tertiary mb-4">
                  Tente alterar os termos da busca ou selecione "Todos os Cursos" para ver todo o catálogo.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                    setActiveFilterTag('Todos');
                  }}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl cursor-pointer hover:bg-accent-emerald-bright transition-colors"
                >
                  Ver Todos os Cursos
                </button>
              </div>
            ) : (
              /* GRID DE CURSOS NO CENTRO */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedCourses.map((course) => {
                  const isAdded = addedCourseIds.includes(course.id);

                  const effectiveBadge = getEffectiveCourseBadge(course);
                  let badgeClass = 'bg-surface-container-lowest/90 backdrop-blur-md text-accent-emerald-bright';
                  if (effectiveBadge?.variant === 'secondary') {
                    badgeClass = 'bg-secondary-container/90 backdrop-blur-md text-secondary';
                  } else if (effectiveBadge?.variant === 'dark') {
                    badgeClass = 'bg-surface-container-highest/90 backdrop-blur-md text-tertiary';
                  }

                  return (
                    <div
                      key={course.id}
                      className="group flex flex-col rounded-2xl bg-surface-raised hover:bg-surface-overlay transition-all duration-300 hover:-translate-y-1 shadow-lg overflow-hidden border border-border-subtle hover:border-primary/40"
                    >
                      {/* Course Cover Image */}
                      <div
                        className="relative w-full aspect-video overflow-hidden cursor-pointer"
                        onClick={() => onSelectCourse(course)}
                      >
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {effectiveBadge && (
                          <span
                            className={`absolute top-3 left-3 px-2.5 py-1 rounded-md font-label-sm text-label-sm font-bold shadow-md ${badgeClass}`}
                          >
                            {effectiveBadge.text}
                          </span>
                        )}
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-white font-mono">
                          {course.hours}h
                        </span>

                        {course.videoUrl && (
                          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] text-white flex items-center gap-1 font-medium shadow-xs">
                            <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                              play_circle
                            </span>
                            <span>Vídeo</span>
                          </span>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                        <div className="cursor-pointer" onClick={() => onSelectCourse(course)}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] uppercase font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                              {course.category}
                            </span>
                            <span className="text-[11px] text-text-tertiary">
                              • {course.lessonsCount} aulas
                            </span>
                          </div>

                          <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2">
                            {course.title}
                          </h3>

                          <p className="font-body-sm text-body-sm text-text-tertiary mt-1.5 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">person</span>
                            <span className="truncate">{course.instructor}</span>
                          </p>
                        </div>

                        {/* Rating & Workload */}
                        <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border-subtle">
                          <div className="flex items-center gap-1 text-accent-gold font-bold">
                            <span className="material-symbols-outlined text-sm fill-current">star</span>
                            <span>{course.rating.toFixed(1)}</span>
                            <span className="text-text-tertiary font-normal text-[11px]">
                              ({course.reviewsCount})
                            </span>
                          </div>

                          <span className="text-text-tertiary text-[11px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            Horas Complementares
                          </span>
                        </div>

                        {/* Price & Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                          <div>
                            <span className="text-[11px] text-text-tertiary line-through block">
                              R$ {course.originalPrice.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-base font-black text-accent-emerald-bright">
                              R$ {course.currentPrice.toFixed(2).replace('.', ',')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectCourse(course)}
                              className="px-3 py-2 rounded-xl text-xs font-bold text-on-primary bg-primary hover:bg-accent-emerald-bright shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                              title="Prosseguir para o curso"
                            >
                              <span>Prosseguir</span>
                              <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onAddToCart(course)}
                              className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                                isAdded
                                  ? 'bg-status-success text-white shadow-md'
                                  : 'bg-surface-overlay text-text-primary hover:bg-primary hover:text-on-primary'
                              }`}
                              title={isAdded ? 'Curso adicionado ao carrinho' : 'Adicionar ao carrinho'}
                              aria-label={isAdded ? 'Curso adicionado' : 'Adicionar ao carrinho'}
                            >
                              <span className="material-symbols-outlined text-base">
                                {isAdded ? 'check' : 'shopping_cart'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
