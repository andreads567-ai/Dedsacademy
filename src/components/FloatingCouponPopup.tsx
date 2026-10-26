import React, { useState, useEffect, useMemo } from 'react';
import { Coupon } from '../types';
import { INITIAL_COUPONS } from '../data/promotionsData';

interface FloatingCouponPopupProps {
  activeTab: string;
  onNavigateSection?: (sectionId: string) => void;
  coupons?: Coupon[];
}

export const FloatingCouponPopup: React.FC<FloatingCouponPopupProps> = ({
  activeTab,
  onNavigateSection,
  coupons,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [tick, setTick] = useState(0);

  // Listen to real-time update events
  useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    window.addEventListener('deds_coupons_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('deds_coupons_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Load active coupon strictly from passed coupons or storage
  const activeCoupon: Coupon | null = useMemo(() => {
    let list: Coupon[] = [];
    if (coupons && Array.isArray(coupons)) {
      list = coupons;
    } else {
      try {
        const saved = localStorage.getItem('deds_coupons_list');
        list = saved ? JSON.parse(saved) : INITIAL_COUPONS;
      } catch {
        list = INITIAL_COUPONS;
      }
    }

    if (!Array.isArray(list) || list.length === 0) {
      return null;
    }

<<<<<<< HEAD
    const nowMs = Date.now();
    // STRICT FILTER: status === 'ativo' AND not expired
    const active = list.find((c) => {
      if (!c || c.status !== 'ativo') return false;
      if (c.endDateTime && new Date(c.endDateTime).getTime() < nowMs) return false;
      // Allow 12h timezone grace period on startDateTime so coupons created today are active immediately
      if (c.startDateTime && new Date(c.startDateTime).getTime() > nowMs + 12 * 60 * 60 * 1000) return false;
=======
    const now = new Date();
    // STRICT FILTER: status === 'ativo' AND not expired AND started
    const active = list.find((c) => {
      if (!c || c.status !== 'ativo') return false;
      if (c.endDateTime && new Date(c.endDateTime) < now) return false;
      if (c.startDateTime && new Date(c.startDateTime) > now) return false;
>>>>>>> origin/main
      return true;
    });

    // CRITICAL FIX: If no coupon is active, return null! NEVER fallback to list[0]!
    return active || null;
  }, [coupons, isOpen, activeTab, tick]);

  // Track scroll position on Home to display only when entering Cursos, Categorias, Certificado, Blog, Contato
  useEffect(() => {
    const handleScroll = () => {
      // In dedicated subpages (cursos, blog, contato), always show
      if (['cursos', 'blog', 'contato', 'categorias', 'certificados'].includes(activeTab)) {
        setIsVisible(true);
        return;
      }

      // On Home ('inicio'), show only when scrolled past Hero banner (e.g. scrollY > 280)
      if (activeTab === 'inicio') {
        if (window.scrollY > 280) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } else {
        // In other areas (like admin, aluno, checkout), hide
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab]);

  if (!activeCoupon || isDismissed || !isVisible) {
    return null;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(activeCoupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedDiscount =
    activeCoupon.discountType === 'percentage'
      ? `${activeCoupon.discountValue ?? 0}% OFF`
      : `R$ ${(typeof activeCoupon.discountValue === 'number' ? activeCoupon.discountValue : 0).toFixed(2).replace('.', ',')} OFF`;

  const formattedEndDate = (() => {
    try {
      return activeCoupon.endDateTime
        ? new Date(activeCoupon.endDateTime).toLocaleDateString('pt-BR')
        : 'tempo limitado';
    } catch {
      return 'tempo limitado';
    }
  })();

  return (
    <aside
      aria-label="Cupom promocional flutuante"
      className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2 select-none animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      {/* -------------------------------------------------------------
          EXPANDED CARD POPOVER
         ------------------------------------------------------------- */}
      {isOpen && (
        <div className="w-80 sm:w-88 p-5 rounded-2xl bg-surface-raised border border-primary/40 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-text-primary">
          {/* Top Decorative Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent-gold via-primary to-accent-emerald-bright" />

          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-accent-gold/15 text-accent-gold flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">local_offer</span>
              </span>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent-gold block">
                  Promoção Exclusiva Deds
                </span>
                <h4 className="text-sm font-bold text-text-primary">Cupom de Desconto Ativo</h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
              title="Minimizar pop-up"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Discount Badge & Info */}
          <div className="py-3.5 space-y-2 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 via-accent-gold/20 to-primary/20 border border-accent-gold/40 text-accent-gold font-extrabold text-sm tracking-wide shadow-sm">
              🎉 {formattedDiscount}
            </div>

            <p className="text-xs text-text-secondary leading-relaxed px-2">
              {activeCoupon.description ||
                `Aproveite o desconto especial para se matricular com certificado válido em qualquer formação.`}
            </p>

            <span className="text-[11px] text-text-tertiary block font-mono">
              Válido até {formattedEndDate}
            </span>
          </div>

          {/* Coupon Code Pill with Copy Action */}
          <div className="p-3 bg-surface-overlay border border-dashed border-primary/50 rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary text-base shrink-0">confirmation_number</span>
              <span className="font-mono font-extrabold text-sm tracking-wider text-text-primary truncate">
                {activeCoupon.code}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs ${
                copied
                  ? 'bg-status-success text-white'
                  : 'bg-primary hover:bg-accent-emerald-bright text-on-primary active:scale-95'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          {/* Bottom Actions */}
          <div className="mt-3.5 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsDismissed(true);
              }}
              className="text-[11px] text-text-tertiary hover:text-text-secondary underline cursor-pointer"
            >
              Não mostrar novamente
            </button>

            {onNavigateSection && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateSection('cursos-section');
                }}
                className="text-[11px] font-bold text-primary hover:text-accent-emerald-bright flex items-center gap-0.5 cursor-pointer"
              >
                <span>Usar nos Cursos</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MINIMIZED FLOATING BUTTON / PILL (ALWAYS VISIBLE)
         ------------------------------------------------------------- */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-surface-raised border border-accent-gold/50 shadow-[0_4px_20px_rgba(251,191,36,0.25)] hover:border-accent-gold hover:shadow-[0_4px_24px_rgba(251,191,36,0.4)] transition-all cursor-pointer backdrop-blur-md active:scale-95"
      >
        <span className="w-6 h-6 rounded-full bg-accent-gold text-slate-950 flex items-center justify-center shrink-0 animate-bounce">
          <span className="material-symbols-outlined text-sm font-bold">local_offer</span>
        </span>

        <span className="text-xs font-extrabold text-accent-gold tracking-wide flex items-center gap-1">
          <span>Cupom: </span>
          <span className="font-mono text-text-primary group-hover:text-accent-gold transition-colors">
            {activeCoupon.code}
          </span>
          <span className="px-1.5 py-0.2 rounded bg-accent-gold/20 text-accent-gold text-[10px] ml-0.5">
            {formattedDiscount}
          </span>
        </span>

        <span className="material-symbols-outlined text-xs text-text-tertiary group-hover:text-text-primary transition-colors ml-0.5">
          {isOpen ? 'expand_more' : 'expand_less'}
        </span>
      </button>
    </aside>
  );
};
