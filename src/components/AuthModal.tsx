import React, { useState, useEffect } from 'react';
import { compareSync } from 'bcryptjs';
import { UserAccount } from '../types';
import { sendPasswordResetEmail } from '../services/emailService';
import { supabase } from '../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  initialRole?: 'aluno' | 'admin';
  onClose: () => void;
  onSuccess: (role: 'aluno' | 'admin', user: UserAccount) => void;
  onOpenRegisterPage?: () => void;
  usersList: UserAccount[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  initialRole = 'aluno',
  onClose,
  onSuccess,
  onOpenRegisterPage,
  usersList,
}) => {


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberData, setRememberData] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLoginGoogle = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) {
        setErrorMessage('Erro ao entrar com o Google: ' + error.message);
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      console.error('Erro no login com Google:', err);
      setErrorMessage('Falha ao conectar com o Google. Tente novamente.');
      setIsGoogleLoading(false);
    }
  };

  // Initialize email from saved preference or keep empty for user input
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setForgotFeedback('');
      const savedEmail = localStorage.getItem('deds_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
      } else {
        setEmail('');
      }
      setPassword('');
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleForgotPassword = () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMessage('Por favor, digite seu e-mail de acesso para receber as instruções.');
      return;
    }
    // 2. Notificação de recuperação de senha segura
    sendPasswordResetEmail(targetEmail).catch(console.error);
    setForgotFeedback(
      `Instruções seguras para redefinição de senha foram enviadas para ${targetEmail}. Verifique sua caixa de entrada.`
    );
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setForgotFeedback('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setErrorMessage('Por favor, informe seu e-mail de acesso.');
      return;
    }

    if (!trimmedPassword) {
      setErrorMessage('Por favor, digite sua senha.');
      return;
    }

    // Find user in the synchronized users list (includes localStorage-persisted users)
    const matchedUser = usersList.find(
      (u) => u.email.toLowerCase() === trimmedEmail
    );

    if (!matchedUser) {
      setErrorMessage('E-mail não encontrado. Verifique o endereço ou cadastre-se.');
      return;
    }

    // Validate password - supports both bcrypt hashes and plain text (legacy)
    if (matchedUser.password) {
      const isBcryptHash = matchedUser.password.startsWith('$2a$') || matchedUser.password.startsWith('$2b$');
      const isPasswordValid = isBcryptHash
        ? compareSync(trimmedPassword, matchedUser.password)
        : trimmedPassword === matchedUser.password;

      if (!isPasswordValid) {
        setErrorMessage('Senha incorreta. Verifique suas credenciais e tente novamente.');
        return;
      }
    }

    // Remember data persistence
    if (rememberData) {
      localStorage.setItem('deds_remembered_email', trimmedEmail);
    } else {
      localStorage.removeItem('deds_remembered_email');
    }

    // Use the user's actual role from their account
    const determinedRole: 'aluno' | 'admin' = matchedUser.role;

    onSuccess(determinedRole, matchedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header: Bem-vindo */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Deds Academy"
              className="w-11 h-11 object-contain rounded-full shadow-[0_0_12px_rgba(0,192,160,0.3)] shrink-0"
            />
            <div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">
                Bem-vindo
              </h2>
              <p className="text-xs text-text-tertiary mt-0.5">
                Digite seus dados para acessar sua conta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full bg-surface-overlay hover:bg-surface-container-high border border-border-subtle flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/30 rounded-xl text-xs text-status-danger flex items-center gap-2">
              <span className="material-symbols-outlined text-base flex-shrink-0">
                error
              </span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Forgot Password Feedback */}
          {forgotFeedback && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-xl text-xs text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-base flex-shrink-0">
                check_circle
              </span>
              <span>{forgotFeedback}</span>
            </div>
          )}

          {/* Botão Entrar com o Google */}
          <div className="mb-4">
            <button
              id="btn-login-google"
              type="button"
              onClick={handleLoginGoogle}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-surface-overlay hover:bg-surface-container-high border border-border-subtle hover:border-text-secondary/40 rounded-xl font-medium text-text-primary text-sm shadow-sm transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>{isGoogleLoading ? 'Conectando ao Google...' : 'Entrar com o Google'}</span>
            </button>
          </div>

          {/* Divisor Visual */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-border-subtle w-full" />
            <span className="bg-surface-raised px-3 text-[11px] font-medium text-text-tertiary uppercase tracking-wider absolute">
              ou com e-mail
            </span>
          </div>

          {/* Direct Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo 1: E-mail de Acesso */}
            <div>
              <label
                htmlFor="login-email-input"
                className="block text-xs font-bold text-text-secondary mb-1.5"
              >
                E-mail de Acesso
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="seu@email.com"
                  className="w-full px-3.5 py-3 pl-10 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary focus:border-primary focus:outline-none transition-colors"
                />
                <span className="material-symbols-outlined absolute left-3 text-text-tertiary text-base pointer-events-none">
                  mail
                </span>
              </div>
            </div>

            {/* Campo 2: Senha */}
            <div>
              <label
                htmlFor="login-password-input"
                className="block text-xs font-bold text-text-secondary mb-1.5"
              >
                Senha
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Digite sua senha"
                  className="w-full px-3.5 py-3 pl-10 pr-11 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary focus:border-primary focus:outline-none transition-colors font-mono"
                />
                <span className="material-symbols-outlined absolute left-3 text-text-tertiary text-base pointer-events-none">
                  lock
                </span>
                {/* Ícone de visualizar senha no lado direito */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                  aria-label={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                >
                  <span className="material-symbols-outlined text-lg block">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Linha de Opções: Lembrar dados (esquerda) | Esqueceu a senha? (direita) */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-text-secondary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberData}
                  onChange={(e) => setRememberData(e.target.checked)}
                  className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span>Lembrar dados</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-primary hover:text-accent-emerald-bright font-semibold hover:underline transition-colors cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Botão Grande Escrito "Entrar" */}
            <div className="pt-2">
              <button
                id="btn-login-submit"
                type="submit"
                className="w-full py-4 bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-bold text-base rounded-xl shadow-[0_0_24px_-4px_rgba(0,176,116,0.45)] transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">login</span>
                <span>Entrar</span>
              </button>
            </div>
          </form>

          {/* Link para Cadastro */}
          {onOpenRegisterPage && (
            <div className="text-center pt-4 pb-2 border-t border-border-subtle mt-4">
              <p className="text-xs text-text-secondary">
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRegisterPage();
                  }}
                  className="text-primary hover:text-accent-emerald-bright font-bold hover:underline transition-colors cursor-pointer"
                >
                  Cadastre-se
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
