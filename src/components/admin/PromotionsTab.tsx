import React, { useState, useEffect } from 'react';
import { Course, Coupon, PromotionalCampaign } from '../../types';

interface PromotionsTabProps {
  courses: Course[];
  coupons: Coupon[];
  campaigns: PromotionalCampaign[];
  onAddCoupon: (coupon: Coupon) => void;
  onUpdateCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (couponId: string) => void;
  onAddCampaign: (campaign: PromotionalCampaign) => void;
  onUpdateCampaign: (campaign: PromotionalCampaign) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onUpdateCourse: (course: Course) => void;
}

export const PromotionsTab: React.FC<PromotionsTabProps> = ({
  courses,
  coupons,
  campaigns,
  onAddCoupon,
  onUpdateCoupon,
  onDeleteCoupon,
  onAddCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  onUpdateCourse,
}) => {
  // Internal tab state: 'cupons' | 'campanhas'
  const [internalTab, setInternalTab] = useState<'cupons' | 'campanhas'>('cupons');

  // -------------------------------------------------------------
  // ABA 1: CUPONS DE DESCONTO STATE & LOGIC
  // -------------------------------------------------------------
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponStatusFilter, setCouponStatusFilter] = useState<'todos' | 'ativo' | 'expirado' | 'inativo'>('todos');
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  // Form state for Cupom
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    startDateTime: new Date().toISOString().slice(0, 16),
    endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    usageLimitPerCpf: 1,
    usageLimitTotal: 100,
    description: '',
  });

  const handleOpenNewCouponModal = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      discountType: 'percentage',
      discountValue: 15,
      startDateTime: new Date().toISOString().slice(0, 16),
      endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      usageLimitPerCpf: 1,
      usageLimitTotal: 200,
      description: '',
    });
    setIsCouponModalOpen(true);
  };

  const handleOpenEditCouponModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      startDateTime: coupon.startDateTime.slice(0, 16),
      endDateTime: coupon.endDateTime.slice(0, 16),
      usageLimitPerCpf: coupon.usageLimitPerCpf,
      usageLimitTotal: coupon.usageLimitTotal,
      description: coupon.description || '',
    });
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponForm.code.trim().toUpperCase();
    if (!cleanCode) return;

    if (editingCoupon) {
      const updated: Coupon = {
        ...editingCoupon,
        code: cleanCode,
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue) || 0,
        startDateTime: couponForm.startDateTime,
        endDateTime: couponForm.endDateTime,
        usageLimitPerCpf: Number(couponForm.usageLimitPerCpf) || 1,
        usageLimitTotal: Number(couponForm.usageLimitTotal) || 100,
        description: couponForm.description,
      };
      onUpdateCoupon(updated);
    } else {
      const newCoupon: Coupon = {
        id: `cupom-${Date.now()}`,
        code: cleanCode,
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue) || 0,
        startDateTime: couponForm.startDateTime,
        endDateTime: couponForm.endDateTime,
        usageLimitPerCpf: Number(couponForm.usageLimitPerCpf) || 1,
        usageLimitTotal: Number(couponForm.usageLimitTotal) || 100,
        currentUses: 0,
        status: 'ativo',
        description: couponForm.description,
        createdAt: new Date().toISOString(),
      };
      onAddCoupon(newCoupon);
    }

    setIsCouponModalOpen(false);
    setEditingCoupon(null);
  };

  const handleToggleCouponStatus = (coupon: Coupon) => {
    const nextStatus = coupon.status === 'ativo' ? 'inativo' : 'ativo';
    onUpdateCoupon({
      ...coupon,
      status: nextStatus,
    });
  };

  const handleCopyCouponCode = (coupon: Coupon) => {
    navigator.clipboard.writeText(coupon.code);
    setCopiedCouponId(coupon.id);
    setTimeout(() => setCopiedCouponId(null), 2000);
  };

  // -------------------------------------------------------------
  // ABA 2: CAMPANHAS PROMOCIONAIS STATE & LOGIC
  // -------------------------------------------------------------
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(['all']);
  const [campaignDiscountType, setCampaignDiscountType] = useState<'percentage' | 'fixed_price'>('percentage');
  const [campaignDiscountValue, setCampaignDiscountValue] = useState<number>(20);
  const [campaignStart, setCampaignStart] = useState<string>(new Date().toISOString().slice(0, 16));
  const [campaignEnd, setCampaignEnd] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [courseFilterQuery, setCourseFilterQuery] = useState('');
  const [campaignSuccessToast, setCampaignSuccessToast] = useState<string | null>(null);

  // Live timer tick for real-time countdown badges
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isAllCoursesSelected = selectedCourseIds.includes('all');

  const handleToggleSelectAllCourses = () => {
    if (isAllCoursesSelected) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(['all']);
    }
  };

  const handleToggleCourseSelection = (courseId: string) => {
    if (isAllCoursesSelected) {
      // Switch from all to all except this one
      const allIds = courses.map((c) => c.id).filter((id) => id !== courseId);
      setSelectedCourseIds(allIds);
    } else {
      if (selectedCourseIds.includes(courseId)) {
        setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
      } else {
        const next = [...selectedCourseIds, courseId];
        if (next.length === courses.length) {
          setSelectedCourseIds(['all']);
        } else {
          setSelectedCourseIds(next);
        }
      }
    }
  };

  // Get list of effectively affected courses
  const affectedCourses = isAllCoursesSelected
    ? courses
    : courses.filter((c) => selectedCourseIds.includes(c.id));

  const handleLaunchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle.trim()) return;
    if (affectedCourses.length === 0) {
      alert('Selecione pelo menos um curso para aplicar a promoção.');
      return;
    }

    // Save backup of original prices before applying
    const pricesBackup: Record<string, number> = {};
    affectedCourses.forEach((c) => {
      pricesBackup[c.id] = c.currentPrice;
    });

    const newCampaign: PromotionalCampaign = {
      id: `camp-${Date.now()}`,
      title: campaignTitle.trim(),
      description: campaignDescription.trim() || undefined,
      targetCourseIds: isAllCoursesSelected ? ['all'] : [...selectedCourseIds],
      discountType: campaignDiscountType,
      discountValue: Number(campaignDiscountValue) || 0,
      startDateTime: campaignStart,
      endDateTime: campaignEnd,
      status: 'ativa',
      originalPricesBackup: pricesBackup,
      createdAt: new Date().toISOString(),
    };

    // Apply discounts directly to courses in platform
    affectedCourses.forEach((course) => {
      let newPrice = course.currentPrice;
      if (campaignDiscountType === 'percentage') {
        const pct = Math.min(100, Math.max(0, campaignDiscountValue));
        newPrice = Math.round(course.originalPrice * (1 - pct / 100) * 100) / 100;
      } else {
        // fixed price
        newPrice = Math.max(1, campaignDiscountValue);
      }

      onUpdateCourse({
        ...course,
        currentPrice: newPrice,
      });
    });

    onAddCampaign(newCampaign);

    // Reset form
    setCampaignTitle('');
    setCampaignDescription('');
    setSelectedCourseIds(['all']);
    setCampaignDiscountValue(20);

    setCampaignSuccessToast(`Promoção "${newCampaign.title}" lançada com sucesso em ${affectedCourses.length} curso(s)!`);
    setTimeout(() => setCampaignSuccessToast(null), 4000);
  };

  const handlePauseOrResumeCampaign = (campaign: PromotionalCampaign) => {
    if (campaign.status === 'ativa') {
      // Pause campaign: restore backed-up prices
      if (campaign.originalPricesBackup) {
        Object.entries(campaign.originalPricesBackup).forEach(([cId, origPrice]) => {
          const course = courses.find((c) => c.id === cId);
          if (course) {
            onUpdateCourse({ ...course, currentPrice: origPrice });
          }
        });
      }
      onUpdateCampaign({ ...campaign, status: 'pausada' });
    } else if (campaign.status === 'pausada') {
      // Resume campaign: re-apply discounts
      const targetList = campaign.targetCourseIds.includes('all')
        ? courses
        : courses.filter((c) => campaign.targetCourseIds.includes(c.id));

      const newBackup: Record<string, number> = {};
      targetList.forEach((course) => {
        newBackup[course.id] = course.currentPrice;
        let newPrice = course.currentPrice;
        if (campaign.discountType === 'percentage') {
          newPrice = Math.round(course.originalPrice * (1 - campaign.discountValue / 100) * 100) / 100;
        } else {
          newPrice = Math.max(1, campaign.discountValue);
        }
        onUpdateCourse({ ...course, currentPrice: newPrice });
      });

      onUpdateCampaign({
        ...campaign,
        status: 'ativa',
        originalPricesBackup: newBackup,
      });
    }
  };

  const handleCancelCampaign = (campaign: PromotionalCampaign) => {
    if (!window.confirm(`Tem certeza que deseja cancelar a campanha "${campaign.title}"? Os preços normais dos cursos serão restabelecidos.`)) {
      return;
    }

    // Restore prices if available
    if (campaign.originalPricesBackup) {
      Object.entries(campaign.originalPricesBackup).forEach(([cId, origPrice]) => {
        const course = courses.find((c) => c.id === cId);
        if (course) {
          onUpdateCourse({ ...course, currentPrice: origPrice });
        }
      });
    } else {
      // Restore to originalPrice if no backup
      const targetList = campaign.targetCourseIds.includes('all')
        ? courses
        : courses.filter((c) => campaign.targetCourseIds.includes(c.id));
      targetList.forEach((c) => {
        onUpdateCourse({ ...c, currentPrice: c.originalPrice });
      });
    }

    onUpdateCampaign({ ...campaign, status: 'cancelada' });
  };

  // Helper function for countdown format
  const formatCountdown = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    const diff = end - now;

    if (diff <= 0) {
      return { text: 'Expirada', isExpired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      text: `${days > 0 ? `${days}d ` : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
      isExpired: false,
      days,
      hours,
      minutes,
      seconds,
    };
  };

  // Filtered coupons
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(couponSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (couponStatusFilter === 'todos') return true;
    return c.status === couponStatusFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* =========================================================================
          1. HEADER WITH INTERNAL TABS: CUPONS DE DESCONTO & CAMPANHAS PROMOCIONAIS
         ========================================================================= */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-[#1F293D] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">local_offer</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-text-primary">14. Promoções &amp; Cupons de Desconto</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                Marketing &amp; Vendas
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Gerencie cupons com limites de resgate por CPF e lance campanhas promocionais com cronômetro em tempo real.
            </p>
          </div>
        </div>

        {/* 2 Internal Tabs Navigation */}
        <div className="flex items-center p-1 bg-[#080B10] rounded-xl border border-[#1F293D] shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setInternalTab('cupons')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              internalTab === 'cupons'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-[#141B28]'
            }`}
          >
            <span className="material-symbols-outlined text-base">confirmation_number</span>
            <span>Cupons de Desconto</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                internalTab === 'cupons' ? 'bg-black/30 text-white' : 'bg-[#1F293D] text-text-secondary'
              }`}
            >
              {coupons.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInternalTab('campanhas')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              internalTab === 'campanhas'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-[#141B28]'
            }`}
          >
            <span className="material-symbols-outlined text-base">campaign</span>
            <span>Campanhas Promocionais</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                internalTab === 'campanhas' ? 'bg-black/30 text-white' : 'bg-[#1F293D] text-text-secondary'
              }`}
            >
              {campaigns.filter((c) => c.status === 'ativa').length}
            </span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {campaignSuccessToast && (
        <div className="p-4 rounded-xl bg-accent-emerald-bright/10 border border-accent-emerald-bright/30 text-accent-emerald-bright flex items-center justify-between text-xs font-bold shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{campaignSuccessToast}</span>
          </div>
          <button
            onClick={() => setCampaignSuccessToast(null)}
            className="text-text-secondary hover:text-white"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          ABA 1: CUPONS DE DESCONTO
         ========================================================================= */}
      {internalTab === 'cupons' && (
        <div className="space-y-6">
          {/* Action Bar: Search, Filters, + Criar Novo Cupom */}
          <div className="p-4 rounded-2xl bg-[#0F141F] border border-[#1F293D] flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Search input */}
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-base">
                  search
                </span>
                <input
                  type="text"
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  placeholder="Buscar por código ou descrição..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#080B10] border border-[#1F293D] text-xs text-text-primary focus:outline-hidden focus:border-primary placeholder:text-text-tertiary"
                />
              </div>

              {/* Status Filter */}
              <select
                value={couponStatusFilter}
                onChange={(e) => setCouponStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-[#080B10] border border-[#1F293D] text-xs text-text-primary focus:outline-hidden focus:border-primary cursor-pointer"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Somente Ativos</option>
                <option value="expirado">Somente Expirados</option>
                <option value="inativo">Somente Inativos</option>
              </select>
            </div>

            {/* "+ Criar Novo Cupom" Button */}
            <button
              type="button"
              onClick={handleOpenNewCouponModal}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
              id="btn-create-new-coupon"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>+ Criar Novo Cupom</span>
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#0F141F] border border-[#1F293D]">
              <span className="text-[11px] text-text-tertiary block">Total de Cupons</span>
              <span className="text-xl font-black text-text-primary mt-1 block">{coupons.length}</span>
              <span className="text-[10px] text-text-tertiary">Cadastrados na base</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0F141F] border border-[#1F293D]">
              <span className="text-[11px] text-text-tertiary block">Cupons Ativos</span>
              <span className="text-xl font-black text-accent-emerald-bright mt-1 block">
                {coupons.filter((c) => c.status === 'ativo').length}
              </span>
              <span className="text-[10px] text-accent-emerald-bright">Prontos para checkout</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0F141F] border border-[#1F293D]">
              <span className="text-[11px] text-text-tertiary block">Total de Resgates</span>
              <span className="text-xl font-black text-text-primary mt-1 block">
                {coupons.reduce((sum, c) => sum + (c.currentUses || 0), 0)}
              </span>
              <span className="text-[10px] text-text-tertiary">Usos acumulados</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0F141F] border border-[#1F293D]">
              <span className="text-[11px] text-text-tertiary block">Expirados / Inativos</span>
              <span className="text-xl font-black text-amber-400 mt-1 block">
                {coupons.filter((c) => c.status !== 'ativo').length}
              </span>
              <span className="text-[10px] text-text-tertiary">Fora de vigência</span>
            </div>
          </div>

          {/* Coupons Table */}
          <div className="rounded-2xl bg-[#0F141F] border border-[#1F293D] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1F293D] bg-[#080B10]/80 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    <th className="py-3.5 px-4">Código do Cupom</th>
                    <th className="py-3.5 px-4">Desconto</th>
                    <th className="py-3.5 px-4">Vigência (Início / Término)</th>
                    <th className="py-3.5 px-4">Contador de Usos</th>
                    <th className="py-3.5 px-4">Limite p/ CPF</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F293D]/60 text-xs">
                  {filteredCoupons.length > 0 ? (
                    filteredCoupons.map((coupon) => {
                      const isExpiredByDate = new Date(coupon.endDateTime).getTime() < now;
                      const effectiveStatus = isExpiredByDate ? 'expirado' : coupon.status;
                      const usagePct =
                        coupon.usageLimitTotal > 0
                          ? Math.min(100, Math.round((coupon.currentUses / coupon.usageLimitTotal) * 100))
                          : 0;

                      return (
                        <tr key={coupon.id} className="hover:bg-[#141B28]/60 transition-colors">
                          {/* Code */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyCouponCode(coupon)}
                                title="Clique para copiar código"
                                className="group px-2.5 py-1 rounded-lg bg-[#080B10] border border-[#1F293D] hover:border-primary/50 text-text-primary font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                              >
                                <span>{coupon.code}</span>
                                <span className="material-symbols-outlined text-[13px] text-text-tertiary group-hover:text-primary transition-colors">
                                  {copiedCouponId === coupon.id ? 'check' : 'content_copy'}
                                </span>
                              </button>
                              {copiedCouponId === coupon.id && (
                                <span className="text-[10px] text-accent-emerald-bright font-bold">
                                  Copiado!
                                </span>
                              )}
                            </div>
                            {coupon.description && (
                              <p className="text-[11px] text-text-tertiary line-clamp-1 mt-1">
                                {coupon.description}
                              </p>
                            )}
                          </td>

                          {/* Discount */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-text-primary inline-flex items-center gap-1">
                              {coupon.discountType === 'percentage' ? (
                                <>
                                  <span className="text-primary font-black text-sm">
                                    {coupon.discountValue}%
                                  </span>{' '}
                                  OFF
                                </>
                              ) : (
                                <>
                                  <span className="text-accent-emerald-bright font-black text-sm">
                                    R$ {coupon.discountValue.toFixed(2).replace('.', ',')}
                                  </span>{' '}
                                  Fixo
                                </>
                              )}
                            </span>
                          </td>

                          {/* Dates */}
                          <td className="py-3.5 px-4 text-text-secondary whitespace-nowrap">
                            <div className="space-y-0.5">
                              <span className="block text-[11px]">
                                <strong className="text-text-primary">De:</strong>{' '}
                                {new Date(coupon.startDateTime).toLocaleDateString('pt-BR')}{' '}
                                {new Date(coupon.startDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="block text-[11px]">
                                <strong className="text-text-primary">Até:</strong>{' '}
                                {new Date(coupon.endDateTime).toLocaleDateString('pt-BR')}{' '}
                                {new Date(coupon.endDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>

                          {/* Usage Count & Progress bar */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1.5 min-w-[130px]">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-text-primary">{coupon.currentUses}</span>
                                <span className="text-text-tertiary">de {coupon.usageLimitTotal} usos</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#1F293D] overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    usagePct >= 90
                                      ? 'bg-status-danger'
                                      : usagePct >= 60
                                      ? 'bg-amber-400'
                                      : 'bg-primary'
                                  }`}
                                  style={{ width: `${usagePct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Limit per CPF */}
                          <td className="py-3.5 px-4 text-center sm:text-left">
                            <span className="px-2.5 py-0.5 rounded-md bg-[#080B10] border border-[#1F293D] font-mono text-[11px] font-bold text-text-secondary">
                              {coupon.usageLimitPerCpf}x / CPF
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {effectiveStatus === 'ativo' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald-bright animate-pulse" />
                                Ativo
                              </span>
                            ) : effectiveStatus === 'expirado' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-danger/15 text-status-danger border border-status-danger/30 inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">event_busy</span>
                                Expirado
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-text-tertiary/15 text-text-tertiary border border-border-subtle inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">pause_circle</span>
                                Inativo
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditCouponModal(coupon)}
                                className="p-1.5 rounded-lg bg-[#080B10] hover:bg-surface-raised border border-[#1F293D] text-text-secondary hover:text-primary transition-colors cursor-pointer"
                                title="Editar Cupom"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>

                              {/* Deactivate / Activate */}
                              <button
                                type="button"
                                onClick={() => handleToggleCouponStatus(coupon)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  coupon.status === 'ativo'
                                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                }`}
                                title={coupon.status === 'ativo' ? 'Desativar Cupom' : 'Ativar Cupom'}
                              >
                                <span className="material-symbols-outlined text-base">
                                  {coupon.status === 'ativo' ? 'block' : 'check_circle'}
                                </span>
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Deseja excluir o cupom "${coupon.code}"?`)) {
                                    onDeleteCoupon(coupon.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-status-danger/10 hover:bg-status-danger/20 text-status-danger border border-status-danger/20 transition-colors cursor-pointer"
                                title="Excluir Cupom"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-text-tertiary">
                        <span className="material-symbols-outlined text-3xl mb-2 block opacity-50">
                          sentiment_dissatisfied
                        </span>
                        Nenhum cupom encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ABA 2: CAMPANHAS PROMOCIONAIS
         ========================================================================= */}
      {internalTab === 'campanhas' && (
        <div className="space-y-8">
          {/* Form to Launch Campaign */}
          <div className="p-6 rounded-2xl bg-[#0F141F] border border-[#1F293D] shadow-md space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#1F293D]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-2xl">rocket_launch</span>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    Lançar Nova Campanha Promocional
                  </h3>
                  <p className="text-xs text-text-tertiary">
                    Aplique descontos em lote aos cursos e configure o período de validade com cronômetro em tempo real.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleLaunchCampaign} className="space-y-6">
              {/* Campaign Title & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-7 space-y-1">
                  <label className="block text-xs font-bold text-text-secondary">
                    Nome / Título da Campanha Promocional *
                  </label>
                  <input
                    type="text"
                    required
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="Ex: Semana Tech 2026 / Liquidação de Férias"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B10] border border-[#1F293D] text-xs text-text-primary focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-5 space-y-1">
                  <label className="block text-xs font-bold text-text-secondary">
                    Descrição Curta (Opcional)
                  </label>
                  <input
                    type="text"
                    value={campaignDescription}
                    onChange={(e) => setCampaignDescription(e.target.value)}
                    placeholder="Ex: Válido até domingo para cursos selecionados"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B10] border border-[#1F293D] text-xs text-text-primary focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl bg-[#080B10] border border-[#1F293D]">
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-xs font-bold text-text-secondary">
                    Tipo de Aplicação do Desconto *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCampaignDiscountType('percentage')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        campaignDiscountType === 'percentage'
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-[#141B28] text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">percent</span>
                      <span>% Porcentagem</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignDiscountType('fixed_price')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        campaignDiscountType === 'fixed_price'
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-[#141B28] text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">payments</span>
                      <span>Preço Fixo</span>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-xs font-bold text-text-secondary">
                    {campaignDiscountType === 'percentage'
                      ? '% de Desconto Aplicado *'
                      : 'Novo Preço Promocional (R$) *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={campaignDiscountType === 'percentage' ? 95 : 9999}
                      step={campaignDiscountType === 'percentage' ? 1 : 0.01}
                      value={campaignDiscountValue}
                      onChange={(e) => setCampaignDiscountValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0F141F] border border-[#1F293D] text-xs font-bold text-text-primary focus:outline-hidden focus:border-primary"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                      {campaignDiscountType === 'percentage' ? '% OFF' : 'R$'}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-tertiary mt-1">
                    {campaignDiscountType === 'percentage'
                      ? 'Desconto deduzido sobre o Preço Original de cada curso selecionado.'
                      : 'Todos os cursos selecionados passarão a custar exatamente este valor promocional.'}
                  </p>
                </div>

                {/* Dates */}
                <div className="sm:col-span-4 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-text-secondary">
                      Data/Hora Início *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={campaignStart}
                      onChange={(e) => setCampaignStart(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#0F141F] border border-[#1F293D] text-[11px] text-text-primary focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-text-secondary">
                      Data/Hora Expiração *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={campaignEnd}
                      onChange={(e) => setCampaignEnd(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#0F141F] border border-[#1F293D] text-[11px] text-text-primary focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Course Selection Filter Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-text-primary">
                      Selecionar Cursos Participantes *
                    </label>
                    <p className="text-[11px] text-text-tertiary">
                      Selecione cursos específicos ou clique em &quot;Todos os Cursos&quot; para aplicar a todo o catálogo.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Master Checkbox: Todos os Cursos */}
                    <button
                      type="button"
                      onClick={handleToggleSelectAllCourses}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isAllCoursesSelected
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-[#080B10] border-[#1F293D] text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isAllCoursesSelected ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span>Todos os Cursos ({courses.length})</span>
                    </button>

                    {/* Filter search in courses */}
                    <div className="relative">
                      <input
                        type="text"
                        value={courseFilterQuery}
                        onChange={(e) => setCourseFilterQuery(e.target.value)}
                        placeholder="Filtrar cursos..."
                        className="w-36 sm:w-44 px-2.5 py-1.5 rounded-xl bg-[#080B10] border border-[#1F293D] text-[11px] text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Course Selection Cards Grid */}
                <div className="max-h-60 overflow-y-auto p-2.5 rounded-xl bg-[#080B10] border border-[#1F293D] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {courses
                    .filter(
                      (c) =>
                        c.title.toLowerCase().includes(courseFilterQuery.toLowerCase()) ||
                        c.category.toLowerCase().includes(courseFilterQuery.toLowerCase())
                    )
                    .map((course) => {
                      const isSelected =
                        isAllCoursesSelected || selectedCourseIds.includes(course.id);

                      // Calculated preview price
                      let previewPrice = course.currentPrice;
                      if (campaignDiscountType === 'percentage') {
                        previewPrice =
                          Math.round(course.originalPrice * (1 - campaignDiscountValue / 100) * 100) / 100;
                      } else {
                        previewPrice = Math.max(1, campaignDiscountValue);
                      }

                      return (
                        <div
                          key={course.id}
                          onClick={() => handleToggleCourseSelection(course.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-primary/10 border-primary/40 text-text-primary'
                              : 'bg-[#0F141F] border-[#1F293D] text-text-secondary hover:border-[#2D3B54]'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-lg shrink-0 ${
                              isSelected ? 'text-primary' : 'text-text-tertiary'
                            }`}
                          >
                            {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                          </span>

                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-text-primary truncate">
                              {course.title}
                            </h5>
                            <div className="flex items-center justify-between text-[10px] text-text-tertiary mt-0.5">
                              <span>{course.category}</span>
                              <div className="flex items-center gap-1 font-mono">
                                <span className="line-through">R$ {course.currentPrice.toFixed(2)}</span>
                                {isSelected && (
                                  <span className="font-bold text-accent-emerald-bright">
                                    → R$ {previewPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Summary of affected selection */}
                <div className="flex items-center justify-between text-xs text-text-secondary px-1">
                  <span>
                    <strong className="text-text-primary">{affectedCourses.length}</strong> de {courses.length} cursos selecionados para esta campanha
                  </span>
                  {affectedCourses.length > 0 && (
                    <span className="text-accent-emerald-bright font-medium">
                      ✓ Descontos serão aplicados instantaneamente ao clicar em &quot;Lançar Promoção&quot;
                    </span>
                  )}
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2 border-t border-[#1F293D] flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all active:scale-95"
                  id="btn-launch-promotion"
                >
                  <span className="material-symbols-outlined text-base">rocket_launch</span>
                  <span>Lançar Promoção nos Cursos Filtrados</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Active & Historical Campaigns */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">analytics</span>
                  <span>Campanhas Promocionais Cadastradas</span>
                </h3>
                <p className="text-xs text-text-tertiary">
                  Acompanhe os cronômetros de contagem regressiva, status e controle de pausa/cancelamento.
                </p>
              </div>

              <span className="text-xs font-bold text-text-secondary bg-[#0F141F] px-3 py-1 rounded-full border border-[#1F293D]">
                {campaigns.length} {campaigns.length === 1 ? 'campanha' : 'campanhas'}
              </span>
            </div>

            <div className="rounded-2xl bg-[#0F141F] border border-[#1F293D] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1F293D] bg-[#080B10]/80 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                      <th className="py-3.5 px-4">Campanha</th>
                      <th className="py-3.5 px-4">Desconto Aplicado</th>
                      <th className="py-3.5 px-4">Cursos Alvo</th>
                      <th className="py-3.5 px-4">Cronômetro / Oferta Ativa</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F293D]/60 text-xs">
                    {campaigns.length > 0 ? (
                      campaigns.map((camp) => {
                        const countdown = formatCountdown(camp.endDateTime);
                        const isExpired = countdown.isExpired || camp.status === 'expirada';
                        const effectiveStatus = isExpired && camp.status === 'ativa' ? 'expirada' : camp.status;

                        return (
                          <tr key={camp.id} className="hover:bg-[#141B28]/60 transition-colors">
                            {/* Title & Dates */}
                            <td className="py-3.5 px-4">
                              <h5 className="font-bold text-text-primary text-sm leading-snug">
                                {camp.title}
                              </h5>
                              {camp.description && (
                                <p className="text-[11px] text-text-tertiary mt-0.5 line-clamp-1">
                                  {camp.description}
                                </p>
                              )}
                              <span className="text-[10px] text-text-tertiary block mt-1">
                                Expira em: {new Date(camp.endDateTime).toLocaleDateString('pt-BR')} às{' '}
                                {new Date(camp.endDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>

                            {/* Discount */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-bold text-text-primary inline-flex items-center gap-1.5">
                                {camp.discountType === 'percentage' ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-black">
                                    {camp.discountValue}% OFF
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg bg-accent-emerald-bright/10 text-accent-emerald-bright border border-accent-emerald-bright/20 font-black">
                                    Preço: R$ {camp.discountValue.toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                              </span>
                            </td>

                            {/* Target Courses */}
                            <td className="py-3.5 px-4">
                              {camp.targetCourseIds.includes('all') ? (
                                <span className="px-2.5 py-1 rounded-lg bg-[#080B10] border border-[#1F293D] font-bold text-text-primary text-xs flex items-center gap-1 w-fit">
                                  <span className="material-symbols-outlined text-xs text-primary">public</span>
                                  Todos os Cursos ({courses.length})
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-[#080B10] border border-[#1F293D] font-bold text-text-secondary text-xs flex items-center gap-1 w-fit">
                                  <span className="material-symbols-outlined text-xs text-primary">check</span>
                                  {camp.targetCourseIds.length} {camp.targetCourseIds.length === 1 ? 'curso' : 'cursos'}
                                </span>
                              )}
                            </td>

                            {/* Countdown / Visual Badge */}
                            <td className="py-3.5 px-4">
                              {effectiveStatus === 'ativa' && !isExpired ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent-emerald-bright/10 border border-accent-emerald-bright/30">
                                  <span className="w-2 h-2 rounded-full bg-accent-emerald-bright animate-ping" />
                                  <span className="font-mono font-bold text-accent-emerald-bright text-xs">
                                    {countdown.text}
                                  </span>
                                  <span className="text-[10px] text-accent-emerald-bright font-bold hidden sm:inline">
                                    restantes
                                  </span>
                                </div>
                              ) : effectiveStatus === 'pausada' ? (
                                <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">pause</span>
                                  Pausada
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-xl bg-status-danger/10 text-status-danger border border-status-danger/20 text-xs font-bold inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">timer_off</span>
                                  Expirada / Encerrada
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                  effectiveStatus === 'ativa'
                                    ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30'
                                    : effectiveStatus === 'pausada'
                                    ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                                    : 'bg-status-danger/15 text-status-danger border border-status-danger/30'
                                }`}
                              >
                                {effectiveStatus === 'ativa'
                                  ? 'Ativa'
                                  : effectiveStatus === 'pausada'
                                  ? 'Pausada'
                                  : effectiveStatus === 'cancelada'
                                  ? 'Cancelada'
                                  : 'Expirada'}
                              </span>
                            </td>

                            {/* Actions (Pausar / Cancelar / Excluir) */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Pause / Resume */}
                                {effectiveStatus !== 'cancelada' && effectiveStatus !== 'expirada' && (
                                  <button
                                    type="button"
                                    onClick={() => handlePauseOrResumeCampaign(camp)}
                                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                      effectiveStatus === 'ativa'
                                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                                        : 'bg-accent-emerald-bright/10 hover:bg-accent-emerald-bright/20 text-accent-emerald-bright border-accent-emerald-bright/30'
                                    }`}
                                    title={effectiveStatus === 'ativa' ? 'Pausar Campanha' : 'Reativar Campanha'}
                                  >
                                    <span className="material-symbols-outlined text-sm">
                                      {effectiveStatus === 'ativa' ? 'pause' : 'play_arrow'}
                                    </span>
                                    <span>{effectiveStatus === 'ativa' ? 'Pausar' : 'Reativar'}</span>
                                  </button>
                                )}

                                {/* Cancel */}
                                {effectiveStatus !== 'cancelada' && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelCampaign(camp)}
                                    className="px-2.5 py-1.5 rounded-lg bg-status-danger/10 hover:bg-status-danger/20 text-status-danger border border-status-danger/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    title="Cancelar Campanha e Restaurar Preços Normais"
                                  >
                                    <span className="material-symbols-outlined text-sm">cancel</span>
                                    <span>Cancelar</span>
                                  </button>
                                )}

                                {/* Delete from list */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Deseja remover a campanha "${camp.title}" do histórico?`)) {
                                      onDeleteCampaign(camp.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-[#080B10] hover:bg-status-danger/10 text-text-tertiary hover:text-status-danger border border-[#1F293D] transition-colors cursor-pointer"
                                  title="Excluir do Histórico"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-text-tertiary">
                          Nenhuma campanha promocional lançada ainda. Utilize o formulário acima para lançar sua primeira oferta!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CRIAR / EDITAR CUPOM DE DESCONTO
         ========================================================================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setIsCouponModalOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-[#0F141F] border border-[#1F293D] rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1F293D] flex items-center justify-between bg-[#080B10]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-xl">confirmation_number</span>
                <h3 className="text-base font-bold text-text-primary">
                  {editingCoupon ? 'Editar Cupom de Desconto' : '+ Criar Novo Cupom de Desconto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCoupon} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Código do Cupom */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Código do Cupom * (ex: BEMVINDO10)
                </label>
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: BEMVINDO10"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B10] border border-[#1F293D] text-xs font-mono font-bold text-text-primary focus:outline-hidden focus:border-primary uppercase tracking-wider"
                />
                <p className="text-[10px] text-text-tertiary mt-1">
                  O código será formatado automaticamente em letras maiúsculas para facilidade de aplicação no checkout.
                </p>
              </div>

              {/* Tipo de Desconto (% ou R$) */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Tipo de Desconto *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCouponForm({ ...couponForm, discountType: 'percentage' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      couponForm.discountType === 'percentage'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-[#080B10] text-text-secondary border border-[#1F293D]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">percent</span>
                    <span>% Porcentagem</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCouponForm({ ...couponForm, discountType: 'fixed' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      couponForm.discountType === 'fixed'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-[#080B10] text-text-secondary border border-[#1F293D]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    <span>R$ Valor Fixo</span>
                  </button>
                </div>
              </div>

              {/* Valor do Desconto */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Valor do Desconto *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    max={couponForm.discountType === 'percentage' ? 99 : 9999}
                    step={couponForm.discountType === 'percentage' ? 1 : 0.01}
                    value={couponForm.discountValue}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, discountValue: parseFloat(e.target.value) || 0 })
                    }
                    placeholder={couponForm.discountType === 'percentage' ? '15' : '50.00'}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#080B10] border border-[#1F293D] text-xs font-bold text-text-primary focus:outline-hidden focus:border-primary"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                    {couponForm.discountType === 'percentage' ? '%' : 'R$'}
                  </span>
                </div>
              </div>

              {/* Datas: Início e Término */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Data e Hora de Início *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={couponForm.startDateTime}
                    onChange={(e) => setCouponForm({ ...couponForm, startDateTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080B10] border border-[#1F293D] text-xs text-text-primary focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Data e Hora de Término *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={couponForm.endDateTime}
                    onChange={(e) => setCouponForm({ ...couponForm, endDateTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#080B10] border border-[#1F293D] text-xs text-text-primary focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              {/* Limites de Uso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Limite de usos por CPF *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={couponForm.usageLimitPerCpf}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, usageLimitPerCpf: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#080B10] border border-[#1F293D] text-xs text-text-primary focus:outline-hidden focus:border-primary font-mono"
                  />
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    Quantas vezes o mesmo aluno/CPF pode usar
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Limite geral de usos do cupom *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100000}
                    value={couponForm.usageLimitTotal}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, usageLimitTotal: parseInt(e.target.value, 10) || 100 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#080B10] border border-[#1F293D] text-xs text-text-primary focus:outline-hidden focus:border-primary font-mono"
                  />
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    Total máximo de resgates em toda a plataforma
                  </p>
                </div>
              </div>

              {/* Descrição Opcional */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Descrição / Finalidade Interna (Opcional)
                </label>
                <input
                  type="text"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="Ex: Campanha de influenciador ou boas-vindas"
                  className="w-full px-3 py-2 rounded-xl bg-[#080B10] border border-[#1F293D] text-xs text-text-primary focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Modal Footer CTA */}
              <div className="pt-4 border-t border-[#1F293D] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-overlay text-text-secondary hover:text-text-primary text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {editingCoupon ? 'Salvar Alterações' : 'Criar e Ativar Cupom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
