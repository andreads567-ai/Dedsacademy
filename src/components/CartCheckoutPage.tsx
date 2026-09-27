import React, { useState } from 'react';
import { CartItem, UserAccount } from '../types';

export interface CheckoutData {
  studentName: string;
  studentEmail: string;
  studentCpf: string;
  paymentMethod: string;
}

interface CartCheckoutPageProps {
  items: CartItem[];
  onRemoveItem: (courseId: string) => void;
  onClearCart: () => void;
  onNavigateHome: (sectionId?: string) => void;
  onCheckoutSuccess: (data: CheckoutData) => void;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
}

export const CartCheckoutPage: React.FC<CartCheckoutPageProps> = ({
  items,
  onRemoveItem,
  onClearCart,
  onNavigateHome,
  onCheckoutSuccess,
  currentUser,
  onOpenAuth,
}) => {
  const [paymentMode, setPaymentMode] = useState<'pix' | 'credit' | 'debit' | 'boleto'>('pix');
  const [couponCode, setCouponCode] = useState('DEDS10');
  const [couponApplied, setCouponApplied] = useState(true);
  const [couponDiscount, setCouponDiscount] = useState(23.98);

  // Student form state - prefill from logged-in user
  const [studentName, setStudentName] = useState(currentUser?.name || '');
  const [studentEmail, setStudentEmail] = useState(currentUser?.email || '');
  const [studentCpf, setStudentCpf] = useState(currentUser?.cpf || '');

  // Credit Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState('10');

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

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'DEDS10' || code === 'BEMVINDO10') {
      setCouponApplied(true);
      setCouponDiscount(Math.round(currentSubtotal * 0.1 * 100) / 100);
    } else if (code === 'DEDS20') {
      setCouponApplied(true);
      setCouponDiscount(Math.round(currentSubtotal * 0.2 * 100) / 100);
    } else if (code === 'TURBO50') {
      setCouponApplied(true);
      setCouponDiscount(50.0);
    } else {
      setCouponApplied(false);
      setCouponDiscount(0);
    }
  };

  const handleFinishOrder = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    onCheckoutSuccess({
      studentName,
      studentEmail,
      studentCpf,
      paymentMethod: paymentMode,
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
              Revise seus cursos selecionados, aplique cupons exclusivos e finalize sua matrícula com criptografia de ponta a ponta.
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
                <span className="font-body-sm text-[10px] text-text-tertiary">Condições</span>
              </div>
            </div>
            <div className="w-8 h-0.5 bg-surface-container-high"></div>
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high text-text-tertiary flex items-center justify-center font-label-md">
                <span className="material-symbols-outlined text-body-md">check_circle</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-text-tertiary">3. Acesso</span>
                <span className="font-body-sm text-[10px] text-text-tertiary">Conclusão</span>
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
              Adicione cursos em tecnologia, negócios e marketing para acelerar sua carreira acadêmica e profissional.
            </p>
            <button
              onClick={() => onNavigateHome('cursos-section')}
              className="px-6 py-3 bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-bold rounded-xl shadow-lg transition-all"
            >
              Explorar Catálogo de Cursos
            </button>
          </div>
        ) : (
          /* Main Two-Column Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Courses + Payment Methods + Invoicing Info */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Courses List Card */}
              <section className="bg-surface-raised rounded-xl p-5 lg:p-6 shadow-sm border border-border-subtle">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-headline-sm">auto_stories</span>
                    <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                      Cursos selecionados <span className="font-body-md text-text-tertiary font-normal">({items.length} cursos)</span>
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

                {/* Course Items Table / Grid */}
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
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Condições e cupons válidos por 15 minutos
                  </span>
                </div>
              </section>

              {/* Student Identification & Invoicing Data */}
              <section className="bg-surface-raised rounded-xl p-5 lg:p-6 shadow-sm border border-border-subtle">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-headline-sm">badge</span>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">Dados do Aluno &amp; Faturamento</h2>
                      <p className="font-body-sm text-body-sm text-text-tertiary">O certificado oficial e o acesso imediato serão emitidos para este cadastro.</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-surface-overlay text-primary font-label-sm text-label-sm rounded-lg flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span> Protegido
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                    <label className="font-label-md text-label-md text-text-secondary">Nome Completo (p/ Certificado)</label>
                    <input
                      className="bg-surface-container-low text-text-primary font-body-md text-body-md px-3 h-11 rounded-lg outline-none focus:bg-surface-overlay border border-border-subtle focus:border-primary transition-all"
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-text-secondary">E-mail para Envio do Acesso</label>
                    <input
                      className="bg-surface-container-low text-text-primary font-body-md text-body-md px-3 h-11 rounded-lg outline-none focus:bg-surface-overlay border border-border-subtle focus:border-primary transition-all"
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-text-secondary">CPF / CNPJ (Nota Fiscal)</label>
                    <input
                      className="bg-surface-container-low text-text-primary font-body-md text-body-md px-3 h-11 rounded-lg outline-none focus:bg-surface-overlay border border-border-subtle focus:border-primary transition-all"
                      type="text"
                      value={studentCpf}
                      onChange={(e) => setStudentCpf(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Payment Method Selection Section */}
              <section className="bg-surface-raised rounded-xl p-5 lg:p-6 shadow-sm border border-border-subtle">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-headline-sm">payments</span>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">Escolha a Forma de Pagamento</h2>
                      <p className="font-body-sm text-body-sm text-text-tertiary">Transações criptografadas com liquidação imediata e garantia total.</p>
                    </div>
                  </div>
                </div>

                {/* Radio Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Option 1: PIX */}
                  <label
                    onClick={() => setPaymentMode('pix')}
                    className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border ${
                      paymentMode === 'pix'
                        ? 'bg-surface-container-high border-primary shadow-[0_0_15px_rgba(0,176,116,0.2)]'
                        : 'bg-surface-container-low border-border-subtle hover:bg-surface-overlay'
                    }`}
                  >
                    <input
                      checked={paymentMode === 'pix'}
                      onChange={() => setPaymentMode('pix')}
                      className="mt-1 accent-primary"
                      name="payment_mode"
                      type="radio"
                      value="pix"
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-[16px] text-text-primary font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-body-lg">qr_code_2</span> PIX Instantâneo
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-label-sm bg-accent-emerald-bright/20 text-accent-emerald-bright font-bold">
                          5% OFF EXTRA
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                        Aprovação imediata e liberação do acesso em segundos via QR Code.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Credit Card */}
                  <label
                    onClick={() => setPaymentMode('credit')}
                    className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border ${
                      paymentMode === 'credit'
                        ? 'bg-surface-container-high border-primary shadow-[0_0_15px_rgba(0,176,116,0.2)]'
                        : 'bg-surface-container-low border-border-subtle hover:bg-surface-overlay'
                    }`}
                  >
                    <input
                      checked={paymentMode === 'credit'}
                      onChange={() => setPaymentMode('credit')}
                      className="mt-1 accent-primary"
                      name="payment_mode"
                      type="radio"
                      value="credit"
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-[16px] text-text-primary font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-secondary text-body-lg">credit_card</span> Cartão de Crédito
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-surface-overlay text-[10px] font-bold text-text-secondary">VISA</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-overlay text-[10px] font-bold text-text-secondary">MC</span>
                          <span className="px-1.5 py-0.5 rounded bg-surface-overlay text-[10px] font-bold text-text-secondary">ELO</span>
                        </div>
                      </div>
                      <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                        Parcele em até 10x sem juros de R$ {(finalTotal / 10).toFixed(2).replace('.', ',')} ou use 2 cartões.
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Debit Card */}
                  <label
                    onClick={() => setPaymentMode('debit')}
                    className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border ${
                      paymentMode === 'debit'
                        ? 'bg-surface-container-high border-primary shadow-[0_0_15px_rgba(0,176,116,0.2)]'
                        : 'bg-surface-container-low border-border-subtle hover:bg-surface-overlay'
                    }`}
                  >
                    <input
                      checked={paymentMode === 'debit'}
                      onChange={() => setPaymentMode('debit')}
                      className="mt-1 accent-primary"
                      name="payment_mode"
                      type="radio"
                      value="debit"
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-[16px] text-text-primary font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-tertiary text-body-lg">account_balance_wallet</span> Cartão de Débito
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-overlay text-[10px] font-label-sm text-text-tertiary">À VISTA</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                        Aprovação ágil debitada diretamente da sua conta corrente bancária.
                      </p>
                    </div>
                  </label>

                  {/* Option 4: Boleto Bancário */}
                  <label
                    onClick={() => setPaymentMode('boleto')}
                    className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border ${
                      paymentMode === 'boleto'
                        ? 'bg-surface-container-high border-primary shadow-[0_0_15px_rgba(0,176,116,0.2)]'
                        : 'bg-surface-container-low border-border-subtle hover:bg-surface-overlay'
                    }`}
                  >
                    <input
                      checked={paymentMode === 'boleto'}
                      onChange={() => setPaymentMode('boleto')}
                      className="mt-1 accent-primary"
                      name="payment_mode"
                      type="radio"
                      value="boleto"
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-[16px] text-text-primary font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-text-tertiary text-body-lg">receipt_long</span> Boleto Bancário
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-overlay text-[10px] font-label-sm text-text-tertiary">1 DIA ÚTIL</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                        Pague via app bancário ou lotéricas. Compensação em até 24h úteis.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Dynamic Panel: Credit Card Inputs */}
                {paymentMode === 'credit' && (
                  <div className="flex flex-col gap-4 p-5 rounded-xl bg-surface-container-low mb-4 border border-border-subtle">
                    <div className="flex items-center justify-between">
                      <span className="font-label-lg text-label-lg text-text-primary font-bold">Insira os dados do cartão</span>
                      <span className="font-body-sm text-body-sm text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">shield</span> Tokenização PCI-DSS
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="font-label-md text-label-md text-text-secondary">Número do Cartão</label>
                        <div className="relative flex items-center">
                          <input
                            className="w-full bg-surface-raised text-text-primary px-3 h-11 rounded-lg outline-none font-body-md text-body-md pl-10 border border-border-subtle focus:border-primary focus:bg-surface-overlay transition-all"
                            placeholder="0000 0000 0000 0000"
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                          />
                          <span className="material-symbols-outlined absolute left-3 text-text-tertiary text-body-md">credit_card</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="font-label-md text-label-md text-text-secondary">Nome Impresso no Cartão</label>
                        <input
                          className="w-full bg-surface-raised text-text-primary px-3 h-11 rounded-lg outline-none font-body-md text-body-md uppercase border border-border-subtle focus:border-primary focus:bg-surface-overlay transition-all"
                          placeholder="ANDRE S SILVA"
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-text-secondary">Validade (MM/AA)</label>
                        <input
                          className="w-full bg-surface-raised text-text-primary px-3 h-11 rounded-lg outline-none font-body-md text-body-md border border-border-subtle focus:border-primary focus:bg-surface-overlay transition-all"
                          placeholder="08/29"
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-text-secondary">Código de Segurança (CVV)</label>
                        <input
                          className="w-full bg-surface-raised text-text-primary px-3 h-11 rounded-lg outline-none font-body-md text-body-md border border-border-subtle focus:border-primary focus:bg-surface-overlay transition-all"
                          maxLength={4}
                          placeholder="123"
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="font-label-md text-label-md text-text-secondary">Opções de Parcelamento</label>
                        <select
                          value={installments}
                          onChange={(e) => setInstallments(e.target.value)}
                          className="w-full bg-surface-raised text-text-primary px-3 h-11 rounded-lg outline-none font-body-md text-body-md cursor-pointer border border-border-subtle focus:border-primary focus:bg-surface-overlay transition-all"
                        >
                          <option value="1">1x de R$ {finalTotal.toFixed(2).replace('.', ',')} (sem juros)</option>
                          <option value="2">2x de R$ {(finalTotal / 2).toFixed(2).replace('.', ',')} (sem juros)</option>
                          <option value="3">3x de R$ {(finalTotal / 3).toFixed(2).replace('.', ',')} (sem juros)</option>
                          <option value="6">6x de R$ {(finalTotal / 6).toFixed(2).replace('.', ',')} (sem juros)</option>
                          <option value="10">10x de R$ {(finalTotal / 10).toFixed(2).replace('.', ',')} (sem juros no cartão)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* PIX Preview Banner */}
                {paymentMode === 'pix' && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-high/70 border border-primary/20">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-headline-md">bolt</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-[15px] text-text-primary font-bold">Liberação Imediata via PIX</span>
                      <p className="font-body-sm text-body-sm text-text-secondary">
                        Ao clicar em finalizar, você receberá o QR Code e a chave copia-e-cola com valor já recalculado com desconto adicional de 5% (R$ {finalTotal.toFixed(2).replace('.', ',')}).
                      </p>
                    </div>
                  </div>
                )}

                {/* Boleto Banner */}
                {paymentMode === 'boleto' && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-border-subtle">
                    <div className="w-12 h-12 rounded-xl bg-surface-overlay text-text-tertiary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-headline-md">description</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-[15px] text-text-primary font-bold">Boleto Bancário Registrado</span>
                      <p className="font-body-sm text-body-sm text-text-secondary">
                        O boleto será gerado para impressão com prazo de 3 dias corridos. O acesso aos cursos é liberado assim que o banco liquidar a transação.
                      </p>
                    </div>
                  </div>
                )}
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
                    {items.length} cursos
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
                <div className="bg-surface-container-high rounded-lg p-3 mb-4 flex items-center gap-2 border border-primary/20">
                  <span className="text-[18px]">🎉</span>
                  <span className="font-label-sm text-label-sm text-primary font-bold">
                    Você está economizando R$ {totalSavings.toFixed(2).replace('.', ',')} hoje!
                  </span>
                </div>

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

                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCoupon} className="my-2">
                  <label className="font-label-sm text-label-sm text-text-secondary block mb-1">Cupom de Desconto</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        className="w-full uppercase font-label-md text-label-md bg-surface-container-low text-text-primary px-3 h-10 rounded-lg outline-none border border-border-subtle focus:border-primary focus:bg-surface-overlay transition-all"
                        id="coupon-input"
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

                {/* Primary Checkout Button */}
                <button
                  onClick={handleFinishOrder}
                  className="w-full mt-4 py-3.5 px-6 bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-headline-sm text-headline-sm font-bold rounded-xl shadow-[0_0_24px_-3px_rgba(0,176,116,0.45)] hover:shadow-[0_0_30px_0_rgba(0,208,132,0.6)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-headline-md group-hover:scale-110 transition-transform">lock</span>
                  Finalizar Compra Segura
                </button>

                {/* Security Badges */}
                <div className="mt-4 pt-2 flex flex-col items-center gap-1 text-center text-text-tertiary font-body-sm text-body-sm">
                  <span className="flex items-center gap-1 text-accent-emerald-bright font-label-sm font-semibold">
                    <span className="material-symbols-outlined text-[15px]">verified_user</span> Ambiente 100% Criptografado &amp; Seguro (SSL 256-bit)
                  </span>
                  <p className="text-[11px] text-text-tertiary leading-normal">
                    Seus dados financeiros não ficam armazenados em nossos servidores.
                  </p>
                </div>
              </div>

              {/* Help Card Mini */}
              <div className="bg-surface-raised rounded-xl p-4 flex items-center gap-4 border border-border-subtle">
                <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-headline-sm">help_outline</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-headline-sm text-[15px] text-text-primary font-bold">Precisa de ajuda para comprar?</span>
                  <p className="font-body-sm text-body-sm text-text-tertiary">Chame nossos especialistas via WhatsApp</p>
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
              <h4 className="font-headline-sm text-[15px] text-text-primary font-bold">Suporte Ativo com Tutores</h4>
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
