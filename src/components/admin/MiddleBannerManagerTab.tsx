import React, { useState } from 'react';
import { MiddlePromoBannerConfig, DEFAULT_MIDDLE_PROMO_BANNER } from '../../types';

interface MiddleBannerManagerTabProps {
  currentConfig?: MiddlePromoBannerConfig;
  onSaveConfig: (config: MiddlePromoBannerConfig) => void;
}

const PRESET_HORIZONTAL_BANNERS = [
  {
    label: 'Tecnologia & Programação (Promo Geral)',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&auto=format&fit=crop&q=80',
    alt: 'Promoção de Cursos de Tecnologia com Certificado Válido',
    link: '#courses-section',
  },
  {
    label: 'Produtividade & Excel Avançado',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&auto=format&fit=crop&q=80',
    alt: 'Especialize-se em Dashboards e Automação no Excel',
    link: '/curso/excel-avancado',
  },
  {
    label: 'Inteligência Artificial & Python',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&auto=format&fit=crop&q=80',
    alt: 'Formação em Python e Inteligência Artificial',
    link: '/curso/python-zero-avancado',
  },
  {
    label: 'Gestão Ágil & Liderança',
    url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&auto=format&fit=crop&q=80',
    alt: 'Acelere sua Carreira em Gestão e Liderança',
    link: '#courses-section',
  },
];

export const MiddleBannerManagerTab: React.FC<MiddleBannerManagerTabProps> = ({
  currentConfig = DEFAULT_MIDDLE_PROMO_BANNER,
  onSaveConfig,
}) => {
  const [config, setConfig] = useState<MiddlePromoBannerConfig>(currentConfig);
  const [urlInput, setUrlInput] = useState(currentConfig.imageUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('O arquivo excede o limite máximo permitido de 2MB. Por favor, otimize a imagem.');
      return;
    }

    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      setUploadError('Formato inválido! Envie uma imagem nos formatos PNG, JPG ou WEBP.');
      return;
    }

    setUploadError(null);
    const sizeInKb = (file.size / 1024).toFixed(1);
    setFileDetails({
      name: file.name,
      size: `${sizeInKb} KB`,
    });

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (dataUrl) {
        setConfig((prev) => ({ ...prev, imageUrl: dataUrl }));
        setUrlInput('');
      }
    };
    reader.readAsDataURL(file);
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
    setConfig(DEFAULT_MIDDLE_PROMO_BANNER);
    setUrlInput(DEFAULT_MIDDLE_PROMO_BANNER.imageUrl);
    setFileDetails(null);
    setUploadError(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Feedback Toast */}
      {savedFeedback && (
        <div className="p-4 rounded-xl bg-primary/20 border border-primary text-text-primary flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
            <div>
              <p className="text-sm font-bold text-text-primary">Banner Faixa Salvo com Sucesso!</p>
              <p className="text-xs text-text-secondary">
                {config.enabled
                  ? 'O banner retangular intermediário está ativo e atualizado na Home.'
                  : 'O banner retangular intermediário foi desativado e o espaço na Home foi recolhido.'}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold ${
              config.enabled ? 'bg-primary text-black' : 'bg-surface-overlay text-text-tertiary'
            }`}
          >
            {config.enabled ? 'Ativo na Home' : 'Desativado'}
          </span>
        </div>
      )}

      {/* Especificações Visuais Recomendadas */}
      <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-xl">view_agenda</span>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Especificações Técnicas Recomendadas (Banner Faixa Intermediário)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Formato */}
          <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">aspect_ratio</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-text-tertiary uppercase block">Formato</span>
              <span className="text-sm font-extrabold text-text-primary block">Retangular / Horizontal</span>
              <span className="text-xs text-text-secondary mt-0.5 block">
                Faixa promocional de meio de página (Lead Banner).
              </span>
            </div>
          </div>

          {/* Card 2: Proporção */}
          <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-accent-emerald-bright/10 text-accent-emerald-bright flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">straighten</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-text-tertiary uppercase block">Proporção Ideal</span>
              <span className="text-sm font-extrabold text-text-primary block">12:3 ou 4:1</span>
              <span className="text-xs text-text-secondary mt-0.5 block">
                Mantém excelente leitura visual em desktop e mobile.
              </span>
            </div>
          </div>

          {/* Card 3: Resolução */}
          <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-accent-gold/10 text-accent-gold flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">high_density</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-text-tertiary uppercase block">Resolução Recomendada</span>
              <span className="text-sm font-extrabold text-text-primary block">1200 x 300 px</span>
              <span className="text-xs text-text-secondary mt-0.5 block">
                Ou 1920 x 480 px para telas ultra-wide e monitores 4K.
              </span>
            </div>
          </div>

          {/* Card 4: Formatos e Peso */}
          <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">image</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-text-tertiary uppercase block">Formatos &amp; Peso</span>
              <span className="text-sm font-extrabold text-text-primary block">PNG, JPG ou WEBP</span>
              <span className="text-xs text-text-secondary mt-0.5 block">
                Até 2MB para garantir carregamento instantâneo.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Switch: Ativar / Desativar */}
          <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    config.enabled ? 'bg-accent-emerald-bright animate-pulse' : 'bg-text-tertiary'
                  }`}
                />
                <h4 className="text-sm font-bold text-text-primary">
                  Status de Exibição na Página Home
                </h4>
              </div>
              <p className="text-xs text-text-secondary">
                {config.enabled
                  ? 'O banner está visível na Home entre os cards de benefícios e os Cursos em Destaque.'
                  : 'O banner está desativado. O espaço na Home está oculto para não deixar espaço vazio.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.enabled ? 'bg-primary' : 'bg-surface-overlay border-border-subtle'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-surface-container-lowest shadow-lg ring-0 transition duration-200 ease-in-out ${
                  config.enabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Seção de Upload & Imagem */}
          <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">cloud_upload</span>
                Upload ou URL da Faixa Horizontal
              </h4>
              <span className="text-xs text-text-tertiary">PNG, JPG, WEBP (máx. 2MB)</span>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-xl bg-status-danger/15 border border-status-danger/30 text-status-danger text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {uploadError}
              </div>
            )}

            {/* Upload do computador */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                Enviar Arquivo Local do Computador
              </label>
              <div className="relative border-2 border-dashed border-border-subtle hover:border-primary/50 transition-colors rounded-2xl p-5 text-center bg-surface-overlay/50 cursor-pointer group">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 text-primary flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-2xl">file_upload</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary">
                      Clique para navegar ou arraste a imagem retangular
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      Dimensões sugeridas: 1200 x 300 px (Proporção ~4:1)
                    </p>
                  </div>
                  {fileDetails && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold">
                      <span className="material-symbols-outlined text-sm">attachment</span>
                      <span>{fileDetails.name}</span>
                      <span className="text-text-tertiary font-normal">({fileDetails.size})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inserir URL Direta */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Ou Inserir URL Direta da Imagem
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://sua-empresa.com/banner-promocional.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary placeholder:text-text-tertiary"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2.5 bg-surface-overlay hover:bg-surface-container-high border border-border-subtle text-text-primary text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  Aplicar URL
                </button>
              </div>
            </div>

            {/* Presets Rápidos */}
            <div>
              <span className="block text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
                Exemplos / Presets Rápidos
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_HORIZONTAL_BANNERS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({
                        ...prev,
                        imageUrl: preset.url,
                        altText: preset.alt,
                        targetUrl: preset.link,
                      }));
                      setUrlInput(preset.url);
                      setFileDetails(null);
                      setUploadError(null);
                    }}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2.5 ${
                      config.imageUrl === preset.url
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border-subtle bg-surface-overlay/50 text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">view_carousel</span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Links e Acessibilidade */}
          <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 space-y-4">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">link</span>
              Link de Destino &amp; Acessibilidade
            </h4>

            {/* Link de Destino */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Link de Destino ao Clicar no Banner <span className="text-status-danger">*</span>
              </label>
              <input
                type="text"
                value={config.targetUrl}
                onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
                placeholder="Ex: #courses-section, /curso/excel-avancado ou https://..."
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
              />
              <p className="text-[11px] text-text-tertiary mt-1">
                Dica: Use <strong>#courses-section</strong> para rolar até os cursos, ou insira um identificador de curso como <strong>/curso/excel-avancado</strong>.
              </p>
            </div>

            {/* Texto Alternativo (Alt Text) */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Texto Alternativo (SEO &amp; Acessibilidade) <span className="text-status-danger">*</span>
              </label>
              <input
                type="text"
                value={config.altText}
                onChange={(e) => setConfig({ ...config, altText: e.target.value })}
                placeholder="Ex: Oferta de Cursos de Tecnologia com Certificado Válido"
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
              />
              <p className="text-[11px] text-text-tertiary mt-1">
                Importante para leitores de tela e indexação nos mecanismos de busca do Google.
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
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
              className="w-full sm:w-auto px-6 py-3 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-sm font-bold rounded-xl shadow-lg transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              Salvar Banner Faixa
            </button>
          </div>
        </div>

        {/* Right Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">visibility</span>
              Prévia do Banner na Home
            </h4>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                config.enabled
                  ? 'bg-accent-emerald-bright/20 text-accent-emerald-bright border border-accent-emerald-bright/30'
                  : 'bg-surface-overlay text-text-tertiary'
              }`}
            >
              {config.enabled ? 'Ativado na Home' : 'Oculto na Home'}
            </span>
          </div>

          {/* Container simulando a posição na Home */}
          <div className="p-6 rounded-3xl bg-[#0B0F17] border border-border-subtle space-y-4 shadow-inner">
            <div className="text-[11px] text-text-tertiary uppercase font-bold tracking-wider flex items-center justify-between border-b border-border-subtle/50 pb-2">
              <span>Simulação de Navegação</span>
              <span className="text-[10px] text-text-secondary font-normal">
                Clique no banner para testar o direcionamento
              </span>
            </div>

            {config.enabled ? (
              <div className="space-y-2">
                <a
                  href={config.targetUrl || '#'}
                  target={config.targetUrl?.startsWith('http') ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="group block relative w-full aspect-[4/1] sm:aspect-[12/3] rounded-2xl overflow-hidden shadow-2xl border border-border-subtle hover:border-primary/60 transition-all cursor-pointer"
                >
                  <img
                    src={config.imageUrl}
                    alt={config.altText}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_MIDDLE_PROMO_BANNER.imageUrl;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                    <div className="max-w-[70%]">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-primary text-black mb-1">
                        Destaque Promocional
                      </span>
                      <p className="text-white text-xs sm:text-sm font-extrabold line-clamp-2 drop-shadow-md">
                        {config.altText}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-black transition-colors">
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </div>
                  </div>
                </a>
                <div className="flex items-center justify-between text-[11px] text-text-tertiary px-1">
                  <span>Destino: <strong>{config.targetUrl || '(não informado)'}</strong></span>
                  <span className="text-accent-emerald-bright font-semibold">Banner 100% Responsivo</span>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl border-2 border-dashed border-border-subtle text-center space-y-2">
                <span className="material-symbols-outlined text-text-tertiary text-3xl">visibility_off</span>
                <p className="text-xs font-bold text-text-secondary">Banner Desativado</p>
                <p className="text-[11px] text-text-tertiary max-w-xs mx-auto">
                  Quando desativado, o banner e seu espaço são completamente recolhidos na Home para manter o layout limpo e sem lacunas.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
