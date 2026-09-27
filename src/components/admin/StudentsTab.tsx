import React, { useState } from 'react';
import { UserAccount, Course } from '../../types';

interface StudentsTabProps {
  users: UserAccount[];
  courses: Course[];
  onEditStudent: (student: UserAccount) => void;
  onOpenNewStudent: () => void;
  onQuickIssueCertificate?: (student: UserAccount) => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  users,
  courses,
  onEditStudent,
  onOpenNewStudent,
  onQuickIssueCertificate,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'pendente' | 'inativo'>('all');

  const students = users.filter((u) => u.role === 'aluno');

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      (s.cpf && s.cpf.includes(search));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCourseNames = (enrolledIds: string[] = []) => {
    return enrolledIds
      .map((id) => courses.find((c) => c.id === id)?.title)
      .filter(Boolean) as string[];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">person_search</span>
              Gestão de Alunos &amp; Matrículas
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary">
              {students.length} Alunos na Base
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Acompanhe o status das matrículas, cursos liberados e dados cadastrais para emissão de certificados.
          </p>
        </div>

        <button
          onClick={onOpenNewStudent}
          className="px-4 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Cadastrar Novo Aluno
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nome do aluno, e-mail institucional ou CPF..."
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
            <option value="all">Todos os Status de Matrícula</option>
            <option value="ativo">Apenas Ativos (Acesso Liberado)</option>
            <option value="pendente">Apenas Pendentes (Aguardando)</option>
            <option value="inativo">Apenas Inativos / Bloqueados</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-overlay text-text-secondary uppercase border-b border-border-subtle font-bold">
              <tr>
                <th className="p-4">Aluno &amp; Data de Matrícula</th>
                <th className="p-4">E-mail &amp; Contato</th>
                <th className="p-4">CPF (Identificação Oficial)</th>
                <th className="p-4">Cursos Liberados</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-tertiary">
                    Nenhum aluno encontrado com os termos pesquisados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const courseNames = getCourseNames(s.enrolledCourseIds);

                  return (
                    <tr key={s.id} className="hover:bg-surface-overlay/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20 mt-0.5 shadow-xs">
                            {s.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-text-primary block text-sm">{s.name}</span>
                            
                            {/* Código do Aluno e Quantidade de Cursos Comprados */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-surface-overlay border border-border-subtle text-[11px] font-mono font-semibold text-text-secondary flex items-center gap-1">
                                <span className="material-symbols-outlined text-primary text-[12px]">badge</span>
                                <span>Cód: {s.id.replace('user-', '').toUpperCase()}</span>
                              </span>
                              
                              <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">shopping_bag</span>
                                <span>
                                  {s.enrolledCourseIds.length} {s.enrolledCourseIds.length === 1 ? 'curso comprado' : 'cursos comprados'}
                                </span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[11px] text-text-tertiary">
                              <span>Cadastro: {s.registeredAt || '15/01/2025'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-accent-emerald-bright font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald-bright animate-pulse"></span>
                                <span>Acesso: {s.lastAccess || 'Hoje, 09:30'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-text-secondary font-medium block">{s.email}</span>
                        <span className="text-[11px] text-text-tertiary">{s.phone || 'Sem telefone'}</span>
                      </td>
                      <td className="p-4 font-mono font-medium text-text-primary whitespace-nowrap">
                        {s.cpf || 'Não informado'}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {courseNames.length === 0 ? (
                            <span className="text-text-tertiary italic">Nenhum curso atribuído</span>
                          ) : (
                            courseNames.map((name, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-surface-overlay border border-border-subtle/70 text-[10px] text-text-secondary truncate max-w-[160px]"
                                title={name}
                              >
                                {name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            s.status === 'ativo'
                              ? 'bg-accent-emerald-bright/20 text-accent-emerald-bright'
                              : s.status === 'pendente'
                              ? 'bg-accent-gold/20 text-accent-gold'
                              : 'bg-status-danger/20 text-status-danger'
                          }`}
                        >
                          {s.status === 'ativo' ? 'Ativo' : s.status === 'pendente' ? 'Pendente' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEditStudent(s)}
                            className="p-2 rounded-lg bg-surface-overlay hover:bg-surface-container text-text-primary text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Gerenciar matrícula e cursos do aluno"
                          >
                            <span className="material-symbols-outlined text-base">manage_accounts</span>
                            <span>Editar</span>
                          </button>

                          {onQuickIssueCertificate && (
                            <button
                              onClick={() => onQuickIssueCertificate(s)}
                              className="p-2 rounded-lg bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Emitir certificado para este aluno"
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
    </div>
  );
};
