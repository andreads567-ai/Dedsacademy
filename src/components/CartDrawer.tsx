import React, { useState } from 'react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (courseId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  const [coupon, setCoupon] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (acc, item) => acc + item.course.currentPrice * item.quantity,
    0
  );

  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = coupon.trim().toUpperCase();
    if (code === 'DEDS20') {
      setDiscountPercent(20);
      setCouponError('');
    } else if (code === 'BEMVINDO10' || code === 'DEDS10') {
      setDiscountPercent(10);
      setCouponError('');
    } else {
      setCouponError('Cupom inválido ou expirado.');
      setDiscountPercent(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-surface-raised h-full shadow-2xl z-10 flex flex-col border-l border-border-subtle animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-headline-sm">
              shopping_cart
            </span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">
              Seu Carrinho ({items.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-overlay transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center gap-4 text-text-tertiary">
              <span className="material-symbols-outlined text-display text-border-strong">
                remove_shopping_cart
              </span>
              <p className="font-body-md text-text-secondary">Seu carrinho está vazio</p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg bg-surface-overlay hover:bg-surface-container-high text-primary font-label-md font-semibold transition-colors"
              >
                Navegar pelos cursos
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.course.id}
                className="p-3.5 rounded-xl bg-surface-overlay border border-border-subtle flex gap-3 items-center justify-between"
              >
                <img
                  src={item.course.image}
                  alt={item.course.title}
                  className="w-16 h-12 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-label-md font-bold text-text-primary truncate">
                    {item.course.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-label-sm text-text-tertiary">
                      {item.course.hours}h • Certificado
                    </span>
                  </div>
                  <span className="text-label-md text-primary font-bold">
                    R$ {item.course.currentPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveItem(item.course.id)}
                  className="p-1.5 text-text-tertiary hover:text-status-danger transition-colors"
                  title="Remover"
                >
                  <span className="material-symbols-outlined text-body-md">delete</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-border-subtle bg-surface-container-lowest space-y-4">
            {/* Coupon input */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Cupom (ex: DEDS20)"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="flex-1 px-3 py-2 bg-surface-raised border border-border-subtle rounded-lg text-body-sm text-text-primary uppercase placeholder:normal-case placeholder:text-text-tertiary focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-surface-overlay hover:bg-surface-container text-text-primary text-label-sm font-bold rounded-lg transition-colors"
              >
                Aplicar
              </button>
            </form>
            {discountPercent > 0 && (
              <p className="text-label-sm text-accent-emerald-bright font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-body-sm">check_circle</span>
                Desconto de 20% aplicado com sucesso!
              </p>
            )}
            {couponError && (
              <p className="text-label-sm text-status-danger">{couponError}</p>
            )}

            {/* Sums */}
            <div className="space-y-1.5 text-body-sm">
              <div className="flex justify-between text-text-tertiary">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-accent-emerald-bright">
                  <span>Desconto (20%)</span>
                  <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-body-lg font-bold text-text-primary pt-2 border-t border-border-subtle">
                <span>Total</span>
                <span className="text-primary">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              onClick={onCheckout}
              className="w-full py-3.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-label-lg font-bold rounded-xl shadow-[0_0_20px_-3px_rgba(0,176,116,0.4)] transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-body-lg">lock</span>
              <span>Finalizar Matrícula</span>
            </button>

            <div className="flex items-center justify-between text-label-sm text-text-tertiary pt-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-body-sm text-primary">verified_user</span>
                Garantia 7 dias
              </span>
              <button
                onClick={onClearCart}
                className="text-text-tertiary hover:text-text-secondary underline"
              >
                Limpar carrinho
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
