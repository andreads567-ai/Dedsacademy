import React from 'react';
import { Course } from '../types';
import { getEffectiveCourseBadge } from '../utils/courseBadgeUtils';

interface CourseDetailModalProps {
  course: Course | null;
  onClose: () => void;
  onAddToCart: (course: Course) => void;
  isAdded: boolean;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  onClose,
  onAddToCart,
  isAdded,
}) => {
  if (!course) return null;

  const effectiveBadge = getEffectiveCourseBadge(course);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Banner with course preview image */}
        <div className="relative w-full h-56 shrink-0 overflow-hidden">
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
          >
            <span className="material-symbols-outlined text-body-lg">close</span>
          </button>

          {/* Badge & Category */}
          <div className="absolute top-4 left-4 flex gap-2">
            {effectiveBadge && (
              <span className="px-3 py-1 rounded-md bg-primary-container text-on-primary font-label-sm font-bold shadow">
                {effectiveBadge.text}
              </span>
            )}
            <span className="px-3 py-1 rounded-md bg-surface-overlay/80 backdrop-blur-md text-text-secondary font-label-sm font-medium">
              {course.category}
            </span>
          </div>

          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-headline-lg font-bold text-text-primary leading-tight">
              {course.title}
            </h2>
            <p className="text-body-sm text-text-tertiary mt-1 flex items-center gap-2">
              <span>Instrutor: <strong className="text-text-secondary">{course.instructor}</strong></span>
              <span>•</span>
              <span className="text-accent-emerald-bright font-medium">Horas Complementares • Lei 9.394/96</span>
            </p>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-surface-overlay border border-border-subtle text-center">
            <div>
              <span className="text-label-sm text-text-tertiary block">Avaliação</span>
              <div className="flex items-center justify-center gap-1 text-accent-gold font-bold text-body-md mt-0.5">
                <span className="material-symbols-outlined text-body-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span>{course.rating.toFixed(1)}</span>
                <span className="text-text-tertiary text-label-sm">({course.reviewsCount})</span>
              </div>
            </div>
            <div>
              <span className="text-label-sm text-text-tertiary block">Carga Horária</span>
              <span className="text-body-md font-bold text-text-primary block mt-0.5">{course.hours} Horas</span>
            </div>
            <div>
              <span className="text-label-sm text-text-tertiary block">Videoaulas</span>
              <span className="text-body-md font-bold text-text-primary block mt-0.5">{course.lessonsCount || 80}+ Aulas</span>
            </div>
            <div>
              <span className="text-label-sm text-text-tertiary block">Certificado</span>
              <span className="text-body-md font-bold text-accent-emerald-bright block mt-0.5">Incluso Digital</span>
            </div>
          </div>

          {/* Video Preview if imported */}
          {course.videoUrl && (
            <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_circle
                </span>
                <h3 className="text-label-lg font-bold text-text-primary">
                  Vídeo de Apresentação
                </h3>
                {course.videoFileName && (
                  <span className="text-[11px] text-text-tertiary truncate">
                    ({course.videoFileName})
                  </span>
                )}
              </div>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-border-subtle">
                <video
                  src={course.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  poster={course.image}
                >
                  Seu navegador não suporta a reprodução de vídeo.
                </video>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-label-lg font-bold text-text-primary mb-2">Sobre o Curso</h3>
            <p className="text-body-md text-text-secondary leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Syllabus / Modules & Lessons */}
          {course.modules && course.modules.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-label-lg font-bold text-text-primary">Conteúdo &amp; Módulos Programáticos</h3>
                <span className="text-xs text-text-tertiary">
                  {course.modules.length} módulos • {course.modules.reduce((a, m) => a + m.lessons.length, 0)} aulas
                </span>
              </div>
              <div className="space-y-3">
                {course.modules.map((mod, modIdx) => (
                  <div key={mod.id || modIdx} className="rounded-xl border border-border-subtle bg-surface-container/60 overflow-hidden">
                    <div className="p-3 bg-surface-overlay/50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {modIdx + 1}
                        </span>
                        <span className="text-body-sm font-bold text-text-primary">{mod.title}</span>
                      </div>
                      <span className="text-[11px] text-text-tertiary font-medium">
                        {mod.lessons.length} {mod.lessons.length === 1 ? 'aula' : 'aulas'}
                      </span>
                    </div>

                    {mod.lessons.length > 0 && (
                      <div className="p-2 space-y-1.5 border-t border-border-subtle/50">
                        {mod.lessons.map((les, lesIdx) => (
                          <div key={les.id || lesIdx} className="p-2 rounded-lg bg-surface-raised/50 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="material-symbols-outlined text-primary text-sm shrink-0">play_circle</span>
                              <span className="text-text-primary font-medium truncate">{les.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                              {les.attachments && les.attachments.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">attachment</span>
                                  {les.attachments.length} mat.
                                </span>
                              )}
                              {les.quiz && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">quiz</span>
                                  Quiz ({les.quiz.maxAttempts === 0 ? 'Ilimitado' : `${les.quiz.maxAttempts} tent.`})
                                </span>
                              )}
                              {les.duration && (
                                <span className="text-text-tertiary font-mono">{les.duration}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : course.syllabus && (
            <div>
              <h3 className="text-label-lg font-bold text-text-primary mb-3">Conteúdo Programático</h3>
              <div className="space-y-2">
                {course.syllabus.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-container/60 border border-border-subtle flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-surface-overlay text-primary flex items-center justify-center text-label-sm font-bold">
                        {idx + 1}
                      </div>
                      <span className="text-body-sm font-medium text-text-primary">{item}</span>
                    </div>
                    <span className="material-symbols-outlined text-text-tertiary text-body-md">
                      play_circle
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-body-sm text-text-secondary">
              <span className="material-symbols-outlined text-primary text-body-lg">verified</span>
              <span>Certificado com QR Code e autenticação</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm text-text-secondary">
              <span className="material-symbols-outlined text-primary text-body-lg">all_inclusive</span>
              <span>Acesso vitalício aos materiais</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm text-text-secondary">
              <span className="material-symbols-outlined text-primary text-body-lg">forum</span>
              <span>Comunidade e suporte com instrutor</span>
            </div>
            <div className="flex items-center gap-2 text-body-sm text-text-secondary">
              <span className="material-symbols-outlined text-primary text-body-lg">check_circle</span>
              <span>Garantia incondicional de 7 dias</span>
            </div>
          </div>
        </div>

        {/* Footer with Purchase */}
        <div className="p-5 border-t border-border-subtle bg-surface-container-lowest flex items-center justify-between gap-4 shrink-0">
          <div>
            <span className="text-label-sm text-text-tertiary line-through block">
              De R$ {course.originalPrice.toFixed(2).replace('.', ',')}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-label-sm font-bold text-text-secondary">Por</span>
              <span className="text-headline-md font-bold text-text-primary">
                R$ {course.currentPrice.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-label-sm text-accent-emerald-bright font-bold">
                (À vista ou 12x)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onAddToCart(course)}
              className={`px-6 py-3.5 rounded-xl font-label-lg font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isAdded
                  ? 'bg-primary text-on-primary'
                  : 'bg-primary-container hover:bg-accent-emerald-bright text-on-primary shadow-[0_0_20px_-3px_rgba(0,176,116,0.4)]'
              }`}
            >
              <span className="material-symbols-outlined text-headline-sm">
                {isAdded ? 'check' : 'shopping_cart'}
              </span>
              <span>{isAdded ? 'Adicionado ao Carrinho' : 'Prosseguir para Matrícula'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
