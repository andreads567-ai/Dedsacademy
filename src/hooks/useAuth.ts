import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { UserAccount } from '../types';

export interface UseAuthReturn {
  user: UserAccount | null;
  role: 'aluno' | 'admin' | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('deds_current_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Sincroniza estado com a sessão atual do Supabase Auth
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Busca perfil no banco de dados
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();

          if (profile) {
            const mappedUser: UserAccount = {
              id: profile.id,
              name: profile.name || session.user.user_metadata?.name || 'Usuário',
              email: profile.email,
              role: (profile.role as 'aluno' | 'admin') || 'aluno',
              status: (profile.status as 'ativo' | 'inativo' | 'pendente') || 'ativo',
              registeredAt: profile.registered_at || new Date().toLocaleDateString('pt-BR'),
              enrolledCourseIds: profile.enrolled_course_ids || [],
              completedCourseIds: profile.completed_course_ids || [],
              studentCode: profile.student_code,
              cpf: profile.cpf,
              phone: profile.phone,
            };
            setUser(mappedUser);
            localStorage.setItem('deds_current_session', JSON.stringify(mappedUser));
          }
        }
      } catch (err) {
        console.warn('[useAuth] Erro ao sincronizar sessão:', err);
      } finally {
        setLoading(false);
      }
    }

    checkSession();

    // 2. Ouve eventos de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('deds_current_session');
      } else if (session?.user) {
        checkSession();
      }
    });

    // 3. Ouve mudanças no localStorage (ex: login em outra aba)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'deds_current_session') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    localStorage.removeItem('deds_current_session');
    window.dispatchEvent(new CustomEvent('deds_session_logout'));
  };

  const role = user?.role || null;
  const isAuthenticated = Boolean(user);
  const isAdmin = role === 'admin';

  return {
    user,
    role,
    loading,
    isAuthenticated,
    isAdmin,
    logout,
  };
}
