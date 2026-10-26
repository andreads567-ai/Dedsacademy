import React, { useState } from 'react';
import { UserAccount } from '../../types';
import { StaffUserModal } from './StaffUserModal';

interface UsersTabProps {
  users: UserAccount[];
  onUpdateUser?: (user: UserAccount) => void;
  onAddUser?: (user: UserAccount) => void;
  onEditUser?: (user: UserAccount) => void;
  onOpenNewUser?: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  onUpdateUser,
  onAddUser,
  onEditUser,
  onOpenNewUser,
}) => {
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'pendente' | 'inativo'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<UserAccount | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Módulo 8: Exclusivo para funcionários internos e usuários administrativos da plataforma
  const staffUsers = users.filter((u) => u.role !== 'aluno');

  const filteredStaff = staffUsers.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.cpf && u.cpf.includes(term)) ||
      (u.phone && u.phone.includes(term)) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(term)) ||
      (u.department && u.department.toLowerCase().includes(term)) ||
      (u.accessLevel && u.accessLevel.toLowerCase().includes(term));

    const matchesAccess =
      accessFilter === 'all' ||
      (u.accessLevel && u.accessLevel.toLowerCase() === accessFilter.toLowerCase()) ||
      (!u.accessLevel && accessFilter === 'Super Administrador' && u.role === 'admin');

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesAccess && matchesStatus;
  });

  const superAdminCount = staffUsers.filter((u) => (u.accessLevel || '').toLowerCase().includes('super') || (!u.accessLevel && u.role === 'admin')).length;
  const adminCount = staffUsers.filter((u) => (u.accessLevel || '').toLowerCase() === 'administrador').length;
  const supportCount = staffUsers.filter((u) => (u.accessLevel || '').toLowerCase().includes('suporte') || (u.department || '').toLowerCase().includes('suporte')).length;

  const handleOpenCreate = () => {
    if (onOpenNewUser) {
      onOpenNewUser();
    }
    setSelectedStaff(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: UserAccount) => {
    if (onEditUser) {
      onEditUser(staff);
    }
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  const handleSaveStaff = (savedStaff: UserAccount) => {
    const isExisting = staffUsers.some((u) => u.id === savedStaff.id);
    if (isExisting) {
      if (onUpdateUser) {
        onUpdateUser(savedStaff);
      }
      showToast(`Colaborador ${savedStaff.name} atualizado com sucesso!`);
    } else {
      if (onAddUser) {
        onAddUser(savedStaff);
      }
      showToast(`Colaborador ${savedStaff.name} cadastrado com sucesso na equipe interna!`);
    }
    setIsModalOpen(false);
    setSelectedStaff(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-surface-raised border border-secondary/40 text-secondary px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2 text-xs font-bold">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-xl">manage_accounts</span>
              8. Usuários Internos &amp; Equipe ADM
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary/15 text-secondary border border-secondary/30">
              {staffUsers.length} Colaboradores Internos
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Gerenciamento exclusivo da equipe interna da plataforma: credenciais, dados cadastrais, endereços, cargos e níveis de acesso.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Cadastrar Novo Colaborador
        </button>
      </div>

      {/* Summary Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border-subtle text-xs flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
          <span className="text-text-secondary">Total Equipe Interna:</span>
          <strong className="text-text-primary">{staffUsers.length}</strong>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border-subtle text-xs flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-gold" />
          <span className="text-text-secondary">Super Administradores:</span>
          <strong className="text-text-primary">{superAdminCount}</strong>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border-subtle text-xs flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-text-secondary">Administradores Gerais:</span>
          <strong className="text-text-primary">{adminCount}</strong>
        </div>

        {supportCount > 0 && (
          <div className="px-3.5 py-2 rounded-xl bg-surface-raised border border-border-subtle text-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald-bright" />
            <span className="text-text-secondary">Suporte &amp; Operações:</span>
            <strong className="text-text-primary">{supportCount}</strong>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por colaborador, cargo, departamento, e-mail corporativo ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-secondary"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
            className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-secondary cursor-pointer"
          >
            <option value="all">Todos os Níveis de Acesso</option>
            <option value="Super Administrador">Super Administrador</option>
            <option value="Administrador">Administrador Geral</option>
            <option value="Gestor Operacional">Gestor Operacional</option>
            <option value="Suporte Técnico">Suporte Técnico</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-secondary cursor-pointer"
          >
            <option value="all">Todos os Status ({staffUsers.length})</option>
            <option value="ativo">Apenas Ativos</option>
            <option value="pendente">Apenas Pendentes</option>
            <option value="inativo">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Horizontal Staff Table */}
      <div className="bg-surface-raised rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-overlay text-text-secondary uppercase border-b border-border-subtle font-bold">
              <tr>
                <th className="p-4">Colaborador</th>
                <th className="p-4">Contato Corporativo</th>
                <th className="p-4">Cargo &amp; Funções</th>
                <th className="p-4">Nível de Acesso</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-tertiary">
                    Nenhum colaborador interno encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((u) => {
                  const accessLevel = u.accessLevel || (u.role === 'admin' ? 'Super Administrador' : 'Administrador');
                  const isSuperAdmin = accessLevel.toLowerCase().includes('super');
                  const staffCodeDisplay = u.id.replace('user-admin-', '').replace('user-', '').toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-surface-overlay/50 transition-colors">
                      {/* Coluna 1: Colaborador & Avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-secondary/30 shadow-xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-bold text-sm shrink-0 border border-secondary/30 shadow-xs">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-text-primary block text-sm leading-tight hover:text-secondary transition-colors">
                              {u.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-surface-overlay border border-border-subtle text-[11px] font-mono text-text-secondary inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] text-secondary">verified_user</span>
                                <span>ID: ADM-{staffCodeDisplay}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Coluna 2: Contato Corporativo (E-mail na linha principal, telefone e CPF abaixo) */}
                      <td className="p-4">
                        <div>
                          <span className="text-text-primary font-medium block text-xs flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-secondary shrink-0">mail</span>
                            <span className="truncate max-w-[240px]">{u.email}</span>
                          </span>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-text-tertiary">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-text-secondary">call</span>
                              <span>{u.phone || 'Sem telefone'}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono">
                              <span className="material-symbols-outlined text-[13px] text-text-secondary">id_card</span>
                              <span>CPF: {u.cpf || 'Não informado'}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Coluna 3: Cargo & Funções / Departamento */}
                      <td className="p-4">
                        <div>
                          <span className="font-bold text-text-primary block text-xs">
                            {u.jobTitle || 'Administrador Geral'}
                          </span>
                          <span className="text-[11px] text-text-tertiary block mt-0.5">
                            {u.department || 'Gestão da Plataforma'}
                          </span>
                        </div>
                      </td>

                      {/* Coluna 4: Nível de Acesso */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 border ${
                            isSuperAdmin
                              ? 'bg-secondary/15 text-secondary border-secondary/30'
                              : accessLevel.includes('Suporte')
                              ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright border-accent-emerald-bright/30'
                              : 'bg-primary/15 text-primary border-primary/30'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {isSuperAdmin ? 'shield_person' : accessLevel.includes('Suporte') ? 'support_agent' : 'admin_panel_settings'}
                          </span>
                          <span>{accessLevel}</span>
                        </span>
                      </td>

                      {/* Coluna 5: Status da Conta */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 border ${
                            u.status === 'ativo'
                              ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright border-accent-emerald-bright/30'
                              : u.status === 'pendente'
                              ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30'
                              : 'bg-status-danger/15 text-status-danger border border-status-danger/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'ativo'
                                ? 'bg-accent-emerald-bright'
                                : u.status === 'pendente'
                                ? 'bg-accent-gold'
                                : 'bg-status-danger'
                            }`}
                          />
                          <span>
                            {u.status === 'ativo' ? 'Ativo' : u.status === 'pendente' ? 'Pendente' : 'Inativo'}
                          </span>
                        </span>
                      </td>

                      {/* Coluna 6: Ações */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-3.5 py-2 rounded-xl bg-surface-overlay hover:bg-secondary/10 hover:border-secondary/40 text-text-primary hover:text-secondary border border-border-subtle text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Editar cargo, funções, nível de acesso e endereço do colaborador"
                        >
                          <span className="material-symbols-outlined text-base text-secondary">manage_accounts</span>
                          <span>Editar / Detalhes</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulário de Cadastro e Edição de Funcionários Internos */}
      <StaffUserModal
        isOpen={isModalOpen}
        staffUser={selectedStaff}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStaff(null);
        }}
        onSave={handleSaveStaff}
      />
    </div>
  );
};
