import React, { useState, useEffect } from 'react';

interface FooterProps {
  onOpenCertificateModal: () => void;
  onSelectCategoryFilter: (category: string) => void;
  onOpenAuth: () => void;
  onOpenContact?: () => void;
  onOpenBlog?: () => void;
  onOpenInstructors?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenCertificateModal,
  onSelectCategoryFilter,
  onOpenAuth,
  onOpenContact,
  onOpenBlog,
  onOpenInstructors,
}) => {
  const [instagramUrl, setInstagramUrl] = useState<string>('https://www.instagram.com/dedsacademy/');

  useEffect(() => {
    const loadInstagram = () => {
      try {
        const savedUrl = localStorage.getItem('deds_instagram_url');
        if (savedUrl && savedUrl.trim()) {
          setInstagramUrl(savedUrl.trim());
          return;
        }
        const apiSettings = localStorage.getItem('deds_api_settings');
        if (apiSettings) {
          const parsed = JSON.parse(apiSettings);
          if (parsed?.instagram?.profileUrl) {
            setInstagramUrl(parsed.instagram.profileUrl);
          }
        }
      } catch {}
    };

    loadInstagram();
    window.addEventListener('storage', loadInstagram);
    window.addEventListener('deds_instagram_updated', loadInstagram);
    return () => {
      window.removeEventListener('storage', loadInstagram);
      window.removeEventListener('deds_instagram_updated', loadInstagram);
    };
  }, []);

  const handleOpenInstagram = () => {
    let target = instagramUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://www.instagram.com/${target.replace(/^@/, '')}`;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer id="footer-section" className="w-full bg-surface-container-lowest text-text-secondary mt-space-3xl border-t border-border-subtle">
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop pt-space-3xl pb-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl pb-space-2xl border-b border-border-subtle">
          {/* Brand Info */}
          <div className="lg:col-span-2 flex flex-col gap-space-md pr-space-lg">
            <div className="flex items-center gap-space-xs text-text-primary">
              <img
                src="/logo.png"
                alt="Deds Academy"
                className="w-10 h-10 object-contain rounded-full shadow-[0_0_12px_rgba(0,192,160,0.25)] shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80';
                }}
              />
              <span className="font-headline-sm text-headline-sm tracking-tight text-text-primary font-bold">
                Deds <span className="text-primary">Academy</span>
              </span>
            </div>

            <p className="font-body-md text-body-md text-text-tertiary leading-relaxed">
              Ecossistema avançado de formação tecnológica e aceleração de carreiras. Cursos atualizados, certificações emitidas e suporte acadêmico ativo para transformar seu futuro profissional.
            </p>

            <div className="flex items-center gap-space-sm pt-space-xs">
              <span className="flex items-center gap-space-2xs text-accent-emerald-bright font-label-md text-label-md">
                <span className="material-symbols-outlined text-body-lg">verified_user</span>
                Certificação Válida (MEC)
              </span>
              <span className="flex items-center gap-space-2xs text-text-tertiary font-label-md text-label-md">
                <span className="material-symbols-outlined text-body-lg">lock</span>
                SSL 256-bit Seguro
              </span>
            </div>
          </div>

          {/* Col 1: Institucional */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-headline-sm text-headline-sm text-text-primary font-bold">
              Institucional
            </span>
            <ul className="flex flex-col gap-space-xs font-body-md text-body-md">
              <li
                onClick={onOpenBlog}
                className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                title="Acessar artigos e informações institucionais no Blog"
              >
                <span>Sobre a Academy</span>
              </li>
              <li
                onClick={onOpenBlog}
                className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                title="Conheça nossa metodologia de ensino no Blog"
              >
                <span>Metodologia de Ensino</span>
              </li>
              <li
                onClick={onOpenInstructors}
                className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5 font-medium text-text-primary"
                title="Conheça nosso corpo docente de instrutores"
              >
                <span>Nossos Instrutores</span>
              </li>
            </ul>
          </div>

          {/* Col 2: Cursos & Trilhas */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-headline-sm text-headline-sm text-text-primary font-bold">
              Cursos &amp; Trilhas
            </span>
            <ul className="flex flex-col gap-space-xs font-body-md text-body-md">
              <li
                onClick={() => onSelectCategoryFilter('Tecnologia & IA')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Desenvolvimento Web
              </li>
              <li
                onClick={() => onSelectCategoryFilter('Tecnologia & IA')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Inteligência Artificial
              </li>
              <li
                onClick={() => onSelectCategoryFilter('Tecnologia & IA')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Cloud &amp; DevOps
              </li>
              <li
                onClick={() => onSelectCategoryFilter('Tecnologia & IA')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Segurança da Informação
              </li>
              <li
                onClick={() => onSelectCategoryFilter('Todos')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Ver Todas as Carreiras
              </li>
            </ul>
          </div>

          {/* Col 3: Ajuda & Suporte */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-headline-sm text-headline-sm text-text-primary font-bold">
              Ajuda &amp; Suporte
            </span>
            <ul className="flex flex-col gap-space-xs font-body-md text-body-md">
              <li
                onClick={onOpenContact}
                className="hover:text-primary transition-colors cursor-pointer"
                title="Acessar Central de Ajuda &amp; Contato"
              >
                Central de Ajuda
              </li>
              <li
                onClick={onOpenCertificateModal}
                className="hover:text-primary transition-colors cursor-pointer font-semibold text-accent-emerald-bright"
                title="Validar código verificador de certificado oficial"
              >
                Validar Certificado
              </li>
              <li
                onClick={onOpenBlog}
                className="hover:text-primary transition-colors cursor-pointer"
                title="Consultar Termos de Serviço no Blog"
              >
                Termos de Serviço
              </li>
              <li
                onClick={onOpenBlog}
                className="hover:text-primary transition-colors cursor-pointer"
                title="Consultar Política de Privacidade no Blog"
              >
                Política de Privacidade
              </li>
              <li
                onClick={onOpenContact}
                className="hover:text-primary transition-colors cursor-pointer font-medium text-primary"
                title="Falar diretamente com o Suporte e Atendimento"
              >
                Fale com o Suporte
              </li>
            </ul>

            {/* Redes Oficiais: Exclusivamente Instagram validado com API */}
            <div className="pt-space-xs">
              <span className="font-label-md text-label-md text-text-tertiary block mb-space-2xs">
                Rede Oficial
              </span>
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  onClick={handleOpenInstagram}
                  title="Instagram Oficial Deds Academy (Sincronizado via API)"
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#833AB4]/20 via-[#FD1D1D]/20 to-[#F77737]/20 hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] text-white border border-[#FD1D1D]/30 hover:border-transparent transition-all flex items-center gap-2 text-xs font-bold shadow-sm hover:shadow-lg cursor-pointer group"
                >
                  <svg
                    className="w-4 h-4 fill-current group-hover:scale-110 transition-transform shrink-0"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>Instagram</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md font-body-sm text-body-sm text-text-tertiary">
          <p>© 2026 Deds Academy Educação e Tecnologia Ltda. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center gap-4">
            <p className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse" />
              Plataforma Operacional | Suporte 24/7
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
