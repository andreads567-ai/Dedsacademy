import React from 'react';
import { BlogPost } from '../types';

interface Announcement {
  id: string;
  title: string;
  author: string;
  date: string;
  priority: string;
}

interface BlogHomeSectionProps {
  blogPosts: BlogPost[];
  announcements?: Announcement[];
  onOpenBlogPage: () => void;
  onSelectPost?: (post: BlogPost) => void;
}

export const BlogHomeSection: React.FC<BlogHomeSectionProps> = ({
  blogPosts,
  announcements = [],
  onOpenBlogPage,
  onSelectPost,
}) => {
  // Only display published posts on the Home page
  const publishedPosts = blogPosts.filter((p) => !p.status || p.status === 'publicado');
  const recentPosts = publishedPosts.slice(0, 3);
  const latestAnnouncement = announcements[0];

  return (
    <section id="blog-section" className="w-full py-16 lg:py-24 bg-surface-container-lowest border-t border-border-subtle/50 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent-emerald-bright/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop relative z-10 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border-subtle/60">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-sm text-xs font-bold tracking-wider uppercase">
              <span className="material-symbols-outlined text-sm">auto_stories</span>
              <span>Blog &amp; Comunicados Acadêmicos</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
              Artigos, Notícias e Orientações Oficiais
            </h2>
            <p className="font-body-md text-sm sm:text-base text-text-secondary leading-relaxed">
              Orientações sobre validação de horas complementares (MEC / Lei 9.394/96), dicas de carreira tech e comunicados pedagógicos atualizados pela equipe.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenBlogPage}
            className="self-start md:self-auto px-5 py-3 rounded-xl bg-surface-raised hover:bg-surface-overlay border border-border-subtle hover:border-primary/50 text-text-primary text-xs font-bold transition-all shadow-sm flex items-center gap-2 group cursor-pointer"
          >
            <span>Ver Todos os Artigos</span>
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Official Announcement Banner (from Admin Módulo 9) */}
        {latestAnnouncement && (
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-raised border border-primary/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30">
                <span className="material-symbols-outlined text-xl">campaign</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-primary text-black uppercase tracking-wider">
                    Comunicado Geral
                  </span>
                  <span className="text-[11px] text-text-tertiary">
                    {latestAnnouncement.date || 'Hoje'} • {latestAnnouncement.author || 'Coordenação'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-text-primary">
                  {latestAnnouncement.title}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenBlogPage}
              className="px-3.5 py-2 rounded-lg bg-surface-overlay hover:bg-primary/15 text-primary text-xs font-semibold border border-border-subtle hover:border-primary/30 transition-colors shrink-0 cursor-pointer"
            >
              Ver Detalhes
            </button>
          </div>
        )}

        {/* Articles Grid */}
        {recentPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => {
                  if (onSelectPost) onSelectPost(post);
                  else onOpenBlogPage();
                }}
                className="group flex flex-col rounded-2xl bg-surface-raised border border-border-subtle hover:border-primary/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                {/* Post Cover Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-overlay">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-black/70 backdrop-blur-md text-white border border-white/10 uppercase tracking-wider">
                      {post.category || 'Acadêmico'}
                    </span>
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                      <span className="material-symbols-outlined text-xs">calendar_today</span>
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>{post.author}</span>
                    </div>

                    <h3 className="font-headline-sm text-base font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    <p className="font-body-sm text-xs text-text-secondary line-clamp-3 leading-relaxed">
                      {post.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border-subtle/50 flex items-center justify-between text-xs font-bold text-primary">
                    <span className="group-hover:underline">Ler artigo completo</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border-subtle bg-surface-raised space-y-3">
            <span className="material-symbols-outlined text-4xl text-text-tertiary">post_add</span>
            <p className="text-sm font-bold text-text-primary">Nenhum artigo publicado no momento</p>
            <p className="text-xs text-text-tertiary max-w-sm mx-auto">
              Utilize o Módulo 9 (Blog &amp; Banners) no painel administrativo para redigir artigos sobre horas complementares e comunicados.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
