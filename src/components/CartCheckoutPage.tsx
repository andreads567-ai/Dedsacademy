import React, { useState, useMemo, useEffect } from 'react';
import { CartItem, UserAccount, CheckoutPaymentBannerConfig, DEFAULT_CHECKOUT_PAYMENT_BANNER, Coupon } from '../types';
import { INITIAL_COUPONS } from '../data/promotionsData';
import { redirectToStripeCheckout } from '../lib/stripeClient';
import { getCacheBustedImageUrl, FALLBACK_COURSE_IMAGE } from '../lib/cacheManager';
import { getStoredSupportChannels, buildWhatsAppUrl } from '../services/contactChannelsService';
import { supabase } from '../lib/supabaseClient';

export interface CheckoutData {
  studentName: string;
  studentEmail: string;
  studentCpf: string;
  paymentMethod: string;
  courseIds?: string[];
}

interface CartCheckoutPageProps {
  items: CartItem[];
  onRemoveItem: (courseId: string) => void;
  onClearCart: () => void;
  onNavigateHome: (sectionId?: string) => void;
  onCheckoutSuccess: (data: CheckoutData) => void;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onOpenRegister?: (initialCpf?: string) => void;
  usersList?: UserAccount[];
  checkoutBannerConfig?: CheckoutPaymentBannerConfig;
  coupons?: Coupon[];
}

export const CartCheckoutPage: React.FC<CartCheckoutPageProps> = ({
  items,
  onRemoveItem,
  onClearCart,
  onNavigateHome,
  onCheckoutSuccess,
  currentUser,
  onOpenAuth,
  onOpenRegister,
  usersList = [],
  checkoutBannerConfig = DEFAULT_CHECKOUT_PAYMENT_BANNER,
  coupons,
}) => {
  // Payment methods: all processed via official Stripe checkout session
  const [paymentMode, setPaymentMode] = useState<'credit' | 'pix' | 'debit' | 'boleto'>('credit');
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Clean coupon state - starts empty as requested
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Mandatory student form state - CPF is the only editable field, Name and Email are auto-filled
  const [studentCpf, setStudentCpf] = useState(currentUser?.cpf || '');
  const [studentName, setStudentName] = useState(currentUser?.name || '');
  const [studentEmail, setStudentEmail] = useState(currentUser?.email || '');
  const [formErrors, setFormErrors] = useState<{
    studentName?: string;
    studentEmail?: string;
    studentCpf?: string;
  }>({});
  const [isExistingAccount, setIsExistingAccount] = useState<boolean>(Boolean(currentUser && currentUser.status !== 'inativo'));

  // Dynamic Support Channels (WhatsApp) synchronized from settings / database
  const [supportChannels, setSupportChannels] = useState(() => getStoredSupportChannels());

  useEffect(() => {
    const syncChannels = () => {
      setSupportChannels(getStoredSupportChannels());
    };
    window.addEventListener('deds_contact_channels_updated', syncChannels);
    window.addEventListener('storage', syncChannels);

    // Also attempt to fetch from Supabase if platform_settings exists
    (async () => {
      try {
        const { data } = await supabase
          .from('platform_settings')
          .select('support_whatsapp, support_channels')
          .maybeSingle();
        if (data?.support_whatsapp) {
          setSupportChannels((prev) => ({
            ...prev,
            whatsappNumber: data.support_whatsapp,
          }));
        } else if (data?.support_channels?.whatsappNumber) {
          setSupportChannels(data.support_channels);
        }
      } catch {
        // Fallback gracefully to getStoredSupportChannels()
      }
    })();

    return () => {
      window.removeEventListener('deds_contact_channels_updated', syncChannels);
      window.removeEventListener('storage', syncChannels);
    };
  }, []);

  const supportWhatsAppNumber = supportChannels.whatsappNumber || '(11) 99999-9999';

  // Helper to locate user by 11-digit CPF (searching currentUser, props usersList, and deds_users_list fallback)
  const findUserByCpf = (digits: string): UserAccount | null => {
    const cleanDigits = (digits || '').replace(/\D/g, '');
    if (cleanDigits.length < 11) return null;
    if (currentUser && (currentUser.cpf || '').replace(/\D/g, '') === cleanDigits) {
      return currentUser;
    }
    const found = usersList.find((u) => (u.cpf || '').replace(/\D/g, '') === cleanDigits);
    if (found) return found;

    try {
      const stored = localStorage.getItem('deds_users_list');
      if (stored) {
        const parsed: UserAccount[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const storedFound = parsed.find((u) => (u.cpf || '').replace(/\D/g, '') === cleanDigits);
          if (storedFound) return storedFound;
        }
      }
    } catch {}

    return null;
  };

  const cleanCpfDigits = studentCpf.replace(/\D/g, '');

  // Real-time check if student already has an account
  const matchedUser = useMemo(() => {
    if (currentUser) return currentUser;
    if (cleanCpfDigits.length === 11) {
      return findUserByCpf(cleanCpfDigits);
    }
    return null;
  }, [cleanCpfDigits, currentUser, usersList]);

  // Derived account status flags
  const isAccountFound = Boolean(currentUser || matchedUser);
  const isAccountInactive = Boolean(
    (currentUser && currentUser.status === 'inativo') ||
    (matchedUser && matchedUser.status === 'inativo')
  );
  const isAccountActive = isAccountFound && !isAccountInactive;
  const isAccountNotFound = !isAccountFound && cleanCpfDigits.length === 11;
  const isCpfIncomplete = !currentUser && cleanCpfDigits.length < 11;

  // Can the student proceed to payment?
  // MUST have an active and registered account, cart not empty, not processing
  const canProceed = isAccountActive && items.length > 0 && !isProcessingStripe;

  // Calculations
  const originalSubtotal = items.reduce(
    (acc, item) => acc + (item.course.originalPrice || item.course.currentPrice * 1.5) * item.quantity,
    0
  );
  const currentSubtotal = items.reduce(
    (acc, item) => acc + item.course.currentPrice * item.quantity,
    0
  );
  const comboDiscount = Math.max(0, originalSubtotal - currentSubtotal);

  // Extra 5% off for PIX
  const activeCouponDiscount = couponApplied ? couponDiscount : 0;
  const baseTotal = Math.max(0, currentSubtotal - activeCouponDiscount);
  const pixDiscount = paymentMode === 'pix' ? baseTotal * 0.05 : 0;
  const finalTotal = Math.max(0, baseTotal - pixDiscount);
  const totalSavings = comboDiscount + activeCouponDiscount + pixDiscount;

  // Synchronize student data in real-time
  React.useEffect(() => {
    if (currentUser) {
      setStudentCpf(currentUser.cpf || '');
      setStudentName(currentUser.name || '');
      setStudentEmail(currentUser.email || '');
      setIsExistingAccount(currentUser.status !== 'inativo');
    } else if (cleanCpfDigits.length === 11) {
      const found = findUserByCpf(cleanCpfDigits);
      if (found) {
        setStudentName(found.name || '');
        setStudentEmail(found.email || '');
        setIsExistingAccount(found.status !== 'inativo');
      } else {
        setStudentName('');
        setStudentEmail('');
        setIsExistingAccount(false);
      }
    } else {
      setStudentName('');
      setStudentEmail('');
      setIsExistingAccount(false);
    }
  }, [cleanCpfDigits, currentUser, usersList]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    const rawDigits = v;
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setStudentCpf(v);

    if (formErrors.studentCpf) {
      setFormErrors((prev) => ({ ...prev, studentCpf: undefined }));
    }

    if (rawDigits.length === 11) {
      const foundUser = findUserByCpf(rawDigits);
      if (foundUser) {
        setIsExistingAccount(foundUser.status !== 'inativo');
        setStudentName(foundUser.name);
        setStudentEmail(foundUser.email);
        setFormErrors({});
      } else {
        setIsExistingAccount(false);
        setStudentName('');
        setStudentEmail('');
      }
    } else {
      if (currentUser && currentUser.cpf && currentUser.cpf.replace(/\D/g, '') === rawDigits) {
        setIsExistingAccount(currentUser.status !== 'inativo');
      } else {
        setIsExistingAccount(false);
        if (!currentUser) {
          setStudentName('');
          setStudentEmail('');
        }
      }
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponApplied(false);
      setCouponDiscount(0);
      return;
    }

    const availableCoupons: Coupon[] = (coupons && Array.isArray(coupons) && coupons.length > 0)
      ? coupons
      : (() => {
          try {
            const saved = localStorage.getItem('deds_coupons_list');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) return parsed;
            }
          } catch {}
          return INITIAL_COUPONS;
        })();

    const matched = availableCoupons.find(
      (c) => c && c.code.trim().toUpperCase() === code
    );

    if (!matched) {
      setCouponApplied(false);
      setCouponDiscount(0);
      alert('Cupom de desconto inválido ou inexistente.');
      return;
    }

    // STRICT CHECK ON STATUS CONFIGURED IN ADM
    if (matched.status !== 'ativo') {
      setCouponApplied(false);
      setCouponDiscount(0);
      alert(`O cupom "${matched.code}" está inativo ou desativado pelo administrador.`);
      return;
    }

    const now = new Date();
    if (matched.startDateTime && new Date(matched.startDateTime) > now) {
      setCouponApplied(false);
      setCouponDiscount(0);
      alert(`O cupom "${matched.code}" ainda não iniciou sua vigência.`);
      return;
    }
    if (matched.endDateTime && new Date(matched.endDateTime) < now) {
      setCouponApplied(false);
      setCouponDiscount(0);
      alert(`O cupom "${matched.code}" expirou e não pode mais ser utilizado.`);
      return;
    }

    let discount = 0;
    if (matched.discountType === 'percentage') {
      discount = Math.round(currentSubtotal * (matched.discountValue / 100) * 100) / 100;
    } else {
      discount = Math.min(currentSubtotal, matched.discountValue);
    }

    setCouponApplied(true);
    setCouponDiscount(discount);
    alert(`Cupom "${matched.code}" aplicado com sucesso! Desconto concedido.`);
  };

    const validateForm = (): boolean => {
    if (currentUser) {
      if (currentUser.status === 'inativo') {
        alert('Sua conta está desativada na Deds Academy. Para realizar novas compras, entre em contato com nosso suporte.');
        return false;
      }
      setStudentName(currentUser.name || '');
      setStudentEmail(currentUser.email || '');
      setStudentCpf(currentUser.cpf || '');
      setIsExistingAccount(true);
      setFormErrors({});
      return true;
    }
    const errors: { studentName?: string; studentEmail?: string; studentCpf?: string } = {};
    const digits = studentCpf.replace(/\D/g, '');

    // 1. CPF is always mandatory for identification
    if (!digits || digits.length < 11) {
      errors.studentCpf = 'O CPF do Aluno é obrigatório (11 dígitos) para identificar seu cadastro.';
      setFormErrors(errors);
      return false;
    }

    // 2. Student MUST possess registered account in system
    const foundUser = findUserByCpf(digits);
    if (!foundUser) {
      errors.studentCpf = 'CPF não cadastrado. É obrigatório possuir cadastro ativo na plataforma para prosseguir para o pagamento.';
      setFormErrors(errors);
      return false;
    }

    // 3. Account must NOT be inactive
    if (foundUser.status === 'inativo') {
      errors.studentCpf = 'Esta conta encontra-se desativada. Entre em contato com o suporte para reativar seu cadastro.';
      setFormErrors(errors);
      alert('Esta conta encontra-se desativada na Deds Academy. Para realizar novas compras, entre em contato com nosso suporte.');
      return false;
    }

    // Guarantee studentName and studentEmail are populated from official user record
    setStudentName(foundUser.name);
    setStudentEmail(foundUser.email);
    setIsExistingAccount(true);
    setFormErrors({});
    return true;
  };

  const handlePayWithStripe = async () => {
    if (!validateForm()) {
      return;
    }

    if (items.length === 0) {
      alert('Seu carrinho está vazio. Adicione pelo menos um curso para continuar.');
      return;
    }

    try {
      setIsProcessingStripe(true);
      setStripeError(null);
      await redirectToStripeCheckout({
        items,
        studentName: studentName.trim(),
        studentEmail: studentEmail.trim(),
        studentCpf: studentCpf.trim(),
        couponCode: couponApplied ? couponCode : undefined,
        discountAmount: activeCouponDiscount + (paymentMode === 'pix' ? pixDiscount : 0),
        finalTotal,
      });
    } catch (err: any) {
      console.error('[Stripe Checkout Error]', err);
      setIsProcessingStripe(false);
      setStripeError(err.message || 'Erro ao conectar à Stripe. Tente novamente.');
    }
  };

  const handleFinishOrder = (bypassStripe = false) => {
    if (!bypassStripe) {
      handlePayWithStripe();
      return;
    }

    if (!validateForm()) return;

    onCheckoutSuccess({
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim(),
      studentCpf: studentCpf.trim(),
      paymentMethod: paymentMode,
      courseIds: items.map((i) => i.course.id),
    });
  };

  return (
    <div className="w-full bg-surface text-on-surface py-8">
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop w-full">
        {/* Top Header & Breadcrumb & Stepper */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-text-tertiary font-label-md text-label-md">
              <button
                onClick={() => onNavigateHome('hero-section')}
                className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-body-md">home</span> Início
              </button>
              <span className="material-symbols-outlined text-body-sm text-text-tertiary">chevron_right</span>
              <span className="text-text-secondary">Carrinho e Checkout</span>
            </nav>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
              Carrinho <span className="text-primary">de compras</span>
            </h1>
            <p className="font-body-md text-body-md text-text-secondary max-w-2xl">
              Revise seus cursos selecionados e finalize sua matrícula com pagamento integrado via Stripe.
            </p>
          </div>

          {/* 3-Step Checkout Stepper */}
          <div className="flex items-center gap-3 bg-surface-raised p-2 px-4 rounded-xl self-start lg:self-auto shadow-sm border border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-label-md shadow-[0_0_12px_rgba(0,176,116,0.4)]">
                <span className="material-symbols-outlined text-body-md">shopping_cart</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-primary font-bold">1. Carrinho</span>
                <span className="font-body-sm text-[10px] text-text-tertiary">{items.length} Itens</span>
              </div>
            </div>
            <div className="w-8 h-0.5 bg-primary/40"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-surface-overlay text-primary flex items-center justify-center font-label-md">
                <span className="material-symbols-outlined text-body-md">credit_card</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-text-primary font-semibold">2. Pagamento</span>
                <span className="font-body-sm text-[10px] text-text-tertiary">Stripe</span>
              </div>
            </div>
            <div className="w-8 h-0.5 bg-surface-container-high"></div>
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high text-text-tertiary flex items-center justify-center font-label-md">
                <span className="material-symbols-outlined text-body-md">check_circle</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-text-tertiary">3. Acesso</span>
                <span className="font-body-sm text-[10px] text-text-tertiary">Área do Aluno</span>
              </div>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-surface-raised border border-border-subtle rounded-2xl p-12 text-center max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-surface-overlay flex items-center justify-center mx-auto text-primary mb-4">
              <span className="material-symbols-outlined text-3xl">remove_shopping_cart</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Seu carrinho está vazio</h2>
            <p className="text-text-secondary text-sm mb-6">
              Você ainda não adicionou nenhum curso ao carrinho. Escolha um curso do nosso catálogo oficial para continuar.
            </p>
            <button
              onClick={() => onNavigateHome('cursos-section')}
              className="px-6 py-3 bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-bold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Explorar Catálogo de Cursos
            </button>
          </div>
        ) : (
          /* Main Two-Column Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Courses + Student Form + Payment Methods */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Courses List Card */}
              <section className="bg-surface-raised rounded-xl p-5 lg:p-6 shadow-sm border border-border-subtle">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-headline-sm">auto_stories</span>
                    <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                      Cursos selecionados <span className="font-body-md text-text-tertiary font-normal">({items.length} {items.length === 1 ? 'curso' : 'cursos'})</span>
                    </h2>
                  </div>
                  <button
                    onClick={onClearCart}
                    className="flex items-center gap-1 text-text-tertiary hover:text-status-danger font-label-md text-label-md transition-colors px-2 py-1 rounded hover:bg-surface-overlay cursor-pointer"
                    id="clear-cart-btn"
                  >
                    <span className="material-symbols-outlined text-body-md">delete_sweep</span> Limpar carrinho
                  </button>
                </div>

                {/* Course Items List */}
                <div className="flex flex-col gap-3" id="cart-items-container">
                  {items.map((item) => (
                    <article
                      key={item.course.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-overlay/80 transition-all group border border-border-subtle/40"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="relative w-28 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-base">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            src={getCacheBustedImageUrl(item.course.image)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FALLBACK_COURSE_IMAGE;
                            }}
                            alt={item.course.title}
                          />
                          <span className="absolute bottom-1 left-1 bg-surface-dim/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-label-sm text-primary font-semibold">
                            {item.course.category}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-primary/10 text-primary">
                              {item.course.category}
                            </span>
                            <span className="flex items-center gap-1 text-text-tertiary font-body-sm text-body-sm">
                              <span className="material-symbols-outlined text-[15px] text-accent-gold">schedule</span>
                              {item.course.hours}h de carga
                            </span>
                          </div>
                          <h3 className="font-headline-sm text-[16px] text-text-primary font-bold truncate group-hover:text-primary transition-colors">
                            {item.course.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-text-tertiary font-body-sm text-body-sm">
                            <span>{item.course.instructor}</span>
                            <span className="inline-flex items-center gap-1 text-accent-emerald-bright">
                              <span className="material-symbols-outlined text-[14px]">verified</span> Certificado incluso
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0">
                        <div className="flex flex-col sm:items-end">
                          <span className="text-text-tertiary text-body-sm line-through">
                            R$ {(item.course.originalPrice || item.course.currentPrice * 1.5).toFixed(2).replace('.', ',')}
                          </span>
                          <span className="font-headline-sm text-[18px] text-primary font-bold">
                            R$ {item.course.currentPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.course.id)}
                          aria-label={`Remover ${item.course.title}`}
                          className="p-2 text-text-tertiary hover:text-status-danger hover:bg-surface-raised rounded-lg transition-colors cursor-pointer"
                          title="Remover item"
                        >
                          <span className="material-symbols-outlined text-body-lg">delete_outline</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Bottom Action */}
                <div className="mt-4 pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    onClick={() => onNavigateHome('cursos-section')}
                    className="flex items-center gap-2 text-text-secondary hover:text-primary font-label-lg text-label-lg transition-colors group cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-body-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    Continuar explorando cursos
                  </button>
                  <span className="text-text-tertiary font-body-sm text-body-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Pagamento e liberação 100% automatizados
                  </span>
                </div>
              </section>

              {/* Student Identification & Mandatory Data */}
              <section className="bg-surface-raised rounded-xl p-5 lg:p-6 shadow-sm border border-border-subtle">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-headline-sm">badge</span>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">Dados do Aluno &amp; Faturamento</h2>
                      <p className="font-body-sm text-body-sm text-text-tertiary">
                        Preenchimento obrigatório apenas do CPF. Nome e E-mail são preenchidos automaticamente.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-surface-overlay text-primary font-label-sm text-label-sm rounded-lg flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span> Protegido
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Nome Completo (Bloqueado / Cinza) */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                    <label className="font-label-md text-label-md text-text-secondary flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Nome Completo
                        <span className="material-symbols-outlined text-[13px] text-text-tertiary">lock</span>
                      </span>
                      <span className="text-[11px] text-text-tertiary">(p/ Certificado)</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-high/60 text-text-secondary font-body-md text-body-md px-3 pr-9 h-11 rounded-lg border border-border-subtle cursor-not-allowed select-none opacity-85 transition-all outline-none"
                        placeholder={
                          isAccountInactive
                            ? "Conta Desativada (Suporte)"
                            : isAccountNotFound
                            ? "Não localizado (Requer cadastro)"
                            : studentName || "Automático via CPF..."
                        }
                        type="text"
                        value={studentName}
                        readOnly
                        tabIndex={-1}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[17px] text-text-tertiary pointer-events-none">
                        lock
                      </span>
                    </div>
                    <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">info</span>
                      Alteração apenas dentro do Painel do Aluno
                    </span>
                  </div>

                  {/* E-mail de Envio (Bloqueado / Cinza) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-text-secondary flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        E-mail de Envio
                        <span className="material-symbols-outlined text-[13px] text-text-tertiary">lock</span>
                      </span>
                      <span className="text-[11px] text-text-tertiary">(Acesso e Recibo)</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-high/60 text-text-secondary font-body-md text-body-md px-3 pr-9 h-11 rounded-lg border border-border-subtle cursor-not-allowed select-none opacity-85 transition-all outline-none"
                        placeholder={
                          isAccountInactive
                            ? "Conta Desativada (Suporte)"
                            : isAccountNotFound
                            ? "Não localizado (Requer cadastro)"
                            : studentEmail || "Automático via CPF..."
                        }
                        type="email"
                        value={studentEmail}
                        readOnly
                        tabIndex={-1}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[17px] text-text-tertiary pointer-events-none">
                        lock
                      </span>
                    </div>
                    <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">info</span>
                      Alteração apenas dentro do Painel do Aluno
                    </span>
                  </div>

                  {/* CPF do Aluno (ÚNICO OBRIGATÓRIO E EDITÁVEL) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-text-primary flex items-center justify-between font-semibold">
                      <span>CPF do Aluno <span className="text-status-danger">*</span></span>
                      {currentUser ? (
                        <span className="text-[11px] text-accent-emerald-bright font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          Preenchido Automaticamente
                        </span>
                      ) : (
                        <span className="text-[11px] text-primary font-medium">(Obrigatório)</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        className={`w-full font-body-md text-body-md px-3 pr-10 h-11 rounded-lg outline-none border transition-all ${
                          currentUser
                            ? 'bg-surface-container-high/60 text-text-secondary border-accent-emerald-bright/50 cursor-not-allowed select-none opacity-90'
                            : formErrors.studentCpf
                            ? 'border-status-danger bg-status-danger/5 text-status-danger'
                            : isAccountInactive
                            ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                            : isAccountActive
                            ? 'border-accent-emerald-bright/80 focus:border-accent-emerald-bright bg-accent-emerald-bright/5 text-text-primary'
                            : cleanCpfDigits.length === 11
                            ? 'border-status-danger bg-status-danger/5 text-text-primary'
                            : 'bg-surface-container-low text-text-primary border-border-subtle focus:border-primary'
                        }`}
                        placeholder="000.000.000-00"
                        type="text"
                        value={studentCpf}
                        onChange={handleCpfChange}
                        readOnly={Boolean(currentUser)}
                      />
                      <span className="absolute right-3 top-2.5 pointer-events-none">
                        {currentUser ? (
                          <span className="material-symbols-outlined text-accent-emerald-bright text-[20px]" title="Aluno Autenticado no Painel">
                            lock
                          </span>
                        ) : isAccountInactive ? (
                          <span className="material-symbols-outlined text-amber-400 text-[20px]" title="Conta Desativada">
                            warning
                          </span>
                        ) : isAccountActive ? (
                          <span className="material-symbols-outlined text-accent-emerald-bright text-[20px]" title="Cadastro Localizado e Ativo">
                            check_circle
                          </span>
                        ) : cleanCpfDigits.length === 11 ? (
                          <span className="material-symbols-outlined text-status-danger text-[20px]" title="CPF não cadastrado">
                            error
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-text-tertiary text-[20px]">
                            badge
                          </span>
                        )}
                      </span>
                    </div>
                    {currentUser ? (
                      <span className="text-[10px] text-accent-emerald-bright flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">lock</span>
                        Identificação vinculada à sua sessão ativa da Área do Aluno
                      </span>
                    ) : formErrors.studentCpf ? (
                      <span className="text-[11px] text-status-danger flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {formErrors.studentCpf}
                      </span>
                    ) : isAccountInactive ? (
                      <span className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">warning</span>
                        Conta desativada • Entre em contato com o suporte para reativação
                      </span>
                    ) : isAccountActive ? (
                      <span className="text-[10px] text-accent-emerald-bright flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        Cadastro localizado e ativo com sucesso
                      </span>
                    ) : cleanCpfDigits.length === 11 ? (
                      <span className="text-[11px] text-status-danger flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        CPF não cadastrado na plataforma
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-primary">pin</span>
                        Apenas CPF é obrigatório para identificação
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Status Real-Time Indicator */}
                <div className="mt-4 pt-3 border-t border-border-subtle/50">
                  {currentUser && !isAccountInactive ? (
                    <div className="p-3.5 rounded-xl bg-accent-emerald-bright/10 border border-accent-emerald-bright/30 text-accent-emerald-bright text-body-sm flex items-start gap-3">
                      <span className="material-symbols-outlined text-body-lg flex-shrink-0 text-accent-emerald-bright mt-0.5">
                        verified_user
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-text-primary text-[14px]">
                            Aluno Autenticado: {currentUser.name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-accent-emerald-bright/20 text-accent-emerald-bright text-[10px] font-bold">
                            Matrícula: #{currentUser.id.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-text-secondary text-xs mt-1">
                          CPF: <strong className="text-text-primary font-mono">{currentUser.cpf || studentCpf}</strong> • E-mail: <strong className="text-text-primary">{currentUser.email}</strong>
                        </p>
                        <p className="text-accent-emerald-bright text-xs mt-1.5 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          Seus dados já foram preenchidos automaticamente. Prossiga diretamente para o pagamento e o curso será liberado instantaneamente na sua Área do Aluno!
                        </p>
                      </div>
                    </div>
                  ) : isAccountInactive ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-body-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="material-symbols-outlined text-2xl shrink-0 mt-0.5 text-amber-400">
                          warning
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-text-primary">
                              Conta Desativada na Deds Academy
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">
                              Status: Inativo
                            </span>
                          </div>
                          <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                            Identificamos que o CPF <strong className="text-text-primary font-mono">{studentCpf}</strong> pertence a uma conta que se encontra <strong>desativada</strong>. Para regularizar seu acesso e concluir sua compra com segurança, entre em contato com nosso suporte via WhatsApp.
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <a
                          href={buildWhatsAppUrl(
                            supportWhatsAppNumber,
                            `Olá, equipe Deds Academy! Meu CPF é ${studentCpf} e minha conta está com status inativo no carrinho de compras. Gostaria de reativá-la.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-sm">support_agent</span>
                          Contatar Suporte
                        </a>
                      </div>
                    </div>
                  ) : isAccountActive && matchedUser ? (
                    <div className="p-4 rounded-xl bg-accent-emerald-bright/10 border border-accent-emerald-bright/30 text-accent-emerald-bright text-body-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="material-symbols-outlined text-2xl shrink-0 mt-0.5 text-accent-emerald-bright">
                          verified
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-text-primary">
                              CPF cadastrado no nosso sistema
                            </span>
                            <span className="px-2 py-0.5 rounded bg-accent-emerald-bright/20 text-accent-emerald-bright text-[10px] font-bold">
                              Matrícula: #{matchedUser.id.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                            Olá, <strong className="text-text-primary">{matchedUser.name}</strong>! Você está cadastrado(a) na Deds Academy e é muito bom ter você aqui! Seus dados foram validados e o curso será vinculado diretamente ao seu painel assim que o pagamento for concluído.
                          </p>
                          <p className="text-accent-emerald-bright text-xs mt-1 font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">check</span>
                            E-mail vinculado: <strong className="text-text-primary">{matchedUser.email}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : isAccountNotFound ? (
                    <div className="p-4 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-body-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="material-symbols-outlined text-2xl shrink-0 mt-0.5 text-status-danger">
                          warning
                        </span>
                        <div>
                          <span className="font-bold text-sm text-text-primary block">
                            CPF não cadastrado na Deds Academy
                          </span>
                          <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                            Você <strong>não possui cadastro</strong> na plataforma. É obrigatório realizar o cadastro para prosseguir para o pagamento, pois com o cadastro ativo e pagamento realizado o sistema integra o curso diretamente dentro do painel do aluno de acordo com sua matrícula que realizou o pagamento.
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={onOpenAuth}
                              className="text-text-primary hover:text-primary text-xs underline cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>Já tem cadastro com outro CPF? Fazer login</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenRegister) {
                              onOpenRegister(studentCpf);
                            } else if (onOpenAuth) {
                              onOpenAuth();
                            }
                          }}
                          className="px-4 py-2.5 bg-primary hover:bg-accent-emerald-bright text-on-primary font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-sm">person_add</span>
                          Criar Cadastro Agora
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-surface-container-low border border-border-subtle text-text-secondary text-body-sm flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-primary text-body-lg flex-shrink-0">pin</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-text-primary">Identificação Obrigatória por CPF</span>
                        <p className="text-text-secondary text-xs mt-0.5">
                          Informe o CPF do aluno acima (11 dígitos). Nome Completo e E-mail serão carregados automaticamente a partir do cadastro para vincular sua matrícula e liberar o pagamento.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

                            {/* Payment Section: Official Stripe Checkout Banner & Option */}
              <section className="bg-surface-raised rounded-xl p-5 lg:p-6 shadow-sm border border-border-subtle space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-headline-sm">payments</span>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                        Forma de Pagamento
                      </h2>
                      <p className="font-body-sm text-body-sm text-text-tertiary">
                        Todas as transações são processadas com segurança máxima e criptografia de ponta a ponta via Stripe.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checkout Banner (From Admin Module 9) */}
                {checkoutBannerConfig?.enabled !== false && checkoutBannerConfig?.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-border-subtle shadow-md group relative">
                    <img
                      src={getCacheBustedImageUrl(checkoutBannerConfig.imageUrl)}
                      alt={checkoutBannerConfig.altText || 'Banner Oficial de Pagamentos Stripe Checkout'}
                      className="w-full max-h-56 sm:max-h-64 object-cover group-hover:scale-[1.01] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md font-bold flex items-center gap-1.5 border border-white/10">
                        <span className="material-symbols-outlined text-sm text-accent-emerald-bright">verified_user</span>
                        Checkout Seguro Oficial
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md font-mono text-[11px] text-text-secondary border border-white/10">
                        Stripe Protected
                      </span>
                    </div>
                  </div>
                )}

                {/* Seleção de cartão de crédito Stripe Checkout */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-surface-container-high to-surface-container-low border border-primary/20 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-headline-sm">credit_card</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-text-primary text-[14px]">
                        Seleção de cartão de crédito Stripe Checkout
                      </span>
                      <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">
                        STRIPE CHECKOUT
                      </span>
                    </div>
                    <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                      Ao clicar em <strong>Prosseguir para o pagamento</strong>, você será direcionado para o ambiente seguro e oficial da Stripe para concluir sua compra com suporte oficial a parcelamento no cartão de crédito em até 10x sem juros, Pix ou boleto com aprovação imediata.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Order Summary (Sticky Sidebar) */}
            <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
              {/* Summary Card */}
              <div className="bg-surface-raised rounded-xl p-6 shadow-xl relative overflow-hidden border border-border-subtle">
                {/* Accent Top Rim */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent-emerald-bright to-secondary"></div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
                  <h2 className="font-headline-md text-headline-sm text-text-primary font-bold">Resumo do pedido</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-overlay text-primary font-label-sm text-label-sm font-semibold">
                    {items.length} {items.length === 1 ? 'curso' : 'cursos'}
                  </span>
                </div>

                {/* Price Calculation Lines */}
                <div className="flex flex-col gap-2 font-body-md text-body-md text-text-secondary pb-4">
                  <div className="flex items-center justify-between">
                    <span>Subtotal original</span>
                    <span className="text-text-primary font-semibold">R$ {originalSubtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {comboDiscount > 0 && (
                    <div className="flex items-center justify-between text-accent-emerald-bright">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">local_offer</span> Desconto de combo
                      </span>
                      <span className="font-semibold">- R$ {comboDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {couponApplied && activeCouponDiscount > 0 && (
                    <div className="flex items-center justify-between text-accent-emerald-bright">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">percent</span> Desconto Cupom ({couponCode})
                      </span>
                      <span className="font-semibold">- R$ {activeCouponDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {paymentMode === 'pix' && pixDiscount > 0 && (
                    <div className="flex items-center justify-between text-primary">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">qr_code_2</span> Desconto PIX (5%)
                      </span>
                      <span className="font-semibold">- R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-text-tertiary">
                    <span>Taxa de matrícula</span>
                    <span className="text-primary font-semibold uppercase text-label-sm">Grátis</span>
                  </div>
                </div>

                {/* Savings Pill */}
                {totalSavings > 0 && (
                  <div className="bg-surface-container-high rounded-lg p-3 mb-4 flex items-center gap-2 border border-primary/20">
                    <span className="text-[18px]">🎉</span>
                    <span className="font-label-sm text-label-sm text-primary font-bold">
                      Você está economizando R$ {totalSavings.toFixed(2).replace('.', ',')} hoje!
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="h-px bg-surface-container-high my-2"></div>

                {/* Total Price */}
                <div className="py-4 flex flex-col gap-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-label-lg text-label-lg text-text-primary font-bold">Valor Total:</span>
                    <div className="flex flex-col items-end">
                      <span className="font-display text-[32px] leading-tight text-primary font-bold tracking-tight">
                        R$ {finalTotal.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="font-body-sm text-body-sm text-text-tertiary">
                        ou até 10x de R$ {(finalTotal / 10).toFixed(2).replace('.', ',')} sem juros
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clean Coupon Input Form */}
                <form onSubmit={handleApplyCoupon} className="my-2">
                  <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Cupom de Desconto</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        className="w-full uppercase font-label-md text-label-md bg-surface-container-low text-text-primary px-3 h-10 rounded-lg outline-none border border-border-subtle focus:border-primary focus:bg-surface-overlay transition-all"
                        id="coupon-input"
                        placeholder="Inserir cupom..."
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      {couponApplied && (
                        <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-primary text-[18px]">
                          check_circle
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="px-4 h-10 rounded-lg bg-surface-overlay hover:bg-surface-container-high text-primary font-label-md text-label-md transition-colors cursor-pointer border border-border-subtle"
                    >
                      {couponApplied ? 'Aplicado' : 'Aplicar'}
                    </button>
                  </div>
                </form>

                {/* Stripe Error Feedback */}
                {stripeError && (
                  <div className="mt-3 p-3 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-body-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-body-md">error</span>
                      <span className="font-semibold">{stripeError}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePayWithStripe()}
                        className="text-xs bg-status-danger text-white px-2.5 py-1 rounded hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Tentar Novamente
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFinishOrder(true)}
                        className="text-xs underline text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        Concluir como teste simulado
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary Button: Pagamento Checkout */}
                <button
                  onClick={() => handleFinishOrder(false)}
                  disabled={!canProceed}
                  className={`w-full mt-4 py-3.5 px-6 font-headline-sm text-headline-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 group ${
                    canProceed
                      ? 'bg-primary-container hover:bg-accent-emerald-bright text-on-primary shadow-[0_0_24px_-3px_rgba(0,176,116,0.45)] hover:shadow-[0_0_30px_0_rgba(0,208,132,0.6)] active:scale-[0.98] cursor-pointer'
                      : isAccountInactive
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40 cursor-not-allowed opacity-90'
                      : isAccountNotFound
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 cursor-not-allowed opacity-85'
                      : 'bg-surface-container-high text-text-tertiary cursor-not-allowed border border-border-subtle opacity-75'
                  }`}
                >
                  <span className="material-symbols-outlined text-headline-md group-hover:scale-110 transition-transform">
                    {canProceed ? 'lock_open' : isAccountInactive ? 'warning' : 'lock'}
                  </span>
                  {isProcessingStripe
                    ? 'Conectando ao Checkout Seguro...'
                    : isAccountInactive
                    ? 'Conta desativada • Contate o suporte'
                    : isAccountNotFound
                    ? 'Cadastro obrigatório para pagar'
                    : isCpfIncomplete
                    ? 'Informe o CPF para prosseguir'
                    : items.length === 0
                    ? 'Carrinho vazio'
                    : 'Prosseguir para o pagamento'}
                </button>

                {/* Aviso e atalho para suporte se conta estiver desativada */}
                {isAccountInactive && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col gap-2">
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-sm shrink-0 mt-0.5 text-amber-400">warning</span>
                      <span className="leading-snug text-text-primary">
                        Sua conta está desativada. Para reativá-la e liberar a compra deste curso, entre em contato com nosso atendimento via WhatsApp.
                      </span>
                    </div>
                    <a
                      href={buildWhatsAppUrl(
                        supportWhatsAppNumber,
                        `Olá! Meu CPF é ${studentCpf} e minha conta está inativa na Deds Academy. Gostaria de regularizar meu cadastro.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">support_agent</span>
                      Falar com Suporte no WhatsApp
                    </a>
                  </div>
                )}

                {/* Aviso e atalho para cadastro se CPF não for encontrado */}
                {isAccountNotFound && (
                  <div className="mt-3 p-3 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex flex-col gap-2">
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-sm shrink-0 mt-0.5 text-status-danger">warning</span>
                      <span className="leading-snug text-text-primary">
                        Para liberar o pagamento, realize seu cadastro primeiro para gerar sua matrícula.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenRegister) {
                          onOpenRegister(studentCpf);
                        } else if (onOpenAuth) {
                          onOpenAuth();
                        }
                      }}
                      className="w-full py-2 bg-primary hover:bg-accent-emerald-bright text-on-primary font-bold rounded-lg text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Cadastre-se na Plataforma Agora
                    </button>
                  </div>
                )}

                {/* Security Badges */}
                <div className="mt-4 pt-2 flex flex-col items-center gap-1 text-center text-text-tertiary font-body-sm text-body-sm">
                  <span className="flex items-center gap-1 text-accent-emerald-bright font-label-sm font-semibold">
                    <span className="material-symbols-outlined text-[15px]">verified_user</span> Ambiente 100% Criptografado &amp; Seguro (SSL 256-bit)
                  </span>
                  <p className="text-[11px] text-text-tertiary leading-normal">
                    Seus dados financeiros são processados diretamente pela Stripe.
                  </p>
                </div>
              </div>

              {/* Help Card Mini */}
              <div className="bg-surface-raised rounded-xl p-4 flex items-center gap-4 border border-border-subtle">
                <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-headline-sm">help_outline</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-headline-sm text-[15px] text-text-primary font-bold">Dúvidas sobre o pagamento?</span>
                  <p className="font-body-sm text-body-sm text-text-tertiary">Chame nossa equipe via WhatsApp</p>
                  <a
                    className="text-primary font-label-md text-label-md hover:underline inline-flex items-center gap-1 mt-0.5"
                    href={buildWhatsAppUrl(supportWhatsAppNumber, 'Olá, estou finalizando a matrícula e tenho dúvidas sobre o pagamento.')}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {supportWhatsAppNumber} <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Trust & Guarantee Badges Horizontal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-8 border-t border-border-subtle">
          <div className="bg-surface-raised p-4 rounded-xl flex items-start gap-3 border border-border-subtle">
            <div className="w-12 h-12 rounded-lg bg-surface-overlay text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-headline-md">verified</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-headline-sm text-[15px] text-text-primary font-bold">Garantia de 7 Dias</h4>
              <p className="font-body-sm text-body-sm text-text-tertiary mt-1">
                Experimente a plataforma sem riscos. Satisfação garantida ou 100% do valor estornado.
              </p>
            </div>
          </div>

          <div className="bg-surface-raised p-4 rounded-xl flex items-start gap-3 border border-border-subtle">
            <div className="w-12 h-12 rounded-lg bg-surface-overlay text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-headline-md">workspace_premium</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-headline-sm text-[15px] text-text-primary font-bold">Certificado Reconhecido</h4>
              <p className="font-body-sm text-body-sm text-text-tertiary mt-1">
                Conforme Lei Federal nº 9.394/96 com QR Code de autenticidade rastreável.
              </p>
            </div>
          </div>

          <div className="bg-surface-raised p-4 rounded-xl flex items-start gap-3 border border-border-subtle">
            <div className="w-12 h-12 rounded-lg bg-surface-overlay text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-headline-md">all_inclusive</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-headline-sm text-[15px] text-text-primary font-bold">Acesso Imediato &amp; Vitalício</h4>
              <p className="font-body-sm text-body-sm text-text-tertiary mt-1">
                Estude onde e quando desejar no computador, tablet ou aplicativo mobile.
              </p>
            </div>
          </div>

          <div className="bg-surface-raised p-4 rounded-xl flex items-start gap-3 border border-border-subtle">
            <div className="w-12 h-12 rounded-lg bg-surface-overlay text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-headline-md">support_agent</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-headline-sm text-[15px] text-text-primary font-bold">Suporte Ativo ao Aluno</h4>
              <p className="font-body-sm text-body-sm text-text-tertiary mt-1">
                Comunidade exclusiva e canais diretos para tirar todas as dúvidas técnicas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
