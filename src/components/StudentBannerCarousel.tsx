import React, { useState, useEffect, useRef } from 'react';
import { StudentBannersConfig } from '../types';

interface StudentBannerCarouselProps {
  config?: StudentBannersConfig;
  onOpenCatalog?: () => void;
}

export const StudentBannerCarousel: React.FC<StudentBannerCarouselProps> = ({
  config,
  onOpenCatalog,
}) => {
  // Se estiver desativado globalmente, oculta
  if (!config || config.enabled === false) {
    return null;
  }

  // Filtrar apenas banners ativos e que possuem imagem cadastrada
  const activeBanners = (config.banners || [])
    .filter((b) => b.enabled && b.imageUrl && b.imageUrl.trim().length > 0)
    .sort((a, b) => a.position - b.position);

  // Ocultar completamente se não houver nenhuma imagem
  if (activeBanners.length === 0) {
    return null;
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const intervalDuration = (config.intervalSeconds || 5) * 1000;
  const timerRef = useRef<any>(null);

  // Efeito do temporizador de rotação automática
  useEffect(() => {
    // Se estiver pausado ou só tiver 1 banner, não roda o intervalo
    if (isPaused || activeBanners.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, intervalDuration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, activeBanners.length, intervalDuration]);

  // Se o índice atual ficar fora do alcance por remoção de banner
  useEffect(() => {
    if (currentIndex >= activeBanners.length) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  // Alternar pausa ao clicar no carrossel
  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  return (
    <div className="w-full mb-8 animate-in fade-in duration-300">
      <div
        onClick={handleTogglePause}
        onMouseEnter={() => {
          // Pausa temporária enquanto o mouse está por cima para facilitar leitura
        }}
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX === null) return;
          const diff = touchStartX - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 40) {
            if (diff > 0) {
              setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
            } else {
              setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
            }
          }
          setTouchStartX(null);
        }}
        className="group relative w-full h-36 sm:h-48 md:h-56 lg:h-64 rounded-2xl overflow-hidden border border-border-subtle bg-surface-raised shadow-lg cursor-pointer select-none transition-all hover:border-primary/40"
        title={isPaused ? 'Carrossel Pausado. Clique para retomar a transição automática.' : 'Clique para pausar a transição automática.'}
      >
        {/* Slides */}
        {activeBanners.map((banner, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={banner.id || banner.position}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive
                  ? 'opacity-100 scale-100 z-10 pointer-events-auto'
                  : 'opacity-0 scale-[1.02] z-0 pointer-events-none'
              }`}
            >
              <img
                src={banner.imageUrl}
                alt={banner.title || `Banner do Aluno ${banner.position}`}
                className="w-full h-full object-cover"
              />

              {/* Título Informativo (se cadastrado) com degradê suave */}
              {banner.title && banner.title.trim().length > 0 && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-8 pointer-events-none">
                  <div className="max-w-2xl">
                    <h3 className="text-base sm:text-xl md:text-2xl font-black text-white leading-tight drop-shadow-md">
                      {banner.title}
                    </h3>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Contador de Slides (Canto Superior Direito) */}
        {activeBanners.length > 1 && (
          <div className="absolute top-3 right-3 z-30 pointer-events-none">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/50 backdrop-blur-md text-white/90 border border-white/20 shadow-sm">
              {currentIndex + 1} / {activeBanners.length}
            </span>
          </div>
        )}

        {/* Botões de Navegação Lateral (Anterior e Próximo) */}
        {activeBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black/60 hover:bg-black/85 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 cursor-pointer shadow-lg"
              title="Banner anterior"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black/60 hover:bg-black/85 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 cursor-pointer shadow-lg"
              title="Próximo banner"
            >
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>
          </>
        )}

        {/* Indicadores de Paginação / Dots (Base Central) */}
        {activeBanners.length > 1 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10"
          >
            {activeBanners.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                onClick={() => setCurrentIndex(dotIndex)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  dotIndex === currentIndex
                    ? 'w-6 bg-primary shadow-xs shadow-primary/60'
                    : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                title={`Ir para o banner ${dotIndex + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
