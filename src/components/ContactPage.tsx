import React, { useState } from 'react';
import { UserAccount } from '../types';
import { FloatingKnowledgeBook } from './FloatingKnowledgeBook';

interface ContactPageProps {
  currentUser: UserAccount | null;
  onNavigateHome: (sectionId?: string) => void;
  onOpenRegister?: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  currentUser,
  onNavigateHome,
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [matricula, setMatricula] = useState(currentUser?.id ? `DEDS-${currentUser.id.slice(-6).toUpperCase()}` : '');
  const [subject, setSubject] = useState('duvida_curso');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<{
    protocol: string;
    date: string;
    subject: string;
  } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);

    // Simulate direct platform ticket dispatch
    setTimeout(() => {
      const generatedProtocol = `#CH-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketSuccess({
        protocol: generatedProtocol,
        date: new Date().toLocaleString('pt-BR'),
        subject,
      });
      setIsSubmitting(false);
    }, 800);
  };

  const handleCopyEmail = (emailToCopy: string) => {
    navigator.clipboard.writeText(emailToCopy);
    setCopiedEmail(emailToCopy);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleResetForm = () => {
    setTicketSuccess(null);
    setMessage('');
    if (!currentUser) {
      setName('');
      setEmail('');
      setPhone('');
      setMatricula('');
    }
  };

  const subjectsMap: Record<string, string> = {
    duvida_curso: 'Dúvida sobre Cursos ou Conteúdo',
    suporte_tecnico: 'Suporte Técnico à Plataforma / Acesso',
    financeiro: 'Financeiro, Pagamentos e Faturas',
    cancelamento_estorno: 'Solicitação de Cancelamento / Estorno',
    certificados: 'Certificados e Conclusão de Aulas',
    outro: 'Outros Assuntos e Informações Gerais',
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-surface-container-lowest text-text-primary py-8 lg:py-12">
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-tertiary mb-6">
          <button
            type="button"
            onClick={() => onNavigateHome('hero-section')}
            className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            Início
          </button>
          <span>/</span>
          <span className="text-text-primary font-medium">Contato & Central de Suporte</span>
        </div>

        {/* Top Highlight Banner: Prioridade para Chamados na Plataforma */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-surface-raised to-primary/10 border border-primary/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/40">
              <span className="material-symbols-outlined text-2xl">bolt</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary text-on-primary uppercase tracking-wider">
                  Prioridade Máxima
                </span>
                <span className="text-xs text-accent-emerald-bright font-semibold">
                  Atendimento em até 2 horas úteis
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-1">
                A prioridade de atendimento é sempre a <strong>abertura de chamado pelo formulário interno</strong>. Chamados diretos contam com fila prioritária, histórico auditado e maior rapidez na resolução.
              </p>
            </div>
          </div>
          <a
            href="#formulario-chamado"
            className="px-4 py-2 rounded-xl bg-primary hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer whitespace-nowrap"
          >
            Abrir Chamado Agora
          </a>
        </div>

        {/* Main Grid: Left (Form) & Right (Support, Rules, Contact info) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT COLUMN: FORMULÁRIO DE CONTATO + LIVRO DO CONHECIMENTO ================= */}
          <div className="lg:col-span-7 space-y-6">
            <div
              id="formulario-chamado"
              className="bg-surface-raised rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-xl"
            >
            <div className="flex items-center justify-between pb-5 border-b border-border-subtle mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    support_agent
                  </span>
                  Fale Conosco & Abrir Chamado
                </h1>
                <p className="text-xs sm:text-sm text-text-tertiary mt-1">
                  Envie sua dúvida, solicitação ou problema técnico diretamente para a nossa equipe.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-accent-emerald-bright bg-accent-emerald-bright/10 px-2.5 py-1 rounded-full border border-accent-emerald-bright/20">
                <span className="w-2 h-2 rounded-full bg-accent-emerald-bright animate-pulse" />
                Fila Ativa
              </span>
            </div>

            {ticketSuccess ? (
              /* Success Confirmation Card */
              <div className="p-6 rounded-2xl bg-surface-overlay border border-primary/40 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/50">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent-emerald-bright px-3 py-1 rounded-full bg-accent-emerald-bright/10 border border-accent-emerald-bright/20">
                  Chamado Registrado com Sucesso
                </span>
                <h3 className="text-xl font-bold text-text-primary mt-3">
                  Protocolo: {ticketSuccess.protocol}
                </h3>
                <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">
                  Recebemos sua mensagem sobre{' '}
                  <strong className="text-text-primary">{subjectsMap[ticketSuccess.subject]}</strong>.
                  Nossa equipe técnica já iniciou a análise.
                </p>

                {/* SLA Box */}
                <div className="mt-5 p-4 rounded-xl bg-surface-container-high/60 border border-border-subtle max-w-md mx-auto text-left text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">Prazo estimado de resposta:</span>
                    <span className="font-bold text-primary">2 horas a 24 horas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">Data e horário de abertura:</span>
                    <span className="text-text-primary font-mono">{ticketSuccess.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-tertiary">Retorno enviado para:</span>
                    <span className="text-text-primary font-mono font-medium">{email}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-overlay text-text-primary text-xs font-bold border border-border-subtle transition-colors cursor-pointer"
                  >
                    Enviar Outra Mensagem
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateHome('cursos-section')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary hover:bg-accent-emerald-bright text-on-primary text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Explorar Cursos
                  </button>
                </div>
              </div>
            ) : (
              /* Contact Form */
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* 1. Nome da Pessoa */}
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-bold text-text-secondary mb-1.5">
                    Nome Completo <span className="text-status-danger">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full px-3.5 py-3 pl-10 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary focus:border-primary focus:outline-none transition-colors"
                    />
                    <span className="material-symbols-outlined absolute left-3 text-text-tertiary text-lg pointer-events-none">
                      person
                    </span>
                  </div>
                </div>

                {/* 2. O E-mail */}
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-bold text-text-secondary mb-1.5">
                    Seu E-mail <span className="text-status-danger">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full px-3.5 py-3 pl-10 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary focus:border-primary focus:outline-none transition-colors"
                    />
                    <span className="material-symbols-outlined absolute left-3 text-text-tertiary text-lg pointer-events-none">
                      mail
                    </span>
                  </div>
                </div>

                {/* Two Column Row: Opcional (Telefone/WhatsApp) & Matrícula (Código) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 3. Opcional: Telefone / WhatsApp */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="contact-phone" className="text-xs font-bold text-text-secondary">
                        Telefone / WhatsApp
                      </label>
                      <span className="text-[10px] text-text-tertiary bg-surface-overlay px-1.5 py-0.5 rounded border border-border-subtle">
                        Opcional, caso haja
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        id="contact-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full px-3.5 py-3 pl-10 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary focus:border-primary focus:outline-none transition-colors"
                      />
                      <span className="material-symbols-outlined absolute left-3 text-text-tertiary text-lg pointer-events-none">
                        phone
                      </span>
                    </div>
                  </div>

                  {/* 4. A Matrícula que é o Código */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="contact-matricula" className="text-xs font-bold text-text-secondary">
                        Matrícula (Código)
                      </label>
                      <span className="text-[10px] text-text-tertiary bg-surface-overlay px-1.5 py-0.5 rounded border border-border-subtle">
                        Opcional caso haja
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        id="contact-matricula"
                        type="text"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value)}
                        placeholder="Ex: DEDS-102938"
                        className="w-full px-3.5 py-3 pl-10 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary focus:border-primary focus:outline-none transition-colors font-mono"
                      />
                      <span className="material-symbols-outlined absolute left-3 text-text-tertiary text-lg pointer-events-none">
                        badge
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Tipo de Assunto */}
                <div>
                  <label htmlFor="contact-subject" className="block text-xs font-bold text-text-secondary mb-1.5">
                    Tipo de Assunto <span className="text-status-danger">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id="contact-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-3 pl-10 pr-10 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer"
                    >
                      <option value="duvida_curso">Dúvida sobre Cursos ou Conteúdo das Aulas</option>
                      <option value="suporte_tecnico">Suporte Técnico à Plataforma / Dificuldade de Acesso</option>
                      <option value="financeiro">Financeiro, Pagamentos, Boleto e Faturas</option>
                      <option value="cancelamento_estorno">Sugestão / Solicitação de Cancelamento e Estorno</option>
                      <option value="certificados">Certificados, Validação e Conclusão</option>
                      <option value="outro">Outros Assuntos / Parcerias e Dúvidas Gerais</option>
                    </select>
                    <span className="material-symbols-outlined absolute left-3 text-text-tertiary text-lg pointer-events-none">
                      category
                    </span>
                    <span className="material-symbols-outlined absolute right-3 text-text-tertiary text-lg pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* 6. A Mensagem */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="contact-message" className="text-xs font-bold text-text-secondary">
                      Mensagem <span className="text-status-danger">*</span>
                    </label>
                    <span className="text-[11px] text-text-tertiary">
                      {message.length} caracteres
                    </span>
                  </div>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva detalhadamente sua dúvida, dificuldade ou solicitação para que nossa equipe possa ajudar com máxima agilidade..."
                    className="w-full p-3.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary focus:border-primary focus:outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>

                {/* Aviso pré-envio */}
                <div className="p-3 bg-surface-overlay/80 rounded-xl border border-border-subtle/70 text-xs text-text-tertiary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base shrink-0">
                    schedule
                  </span>
                  <span>
                    Ao clicar em enviar, seu chamado é indexado diretamente na fila prioritária de suporte (retorno em até <strong>2 horas a 24 horas</strong>).
                  </span>
                </div>

                {/* 7. E o Botão Enviar */}
                <button
                  type="submit"
                  id="contact-submit-button"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-accent-emerald-bright disabled:opacity-50 text-on-primary font-bold text-sm shadow-[0_0_20px_rgba(0,176,116,0.35)] hover:shadow-[0_0_28px_rgba(0,176,116,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      <span>Registrando Chamado...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">send</span>
                      <span>Enviar Chamado de Suporte</span>
                    </>
                  )}
                </button>
              </form>
            )}
            </div>

            {/* O LIVRO ABERTO FLUTUANTE COM FIGURINHAS E INFORMAÇÕES SAINDO DO LIVRO */}
            <FloatingKnowledgeBook />
          </div>

          {/* ================= RIGHT COLUMN: INFORMAÇÕES DE SUPORTE, PRAZOS E REGRAS ================= */}
          <div className="lg:col-span-5 space-y-5">
            {/* QUADRADINHO 1: SUPORTE, HORÁRIO E PRAZO DE ATENDIMENTO (2h OU 24h) */}
            <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

              {/* Tag / Cabeçalho Suporte */}
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">headset_mic</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-primary tracking-tight">
                      Suporte
                    </h2>
                    <span className="text-[11px] text-text-tertiary">
                      Central de Atendimento ao Aluno
                    </span>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-emerald-bright/10 text-accent-emerald-bright border border-accent-emerald-bright/20 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-accent-emerald-bright animate-ping" />
                  Operacional
                </span>
              </div>

              {/* Horário de Atendimento */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-text-tertiary block font-medium mb-1">
                    Horário de Atendimento:
                  </span>
                  <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary font-medium">Segunda a Sexta:</span>
                      <span className="text-text-primary font-bold">08:00 às 20:00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary font-medium">Sábados:</span>
                      <span className="text-text-primary font-bold">09:00 às 14:00</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50 text-[11px]">
                      <span className="text-text-tertiary">Domingos e Feriados:</span>
                      <span className="text-text-tertiary">Plantão via chamados</span>
                    </div>
                  </div>
                </div>

                {/* Tipo de Suporte & Prazo de Atendimento: 2 horas ou 24 horas */}
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">
                      verified
                    </span>
                    <span className="text-xs font-bold text-text-primary">
                      Tipo de Suporte & Prazo de Resposta:
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    Atendimento técnico, pedagógico e financeiro especializado. O prazo estimado de resposta varia entre <strong className="text-primary font-bold">2 horas</strong> (em horário de expediente ou dúvidas críticas) e no máximo <strong className="text-primary font-bold">24 horas</strong> úteis.
                  </p>
                </div>
              </div>
            </div>

            {/* QUADRADINHO 2: INFORMAÇÕES DE UTILIZAÇÃO DA PLATAFORMA */}
            <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 shadow-xl">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-surface-overlay text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">menu_book</span>
                </div>
                <h3 className="text-sm font-bold text-text-primary">
                  Utilização da Plataforma
                </h3>
              </div>

              <ul className="space-y-2.5 text-xs text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent-emerald-bright text-base shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Acesso Imediato:</strong> Após a confirmação da matrícula, todos os cursos contratados ficam disponíveis instantaneamente na sua Área do Aluno.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent-emerald-bright text-base shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Multiplataforma 24/7:</strong> Aulas em vídeo em alta resolução, materiais complementares e exercícios podem ser acessados em computador, tablet ou smartphone.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent-emerald-bright text-base shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Certificado Digital Válido:</strong> Ao atingir 100% de progresso, seu certificado é gerado automaticamente com código único de autenticidade.
                  </span>
                </li>
              </ul>
            </div>

            {/* QUADRADINHO 3: SUGESTÃO DE CANCELAMENTO & PRAZO DE ESTORNO */}
            <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 shadow-xl">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-status-danger/10 text-status-danger flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">rule</span>
                </div>
                <h3 className="text-sm font-bold text-text-primary">
                  Cancelamento & Política de Estorno
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle/80">
                  <span className="text-text-tertiary block font-medium mb-0.5">
                    Prazo Máximo de Cancelamento:
                  </span>
                  <p className="text-text-primary font-medium leading-relaxed">
                    O prazo máximo para solicitar o cancelamento é de até <strong className="text-status-danger font-bold">24 horas após a compra</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle/80">
                  <span className="text-text-tertiary block font-medium mb-0.5">
                    Prazo para Valor de Estorno:
                  </span>
                  <p className="text-text-primary font-medium leading-relaxed">
                    O estorno do valor, após solicitado e aprovado pela equipe, pode demorar até <strong className="text-accent-emerald-bright font-bold">48 horas</strong> para ser processado e creditado na forma original de pagamento.
                  </p>
                </div>

                <p className="text-[11px] text-text-tertiary italic">
                  * Para solicitar cancelamento ou estorno, selecione o assunto correspondente no formulário ao lado e informe sua matrícula ou e-mail de compra.
                </p>
              </div>
            </div>

            {/* QUADRADINHO 4: SUPORTE POR E-MAIL E BOTÃO DO WHATSAPP */}
            <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    contact_mail
                  </span>
                  <h3 className="text-sm font-bold text-text-primary">
                    Outros Canais de Atendimento
                  </h3>
                </div>
                <span className="text-[10px] text-text-tertiary uppercase">Oficial</span>
              </div>

              {/* Informações dos E-mails de Suporte */}
              <div>
                <span className="text-xs font-bold text-text-secondary block mb-2">
                  Suporte por E-mail:
                </span>
                <div className="space-y-1.5">
                  {[
                    { label: 'Suporte & Alunos', email: 'suporte@dedsacademy.com.br' },
                    { label: 'Financeiro & Estornos', email: 'financeiro@dedsacademy.com.br' },
                    { label: 'Contato Geral', email: 'contato@dedsacademy.com.br' },
                  ].map((item) => (
                    <div
                      key={item.email}
                      className="p-2.5 rounded-xl bg-surface-overlay border border-border-subtle/70 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] text-text-tertiary block">
                          {item.label}
                        </span>
                        <a
                          href={`mailto:${item.email}`}
                          className="text-text-primary hover:text-primary transition-colors font-mono font-medium truncate block"
                        >
                          {item.email}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(item.email)}
                        className="px-2 py-1 rounded-lg bg-surface-container-high hover:bg-surface-raised text-[11px] text-text-secondary hover:text-primary transition-colors cursor-pointer shrink-0"
                        title="Copiar e-mail"
                      >
                        {copiedEmail === item.email ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão do WhatsApp */}
              <div>
                <span className="text-xs font-bold text-text-secondary block mb-2">
                  Atendimento via WhatsApp:
                </span>
                <a
                  href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20atendimento%20sobre%20a%20Deds%20Academy."
                  target="_blank"
                  rel="noopener noreferrer"
                  id="whatsapp-support-button"
                  className="w-full py-3 px-4 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm"
                >
                  <svg
                    className="w-4 h-4 fill-current shrink-0"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <span>Chamar Suporte no WhatsApp</span>
                </a>
              </div>

              {/* Destaque Importante Final de Prioridade */}
              <div className="p-3 rounded-xl bg-accent-gold/10 border border-accent-gold/25 text-xs text-accent-gold flex items-start gap-2">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
                  info
                </span>
                <span className="leading-snug">
                  <strong>Aviso de agilidade:</strong> A prioridade máxima de atendimento é a abertura de chamado na plataforma. Chamados pelo formulário recebem resposta prioritária com histórico registrado.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
