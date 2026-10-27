import React from 'react';
import { MiddlePromoBannerConfig, DEFAULT_MIDDLE_PROMO_BANNER } from '../types';
import { getCacheBustedImageUrl, FALLBACK_MIDDLE_BANNER_IMAGE } from '../lib/cacheManager';

interface MiddlePromoBannerProps {
  config?: MiddlePromoBannerConfig;
  onNavigateTarget?: (targetUrl: string) => void;
}

export const MiddlePromoBanner: React.FC<MiddlePromoBannerProps> = ({
  config = DEFAULT_MIDDLE_PROMO_BANNER,
  onNavigateTarget,
}) => {
  // If banner is disabled, render nothing to avoid blank gaps
  if (!config || !config.enabled) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!config.targetUrl) return;

    if (onNavigateTarget) {
      e.preventDefault();
      onNavigateTarget(config.targetUrl);
      return;
    }

    if (config.targetUrl.startsWith('http://') || config.targetUrl.startsWith('https://')) {
      // Let standard link open or handle external
      return;
    }

    if (config.targetUrl.startsWith('#')) {
      e.preventDefault();
      const targetElement = document.querySelector(config.targetUrl);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const isExternal = config.targetUrl?.startsWith('http://') || config.targetUrl?.startsWith('https://');

  return (
    <div className="w-full animate-in fade-in duration-300">
      <a
        href={config.targetUrl || '#'}
        target={isExternal ? '_blank' : '_self'}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        onClick={handleClick}
        className="group relative block w-full min-h-[110px] sm:min-h-[140px] md:min-h-[160px] aspect-[21/9] sm:aspect-[12/3] max-h-[220px] rounded-2xl overflow-hidden shadow-xl border border-border-subtle hover:border-primary/60 transition-all duration-300 cursor-pointer bg-surface-raised"
        title={config.altText || 'Ver oferta especial'}
      >
        <img
          src={getCacheBustedImageUrl(config.imageUrl || FALLBACK_MIDDLE_BANNER_IMAGE)}
          alt={config.altText || 'Banner Promocional Deds Academy'}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_MIDDLE_BANNER_IMAGE;
          }}
        />

        {/* Ambient Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/50 group-hover:via-black/25 transition-colors pointer-events-none" />

        {/* Content Overlay */}
        <div className="absolute inset-0 p-3.5 sm:p-6 md:p-8 flex items-center justify-between gap-3 pointer-events-none">
          <div className="max-w-[78%] sm:max-w-[75%] space-y-1 sm:space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-primary text-black shadow-md">
              <span className="material-symbols-outlined text-xs">local_offer</span>
              DESTAQUE EXCLUSIVO
            </span>
            <p className="text-white text-xs sm:text-lg md:text-xl font-extrabold tracking-tight line-clamp-2 drop-shadow-md leading-tight">
              {config.altText}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-surface-overlay/90 backdrop-blur-md border border-white/20 text-white group-hover:bg-primary group-hover:text-black transition-all shadow-lg shrink-0">
            <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap">Acessar</span>
            <span className="material-symbols-outlined text-sm sm:text-base group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </div>
      </a>
    </div>
  );
};
