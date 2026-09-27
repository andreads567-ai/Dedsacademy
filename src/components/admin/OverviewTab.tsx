import React from 'react';
import { Course, UserAccount } from '../../types';

interface OverviewTabProps {
  courses: Course[];
  users: UserAccount[];
  certificatesCount: number;
  instructorsCount: number;
  blogCount: number;
  categoriesCount: number;
  onNavigateTab: (tabId: string) => void;
  onOpenNewCourse: () => void;
  onOpenNewUser: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  courses,
  users,
  certificatesCount,
  instructorsCount,
  blogCount,
  categoriesCount,
  onNavigateTab,
  onOpenNewCourse,
  onOpenNewUser,
}) => {
  const studentsCount = users.filter((u) => u.role === 'aluno').length;
  const activeCoursesCount = courses.filter((c) => c.status !== 'arquivado').length;

  const quickActions = [
    {
      id: 'postagem-cursos',
      title: 'Postagem de Cursos',
      description: 'Publicar novo curso no catálogo com ementa e precificação',
      icon: 'add_box',
      color: 'bg-primary/10 text-primary border-primary/20',
      action: () => onNavigateTab('postagem-cursos'),
    },
    {
      id: 'gestao-aluno',
      title: 'Gestão de Alunos',
      description: 'Matrículas, status e liberação de acesso aos conteúdos',
      icon: 'person_search',
      color: 'bg-secondary/10 text-secondary border-secondary/20',
      action: () => onNavigateTab('gestao-aluno'),
    },
    {
      id: 'certificado',
      title: 'Emitir / Validar Certificado',
      description: 'Gerar 2ª via oficial com QR Code e verificar código hash',
      icon: 'verified',
      color: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20',
      action: () => onNavigateTab('certificado'),
    },
    {
      id: 'blog',
      title: 'Mural & Blog Acadêmico',
      description: 'Publicar comunicados e artigos sobre AACC e normativas',
      icon: 'article',
      color: 'bg-accent-emerald-bright/10 text-accent-emerald-bright border-accent-emerald-bright/20',
      action: () => onNavigateTab('blog'),
    },
  ];

  const recentActivities = [
    {
      id: 'act-1',
      type: 'matricula',
      icon: 'how_to_reg',
      color: 'text-accent-emerald-bright bg-accent-emerald-bright/10',
      title: 'Nova matrícula confirmada via PIX',
      description: 'Aluno André Silva matriculado em "Python do Zero ao Avançado"',
      time: 'Há 12 minutos',
    },
    {
      id: 'act-2',
      type: 'certificado',
      icon: 'workspace_premium',
      color: 'text-accent-gold bg-accent-gold/10',
      title: 'Certificado oficial emitido com QR Code',
      description: 'Código DEDS-EXC-2025-9842 registrado com conformidade Lei 9.394/96',
      time: 'Há 45 minutos',
    },
    {
      id: 'act-3',
      type: 'curso',
      icon: 'published_with_changes',
      color: 'text-primary bg-primary/10',
      title: 'Catálogo atualizado',
      description: 'Módulos de IA Generativa e FastAPI adicionados e publicados',
      time: 'Há 2 horas',
    },
    {
      id: 'act-4',
      type: 'comunicado',
      icon: 'campaign',
      color: 'text-secondary bg-secondary/10',
      title: 'Comunicado enviado aos alunos',
      description: 'Notificação sobre novas turmas de mentoria aos sábados',
      time: 'Hoje cedo',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-raised p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between hover:border-border-strong transition-all">
          <div>
            <span className="text-xs text-text-tertiary font-bold uppercase tracking-wider">Alunos &amp; Usuários</span>
            <p className="text-3xl font-bold text-text-primary mt-1">{users.length}</p>
            <div className="flex items-center gap-1 text-[11px] text-accent-emerald-bright font-semibold mt-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              <span>{studentsCount} alunos ativos (+14% no mês)</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('gestao-cursos')}
          className="bg-surface-raised p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between hover:border-primary/50 transition-all cursor-pointer group"
          title="Ver todos os cursos na Gestão de Cursos"
        >
          <div>
            <span className="text-xs text-text-tertiary font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Cursos Ativos (Gestão)</span>
            <p className="text-3xl font-bold text-text-primary mt-1">{activeCoursesCount}</p>
            <div className="flex items-center gap-1 text-[11px] text-primary font-semibold mt-1">
              <span className="material-symbols-outlined text-xs">auto_stories</span>
              <span>{courses.length} cadastrados • Gerenciar →</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl">library_books</span>
          </div>
        </div>

        <div className="bg-surface-raised p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between hover:border-border-strong transition-all">
          <div>
            <span className="text-xs text-text-tertiary font-bold uppercase tracking-wider">Receita Bruta Acumulada</span>
            <p className="text-3xl font-bold text-text-primary mt-1">R$ 148.920</p>
            <div className="flex items-center gap-1 text-[11px] text-accent-emerald-bright font-semibold mt-1">
              <span className="material-symbols-outlined text-xs">payments</span>
              <span>Ticket médio R$ 164,80</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-accent-emerald-bright/10 text-accent-emerald-bright flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">attach_money</span>
          </div>
        </div>

        <div className="bg-surface-raised p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between hover:border-border-strong transition-all">
          <div>
            <span className="text-xs text-text-tertiary font-bold uppercase tracking-wider">Certificados Válidos</span>
            <p className="text-3xl font-bold text-text-primary mt-1">{certificatesCount}</p>
            <div className="flex items-center gap-1 text-[11px] text-accent-gold font-semibold mt-1">
              <span className="material-symbols-outlined text-xs">verified</span>
              <span>Conforme Lei 9.394/96</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 text-accent-gold flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">workspace_premium</span>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">bolt</span>
            Ações Rápidas de Gestão
          </h3>
          <span className="text-xs text-text-tertiary">Acesso direto às ferramentas operacionais</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((act) => (
            <button
              key={act.id}
              onClick={act.action}
              className="p-4 rounded-2xl bg-surface-raised border border-border-subtle hover:border-border-strong hover:bg-surface-overlay transition-all text-left flex flex-col justify-between group cursor-pointer shadow-sm"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${act.color}`}>
                  <span className="material-symbols-outlined text-xl">{act.icon}</span>
                </div>
                <span className="material-symbols-outlined text-text-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all text-base">
                  arrow_forward
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                  {act.title}
                </h4>
                <p className="text-xs text-text-tertiary mt-1 leading-relaxed">
                  {act.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Two Columns: Recent Activities & Top Courses Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-6 bg-surface-raised p-6 rounded-2xl border border-border-subtle shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">history</span>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Atividades Recentes</h3>
            </div>
            <span className="text-[11px] text-accent-emerald-bright font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-accent-emerald-bright animate-ping" />
              Sincronizado
            </span>
          </div>

          <div className="space-y-3.5">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-surface-overlay/60 hover:bg-surface-overlay transition-colors border border-border-subtle/50"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${act.color}`}>
                  <span className="material-symbols-outlined text-base">{act.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-text-primary truncate">{act.title}</h5>
                    <span className="text-[10px] text-text-tertiary whitespace-nowrap">{act.time}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Courses Summary */}
        <div className="lg:col-span-6 bg-surface-raised p-6 rounded-2xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-gold text-xl">star</span>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Cursos Mais Procurados</h3>
              </div>
              <button
                onClick={() => onNavigateTab('gestao-curso')}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Ver todos ({courses.length})
              </button>
            </div>

            <div className="space-y-3">
              {courses.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-surface-overlay transition-colors border border-transparent hover:border-border-subtle"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={c.image}
                      alt={c.title}
                      className="w-10 h-8 rounded-lg object-cover bg-surface-overlay shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{c.title}</p>
                      <span className="text-[10px] text-text-tertiary">
                        {c.category} • {c.hours}h • {c.instructor}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-text-primary block">
                      R$ {c.currentPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[10px] text-accent-emerald-bright font-semibold">
                      ★ {c.rating.toFixed(1)} ({c.reviewsCount})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-tertiary">
            <span>Instrutores Ativos: <strong className="text-text-primary">{instructorsCount}</strong></span>
            <span>Artigos no Blog: <strong className="text-text-primary">{blogCount}</strong></span>
            <span>Categorias: <strong className="text-text-primary">{categoriesCount}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
