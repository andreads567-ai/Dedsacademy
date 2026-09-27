import React, { useState, useEffect } from 'react';
import { UserAccount, Course, SupportTicket } from '../../types';

interface ManualTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: UserAccount[];
  courses: Course[];
  onOpenTicket: (ticket: SupportTicket) => void;
}

export const ManualTicketModal: React.FC<ManualTicketModalProps> = ({
  isOpen,
  onClose,
  students,
  courses,
  onOpenTicket,
}) => {
  // Input fields for searching / auto-populating student
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [cpfInput, setCpfInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Selected student data
  const [selectedStudent, setSelectedStudent] = useState<UserAccount | null>(null);

  // Ticket form fields
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Suporte Acadêmico & Dúvidas');
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('media');
  const [relatedCourseId, setRelatedCourseId] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [initialStatus, setInitialStatus] = useState<'aguardando_retorno' | 'respondido'>('aguardando_retorno');

  // Error / helper message
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Helper clean function for CPF (digits only)
  const cleanCpf = (str: string) => str.replace(/\D/g, '');

  // Auto-find student when inputs change
  const findStudentByCriteria = (
    code: string,
    cpf: string,
    name: string,
    triggerSource: 'code' | 'cpf' | 'name'
  ) => {
    let match: UserAccount | undefined;

    // 1. Match by Student Code (e.g. ALU-9842 or 9842 or id)
    if (code.trim()) {
      const q = code.trim().toLowerCase();
      match = students.find(
        (s) =>
          (s.studentCode && s.studentCode.toLowerCase() === q) ||
          s.id.toLowerCase() === q ||
          (s.studentCode && s.studentCode.toLowerCase().includes(q))
      );
    }

    // 2. Match by CPF (digits or formatted)
    if (!match && cpf.trim()) {
      const cleanInputCpf = cleanCpf(cpf);
      match = students.find((s) => {
        if (!s.cpf) return false;
        return (
          cleanCpf(s.cpf) === cleanInputCpf ||
          s.cpf.toLowerCase().includes(cpf.toLowerCase().trim())
        );
      });
    }

    // 3. Match by Name
    if (!match && name.trim().length >= 3) {
      const q = name.trim().toLowerCase();
      match = students.find((s) => s.name.toLowerCase().includes(q));
    }

    if (match) {
      setSelectedStudent(match);
      setSearchFeedback(`Aluno localizado: ${match.name}`);
      // Fill remaining fields if triggered by code or CPF
      if (triggerSource === 'code') {
        if (match.cpf) setCpfInput(match.cpf);
        setNameInput(match.name);
      } else if (triggerSource === 'cpf') {
        if (match.studentCode) setStudentCodeInput(match.studentCode);
        setNameInput(match.name);
      } else if (triggerSource === 'name') {
        if (match.studentCode) setStudentCodeInput(match.studentCode);
        if (match.cpf) setCpfInput(match.cpf);
      }
    } else {
      setSelectedStudent(null);
      if (code.trim() || cpf.trim() || name.trim().length >= 3) {
        setSearchFeedback('Nenhum aluno localizado com estes dados.');
      } else {
        setSearchFeedback(null);
      }
    }
  };

  const handleCodeChange = (val: string) => {
    setStudentCodeInput(val);
    findStudentByCriteria(val, cpfInput, nameInput, 'code');
  };

  const handleCpfChange = (val: string) => {
    setCpfInput(val);
    findStudentByCriteria(studentCodeInput, val, nameInput, 'cpf');
  };

  const handleNameChange = (val: string) => {
    setNameInput(val);
    findStudentByCriteria(studentCodeInput, cpfInput, val, 'name');
  };

  const handleSelectFromList = (studentId: string) => {
    const s = students.find((item) => item.id === studentId);
    if (s) {
      setSelectedStudent(s);
      setNameInput(s.name);
      setStudentCodeInput(s.studentCode || s.id);
      setCpfInput(s.cpf || '');
      setSearchFeedback(`Aluno selecionado: ${s.name}`);
    }
  };

  const handleResetForm = () => {
    setStudentCodeInput('');
    setCpfInput('');
    setNameInput('');
    setSelectedStudent(null);
    setSubject('');
    setCategory('Suporte Acadêmico & Dúvidas');
    setPriority('media');
    setRelatedCourseId('');
    setInitialMessage('');
    setInitialStatus('aguardando_retorno');
    setSearchFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent && !nameInput.trim()) {
      alert('Por favor, informe ao menos o nome do aluno ou localize-o por Código/CPF.');
      return;
    }

    if (!subject.trim()) {
      alert('Por favor, insira o assunto do chamado.');
      return;
    }

    if (!initialMessage.trim()) {
      alert('Por favor, digite a descrição ou mensagem inicial do atendimento.');
      return;
    }

    // Related course title
    const courseObj = courses.find((c) => c.id === relatedCourseId);

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const randomTicketNumber = Math.floor(100 + Math.random() * 900);
    const protocolCode = `DEDS-TK-2026-${randomTicketNumber}`;

    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      protocol: protocolCode,
      studentId: selectedStudent?.id || `student-manual-${Date.now()}`,
      studentCode: selectedStudent?.studentCode || studentCodeInput.trim() || `ALU-${randomTicketNumber}`,
      studentName: selectedStudent?.name || nameInput.trim(),
      studentEmail: selectedStudent?.email || `${nameInput.trim().toLowerCase().replace(/\s+/g, '.')}@aluno.com.br`,
      studentCpf: selectedStudent?.cpf || cpfInput.trim() || 'Não informado',
      studentPhone: selectedStudent?.phone || '(11) 98765-0000',
      studentStatus: selectedStudent?.status || 'ativo',
      courseId: relatedCourseId || undefined,
      courseTitle: courseObj ? courseObj.title : (relatedCourseId ? 'Plataforma Geral' : undefined),
      category: category,
      subject: subject.trim(),
      priority: priority,
      status: initialStatus,
      createdAt: formattedDate,
      updatedAt: formattedDate,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: initialStatus === 'respondido' ? 'suporte' : 'aluno',
          senderName: initialStatus === 'respondido' ? 'Equipe de Suporte Deds' : (selectedStudent?.name || nameInput.trim()),
          message: initialMessage.trim(),
          timestamp: formattedDate,
        },
      ],
    };

    onOpenTicket(newTicket);
    handleResetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-overlay">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">confirmation_number</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Abrir Chamado Manual de Suporte
              </h3>
              <p className="text-xs text-text-tertiary">
                Localização instantânea por Código, CPF ou Nome do Aluno
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-raised cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* SECTION 1: AUTO-FETCH STUDENT DATA */}
          <div className="p-4 rounded-xl bg-surface-overlay/90 border border-primary/20 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">person_search</span>
                1. Localizar Aluno (Puxa Automático)
              </span>
              {selectedStudent && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  Aluno Vinculado
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Field 1: Código do Aluno */}
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                  Código do Aluno
                </label>
                <input
                  type="text"
                  value={studentCodeInput}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="Ex: ALU-9842"
                  className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Field 2: CPF do Aluno */}
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                  CPF do Aluno
                </label>
                <input
                  type="text"
                  value={cpfInput}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  placeholder="Ex: 384.920.118-04"
                  className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Field 3: Nome do Aluno */}
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                  Nome do Aluno
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: André Silva"
                  className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Quick selector dropdown from existing students */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-text-tertiary whitespace-nowrap">Ou selecione:</span>
              <select
                onChange={(e) => handleSelectFromList(e.target.value)}
                value={selectedStudent?.id || ''}
                className="w-full bg-surface-raised border border-border-subtle rounded-lg px-2.5 py-1 text-xs text-text-secondary focus:outline-none focus:border-primary"
              >
                <option value="">-- Escolher aluno cadastrado --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.studentCode ? `(${st.studentCode})` : ''} - CPF: {st.cpf || 'N/D'}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-filled Student Details Card */}
            {selectedStudent ? (
              <div className="p-3.5 rounded-xl bg-surface-raised border border-border-subtle text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <strong className="text-text-primary text-sm">{selectedStudent.name}</strong>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-primary/10 text-primary">
                      {selectedStudent.studentCode || selectedStudent.id}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedStudent.status === 'ativo'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {selectedStudent.status?.toUpperCase() || 'ATIVO'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-text-secondary text-[11px]">
                  <div>
                    <span className="text-text-tertiary block">Email Cadastrado:</span>
                    <span className="font-medium text-text-primary">{selectedStudent.email}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block">Telefone / WhatsApp:</span>
                    <span className="font-medium text-text-primary">{selectedStudent.phone || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block">Cursos Matriculados:</span>
                    <span className="font-medium text-text-primary">
                      {selectedStudent.enrolledCourseIds?.length || 0} curso(s)
                    </span>
                  </div>
                </div>
              </div>
            ) : searchFeedback ? (
              <div className="text-[11px] text-amber-400 flex items-center gap-1.5 px-1">
                <span className="material-symbols-outlined text-sm">info</span>
                {searchFeedback}
              </div>
            ) : (
              <p className="text-[11px] text-text-tertiary">
                💡 Dica: Digite o Código do Aluno (ex: <code>ALU-9842</code>) ou CPF para preencher todos os dados cadastrais em tempo real.
              </p>
            )}
          </div>

          {/* SECTION 2: TICKET DETAILS */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              2. Informações do Atendimento
            </span>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Assunto do Chamado <span className="text-status-danger">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Dúvida na emissão do certificado ou problema de acesso"
                required
                className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Categoria / Setor
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="Suporte Acadêmico & Dúvidas">Suporte Acadêmico & Dúvidas</option>
                  <option value="Certificação & Documentos">Certificação & Documentos</option>
                  <option value="Acesso & Plataforma">Acesso & Plataforma</option>
                  <option value="Financeiro & Cobrança">Financeiro & Cobrança</option>
                  <option value="Material Didático">Material Didático</option>
                  <option value="Outros Assuntos">Outros Assuntos</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Status Inicial
                </label>
                <select
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value as any)}
                  className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="aguardando_retorno">Aguardando Retorno do Aluno</option>
                  <option value="respondido">Respondido (Equipe Deds)</option>
                </select>
              </div>
            </div>

            {/* Related Course */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Curso Relacionado (Opcional)
              </label>
              <select
                value={relatedCourseId}
                onChange={(e) => setRelatedCourseId(e.target.value)}
                className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="">Plataforma Geral / Nenhum curso específico</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Initial Message */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Mensagem / Descrição do Chamado <span className="text-status-danger">*</span>
              </label>
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Descreva detalhadamente a solicitação ou mensagem de abertura do atendimento..."
                rows={4}
                required
                className="w-full bg-surface-overlay border border-border-subtle rounded-xl p-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs text-text-tertiary hover:text-text-primary flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Limpar Campos
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-surface-overlay text-xs font-semibold text-text-secondary hover:text-text-primary border border-border-subtle cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                Registrar e Abrir Chamado
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
