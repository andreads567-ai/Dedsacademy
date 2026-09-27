import React, { useState, useEffect } from 'react';
import { compareSync } from 'bcryptjs';
import { UserAccount } from '../types';

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
    const targetEmail = email.trim() || 'seu e-mail';
    setForgotFeedback(
      `Instruções para redefinição de senha foram enviadas para ${targetEmail}.`
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
          <div>
            <h2 className="text-2xl font-black text-text-primary tracking-tight">
              Bem-vindo
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              Digite seus dados para acessar sua conta
            </p>
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
