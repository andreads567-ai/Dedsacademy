import React, { useState } from 'react';

interface BlogPageProps {
  onNavigateHome: (sectionId?: string) => void;
  onOpenSupportTicket?: () => void;
  onOpenCertModal?: () => void;
  onOpenProfile?: () => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({
  onNavigateHome,
  onOpenSupportTicket,
  onOpenCertModal,
  onOpenProfile,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'institucional', label: 'Institucional' },
    { id: 'horas', label: 'Horas Complementares' },
    { id: 'suporte', label: 'Suporte & Acesso' },
    { id: 'certificacao', label: 'Certificação' },
    { id: 'seguranca', label: 'Segurança da Conta' },
  ];

  const faqs = [
    {
      q: 'Minha faculdade pode recusar o certificado da Deds Academy para horas complementares?',
      icon: 'help_outline',
      a: 'A Lei Federal nº 9.394/96 confere às instituições de ensino superior (IES) autonomia para definir as diretrizes das Atividades Acadêmicas Complementares (AACC). Mais de 98% das faculdades brasileiras aceitam certificados de cursos livres que contenham carga horária explícita, programa programático e mecanismo de validação por código verificador ou QR Code (elementos 100% presentes nos nossos certificados). Recomendamos apenas verificar o limite máximo de horas por modalidade no manual da sua instituição.',
    },
    {
      q: 'Existe prazo limite para concluir o curso e solicitar a emissão do certificado?',
      icon: 'schedule',
      a: 'Não. Na Deds Academy você tem acesso vitalício ou de 12 meses (de acordo com o plano contratado) para assistir às aulas no seu ritmo. Uma vez atingida a pontuação mínima na avaliação de fixação de cada módulo, o certificado fica imediatamente liberado para emissão sem custos adicionais.',
    },
    {
      q: 'Emite-se segunda via de certificado gratuitamente se eu perder o arquivo?',
      icon: 'cached',
      a: 'Sim! O seu certificado permanece armazenado perpetuamente na sua Área do Aluno na aba "Meus Certificados". Você pode efetuar o download do PDF em alta resolução ou copiar a URL permanente de validação a qualquer momento, sem nenhuma cobrança de taxa de reemissão digital.',
    },
    {
      q: 'Posso emprestar meu acesso para um colega de faculdade assistir junto?',
      icon: 'security',
      a: 'Conforme detalhado no nosso artigo de segurança institucional, o acesso é estritamente pessoal. A emissão do certificado é nominal ao titular da matrícula com seu CPF. Permitir o acesso de terceiros pode disparar alarmes automáticos de bloqueio geográfico de IP e desabilitar a emissão do documento acadêmico.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const matchesFilter = (itemCategory: string, textToSearch: string) => {
    const categoryMatches = activeCategory === 'all' || activeCategory === itemCategory;
    const queryMatches = !searchQuery.trim() || textToSearch.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatches && queryMatches;
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Academic Notification Banner */}
      <section className="w-full bg-surface-container-lowest border-b border-border-subtle">
        <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-xs flex flex-wrap items-center justify-between gap-space-xs text-text-tertiary">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold">
              !
            </span>
            <span className="font-body-sm text-body-sm text-text-secondary">
              Comunicado Oficial: Validação de Cursos Livres em conformidade com a Lei nº 9.394/96 (LDB).
            </span>
          </div>
          <div className="flex items-center gap-space-md">
            <span className="font-label-sm text-label-sm text-accent-emerald-bright flex items-center gap-space-2xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-accent-emerald-bright animate-pulse" />
              Central Operacional Ativa
            </span>
            <span className="font-label-sm text-label-sm text-text-tertiary">
              Atualizado semanalmente
            </span>
          </div>
        </div>
      </section>

      {/* Breadcrumb & Editorial Header */}
      <section className="w-full bg-surface-container-low py-space-xl border-b border-border-subtle">
        <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop flex flex-col gap-space-md">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs font-label-md text-label-md text-text-tertiary">
            <button
              onClick={() => onNavigateHome('hero-section')}
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-body-md">home</span>
              Início
            </button>
            <span className="material-symbols-outlined text-body-sm text-outline-variant">
              chevron_right
            </span>
            <span className="text-accent-emerald-bright font-medium">
              Blog & Notícias Acadêmicas
            </span>
          </nav>

          {/* Main Section Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-end">
            <div className="lg:col-span-8 flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-accent-emerald-bright font-semibold">
                Transparência Acadêmica & Suporte ao Estudante
              </span>
              <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight font-extrabold">
                Blog & Notícias Acadêmicas <span className="text-primary-container">Deds Academy</span>
              </h1>
              <p className="font-body-lg text-body-lg text-text-secondary max-w-3xl">
                Repositório de orientações normativas, manuais de certificação digital, boas práticas de segurança de acesso e diretrizes para aproveitamento de horas complementares (AACC).
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-space-xs">
              <div className="p-space-md rounded-xl bg-surface-raised shadow-md flex items-center gap-space-md border border-border-subtle">
                <div className="w-12 h-12 rounded-lg bg-surface-overlay flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-headline-md">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-text-primary font-semibold">
                    100% Válido para AACC
                  </span>
                  <span className="font-body-sm text-body-sm text-text-tertiary">
                    Certificados emitidos com Hash e QR Code
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-space-md flex flex-col md:flex-row gap-space-sm items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-2xl">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                search
              </span>
              <input
                id="blogSearchInput"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por artigos, horas complementares, suporte, emissão de certificado..."
                className="w-full h-12 pl-11 pr-space-md bg-surface-raised rounded-lg font-body-md text-body-md text-text-primary placeholder:text-text-tertiary outline-none shadow-sm focus:bg-surface-overlay border border-border-subtle focus:border-primary transition-all"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-space-xs overflow-x-auto pb-1 md:pb-0">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-space-md py-space-xs rounded-full font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                        : 'bg-surface-overlay text-text-secondary hover:text-text-primary hover:bg-surface-container-high'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Content Stream */}
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-2xl w-full flex flex-col gap-space-3xl">
        {/* ESSENTIAL INSTITUTIONAL STATEMENT (Lei 9.394/96) */}
        {matchesFilter('institucional', 'Sobre a Deds Academy & Natureza dos Nossos Cursos: Tudo o que você precisa saber Lei 9.394/96 LDB AACC') && (
          <article className="w-full bg-surface-raised rounded-xl shadow-md p-space-xl lg:p-space-2xl flex flex-col lg:flex-row gap-space-xl items-start relative overflow-hidden border border-border-subtle">
            <div className="flex-1 flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="px-space-xs py-0.5 rounded bg-surface-overlay text-primary font-label-sm text-label-sm font-semibold uppercase">
                  Esclarecimento Regulatório
                </span>
                <span className="font-body-sm text-body-sm text-text-tertiary">
                  Publicação Oficial Deds Academy • Tempo de leitura: 4 min
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-text-primary tracking-tight font-bold">
                Sobre a Deds Academy & Natureza dos Nossos Cursos: Tudo o que você precisa saber
              </h2>
              <div className="font-body-md text-body-md text-text-secondary space-y-space-sm leading-relaxed">
                <p>
                  Com o compromisso de máxima transparência acadêmica e jurídica, esclarecemos de forma enfática a fundamentação e a legitimidade dos nossos programas de capacitação.
                </p>
                <div className="p-space-md rounded-lg bg-surface-overlay shadow-sm flex flex-col gap-space-xs text-text-primary border border-border-subtle">
                  <span className="font-label-lg text-label-lg text-accent-emerald-bright flex items-center gap-space-xs font-semibold">
                    <span className="material-symbols-outlined text-body-lg">gavel</span>
                    Base Legal: Lei de Diretrizes e Bases da Educação (LDB nº 9.394/96)
                  </span>
                  <p className="font-body-md text-body-md text-text-secondary">
                    Os cursos ministrados pela <strong className="text-text-primary">Deds Academy</strong> são classificados legalmente como <strong className="text-text-primary">Cursos Livres de Formação Inicial, Aperfeiçoamento e Extracurriculares</strong>, amparados pelo Decreto Presidencial nº 5.154/04 e pelas resoluções do Conselho Nacional de Educação (CNE).
                  </p>
                </div>
                <p>
                  <strong className="text-text-primary">Aproveitamento Acadêmico:</strong> Nossos certificados são plenamente válidos e aceitos em todo o território nacional como <span className="text-accent-emerald-bright font-semibold">Atividades Acadêmicas Complementares (AACC)</span>, atividades extracurriculares universitárias, provas de títulos em editais corporativos compatíveis, progressão funcional e enriquecimento técnico do currículo profissional.
                </p>
                <p className="text-text-tertiary font-body-sm text-body-sm">
                  <strong className="text-text-secondary">Nota de Transparência:</strong> Nossos cursos são categorizados como extracurriculares e livres, destinados para atividades complementares de faculdades/universidades e capacitação profissional, não substituindo cursos de graduação ou pós-graduação formal com diploma de ensino superior.
                </p>
              </div>
              <div className="flex items-center gap-space-md pt-space-xs flex-wrap">
                <div className="flex items-center gap-space-xs text-accent-emerald-bright font-label-md text-label-md">
                  <span className="material-symbols-outlined text-body-lg">done_all</span>
                  Válido em Faculdades e Universidades
                </div>
                <div className="flex items-center gap-space-xs text-accent-emerald-bright font-label-md text-label-md">
                  <span className="material-symbols-outlined text-body-lg">done_all</span>
                  Válido para Concursos e Progressão
                </div>
                <div className="flex items-center gap-space-xs text-accent-emerald-bright font-label-md text-label-md">
                  <span className="material-symbols-outlined text-body-lg">done_all</span>
                  Certificação Imediata pós-avaliação
                </div>
              </div>
            </div>

            <div className="w-full lg:w-96 flex flex-col gap-space-md shrink-0">
              <div className="w-full h-56 rounded-lg bg-surface-container-lowest overflow-hidden shadow-sm border border-border-subtle">
                <img
                  className="w-full h-full object-cover"
                  alt="Modern high-tech classroom and academic certificate documentation"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgCGpBwBIrakqTT0-kPrhHJOSdY07XciFmswMntAufpgnIHWqvU1993PRK6NzpkmqZmy1rmSLoCvBshRS6kd5yB0WFtNgOHdhLcYJTBGpp51QhiqRskL4dYFUIiV2ZjYXkAwLr5m2kZGY93z2NErX5rLXCLw00uXe2BTMGJoY95Ks2vqqD59HTXABQ0NNKDvIywnlOXU-aNB8pZAYUwNTZWq-aiujy0hOCzRd-VzxLGtjC5urZKdfTDQ"
                />
              </div>
              <div className="p-space-md rounded-lg bg-surface-container-high flex flex-col gap-space-xs border border-border-subtle">
                <span className="font-label-sm text-label-sm text-text-tertiary uppercase">
                  Documento Informativo
                </span>
                <span className="font-label-lg text-label-lg text-text-primary font-bold">
                  Estatuto de Cursos Livres Deds
                </span>
                <p className="font-body-sm text-body-sm text-text-secondary">
                  Consulte o parecer técnico detalhado sobre aceitação de horas e equivalência de carga horária em faculdades parceiras.
                </p>
                <a
                  className="inline-flex items-center gap-space-xs text-primary font-label-md text-label-md hover:text-accent-emerald-bright transition-colors mt-space-2xs cursor-pointer"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Download do Memorando Estatutário em PDF iniciado.');
                  }}
                >
                  Baixar Memorando PDF (540 KB)
                  <span className="material-symbols-outlined text-body-md">download</span>
                </a>
              </div>
            </div>
          </article>
        )}

        {/* CRITICAL GUIDELINES BENTO: SUPPORT & ACCOUNT SECURITY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
          {/* ARTICLE 2: HOW TO REQUEST SUPPORT & RESOLVE LOGIN (Col 7) */}
          {matchesFilter('suporte', 'Como solicitar suporte e resolver problemas de acesso à Área do Aluno ticket whatsapp email') && (
            <article className="lg:col-span-7 bg-surface-raised rounded-xl shadow-md p-space-xl flex flex-col justify-between border border-border-subtle">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between gap-space-xs">
                  <span className="px-space-xs py-0.5 rounded bg-surface-overlay text-status-info font-label-sm text-label-sm font-semibold uppercase">
                    Guia Prático do Aluno
                  </span>
                  <span className="font-label-sm text-label-sm text-accent-emerald-bright flex items-center gap-1 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-accent-emerald-bright" />
                    Resposta em até 2h úteis
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-text-primary font-bold">
                  Como solicitar suporte e resolver problemas de acesso à Área do Aluno
                </h3>
                <p className="font-body-md text-body-md text-text-secondary leading-relaxed">
                  Se você encontrou dificuldades para acessar sua conta, visualizar as videoaulas ou carregar seu módulo, disponibilizamos canais exclusivos e um processo ágil de contingência técnica.
                </p>

                {/* Support Channels Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-space-xs">
                  <div className="p-space-sm rounded-lg bg-surface-overlay flex flex-col gap-1 shadow-sm border border-border-subtle">
                    <div className="flex items-center gap-space-xs text-primary">
                      <span className="material-symbols-outlined text-body-lg">confirmation_number</span>
                      <span className="font-label-md text-label-md font-bold">Ticket Interno</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-tertiary">
                      Direto no painel. Rastreabilidade completa da sua dúvida pedagógica.
                    </p>
                    <span className="font-label-sm text-label-sm text-text-secondary mt-1">24h / 7 dias por semana</span>
                  </div>

                  <div className="p-space-sm rounded-lg bg-surface-overlay flex flex-col gap-1 shadow-sm border border-border-subtle">
                    <div className="flex items-center gap-space-xs text-accent-emerald-bright">
                      <span className="material-symbols-outlined text-body-lg">chat</span>
                      <span className="font-label-md text-label-md font-bold">WhatsApp Oficial</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-tertiary">
                      Atendimento humanizado para desbloqueios e matrículas ativas.
                    </p>
                    <span className="font-label-sm text-label-sm text-text-secondary mt-1">Seg a Sex, 08h às 20h</span>
                  </div>

                  <div className="p-space-sm rounded-lg bg-surface-overlay flex flex-col gap-1 shadow-sm border border-border-subtle">
                    <div className="flex items-center gap-space-xs text-tertiary">
                      <span className="material-symbols-outlined text-body-lg">mail</span>
                      <span className="font-label-md text-label-md font-bold">E-mail Acadêmico</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-tertiary">
                      suporte@dedsacademy.com para envio de comprovantes e laudos.
                    </p>
                    <span className="font-label-sm text-label-sm text-text-secondary mt-1">Resposta garantida</span>
                  </div>
                </div>

                {/* Step-by-step Password recovery */}
                <div className="p-space-md rounded-lg bg-surface-container flex flex-col gap-space-xs border border-border-subtle">
                  <span className="font-label-md text-label-md text-text-primary font-semibold flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-body-md text-primary">lock_reset</span>
                    Passo a Passo Rápido: Recuperação de Senha
                  </span>
                  <ol className="list-decimal list-inside space-y-1 font-body-sm text-body-sm text-text-secondary">
                    <li>Na tela de login, clique em <span className="text-text-primary font-medium">"Esqueci minha senha"</span>.</li>
                    <li>Informe exatamente o e-mail cadastrado na contratação ou matrícula.</li>
                    <li>Acesse sua caixa postal e abra a mensagem enviada por <em>autenticacao@dedsacademy.com</em> (verifique a pasta de Spam/Promoções).</li>
                    <li>Clique no link criptografado de uso único válido por 60 minutos e crie sua nova chave de acesso.</li>
                  </ol>
                </div>
              </div>

              <div className="pt-space-md flex items-center justify-between flex-wrap gap-space-sm">
                <span className="font-body-sm text-body-sm text-text-tertiary">
                  Não recebeu o link? Nosso WhatsApp resolve em minutos.
                </span>
                <button
                  onClick={() => alert('Canal de abertura de chamado ativado. Nossa equipe entrará em contato.')}
                  className="px-space-md py-space-xs rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold hover:bg-accent-emerald-bright transition-all shadow-sm cursor-pointer"
                >
                  Abrir Chamado Agora
                </button>
              </div>
            </article>
          )}

          {/* ARTICLE 3: SECURITY WARNING (DO NOT SHARE CREDENTIALS) (Col 5) */}
          {matchesFilter('seguranca', 'Diretrizes de Segurança: Por que você nunca deve compartilhar seu login e senha lgpd') && (
            <article className="lg:col-span-5 bg-surface-raised rounded-xl shadow-md p-space-xl flex flex-col justify-between relative overflow-hidden border border-border-subtle">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <span className="px-space-xs py-0.5 rounded bg-error-container text-error font-label-sm text-label-sm font-bold uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-body-sm">warning</span>
                    Alerta de Segurança
                  </span>
                  <span className="font-label-sm text-label-sm text-text-tertiary">Compliance LGPD</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-text-primary font-bold">
                  Diretrizes de Segurança: Por que você nunca deve compartilhar seu login e senha
                </h3>
                <p className="font-body-md text-body-md text-text-secondary leading-relaxed">
                  A conta do estudante na Deds Academy é <strong className="text-text-primary">pessoal, individual e intransferível</strong>. Todo o ambiente possui telemetria de auditoria contra pirataria e fraudes intelectuais.
                </p>

                <div className="space-y-space-xs">
                  <div className="p-space-sm rounded-lg bg-surface-overlay flex items-start gap-space-xs border border-border-subtle">
                    <span className="material-symbols-outlined text-status-danger text-headline-sm shrink-0">
                      shield_lock
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-text-primary font-semibold">
                        Exposição de Dados Privados (LGPD)
                      </span>
                      <span className="font-body-sm text-body-sm text-text-tertiary">
                        Seu CPF, histórico de pagamentos, notas fiscais e dados de endereço ficam abertos a terceiros caso a senha seja vazada.
                      </span>
                    </div>
                  </div>

                  <div className="p-space-sm rounded-lg bg-surface-overlay flex items-start gap-space-xs border border-border-subtle">
                    <span className="material-symbols-outlined text-accent-gold text-headline-sm shrink-0">
                      block
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-text-primary font-semibold">
                        Bloqueio Automático Preventivo
                      </span>
                      <span className="font-body-sm text-body-sm text-text-tertiary">
                        Acessos simultâneos de diferentes cidades ou IPs acionam o travamento imediato por algoritmo antifraude.
                      </span>
                    </div>
                  </div>

                  <div className="p-space-sm rounded-lg bg-surface-overlay flex items-start gap-space-xs border border-border-subtle">
                    <span className="material-symbols-outlined text-status-danger text-headline-sm shrink-0">
                      cancel
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-text-primary font-semibold">
                        Risco de Anulação de Certificados
                      </span>
                      <span className="font-body-sm text-body-sm text-text-tertiary">
                        Provas ou emissões sob suspeita de uso compartilhado sofrem invalidação irrevogável do hash de autenticidade.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-space-md">
                <div className="p-space-xs rounded-lg bg-surface-container-high text-center border border-border-subtle">
                  <span className="font-body-sm text-body-sm text-text-secondary">
                    Dica: Ative a Verificação em Duas Etapas (2FA) na aba Segurança do seu Perfil.
                  </span>
                </div>
              </div>
            </article>
          )}
        </div>

        {/* CERTIFICATE DATA VERIFICATION SECTION */}
        {matchesFilter('certificacao', 'Atenção antes de emitir seu certificado: confira todos os seus dados cadastrais nome cpf') && (
          <article className="w-full bg-surface-raised rounded-xl shadow-md p-space-xl lg:p-space-2xl flex flex-col lg:flex-row gap-space-xl items-center border border-border-subtle">
            <div className="w-full lg:w-5/12 flex flex-col gap-space-sm">
              <div className="w-full rounded-lg bg-surface-container-lowest overflow-hidden relative shadow-sm border border-border-subtle">
                <img
                  className="w-full h-auto object-cover"
                  alt="Certificado de Conclusão - Deds Academy"
                  src="/images/certificado-conclusao-modelo.jpg"
                />
              </div>
            </div>

            <div className="w-full lg:w-7/12 flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="px-space-xs py-0.5 rounded bg-surface-overlay text-accent-gold-soft font-label-sm text-label-sm font-semibold uppercase">
                  Aviso Crítico de Emissão
                </span>
                <span className="font-body-sm text-body-sm text-text-tertiary">
                  Evite taxas de reemissão
                </span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-text-primary tracking-tight font-bold">
                Atenção antes de emitir seu certificado: confira todos os seus dados cadastrais
              </h3>
              <p className="font-body-md text-body-md text-text-secondary leading-relaxed">
                No momento em que você clica em <span className="text-text-primary font-semibold">"Emitir Certificado de Conclusão"</span>, nosso sistema gera um hash criptográfico inviolável e registra a autenticidade nos servidores em nuvem com um QR Code público. Qualquer erro no seu nome ou documento exigirá um processo manual de retificação.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div className="p-space-md rounded-lg bg-surface-overlay flex flex-col gap-1 border border-border-subtle">
                  <span className="font-label-md text-label-md text-accent-emerald-bright font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-body-md">badge</span>
                    Nome Completo Oficial
                  </span>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    Não utilize apelidos ou abreviações no campo de nome. Faculdades rejeitam certificados com nomes truncados (ex: "João S. Silva" em vez de "João Silva Santos").
                  </p>
                </div>
                <div className="p-space-md rounded-lg bg-surface-overlay flex flex-col gap-1 border border-border-subtle">
                  <span className="font-label-md text-label-md text-accent-emerald-bright font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-body-md">fingerprint</span>
                    Número do CPF Cadastrado
                  </span>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    O CPF é a chave primária que as secretarias acadêmicas e órgãos empregadores usam na nossa tela pública de consulta para confirmar a autoria.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-space-md pt-space-xs flex-wrap">
                <button
                  type="button"
                  onClick={() => alert('Redirecionando para revisão de dados cadastrais.')}
                  className="px-space-md py-space-xs rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold hover:bg-accent-emerald-bright transition-all shadow-sm flex items-center gap-space-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-body-md">manage_accounts</span>
                  Revisar Dados no Meu Perfil
                </button>
                <button
                  type="button"
                  onClick={onOpenCertModal}
                  className="font-label-md text-label-md text-text-secondary hover:text-primary transition-colors flex items-center gap-1 cursor-pointer font-semibold"
                >
                  Ir para Central de Certificados
                  <span className="material-symbols-outlined text-body-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </article>
        )}

        {/* COMPLEMENTARY ACADEMIC ARTICLES GRID */}
        <div className="flex flex-col gap-space-lg">
          <div className="flex items-center justify-between flex-wrap gap-space-xs">
            <div>
              <span className="font-label-sm text-label-sm text-primary uppercase font-semibold">
                Biblioteca Prática
              </span>
              <h3 className="font-headline-md text-headline-md text-text-primary font-bold">
                Guias de Orientação & Dicas Acadêmicas
              </h3>
            </div>
            <span className="font-body-sm text-body-sm text-text-tertiary">3 novos artigos indexados</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {/* Guide 1: Comprovar horas na faculdade */}
            <article className="bg-surface-raised rounded-xl shadow-md overflow-hidden flex flex-col justify-between group hover:-translate-y-1 transition-all border border-border-subtle">
              <div className="flex flex-col">
                <div className="w-full h-44 bg-surface-container-lowest overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt="University student reviewing academic transcripts"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRUfyBVrgXE6BffKHvD8k-pbeYWR3caHdnfuRK0MBk42lYFW3BGHTJ5HsgMyFSkmIWIsrCZzDHZCSLvW8tFlukXapvMh46hlUtBEek5BR9Ksn1hTwE3XIUl0Vwzugtto5m8cxd1-w51dtVJIgEIdkPS9mocCNoAg8P66iUFHdTytJTDKX6wx0gW24Llm473FPAj4qpc0L7ekF5RmsdS4H0vXBpleaVMPPNOLA_UtG8H_vxLPIvy3CUcA"
                  />
                </div>
                <div className="p-space-lg flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs">
                    <span className="px-space-xs py-0.5 rounded bg-surface-overlay text-primary font-label-sm text-label-sm font-semibold">
                      AACC / Horas
                    </span>
                    <span className="font-body-sm text-body-sm text-text-tertiary">5 min leitura</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-text-primary group-hover:text-accent-emerald-bright transition-colors font-bold">
                    Como comprovar horas complementares na sua faculdade com certificados Deds Academy
                  </h4>
                  <p className="font-body-sm text-body-sm text-text-secondary line-clamp-3">
                    Entenda o rito de protocolo nas secretarias de graduação, como preencher os relatórios de equivalência e como apresentar o link de validação pública ao seu coordenador.
                  </p>
                </div>
              </div>
              <div className="px-space-lg pb-space-lg pt-space-xs flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-tertiary">Publicado em Nov 2024</span>
                <span className="font-label-md text-label-md text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold cursor-pointer">
                  Ler guia <span className="material-symbols-outlined text-body-sm">arrow_forward</span>
                </span>
              </div>
            </article>

            {/* Guide 2: Organização de tempo */}
            <article className="bg-surface-raised rounded-xl shadow-md overflow-hidden flex flex-col justify-between group hover:-translate-y-1 transition-all border border-border-subtle">
              <div className="flex flex-col">
                <div className="w-full h-44 bg-surface-container-lowest overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt="Productivity timer dashboard and workspace"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF9CaUBBxd0AIgPNRkuEpDF80gHPrUNkk-z1aGy8I718EHokpwuKZ82l-5pPjxNuTDTCTh9ijfoBU_N7YWgkcSTQmaH0w--CoHTWoKGklMsDBEXb7UXHZPOA2btFgjqST-EzY_PpH2j1PzCwMVf44BLcdULkXRb6rmTxCLnfOHMurhh7Ykv1IaLqBjCX9e-QwSu9r30u877UTQP9zsVE6fC5Ct_lRFX9N_ESIKtGpwNelKG4QL-h3H7A"
                  />
                </div>
                <div className="p-space-lg flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs">
                    <span className="px-space-xs py-0.5 rounded bg-surface-overlay text-tertiary font-label-sm text-label-sm font-semibold">
                      Produtividade
                    </span>
                    <span className="font-body-sm text-body-sm text-text-tertiary">3 min leitura</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-text-primary group-hover:text-accent-emerald-bright transition-colors font-bold">
                    Dicas de organização de tempo para concluir seus cursos e bootcamps no prazo
                  </h4>
                  <p className="font-body-sm text-body-sm text-text-secondary line-clamp-3">
                    Aprenda a aplicar o método Pomodoro adaptado para trilhas de tecnologia, como reservar blocos profundos de estudo e como atingir 100% de progresso semanal sem sobrecarga.
                  </p>
                </div>
              </div>
              <div className="px-space-lg pb-space-lg pt-space-xs flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-tertiary">Publicado em Out 2024</span>
                <span className="font-label-md text-label-md text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold cursor-pointer">
                  Ler guia <span className="material-symbols-outlined text-body-sm">arrow_forward</span>
                </span>
              </div>
            </article>

            {/* Guide 3: Autenticidade digital QR code */}
            <article className="bg-surface-raised rounded-xl shadow-md overflow-hidden flex flex-col justify-between group hover:-translate-y-1 transition-all border border-border-subtle">
              <div className="flex flex-col">
                <div className="w-full h-44 bg-surface-container-lowest overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt="Smartphone scanning encrypted QR code on certificate"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjFmNxFI07XsEA-fYbLERF1wLaXyIIsOaYA_NrX3gBzC66oLXgvedMasB7tgVI75weMbn9yfCxM9GsSkarEV91Z67zwFnPrJfoz6DCf6iAoRupCwblXsO-s4sKTXU8feWTnmCGF_5Bag5ZbZDZKDkna8ONyo1_ubkY-TFs-NmXg8SgqLX_41IGrM7VvqTolQqT3uC6wb7NwT6vwGLXUntHU2EnbWrkOoKHOPXCPYPilHRGKJKbrCdRaQ"
                  />
                </div>
                <div className="p-space-lg flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs">
                    <span className="px-space-xs py-0.5 rounded bg-surface-overlay text-accent-gold font-label-sm text-label-sm font-semibold">
                      Tecnologia Segura
                    </span>
                    <span className="font-body-sm text-body-sm text-text-tertiary">4 min leitura</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-text-primary group-hover:text-accent-emerald-bright transition-colors font-bold">
                    Autenticidade digital: como funciona a validação pública de certificados via QR Code
                  </h4>
                  <p className="font-body-sm text-body-sm text-text-secondary line-clamp-3">
                    Conheça a infraestrutura por trás do nosso portal de autenticidade, que impede qualquer tipo de adulteração física ou cópia não autorizada de diplomas.
                  </p>
                </div>
              </div>
              <div className="px-space-lg pb-space-lg pt-space-xs flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-tertiary">Publicado em Out 2024</span>
                <span className="font-label-md text-label-md text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold cursor-pointer">
                  Ler guia <span className="material-symbols-outlined text-body-sm">arrow_forward</span>
                </span>
              </div>
            </article>
          </div>
        </div>

        {/* FAQ ACCORDION SECTION */}
        <section className="w-full bg-surface-raised rounded-xl shadow-md p-space-xl lg:p-space-2xl flex flex-col gap-space-xl border border-border-subtle">
          <div className="flex flex-col gap-space-2xs text-center max-w-2xl mx-auto">
            <span className="font-label-sm text-label-sm text-accent-emerald-bright uppercase font-semibold">
              Dúvidas Frequentes da Comunidade
            </span>
            <h3 className="font-headline-lg text-headline-lg text-text-primary font-bold">
              Perguntas Frequentes do Blog & Suporte
            </h3>
            <p className="font-body-md text-body-md text-text-secondary">
              Respostas diretas para as dúvidas mais recorrentes de nossos alunos sobre regularidade acadêmica e certificações.
            </p>
          </div>

          <div className="flex flex-col gap-space-xs max-w-4xl mx-auto w-full">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="rounded-lg bg-surface-overlay shadow-sm overflow-hidden border border-border-subtle">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-space-md text-left flex items-center justify-between gap-space-md hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    <span className="font-label-lg text-label-lg text-text-primary font-semibold flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-body-lg">
                        {faq.icon}
                      </span>
                      {faq.q}
                    </span>
                    <span
                      className={`material-symbols-outlined text-text-tertiary transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-space-md pt-0 font-body-md text-body-md text-text-secondary leading-relaxed border-t border-border-subtle/40 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* DIRECT CTA BOX FOR STUDENT TUTORING & SUPPORT */}
        <section className="w-full rounded-2xl bg-surface-container-high p-space-xl lg:p-space-2xl flex flex-col md:flex-row items-center justify-between gap-space-xl shadow-xl relative overflow-hidden border border-border-subtle">
          <div className="flex flex-col gap-space-xs max-w-2xl">
            <span className="font-label-sm text-label-sm text-accent-emerald-bright uppercase font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-body-md">support_agent</span>
              Canal Direto de Tutoria
            </span>
            <h3 className="font-headline-lg text-headline-lg text-text-primary tracking-tight font-bold">
              Ainda precisa de ajuda acadêmica ou técnica?
            </h3>
            <p className="font-body-md text-body-md text-text-secondary leading-relaxed">
              Nossa equipe pedagógica e técnica está de prontidão para solucionar conflitos de matrícula, revisar dados de certificação ou fornecer declarações personalizadas para sua faculdade.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-space-sm w-full md:w-auto shrink-0">
            <button
              onClick={() => alert('Ticket de suporte aberto. Nossa central responderá por e-mail.')}
              className="w-full sm:w-auto px-space-xl py-space-md bg-primary-container text-on-primary font-label-lg text-label-lg font-bold rounded-lg hover:bg-accent-emerald-bright transition-all shadow-[0_0_20px_-3px_rgba(0,176,116,0.35)] flex items-center justify-center gap-space-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-body-lg">headset_mic</span>
              Abrir Ticket de Suporte
            </button>
            <button
              onClick={() => alert('Iniciando atendimento via WhatsApp oficial da Deds Academy...')}
              className="w-full sm:w-auto px-space-lg py-space-md bg-surface-overlay text-text-primary font-label-lg text-label-lg font-semibold rounded-lg hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-space-xs cursor-pointer border border-border-subtle"
            >
              <span className="material-symbols-outlined text-body-lg">chat</span>
              Falar via WhatsApp
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
