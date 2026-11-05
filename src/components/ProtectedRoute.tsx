import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { UserAccount } from '../types';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  currentUser?: UserAccount | null;
  onUnauthorized?: () => void;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  currentUser: explicitUser,
  onUnauthorized,
  redirectTo = '/',
}) => {
  const { user: hookUser, loading, role: hookRole } = useAuth();
  
  // Suporta tanto o hook useAuth quanto o usuário passado explicitamente pelo App
  const activeUser = explicitUser !== undefined ? explicitUser : hookUser;
  const activeRole = activeUser?.role || hookRole;

  useEffect(() => {
    if (!loading && (!activeUser || (requireAdmin && activeRole !== 'admin'))) {
      if (onUnauthorized) {
        onUnauthorized();
      } else if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', redirectTo);
      }
    }
  }, [loading, activeUser, activeRole, requireAdmin, onUnauthorized, redirectTo]);

  if (loading && explicitUser === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[#00c0a0] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium text-sm">Verificando credenciais de acesso...</p>
      </div>
    );
  }

  // 1. Usuário não autenticado
  if (!activeUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-amber-400 text-3xl">lock</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Autenticação Necessária</h2>
        <p className="text-slate-400 max-w-md text-sm mb-6">
          Esta área é restrita a alunos e colaboradores cadastrados. Por favor, acesse sua conta para continuar.
        </p>
        <button
          onClick={() => onUnauthorized ? onUnauthorized() : (window.location.href = '/')}
          className="px-6 py-2.5 rounded-xl bg-[#00c0a0] text-slate-950 font-bold text-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,192,160,0.3)]"
        >
          Entrar na Conta
        </button>
      </div>
    );
  }

  // 2. Usuário autenticado, mas sem papel de Administrador
  if (requireAdmin && activeRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-rose-400 text-3xl">gpp_bad</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito à Administração</h2>
        <p className="text-slate-400 max-w-md text-sm mb-6">
          Sua conta atual ({activeUser.email}) não possui permissões administrativas para visualizar este painel.
        </p>
        <button
          onClick={() => onUnauthorized ? onUnauthorized() : (window.location.href = '/')}
          className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm hover:bg-slate-700 transition-all"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  // 3. Usuário autenticado e autorizado
  return <>{children}</>;
};
