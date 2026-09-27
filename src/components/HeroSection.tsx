import React, { useState } from 'react';
import { HeroBannerConfig, DEFAULT_HERO_BANNER, MiddlePromoBannerConfig } from '../types';
import { MiddlePromoBanner } from './MiddlePromoBanner';
import { KnowledgeRocketEarthAnimation } from './KnowledgeRocketEarthAnimation';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  onSelectTag: (tag: string) => void;
  onOpenCertificateModal: () => void;
  onOpenAuth?: (mode: 'login' | 'register', role?: 'aluno' | 'admin') => void;
  onOpenRegister?: () => void;
  heroBannerConfig?: HeroBannerConfig;
  middleBannerConfig?: MiddlePromoBannerConfig;
  onNavigateTarget?: (targetUrl: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearch,
  onSelectTag,
  onOpenCertificateModal,
  onOpenAuth,
  onOpenRegister,
  heroBannerConfig,
  middleBannerConfig,
  onNavigateTarget,
}) => {
  const banner = heroBannerConfig || DEFAULT_HERO_BANNER;
  const [searchInput, setSearchInput] = useState('');

  const popularTags = [
    'Excel Avançado',
    'Python & IA',
    'Liderança',
    'Marketing Digital',
    'UI/UX Design',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput);
    }
  };

  return (
    <section
      id="hero-section"
      className={`relative w-full overflow-hidden bg-surface-container-lowest -mt-20 pt-28 ${
        middleBannerConfig?.enabled ? 'pb-12 lg:pb-16' : 'pb-16 lg:pb-24'
      }`}
    >
      {/* Ambient Radial Glows */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-[500px] h-[500px] bg-accent-emerald-bright/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & Search */}
          <div className="lg:col-span-7 flex flex-col gap-6 z-10">
            <div
              onClick={onOpenCertificateModal}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-overlay self-start cursor-pointer hover:bg-surface-container-high transition-colors"
              title="Clique para validar certificação e horas complementares"
            >
              <span className="w-2 h-2 rounded-full bg-accent-emerald-bright animate-pulse" />
              <span className="font-label-md text-label-md text-primary font-semibold tracking-wide">
                CERTIFICADO PARA HORAS COMPLEMENTARES • LEI 9.394/96
              </span>
            </div>

            {/* Headline with interactive Knowledge Rocket & Earth Animation */}
            <div className="relative">
              <h1 className="font-display text-display font-extrabold text-text-primary tracking-tight leading-none">
                Aprenda.<br />
                Evolua.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-emerald-bright to-secondary">
                  Conquiste.
                </span>
              </h1>

              {/* Desktop position: precisely positioned in the empty gap between the text and the photo card */}
              <div className="hidden lg:block absolute -top-12 right-0 xl:-right-10 w-[340px] xl:w-[380px] h-[240px] pointer-events-none z-20">
                <KnowledgeRocketEarthAnimation className="w-full h-full" />
              </div>
            </div>

            {/* Mobile / Tablet position: centered gracefully between headline and text */}
            <div className="lg:hidden w-full max-w-[320px] h-[190px] mx-auto scale-90 sm:scale-95 my-1 pointer-events-none">
              <KnowledgeRocketEarthAnimation className="w-full h-full" />
            </div>

            <p className="font-body-lg text-body-lg text-text-secondary max-w-xl">
              Cursos online com certificado reconhecido em todo o Brasil para acelerar sua carreira profissional, conquistar promoções e dominar as tecnologias mais requisitadas.
            </p>

            {/* Search Box */}
            <form
              onSubmit={handleSubmit}
              className="mt-2 p-2 rounded-xl bg-surface-raised shadow-[0_12px_32px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row items-center gap-2 max-w-2xl border border-border-subtle focus-within:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-3 px-3 py-2 flex-1 w-full text-text-tertiary focus-within:text-text-primary">
                <span className="material-symbols-outlined text-headline-sm">search</span>
                <input
                  id="hero-course-search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-transparent border-none outline-none font-body-md text-body-md text-text-primary placeholder:text-text-tertiary"
                  placeholder="Buscar cursos, categorias ou habilidades..."
                  type="text"
                />
              </div>
              <button
                type="submit"
                id="hero-search-button"
                className="w-full sm:w-auto px-8 py-3.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-label-lg text-label-lg rounded-lg font-bold shadow-[0_0_24px_-2px_rgba(0,176,116,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Buscar</span>
                <span className="material-symbols-outlined text-body-lg">arrow_forward</span>
              </button>
            </form>

            {/* Quick tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-label-sm text-label-sm text-text-tertiary uppercase tracking-wider">
                Populares:
              </span>
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchInput(tag);
                    onSelectTag(tag);
                  }}
                  className="px-3 py-1 rounded-full bg-surface-overlay text-text-secondary hover:text-text-primary hover:bg-surface-container-high text-label-sm font-label-sm transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Stage with Floating Badges */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            {/* Main Hero Visual Card */}
            <div className="relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl bg-surface-raised border border-border-subtle">
              <img
                className="w-full h-full object-cover"
                alt="Banner Principal Deds Academy"
                src={banner.imageUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/30 to-transparent" />

              {/* Capstone Academy Graphic Overlay */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-surface-overlay/90 backdrop-blur-md flex items-center justify-between border border-border-subtle/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-headline-sm">workspace_premium</span>
                  </div>
                  <div>
                    <div className="font-headline-sm text-label-lg font-bold text-text-primary leading-tight">
                      {banner.overlayTitle}
                    </div>
                    <div className="font-body-sm text-body-sm text-accent-emerald-bright font-medium">
                      {banner.overlaySubtitle}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-accent-gold font-label-md text-label-md">
                  <span className="material-symbols-outlined text-body-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="ml-1 text-text-primary font-bold">
                    {banner.ratingScore.includes('/') ? banner.ratingScore.split('/')[0].trim() : banner.ratingScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Metric Badge 1 (Top Left Overlapping) */}
            <div
              className="absolute -top-4 -left-4 sm:-left-8 p-3.5 rounded-xl bg-surface-overlay/95 backdrop-blur-md shadow-xl hidden sm:flex items-center gap-3 animate-bounce border border-border-subtle"
              style={{ animationDuration: '4s' }}
            >
              <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-body-lg">verified</span>
              </div>
              <div>
                <span className="block font-headline-sm text-label-lg text-text-primary font-bold leading-none">
                  {banner.badge1Number}
                </span>
                <span className="font-label-sm text-label-sm text-text-secondary">
                  {banner.badge1Text}
                </span>
              </div>
            </div>

            {/* Floating Metric Badge 2 (Bottom Right) */}
            <div className="absolute -bottom-6 -right-2 sm:-right-6 p-4 rounded-xl bg-surface-raised shadow-2xl flex flex-col gap-2 max-w-[210px] border border-border-subtle">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase font-bold text-text-tertiary">
                  Avaliações
                </span>
                <div className="flex text-accent-gold text-label-sm">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className="material-symbols-outlined text-label-md"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>
              <div className="font-headline-sm text-headline-sm font-bold text-text-primary">
                {banner.ratingScore}
              </div>
              <div className="font-body-sm text-body-sm text-text-tertiary">
                {banner.reviewsCountText}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Pill Strip */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle/50 flex items-center gap-4 hover:bg-surface-overlay transition-colors">
            <div className="w-12 h-12 rounded-lg bg-surface-overlay flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-headline-md">card_membership</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-label-lg font-bold text-text-primary leading-snug">
                Certificado Válido
              </h4>
              <p className="font-body-sm text-body-sm text-text-tertiary">
                Válido em todo o país para horas e currículo
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle/50 flex items-center gap-4 hover:bg-surface-overlay transition-colors">
            <div className="w-12 h-12 rounded-lg bg-surface-overlay flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-headline-md">all_inclusive</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-label-lg font-bold text-text-primary leading-snug">
                Acesso Ilimitado
              </h4>
              <p className="font-body-sm text-body-sm text-text-tertiary">
                Assista quando e onde quiser, sem expiração
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle/50 flex items-center gap-4 hover:bg-surface-overlay transition-colors">
            <div className="w-12 h-12 rounded-lg bg-surface-overlay flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-headline-md">devices</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-label-lg font-bold text-text-primary leading-snug">
                Estude do seu jeito
              </h4>
              <p className="font-body-sm text-body-sm text-text-tertiary">
                No smartphone, tablet ou computador
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle/50 flex items-center gap-4 hover:bg-surface-overlay transition-colors">
            <div className="w-12 h-12 rounded-lg bg-surface-overlay flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-headline-md">verified_user</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-label-lg font-bold text-text-primary leading-snug">
                Garantia de 7 Dias
              </h4>
              <p className="font-body-sm text-body-sm text-text-tertiary">
                100% de reembolso se não gostar
              </p>
            </div>
          </div>
        </div>

        {/* Banner Retangular Intermediário (Faixa Promocional / Lead Banner) */}
        {middleBannerConfig?.enabled && (
          <div className="mt-8 sm:mt-10 w-full">
            <MiddlePromoBanner
              config={middleBannerConfig}
              onNavigateTarget={onNavigateTarget}
            />
          </div>
        )}
      </div>
    </section>
  );
};
