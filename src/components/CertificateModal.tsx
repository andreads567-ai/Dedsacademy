import React, { useState } from 'react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose }) => {
  const [certCode, setCertCode] = useState('#DA-2025-99841');
  const [validationResult, setValidationResult] = useState<{
    status: 'valid' | 'invalid' | 'idle';
    studentName?: string;
    courseName?: string;
    workload?: string;
    issuedDate?: string;
  }>({
    status: 'valid',
    studentName: 'Lucas M. Silveira',
    courseName: 'Inteligência Artificial & Machine Learning',
    workload: '60 Horas',
    issuedDate: '15 de Fevereiro de 2025',
  });

  if (!isOpen) return null;

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = certCode.trim().toUpperCase();
    if (clean === '#DA-2025-99841' || clean === 'DA-2025-99841' || clean.includes('DA')) {
      setValidationResult({
        status: 'valid',
        studentName: 'Lucas M. Silveira',
        courseName: 'Inteligência Artificial & Machine Learning',
        workload: '60 Horas',
        issuedDate: '15 de Fevereiro de 2025',
      });
    } else {
      setValidationResult({
        status: 'invalid',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-overlay/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-headline-sm">verified</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-label-lg font-bold text-text-primary">
                Portal de Validação Oficial de Certificados
              </h3>
              <p className="text-label-sm text-text-tertiary">
                Conformidade com a Lei nº 9.394/96 e Decreto nº 5.154/04
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-raised"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search/Validate Bar */}
          <form onSubmit={handleValidate} className="flex gap-2">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-body-lg">
                qr_code_scanner
              </span>
              <input
                type="text"
                value={certCode}
                onChange={(e) => setCertCode(e.target.value)}
                placeholder="Insira o código de registro (ex: #DA-2025-99841)"
                className="w-full pl-10 pr-3 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-body-md text-text-primary focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-label-md font-bold rounded-xl transition-all cursor-pointer shadow-md"
            >
              Consultar
            </button>
          </form>

          {/* Certificate View */}
          {validationResult.status === 'valid' ? (
            <div className="rounded-2xl p-6 bg-gradient-to-b from-surface-overlay to-surface-container border border-primary/30 shadow-xl space-y-5">
              {/* Authenticity Badge Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2 text-accent-emerald-bright font-bold text-label-md">
                  <span className="material-symbols-outlined text-body-lg">check_circle</span>
                  <span>CERTIFICADO OFICIAL VÁLIDO E AUTENTICADO</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-label-sm font-mono font-bold">
                  {certCode}
                </span>
              </div>

              {/* Certificate Layout */}
              <div className="text-center py-4 space-y-2">
                <span className="text-label-sm text-text-tertiary uppercase tracking-widest block">
                  Deds Academy • Certificação Profissional
                </span>
                <h2 className="text-headline-md font-bold text-text-primary">
                  {validationResult.studentName}
                </h2>
                <p className="text-body-md text-text-secondary max-w-lg mx-auto">
                  Concluiu com êxito todas as etapas teóricas, avaliações práticas e projetos de aplicação no curso de{' '}
                  <strong className="text-text-primary">{validationResult.courseName}</strong>.
                </p>
              </div>

              {/* Meta information */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-raised border border-border-subtle text-center">
                <div>
                  <span className="text-label-sm text-text-tertiary block">Carga Horária</span>
                  <span className="text-body-md font-bold text-text-primary">{validationResult.workload}</span>
                </div>
                <div>
                  <span className="text-label-sm text-text-tertiary block">Data de Emissão</span>
                  <span className="text-body-md font-bold text-text-primary">{validationResult.issuedDate}</span>
                </div>
                <div>
                  <span className="text-label-sm text-text-tertiary block">Validade</span>
                  <span className="text-body-md font-bold text-accent-emerald-bright">Extracurricular</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => alert('Download do PDF do certificado oficial iniciado.')}
                  className="px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-overlay text-text-primary text-label-md font-semibold flex items-center gap-2 border border-border-subtle"
                >
                  <span className="material-symbols-outlined text-body-md">download</span>
                  <span>Baixar PDF com Assinatura</span>
                </button>
                <button
                  onClick={() => alert('Compartilhamento no LinkedIn configurado com código de validação.')}
                  className="px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-overlay text-tertiary text-label-md font-semibold flex items-center gap-2 border border-border-subtle"
                >
                  <span className="material-symbols-outlined text-body-md">share</span>
                  <span>Adicionar ao LinkedIn</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-xl space-y-2">
              <span className="material-symbols-outlined text-headline-lg">error</span>
              <p className="font-bold">Certificado não localizado</p>
              <p className="text-body-sm text-text-secondary">
                Verifique se o código foi digitado corretamente ou contate o suporte acadêmico da Deds Academy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
