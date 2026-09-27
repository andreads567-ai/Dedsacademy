import React, { useState, useMemo } from 'react';
import { SupportTicket, TicketMessage, UserAccount, Course } from '../../types';
import { ManualTicketModal } from './ManualTicketModal';

interface SupportTicketsTabProps {
  tickets: SupportTicket[];
  students: UserAccount[];
  courses: Course[];
  onUpdateTicket: (ticket: SupportTicket) => void;
  onOpenNewTicket: (ticket: SupportTicket) => void;
  onDeleteTicket?: (ticketId: string) => void;
}

export const SupportTicketsTab: React.FC<SupportTicketsTabProps> = ({
  tickets,
  students,
  courses,
  onUpdateTicket,
  onOpenNewTicket,
  onDeleteTicket,
}) => {
  // Active status filter: 'todos' | 'aguardando_retorno' | 'respondido' | 'finalizado'
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aguardando_retorno' | 'respondido' | 'finalizado'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('todas');

  // Manual ticket modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Selected ticket for replying / viewing thread
  const [activeReplyingTicket, setActiveReplyingTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newStatusAfterReply, setNewStatusAfterReply] = useState<'respondido' | 'aguardando_retorno' | 'finalizado'>('respondido');

  // Counts for KPI pills
  const counts = useMemo(() => {
    return {
      total: tickets.length,
      aguardando: tickets.filter((t) => t.status === 'aguardando_retorno').length,
      respondido: tickets.filter((t) => t.status === 'respondido').length,
      finalizado: tickets.filter((t) => t.status === 'finalizado').length,
    };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Status Filter
      if (statusFilter !== 'todos' && ticket.status !== statusFilter) {
        return false;
      }

      // Priority Filter
      if (priorityFilter !== 'todas' && ticket.priority !== priorityFilter) {
        return false;
      }

      // Search Query (Protocol, Student Name, Student Code, CPF, Subject, Course)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesProtocol = ticket.protocol.toLowerCase().includes(q);
        const matchesName = ticket.studentName.toLowerCase().includes(q);
        const matchesCode = ticket.studentCode?.toLowerCase().includes(q);
        const matchesCpf = ticket.studentCpf?.toLowerCase().includes(q);
        const matchesSubject = ticket.subject.toLowerCase().includes(q);
        const matchesCourse = ticket.courseTitle?.toLowerCase().includes(q);

        if (!matchesProtocol && !matchesName && !matchesCode && !matchesCpf && !matchesSubject && !matchesCourse) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, statusFilter, priorityFilter, searchQuery]);

  // Send reply handler
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReplyingTicket || !replyText.trim()) return;

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      sender: 'suporte',
      senderName: 'Equipe de Suporte Deds',
      message: replyText.trim(),
      timestamp: formattedDate,
    };

    const updatedTicket: SupportTicket = {
      ...activeReplyingTicket,
      status: newStatusAfterReply,
      updatedAt: formattedDate,
      messages: [...activeReplyingTicket.messages, newMsg],
    };

    onUpdateTicket(updatedTicket);
    setActiveReplyingTicket(updatedTicket);
    setReplyText('');
  };

  // Quick action: finalize or reopen ticket
  const handleToggleStatus = (ticket: SupportTicket, targetStatus: 'finalizado' | 'aguardando_retorno') => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const updated: SupportTicket = {
      ...ticket,
      status: targetStatus,
      updatedAt: formattedDate,
    };
    onUpdateTicket(updated);
    if (activeReplyingTicket?.id === ticket.id) {
      setActiveReplyingTicket(updated);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'alta':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'media':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'aguardando_retorno':
        return {
          label: 'Aguardando Retorno do Aluno',
          classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: 'schedule',
        };
      case 'respondido':
        return {
          label: 'Respondido',
          classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: 'check_circle',
        };
      case 'finalizado':
        return {
          label: 'Finalizado',
          classes: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
          icon: 'task_alt',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              Botão 12 • Suporte ao Aluno
            </span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-28">contact_support</span>
            Gestão de Tickets & Chamados
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Central de atendimento aos alunos. Visualize status, responda mensagens e abra chamados manuais com auto-preenchimento.
          </p>
        </div>

        {/* Action Button: Abrir Ticket Manual */}
        <button
          onClick={() => setIsManualModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Abrir Ticket Manual
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('todos')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'todos'
              ? 'bg-surface-raised border-primary shadow-sm'
              : 'bg-surface-raised/70 border-border-subtle hover:border-border-subtle/90'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-secondary font-medium">Total de Tickets</span>
            <span className="material-symbols-outlined text-primary text-lg">all_inbox</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">{counts.total}</div>
          <span className="text-[11px] text-text-tertiary">Todos os chamados</span>
        </button>

        <button
          onClick={() => setStatusFilter('aguardando_retorno')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'aguardando_retorno'
              ? 'bg-surface-raised border-amber-500 shadow-sm'
              : 'bg-surface-raised/70 border-border-subtle hover:border-border-subtle/90'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-amber-400 font-medium">Aguardando Retorno</span>
            <span className="material-symbols-outlined text-amber-400 text-lg">pending_actions</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{counts.aguardando}</div>
          <span className="text-[11px] text-text-tertiary">Aguardando o aluno</span>
        </button>

        <button
          onClick={() => setStatusFilter('respondido')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'respondido'
              ? 'bg-surface-raised border-emerald-500 shadow-sm'
              : 'bg-surface-raised/70 border-border-subtle hover:border-border-subtle/90'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-emerald-400 font-medium">Respondidos</span>
            <span className="material-symbols-outlined text-emerald-400 text-lg">mark_chat_read</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{counts.respondido}</div>
          <span className="text-[11px] text-text-tertiary">Pela equipe Deds</span>
        </button>

        <button
          onClick={() => setStatusFilter('finalizado')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'finalizado'
              ? 'bg-surface-raised border-slate-400 shadow-sm'
              : 'bg-surface-raised/70 border-border-subtle hover:border-border-subtle/90'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-medium">Finalizados</span>
            <span className="material-symbols-outlined text-slate-400 text-lg">check_circle</span>
          </div>
          <div className="text-2xl font-bold text-slate-300">{counts.finalizado}</div>
          <span className="text-[11px] text-text-tertiary">Resolvidos / Concluídos</span>
        </button>
      </div>

      {/* FILTER BAR: Status Tabs & Search Input */}
      <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'todos'
                  ? 'bg-primary text-white'
                  : 'bg-surface-overlay text-text-secondary hover:text-text-primary'
              }`}
            >
              Todos ({counts.total})
            </button>
            <button
              onClick={() => setStatusFilter('aguardando_retorno')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'aguardando_retorno'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-surface-overlay text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Aguardando Retorno ({counts.aguardando})
            </button>
            <button
              onClick={() => setStatusFilter('respondido')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'respondido'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-surface-overlay text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Respondido ({counts.respondido})
            </button>
            <button
              onClick={() => setStatusFilter('finalizado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'finalizado'
                  ? 'bg-slate-600 text-white'
                  : 'bg-surface-overlay text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Finalizado ({counts.finalizado})
            </button>
          </div>

          {/* Priority filter & Search */}
          <div className="flex items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-surface-overlay border border-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-primary"
            >
              <option value="todas">Todas as Prioridades</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por protocolo (DEDS-TK...), nome do aluno, código (ALU-...), CPF ou assunto..."
            className="w-full bg-surface-overlay border border-border-subtle rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* TICKETS LIST */}
      {filteredTickets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface-raised border border-border-subtle">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-3xl">inbox</span>
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1">Nenhum chamado encontrado</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto mb-4">
            Não há tickets registrados com o filtro de status "{statusFilter}" ou com o termo de busca informado.
          </p>
          <button
            onClick={() => {
              setStatusFilter('todos');
              setSearchQuery('');
              setPriorityFilter('todas');
            }}
            className="px-4 py-2 rounded-xl bg-surface-overlay border border-border-subtle text-xs font-semibold text-text-primary hover:border-primary transition-colors cursor-pointer"
          >
            Ver Todos os Chamados
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const statusInfo = getStatusBadge(ticket.status);
            const lastMsg = ticket.messages[ticket.messages.length - 1];

            return (
              <div
                key={ticket.id}
                className="p-5 rounded-2xl bg-surface-raised border border-border-subtle hover:border-border-subtle/80 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Left details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                      {ticket.protocol}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${statusInfo.classes}`}
                    >
                      <span className="material-symbols-outlined text-xs">{statusInfo.icon}</span>
                      {statusInfo.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getPriorityBadge(
                        ticket.priority
                      )}`}
                    >
                      Prioridade {ticket.priority}
                    </span>
                    <span className="text-[11px] text-text-tertiary">
                      Atualizado em: {ticket.updatedAt}
                    </span>
                  </div>

                  {/* Subject and Context */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-primary transition-colors">
                      {ticket.subject}
                    </h3>
                    {ticket.courseTitle && (
                      <span className="text-[11px] text-primary flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-xs">school</span>
                        Curso: {ticket.courseTitle}
                      </span>
                    )}
                  </div>

                  {/* Student Credentials */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary pt-1 border-t border-border-subtle/50">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs text-text-tertiary">person</span>
                      <strong className="text-text-primary">{ticket.studentName}</strong>
                    </div>
                    {ticket.studentCode && (
                      <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-surface-overlay border border-border-subtle text-text-tertiary">
                        Cód: {ticket.studentCode}
                      </span>
                    )}
                    {ticket.studentCpf && (
                      <span className="text-[11px] font-mono text-text-tertiary">
                        CPF: {ticket.studentCpf}
                      </span>
                    )}
                    <span className="text-[11px] text-text-tertiary">{ticket.studentEmail}</span>
                  </div>

                  {/* Last message preview */}
                  {lastMsg && (
                    <div className="text-xs text-text-tertiary flex items-start gap-1.5 bg-surface-overlay/50 p-2 rounded-lg line-clamp-2">
                      <span className="material-symbols-outlined text-xs text-text-tertiary shrink-0 mt-0.5">
                        chat
                      </span>
                      <span>
                        <strong className="text-text-secondary">
                          {lastMsg.sender === 'suporte' ? 'Equipe Deds: ' : `${ticket.studentName}: `}
                        </strong>
                        "{lastMsg.message}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Right action buttons */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border-subtle">
                  {ticket.status !== 'finalizado' ? (
                    <button
                      onClick={() => handleToggleStatus(ticket, 'finalizado')}
                      className="px-3 py-2 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1"
                      title="Encerrar chamado"
                    >
                      <span className="material-symbols-outlined text-sm">task_alt</span>
                      Finalizar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(ticket, 'aguardando_retorno')}
                      className="px-3 py-2 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1"
                      title="Reabrir chamado"
                    >
                      <span className="material-symbols-outlined text-sm">restart_alt</span>
                      Reabrir
                    </button>
                  )}

                  {/* Button "Responder o Aluno" */}
                  <button
                    onClick={() => setActiveReplyingTicket(ticket)}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">reply</span>
                    Responder Aluno
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL / DRAWER: RESPONDER O ALUNO */}
      {activeReplyingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setActiveReplyingTicket(null)}
          />
          <div className="relative w-full max-w-2xl bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-overlay">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">forum</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">
                      {activeReplyingTicket.protocol}
                    </span>
                    <span
                      className={`px-2 py-0.2 rounded-full text-[10px] font-semibold border ${
                        getStatusBadge(activeReplyingTicket.status).classes
                      }`}
                    >
                      {getStatusBadge(activeReplyingTicket.status).label}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-text-primary mt-0.5 line-clamp-1">
                    {activeReplyingTicket.subject}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveReplyingTicket(null)}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Student Info Bar */}
            <div className="px-5 py-2.5 bg-surface-overlay/60 border-b border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-text-tertiary">Aluno:</span>
                <strong className="text-text-primary">{activeReplyingTicket.studentName}</strong>
                {activeReplyingTicket.studentCode && (
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-raised border border-border-subtle text-text-secondary">
                    {activeReplyingTicket.studentCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-text-tertiary text-[11px]">
                <span>CPF: {activeReplyingTicket.studentCpf}</span>
                <span>Email: {activeReplyingTicket.studentEmail}</span>
              </div>
            </div>

            {/* Message Thread History */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-surface-raised/50 min-h-[220px]">
              {activeReplyingTicket.messages.map((m) => {
                const isStaff = m.sender === 'suporte' || m.sender === 'admin';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[11px] font-bold text-text-secondary">
                        {m.senderName}
                      </span>
                      <span className="text-[10px] text-text-tertiary">{m.timestamp}</span>
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                        isStaff
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-surface-overlay border border-border-subtle text-text-primary rounded-tl-none'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-border-subtle bg-surface-overlay space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">reply</span>
                  Responder ao Aluno:
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-tertiary">Novo Status:</span>
                  <select
                    value={newStatusAfterReply}
                    onChange={(e) => setNewStatusAfterReply(e.target.value as any)}
                    className="bg-surface-raised border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-secondary focus:outline-none focus:border-primary"
                  >
                    <option value="respondido">Respondido (Equipe Deds)</option>
                    <option value="aguardando_retorno">Aguardando Retorno do Aluno</option>
                    <option value="finalizado">Finalizar Chamado</option>
                  </select>
                </div>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Digite aqui sua resposta oficial para o aluno..."
                rows={3}
                required
                className="w-full bg-surface-raised border border-border-subtle rounded-xl p-3 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors resize-none"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleStatus(
                      activeReplyingTicket,
                      activeReplyingTicket.status === 'finalizado' ? 'aguardando_retorno' : 'finalizado'
                    );
                  }}
                  className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    {activeReplyingTicket.status === 'finalizado' ? 'restart_alt' : 'check_circle'}
                  </span>
                  {activeReplyingTicket.status === 'finalizado' ? 'Reabrir Chamado' : 'Marcar como Finalizado'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReplyingTicket(null)}
                    className="px-3 py-1.5 rounded-xl bg-surface-raised text-xs font-semibold text-text-secondary hover:text-text-primary border border-border-subtle cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    Enviar Resposta
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ABRIR TICKET MANUAL */}
      <ManualTicketModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        students={students}
        courses={courses}
        onOpenTicket={(newTicket) => {
          onOpenNewTicket(newTicket);
        }}
      />
    </div>
  );
};
