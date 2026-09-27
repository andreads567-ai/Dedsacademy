import React, { useState } from 'react';
import { CourseFinalExam, CourseExamQuestion, CourseExamOption } from '../../types';

interface CourseExamEditorProps {
  courseTitle: string;
  initialExam?: CourseFinalExam;
  onBackToQuizzes: () => void;
  onSaveDraft: (exam: CourseFinalExam) => void;
  onPublishExam: (exam: CourseFinalExam) => void;
}

export const CourseExamEditor: React.FC<CourseExamEditorProps> = ({
  courseTitle,
  initialExam,
  onBackToQuizzes,
  onSaveDraft,
  onPublishExam,
}) => {
  // Default 10 realistic questions for course certification
  const getDefaultQuestions = (): CourseExamQuestion[] => [
    {
      id: 'q-1',
      title: 'Qual é o princípio fundamental abordado no primeiro módulo prático do curso?',
      type: 'assertiva',
      selectionType: 'unica',
      points: 1,
      options: [
        { id: 'opt-1-a', letter: 'A', text: 'Estruturação da arquitetura e boas práticas de código limpo', isCorrect: true },
        { id: 'opt-1-b', letter: 'B', text: 'Execução de scripts sem documentação técnica prévia', isCorrect: false },
        { id: 'opt-1-c', letter: 'C', text: 'Substituição de algoritmos por soluções manuais', isCorrect: false },
        { id: 'opt-1-d', letter: 'D', text: 'Uso exclusivo de tecnologias legadas sem versionamento', isCorrect: false },
        { id: 'opt-1-e', letter: 'E', text: 'Desativação de testes de regressão contínua', isCorrect: false },
      ],
      explanation: 'A arquitetura modular e os princípios de clean code são a base estruturante para projetos escaláveis.',
    },
    {
      id: 'q-2',
      title: 'Sobre o controle de versão e trabalho colaborativo, quais afirmações são verdadeiras?',
      type: 'assertiva',
      selectionType: 'multipla',
      points: 2,
      options: [
        { id: 'opt-2-a', letter: 'A', text: 'Branches protegem o ambiente principal de produção durante experimentos', isCorrect: true },
        { id: 'opt-2-b', letter: 'B', text: 'Commits devem conter mensagens semânticas e claras sobre o que foi modificado', isCorrect: true },
        { id: 'opt-2-c', letter: 'C', text: 'Nunca se deve revisar pull requests antes do merge', isCorrect: false },
        { id: 'opt-2-d', letter: 'D', text: 'Tags semânticas auxiliam no controle de lançamentos e versões de release', isCorrect: true },
        { id: 'opt-2-e', letter: 'E', text: 'Arquivos com senhas e chaves privadas devem ser comitados publicamente', isCorrect: false },
      ],
      explanation: 'Branches, mensagens semânticas e tags são pilares essenciais do Git moderno.',
    },
    {
      id: 'q-3',
      title: 'Como você avalia o impacto da automação de processos na rotina produtiva de um profissional?',
      type: 'opiniao',
      selectionType: 'unica',
      points: 1,
      options: [
        { id: 'opt-3-a', letter: 'A', text: 'Altamente positivo, liberando tempo estratégico para resolução de problemas complexos', isCorrect: true },
        { id: 'opt-3-b', letter: 'B', text: 'Moderado, com ganhos pontuais em tarefas repetitivas de menor relevância', isCorrect: false },
        { id: 'opt-3-c', letter: 'C', text: 'Indiferente na maioria das etapas corporativas atuais', isCorrect: false },
        { id: 'opt-3-d', letter: 'D', text: 'Desfavorável caso a equipe não receba treinamento adequado contínuo', isCorrect: false },
        { id: 'opt-3-e', letter: 'E', text: 'Dependente unicamente de investimentos de grande escala em hardware', isCorrect: false },
      ],
      explanation: 'Questão avaliativa para medir o discernimento analítico sobre automação e escala.',
    },
    {
      id: 'q-4',
      title: 'Na etapa de otimização de performance, qual critério técnico deve ser priorizado?',
      type: 'assertiva',
      selectionType: 'unica',
      points: 1,
      options: [
        { id: 'opt-4-a', letter: 'A', text: 'Redução do tempo de resposta e consumo eficiente de memória', isCorrect: true },
        { id: 'opt-4-b', letter: 'B', text: 'Aumento indefinido do número de loops síncronos', isCorrect: false },
        { id: 'opt-4-c', letter: 'C', text: 'Remoção de camadas de segurança para ganho marginal de milissegundos', isCorrect: false },
        { id: 'opt-4-d', letter: 'D', text: 'Ignorar logs e métricas de telemetria em produção', isCorrect: false },
        { id: 'opt-4-e', letter: 'E', text: 'Armazenamento de dados sem índices em consultas pesadas', isCorrect: false },
      ],
      explanation: 'Performance sustentável equilibra latência mínima com eficiência de recursos de hardware.',
    },
    {
      id: 'q-5',
      title: 'Quais mecanismos garantem a proteção e integridade de dados confidenciais do sistema?',
      type: 'assertiva',
      selectionType: 'multipla',
      points: 2,
      options: [
        { id: 'opt-5-a', letter: 'A', text: 'Criptografia em trânsito (HTTPS/TLS) e em repouso (AES-256)', isCorrect: true },
        { id: 'opt-5-b', letter: 'B', text: 'Políticas de controle de acesso baseadas em papéis e privilégios mínimos (RBAC)', isCorrect: true },
        { id: 'opt-5-c', letter: 'C', text: 'Compartilhamento de senhas mestras por e-mail sem expiração', isCorrect: false },
        { id: 'opt-5-d', letter: 'D', text: 'Auditoria contínua de logs e alertas para anomalias de tráfego', isCorrect: true },
        { id: 'opt-5-e', letter: 'E', text: 'Desabilitação de firewalls e rotas de validação de tokens', isCorrect: false },
      ],
      explanation: 'Criptografia robusta, RBAC e auditoria contínua compõem a tríade de segurança da informação.',
    },
    {
      id: 'q-6',
      title: 'Em relação ao tratamento de exceções e falhas, qual a conduta recomendada?',
      type: 'assertiva',
      selectionType: 'unica',
      points: 1,
      options: [
        { id: 'opt-6-a', letter: 'A', text: 'Capturar erros de forma previsível e exibir mensagens amigáveis ao usuário', isCorrect: true },
        { id: 'opt-6-b', letter: 'B', text: 'Silenciar todos os erros com blocos vazios para o app não travar', isCorrect: false },
        { id: 'opt-6-c', letter: 'C', text: 'Expor stack traces com dados de banco no frontend público', isCorrect: false },
        { id: 'opt-6-d', letter: 'D', text: 'Reiniciar o servidor a cada requisição que falhar', isCorrect: false },
        { id: 'opt-6-e', letter: 'E', text: 'Ignorar validações no payload recebido do cliente', isCorrect: false },
      ],
      explanation: 'O tratamento elegante de erros previne vazamento de dados sensíveis e melhora a experiência.',
    },
    {
      id: 'q-7',
      title: 'Qual papel as avaliações e feedbacks exercem na melhoria contínua de um projeto?',
      type: 'opiniao',
      selectionType: 'unica',
      points: 1,
      options: [
        { id: 'opt-7-a', letter: 'A', text: 'Fundamental para alinhar expectativas, corrigir gargalos e elevar a satisfação', isCorrect: true },
        { id: 'opt-7-b', letter: 'B', text: 'Secundário, pois o planejamento inicial deve ser imutável até o término', isCorrect: false },
        { id: 'opt-7-c', letter: 'C', text: 'Opcional apenas em versões beta experimentais', isCorrect: false },
        { id: 'opt-7-d', letter: 'D', text: 'Irrelevante quando a métrica financeira estiver positiva', isCorrect: false },
        { id: 'opt-7-e', letter: 'E', text: 'Aplicável exclusivamente a setores de marketing institucional', isCorrect: false },
      ],
      explanation: 'Feedback contínuo de usuários é a métrica mais confiável de evolução e qualidade.',
    },
    {
      id: 'q-8',
      title: 'Em um pipeline de integração contínua (CI/CD), qual fase deve anteceder o deploy em produção?',
      type: 'assertiva',
      selectionType: 'unica',
      points: 1,
      options: [
        { id: 'opt-8-a', letter: 'A', text: 'Execução automatizada de testes unitários, de integração e checagem de lint', isCorrect: true },
        { id: 'opt-8-b', letter: 'B', text: 'Exclusão dos backups de banco de dados para economizar espaço', isCorrect: false },
        { id: 'opt-8-c', letter: 'C', text: 'Desligamento imediato dos servidores sem aviso prévio', isCorrect: false },
        { id: 'opt-8-d', letter: 'D', text: 'Deploy direto da máquina local sem registro no repositório', isCorrect: false },
        { id: 'opt-8-e', letter: 'E', text: 'Remoção de todas as variáveis de ambiente secretas', isCorrect: false },
      ],
      explanation: 'Testes automatizados asseguram que novos deploys não quebrem funcionalidades existentes.',
    },
    {
      id: 'q-9',
      title: 'Quais boas práticas devem ser aplicadas ao desenhar interfaces acessíveis e inclusivas?',
      type: 'assertiva',
      selectionType: 'multipla',
      points: 2,
      options: [
        { id: 'opt-9-a', letter: 'A', text: 'Contraste cromático adequado de acordo com as diretrizes WCAG AA', isCorrect: true },
        { id: 'opt-9-b', letter: 'B', text: 'Navegabilidade completa por teclado e foco visual destacado', isCorrect: true },
        { id: 'opt-9-c', letter: 'C', text: 'Textos alternativos em imagens e tags semânticas no HTML', isCorrect: true },
        { id: 'opt-9-d', letter: 'D', text: 'Uso de texto com tamanho menor que 9px para caber mais conteúdo', isCorrect: false },
        { id: 'opt-9-e', letter: 'E', text: 'Desabilitar leitores de tela para proteger o design visual', isCorrect: false },
      ],
      explanation: 'Acessibilidade universal garante usabilidade plena para todos os tipos de usuários e dispositivos.',
    },
    {
      id: 'q-10',
      title: 'O que caracteriza a conclusão com excelência e emissão do certificado com validação oficial?',
      type: 'assertiva',
      selectionType: 'unica',
      points: 2,
      options: [
        { id: 'opt-10-a', letter: 'A', text: 'Aproveitamento mínimo de 80% na avaliação final, dados do aluno e assinatura cadastrados', isCorrect: true },
        { id: 'opt-10-b', letter: 'B', text: 'Apenas visualização rápida da introdução sem realizar os testes práticos', isCorrect: false },
        { id: 'opt-10-c', letter: 'C', text: 'Acerto de apenas 30% das questões sem revisão de conteúdo', isCorrect: false },
        { id: 'opt-10-d', letter: 'D', text: 'Emissão manual sem autenticação criptográfica ou QR Code', isCorrect: false },
        { id: 'opt-10-e', letter: 'E', text: 'Certificado emitido sem identificação de CPF e registro da instituição', isCorrect: false },
      ],
      explanation: 'A emissão de certificação válida exige rigor acadêmico com no mínimo 80% de acerto e dados completos.',
    },
  ];

  const [examTitle, setExamTitle] = useState(
    initialExam?.title || `Avaliação Final & Prova de Certificação: ${courseTitle}`
  );
  const [examDescription, setExamDescription] = useState(
    initialExam?.description ||
      'Prova obrigatória para conclusão do curso e emissão do Certificado Oficial Deds Academy. Exige aproveitamento mínimo de 80% e permite até 3 tentativas com feedback imediato.'
  );
  const [minPassingPercent, setMinPassingPercent] = useState<number>(
    initialExam?.minPassingPercent || 80
  );
  const [maxAttempts, setMaxAttempts] = useState<number>(
    initialExam?.maxAttempts || 3
  );
  const [immediateResult, setImmediateResult] = useState<boolean>(
    initialExam?.immediateResult !== undefined ? initialExam.immediateResult : true
  );
  const [allowRetake, setAllowRetake] = useState<boolean>(
    initialExam?.allowRetake !== undefined ? initialExam.allowRetake : true
  );

  // Satisfaction Survey requirement for certificate issuance (mandatory requirement)
  const [requireSatisfactionSurvey, setRequireSatisfactionSurvey] = useState<boolean>(
    initialExam?.requireSatisfactionSurvey !== undefined ? initialExam.requireSatisfactionSurvey : true
  );
  const [satisfactionPrompt, setSatisfactionPrompt] = useState<string>(
    initialExam?.satisfactionQuestion?.prompt ||
      'Avalie a qualidade geral desta formação e a didática do instrutor (obrigatório para liberação do certificado):'
  );
  const [satisfactionType, setSatisfactionType] = useState<'nps' | 'stars' | 'text'>(
    initialExam?.satisfactionQuestion?.type || 'stars'
  );

  const [questions, setQuestions] = useState<CourseExamQuestion[]>(
    initialExam?.questions && initialExam.questions.length > 0
      ? initialExam.questions
      : getDefaultQuestions()
  );

  // Active question selected for detailed editing (0-indexed)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  const currentQuestion = questions[activeQuestionIndex] || questions[0];

  // Handler to update current question fields
  const handleUpdateCurrentQuestion = (partial: Partial<CourseExamQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === activeQuestionIndex ? { ...q, ...partial } : q))
    );
  };

  // Add new question (button on top right as requested)
  const handleAddQuestion = () => {
    const nextNumber = questions.length + 1;
    const newQuestion: CourseExamQuestion = {
      id: `q-${Date.now()}`,
      title: `Questão ${nextNumber}: Descreva o enunciado da questão para a avaliação final...`,
      type: 'assertiva',
      selectionType: 'unica',
      points: 1,
      options: [
        { id: `opt-${Date.now()}-a`, letter: 'A', text: 'Alternativa A (Gabarito correto)', isCorrect: true },
        { id: `opt-${Date.now()}-b`, letter: 'B', text: 'Alternativa B', isCorrect: false },
        { id: `opt-${Date.now()}-c`, letter: 'C', text: 'Alternativa C', isCorrect: false },
        { id: `opt-${Date.now()}-d`, letter: 'D', text: 'Alternativa D', isCorrect: false },
        { id: `opt-${Date.now()}-e`, letter: 'E', text: 'Alternativa E', isCorrect: false },
      ],
      explanation: 'Justificativa pedagógica da resposta para o aluno.',
    };

    setQuestions((prev) => [...prev, newQuestion]);
    setActiveQuestionIndex(questions.length); // Switch to newly created question
  };

  // Remove question
  const handleDeleteCurrentQuestion = (indexToDelete: number) => {
    if (questions.length <= 1) {
      alert('A prova final deve conter no mínimo 1 questão cadastrada.');
      return;
    }
    const updated = questions.filter((_, idx) => idx !== indexToDelete);
    setQuestions(updated);
    setActiveQuestionIndex((prev) => Math.min(prev, updated.length - 1));
  };

  // Option handlers for current question
  const handleAddOption = () => {
    if (!currentQuestion) return;
    const nextLetter = String.fromCharCode(65 + currentQuestion.options.length);
    const newOption: CourseExamOption = {
      id: `opt-${Date.now()}-${nextLetter.toLowerCase()}`,
      letter: nextLetter,
      text: `Nova Alternativa ${nextLetter}`,
      isCorrect: false,
    };
    handleUpdateCurrentQuestion({
      options: [...currentQuestion.options, newOption],
    });
  };

  const handleUpdateOption = (optId: string, text: string) => {
    if (!currentQuestion) return;
    const updatedOptions = currentQuestion.options.map((opt) =>
      opt.id === optId ? { ...opt, text } : opt
    );
    handleUpdateCurrentQuestion({ options: updatedOptions });
  };

  const handleToggleOptionCorrect = (optId: string) => {
    if (!currentQuestion) return;
    let updatedOptions: CourseExamOption[];
    if (currentQuestion.selectionType === 'unica') {
      // Radio mode: only this one is correct
      updatedOptions = currentQuestion.options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === optId,
      }));
    } else {
      // Multiple checkboxes mode
      updatedOptions = currentQuestion.options.map((opt) =>
        opt.id === optId ? { ...opt, isCorrect: !opt.isCorrect } : opt
      );
    }
    handleUpdateCurrentQuestion({ options: updatedOptions });
  };

  const handleDeleteOption = (optId: string) => {
    if (!currentQuestion || currentQuestion.options.length <= 2) {
      alert('Uma questão precisa de no mínimo 2 alternativas.');
      return;
    }
    const filtered = currentQuestion.options.filter((opt) => opt.id !== optId);
    // Re-letter
    const relettered = filtered.map((opt, idx) => ({
      ...opt,
      letter: String.fromCharCode(65 + idx),
    }));
    handleUpdateCurrentQuestion({ options: relettered });
  };

  // Compile full exam object
  const buildExamObject = (status: 'publicado' | 'rascunho'): CourseFinalExam => ({
    id: initialExam?.id || `exam-${Date.now()}`,
    title: examTitle,
    description: examDescription,
    minPassingPercent,
    maxAttempts,
    immediateResult,
    allowRetake,
    status,
    questions,
    updatedAt: new Date().toISOString(),
    requireSatisfactionSurvey,
    satisfactionQuestion: {
      enabled: requireSatisfactionSurvey,
      requiredForCertificate: requireSatisfactionSurvey,
      prompt: satisfactionPrompt,
      type: satisfactionType,
    },
  });

  // Calculate total points
  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 1), 0);

  return (
    <div className="space-y-6">
      {/* Step Indicator Header: Step 4 */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-surface-raised border border-border-subtle rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-2xl">assignment_turned_in</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                Etapa 4 de 4 • Prova Final Obrigatória
              </span>
              <span className="text-xs text-text-tertiary">|</span>
              <span className="text-xs font-bold text-accent-emerald-bright">
                {minPassingPercent}% de acerto mínimo para Certificado
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mt-0.5">
              Prova Final do Curso &amp; Certificação Oficial: {courseTitle}
            </h2>
          </div>
        </div>

        {/* Top Right "Adicionar Questão" button as requested */}
        <button
          type="button"
          onClick={handleAddQuestion}
          className="px-4 py-2.5 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          title="Adicionar nova questão à prova final"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>Adicionar Questão</span>
        </button>
      </div>

      {/* Evaluation Parameters Card: Nota Mínima, Tentativas, Visualização do Resultado, Questão de Satisfação */}
      <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-amber-400 text-base">tune</span>
            Parâmetros de Avaliação, Tentativas &amp; Liberação de Certificado
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Regras de Conclusão
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">
              Nota Mínima de Aprovação (%)
            </label>
            <input
              type="number"
              min={50}
              max={100}
              value={minPassingPercent}
              onChange={(e) => setMinPassingPercent(Number(e.target.value))}
              className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono font-bold"
            />
            <span className="text-[10px] text-text-tertiary">Padrão acadêmico: 80%</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">
              Quantidade de Tentativas
            </label>
            <select
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer font-bold"
            >
              <option value={1}>1 Tentativa Única</option>
              <option value={2}>2 Tentativas</option>
              <option value={3}>3 Tentativas (Recomendado)</option>
              <option value={5}>5 Tentativas</option>
              <option value={0}>Tentativas Ilimitadas</option>
            </select>
            <span className="text-[10px] text-text-tertiary">Por aluno matriculado</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">
              Visualização do Resultado
            </label>
            <select
              value={immediateResult ? 'sim' : 'nao'}
              onChange={(e) => setImmediateResult(e.target.value === 'sim')}
              className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer"
            >
              <option value="sim">Imediata (Mostra nota e gabarito)</option>
              <option value="nao">Oculta (Apenas nota final sem gabarito)</option>
            </select>
            <span className="text-[10px] text-text-tertiary">Feedback didático imediato</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">
              Permitir Refazer Prova
            </label>
            <select
              value={allowRetake ? 'sim' : 'nao'}
              onChange={(e) => setAllowRetake(e.target.value === 'sim')}
              className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer"
            >
              <option value="sim">Sim, caso não atinja nota mínima</option>
              <option value="nao">Não, encerra na última tentativa</option>
            </select>
            <span className="text-[10px] text-text-tertiary">Respeitando limite de tentativas</span>
          </div>
        </div>

        {/* Questão de Satisfação Obrigatória para Certificado */}
        <div className="p-4 rounded-xl bg-surface-overlay border border-amber-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                ★
              </span>
              <div>
                <h4 className="text-xs font-bold text-text-primary">
                  Obrigatoriedade de Responder a Questão de Satisfação para Liberação do Certificado
                </h4>
                <p className="text-[11px] text-text-tertiary">
                  O aluno deverá responder obrigatoriamente a esta pesquisa para ter o certificado desbloqueado
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-medium">
                {requireSatisfactionSurvey ? 'Obrigatória Ativa' : 'Opcional'}
              </span>
              <button
                type="button"
                onClick={() => setRequireSatisfactionSurvey(!requireSatisfactionSurvey)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  requireSatisfactionSurvey ? 'bg-amber-500 justify-end' : 'bg-surface-raised border border-border-subtle justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
              </button>
            </div>
          </div>

          {requireSatisfactionSurvey && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-border-subtle/60">
              <div className="sm:col-span-8">
                <label className="block text-[11px] font-bold text-text-secondary mb-1">
                  Enunciado da Pergunta de Satisfação
                </label>
                <input
                  type="text"
                  value={satisfactionPrompt}
                  onChange={(e) => setSatisfactionPrompt(e.target.value)}
                  placeholder="Ex: Como você avalia a didática e o conteúdo do curso?"
                  className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-text-secondary mb-1">
                  Formato da Avaliação
                </label>
                <select
                  value={satisfactionType}
                  onChange={(e) => setSatisfactionType(e.target.value as 'nps' | 'stars' | 'text')}
                  className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer"
                >
                  <option value="stars">1 a 5 Estrelas ★★★★★</option>
                  <option value="nps">Escala NPS de 0 a 10</option>
                  <option value="text">Comentário / Feedback Dissertativo</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary of Evaluation Specs (Resumo da Avaliação as required by user) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm">
        <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle/70">
          <span className="text-[10px] uppercase font-bold text-text-tertiary block">
            Total de Questões
          </span>
          <span className="text-lg font-bold text-text-primary mt-0.5 block font-mono">
            {questions.length} Questões
          </span>
          <span className="text-[10px] text-text-tertiary">Mínimo 10 configuradas</span>
        </div>

        <div className="p-3 rounded-xl bg-surface-overlay border border-accent-emerald-bright/30">
          <span className="text-[10px] uppercase font-bold text-accent-emerald-bright block">
            Nota Mínima de Aprovação
          </span>
          <span className="text-lg font-bold text-accent-emerald-bright mt-0.5 block font-mono">
            {minPassingPercent}% de Acerto
          </span>
          <span className="text-[10px] text-text-tertiary">Obrigatório p/ certificado</span>
        </div>

        <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle/70">
          <span className="text-[10px] uppercase font-bold text-text-tertiary block">
            Tentativas Permitidas
          </span>
          <span className="text-lg font-bold text-text-primary mt-0.5 block font-mono">
            {maxAttempts} Tentativas
          </span>
          <span className="text-[10px] text-text-tertiary">Por aluno cadastrado</span>
        </div>

        <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle/70">
          <span className="text-[10px] uppercase font-bold text-text-tertiary block">
            Resultado Imediato
          </span>
          <span className="text-lg font-bold text-text-primary mt-0.5 block flex items-center gap-1">
            <span className="material-symbols-outlined text-base text-accent-emerald-bright">check_circle</span>
            <span>{immediateResult ? 'Sim' : 'Não'}</span>
          </span>
          <span className="text-[10px] text-text-tertiary">Gabarito e feedback</span>
        </div>

        <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle/70">
          <span className="text-[10px] uppercase font-bold text-text-tertiary block">
            Permitir Refazer
          </span>
          <span className="text-lg font-bold text-text-primary mt-0.5 block flex items-center gap-1">
            <span className="material-symbols-outlined text-base text-accent-emerald-bright">check_circle</span>
            <span>{allowRetake ? 'Sim' : 'Não'}</span>
          </span>
          <span className="text-[10px] text-text-tertiary">Pontuação total: {totalPoints} pts</span>
        </div>
      </div>

      {/* Main Form: Active Question Editor */}
      {currentQuestion && (
        <div className="p-5 sm:p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-6">
          {/* Header of Question */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0">
                {activeQuestionIndex + 1}
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Editando Questão {activeQuestionIndex + 1} de {questions.length}
                </h3>
                <span className="text-[11px] text-text-tertiary">
                  Configure o título, tipo da questão, tipo de resposta, pontuação e alternativas.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDeleteCurrentQuestion(activeQuestionIndex)}
                className="px-3 py-1.5 rounded-xl bg-status-danger/10 text-status-danger hover:bg-status-danger/20 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                title="Excluir esta questão"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                <span>Excluir Questão</span>
              </button>
            </div>
          </div>

          {/* 1. Título da Questão */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">
              Título / Enunciado da Questão <span className="text-status-danger">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={currentQuestion.title}
              onChange={(e) => handleUpdateCurrentQuestion({ title: e.target.value })}
              placeholder="Digite o enunciado detalhado da questão da prova final..."
              className="w-full px-4 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary font-medium"
            />
          </div>

          {/* 2. Parameters: Tipo da Questão, Tipo de Resposta, Valor da Questão */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tipo da Questão: Assertiva ou Opinião */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Tipo da Questão
              </label>
              <select
                value={currentQuestion.type}
                onChange={(e) =>
                  handleUpdateCurrentQuestion({
                    type: e.target.value as 'assertiva' | 'opiniao',
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary outline-none focus:border-primary cursor-pointer"
              >
                <option value="assertiva">Assertiva (Certo / Errado / Avaliativo)</option>
                <option value="opiniao">Opinião / Análise Crítica</option>
              </select>
            </div>

            {/* Resposta: Única ou Múltipla */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Tipo de Resposta
              </label>
              <select
                value={currentQuestion.selectionType}
                onChange={(e) =>
                  handleUpdateCurrentQuestion({
                    selectionType: e.target.value as 'unica' | 'multipla',
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary outline-none focus:border-primary cursor-pointer"
              >
                <option value="unica">Resposta Única (1 alternativa correta)</option>
                <option value="multipla">Múltipla Resposta (Mais de 1 correta)</option>
              </select>
            </div>

            {/* Valor da questão editável: 1 ponto, 2 ponto, 3 ponto... */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Valor da Questão
              </label>
              <select
                value={currentQuestion.points}
                onChange={(e) =>
                  handleUpdateCurrentQuestion({
                    points: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary outline-none focus:border-primary cursor-pointer font-bold"
              >
                <option value={1}>1 Ponto</option>
                <option value={2}>2 Pontos</option>
                <option value={3}>3 Pontos</option>
                <option value={4}>4 Pontos</option>
                <option value={5}>5 Pontos</option>
                <option value={10}>10 Pontos</option>
              </select>
            </div>
          </div>

          {/* 3. Alternativas A B C D E com caixinhas laterais para marcar */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">format_list_bulleted</span>
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Alternativas da Questão (Marque na caixinha lateral o gabarito correto)
                </h4>
              </div>

              {/* Botão de adicionar assertiva/alternativa */}
              <button
                type="button"
                onClick={handleAddOption}
                className="px-3 py-1.5 rounded-xl bg-surface-overlay hover:bg-surface-container text-primary border border-border-subtle text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Adicionar mais uma alternativa (F, G...)"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Adicionar Alternativa</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {currentQuestion.options.map((opt) => {
                const isRadio = currentQuestion.selectionType === 'unica';

                return (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      opt.isCorrect
                        ? 'bg-accent-emerald-bright/10 border-accent-emerald-bright/50 text-accent-emerald-bright'
                        : 'bg-surface-overlay border-border-subtle'
                    }`}
                  >
                    {/* Lateral checkbox / radio to mark correct answer */}
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type={isRadio ? 'radio' : 'checkbox'}
                        name={`exam-correct-${currentQuestion.id}`}
                        checked={opt.isCorrect}
                        onChange={() => handleToggleOptionCorrect(opt.id)}
                        className="w-4 h-4 text-accent-emerald-bright rounded cursor-pointer focus:ring-0"
                        title={opt.isCorrect ? 'Alternativa marcada como Gabarito Correto' : 'Marcar como Gabarito Correto'}
                      />
                      <span className="w-6 h-6 rounded-lg bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary flex items-center justify-center font-mono">
                        {opt.letter}
                      </span>
                    </div>

                    {/* Alternativa text input */}
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleUpdateOption(opt.id, e.target.value)}
                      placeholder={`Texto da alternativa ${opt.letter}...`}
                      className="flex-1 px-3 py-1.5 bg-surface-base border border-border-subtle rounded-lg text-xs sm:text-sm text-text-primary outline-none focus:border-primary"
                    />

                    {/* Correct badge tag */}
                    {opt.isCorrect && (
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-accent-emerald-bright/20 text-accent-emerald-bright border border-accent-emerald-bright/30 shrink-0 hidden sm:inline">
                        Gabarito Correto
                      </span>
                    )}

                    {/* Delete option */}
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(opt.id)}
                      className="p-1.5 rounded-lg text-text-tertiary hover:text-status-danger hover:bg-surface-raised transition-colors cursor-pointer shrink-0"
                      title="Remover alternativa"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explicação pedagógica opcional */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">
              Explicação / Justificativa Pedagógica do Gabarito (Exibida imediatamente após envio)
            </label>
            <input
              type="text"
              value={currentQuestion.explanation || ''}
              onChange={(e) => handleUpdateCurrentQuestion({ explanation: e.target.value })}
              placeholder="Ex: O princípio da responsabilidade única prevê que cada módulo tenha apenas uma razão para mudar."
              className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
            />
          </div>

          {/* ========================================================================= */}
          {/* BOTÕES REDONDOS 1 2 3 4 5 ATÉ A QUANTIDADE DE QUESTÕES (EMBAIXO DA QUESTÃO) */}
          {/* ========================================================================= */}
          <div className="pt-4 border-t border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-sm">pin</span>
                Navegação Rápida entre Questões da Prova ({questions.length} Cadastradas)
              </span>
              <span className="text-[11px] text-text-tertiary">
                Clique no número para editar a questão
              </span>
            </div>

            {/* Circular buttons numbered 1, 2, 3, 4, 5... as requested */}
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {questions.map((q, idx) => {
                const isActive = idx === activeQuestionIndex;
                const hasCorrect = q.options.some((o) => o.isCorrect);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-sm relative ${
                      isActive
                        ? 'bg-primary text-on-primary ring-2 ring-primary/40 scale-105'
                        : hasCorrect
                        ? 'bg-surface-overlay border border-border-subtle text-text-primary hover:border-primary'
                        : 'bg-status-danger/10 border border-status-danger/30 text-status-danger hover:bg-status-danger/20'
                    }`}
                    title={`Questão ${idx + 1}: ${q.title.slice(0, 40)}... (${q.points} pt)`}
                  >
                    <span>{idx + 1}</span>
                    {/* Little dot if has correct answer */}
                    {hasCorrect && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald-bright absolute bottom-1"></span>
                    )}
                  </button>
                );
              })}

              {/* Quick Add Button next to numbers */}
              <button
                type="button"
                onClick={handleAddQuestion}
                className="w-10 h-10 rounded-full border border-dashed border-border-subtle hover:border-primary text-text-tertiary hover:text-primary flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                title="Adicionar mais uma questão"
              >
                <span className="material-symbols-outlined text-base">add</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions: Voltar para Quizzes dos Módulos, Salvar Rascunho, Publicar Avaliação (Resultado Imediato) */}
      <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToQuizzes}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Voltar para Quizzes dos Módulos</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Light blue Save Draft button */}
          <button
            type="button"
            onClick={() => onSaveDraft(buildExamObject('rascunho'))}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Salvar avaliação e curso como rascunho"
          >
            <span className="material-symbols-outlined text-base">draft</span>
            <span>Salvar Rascunho</span>
          </button>

          {/* Green Publish Exam button */}
          <button
            type="button"
            onClick={() => onPublishExam(buildExamObject('publicado'))}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            title="Publicar avaliação final e liberar curso com certificado no catálogo"
          >
            <span className="material-symbols-outlined text-base">verified</span>
            <span>Publicar Avaliação &amp; Concluir Curso</span>
          </button>
        </div>
      </div>
    </div>
  );
};
