import React, { useState } from 'react';
import { Course } from '../types';
import { getEffectiveCourseBadge } from '../utils/courseBadgeUtils';

interface CoursesSectionProps {
  courses: Course[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  onAddToCart: (course: Course) => void;
  onSelectCourse: (course: Course) => void;
  addedCourseIds: string[];
  onOpenCatalog?: () => void;
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({
  courses,
  activeFilter,
  setActiveFilter,
  onAddToCart,
  onSelectCourse,
  addedCourseIds,
  onOpenCatalog,
}) => {
  const filterOptions = ['Em alta', 'Mais vendidos', 'Lançamentos', 'Com Certificação'];

  const filteredCourses = activeFilter === 'Todos'
    ? courses
    : courses.filter((c) => {
        if (activeFilter === 'Lançamentos') {
          const effectiveBadge = getEffectiveCourseBadge(c);
          const hasLaunchCategory =
            c.category?.toLowerCase().includes('lançamento') ||
            c.category?.toLowerCase().includes('lancamento');
          const hasLaunchBadge =
            c.badge?.text?.toLowerCase().includes('lançamento') ||
            c.badge?.text?.toLowerCase().includes('lancamento') ||
            effectiveBadge?.text?.toLowerCase().includes('lançamento') ||
            effectiveBadge?.text?.toLowerCase().includes('lancamento') ||
            c.isAutoLaunchBadge === true;
          const hasLaunchTag =
            c.filterTags &&
            c.filterTags.some(
              (tag) =>
                tag.toLowerCase().includes('lançamento') ||
                tag.toLowerCase().includes('lancamento') ||
                tag.toLowerCase().includes('novos')
            );
          return hasLaunchCategory || hasLaunchBadge || hasLaunchTag;
        }

        if (activeFilter === 'Em alta') {
          return (
            c.filterTags?.includes('Em alta') ||
            c.filterTags?.includes('Destaque') ||
            c.rating >= 4.8
          );
        }

        if (activeFilter === 'Mais vendidos') {
          return (
            c.filterTags?.includes('Mais vendidos') ||
            c.reviewsCount >= 40 ||
            (c.studentsCount || 0) >= 100
          );
        }

        if (activeFilter === 'Com Certificação') {
          return (
            c.filterTags?.includes('Com Certificação') ||
            (c.hours && c.hours > 0)
          );
        }

        return c.filterTags?.includes(activeFilter);
      });

  const displayCourses = filteredCourses;

  return (
    <section id="cursos-section" className="w-full py-16 lg:py-24 bg-surface-base">
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop">
        {/* Section Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="font-label-md text-label-md font-semibold text-primary uppercase tracking-wider">
              Aprenda com Prática
            </span>
            <h2 className="font-headline-lg text-headline-lg font-bold text-text-primary mt-1">
              Cursos em Destaque
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {filterOptions.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(isActive ? 'Todos' : filter)}
                  className={`px-4 py-2 rounded-full font-label-md text-label-md font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-primary-container text-on-primary shadow-[0_0_15px_-3px_rgba(0,176,116,0.4)]'
                      : 'bg-surface-raised text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                  }`}
                >
                  {filter}
                </button>
              );
            })}

            <button
              onClick={() => {
                if (onOpenCatalog) {
                  onOpenCatalog();
                } else {
                  setActiveFilter('Todos');
                }
              }}
              className="flex items-center gap-1 ml-2 sm:ml-4 font-label-md sm:font-label-lg text-xs sm:text-label-lg text-primary hover:text-accent-emerald-bright transition-colors cursor-pointer shrink-0"
              title="Acessar catálogo completo de cursos"
            >
              <span>Ver todos</span>
              <span className="material-symbols-outlined text-body-lg">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        {displayCourses.length === 0 ? (
          <div className="text-center py-16 px-4 bg-surface-raised rounded-2xl border border-border-subtle max-w-md mx-auto space-y-3">
            <span className="material-symbols-outlined text-4xl text-primary">search_off</span>
            <p className="text-sm font-bold text-text-primary">Nenhum curso encontrado com o filtro "{activeFilter}"</p>
            <p className="text-xs text-text-tertiary">Explore todas as opções disponíveis em nosso catálogo.</p>
            <button
              type="button"
              onClick={() => setActiveFilter('Todos')}
              className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Exibir Todos os Cursos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {displayCourses.map((course) => {
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
                  className="group flex flex-col rounded-2xl bg-surface-raised hover:bg-surface-overlay transition-all duration-300 hover:-translate-y-1 shadow-lg overflow-hidden border border-border-subtle hover:border-border-strong"
                >
                  {/* Image Container */}
                  <div
                    className="relative w-full aspect-video overflow-hidden cursor-pointer"
                    onClick={() => onSelectCourse(course)}
                  >
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={course.title}
                      src={course.image}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    {effectiveBadge && (
                      <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md font-label-sm text-label-sm font-bold shadow-md ${badgeClass}`}>
                        {effectiveBadge.text}
                      </span>
                    )}
                    {course.videoUrl && (
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] text-white flex items-center gap-1 font-medium shadow-xs">
                        <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                          play_circle
                        </span>
                        <span>Vídeo</span>
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                    <div className="cursor-pointer" onClick={() => onSelectCourse(course)}>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="font-body-sm text-body-sm text-text-tertiary mt-1 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-body-sm">person</span>
                        {course.instructor}
                      </p>
                    </div>

                    {/* Rating & Hours */}
                    <div className="flex items-center justify-between text-body-sm font-body-sm text-text-secondary">
                      <div className="flex items-center gap-1 text-accent-gold font-bold">
                        <span className="material-symbols-outlined text-body-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span>{course.rating.toFixed(1)}</span>
                        <span className="text-text-tertiary font-normal">({course.reviewsCount})</span>
                      </div>
                      <div className="flex items-center gap-1 text-text-tertiary">
                        <span className="material-symbols-outlined text-body-md">schedule</span>
                        <span>{course.hours}h</span>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between pt-3 bg-surface-container-lowest/40 -mx-4 -mb-4 px-4 py-3 border-t border-border-subtle/40">
                      <div>
                        <span className="font-label-sm text-label-sm text-text-tertiary line-through block leading-none">
                          R$ {course.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="font-headline-sm text-headline-sm font-bold text-text-primary">
                          R$ {course.currentPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAddToCart(course)}
                        className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
                          isAdded
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container hover:bg-primary hover:text-on-primary text-text-primary'
                        }`}
                        title={isAdded ? 'No carrinho' : 'Adicionar ao carrinho'}
                      >
                        <span className="material-symbols-outlined text-headline-sm">
                          {isAdded ? 'check' : 'add_shopping_cart'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile Ver Todos Link */}
        <div className="mt-8 flex lg:hidden justify-center">
          <button
            onClick={() => {
              if (onOpenCatalog) {
                onOpenCatalog();
              } else {
                setActiveFilter('Todos');
              }
            }}
            className="px-6 py-3 rounded-lg bg-surface-raised text-primary font-label-lg text-label-lg flex items-center gap-2 cursor-pointer hover:bg-surface-overlay"
          >
            <span>Ver todos os cursos</span>
            <span className="material-symbols-outlined text-body-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </section>
  );
};
