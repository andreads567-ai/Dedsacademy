import React, { useState } from 'react';
import { StudentOrder, StudentProgress, CertificateItem } from '../types';

interface CancellationModalProps {
  isOpen: boolean;
  order: StudentOrder | null;
  progressData: Record<string, StudentProgress>;
  certificates: CertificateItem[];
  onClose: () => void;
  onConfirmCancellation: (orderId: string, reason: string) => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  order,
  progressData,
  certificates,
  onClose,
  onConfirmCancellation,
}) => {
  const [step, setStep] = useState<'rules' | 'form'>('rules');
  const [reasonCategory, setReasonCategory] = useState('conteudo_diferente');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  // 1. Regra de 24 horas:
  // Diferença em horas desde a realização da compra
  const now = Date.now();
  const hoursSincePurchase = (now - order.purchaseTimestamp) / (1000 * 60 * 60);
  const isWithin24h = hoursSincePurchase <= 24;

  // 2. Regra de Aproveitamento:
  // Máximo aproveitamento para cancelamento normal é 30% (em casos específicos até 80%)
  const coursePercentages = order.courseIds.map((cId) => progressData[cId]?.percent || 0);
  const maxCourseProgress = coursePercentages.length > 0 ? Math.max(...coursePercentages) : 0;
  const avgCourseProgress =
    coursePercentages.length > 0
      ? Math.round(coursePercentages.reduce((a, b) => a + b, 0) / coursePercentages.length)
      : 0;
  const isProgressAllowed = maxCourseProgress <= 80;
  const isProgressStandard = maxCourseProgress <= 30;

  // 3. Regra de Certificado:
  // Não pode ter emitido certificado para nenhum curso deste pedido
  const hasIssuedCertificate = certificates.some((cert) => order.courseIds.includes(cert.courseId));

  // Verificação geral se atende a todos os critérios eliminatórios
  const isEligible = isWithin24h && isProgressAllowed && !hasIssuedCertificate;

  const handleClose = () => {
    setStep('rules');
    setCustomReason('');
    onClose();
  };

  const handleProceedToForm = () => {
    if (!isEligible) return;
    setStep('form');
  };

  const handleSendToSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customReason.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const fullReason = `[Categoria: ${reasonCategory}] - ${customReason.trim()}`;
      onConfirmCancellation(order.id, fullReason);
      setIsSubmitting(false);
      handleClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Window */}
      <div className="relative w-full max-w-xl max-h-[88vh] bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header - Fixo no topo */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-overlay shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-status-danger/15 text-status-danger flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">cancel</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                {step === 'rules' ? 'Solicitar Cancelamento de Matrícula' : 'Motivo do Cancelamento'}
              </h3>
              <p className="text-xs text-text-tertiary">
                Pedido {order.orderNumber} • {order.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* STEP 1: ALERTA DAS REGRAS PRINCIPAIS */}
        {step === 'rules' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Área com Barra de Rolagem */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Box de Alerta em Destaque */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-400 text-2xl shrink-0 mt-0.5">
                  warning
                </span>
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    Atenção: Diretrizes Obrigatórias de Cancelamento
                  </h4>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    Antes de prosseguir com o chamado de cancelamento e reembolso, certifique-se de que a sua matrícula atende aos 3 requisitos estabelecidos pelos termos da plataforma:
                  </p>
                </div>
              </div>

              {/* As 3 Regras Principais com Validação Visual */}
              <div className="space-y-3">
                {/* Regra 1: Prazo de 24 Horas */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                    isWithin24h
                      ? 'bg-surface-overlay border-border-subtle'
                      : 'bg-status-danger/10 border-status-danger/40'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      isWithin24h
                        ? 'bg-accent-emerald-bright/20 text-accent-emerald-bright'
                        : 'bg-status-danger/20 text-status-danger'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isWithin24h ? 'check' : 'close'}
                    </span>
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">
                        1. Prazo de até 24 horas após a compra
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isWithin24h
                            ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright'
                            : 'bg-status-danger/15 text-status-danger'
                        }`}
                      >
                        {isWithin24h
                          ? `${Math.max(0, Math.floor(24 - hoursSincePurchase))}h restantes`
                          : 'Prazo expirado'}
                      </span>
                    </div>
                    <p className="text-text-tertiary mt-1">
                      O cancelamento pode ser solicitado até 24 horas depois de realizar a compra. Acabou de realizar a compra e tem até 24h para cancelar. Caso passe desse prazo, <strong>não é permitido solicitar o cancelamento</strong>.
                    </p>
                  </div>
                </div>

                {/* Regra 2: Limite de Aproveitamento (máx 30%, casos específicos até 80%) */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                    isProgressAllowed
                      ? 'bg-surface-overlay border-border-subtle'
                      : 'bg-status-danger/10 border-status-danger/40'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      isProgressAllowed
                        ? 'bg-accent-emerald-bright/20 text-accent-emerald-bright'
                        : 'bg-status-danger/20 text-status-danger'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isProgressAllowed ? 'check' : 'close'}
                    </span>
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">
                        2. Aproveitamento de até 30% (máximo 80% em casos específicos)
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isProgressStandard
                            ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright'
                            : isProgressAllowed
                            ? 'bg-amber-400/15 text-amber-400'
                            : 'bg-status-danger/15 text-status-danger'
                        }`}
                      >
                        Seu uso: {maxCourseProgress}%
                      </span>
                    </div>
                    <p className="text-text-tertiary mt-1">
                      O aproveitamento máximo padrão das aulas e módulos é de <strong>30%</strong> para a solicitação de cancelamento. Para casos específicos devidamente justificados, o limite tolerado é de <strong>no máximo 80%</strong>. Acima disso, o acesso é considerado integralmente consumido.
                    </p>
                  </div>
                </div>

                {/* Regra 3: Nenhum Certificado Emitido */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                    !hasIssuedCertificate
                      ? 'bg-surface-overlay border-border-subtle'
                      : 'bg-status-danger/10 border-status-danger/40'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      !hasIssuedCertificate
                        ? 'bg-accent-emerald-bright/20 text-accent-emerald-bright'
                        : 'bg-status-danger/20 text-status-danger'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {!hasIssuedCertificate ? 'check' : 'close'}
                    </span>
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">
                        3. Certificado não emitido
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          !hasIssuedCertificate
                            ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright'
                            : 'bg-status-danger/15 text-status-danger'
                        }`}
                      >
                        {!hasIssuedCertificate ? 'Nenhum emitido' : 'Certificado Já Emitido'}
                      </span>
                    </div>
                    <p className="text-text-tertiary mt-1">
                      <strong>Não pode ter emitido certificado</strong>. Após a emissão do certificado com registro nominal e autenticação por QR Code, não é permitida em nenhuma hipótese a solicitação de cancelamento.
                    </p>
                  </div>
                </div>
              </div>

              {/* Aviso de Inelegibilidade caso viole regras */}
              {!isEligible && (
                <div className="p-3.5 rounded-xl bg-status-danger/15 border border-status-danger/40 flex items-start gap-2.5 text-xs text-status-danger">
                  <span className="material-symbols-outlined text-base mt-0.5">error</span>
                  <span>
                    Este pedido não atende a todos os critérios para cancelamento automatizado (
                    {!isWithin24h && 'prazo superior a 24 horas; '}
                    {!isProgressAllowed && 'aproveitamento superior ao teto de 80%; '}
                    {hasIssuedCertificate && 'certificado do curso já foi emitido; '}
                    ). Se houver necessidade de revisão excepcional, contate nosso suporte diretamente pelo formulário de chamados.
                  </span>
                </div>
              )}
            </div>

            {/* Footer Buttons - Fixo na parte inferior */}
            <div className="p-4 sm:p-5 border-t border-border-subtle bg-surface-overlay shrink-0 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-border-subtle bg-surface-raised hover:bg-surface-container text-text-secondary hover:text-text-primary text-xs font-bold transition-colors cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleProceedToForm}
                disabled={!isEligible}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isEligible
                    ? 'bg-status-danger hover:bg-red-600 text-white shadow-lg shadow-status-danger/25'
                    : 'bg-surface-container text-text-tertiary cursor-not-allowed opacity-60'
                }`}
              >
                <span>Prosseguir para Cancelamento</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FORMULÁRIO DE PREENCHIMENTO DO MOTIVO + ENVIAR PARA SUPORTE */}
        {step === 'form' && (
          <form onSubmit={handleSendToSupport} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Área com Barra de Rolagem */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle flex items-center justify-between text-xs">
                <span className="text-text-secondary">Valor a ser estornado:</span>
                <span className="text-sm font-bold text-primary">
                  R$ {order.totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Principal Motivo do Cancelamento <span className="text-status-danger">*</span>
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:border-primary outline-none cursor-pointer"
                >
                  <option value="conteudo_diferente">Conteúdo diferente do que eu esperava</option>
                  <option value="dificuldade_tecnica">Dificuldade técnica ou de plataforma</option>
                  <option value="falta_tempo">Falta de tempo para me dedicar às aulas</option>
                  <option value="compra_acidental">Compra acidental / duplicada</option>
                  <option value="outro_motivo">Outro motivo particular</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Mensagem detalhando o motivo do cancelamento <span className="text-status-danger">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Por favor, explique o motivo do cancelamento para que nossa equipe de suporte e qualidade possa analisar e processar seu estorno..."
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary focus:border-primary outline-none resize-none leading-relaxed"
                />
                <span className="text-[11px] text-text-tertiary mt-1 block">
                  O estorno será processado para a mesma forma de pagamento original ({order.paymentMethod}) em até 48 horas úteis.
                </span>
              </div>
            </div>

            {/* Footer Buttons - Fixo na parte inferior */}
            <div className="p-4 sm:p-5 border-t border-border-subtle bg-surface-overlay shrink-0 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep('rules')}
                className="px-4 py-2.5 rounded-xl border border-border-subtle bg-surface-raised hover:bg-surface-container text-text-secondary hover:text-text-primary text-xs font-bold transition-colors cursor-pointer"
              >
                Voltar às Regras
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !customReason.trim()}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  !isSubmitting && customReason.trim()
                    ? 'bg-status-danger hover:bg-red-600 text-white shadow-lg shadow-status-danger/25'
                    : 'bg-surface-container text-text-tertiary cursor-not-allowed opacity-60'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">send</span>
                    <span>Enviar para Suporte</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
