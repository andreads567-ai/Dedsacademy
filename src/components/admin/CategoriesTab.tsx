import React, { useState } from 'react';
import { Category, Course } from '../../types';

interface CategoriesTabProps {
  categories: Category[];
  courses: Course[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export interface CategoryIconOption {
  icon: string;
  label: string;
  group: 'tecnologia' | 'negocios' | 'marketing' | 'design' | 'engenharia' | 'saude' | 'geral';
  keywords: string;
}

export const CATEGORY_ICONS: CategoryIconOption[] = [
  // Tecnologia & IA (12)
  { icon: 'memory', label: 'Inteligência Artificial & Hardware', group: 'tecnologia', keywords: 'ia chip hardware processador tecnologia machine learning' },
  { icon: 'code', label: 'Programação & Software', group: 'tecnologia', keywords: 'codigo dev programacao desenvolvimento software fullstack' },
  { icon: 'terminal', label: 'Terminal & DevOps', group: 'tecnologia', keywords: 'linux console backend servidor devops sysadmin' },
  { icon: 'database', label: 'Banco de Dados & Big Data', group: 'tecnologia', keywords: 'sql dados data science postgres storage mongodb' },
  { icon: 'smart_toy', label: 'Robótica & Automação', group: 'tecnologia', keywords: 'robo robotica automacao mecatronica ia bot' },
  { icon: 'cloud', label: 'Cloud Computing & Servidores', group: 'tecnologia', keywords: 'nuvem aws azure gcp cloud server infraestrutura' },
  { icon: 'security', label: 'Cibersegurança & Redes', group: 'tecnologia', keywords: 'seguranca hacker firewalls protecao lgpd cyber' },
  { icon: 'devices', label: 'Dispositivos & Suporte TI', group: 'tecnologia', keywords: 'computador suporte hardware redes tecnologia ti' },
  { icon: 'wifi', label: 'Redes & Telecomunicações', group: 'tecnologia', keywords: 'internet telecom wifi rede wireless conexao' },
  { icon: 'data_object', label: 'Algoritmos, Dados & APIs', group: 'tecnologia', keywords: 'algoritmo logica backend api json estrutura' },
  { icon: 'webhook', label: 'Integrações & Webhooks', group: 'tecnologia', keywords: 'api automacao fluxo conexao integracoes zapier' },
  { icon: 'developer_mode', label: 'Desenvolvimento Mobile & Apps', group: 'tecnologia', keywords: 'app mobile android ios flutter react native' },

  // Negócios & Finanças (12)
  { icon: 'business_center', label: 'Negócios & Gestão Empresarial', group: 'negocios', keywords: 'empresa administracao gestao negocios executivo business' },
  { icon: 'payments', label: 'Finanças & Pagamentos', group: 'negocios', keywords: 'dinheiro financas pagamento banco moeda pix' },
  { icon: 'trending_up', label: 'Investimentos & Mercado de Ações', group: 'negocios', keywords: 'bolsa trade investimento acoes crescimento valuation' },
  { icon: 'analytics', label: 'BI & Análise de Dados de Negócio', group: 'negocios', keywords: 'power bi analytics relatorio dashboard graficos metrics' },
  { icon: 'point_of_sale', label: 'Vendas & Negociação Comercial', group: 'negocios', keywords: 'vendas comercial clientes pdv faturamento crm' },
  { icon: 'receipt_long', label: 'Contabilidade & Área Fiscal', group: 'negocios', keywords: 'fiscal tributario nota recibo contabilidade impostos' },
  { icon: 'account_balance', label: 'Bancos, Governança & Economia', group: 'negocios', keywords: 'banco economia governanca financeiro tesouraria' },
  { icon: 'store', label: 'E-commerce & Varejo Moderno', group: 'negocios', keywords: 'loja ecommerce dropshipping comércio varejo vitrine' },
  { icon: 'pie_chart', label: 'Planejamento Estratégico & OKRs', group: 'negocios', keywords: 'estrategia metas kpi indicadores okr planejamento' },
  { icon: 'currency_exchange', label: 'Câmbio & Mercado Cripto', group: 'negocios', keywords: 'dolar cambio cripto bitcoin forex moedas' },
  { icon: 'savings', label: 'Finanças Pessoais & Poupança', group: 'negocios', keywords: 'poupanca cofrinho patrimonio economia pessoal orcamento' },
  { icon: 'credit_card', label: 'Crédito, Financiamentos & Fintechs', group: 'negocios', keywords: 'cartao fintech meio pagamento credito banking' },

  // Marketing & Comunicação (8)
  { icon: 'campaign', label: 'Marketing Digital & Tráfego Pago', group: 'marketing', keywords: 'marketing trafego ads midia publicidade propaganda' },
  { icon: 'share', label: 'Redes Sociais & Conteúdo Viral', group: 'marketing', keywords: 'social instagram tiktok youtube redes engajamento' },
  { icon: 'translate', label: 'Idiomas & Tradução Técnica', group: 'marketing', keywords: 'ingles espanhol idiomas linguas vocabulario ingles tecnico' },
  { icon: 'forum', label: 'Comunicação & Atendimento ao Cliente', group: 'marketing', keywords: 'chat sac suporte comunicacao crm whatsapp' },
  { icon: 'mail', label: 'Copywriting & Email Marketing', group: 'marketing', keywords: 'copy escrita redacao email cartas newsletter' },
  { icon: 'record_voice_over', label: 'Oratória, Podcast & Comunicação Verbal', group: 'marketing', keywords: 'oratoria voz podcast comunicacao fala apresentacao' },
  { icon: 'public', label: 'Relações Públicas & Negócios Globais', group: 'marketing', keywords: 'internacional mundo relacoes assessoria global' },
  { icon: 'brand_awareness', label: 'Branding & Identidade de Marca', group: 'marketing', keywords: 'marca branding identidade posicionamento reputacao' },

  // Design & Artes (8)
  { icon: 'palette', label: 'Design Gráfico & Teoria das Cores', group: 'design', keywords: 'design cores photoshop ilustrador visual branding' },
  { icon: 'brush', label: 'Ilustração & Arte Digital', group: 'design', keywords: 'arte pintura desenho ilustracao caneta mesa digitalizadora' },
  { icon: 'draw', label: 'Desenho Técnico & Criação Vetorial', group: 'design', keywords: 'croqui desenho vetor criativo sketch' },
  { icon: 'photo_camera', label: 'Fotografia Profissional & Edição', group: 'design', keywords: 'foto camera fotografia ensaio imagem lightroom' },
  { icon: 'videocam', label: 'Produção Audiovisual & Edição de Vídeo', group: 'design', keywords: 'cinema premiere video youtube gravacao filmagem' },
  { icon: 'layers', label: 'UI/UX Design & Experiência do Usuário', group: 'design', keywords: 'figma ui ux interface prototipo navegacao wireframe' },
  { icon: 'view_in_ar', label: 'Modelagem 3D & Realidade Virtual', group: 'design', keywords: '3d blender vr ar realidade modelagem maya render' },
  { icon: 'movie', label: 'Motion Design & Animação 2D/3D', group: 'design', keywords: 'animacao after effects motion filmes computacao grafica' },

  // Engenharia & Operações (8)
  { icon: 'precision_manufacturing', label: 'Engenharia & Automação Industrial', group: 'engenharia', keywords: 'engenharia industria mecanica maquina fabricacao cnc torno' },
  { icon: 'construction', label: 'Construção Civil & Gestão de Obras', group: 'engenharia', keywords: 'obras civil construcao engenheiro predio canteiro' },
  { icon: 'architecture', label: 'Arquitetura, Plantas & Metodologia BIM', group: 'engenharia', keywords: 'arquitetura planta autocad revit maquete urbanismo' },
  { icon: 'handyman', label: 'Manutenção, Reparos & Instalações', group: 'engenharia', keywords: 'ferramenta manutencao reparo eletricista mecanico hidraulica' },
  { icon: 'bolt', label: 'Engenharia Elétrica & Alta Tensão', group: 'engenharia', keywords: 'energia eletrica raio potencia instalacoes subestacao' },
  { icon: 'local_shipping', label: 'Logística & Cadeia de Suprimentos', group: 'engenharia', keywords: 'transporte frete logistica caminhao entrega supply chain' },
  { icon: 'inventory_2', label: 'Gestão de Estoques & Armazenagem', group: 'engenharia', keywords: 'estoque armazenagem caixa suprimentos almoxarifado wms' },
  { icon: 'solar_power', label: 'Energia Solar Fotovoltaica & Renováveis', group: 'engenharia', keywords: 'solar painel sustentabilidade renovavel energia eolica' },

  // Saúde, Ciências & Meio Ambiente (8)
  { icon: 'medical_services', label: 'Saúde, Enfermagem & Clínica', group: 'saude', keywords: 'medicina hospital saude medico primeiros socorros enfermagem' },
  { icon: 'health_and_safety', label: 'Segurança do Trabalho (SST & NRs)', group: 'saude', keywords: 'epi nr seguranca trabalho saude ocupacional prevencao' },
  { icon: 'biotech', label: 'Biotecnologia & Laboratório Genético', group: 'saude', keywords: 'biologia dna laboratorio quimica pesquisa genetica' },
  { icon: 'science', label: 'Ciências Exatas & Pesquisa Científica', group: 'saude', keywords: 'ciencia quimica fisica experimento laboratório' },
  { icon: 'eco', label: 'Sustentabilidade, Ecologia & ESG', group: 'saude', keywords: 'folha verde ecologia ambiente natureza sustentavel esg' },
  { icon: 'nutrition', label: 'Nutrição Clínica & Dietética', group: 'saude', keywords: 'nutricao comida dieta alimentos refeicao saude' },
  { icon: 'fitness_center', label: 'Educação Física, Treino & Esportes', group: 'saude', keywords: 'treino academia musculacao esporte fitness personal' },
  { icon: 'psychology', label: 'Psicologia & Desenvolvimento Humano', group: 'saude', keywords: 'psicologia mente cerebro comportamento terapia inteligencia emocional' },

  // Recursos Humanos, Direito & Educação (8)
  { icon: 'groups', label: 'Recursos Humanos & Gestão de Pessoas', group: 'geral', keywords: 'rh pessoas equipes contratacao departamento pessoal feedback' },
  { icon: 'school', label: 'Educação, Pedagogia & Didática', group: 'geral', keywords: 'escola faculdade professor pedagogia formatura aula ead' },
  { icon: 'gavel', label: 'Direito, Legislação & Advocacia', group: 'geral', keywords: 'juridico direito advogado lei justica normas contratos' },
  { icon: 'verified_user', label: 'Compliance, LGPD & Auditoria', group: 'geral', keywords: 'auditoria conformidade certificacao protecao normas lgpd' },
  { icon: 'workspace_premium', label: 'Liderança & Certificações Executivas', group: 'geral', keywords: 'premio medalha certificado qualidade gestor executivo lideranca' },
  { icon: 'auto_stories', label: 'Cursos Livres, Livros & Metodologia', group: 'geral', keywords: 'livro leitura estudos apostilas aula metodo aprendizagem' },
  { icon: 'lightbulb', label: 'Inovação, Criatividade & Resolução de Problemas', group: 'geral', keywords: 'criatividade ideia inovacao brainstorm solucao design thinking' },
  { icon: 'rocket_launch', label: 'Startups, Aceleração & Empreendedorismo', group: 'geral', keywords: 'startup foguete lancamento aceleracao futuro empreendedor' },
];

export const AVAILABLE_ICONS = CATEGORY_ICONS.map((ci) => ci.icon);

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  courses,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState(AVAILABLE_ICONS[0]);
  const [iconSearch, setIconSearch] = useState('');
  const [selectedIconGroup, setSelectedIconGroup] = useState<
    'todos' | 'tecnologia' | 'negocios' | 'marketing' | 'design' | 'engenharia' | 'saude' | 'geral'
  >('todos');

  // Calculate dynamic courses count per category
  const getCourseCountForCategory = (catName: string) => {
    return courses.filter((c) => c.category.toLowerCase() === catName.toLowerCase()).length;
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryIcon(AVAILABLE_ICONS[0]);
    setIconSearch('');
    setSelectedIconGroup('todos');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryIcon(cat.icon || AVAILABLE_ICONS[0]);
    setIconSearch('');
    setSelectedIconGroup('todos');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    if (editingCategory) {
      onUpdateCategory({
        ...editingCategory,
        name: categoryName.trim(),
        icon: categoryIcon,
      });
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: categoryName.trim(),
        courseCount: 0,
        icon: categoryIcon,
      };
      onAddCategory(newCat);
    }
    setIsModalOpen(false);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredIcons = CATEGORY_ICONS.filter((item) => {
    const matchesGroup = selectedIconGroup === 'todos' || item.group === selectedIconGroup;
    const matchesSearch =
      !iconSearch.trim() ||
      item.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
      item.keywords.toLowerCase().includes(iconSearch.toLowerCase()) ||
      item.icon.toLowerCase().includes(iconSearch.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const currentSelectedIconOption = CATEGORY_ICONS.find((ci) => ci.icon === categoryIcon) || {
    icon: categoryIcon,
    label: 'Ícone Personalizado',
    group: 'geral' as const,
    keywords: '',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">category</span>
              Gestão de Categorias &amp; Áreas de Conhecimento
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary">
              {categories.length} Categorias Ativas
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Organize os cursos por áreas acadêmicas e profissionais para facilitar a navegação do aluno.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Nova Categoria
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-base">
          search
        </span>
        <input
          type="text"
          placeholder="Buscar categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
        />
      </div>

      {/* Categories Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const count = getCourseCountForCategory(cat.name) || cat.courseCount || 0;
          return (
            <div
              key={cat.id}
              className="p-5 rounded-2xl bg-surface-raised border border-border-subtle hover:border-border-strong transition-all flex flex-col justify-between shadow-sm group"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">{cat.icon || 'folder'}</span>
                </div>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg bg-surface-overlay hover:bg-surface-container text-text-secondary hover:text-text-primary text-xs cursor-pointer"
                    title="Editar Categoria"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover a categoria "${cat.name}"?`)) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-surface-overlay hover:bg-status-danger/20 text-text-secondary hover:text-status-danger text-xs cursor-pointer"
                    title="Excluir Categoria"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors">
                  {cat.name}
                </h4>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle/50 text-xs">
                  <span className="text-text-tertiary">Cursos Ativos:</span>
                  <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {count} curso(s)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Criar / Editar Categoria */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between bg-surface-overlay flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">category</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {editingCategory ? 'Editar Categoria' : 'Cadastrar Nova Categoria'}
                  </h3>
                  <p className="text-[11px] text-text-tertiary">
                    Defina o título e escolha o ícone temático entre as {CATEGORY_ICONS.length} opções disponíveis.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Nome da Categoria */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                  Nome da Categoria <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ex: Inteligência Artificial & Robótica"
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary placeholder:text-text-tertiary"
                />
              </div>

              {/* Seletor de Ícones Representativos (64 Ícones) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-text-secondary">
                    Selecione o Ícone Representativo
                  </label>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                    {CATEGORY_ICONS.length} ícones temáticos
                  </span>
                </div>

                {/* Card de Pré-visualização do Ícone Ativo */}
                <div className="flex items-center justify-between p-3 bg-surface-overlay border border-primary/30 rounded-xl mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">{categoryIcon}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary block font-bold uppercase tracking-wider">
                        Ícone Selecionado
                      </span>
                      <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        <span>{currentSelectedIconOption.label}</span>
                        <span className="text-[10px] text-primary font-mono font-normal">
                          ({categoryIcon})
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-accent-emerald-bright font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-700/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ativo
                  </span>
                </div>

                {/* Barra de Busca rápida dentro dos ícones */}
                <div className="relative mb-2.5">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Pesquisar entre os 64 ícones (ex: código, finanças, saúde, robô, marketing)..."
                    className="w-full pl-9 pr-8 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary placeholder:text-text-tertiary"
                  />
                  {iconSearch && (
                    <button
                      type="button"
                      onClick={() => setIconSearch('')}
                      className="absolute right-2.5 top-2 text-text-tertiary hover:text-text-primary text-xs cursor-pointer p-0.5"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>

                {/* Filtros por Categorias Temáticas de Ícones */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-2.5 text-[11px] scrollbar-thin">
                  {[
                    { id: 'todos', label: `Todos (${CATEGORY_ICONS.length})` },
                    { id: 'tecnologia', label: 'Tecnologia & IA' },
                    { id: 'negocios', label: 'Negócios' },
                    { id: 'marketing', label: 'Marketing' },
                    { id: 'design', label: 'Design & Artes' },
                    { id: 'engenharia', label: 'Engenharia' },
                    { id: 'saude', label: 'Saúde & Ciências' },
                    { id: 'geral', label: 'Geral & RH' },
                  ].map((grp) => (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => setSelectedIconGroup(grp.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                        selectedIconGroup === grp.id
                          ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                          : 'bg-surface-overlay text-text-tertiary hover:text-text-primary hover:bg-surface-container border border-border-subtle/50'
                      }`}
                    >
                      {grp.label}
                    </button>
                  ))}
                </div>

                {/* Grade dos Ícones com Scrollbar Suave (Mínimo de 40+ ícones, total de 64 ícones) */}
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 bg-surface-overlay rounded-xl border border-border-subtle max-h-56 overflow-y-auto">
                  {filteredIcons.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-text-tertiary text-xs">
                      <span className="material-symbols-outlined text-3xl mb-1 text-text-tertiary/50 block">
                        search_off
                      </span>
                      <p className="font-semibold text-text-secondary">Nenhum ícone encontrado</p>
                      <p className="text-[11px] mt-0.5">
                        Não encontramos resultados para "{iconSearch}".
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIconSearch('');
                          setSelectedIconGroup('todos');
                        }}
                        className="mt-2 text-primary font-bold hover:underline cursor-pointer"
                      >
                        Ver todos os {CATEGORY_ICONS.length} ícones
                      </button>
                    </div>
                  ) : (
                    filteredIcons.map((item) => {
                      const isSelected = categoryIcon === item.icon;
                      return (
                        <button
                          key={item.icon}
                          type="button"
                          onClick={() => setCategoryIcon(item.icon)}
                          title={`${item.label} (${item.icon})`}
                          className={`h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
                            isSelected
                              ? 'bg-primary-container text-on-primary shadow-md scale-105 ring-2 ring-primary/50 font-bold'
                              : 'text-text-secondary hover:bg-surface-container hover:text-text-primary border border-transparent hover:border-border-subtle/60'
                          }`}
                        >
                          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
                            {item.icon}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <p className="text-[10px] text-text-tertiary mt-2">
                  Exibindo {filteredIcons.length} ícones. Passe o cursor para ver a descrição detalhada de cada símbolo.
                </p>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-overlay hover:bg-surface-container text-text-secondary hover:text-text-primary text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
