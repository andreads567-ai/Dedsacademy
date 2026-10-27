import React, { useState } from 'react';
import { CertificateItem } from '../types';
import { downloadCertificatePdf } from '../utils/certificateGenerator';

interface CertificateSectionProps {
  onOpenCertificateModal: () => void;
  certificatesList?: CertificateItem[];
}

export const CertificateSection: React.FC<CertificateSectionProps> = ({
  onOpenCertificateModal,
  certificatesList = [],
}) => {
  const [inputCode, setInputCode] = useState('');
  const [searchResult, setSearchResult] = useState<{
    searched: boolean;
    status: 'valid' | 'invalid' | 'cancelled';
    cert?: CertificateItem;
  }>({
    searched: false,
    status: 'invalid',
  });

  const handleValidateCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.replace('#', '').trim().toLowerCase();
    if (!clean) return;

    const found = certificatesList.find(
      (c) => c.code.replace('#', '').trim().toLowerCase() === clean
    );

    if (found) {
      if (found.status === 'cancelado') {
        setSearchResult({
          searched: true,
          status: 'cancelled',
          cert: found,
        });
      } else {
        setSearchResult({
          searched: true,
          status: 'valid',
          cert: found,
        });
      }
    } else if (clean === 'da-2025-99841' || clean === 'deds-exc-2025-9842') {
      setSearchResult({
        searched: true,
        status: 'valid',
        cert: {
          id: 'demo-sample',
          courseId: 'ia-ml',
          courseTitle: 'Inteligência Artificial & Machine Learning',
          studentName: 'Lucas M. Silveira',
          studentCpf: '384.920.118-04',
          hours: 60,
          issueDate: '15/02/2025',
          code: '#DA-2025-99841',
          instructor: 'Prof. Lucas M. Silveira',
          status: 'valido',
        },
      });
    } else {
      setSearchResult({
        searched: true,
        status: 'invalid',
      });
    }
  };

  return (
    <section id="certificados-section" className="w-full py-16 lg:py-20 bg-surface-container-lowest relative overflow-hidden">
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop">
        <div className="p-6 sm:p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-surface-raised via-surface-container to-surface-base shadow-2xl relative overflow-hidden border border-border-subtle">
          {/* Subtle background decorative seal */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-primary/5 pointer-events-none blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Text, Credentials and Public Validation Input */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-overlay self-start max-w-full">
                <span className="material-symbols-outlined text-accent-gold text-body-lg shrink-0">verified</span>
                <span className="font-label-md text-xs sm:text-label-md text-text-primary font-semibold truncate">
                  Credenciamento Nacional • Lei Federal nº 9.394/96
                </span>
              </div>

              <h2 className="font-headline-lg text-2xl sm:text-3xl lg:text-headline-lg font-extrabold text-text-primary leading-tight">
                Certificado com Validade Legal em Todo o Território Nacional
              </h2>

              <p className="font-body-md text-sm sm:text-body-md text-text-secondary leading-relaxed">
                Nossos certificados digitais possuem chancela legal em conformidade com a <strong>Lei Federal nº 9.394/96</strong> e Decreto Presidencial nº 5.154/04. Conte com código identificador único criptografado e QR Code instantâneo para enriquecer seu currículo e comprovar horas extracurriculares.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2.5 text-text-primary font-body-md text-xs sm:text-body-md">
                  <span className="material-symbols-outlined text-accent-emerald-bright shrink-0">check_circle</span>
                  <span>Código de autenticidade único</span>
                </div>
                <div className="flex items-center gap-2.5 text-text-primary font-body-md text-xs sm:text-body-md">
                  <span className="material-symbols-outlined text-accent-emerald-bright shrink-0">check_circle</span>
                  <span>Aceito em Universidades e Concursos</span>
                </div>
                <div className="flex items-center gap-2.5 text-text-primary font-body-md text-xs sm:text-body-md">
                  <span className="material-symbols-outlined text-accent-emerald-bright shrink-0">check_circle</span>
                  <span>Download em PDF de alta resolução</span>
                </div>
                <div className="flex items-center gap-2.5 text-text-primary font-body-md text-xs sm:text-body-md">
                  <span className="material-symbols-outlined text-accent-emerald-bright shrink-0">check_circle</span>
                  <span>Consulta pública de autenticidade</span>
                </div>
              </div>

              {/* CAMPO DE VALIDAÇÃO DE CERTIFICADO EM TEMPO REAL NA HOME (ÁREA PÚBLICA) */}
              <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-surface-overlay border border-border-subtle shadow-md space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl shrink-0">qr_code_scanner</span>
                  <h3 className="text-sm font-bold text-text-primary">
                    Validar Certificado Emitido
                  </h3>
                </div>
                <p className="text-xs text-text-tertiary">
                  Informe o código identificador impresso no documento para verificar a autenticidade oficial:
                </p>

                <form onSubmit={handleValidateCode} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Ex: DA-2026-98421 ou DEDS-EXC-2025-9842"
                    className="flex-1 px-3.5 py-2.5 bg-surface-base border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary placeholder:text-text-tertiary font-mono min-w-0"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">search</span>
                    <span>Validar Certificado</span>
                  </button>
                </form>

                {/* Resultado da Validação Inline */}
                {searchResult.searched && (
                  <div className="mt-3">
                    {searchResult.status === 'valid' && searchResult.cert ? (
                      <div className="p-4 rounded-xl bg-accent-emerald-bright/15 border border-accent-emerald-bright/30 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-accent-emerald-bright font-bold flex-wrap gap-1">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            CERTIFICADO VÁLIDO E REGISTRADO
                          </span>
                          <span className="font-mono text-[11px]">{searchResult.cert.code}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-text-secondary text-[11px] pt-1">
                          <p>Titular: <strong className="text-text-primary">{searchResult.cert.studentName}</strong></p>
                          <p>Curso: <strong className="text-text-primary">{searchResult.cert.courseTitle}</strong></p>
                          <p>Carga Horária: <strong className="text-text-primary">{searchResult.cert.hours} Horas</strong></p>
                          <p>Emissão: <strong className="text-text-primary">{searchResult.cert.issueDate}</strong></p>
                        </div>
                        <div className="pt-2 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await downloadCertificatePdf({
                                  studentName: searchResult.cert!.studentName,
                                  courseTitle: searchResult.cert!.courseTitle,
                                  hours: searchResult.cert!.hours,
                                  issueDate: searchResult.cert!.issueDate,
                                  code: searchResult.cert!.code,
                                  instructor: searchResult.cert!.instructor,
                                });
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="text-xs font-bold text-accent-gold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                            <span>Baixar Via Oficial em PDF</span>
                          </button>
                        </div>
                      </div>
                    ) : searchResult.status === 'cancelled' && searchResult.cert ? (
                      <div className="p-4 rounded-xl bg-status-danger/15 border border-status-danger/30 space-y-1.5 text-xs text-status-danger">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="material-symbols-outlined text-base">cancel</span>
                          <span>CERTIFICADO REVOGADO / CANCELADO</span>
                        </div>
                        <p className="text-text-secondary text-[11px]">
                          O documento de código <strong>{searchResult.cert.code}</strong> foi cancelado.
                        </p>
                        {searchResult.cert.cancellationReason && (
                          <p className="text-[11px] italic">Motivo: {searchResult.cert.cancellationReason}</p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-status-danger/10 border border-status-danger/25 text-xs text-status-danger flex items-center gap-2">
                        <span className="material-symbols-outlined text-base shrink-0">error</span>
                        <span>Código não localizado no livro oficial de certificados da Deds Academy. Verifique a digitação.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onOpenCertificateModal}
                  className="px-5 py-2.5 rounded-xl bg-surface-overlay hover:bg-surface-container-high text-text-primary font-label-md text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer border border-border-subtle"
                >
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>Abrir Portal de Validação Completo</span>
                </button>
              </div>
            </div>

            {/* Certificate Graphic Mockup with Official Certificate Model Image */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <div
                onClick={onOpenCertificateModal}
                className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl sm:rotate-1 hover:rotate-0 transition-transform duration-300 border border-border-subtle hover:border-primary/50 cursor-pointer group bg-surface-overlay"
                title="Clique para visualizar e validar este certificado oficial"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-base">
                  <img
                    src="/images/certificado-conclusao-modelo.jpg"
                    alt="Modelo Oficial de Certificado Deds Academy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/certificado-validade-nacional.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                    <div className="flex items-center justify-between text-white text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md font-bold flex items-center gap-1 border border-white/10">
                        <span className="material-symbols-outlined text-sm text-accent-emerald-bright">verified</span>
                        Válido Lei Federal 9.394/96
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-primary text-on-primary font-bold shadow-sm">
                        Consultar
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between border-t border-border-subtle bg-surface-raised">
                  <div className="flex items-center gap-2">
                    <img
                      src="/logo.png"
                      alt="Deds Academy"
                      className="w-7 h-7 object-contain rounded-full shadow-xs shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/logo.png';
                      }}
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-text-primary block leading-none">
                        Deds Academy
                      </span>
                      <span className="text-[10px] text-accent-emerald-bright font-medium">
                        Certificação com QR Code e Hash
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-bold group-hover:underline flex items-center gap-0.5">
                    Verificar
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
