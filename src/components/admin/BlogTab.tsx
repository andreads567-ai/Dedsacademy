import React, { useState, useRef } from 'react';
import { BlogPost, HeroBannerConfig, MiddlePromoBannerConfig, CheckoutPaymentBannerConfig } from '../../types';
import { CheckoutBannerManagerTab } from './CheckoutBannerManagerTab';
import { HeroBannerManagerTab } from './HeroBannerManagerTab';
import { MiddleBannerManagerTab } from './MiddleBannerManagerTab';
import { optimizeImageFile } from '../../lib/imageOptimizer';
import { uploadImageToServer } from '../../lib/platformSyncClient';

interface BlogTabProps {
  posts: BlogPost[];
  onAddPost: (post: BlogPost) => void;
  onUpdatePost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
  announcements: { id: string; title: string; author: string; date: string; priority: string }[];
  onAddAnnouncement: (title: string) => void;
  heroBannerConfig?: HeroBannerConfig;
  onUpdateHeroBannerConfig?: (config: HeroBannerConfig) => void;
  middleBannerConfig?: MiddlePromoBannerConfig;
  onUpdateMiddleBannerConfig?: (config: MiddlePromoBannerConfig) => void;
  checkoutBannerConfig?: CheckoutPaymentBannerConfig;
  onUpdateCheckoutBannerConfig?: (config: CheckoutPaymentBannerConfig) => void;
}

export const BlogTab: React.FC<BlogTabProps> = ({
  posts,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  announcements,
  onAddAnnouncement,
  heroBannerConfig,
  onUpdateHeroBannerConfig,
  middleBannerConfig,
  onUpdateMiddleBannerConfig,
  checkoutBannerConfig,
  onUpdateCheckoutBannerConfig,
}) => {
  const [subTab, setSubTab] = useState<'artigos' | 'banner-home' | 'banner-faixa' | 'banner-pagamentos'>('artigos');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    title: '',
    category: 'Horas Complementares',
    author: 'Coordenação Pedagógica Deds',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
    summary: '',
    status: 'publicado' as 'publicado' | 'rascunho',
  });

  const handleOpenCreate = () => {
    setEditingPost(null);
    setImageFileName('');
    setForm({
      title: '',
      category: 'Horas Complementares',
      author: 'Coordenação Pedagógica Deds',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
      summary: '',
      status: 'publicado',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setImageFileName('');
    setForm({
      title: post.title,
      category: post.category,
      author: post.author,
      image: post.image,
      summary: post.summary,
      status: post.status,
    });
    setIsModalOpen(true);
  };

  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleImageFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }
    try {
      setIsProcessingImage(true);
      const optimized = await optimizeImageFile(file, {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.85,
      });
      const serverUrl = await uploadImageToServer(optimized.dataUrl, 'blog');
      setForm((prev) => ({ ...prev, image: serverUrl }));
      setImageFileName(`${optimized.name} (${optimized.sizeKb} KB - Servidor)`);
    } catch (err: any) {
      alert(err?.message || 'Falha ao processar arquivo de imagem.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (editingPost) {
      onUpdatePost({
        ...editingPost,
        title: form.title.trim(),
        category: form.category,
        author: form.author,
        image: form.image,
        summary: form.summary,
        status: form.status,
      });
    } else {
      const newPost: BlogPost = {
        id: `blog-${Date.now()}`,
        title: form.title.trim(),
        category: form.category,
        author: form.author,
        date: new Date().toLocaleDateString('pt-BR'),
        image: form.image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
        summary: form.summary,
        status: form.status,
        viewsCount: 1,
      };
      onAddPost(newPost);
    }
    setIsModalOpen(false);
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;
    onAddAnnouncement(newAnnouncementText.trim());
    setNewAnnouncementText('');
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">auto_stories</span>
              Gestão de Blog &amp; Banners Promocionais
            </h2>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Publique matérias sobre horas complementares, Lei 9.394/96, comunicados acadêmicos e configure o banner principal da Home.
          </p>
        </div>

        {subTab === 'artigos' && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">post_add</span>
            Novo Artigo no Blog
          </button>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSubTab('artigos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            subTab === 'artigos'
              ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
          }`}
        >
          <span className="material-symbols-outlined text-base">article</span>
          <span>1. Artigos do Blog &amp; Comunicados</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            subTab === 'artigos' ? 'bg-primary text-black' : 'bg-surface-overlay text-text-tertiary'
          }`}>
            {posts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('banner-home')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            subTab === 'banner-home'
              ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
          }`}
        >
          <span className="material-symbols-outlined text-base">wallpaper</span>
          <span>2. Banner Principal da Home (Hero Image)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-emerald-bright/20 text-accent-emerald-bright border border-accent-emerald-bright/30">
            Ao Vivo na Home
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('banner-faixa')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            subTab === 'banner-faixa'
              ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
          }`}
        >
          <span className="material-symbols-outlined text-base">view_agenda</span>
          <span>3. Banner Faixa (Meio da Home)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              middleBannerConfig?.enabled !== false
                ? 'bg-accent-emerald-bright/20 text-accent-emerald-bright border-accent-emerald-bright/30'
                : 'bg-surface-overlay text-text-tertiary border-border-subtle'
            }`}
          >
            {middleBannerConfig?.enabled !== false ? 'Ativo' : 'Oculto'}
          </span>
        </button>
      
        <button
          type="button"
          onClick={() => setSubTab('banner-pagamentos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            subTab === 'banner-pagamentos'
              ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
          }`}
        >
          <span className="material-symbols-outlined text-base">credit_card</span>
          <span>4. Banner Pagamentos</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              checkoutBannerConfig?.enabled !== false
                ? 'bg-accent-emerald-bright/20 text-accent-emerald-bright border-accent-emerald-bright/30'
                : 'bg-surface-overlay text-text-tertiary border-border-subtle'
            }`}
          >
            {checkoutBannerConfig?.enabled !== false ? 'Ativo' : 'Oculto'}
          </span>
        </button>
      </div>

      {/* Tab 2: Banner Principal da Home */}
      {subTab === 'banner-home' && (
        <HeroBannerManagerTab
          currentConfig={heroBannerConfig}
          onSaveConfig={onUpdateHeroBannerConfig || (() => {})}
        />
      )}

      {/* Tab 4: Banner Pagamentos (Checkout) */}
      {subTab === 'banner-pagamentos' && (
        <CheckoutBannerManagerTab
          currentConfig={checkoutBannerConfig}
          onSaveConfig={onUpdateCheckoutBannerConfig || (() => {})}
        />
      )}

      {/* Tab 3: Banner Faixa (Meio da Home) */}
      {subTab === 'banner-faixa' && (
        <MiddleBannerManagerTab
          currentConfig={middleBannerConfig}
          onSaveConfig={onUpdateMiddleBannerConfig || (() => {})}
        />
      )}

      {/* Tab 1: Artigos do Blog & Comunicados */}
      {subTab === 'artigos' && (
        <div className="space-y-6">

          {/* Quick Announcement Publisher Banner */}
          <div className="bg-surface-raised p-5 rounded-2xl border border-border-subtle shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">campaign</span>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Publicar Aviso Imediato no Painel de Todos os Alunos
              </h3>
            </div>
            <form onSubmit={handleCreateNotice} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Ex: Atualização no módulo de Python liberada; plantão de dúvidas na quinta-feira..."
                value={newAnnouncementText}
                onChange={(e) => setNewAnnouncementText(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                Emitir Comunicado
              </button>
            </form>
          </div>

          {/* Search and Blog Posts Grid */}
          <div className="space-y-4">
            <div className="relative max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-base">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por título do artigo, autor ou tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-5 rounded-2xl bg-surface-raised border border-border-subtle hover:border-border-strong transition-all flex flex-col justify-between shadow-sm group"
                >
                  <div>
                    <div className="flex items-start gap-4 mb-3">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-20 h-16 rounded-xl object-cover bg-surface-overlay shrink-0 border border-border-subtle"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                            {post.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              post.status === 'publicado'
                                ? 'bg-accent-emerald-bright/20 text-accent-emerald-bright'
                                : 'bg-accent-gold/20 text-accent-gold'
                            }`}
                          >
                            {post.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-text-primary mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {post.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between text-xs">
                    <span className="text-text-tertiary text-[11px]">
                      Por {post.author} • {post.date}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(post)}
                        className="p-1.5 rounded-lg bg-surface-overlay hover:bg-surface-container text-text-secondary hover:text-text-primary text-xs cursor-pointer"
                        title="Editar Artigo"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover a matéria "${post.title}"?`)) {
                            onDeletePost(post.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-surface-overlay hover:bg-status-danger/20 text-text-secondary hover:text-status-danger text-xs cursor-pointer"
                        title="Excluir Artigo"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar / Editar Artigo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-xl bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-overlay">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">article</span>
                <h3 className="text-base font-bold text-text-primary">
                  {editingPost ? 'Atualizar Artigo do Blog' : 'Criar Nova Matéria no Blog'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-text-tertiary hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Título do Artigo <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Como validar seu certificado para horas complementares na faculdade"
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Categoria / Tema
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Horas Complementares">Horas Complementares (AACC)</option>
                    <option value="Institucional">Institucional &amp; Legal</option>
                    <option value="Certificação">Certificação &amp; Validação</option>
                    <option value="Tecnologia & Carreira">Tecnologia &amp; Carreira</option>
                    <option value="Segurança da Conta">Segurança da Conta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Autor Responsável
                  </label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Status de Publicação
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="publicado">Publicado (Visível no Blog)</option>
                    <option value="rascunho">Rascunho</option>
                  </select>
                </div>
              </div>

              {/* Upload e Imagem de Destaque */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Imagem de Destaque
                </label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">cloud_upload</span>
                      <span>Fazer Upload da Imagem</span>
                    </button>
                    {imageFileName && (
                      <span className="text-xs text-accent-emerald-bright font-medium truncate max-w-[220px]">
                        ✓ {imageFileName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {form.image && (
                      <div className="w-20 h-14 rounded-xl overflow-hidden border border-border-subtle shrink-0 bg-surface-overlay">
                        <img
                          src={form.image}
                          alt="Prévia"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={form.image}
                        onChange={(e) => {
                          setForm({ ...form, image: e.target.value });
                          setImageFileName('');
                        }}
                        placeholder="Ou cole a URL da imagem (https://...)"
                        className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Resumo / Introdução da Matéria
                </label>
                <textarea
                  rows={3}
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Escreva uma breve sinopse do tema abordado..."
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-overlay text-text-secondary hover:text-text-primary text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingPost ? 'Salvar Alterações' : 'Publicar Matéria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
