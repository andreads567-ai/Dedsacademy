import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: (mode: 'login' | 'register', role?: 'aluno' | 'admin') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  onNavigateSection: (sectionId: string) => void;
  onOpenCertificates?: () => void;
  currentUser?: UserAccount | null;
  onOpenStudentPortal?: () => void;
  onOpenAdminDashboard?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  onOpenAuth,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onNavigateSection,
  onOpenCertificates,
  currentUser,
  onOpenStudentPortal,
  onOpenAdminDashboard,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [headerAvatarError, setHeaderAvatarError] = useState(false);

  useEffect(() => {
    setHeaderAvatarError(false);
  }, [currentUser?.avatar]);

  // Admin and Student context
  const isAdminArea = activeTab === 'admin';
  const isStudentArea = !isAdminArea && Boolean(
    currentUser && (activeTab === 'aluno' || (currentUser.role !== 'admin' && activeTab !== 'admin'))
  );

  const navItems = [
    { id: 'inicio', label: 'Início', sectionId: 'hero-section' },
    { id: 'cursos', label: 'Cursos', sectionId: 'cursos-section' },
    { id: 'categorias', label: 'Categorias', sectionId: 'categorias-section' },
    { id: 'certificados', label: 'Certificados', sectionId: 'certificados-section' },
    { id: 'blog', label: 'Blog', sectionId: 'depoimentos-section' },
    { id: 'contato', label: 'Contato', sectionId: 'footer-section' },
  ];

  const handleNavClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    e.preventDefault();
    setActiveTab(item.id);
    setMobileMenuOpen(false);
    if (item.id === 'certificados' && onOpenCertificates) {
      onOpenCertificates();
    } else if (item.id === 'cursos') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (item.id === 'contato') {
      setActiveTab('contato');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigateSection(item.sectionId);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F17]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.5)] border-b border-[#1F293D]/50">
      <div className="h-20 max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-md">
        {/* Left Side: Brand & Navigation */}
        <div className="flex items-center gap-space-lg">
          <div className="flex items-center gap-3">
            <a
              className="flex items-center gap-space-xs text-text-primary group cursor-pointer"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (isAdminArea) {
                  // Keep admin on dashboard
                  return;
                } else if (isStudentArea) {
                  if (onOpenStudentPortal) onOpenStudentPortal();
                  else setActiveTab('aluno');
                } else {
                  setActiveTab('inicio');
                  onNavigateSection('hero-section');
                }
              }}
            >
              <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-headline-sm">school</span>
              </div>
              <span className="font-headline-sm text-headline-sm tracking-tight text-text-primary group-hover:text-primary transition-colors font-bold">
                Deds <span className="text-primary">Academy</span>
              </span>
            </a>

            {isAdminArea && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/25">
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                <span>Painel de Gestão</span>
              </span>
            )}
          </div>

          {/* Desktop Nav: Hidden in admin mode. In student mode, only show Cursos button. In store mode, show all nav items. */}
          {isAdminArea ? null : isStudentArea ? (
            <nav className="hidden xl:flex items-center gap-2 p-1 bg-surface-raised rounded-xl border border-border-subtle">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('cursos');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-4 py-2 font-label-md text-label-md rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'cursos'
                    ? 'bg-primary-container text-on-primary font-bold shadow-[0_0_20px_-3px_rgba(0,176,116,0.35)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-overlay font-semibold'
                }`}
                title="Explorar todos os cursos para matricular e adicionar ao carrinho"
              >
                <span className="material-symbols-outlined text-base">storefront</span>
                <span>Cursos</span>
              </button>
            </nav>
          ) : (
            <nav className="hidden xl:flex items-center gap-space-xs p-space-2xs bg-surface-raised rounded-xl border border-border-subtle">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.sectionId}`}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`px-space-sm py-space-xs font-label-md text-label-md rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-[0_0_20px_-3px_rgba(0,176,116,0.35)]'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-overlay'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          )}
        </div>

        {/* Center: Search input - Only visible on public store pages */}
        {!isAdminArea && !isStudentArea && (
          <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm px-space-md py-space-xs bg-surface-raised rounded-lg text-text-tertiary focus-within:text-text-primary focus-within:bg-surface-overlay transition-all border border-transparent focus-within:border-border-strong">
            <span className="material-symbols-outlined text-body-lg mr-space-xs text-text-tertiary">
              search
            </span>
            <input
              className="w-full bg-transparent border-none outline-none font-body-sm text-body-sm text-text-primary placeholder:text-text-tertiary"
              placeholder="Buscar cursos, carreiras..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <span className="px-space-2xs py-0.5 bg-surface-overlay text-text-tertiary font-label-sm text-label-sm rounded border border-border-subtle">
              ⌘K
            </span>
          </div>
        )}

        {/* Right Side: Action Icons & User */}
        <div className="flex items-center gap-space-sm">
          {/* Cart Icon -> Opens Cart Checkout - Hidden in admin mode */}
          {!isAdminArea && (
            <button
              id="cart-button"
              aria-label="Carrinho"
              onClick={onOpenCart}
              className={`relative p-space-xs rounded-lg transition-colors cursor-pointer ${
                activeTab === 'carrinho'
                  ? 'bg-primary/20 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-overlay'
              }`}
              title="Ver Carrinho e Condições de Pagamento"
            >
              <span className="material-symbols-outlined text-headline-sm">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-on-primary font-label-sm text-label-sm rounded-full flex items-center justify-center font-bold animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications Icon & Popover */}
          <div className="relative">
            <button
              id="notifications-button"
              aria-label="Notificações"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-space-xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-overlay transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-headline-sm">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-gold rounded-full"></span>
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-surface-raised border border-border-subtle rounded-xl shadow-2xl p-4 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="font-label-lg text-text-primary font-bold">
                      {isAdminArea ? 'Notificações da Gestão' : isStudentArea ? 'Notificações do Aluno' : 'Notificações'}
                    </span>
                    {isAdminArea && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                        Painel Admin
                      </span>
                    )}
                    {isStudentArea && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                        Área do Aluno
                      </span>
                    )}
                  </div>
                  <span
                    onClick={() => setNotificationsOpen(false)}
                    className="text-label-sm text-primary font-medium cursor-pointer hover:underline"
                  >
                    Fechar
                  </span>
                </div>
                <div className="flex flex-col gap-3 pt-3">
                  {isAdminArea ? (
                    <>
                      <div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-overlay">
                        <span className="material-symbols-outlined text-primary text-body-lg mt-0.5">
                          verified_user
                        </span>
                        <div>
                          <p className="text-body-sm text-text-primary font-medium">Modo Administrativo</p>
                          <span className="text-label-sm text-text-tertiary">Painel de controle com permissão de Super Admin</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-overlay transition-colors">
                        <span className="material-symbols-outlined text-accent-emerald-bright text-body-lg mt-0.5">
                          group_add
                        </span>
                        <div>
                          <p className="text-body-sm text-text-primary font-medium">Novos Alunos Cadastrados</p>
                          <span className="text-label-sm text-text-tertiary">Matrículas e inscrições sincronizadas</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-overlay">
                        <span className="material-symbols-outlined text-accent-emerald-bright text-body-lg mt-0.5">
                          workspace_premium
                        </span>
                        <div>
                          <p className="text-body-sm text-text-primary font-medium">Certificado Liberado</p>
                          <span className="text-label-sm text-text-tertiary">Seu certificado de horas complementares foi emitido</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-overlay transition-colors">
                        <span className="material-symbols-outlined text-primary text-body-lg mt-0.5">
                          play_lesson
                        </span>
                        <div>
                          <p className="text-body-sm text-text-primary font-medium">Novas Aulas Disponíveis</p>
                          <span className="text-label-sm text-text-tertiary">Novos módulos liberados em seus cursos</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-overlay transition-colors">
                        <span className="material-symbols-outlined text-accent-gold text-body-lg mt-0.5">
                          local_offer
                        </span>
                        <div>
                          <p className="text-body-sm text-text-primary font-medium">Cupom de Aluno: ALUNO20</p>
                          <span className="text-label-sm text-text-tertiary">20% de desconto para novos cursos</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Auth Buttons OR User Profile Menu */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-surface-raised hover:bg-surface-overlay border border-border-subtle transition-all cursor-pointer"
                >
                  <div className="flex flex-col items-end text-right hidden sm:flex">
                    <span className="text-xs font-bold text-text-primary truncate max-w-[120px]">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-primary font-bold uppercase">
                      {currentUser.role === 'admin' ? 'Gestão' : 'Aluno'}
                    </span>
                  </div>
                  {currentUser.avatar && !headerAvatarError ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      onError={() => setHeaderAvatarError(true)}
                      className="w-8 h-8 rounded-lg object-cover border border-primary/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary font-bold text-xs flex items-center justify-center border border-primary/40">
                      {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AL'}
                    </div>
                  )}
                  <span className="material-symbols-outlined text-xs text-text-tertiary">expand_more</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface-raised border border-border-subtle rounded-xl shadow-2xl p-2 z-50 animate-in fade-in">
                    <div className="px-3 py-2 border-b border-border-subtle">
                      <p className="text-xs font-bold text-text-primary">{currentUser.name}</p>
                      <p className="text-[11px] text-text-tertiary truncate">{currentUser.email}</p>
                    </div>

                    {isAdminArea ? (
                      <div className="py-1">
                        <div className="px-3 py-2 text-xs text-text-secondary flex items-center gap-2 border-b border-border-subtle/50 mb-1">
                          <span className="material-symbols-outlined text-base text-primary">admin_panel_settings</span>
                          <span className="font-semibold">Super Admin Ativo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            if (onOpenStudentPortal) onOpenStudentPortal();
                            else setActiveTab('aluno');
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-semibold text-text-primary hover:bg-surface-overlay rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base text-primary">school</span>
                          Área do Aluno
                        </button>

                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setActiveTab('cursos');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-semibold text-text-primary hover:bg-surface-overlay rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base text-accent-emerald-bright">storefront</span>
                          Catálogo de Cursos
                        </button>

                        {!isStudentArea && currentUser.role === 'admin' && (
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              if (onOpenAdminDashboard) onOpenAdminDashboard();
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-text-primary hover:bg-surface-overlay rounded-lg flex items-center gap-2 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base text-secondary">admin_panel_settings</span>
                            Painel do Admin (Gestão)
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenCart();
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-semibold text-text-primary hover:bg-surface-overlay rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base text-accent-gold">shopping_cart</span>
                          Carrinho ({cartCount})
                        </button>

                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenAuth('login');
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-overlay rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base text-primary">switch_account</span>
                          Trocar de Conta / Entrar
                        </button>
                      </div>
                    )}

                    <div className="pt-1 border-t border-border-subtle">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-status-danger hover:bg-status-danger/10 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        Encerrar Sessão
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {isAdminArea && (
                <button
                  onClick={onLogout}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-status-danger/20 text-text-tertiary hover:text-status-danger text-xs font-semibold border border-border-subtle transition-all cursor-pointer"
                  title="Encerrar Sessão do Painel de Gestão"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Sair</span>
                </button>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-space-xs">
              <button
                id="login-button"
                onClick={() => onOpenAuth('login')}
                className="px-space-md py-space-xs text-text-primary font-label-lg text-label-lg hover:bg-surface-overlay hover:text-on-surface rounded-lg transition-colors cursor-pointer"
              >
                Entrar
              </button>
              <button
                id="register-button"
                onClick={() => onOpenAuth('register')}
                className="px-space-md py-space-xs bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-accent-emerald-bright shadow-[0_0_20px_-3px_rgba(0,176,116,0.4)] active:scale-95 transition-all font-bold cursor-pointer"
              >
                Cadastre-se
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="xl:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-overlay cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir Menu"
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-surface-raised border-b border-border-subtle px-4 py-4 space-y-3">
          {isAdminArea ? (
            <div className="py-2 space-y-3">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/10 text-primary border border-primary/25">
                <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-text-primary">Painel de Gestão &amp; Administração</p>
                  <p className="text-[11px] text-text-tertiary">Super Admin</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full py-2.5 rounded-lg bg-surface-overlay hover:bg-status-danger/20 text-status-danger font-label-md font-bold text-center cursor-pointer flex items-center justify-center gap-2 border border-border-subtle"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Encerrar Sessão</span>
              </button>
            </div>
          ) : (
            <>
              {!isStudentArea && (
                <div className="flex items-center px-3 py-2 bg-surface-overlay rounded-lg text-text-tertiary">
                  <span className="material-symbols-outlined text-body-lg mr-2">search</span>
                  <input
                    className="w-full bg-transparent border-none outline-none font-body-sm text-text-primary placeholder:text-text-tertiary"
                    placeholder="Buscar cursos..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSearchSubmit(searchQuery);
                        setMobileMenuOpen(false);
                      }
                    }}
                  />
                </div>
              )}

              {isStudentArea ? (
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      setActiveTab('cursos');
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full px-4 py-3 rounded-xl flex items-center justify-between font-label-md cursor-pointer ${
                      activeTab === 'cursos'
                        ? 'bg-primary-container text-on-primary font-bold shadow'
                        : 'bg-surface-overlay text-text-primary hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">storefront</span>
                      <span>Cursos</span>
                    </div>
                    <span className="text-xs text-primary font-bold">Ver todos</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenStudentPortal) onOpenStudentPortal();
                      else setActiveTab('aluno');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-xl flex items-center justify-between font-label-md cursor-pointer ${
                      activeTab === 'aluno'
                        ? 'bg-primary-container text-on-primary font-bold shadow'
                        : 'bg-surface-overlay text-text-primary hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">school</span>
                      <span>Minha Área do Aluno</span>
                    </div>
                    <span className="text-xs text-text-tertiary">Painel</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {navItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.sectionId}`}
                      onClick={(e) => handleNavClick(e, item)}
                      className={`px-3 py-2 text-center rounded-lg font-label-md text-label-md ${
                        activeTab === item.id
                          ? 'bg-primary-container text-on-primary font-bold'
                          : 'bg-surface-overlay text-text-secondary'
                      }`}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-border-subtle">
                {currentUser ? (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onOpenStudentPortal) onOpenStudentPortal();
                        else setActiveTab('aluno');
                      }}
                      className="flex-1 py-2.5 rounded-lg bg-surface-overlay text-primary font-label-md font-bold text-center cursor-pointer"
                    >
                      Área do Aluno
                    </button>
                    {!isStudentArea && currentUser.role === 'admin' ? (
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          if (onOpenAdminDashboard) onOpenAdminDashboard();
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary font-label-md font-bold text-center cursor-pointer"
                      >
                        Painel Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-surface-overlay hover:bg-status-danger/20 text-text-tertiary hover:text-status-danger font-label-md font-semibold text-center cursor-pointer"
                      >
                        Sair da Conta
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onOpenAuth('login');
                        setMobileMenuOpen(false);
                      }}
                      className="flex-1 py-2.5 rounded-lg bg-surface-overlay text-text-primary font-label-md font-semibold text-center"
                    >
                      Entrar
                    </button>
                    <button
                      onClick={() => {
                        onOpenAuth('register');
                        setMobileMenuOpen(false);
                      }}
                      className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary font-label-md font-bold text-center"
                    >
                      Cadastre-se
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
