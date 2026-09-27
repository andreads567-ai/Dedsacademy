import React from 'react';

interface FooterProps {
  onOpenCertificateModal: () => void;
  onSelectCategoryFilter: (category: string) => void;
  onOpenAuth: () => void;
  onOpenContact?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenCertificateModal,
  onSelectCategoryFilter,
  onOpenAuth,
  onOpenContact,
}) => {
  return (
    <footer id="footer-section" className="w-full bg-surface-container-lowest text-text-secondary mt-space-3xl border-t border-border-subtle">
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop pt-space-3xl pb-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl pb-space-2xl border-b border-border-subtle">
          {/* Brand Info */}
          <div className="lg:col-span-2 flex flex-col gap-space-md pr-space-lg">
            <div className="flex items-center gap-space-xs text-text-primary">
              <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-headline-sm">school</span>
              </div>
              <span className="font-headline-sm text-headline-sm tracking-tight text-text-primary font-bold">
                Deds <span className="text-primary">Academy</span>
              </span>
            </div>

            <p className="font-body-md text-body-md text-text-tertiary leading-relaxed">
              Ecossistema avançado de formação tecnológica e aceleração de carreiras. Cursos atualizados, certificações emitidas e suporte técnico ativo para transformar seu futuro profissional.
            </p>

            <div className="flex items-center gap-space-sm pt-space-xs">
              <span className="flex items-center gap-space-2xs text-accent-emerald-bright font-label-md text-label-md">
                <span className="material-symbols-outlined text-body-lg">verified_user</span>
                Certificação Válida
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
                onClick={onOpenAuth}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Sobre a Academy
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer">
                Metodologia de Ensino
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer">
                Nossos Instrutores
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer">
                Para Empresas (B2B)
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer">
                Trabalhe Conosco
              </li>
            </ul>
          </div>

          {/* Col 2: Cursos & Trilhas */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-headline-sm text-headline-sm text-text-primary font-bold">
              Cursos & Trilhas
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
                Cloud & DevOps
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
              Ajuda & Suporte
            </span>
            <ul className="flex flex-col gap-space-xs font-body-md text-body-md">
              <li
                onClick={onOpenContact}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Central de Ajuda
              </li>
              <li
                onClick={onOpenCertificateModal}
                className="hover:text-primary transition-colors cursor-pointer font-semibold text-accent-emerald-bright"
              >
                Validar Certificado
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer">
                Termos de Serviço
              </li>
              <li className="hover:text-primary transition-colors cursor-pointer">
                Política de Privacidade
              </li>
              <li
                onClick={onOpenContact}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Fale com o Suporte
              </li>
            </ul>

            <div className="pt-space-xs">
              <span className="font-label-md text-label-md text-text-tertiary block mb-space-2xs">
                Redes Oficiais
              </span>
              <div className="flex items-center gap-space-xs text-text-tertiary">
                <span
                  title="GitHub / Dev"
                  className="material-symbols-outlined p-space-xs rounded-lg bg-surface-overlay hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  terminal
                </span>
                <span
                  title="Comunidade Discord"
                  className="material-symbols-outlined p-space-xs rounded-lg bg-surface-overlay hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  forum
                </span>
                <span
                  title="Canal no YouTube"
                  className="material-symbols-outlined p-space-xs rounded-lg bg-surface-overlay hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  video_library
                </span>
                <span
                  title="LinkedIn"
                  className="material-symbols-outlined p-space-xs rounded-lg bg-surface-overlay hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  share
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md font-body-sm text-body-sm text-text-tertiary">
          <p>© 2025 Deds Academy Educação e Tecnologia Ltda. Todos os direitos reservados.</p>
          <p className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse" />
            Plataforma Operacional | Suporte 24/7
          </p>
        </div>
      </div>
    </footer>
  );
};
