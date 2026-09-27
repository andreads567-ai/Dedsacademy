import React, { useState } from 'react';
import { UserAccount } from '../../types';

interface UsersTabProps {
  users: UserAccount[];
  onEditUser: (user: UserAccount) => void;
  onOpenNewUser: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  onEditUser,
  onOpenNewUser,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'aluno'>('all');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.cpf && u.cpf.includes(search));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const studentCount = users.filter((u) => u.role === 'aluno').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">manage_accounts</span>
              Gestão de Usuários &amp; Controle de Acesso
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary">
              {users.length} Contas no Sistema
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Gerenciamento de credenciais, perfis de Super Administrador e permissões institucionais.
          </p>
        </div>

        <button
          onClick={onOpenNewUser}
          className="px-4 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Cadastrar Novo Usuário
        </button>
      </div>

      {/* Role Summary Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border-subtle text-xs flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
          <span className="text-text-secondary">Administradores:</span>
          <strong className="text-text-primary">{adminCount}</strong>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border-subtle text-xs flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-text-secondary">Alunos Registrados:</span>
          <strong className="text-text-primary">{studentCount}</strong>
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
            placeholder="Buscar usuário por nome, e-mail institucional ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">Todos os Perfis</option>
            <option value="admin">Apenas Administradores</option>
            <option value="aluno">Apenas Alunos</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-overlay text-text-secondary uppercase border-b border-border-subtle font-bold">
              <tr>
                <th className="p-4">Usuário &amp; Cadastro</th>
                <th className="p-4">E-mail de Login</th>
                <th className="p-4">Papel / Nível de Acesso</th>
                <th className="p-4">Status da Conta</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-tertiary">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-overlay/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                            u.role === 'admin'
                              ? 'bg-secondary/20 text-secondary border-secondary/30'
                              : 'bg-primary/20 text-primary border-primary/30'
                          }`}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-text-primary block text-sm">{u.name}</span>
                          <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                            <span>Cadastro: {u.registeredAt || '01/01/2025'}</span>
                            <span>•</span>
                            <span className="text-accent-emerald-bright font-medium">
                              Acesso: {u.lastAccess || 'Hoje, 09:30'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-text-secondary">{u.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                          u.role === 'admin'
                            ? 'bg-secondary/20 text-secondary border border-secondary/30'
                            : 'bg-primary/20 text-primary border border-primary/30'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {u.role === 'admin' ? 'shield_person' : 'school'}
                        </span>
                        {u.role === 'admin' ? 'Super Administrador' : 'Aluno'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          u.status === 'ativo'
                            ? 'bg-accent-emerald-bright/20 text-accent-emerald-bright'
                            : u.status === 'pendente'
                            ? 'bg-accent-gold/20 text-accent-gold'
                            : 'bg-status-danger/20 text-status-danger'
                        }`}
                      >
                        {u.status === 'ativo' ? 'Ativo' : u.status === 'pendente' ? 'Pendente' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onEditUser(u)}
                        className="p-2 rounded-lg bg-surface-overlay hover:bg-surface-container text-text-primary text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                        title="Editar Permissões e Dados"
                      >
                        <span className="material-symbols-outlined text-base">manage_accounts</span>
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
