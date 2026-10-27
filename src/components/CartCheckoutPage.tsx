import React, { useState, useMemo } from 'react';
import { CartItem, UserAccount, CheckoutPaymentBannerConfig, DEFAULT_CHECKOUT_PAYMENT_BANNER, Coupon } from '../types';
import { INITIAL_COUPONS } from '../data/promotionsData';
import { redirectToStripeCheckout } from '../lib/stripeClient';

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

  // Mandatory student form state - prefill from logged-in user if active
  const [studentName, setStudentName] = useState(currentUser?.name || '');
  const [studentEmail, setStudentEmail] = useState(currentUser?.email || '');
  const [studentCpf, setStudentCpf] = useState(currentUser?.cpf || '');
  const [formErrors, setFormErrors] = useState<{
    studentName?: string;
    studentEmail?: string;
    studentCpf?: string;
  }>({});
  const [cpfNoticeMessage, setCpfNoticeMessage] = useState<string | null>(null);
  const [isExistingAccount, setIsExistingAccount] = useState<boolean>(false);

  // Real-time check if student already has an account
  const matchedUser = useMemo(() => {
    if (currentUser) return currentUser;
    const trimmedEmail = studentEmail.trim().toLowerCase();
    const cleanCpfDigits = studentCpf.replace(/\D/g, '');
    if (!trimmedEmail && cleanCpfDigits.length < 11) return null;

    return (
      usersList.find((u) => {
        const userEmail = (u.email || '').trim().toLowerCase();
        const userCpf = (u.cpf || '').replace(/\D/g, '');
        return (
          (trimmedEmail && userEmail === trimmedEmail) ||
          (cleanCpfDigits.length >= 11 && userCpf === cleanCpfDigits)
        );
      }) || null
    );
  }, [currentUser, studentEmail, studentCpf, usersList]);

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
      const foundUser = usersList.find((u) => u.cpf?.replace(/\D/g, '') === rawDigits);
      if (foundUser) {
        setIsExistingAccount(true);
        const nameDiffers = studentName.trim() && studentName.trim().toLowerCase() !== foundUser.name.trim().toLowerCase();
        const emailDiffers = studentEmail.trim() && studentEmail.trim().toLowerCase() !== foundUser.email.trim().toLowerCase();

        // Auto-fill existing student name and email
        setStudentName(foundUser.name);
        setStudentEmail(foundUser.email);
        setFormErrors({});

        if (nameDiffers || emailDiffers) {
          setCpfNoticeMessage(
            `Identificamos um cadastro existente para este CPF. O Nome Completo e E-mail foram alterados e preenchidos automaticamente com os dados oficiais cadastrados no sistema (${foundUser.name} • ${foundUser.email}).`
          );
        } else {
          setCpfNoticeMessage(
            `Cadastro oficial localizado com sucesso! Dados de ${foundUser.name} preenchidos automaticamente.`
          );
        }
      } else {
        setIsExistingAccount(false);
        setCpfNoticeMessage(
          'CPF não cadastrado na plataforma. Para novos alunos, o preenchimento do Nome Completo e E-mail de Envio é obrigatório.'
        );
      }
    } else {
      setCpfNoticeMessage(null);
      setIsExistingAccount(false);
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
    const errors: { studentName?: string; studentEmail?: string; studentCpf?: string } = {};
    const cleanCpfDigits = studentCpf.replace(/\D/g, '');

    // 1. CPF is always mandatory for identification
    if (!cleanCpfDigits || cleanCpfDigits.length < 11) {
      errors.studentCpf = 'O CPF do Aluno é obrigatório (11 dígitos) para identificar seu cadastro.';
      setFormErrors(errors);
      return false;
    }

    const foundUser = usersList.find((u) => u.cpf?.replace(/\D/g, '') === cleanCpfDigits);

    if (foundUser) {
      // User exists in system: guarantee their registered name and email are used
      if (!studentName.trim()) setStudentName(foundUser.name);
      if (!studentEmail.trim()) setStudentEmail(foundUser.email);
    } else {
      // New user: Name and Email are strictly mandatory
      if (!studentName.trim() || studentName.trim().length < 3) {
        errors.studentName = 'O Nome Completo é obrigatório para cadastrar o novo aluno e emitir certificados.';
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!studentEmail.trim() || !emailRegex.test(studentEmail.trim())) {
        errors.studentEmail = 'O E-mail de Envio é obrigatório e deve ser válido para envio do acesso.';
      } else {
        // Strict duplicate check: e-mail cannot belong to another CPF
        const emailOwner = usersList.find(
          (u) => u.email?.trim().toLowerCase() === studentEmail.trim().toLowerCase() && u.cpf?.replace(/\D/g, '') !== cleanCpfDigits
        );
        if (emailOwner) {
          errors.studentEmail = `Este e-mail já pertence a outro aluno cadastrado (${emailOwner.name}). Use seu próprio e-mail ou faça login.`;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
                            src={item.course.image}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';
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
                      <p className="font-body-sm text-body-sm text-text-tertiary">Preenchimento obrigatório para liberação do acesso e emissão do certificado oficial.</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-surface-overlay text-primary font-label-sm text-label-sm rounded-lg flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span> Protegido
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Nome Completo */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                    <label className="font-label-md text-label-md text-text-secondary flex items-center justify-between">
                      <span>Nome Completo <span className="text-status-danger">*</span></span>
                      <span className="text-[11px] text-text-tertiary">(p/ Certificado)</span>
                    </label>
                    <input
                      className={`bg-surface-container-low text-text-primary font-body-md text-body-md px-3 h-11 rounded-lg outline-none focus:bg-surface-overlay border transition-all ${
                        formErrors.studentName ? 'border-status-danger bg-status-danger/5' : 'border-border-subtle focus:border-primary'
                      }`}
                      placeholder="Ex: André Silva"
                      type="text"
                      value={studentName}
                      onChange={(e) => {
                        setStudentName(e.target.value);
                        if (formErrors.studentName) setFormErrors((prev) => ({ ...prev, studentName: undefined }));
                      }}
                    />
                    {formErrors.studentName && (
                      <span className="text-[11px] text-status-danger flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {formErrors.studentName}
                      </span>
                    )}
                  </div>

                  {/* E-mail de Envio */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-text-secondary flex items-center justify-between">
                      <span>E-mail de Envio <span className="text-status-danger">*</span></span>
                      <span className="text-[11px] text-text-tertiary">(Acesso e Recibo)</span>
                    </label>
                    <input
                      className={`bg-surface-container-low text-text-primary font-body-md text-body-md px-3 h-11 rounded-lg outline-none focus:bg-surface-overlay border transition-all ${
                        formErrors.studentEmail ? 'border-status-danger bg-status-danger/5' : 'border-border-subtle focus:border-primary'
                      }`}
                      placeholder="seu@email.com"
                      type="email"
                      value={studentEmail}
                      onChange={(e) => {
                        setStudentEmail(e.target.value);
                        if (formErrors.studentEmail) setFormErrors((prev) => ({ ...prev, studentEmail: undefined }));
                      }}
                    />
                    {formErrors.studentEmail && (
                      <span className="text-[11px] text-status-danger flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {formErrors.studentEmail}
                      </span>
                    )}
                  </div>

                  {/* CPF / CNPJ */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-text-secondary flex items-center justify-between">
                      <span>CPF do Aluno <span className="text-status-danger">*</span></span>
                      <span className="text-[11px] text-text-tertiary">(Identificação)</span>
                    </label>
                    <input
                      className={`bg-surface-container-low text-text-primary font-body-md text-body-md px-3 h-11 rounded-lg outline-none focus:bg-surface-overlay border transition-all ${
                        formErrors.studentCpf ? 'border-status-danger bg-status-danger/5' : 'border-border-subtle focus:border-primary'
                      }`}
                      placeholder="000.000.000-00"
                      type="text"
                      value={studentCpf}
                      onChange={handleCpfChange}
                    />
                    {formErrors.studentCpf && (
                      <span className="text-[11px] text-status-danger flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {formErrors.studentCpf}
                      </span>
                    )}
                  </div>
                </div>

                {cpfNoticeMessage && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all mt-3 ${
                    isExistingAccount
                      ? 'bg-accent-emerald-bright/10 border-accent-emerald-bright/30 text-accent-emerald-bright'
                      : 'bg-primary/10 border-primary/25 text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">
                      {isExistingAccount ? 'how_to_reg' : 'info'}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold leading-relaxed">{cpfNoticeMessage}</p>
                      {isExistingAccount && (
                        <p className="text-text-secondary text-[11px] mt-1">
                          Seu cadastro existente foi sincronizado com este pedido. Ao concluir o pagamento, os cursos serão liberados imediatamente para você.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Account Status Real-Time Indicator */}
                <div className="mt-4 pt-3 border-t border-border-subtle/50">
                  {matchedUser ? (
                    <div className="p-3 rounded-lg bg-accent-emerald-bright/10 border border-accent-emerald-bright/30 text-accent-emerald-bright text-body-sm flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-body-lg flex-shrink-0">check_circle</span>
                      <div className="flex flex-col">
                        <span className="font-bold">Conta existente identificada ({matchedUser.name})</span>
                        <p className="text-text-secondary text-xs mt-0.5">
                          Após o pagamento na Stripe, os novos cursos comprados serão vinculados diretamente à sua conta existente!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-surface-container-low border border-border-subtle text-text-secondary text-body-sm flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-primary text-body-lg flex-shrink-0">person_add</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-text-primary">Novo aluno na Deds Academy</span>
                        <p className="text-text-secondary text-xs mt-0.5">
                          Após a conclusão do pagamento, você será direcionado para criar sua senha de acesso e enviamos a confirmação para seu e-mail.
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
                      src={checkoutBannerConfig.imageUrl}
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
                  disabled={isProcessingStripe || items.length === 0}
                  className="w-full mt-4 py-3.5 px-6 bg-primary-container hover:bg-accent-emerald-bright disabled:opacity-60 disabled:cursor-not-allowed text-on-primary font-headline-sm text-headline-sm font-bold rounded-xl shadow-[0_0_24px_-3px_rgba(0,176,116,0.45)] hover:shadow-[0_0_30px_0_rgba(0,208,132,0.6)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-headline-md group-hover:scale-110 transition-transform">lock</span>
                  {isProcessingStripe ? 'Conectando ao Checkout Seguro...' : 'Prosseguir para o pagamento'}
                </button>

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
                    href="https://wa.me/5511999999999"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    (11) 99999-9999 <span className="material-symbols-outlined text-[14px]">open_in_new</span>
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
