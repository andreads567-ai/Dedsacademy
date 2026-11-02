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
        {/* Rounded rectangular card with animated background elements */}
        <div className="relative rounded-3xl p-8 lg:p-16 bg-gradient-to-br from-[#0B101B] via-[#0E1524] to-[#0B101B] text-center flex flex-col items-center gap-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden border border-[#1F2E47]">
          {/* Ambient Radial Gradient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none animate-pulse duration-3000" />
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent-emerald-bright/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Animated Tech Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #00C0A0 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* =========================================================================
              FLOATING ANIMATED COURSE & TEMPLATE GRAPHICS (Deds Academy Themed)
             ========================================================================= */}

          {/* Floating Course Template Card 1 (Top Left) */}
          <div className="hidden xl:flex absolute top-8 left-8 items-center gap-3 p-3 rounded-2xl bg-[#111927]/85 backdrop-blur-md border border-[#1E2E48] shadow-2xl pointer-events-none animate-[bounce_5s_ease-in-out_infinite] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent-emerald-bright flex items-center justify-center text-black font-extrabold shadow-md">
              <span className="material-symbols-outlined text-lg">code</span>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">Formação Tech</span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald-bright animate-ping" />
              </div>
              <p className="text-xs font-bold text-white">Fullstack &amp; Inteligência Artificial</p>
              <div className="flex items-center gap-1 text-[10px] text-amber-400 mt-0.5">
                <span>★ 4.9</span>
                <span className="text-text-tertiary">• 120 horas</span>
              </div>
            </div>
          </div>

          {/* Floating Certificate Card 2 (Top Right) */}
          <div className="hidden xl:flex absolute top-10 right-8 items-center gap-3 p-3 rounded-2xl bg-[#111927]/85 backdrop-blur-md border border-accent-emerald-bright/30 shadow-2xl pointer-events-none animate-[pulse_4s_ease-in-out_infinite] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-accent-emerald-bright/20 border border-accent-emerald-bright/40 text-accent-emerald-bright flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-xl">verified</span>
            </div>
            <div className="text-left">
              <span className="px-2 py-0.2 rounded bg-accent-emerald-bright/20 text-accent-emerald-bright text-[9px] font-extrabold uppercase">
                Válido em todo Brasil
              </span>
              <p className="text-xs font-bold text-white mt-0.5">Certificado Oficial MEC</p>
              <span className="text-[10px] text-text-tertiary">Lei Federal 9.394/96 • QR Code</span>
            </div>
          </div>

          {/* Floating Code Template Card 3 (Bottom Left) */}
          <div className="hidden lg:flex absolute bottom-8 left-10 items-center gap-2.5 p-3 rounded-2xl bg-[#0F1726]/90 backdrop-blur-md border border-[#20314E] shadow-2xl pointer-events-none opacity-85">
            <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-mono font-bold text-xs">
              &lt;/&gt;
            </div>
            <div className="text-left font-mono text-[11px]">
              <span className="text-slate-400">const</span> <span className="text-primary">aluno</span> = <span className="text-amber-300">&quot;Deds Pro&quot;</span>;
              <p className="text-[10px] text-emerald-400 font-sans font-semibold mt-0.5">✓ Salário +65% acelerado</p>
            </div>
          </div>

          {/* Floating Community Card 4 (Bottom Right) */}
          <div className="hidden lg:flex absolute bottom-8 right-10 items-center gap-2.5 p-3 rounded-2xl bg-[#0F1726]/90 backdrop-blur-md border border-[#20314E] shadow-2xl pointer-events-none opacity-85">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-primary/30 border border-primary text-primary flex items-center justify-center text-[10px] font-bold">
                AD
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-500/30 border border-emerald-400 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                JS
              </div>
              <div className="w-7 h-7 rounded-full bg-purple-500/30 border border-purple-400 text-purple-300 flex items-center justify-center text-[10px] font-bold">
                CM
              </div>
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">+10.000 Alunos</span>
              <span className="text-[10px] text-text-tertiary">Comunidade Ativa</span>
            </div>
          </div>

          {/* Small Floating Icons for Mobile & Tablet */}
          <div className="xl:hidden absolute top-4 left-4 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center animate-bounce">
            <span className="material-symbols-outlined text-sm">rocket_launch</span>
          </div>
          <div className="xl:hidden absolute top-4 right-4 w-8 h-8 rounded-lg bg-accent-emerald-bright/10 border border-accent-emerald-bright/20 text-accent-emerald-bright flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-sm">verified</span>
          </div>

          {/* =========================================================================
              MAIN FOREGROUND CTA CONTENT
             ========================================================================= */}
          <div className="relative z-10 flex flex-col items-center gap-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131D2E] text-primary font-label-sm text-xs font-extrabold border border-primary/30 shadow-xs">
              <span className="material-symbols-outlined text-sm animate-pulse text-accent-emerald-bright">bolt</span>
              <span>ACESSO IMEDIATO APÓS A MATRÍCULA</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight">
              Pronto para dar o próximo grande passo na sua carreira?
            </h2>

            <p className="font-body-lg text-sm sm:text-base lg:text-lg text-text-secondary max-w-2xl leading-relaxed">
              Junte-se a mais de 10.000 profissionais que já aceleraram seus currículos e conquistaram novas posições no mercado com a Deds Academy.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onExploreCourses}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-label-lg text-base font-bold shadow-[0_0_24px_-2px_rgba(0,176,116,0.45)] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>Explorar Todos os Cursos</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenRegister}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-surface-raised hover:bg-surface-overlay text-text-primary font-label-lg text-base font-bold transition-all cursor-pointer border border-border-subtle hover:border-primary/50 shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg text-primary">person_add</span>
                <span>Criar Conta Gratuita</span>
              </button>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-text-tertiary font-body-sm text-xs sm:text-sm">
              <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                Sem mensalidades surpresa
              </span>
              <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                Certificados inclusos (MEC)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                Acesso vitalício disponível
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
