import React, { useState } from 'react';
import { HeroBannerConfig, DEFAULT_HERO_BANNER } from '../../types';

interface HeroBannerManagerTabProps {
  currentConfig?: HeroBannerConfig;
  onSaveConfig: (config: HeroBannerConfig) => void;
}

const PRESET_IMAGES = [
  {
    label: 'Oficial Deds (Profissional com Laptop)',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3RjbhYdYpcG8bEMcRoGanGqik_hu0oU1QgS3ppWFcKR3mWxNyU8UvQOaipy0SDpm3J2adzS1uqX0CplKZPzA35Kzz14SXTCUZrqaPeVovrBKFmxgMJRjmV_sW7q2ELgtX8Fc2SaMedqtrx2AVyk2Bd4oYyB1YfPZ0nJOcUuuEfjwOgTgq3kgUO6q2B997ZgQ-Rh3ZMrOC-DyIA_6qq0v6dqNkbEnzBBQzIUnK7AVkF-bb7wygYDP3PQ',
  },
  {
    label: 'Dev & Engenharia de Software',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Estudos Tech & Inovação',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Carreiras Digitais & Dados',
    url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=800&auto=format&fit=crop&q=80',
  },
];

export const HeroBannerManagerTab: React.FC<HeroBannerManagerTabProps> = ({
  currentConfig = DEFAULT_HERO_BANNER,
  onSaveConfig,
}) => {
  const [config, setConfig] = useState<HeroBannerConfig>(currentConfig);
  const [urlInput, setUrlInput] = useState(currentConfig.imageUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 2MB = 2 * 1024 * 1024 bytes
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
    setConfig(DEFAULT_HERO_BANNER);
    setUrlInput(DEFAULT_HERO_BANNER.imageUrl);
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
              <p className="text-sm font-bold text-text-primary">Banner Publicado com Sucesso!</p>
              <p className="text-xs text-text-secondary">
                A imagem e os selos foram sincronizados e já estão visíveis na página inicial (Home).
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-primary text-black">
            Ao Vivo
          </span>
        </div>
      )}

      {/* Orientações de Especificação Técnica Recomendadas */}
      <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-xl">straighten</span>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Especificações Técnicas Recomendadas para o Banner da Home
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Proporção */}
          <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">aspect_ratio</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-text-tertiary uppercase block">Proporção Ideal</span>
              <span className="text-base font-extrabold text-text-primary block">4:5 (Vertical)</span>
              <span className="text-xs text-text-secondary mt-0.5 block">
                Encaixe perfeito na grade lateral do Hero sem cortes indesejados.
              </span>
            </div>
          </div>

          {/* Card 2: Resolução */}
          <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-accent-emerald-bright/10 text-accent-emerald-bright flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">high_density</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-text-tertiary uppercase block">Resolução Recomendada</span>
              <span className="text-base font-extrabold text-text-primary block">800 x 1000 px</span>
              <span className="text-xs text-text-secondary mt-0.5 block">
                Mínimo de 600 x 750 px para nitidez em telas Retina e 4K.
              </span>
            </div>
          </div>

          {/* Card 3: Formatos e Peso */}
          <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-accent-gold/10 text-accent-gold flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">image</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-text-tertiary uppercase block">Formatos &amp; Peso</span>
              <span className="text-base font-extrabold text-text-primary block">PNG, JPG ou WEBP</span>
              <span className="text-xs text-text-secondary mt-0.5 block">
                Tamanho máximo de 2MB para carregamento ultra-rápido.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Settings on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Seção 1: Upload & Fonte da Imagem */}
          <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">cloud_upload</span>
                1. Upload ou URL da Imagem do Banner
              </h4>
              <span className="text-xs text-text-tertiary">PNG, JPG, WEBP até 2MB</span>
            </div>

            {/* Error Banner if any */}
            {uploadError && (
              <div className="p-3.5 rounded-xl bg-status-danger/15 border border-status-danger/30 text-status-danger text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {uploadError}
              </div>
            )}

            {/* Upload do Computador */}
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
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">upload_file</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-primary block">
                      Clique para selecionar ou arraste uma foto aqui
                    </span>
                    <span className="text-[11px] text-text-tertiary block mt-0.5">
                      Exportação local instantânea com proporção recomendada 4:5
                    </span>
                  </div>
                  {fileDetails && (
                    <div className="mt-1 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">check</span>
                      {fileDetails.name} ({fileDetails.size})
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divisor "OU" */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-[1px] bg-border-subtle" />
              <span className="text-[11px] font-bold uppercase text-text-tertiary">OU insira uma URL direta</span>
              <div className="flex-1 h-[1px] bg-border-subtle" />
            </div>

            {/* URL Direta */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                URL da Imagem Hospedada
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/imagem-banner.jpg"
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
                Presets Rápidos de Demonstração
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setConfig((prev) => ({ ...prev, imageUrl: preset.url }));
                      setUrlInput(preset.url);
                      setFileDetails(null);
                      setUploadError(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                      config.imageUrl === preset.url
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border-subtle bg-surface-overlay/50 text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">photo_library</span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seção 2: Selos & Badges Flutuantes */}
          <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 space-y-5">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">military_tech</span>
              2. Textos dos Badges &amp; Selos Flutuantes da Imagem
            </h4>

            {/* Badge 1: Topo Esquerdo */}
            <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">verified</span>
                <span className="text-xs font-bold text-text-primary uppercase">
                  Badge Superior Esquerdo (Alunos Certificados)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-text-secondary mb-1">Destaque Numérico</label>
                  <input
                    type="text"
                    value={config.badge1Number}
                    onChange={(e) => setConfig({ ...config, badge1Number: e.target.value })}
                    placeholder="+10.000"
                    className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-secondary mb-1">Subtítulo do Badge</label>
                  <input
                    type="text"
                    value={config.badge1Text}
                    onChange={(e) => setConfig({ ...config, badge1Text: e.target.value })}
                    placeholder="Alunos certificados"
                    className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Card Inferior Esquerdo: Trilha & Certificados */}
            <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-emerald-bright text-base">workspace_premium</span>
                <span className="text-xs font-bold text-text-primary uppercase">
                  Card Inferior Esquerdo (Trilha em Destaque)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-text-secondary mb-1">Título do Card</label>
                  <input
                    type="text"
                    value={config.overlayTitle}
                    onChange={(e) => setConfig({ ...config, overlayTitle: e.target.value })}
                    placeholder="Carreiras Tech 2026"
                    className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-secondary mb-1">Subtítulo / Selo</label>
                  <input
                    type="text"
                    value={config.overlaySubtitle}
                    onChange={(e) => setConfig({ ...config, overlaySubtitle: e.target.value })}
                    placeholder="Certificados Verificados"
                    className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Card Inferior Direito: Avaliações */}
            <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-gold text-base">star</span>
                <span className="text-xs font-bold text-text-primary uppercase">
                  Card Inferior Direito (Avaliações dos Alunos)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-text-secondary mb-1">Nota de Avaliação</label>
                  <input
                    type="text"
                    value={config.ratingScore}
                    onChange={(e) => setConfig({ ...config, ratingScore: e.target.value })}
                    placeholder="4.9 / 5.0"
                    className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-secondary mb-1">Contagem de Reviews</label>
                  <input
                    type="text"
                    value={config.reviewsCountText}
                    onChange={(e) => setConfig({ ...config, reviewsCountText: e.target.value })}
                    placeholder="Mais de 12.000 reviews verificadas"
                    className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
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
              <span className="material-symbols-outlined text-lg">publish</span>
              Salvar e Publicar Banner
            </button>
          </div>
        </div>

        {/* Right Column: Live Preview of Hero Card on Home (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">visibility</span>
              Pré-visualização em Tempo Real na Home
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
              Visualização 4:5
            </span>
          </div>

          {/* Preview Container simulating the Hero stage */}
          <div className="p-6 rounded-3xl bg-[#0B0F17] border border-border-subtle flex flex-col items-center justify-center relative shadow-inner min-h-[480px]">
            {/* Visual stage card */}
            <div className="relative w-full max-w-[320px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl bg-surface-raised border border-border-subtle">
              <img
                src={config.imageUrl}
                alt="Prévia do Banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_HERO_BANNER.imageUrl;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/30 to-transparent pointer-events-none" />

              {/* Overlay card at bottom */}
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-surface-overlay/90 backdrop-blur-md flex items-center justify-between border border-border-subtle/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-base">workspace_premium</span>
                  </div>
                  <div>
                    <div className="font-headline-sm text-xs font-bold text-text-primary leading-tight">
                      {config.overlayTitle || 'Carreiras Tech 2026'}
                    </div>
                    <div className="font-body-sm text-[10px] text-accent-emerald-bright font-medium">
                      {config.overlaySubtitle || 'Certificados Verificados'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-accent-gold text-xs font-bold">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="ml-1 text-text-primary font-bold">
                    {config.ratingScore.includes('/') ? config.ratingScore.split('/')[0].trim() : config.ratingScore}
                  </span>
                </div>
              </div>

              {/* Floating Metric Badge 1 (Top Left) */}
              <div className="absolute top-3 left-3 p-2 rounded-xl bg-surface-overlay/95 backdrop-blur-md shadow-xl flex items-center gap-2 border border-border-subtle">
                <div className="w-7 h-7 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">verified</span>
                </div>
                <div>
                  <span className="block font-headline-sm text-xs text-text-primary font-bold leading-none">
                    {config.badge1Number || '+10.000'}
                  </span>
                  <span className="font-label-sm text-[9px] text-text-secondary">
                    {config.badge1Text || 'Alunos certificados'}
                  </span>
                </div>
              </div>

              {/* Floating Metric Badge 2 (Bottom Right) */}
              <div className="absolute -bottom-2 -right-2 p-2.5 rounded-xl bg-surface-raised shadow-2xl flex flex-col gap-1 max-w-[170px] border border-border-subtle z-10 scale-90">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary">Avaliações</span>
                  <div className="flex text-accent-gold text-[10px]">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs font-bold text-text-primary">{config.ratingScore || '4.9 / 5.0'}</div>
                <div className="text-[9px] text-text-tertiary truncate">
                  {config.reviewsCountText || 'Mais de 12.000 reviews'}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-text-tertiary text-center mt-6 max-w-xs">
              Assim que você clicar em <strong className="text-primary font-bold">"Salvar e Publicar Banner"</strong>, a
              Home refletirá exatamente estas alterações.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
