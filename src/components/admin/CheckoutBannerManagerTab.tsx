import React, { useState } from 'react';
import { CheckoutPaymentBannerConfig, DEFAULT_CHECKOUT_PAYMENT_BANNER } from '../../types';
import { optimizeImageFile } from '../../lib/imageOptimizer';

interface CheckoutBannerManagerTabProps {
  currentConfig?: CheckoutPaymentBannerConfig;
  onSaveConfig: (config: CheckoutPaymentBannerConfig) => void;
}

const PRESET_PAYMENT_BANNERS = [
  {
    label: 'Segurança & Cartões Stripe (Moderno)',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
    alt: 'Ambiente Seguro Stripe Checkout - Deds Academy',
  },
  {
    label: 'Tecnologia & Pagamentos Digitais',
    url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&auto=format&fit=crop&q=80',
    alt: 'Processamento Seguro com Criptografia SSL - Deds Academy',
  },
  {
    label: 'Educação & Checkout Rápido',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80',
    alt: 'Liberação Imediata de Acesso e Certificado Oficial',
  },
];

export const CheckoutBannerManagerTab: React.FC<CheckoutBannerManagerTabProps> = ({
  currentConfig = DEFAULT_CHECKOUT_PAYMENT_BANNER,
  onSaveConfig,
}) => {
  const [config, setConfig] = useState<CheckoutPaymentBannerConfig>(currentConfig);
  const [urlInput, setUrlInput] = useState(currentConfig.imageUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Formato inválido! Envie uma imagem válida (PNG, JPG ou WEBP).');
      return;
    }

    try {
      setIsProcessingImage(true);
      setUploadError(null);
      const optimized = await optimizeImageFile(file, {
        maxWidth: 1400,
        maxHeight: 700,
        quality: 0.85,
      });

      setConfig((prev) => ({ ...prev, imageUrl: optimized.dataUrl }));
      setUrlInput('');
      setFileDetails({
        name: optimized.name,
        size: `${optimized.sizeKb} KB (Otimizado)`,
      });
    } catch (err: any) {
      setUploadError(err?.message || 'Erro ao processar imagem.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setUploadError(null);
    setFileDetails(null);
    setConfig((prev) => ({ ...prev, imageUrl: urlInput.trim() }));
  };

  const handleSave = () => {
    onSaveConfig(config);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
    }, 4000);
  };

  const handleResetToDefault = () => {
    setConfig(DEFAULT_CHECKOUT_PAYMENT_BANNER);
    setUrlInput(DEFAULT_CHECKOUT_PAYMENT_BANNER.imageUrl);
    setFileDetails(null);
    setUploadError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Info Banner */}
      <div className="bg-surface-raised p-5 rounded-2xl border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-2xl">credit_card</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span>Gestão do Banner de Pagamentos (Checkout)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                Página de Pagamento
              </span>
            </h3>
            <p className="text-xs text-text-tertiary mt-1 leading-relaxed">
              Configure a imagem exibida no bloco de pagamento do carrinho. O upload feito aqui é sincronizado diretamente com a tela de checkout do aluno.
            </p>
          </div>
        </div>
      </div>

      {savedFeedback && (
        <div className="p-4 rounded-xl bg-accent-emerald-bright/15 border border-accent-emerald-bright/30 text-accent-emerald-bright flex items-center justify-between text-xs font-bold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>Banner de Pagamentos salvo e atualizado com sucesso no carrinho!</span>
          </div>
        </div>
      )}

      {/* Main Grid: Settings & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & Options (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card: Status & Visibility */}
          <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div>
                <h4 className="text-sm font-bold text-text-primary">Visibilidade do Banner no Checkout</h4>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Ative ou oculte o banner na página de carrinho do aluno
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-overlay peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Upload Area */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-text-secondary">
                Upload de Imagem (Do seu Computador)
              </label>

              <div className="border-2 border-dashed border-border-subtle hover:border-primary/50 transition-colors rounded-2xl p-6 text-center bg-surface-overlay/50 cursor-pointer relative group">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary">
                      Clique para selecionar ou arraste a imagem aqui
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      Formatos recomendados: PNG, JPG ou WEBP (Máx. 2MB)
                    </p>
                  </div>
                </div>
              </div>

              {fileDetails && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-overlay text-xs text-text-secondary border border-border-subtle">
                  <span className="truncate max-w-[250px] font-medium">{fileDetails.name}</span>
                  <span className="text-text-tertiary font-mono">{fileDetails.size}</span>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-status-danger font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{uploadError}</span>
                </p>
              )}
            </div>

            {/* Image URL Alternative */}
            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <label className="block text-xs font-bold text-text-secondary">
                Ou informe uma URL externa de imagem
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/banner-pagamento.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-surface-overlay text-text-primary px-3 py-2 text-xs rounded-xl border border-border-subtle focus:border-primary outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary transition-colors cursor-pointer"
                >
                  Aplicar URL
                </button>
              </div>
            </div>

            {/* Alt text field */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-text-secondary">
                Texto Alternativo (Acessibilidade e SEO)
              </label>
              <input
                type="text"
                value={config.altText}
                onChange={(e) => setConfig((prev) => ({ ...prev, altText: e.target.value }))}
                placeholder="Ex: Banner Oficial de Pagamentos e Checkout Seguro"
                className="w-full bg-surface-overlay text-text-primary px-3 py-2 text-xs rounded-xl border border-border-subtle focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Preset Banners */}
          <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-text-primary">Banners Pré-definidos de Pagamento</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESET_PAYMENT_BANNERS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({
                      ...prev,
                      imageUrl: preset.url,
                      altText: preset.alt,
                    }));
                    setUrlInput(preset.url);
                    setFileDetails(null);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                    config.imageUrl === preset.url
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border-subtle bg-surface-overlay hover:border-primary/40'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.alt}
                    className="w-full h-16 object-cover rounded-lg"
                  />
                  <span className="text-[11px] font-bold text-text-primary line-clamp-1">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Bar (Único botão oficial de salvar do banner) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border-subtle hover:bg-surface-raised text-text-tertiary hover:text-text-primary text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              Restaurar Padrão
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessingImage}
              className="w-full sm:w-auto px-6 py-3 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-sm font-bold rounded-xl shadow-lg transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              Salvar Banner de Pagamento
            </button>
          </div>
        </div>

        {/* Right Column: Live Checkout Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">visibility</span>
                <span>Prévia ao Vivo no Carrinho</span>
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                config.enabled ? 'bg-accent-emerald-bright/20 text-accent-emerald-bright' : 'bg-surface-overlay text-text-tertiary'
              }`}>
                {config.enabled ? 'Ativo' : 'Oculto'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle space-y-3">
              <p className="text-xs font-bold text-text-secondary">Simulação da Seção de Pagamento:</p>

              {config.imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border-subtle shadow-md">
                  <img
                    src={config.imageUrl}
                    alt={config.altText}
                    className="w-full max-h-48 object-cover"
                  />
                  {!config.enabled && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center text-text-tertiary text-xs font-bold">
                      Banner Desativado
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-32 rounded-xl bg-surface-base border border-dashed border-border-subtle flex items-center justify-center text-text-tertiary text-xs">
                  Nenhuma imagem carregada
                </div>
              )}

              {/* Stripe option pill */}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-text-primary text-[12px]">
                  <span className="material-symbols-outlined text-primary text-sm">credit_card</span>
                  <span>Seleção de cartão de crédito Stripe Checkout</span>
                </div>
                <p className="text-[11px] text-text-tertiary mt-1">
                  Ambiente oficial e seguro gerenciado pela Stripe.
                </p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-text-tertiary">
                As alterações salvas no formulário ao lado são aplicadas imediatamente ao checkout.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
