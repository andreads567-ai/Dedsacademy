import React, { useState } from 'react';
import { CourseModule, ModuleQuiz, ModuleQuizQuestion, ModuleQuizOption } from '../../types';

interface ModuleQuizManagerProps {
  courseTitle: string;
  modules: CourseModule[];
  onChangeModules: (modules: CourseModule[]) => void;
  onBackToLessons: () => void;
  onSaveDraft: () => void;
  onProceedToExam: () => void;
}

export const ModuleQuizManager: React.FC<ModuleQuizManagerProps> = ({
  courseTitle,
  modules,
  onChangeModules,
  onBackToLessons,
  onSaveDraft,
  onProceedToExam,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || '');

  const currentModule = modules.find((m) => m.id === selectedModuleId) || modules[0];

  // Helper to ensure a module has a quiz object initialized
  const getModuleQuiz = (mod: CourseModule): ModuleQuiz => {
    if (mod.quiz) return mod.quiz;
    return {
      id: `quiz-mod-${mod.id}`,
      title: `Quiz de Fixação: ${mod.title}`,
      enabled: true,
      maxAttempts: 3,
      passingScore: 70,
      questions: [
        {
          id: `q-${Date.now()}-1`,
          question: `Sobre os conceitos principais abordados no ${mod.title}, assinale a alternativa correta:`,
          type: 'unica',
          weight: 2,
          options: [
            { id: 'opt-1', letter: 'A', text: 'Aplicação prática e metodologia assertiva', isCorrect: true },
            { id: 'opt-2', letter: 'B', text: 'Conceito sem aplicabilidade prática ou de mercado', isCorrect: false },
            { id: 'opt-3', letter: 'C', text: 'Abordagem descontinuada em projetos modernos', isCorrect: false },
            { id: 'opt-4', letter: 'D', text: 'Nenhuma das alternativas anteriores', isCorrect: false },
          ],
          explanation: 'Esta questão avalia a compreensão sólida das diretrizes práticas do módulo.',
        },
      ],
    };
  };

  const activeQuiz = currentModule ? getModuleQuiz(currentModule) : null;

  // Update current module's quiz
  const handleUpdateQuiz = (partial: Partial<ModuleQuiz>) => {
    if (!currentModule || !activeQuiz) return;
    const updatedQuiz: ModuleQuiz = { ...activeQuiz, ...partial };
    const updatedModules = modules.map((m) =>
      m.id === currentModule.id ? { ...m, quiz: updatedQuiz } : m
    );
    onChangeModules(updatedModules);
  };

  // Toggle Quiz for current module
  const handleToggleQuiz = (enabled: boolean) => {
    if (!currentModule) return;
    const quiz = getModuleQuiz(currentModule);
    handleUpdateQuiz({ ...quiz, enabled });
  };

  // Add question to active quiz
  const handleAddQuestion = () => {
    if (!activeQuiz) return;
    const nextNum = activeQuiz.questions.length + 1;
    const newQ: ModuleQuizQuestion = {
      id: `q-${Date.now()}`,
      question: `Pergunta ${nextNum}: Digite o enunciado da questão avaliativa...`,
      type: 'unica',
      weight: 2,
      options: [
        { id: `opt-${Date.now()}-a`, letter: 'A', text: 'Alternativa A (Gabarito Correto)', isCorrect: true },
        { id: `opt-${Date.now()}-b`, letter: 'B', text: 'Alternativa B', isCorrect: false },
        { id: `opt-${Date.now()}-c`, letter: 'C', text: 'Alternativa C', isCorrect: false },
        { id: `opt-${Date.now()}-d`, letter: 'D', text: 'Alternativa D', isCorrect: false },
      ],
      explanation: 'Justificativa da resposta correta.',
    };
    handleUpdateQuiz({ questions: [...activeQuiz.questions, newQ] });
  };

  // Update specific question
  const handleUpdateQuestion = (qId: string, partial: Partial<ModuleQuizQuestion>) => {
    if (!activeQuiz) return;
    const updatedQuestions = activeQuiz.questions.map((q) =>
      q.id === qId ? { ...q, ...partial } : q
    );
    handleUpdateQuiz({ questions: updatedQuestions });
  };

  // Delete question
  const handleDeleteQuestion = (qId: string) => {
    if (!activeQuiz) return;
    if (activeQuiz.questions.length <= 1) {
      alert('O quiz do módulo deve conter ao menos 1 questão.');
      return;
    }
    const updatedQuestions = activeQuiz.questions.filter((q) => q.id !== qId);
    handleUpdateQuiz({ questions: updatedQuestions });
  };

  // Add option to question
  const handleAddOption = (qId: string) => {
    if (!activeQuiz) return;
    const q = activeQuiz.questions.find((x) => x.id === qId);
    if (!q) return;
    const nextLetter = String.fromCharCode(65 + q.options.length);
    const newOpt: ModuleQuizOption = {
      id: `opt-${Date.now()}`,
      letter: nextLetter,
      text: `Nova Alternativa ${nextLetter}`,
      isCorrect: false,
    };
    handleUpdateQuestion(qId, { options: [...q.options, newOpt] });
  };

  // Update option text
  const handleUpdateOption = (qId: string, optId: string, text: string) => {
    if (!activeQuiz) return;
    const q = activeQuiz.questions.find((x) => x.id === qId);
    if (!q) return;
    const updatedOptions = q.options.map((opt) => (opt.id === optId ? { ...opt, text } : opt));
    handleUpdateQuestion(qId, { options: updatedOptions });
  };

  // Toggle option correct state (supports single choice radio or multiple choice checkboxes)
  const handleToggleOptionCorrect = (qId: string, optId: string) => {
    if (!activeQuiz) return;
    const q = activeQuiz.questions.find((x) => x.id === qId);
    if (!q) return;

    let updatedOptions: ModuleQuizOption[];
    if (q.type === 'unica') {
      // Radio mode: only this option is correct
      updatedOptions = q.options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === optId,
      }));
    } else {
      // Multiple choice mode
      updatedOptions = q.options.map((opt) =>
        opt.id === optId ? { ...opt, isCorrect: !opt.isCorrect } : opt
      );
    }
    handleUpdateQuestion(qId, { options: updatedOptions });
  };

  // Delete option
  const handleDeleteOption = (qId: string, optId: string) => {
    if (!activeQuiz) return;
    const q = activeQuiz.questions.find((x) => x.id === qId);
    if (!q || q.options.length <= 2) {
      alert('Uma questão precisa ter pelo menos 2 alternativas.');
      return;
    }
    const filtered = q.options.filter((opt) => opt.id !== optId);
    const relettered = filtered.map((opt, idx) => ({
      ...opt,
      letter: String.fromCharCode(65 + idx),
    }));
    handleUpdateQuestion(qId, { options: relettered });
  };

  // Total points for current quiz
  const currentTotalWeight = activeQuiz?.questions.reduce((acc, q) => acc + (q.weight || 1), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-raised border border-border-subtle rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-2xl">quiz</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-wider">
                Etapa 3 de 4 • Quizzes de Módulo
              </span>
              <span className="text-xs text-text-tertiary">|</span>
              <span className="text-xs font-bold text-accent-emerald-bright">
                Pesos &amp; Alternativas Únicas / Múltiplas
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mt-0.5">
              Gestão de Quizzes por Módulo: {courseTitle || 'Novo Curso'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Módulos com quiz ativo:</span>
          <span className="px-2.5 py-1 rounded-full bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30 text-xs font-bold font-mono">
            {modules.filter((m) => m.quiz?.enabled !== false).length} / {modules.length}
          </span>
        </div>
      </div>

      {/* Split-pane layout: Left Modules list, Right Quiz Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Modules List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-3 bg-surface-raised border border-border-subtle rounded-2xl">
            <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-border-subtle pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Selecione o Módulo
              </span>
              <span className="text-[11px] text-text-tertiary">{modules.length} módulos</span>
            </div>

            <div className="space-y-2">
              {modules.map((mod, idx) => {
                const isSelected = mod.id === selectedModuleId;
                const modQuiz = mod.quiz;
                const isEnabled = modQuiz?.enabled !== false;
                const qCount = modQuiz?.questions.length || 1;
                const totalPts = modQuiz?.questions.reduce((acc, q) => acc + (q.weight || 1), 0) || 2;

                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-500/50 shadow-sm ring-1 ring-purple-500/30'
                        : 'bg-surface-overlay border-border-subtle hover:border-border-subtle/80 hover:bg-surface-raised'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-surface-raised border border-border-subtle text-text-secondary'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-text-primary truncate">
                          {mod.title}
                        </h4>
                        {isEnabled ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30 shrink-0">
                            Quiz Ativo
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-raised text-text-tertiary border border-border-subtle shrink-0">
                            Sem Quiz
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-text-tertiary">
                        <span>{mod.lessons.length} aulas</span>
                        <span>•</span>
                        <span className="font-mono">{isEnabled ? `${qCount} questões (${totalPts} pts)` : 'Opcional'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Quiz Configuration for Selected Module */}
        <div className="lg:col-span-8 space-y-6">
          {currentModule && activeQuiz ? (
            <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
              {/* Module Quiz Header & Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      Configuração de Quiz
                    </span>
                    <span className="text-xs text-text-tertiary">•</span>
                    <span className="text-xs font-bold text-text-secondary">
                      {currentModule.title}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary mt-1">
                    Questionário de Fixação do Módulo
                  </h3>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-secondary">
                    {activeQuiz.enabled ? 'Quiz Habilitado' : 'Quiz Desabilitado'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleQuiz(!activeQuiz.enabled)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      activeQuiz.enabled ? 'bg-primary justify-end' : 'bg-surface-overlay border border-border-subtle justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                  </button>
                </div>
              </div>

              {activeQuiz.enabled ? (
                <>
                  {/* Quiz Details and Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        Título do Questionário
                      </label>
                      <input
                        type="text"
                        value={activeQuiz.title}
                        onChange={(e) => handleUpdateQuiz({ title: e.target.value })}
                        placeholder="Ex: Quiz de Fixação: Conceitos e Prática"
                        className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        Tentativas Permitidas
                      </label>
                      <select
                        value={activeQuiz.maxAttempts || 3}
                        onChange={(e) => handleUpdateQuiz({ maxAttempts: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer"
                      >
                        <option value={1}>1 Tentativa</option>
                        <option value={2}>2 Tentativas</option>
                        <option value={3}>3 Tentativas</option>
                        <option value={5}>5 Tentativas</option>
                        <option value={0}>Ilimitadas</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary Bar: Total Questions, Total Weight */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-overlay border border-border-subtle text-xs">
                    <div className="flex items-center gap-4">
                      <span className="text-text-secondary">
                        Questões cadastradas: <strong className="text-text-primary font-mono">{activeQuiz.questions.length}</strong>
                      </span>
                      <span className="text-text-tertiary">|</span>
                      <span className="text-text-secondary">
                        Soma dos pesos / Pontos: <strong className="text-accent-emerald-bright font-mono">{currentTotalWeight} pts</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Adicionar Questão</span>
                    </button>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    {activeQuiz.questions.map((q, qIdx) => (
                      <div
                        key={q.id}
                        className="p-4 sm:p-5 rounded-2xl bg-surface-overlay border border-border-subtle space-y-4 shadow-xs"
                      >
                        {/* Question Top Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center">
                              {qIdx + 1}
                            </span>
                            <span className="text-xs font-bold text-text-primary">
                              Questão {qIdx + 1} do Quiz
                            </span>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Type of Response: Única ou Múltiplas */}
                            <div className="flex items-center gap-1.5 bg-surface-raised p-1 rounded-xl border border-border-subtle">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuestion(q.id, { type: 'unica' })}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  q.type === 'unica'
                                    ? 'bg-purple-500 text-white shadow-xs'
                                    : 'text-text-tertiary hover:text-text-primary'
                                }`}
                                title="Apenas uma alternativa correta (Radio)"
                              >
                                Resposta Única
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuestion(q.id, { type: 'multipla' })}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  q.type === 'multipla'
                                    ? 'bg-purple-500 text-white shadow-xs'
                                    : 'text-text-tertiary hover:text-text-primary'
                                }`}
                                title="Múltiplas alternativas corretas (Checkboxes)"
                              >
                                Múltiplas Respostas
                              </button>
                            </div>

                            {/* Weight / Points of this question */}
                            <div className="flex items-center gap-1 bg-surface-raised px-2 py-1 rounded-xl border border-border-subtle">
                              <span className="text-[11px] font-bold text-text-secondary">Peso:</span>
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={q.weight || 1}
                                onChange={(e) =>
                                  handleUpdateQuestion(q.id, { weight: Math.max(1, Number(e.target.value)) })
                                }
                                className="w-12 px-1.5 py-0.5 bg-surface-overlay border border-border-subtle rounded text-center text-xs font-mono font-bold text-accent-emerald-bright outline-none focus:border-primary"
                              />
                              <span className="text-[10px] text-text-tertiary">pts</span>
                            </div>

                            {/* Delete Question */}
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 text-text-tertiary hover:text-status-danger rounded-lg hover:bg-status-danger/10 transition-colors cursor-pointer"
                              title="Excluir esta questão"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Question Prompt */}
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-1">
                            Enunciado da Questão
                          </label>
                          <textarea
                            rows={2}
                            value={q.question}
                            onChange={(e) => handleUpdateQuestion(q.id, { question: e.target.value })}
                            placeholder="Descreva a pergunta ou desafio do quiz..."
                            className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                          />
                        </div>

                        {/* Options List */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-text-secondary">
                              Alternativas (Marque a{q.type === 'multipla' ? 's corretas' : ' correta'}):
                            </label>
                            <span className="text-[10px] text-text-tertiary">
                              {q.type === 'unica' ? 'Seleção Única (Radio)' : 'Seleção Múltipla (Checkboxes)'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                  opt.isCorrect
                                    ? 'bg-accent-emerald-bright/10 border-accent-emerald-bright/40'
                                    : 'bg-surface-raised border-border-subtle'
                                }`}
                              >
                                {/* Correct check trigger */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleOptionCorrect(q.id, opt.id)}
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                                    opt.isCorrect
                                      ? 'bg-accent-emerald-bright text-black font-black'
                                      : 'bg-surface-overlay border border-border-subtle text-text-tertiary hover:border-accent-emerald-bright'
                                  }`}
                                  title={opt.isCorrect ? 'Gabarito Correto' : 'Marcar como Correta'}
                                >
                                  {opt.isCorrect ? (
                                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                                  ) : (
                                    <span className="text-[10px] font-bold font-mono">{opt.letter}</span>
                                  )}
                                </button>

                                {/* Letter indicator */}
                                <span className="text-xs font-bold text-text-secondary font-mono w-4">
                                  {opt.letter})
                                </span>

                                {/* Option Text */}
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => handleUpdateOption(q.id, opt.id, e.target.value)}
                                  placeholder="Texto da alternativa..."
                                  className="flex-1 px-2.5 py-1 bg-transparent border-none text-xs text-text-primary outline-none focus:ring-1 focus:ring-primary rounded"
                                />

                                {opt.isCorrect && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-emerald-bright/20 text-accent-emerald-bright border border-accent-emerald-bright/30 shrink-0">
                                    Correta
                                  </span>
                                )}

                                {/* Delete Option */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOption(q.id, opt.id)}
                                  className="p-1 text-text-tertiary hover:text-status-danger rounded transition-colors cursor-pointer"
                                  title="Remover alternativa"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddOption(q.id)}
                            className="px-3 py-1.5 rounded-lg border border-dashed border-border-subtle hover:border-primary text-text-secondary hover:text-primary text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>Adicionar Alternativa</span>
                          </button>
                        </div>

                        {/* Explanation Field */}
                        <div className="pt-2 border-t border-border-subtle/60">
                          <label className="block text-[11px] font-bold text-text-tertiary mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-primary">lightbulb</span>
                            Explicação Didática / Feedback da Resposta (Exibido após o aluno responder)
                          </label>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => handleUpdateQuestion(q.id, { explanation: e.target.value })}
                            placeholder="Ex: Esta alternativa está correta pois sintetiza as diretrizes da arquitetura..."
                            className="w-full px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-surface-overlay border border-border-subtle space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border-subtle text-text-tertiary flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-2xl">quiz</span>
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">
                    Quiz Desabilitado para o {currentModule.title}
                  </h4>
                  <p className="text-xs text-text-tertiary max-w-md mx-auto">
                    Este módulo não exigirá questionário intermediário. Caso queira avaliar os alunos antes da prova final, ative a opção acima.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleToggleQuiz(true)}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:brightness-110 cursor-pointer"
                  >
                    Ativar Quiz Neste Módulo
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-surface-raised border border-border-subtle text-text-tertiary">
              Nenhum módulo selecionado.
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation: Back to Lessons, Save Draft, Proceed to Final Exam */}
      <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToLessons}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Voltar para Módulos &amp; Aulas</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Salvar como Rascunho (azul claro)"
          >
            <span className="material-symbols-outlined text-base">draft</span>
            <span>Salvar Rascunho</span>
          </button>

          <button
            type="button"
            onClick={onProceedToExam}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            title="Prosseguir para a Prova Final Obrigatória de Certificação"
          >
            <span>Prosseguir para Prova Final</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
