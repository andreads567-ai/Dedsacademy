import React from 'react';

interface CtaSectionProps {
  onExploreCourses: () => void;
  onOpenRegister: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({
  onExploreCourses,
  onOpenRegister,
}) => {
  return (
    <section id="cta-section" className="w-full py-16 lg:py-24 bg-surface-container-lowest relative overflow-hidden">
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop">
        <div className="relative rounded-3xl p-8 lg:p-16 bg-gradient-to-r from-surface-raised via-surface-overlay to-surface-raised text-center flex flex-col items-center gap-6 shadow-2xl overflow-hidden border border-border-subtle">
          {/* Background Ambient Accent Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-base text-primary font-label-sm text-label-sm font-semibold border border-primary/20">
            <span className="material-symbols-outlined text-body-sm">bolt</span>
            <span>ACESSO IMEDIATO APÓS A MATRÍCULA</span>
          </div>

          <h2 className="font-display text-headline-lg lg:text-display font-extrabold text-text-primary max-w-3xl leading-tight">
            Pronto para dar o próximo grande passo na sua carreira?
          </h2>

          <p className="font-body-lg text-body-lg text-text-secondary max-w-2xl">
            Junte-se a mais de 10.000 profissionais que já aceleraram seus currículos e conquistaram novas posições no mercado com a Deds Academy.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 z-10 w-full sm:w-auto">
            <button
              onClick={onExploreCourses}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-label-lg text-label-lg font-bold shadow-[0_0_24px_-2px_rgba(0,176,116,0.45)] transition-all active:scale-95 cursor-pointer"
            >
              Explorar Todos os Cursos
            </button>
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-text-primary font-label-lg text-label-lg font-semibold transition-colors cursor-pointer border border-border-subtle"
            >
              Criar Conta Gratuita
            </button>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-text-tertiary font-body-sm text-body-sm z-10">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-body-md text-primary">check</span>
              Sem mensalidades surpresa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-body-md text-primary">check</span>
              Certificados inclusos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-body-md text-primary">check</span>
              Acesso vitalício disponível
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
