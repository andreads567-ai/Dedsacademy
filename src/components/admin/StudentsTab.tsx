import React, { useState } from 'react';
import { UserAccount, Course, CourseReview, StudentProgress } from '../../types';
import { StudentEditModal } from './StudentEditModal';

interface StudentsTabProps {
  users: UserAccount[];
  courses: Course[];
  onUpdateUser?: (student: UserAccount) => void;
  onAddUser?: (student: UserAccount) => void;
  onEditStudent?: (student: UserAccount) => void;
  onOpenNewStudent?: () => void;
  onQuickIssueCertificate?: (student: UserAccount) => void;
  reviews?: CourseReview[];
  progressMap?: Record<string, Record<string, StudentProgress>>;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  users,
  courses,
  onUpdateUser,
  onAddUser,
  onEditStudent,
  onOpenNewStudent,
  onQuickIssueCertificate,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'pendente' | 'inativo'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserAccount | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter only students (Módulo 7 exclusivo de Alunos)
  const students = users.filter((u) => u.role === 'aluno');

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(term)) ||
      (s.cpf && s.cpf.includes(term)) ||
      (s.phone && s.phone.includes(term));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = students.filter((s) => s.status === 'ativo').length;
  const pendingCount = students.filter((s) => s.status === 'pendente').length;
  const inactiveCount = students.filter((s) => s.status === 'inativo').length;

  const handleOpenCreate = () => {
    if (onOpenNewStudent) {
      onOpenNewStudent();
    }
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: UserAccount) => {
    if (onEditStudent) {
      onEditStudent(student);
    }
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleSaveStudent = (savedStudent: UserAccount) => {
    const isExisting = students.some((s) => s.id === savedStudent.id);
    if (isExisting) {
      if (onUpdateUser) {
        onUpdateUser(savedStudent);
      }
      showToast(`Dados de ${savedStudent.name} atualizados com sucesso!`);
    } else {
      if (onAddUser) {
        onAddUser(savedStudent);
      }
      showToast(`Aluno ${savedStudent.name} cadastrado com sucesso!`);
    }
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-surface-raised border border-accent-emerald-bright/40 text-accent-emerald-bright px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2 text-xs font-bold">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">person_search</span>
              7. Gestão de Aluno
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary">
              {students.length} Alunos na Base
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Acompanhe a lista de alunos com contato, status e acesso aos detalhes cadastrais e gestão de credenciais.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Cadastrar Novo Aluno
        </button>
      </div>

      {/* Summary Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border-subtle text-xs flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald-bright" />
          <span className="text-text-secondary">Alunos Ativos:</span>
          <strong className="text-text-primary">{activeCount}</strong>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border-subtle text-xs flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-gold" />
          <span className="text-text-secondary">Pendentes:</span>
          <strong className="text-text-primary">{pendingCount}</strong>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border-subtle text-xs flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-status-danger" />
          <span className="text-text-secondary">Inativos:</span>
          <strong className="text-text-primary">{inactiveCount}</strong>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar aluno por nome completo, e-mail, telefone, CPF ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">Todos os Status ({students.length})</option>
            <option value="ativo">Apenas Ativos ({activeCount})</option>
            <option value="pendente">Apenas Pendentes ({pendingCount})</option>
            <option value="inativo">Apenas Inativos ({inactiveCount})</option>
          </select>
        </div>
      </div>

      {/* Horizontal Students Table */}
      <div className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-overlay text-text-secondary uppercase border-b border-border-subtle font-bold">
              <tr>
                <th className="p-4">Aluno</th>
                <th className="p-4">E-mail &amp; Contato</th>
                <th className="p-4">Cadastro &amp; Acesso</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-tertiary">
                    Nenhum aluno encontrado com os termos pesquisados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const studentCodeDisplay =
                    s.studentCode || `ALU-${s.id.replace('user-aluno-', '').replace('user-', '').toUpperCase()}`;

                  return (
                    <tr key={s.id} className="hover:bg-surface-overlay/50 transition-colors">
                      {/* Coluna 1: Nome Completo & Avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {s.avatar ? (
                            <img
                              src={s.avatar}
                              alt={s.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-primary/20 shadow-xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20 shadow-xs">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-text-primary block text-sm leading-tight hover:text-primary transition-colors">
                              {s.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-surface-overlay border border-border-subtle text-[11px] font-mono text-text-secondary inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] text-primary">badge</span>
                                <span>Cód: {studentCodeDisplay}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Coluna 2: Linha principal com e-mail, logo abaixo telefone e evidências (CPF) */}
                      <td className="p-4">
                        <div>
                          <span className="text-text-primary font-medium block text-xs flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-primary shrink-0">mail</span>
                            <span className="truncate max-w-[240px]">{s.email}</span>
                          </span>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-text-tertiary">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-text-secondary">call</span>
                              <span>{s.phone || 'Sem telefone'}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono">
                              <span className="material-symbols-outlined text-[13px] text-text-secondary">id_card</span>
                              <span>CPF: {s.cpf || 'Não informado'}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Coluna 3: Data de Cadastro e Último Acesso */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-[11px] space-y-0.5">
                          <span className="text-text-secondary block">
                            Cadastro: {s.registeredAt || '15/01/2025'}
                          </span>
                          <span className="flex items-center gap-1.5 text-accent-emerald-bright font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald-bright animate-pulse" />
                            <span>Acesso: {s.lastAccess || 'Hoje, 09:30'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Coluna 4: Status (Ativo, Pendente, Inativo) */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 border ${
                            s.status === 'ativo'
                              ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright border-accent-emerald-bright/30'
                              : s.status === 'pendente'
                              ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30'
                              : 'bg-status-danger/15 text-status-danger border border-status-danger/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              s.status === 'ativo'
                                ? 'bg-accent-emerald-bright'
                                : s.status === 'pendente'
                                ? 'bg-accent-gold'
                                : 'bg-status-danger'
                            }`}
                          />
                          <span>
                            {s.status === 'ativo' ? 'Ativo' : s.status === 'pendente' ? 'Pendente' : 'Inativo'}
                          </span>
                        </span>
                      </td>

                      {/* Coluna 5: Ações com botão claro de detalhes */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="px-3.5 py-2 rounded-xl bg-surface-overlay hover:bg-primary/10 hover:border-primary/40 text-text-primary hover:text-primary border border-border-subtle text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Ver detalhes cadastrais e editar informações do aluno"
                          >
                            <span className="material-symbols-outlined text-base text-primary">visibility</span>
                            <span>Detalhes</span>
                          </button>

                          {onQuickIssueCertificate && (
                            <button
                              onClick={() => onQuickIssueCertificate(s)}
                              className="p-2 rounded-xl bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold text-xs font-bold transition-all flex items-center justify-center cursor-pointer border border-accent-gold/20"
                              title="Emitir certificado oficial para este aluno"
                            >
                              <span className="material-symbols-outlined text-base">workspace_premium</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulário de Edição Completa dos Alunos */}
      <StudentEditModal
        isOpen={isModalOpen}
        student={selectedStudent}
        courses={courses}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        onSave={handleSaveStudent}
      />
    </div>
  );
};
