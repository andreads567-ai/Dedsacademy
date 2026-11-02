import React from 'react';
import { Instructor } from '../types';

interface InstructorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructors: Instructor[];
  onSelectInstructorCourses?: (instructorName: string) => void;
}

export const InstructorsModal: React.FC<InstructorsModalProps> = ({
  isOpen,
  onClose,
  instructors,
  onSelectInstructorCourses,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface-raised border border-border-subtle rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface-overlay">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-2xl">co_present</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">
                Corpo Docente &amp; Nossos Instrutores
              </h2>
              <p className="text-xs text-text-tertiary">
                Profissionais atuantes nas principais empresas e líderes de tecnologia do país
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-container text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            title="Fechar modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Instructors Grid */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instructors.map((inst) => (
              <div
                key={inst.id}
                className="p-5 rounded-2xl bg-surface-overlay border border-border-subtle/80 hover:border-primary/40 transition-all flex flex-col justify-between gap-4 shadow-sm group"
              >
                <div className="flex items-start gap-4">
                  {inst.avatar ? (
                    <img
                      src={inst.avatar}
                      alt={inst.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/30 shrink-0 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 border-2 border-primary/30 text-primary font-extrabold text-lg flex items-center justify-center shrink-0">
                      {inst.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-text-primary truncate">{inst.name}</h3>
                      <span className="px-1.5 py-0.2 rounded bg-accent-emerald-bright/15 text-accent-emerald-bright text-[10px] font-extrabold shrink-0">
                        Ativo
                      </span>
                    </div>
                    <p className="text-xs text-primary font-medium mt-0.5 line-clamp-1">{inst.role}</p>
                    {inst.bio && (
                      <p className="text-[11px] text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
                        {inst.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border-subtle/60 flex items-center justify-between text-xs text-text-tertiary">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <span className="material-symbols-outlined text-xs">star</span>
                      <span>{inst.rating ? inst.rating.toFixed(1) : '4.9'}</span>
                    </span>
                    <span>•</span>
                    <span>{inst.coursesCount || 1} curso(s)</span>
                  </div>

                  {onSelectInstructorCourses && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectInstructorCourses(inst.name);
                      }}
                      className="px-3 py-1 rounded-lg bg-surface-raised hover:bg-primary/20 text-text-primary hover:text-primary text-[11px] font-bold transition-all cursor-pointer border border-border-subtle"
                    >
                      Ver Cursos
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-overlay flex items-center justify-between text-xs text-text-tertiary">
          <span>{instructors.length} instrutores certificados na Deds Academy</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-black font-extrabold text-xs cursor-pointer hover:bg-accent-emerald-bright transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
