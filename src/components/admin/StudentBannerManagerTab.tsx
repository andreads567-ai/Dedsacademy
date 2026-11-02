import React, { useState } from 'react';
import { StudentBannersConfig, StudentBannerItem, DEFAULT_STUDENT_BANNERS_CONFIG } from '../../types';
import { optimizeImageFile } from '../../lib/imageOptimizer';
import { uploadImageToServer } from '../../lib/platformSyncClient';

interface StudentBannerManagerTabProps {
  currentConfig?: StudentBannersConfig;
  onSaveConfig: (config: StudentBannersConfig) => void;
}

const PRESET_STUDENT_BANNERS = [
  {
    label: 'Carreira & Tecnologia',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&auto=format&fit=crop&q=80',
    title: 'Acelere sua Carreira com Formações Práticas e Certificadas',
  },
  {
    label: 'Certificação & Lei 9.394/96',
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&auto=format&fit=crop&q=80',
    title: 'Certificados Válidos em Todo o Território Nacional',
  },
  {
    label: 'Horas Extracurriculares',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1400&auto=format&fit=crop&q=80',
    title: 'Comprove Carga Horária e Horas Complementares na sua Faculdade',
  },
  {
    label: 'Comunidade & Networking',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1400&auto=format&fit=crop&q=80',
    title: 'Faça Networking com Estudantes e Profissionais do Mercado',
  },
  {
    label: 'Laboratório Prático',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1400&auto=format&fit=crop&q=80',
    title: 'Projetos Práticos para enriquecer seu Portfólio Profissional',
  },
  {
    label: 'Novas Matrículas & Descontos',
    url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1400&auto=format&fit=crop&q=80',
    title: 'Aproveite Condições Especiais para Matrículas em Novos Cursos',
  },
];

export const StudentBannerManagerTab: React.FC<StudentBannerManagerTabProps> = ({
  currentConfig = DEFAULT_STUDENT_BANNERS_CONFIG,
  onSaveConfig,
}) => {
  const [config, setConfig] = useState<StudentBannersConfig>(() => {
    // Garante que existam exatamente 6 posições (1 a 6)
    const banners: StudentBannerItem[] = [];
    for (let pos = 1; pos <= 6; pos++) {
      const found = currentConfig.banners?.find((b) => b.position === pos);
      if (found) {
        banners.push({ ...found });
      } else {
        banners.push({
          id: `student-banner-${pos}`,
          position: pos,
          imageUrl: '',
          title: `Banner ${pos}`,
          linkUrl: '',
          enabled: false,
        });
      }
    }
    return {
      enabled: currentConfig.enabled !== undefined ? currentConfig.enabled : true,
      intervalSeconds: currentConfig.intervalSeconds || 5,
      banners,
    };
  });

  const [uploadingPos, setUploadingPos] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);

  const activeBanners = config.banners.filter((b) => b.enabled && b.imageUrl.trim().length > 0);

  const handleUpdateItem = (position: number, partial: Partial<StudentBannerItem>) => {
    setConfig((prev) => ({
      ...prev,
      banners: prev.banners.map((b) => (b.position === position ? { ...b, ...partial } : b)),
    }));
  };

  const handleFileUpload = async (position: number, file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Formato inválido! Envie uma imagem válida (PNG, JPG, WEBP).');
      return;
    }

    try {
      setUploadingPos(position);
      setUploadError(null);
      const optimized = await optimizeImageFile(file, {
        maxWidth: 1600,
        maxHeight: 600,
        quality: 0.88,
      });

      const serverUrl = await uploadImageToServer(optimized.dataUrl, `student-banner-${position}`);
      handleUpdateItem(position, {
        imageUrl: serverUrl,
        enabled: true,
      });
    } catch (err: any) {
      setUploadError(err?.message || 'Erro ao processar imagem.');
    } finally {
      setUploadingPos(null);
    }
  };

  const handleClearBanner = (position: number) => {
    handleUpdateItem(position, {
      imageUrl: '',
      title: `Banner ${position}`,
      linkUrl: '',
      enabled: false,
    });
  };

  const handleSave = () => {
    onSaveConfig(config);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Info Banner */}
      <div className="bg-surface-raised p-5 rounded-2xl border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-2xl">view_carousel</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text-primary">
                Banner Painel do Aluno (Carrossel Retangular)
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  config.enabled && activeBanners.length > 0
                    ? 'bg-accent-emerald-bright/20 text-accent-emerald-bright border-accent-emerald-bright/30'
                    : 'bg-surface-overlay text-text-tertiary border-border-subtle'
                }`}
              >
                {config.enabled ? `${activeBanners.length} de 6 Ativos` : 'Carrossel Oculto'}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1 max-w-2xl">
              Cadastre e organize até 6 banners retangulares exibidos abaixo do nome do aluno na Área do Aluno.
              Cada banner possui ordenação sequencial de 1 a 6 com upload manual independente e transição automática com pausa por clique.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-accent-emerald-bright text-on-primary text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>Salvar Banners do Aluno</span>
          </button>
        </div>
      </div>

      {savedFeedback && (
        <div className="p-3.5 rounded-xl bg-accent-emerald-bright/15 border border-accent-emerald-bright/30 text-accent-emerald-bright text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>Banners do Painel do Aluno salvos e sincronizados com sucesso em tempo real!</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-status-danger/15 border border-status-danger/30 text-status-danger text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{uploadError}</span>
        </div>
      )}

      {/* General Controls Card */}
      <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
        {/* Toggle master */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-overlay border border-border-subtle">
          <div>
            <h4 className="text-xs font-bold text-text-primary">Status Geral do Carrossel</h4>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              Se desativado ou sem imagens cadastradas, o carrossel será ocultado no painel do aluno.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
              config.enabled ? 'bg-primary' : 'bg-surface-raised border border-border-subtle'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                config.enabled ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Transition Interval */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-overlay border border-border-subtle gap-4">
          <div>
            <h4 className="text-xs font-bold text-text-primary">Temporizador de Transição</h4>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              Intervalo em segundos para rotação automática dos banners.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={config.intervalSeconds}
              onChange={(e) => setConfig((prev) => ({ ...prev, intervalSeconds: Number(e.target.value) }))}
              className="px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-xl text-xs font-bold text-text-primary outline-none focus:border-primary cursor-pointer"
            >
              <option value={3}>3 segundos (Rápido)</option>
              <option value={5}>5 segundos (Recomendado)</option>
              <option value={7}>7 segundos</option>
              <option value={10}>10 segundos</option>
              <option value={15}>15 segundos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of 6 Sequential Banners */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">format_list_numbered</span>
            Posições Sequenciais de Banners (1 a 6)
          </h3>
          <span className="text-xs text-text-tertiary">
            Formatos recomendados: retangular panorâmico (1200x350 a 1600x500 px)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.banners.map((banner) => {
            const hasImage = Boolean(banner.imageUrl && banner.imageUrl.trim());
            const isUploading = uploadingPos === banner.position;

            return (
              <div
                key={banner.position}
                className={`p-4 rounded-2xl bg-surface-raised border transition-all flex flex-col justify-between ${
                  banner.enabled && hasImage
                    ? 'border-primary/40 shadow-sm'
                    : 'border-border-subtle opacity-90'
                }`}
              >
                {/* Header da Posição */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary border border-primary/30 flex items-center justify-center text-xs font-black">
                        {banner.position}
                      </span>
                      <span className="text-xs font-bold text-text-primary">
                        Posição #{banner.position}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          banner.enabled && hasImage
                            ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright border-accent-emerald-bright/30'
                            : 'bg-surface-overlay text-text-tertiary border-border-subtle'
                        }`}
                      >
                        {banner.enabled && hasImage ? 'Ativo' : 'Inativo'}
                      </span>

                      {/* Switch ativação individual */}
                      <button
                        type="button"
                        disabled={!hasImage}
                        onClick={() => handleUpdateItem(banner.position, { enabled: !banner.enabled })}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${
                          banner.enabled && hasImage ? 'bg-primary' : 'bg-surface-overlay border border-border-subtle'
                        }`}
                        title={hasImage ? 'Ativar ou desativar este banner' : 'Faça upload de uma imagem primeiro'}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                            banner.enabled && hasImage ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Preview da Imagem Retangular */}
                  <div className="relative aspect-[16/6] w-full rounded-xl bg-surface-overlay border border-border-subtle overflow-hidden mb-3 group/preview">
                    {hasImage ? (
                      <>
                        <img
                          src={banner.imageUrl}
                          alt={banner.title || `Banner ${banner.position}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                          <p className="text-[11px] font-semibold text-white truncate w-full">
                            {banner.title || `Banner #${banner.position}`}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-text-tertiary p-3 text-center">
                        <span className="material-symbols-outlined text-2xl text-text-tertiary/50">
                          add_photo_alternate
                        </span>
                        <span className="text-[11px] font-medium">Posição {banner.position} Vazia</span>
                      </div>
                    )}

                    {isUploading && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white text-xs font-bold">
                        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Enviando...</span>
                      </div>
                    )}
                  </div>

                  {/* Campos de Configuração */}
                  <div className="space-y-2 mb-3">
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                        Título / Legenda (Opcional)
                      </label>
                      <input
                        type="text"
                        value={banner.title || ''}
                        onChange={(e) => handleUpdateItem(banner.position, { title: e.target.value })}
                        placeholder={`Ex: Novidade ou Comunicado ${banner.position}`}
                        className="w-full px-3 py-1.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                        Link de Destino ao Clicar (Opcional)
                      </label>
                      <input
                        type="text"
                        value={banner.linkUrl || ''}
                        onChange={(e) => handleUpdateItem(banner.position, { linkUrl: e.target.value })}
                        placeholder="Ex: #cursos-section ou https://..."
                        className="w-full px-3 py-1.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                        URL da Imagem Direta
                      </label>
                      <input
                        type="url"
                        value={banner.imageUrl || ''}
                        onChange={(e) =>
                          handleUpdateItem(banner.position, {
                            imageUrl: e.target.value,
                            enabled: Boolean(e.target.value.trim()),
                          })
                        }
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Ações: Upload Manual e Limpar */}
                <div className="pt-2 border-t border-border-subtle flex items-center justify-between gap-2">
                  <label className="flex-1 py-2 px-3 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <span className="material-symbols-outlined text-base">cloud_upload</span>
                    <span>Upload Manual</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(banner.position, file);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  {hasImage && (
                    <button
                      type="button"
                      onClick={() => handleClearBanner(banner.position)}
                      className="p-2 rounded-xl text-text-tertiary hover:text-status-danger hover:bg-status-danger/10 transition-colors cursor-pointer"
                      title="Limpar imagem desta posição"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preset Inspirations / Rápido preenchimento */}
      <div className="p-4 rounded-2xl bg-surface-raised border border-border-subtle space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">auto_fix_high</span>
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Modelos de Banner Prontos para Teste
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PRESET_STUDENT_BANNERS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                const targetPos = (idx % 6) + 1;
                handleUpdateItem(targetPos, {
                  imageUrl: preset.url,
                  title: preset.title,
                  linkUrl: '#cursos-section',
                  enabled: true,
                });
              }}
              className="p-2 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-left transition-all cursor-pointer group"
              title={`Aplicar na Posição ${(idx % 6) + 1}`}
            >
              <div className="aspect-[16/7] rounded-lg overflow-hidden mb-1.5 bg-black/40">
                <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <p className="text-[11px] font-bold text-text-primary truncate">{preset.label}</p>
              <span className="text-[10px] text-primary block mt-0.5">Aplicar na Pos {(idx % 6) + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview Box */}
      {config.enabled && activeBanners.length > 0 && (
        <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">preview</span>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Pré-visualização ao Vivo do Carrossel Retangular (Área do Aluno)
              </h4>
            </div>
            <span className="text-xs text-text-tertiary">
              Slide {previewSlide + 1} de {activeBanners.length}
            </span>
          </div>

          <div className="relative aspect-[21/6] max-h-48 w-full rounded-2xl overflow-hidden border border-border-subtle shadow-lg bg-surface-overlay">
            {activeBanners.map((banner, index) => (
              <div
                key={banner.id || banner.position}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === (previewSlide % activeBanners.length) ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title || `Banner ${banner.position}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-4">
                  <div className="max-w-xl">
                    <h5 className="text-sm font-bold text-white leading-tight">
                      {banner.title || `Banner Oficial do Aluno #${banner.position}`}
                    </h5>
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation Dots in Preview */}
            <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5">
              {activeBanners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPreviewSlide(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === (previewSlide % activeBanners.length) ? 'w-6 bg-primary' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
