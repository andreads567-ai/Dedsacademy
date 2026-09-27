import React from 'react';

interface CertificateSectionProps {
  onOpenCertificateModal: () => void;
}

export const CertificateSection: React.FC<CertificateSectionProps> = ({
  onOpenCertificateModal,
}) => {
  return (
    <section id="certificados-section" className="w-full py-16 lg:py-20 bg-surface-container-lowest relative overflow-hidden">
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop">
        <div className="p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-surface-raised via-surface-container to-surface-base shadow-2xl relative overflow-hidden border border-border-subtle">
          {/* Subtle background decorative seal */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-primary/5 pointer-events-none blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Text and Credentials */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-overlay self-start">
                <span className="material-symbols-outlined text-accent-gold text-body-lg">verified</span>
                <span className="font-label-md text-label-md text-text-primary font-semibold">
                  Credenciamento Nacional
                </span>
              </div>

              <h2 className="font-headline-lg text-headline-lg font-extrabold text-text-primary leading-tight">
                Certificado com Validade Legal em Todo o Território Nacional
              </h2>

              <p className="font-body-md text-body-md text-text-secondary leading-relaxed">
                Nossos certificados digitais possuem chancela legal em conformidade com a <strong>Lei Federal nº 9.394/96</strong> e Decreto Presidencial nº 5.154/04. Conte com código de verificação autenticado e QR Code instantâneo para enriquecer seu currículo e comprovar horas extracurriculares.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 text-text-primary font-body-md text-body-md">
                  <span className="material-symbols-outlined text-accent-emerald-bright">check_circle</span>
                  <span>Código de autenticidade único</span>
                </div>
                <div className="flex items-center gap-2.5 text-text-primary font-body-md text-body-md">
                  <span className="material-symbols-outlined text-accent-emerald-bright">check_circle</span>
                  <span>Aceito em Universidades e Concursos</span>
                </div>
                <div className="flex items-center gap-2.5 text-text-primary font-body-md text-body-md">
                  <span className="material-symbols-outlined text-accent-emerald-bright">check_circle</span>
                  <span>Download em PDF de alta resolução</span>
                </div>
                <div className="flex items-center gap-2.5 text-text-primary font-body-md text-body-md">
                  <span className="material-symbols-outlined text-accent-emerald-bright">check_circle</span>
                  <span>Integração direta com LinkedIn</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onOpenCertificateModal}
                  className="px-6 py-3 rounded-lg bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-label-lg text-label-lg font-bold shadow-[0_0_20px_-3px_rgba(0,176,116,0.35)] transition-all cursor-pointer active:scale-95"
                >
                  Conheça nossos certificados
                </button>
                <button
                  type="button"
                  onClick={onOpenCertificateModal}
                  className="px-6 py-3 rounded-lg bg-surface-overlay hover:bg-surface-container-high text-text-primary font-label-lg text-label-lg transition-colors flex items-center gap-2 cursor-pointer border border-border-subtle"
                >
                  <span className="material-symbols-outlined text-body-lg">qr_code_scanner</span>
                  <span>Validar documento</span>
                </button>
              </div>
            </div>

            {/* Certificate Graphic Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div
                onClick={onOpenCertificateModal}
                className="relative w-full max-w-sm rounded-xl p-5 bg-surface-overlay shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300 border border-border-subtle hover:border-primary/40 cursor-pointer group"
                title="Clique para visualizar e validar este certificado oficial"
              >
                {/* Golden Certificate Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm">
                      DA
                    </div>
                    <span className="font-headline-sm text-label-md font-bold text-text-primary">
                      Deds Academy
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-accent-gold">
                    <span className="material-symbols-outlined text-headline-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      military_tech
                    </span>
                    <span className="font-label-sm text-label-sm font-bold">Oficial</span>
                  </div>
                </div>

                <div className="py-5 text-center">
                  <span className="font-label-sm text-label-sm text-text-tertiary uppercase tracking-widest block">
                    Certificado de Conclusão
                  </span>
                  <p className="font-headline-sm text-headline-sm font-bold text-text-primary mt-2">
                    Lucas M. Silveira
                  </p>
                  <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                    Concluiu com excelência o curso avançado de <strong>Inteligência Artificial & Machine Learning</strong>
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between font-body-sm text-body-sm text-text-tertiary border-t border-border-subtle">
                  <div className="flex flex-col text-left">
                    <span className="text-text-primary font-bold">Carga: 60 Horas</span>
                    <span className="font-label-sm text-label-sm text-text-tertiary font-mono">
                      Reg: #DA-2025-99841
                    </span>
                  </div>

                  {/* Mini QR Representation */}
                  <div className="w-10 h-10 bg-text-primary rounded p-1 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <div className="w-8 h-8 grid grid-cols-3 gap-0.5 bg-surface-base p-0.5 rounded-sm">
                      <span className="bg-primary" />
                      <span className="bg-surface-base" />
                      <span className="bg-primary" />
                      <span className="bg-surface-base" />
                      <span className="bg-primary" />
                      <span className="bg-surface-base" />
                      <span className="bg-primary" />
                      <span className="bg-surface-base" />
                      <span className="bg-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
