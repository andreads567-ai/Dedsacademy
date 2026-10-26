import React, { useState, useMemo, useEffect } from 'react';
import { Course, UserAccount, SaleTransaction } from '../../types';

interface AnalyticsTabProps {
  courses: Course[];
  users: UserAccount[];
}

const INITIAL_SALES: SaleTransaction[] = [
  {
    id: 'sale-001',
    orderNumber: 'ORD-2026-9841',
    studentName: 'André da Silva',
    studentEmail: 'andre.silva@exemplo.com.br',
    studentCpf: '384.920.118-04',
    courseId: 'curso-1',
    courseTitle: 'Inteligência Artificial & Engenharia de Prompts',
    courseCategory: 'Tecnologia & IA',
    amount: 189.9,
    paymentMethod: 'PIX',
    date: '2026-10-24',
    time: '14:32',
    status: 'aprovada',
  },
  {
    id: 'sale-002',
    orderNumber: 'ORD-2026-9842',
    studentName: 'Mariana Costa Rios',
    studentEmail: 'mariana.costa@empresa.com.br',
    studentCpf: '492.103.882-15',
    courseId: 'curso-2',
    courseTitle: 'Formação em Python do Zero ao Avançado',
    courseCategory: 'Tecnologia & IA',
    amount: 179.9,
    paymentMethod: 'Cartão de Crédito',
    date: '2026-10-22',
    time: '11:15',
    status: 'aprovada',
  },
  {
    id: 'sale-003',
    orderNumber: 'ORD-2026-9843',
    studentName: 'Carlos Eduardo Nogueira',
    studentEmail: 'carlos.edu@techmail.com',
    studentCpf: '201.884.912-70',
    courseId: 'curso-3',
    courseTitle: 'Finanças Corporativas, Valuation & M&A',
    courseCategory: 'Finanças & Negócios',
    amount: 229.0,
    paymentMethod: 'PIX',
    date: '2026-09-18',
    time: '16:45',
    status: 'aprovada',
  },
  {
    id: 'sale-004',
    orderNumber: 'ORD-2026-9844',
    studentName: 'Fernanda Albuquerque',
    studentEmail: 'fernanda.alb@agencia.com',
    studentCpf: '118.492.301-88',
    courseId: 'curso-4',
    courseTitle: 'Growth Hacking & Marketing de Performance',
    courseCategory: 'Marketing Digital',
    amount: 149.0,
    paymentMethod: 'Cartão de Crédito',
    date: '2026-09-05',
    time: '09:20',
    status: 'cancelada',
    cancelledAt: '2026-09-07',
    cancellationReason: 'Direito de arrependimento (7 dias) - Solicitado pelo aluno',
  },
  {
    id: 'sale-005',
    orderNumber: 'ORD-2026-9845',
    studentName: 'Rodrigo Medeiros',
    studentEmail: 'rodrigo.m@startup.io',
    studentCpf: '732.190.441-29',
    courseId: 'curso-1',
    courseTitle: 'Inteligência Artificial & Engenharia de Prompts',
    courseCategory: 'Tecnologia & IA',
    amount: 189.9,
    paymentMethod: 'PIX',
    date: '2026-08-14',
    time: '18:10',
    status: 'aprovada',
  },
  {
    id: 'sale-006',
    orderNumber: 'ORD-2026-9846',
    studentName: 'Beatriz Vasconcelos',
    studentEmail: 'beatriz.v@designstudio.com',
    studentCpf: '551.902.314-99',
    courseId: 'curso-5',
    courseTitle: 'Design System & UI/UX Avançado no Figma',
    courseCategory: 'Design & UI/UX',
    amount: 169.9,
    paymentMethod: 'Boleto Bancário',
    date: '2026-07-29',
    time: '10:05',
    status: 'pendente',
  },
  {
    id: 'sale-007',
    orderNumber: 'ORD-2025-8710',
    studentName: 'Lucas Barreto',
    studentEmail: 'lucas.barreto@gmail.com',
    studentCpf: '319.402.198-50',
    courseId: 'curso-2',
    courseTitle: 'Formação em Python do Zero ao Avançado',
    courseCategory: 'Tecnologia & IA',
    amount: 159.0,
    paymentMethod: 'PIX',
    date: '2025-11-20',
    time: '20:14',
    status: 'aprovada',
  },
  {
    id: 'sale-008',
    orderNumber: 'ORD-2025-8711',
    studentName: 'Juliana Pires',
    studentEmail: 'juliana.pires@consultoria.com.br',
    studentCpf: '601.892.441-33',
    courseId: 'curso-3',
    courseTitle: 'Finanças Corporativas, Valuation & M&A',
    courseCategory: 'Finanças & Negócios',
    amount: 219.0,
    paymentMethod: 'Cartão de Crédito',
    date: '2025-10-15',
    time: '15:40',
    status: 'aprovada',
  },
];

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ courses, users }) => {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ano' | 'todos'>('30d');

  // Sales List State synchronized with localStorage
  const [salesList, setSalesList] = useState<SaleTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('deds_sales_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SALES;
  });

  // Save to localStorage whenever sales change
  useEffect(() => {
    try {
      localStorage.setItem('deds_sales_transactions', JSON.stringify(salesList));
    } catch {}
  }, [salesList]);

  // Advanced Date Filter States
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aprovada' | 'pendente' | 'cancelada'>('todos');
  const [yearFilter, setYearFilter] = useState<'todos' | '2026' | '2025'>('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Cancellation Modal State
  const [saleToCancel, setSaleToCancel] = useState<SaleTransaction | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Direito de arrependimento (7 dias)');
  const [customReason, setCustomReason] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Filter Sales Logic
  const filteredSales = useMemo(() => {
    return salesList.filter((sale) => {
      // Text search
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matches =
          sale.orderNumber.toLowerCase().includes(q) ||
          sale.studentName.toLowerCase().includes(q) ||
          sale.studentEmail.toLowerCase().includes(q) ||
          sale.courseTitle.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status
      if (statusFilter !== 'todos' && sale.status !== statusFilter) {
        return false;
      }

      // Year filter
      if (yearFilter !== 'todos') {
        if (!sale.date.startsWith(yearFilter)) return false;
      }

      // Date range filter
      if (startDate && sale.date < startDate) return false;
      if (endDate && sale.date > endDate) return false;

      return true;
    });
  }, [salesList, searchFilter, statusFilter, yearFilter, startDate, endDate]);

  // Sales Summary KPIs
  const salesSummary = useMemo(() => {
    const totalCount = filteredSales.length;
    const approved = filteredSales.filter((s) => s.status === 'aprovada');
    const cancelled = filteredSales.filter((s) => s.status === 'cancelada');
    const pending = filteredSales.filter((s) => s.status === 'pendente');

    const totalRevenue = approved.reduce((acc, s) => acc + s.amount, 0);
    const averageTicket = approved.length > 0 ? totalRevenue / approved.length : 0;
    const cancellationRate = totalCount > 0 ? (cancelled.length / totalCount) * 100 : 0;

    return {
      totalCount,
      approvedCount: approved.length,
      cancelledCount: cancelled.length,
      pendingCount: pending.length,
      totalRevenue,
      averageTicket,
      cancellationRate,
    };
  }, [filteredSales]);

  // Handle Cancellation Action
  const handleConfirmCancellation = () => {
    if (!saleToCancel) return;

    const finalReason = cancellationReason === 'Outro' ? customReason.trim() || 'Cancelamento administrativo' : cancellationReason;

    const updated = salesList.map((s) =>
      s.id === saleToCancel.id
        ? {
            ...s,
            status: 'cancelada' as const,
            cancelledAt: new Date().toISOString().split('T')[0],
            cancellationReason: finalReason,
          }
        : s
    );

    setSalesList(updated);

    // Revert enrollment in student's account if found
    try {
      const usersStr = localStorage.getItem('deds_users_list');
      if (usersStr) {
        const userList: UserAccount[] = JSON.parse(usersStr);
        const targetIdx = userList.findIndex(
          (u) => u.email.toLowerCase() === saleToCancel.studentEmail.toLowerCase()
        );
        if (targetIdx !== -1) {
          const userObj = userList[targetIdx];
          userList[targetIdx] = {
            ...userObj,
            enrolledCourseIds: userObj.enrolledCourseIds.filter((cId) => cId !== saleToCancel.courseId),
          };
          localStorage.setItem('deds_users_list', JSON.stringify(userList));
        }
      }
    } catch (err) {
      console.warn('Erro ao sincronizar cancelamento com usuários:', err);
    }

    showToast(`Venda ${saleToCancel.orderNumber} cancelada e matrícula revertida no banco.`);
    setSaleToCancel(null);
    setCustomReason('');
  };

  // Clear all filters
  const handleResetFilters = () => {
    setSearchFilter('');
    setStatusFilter('todos');
    setYearFilter('todos');
    setStartDate('');
    setEndDate('');
  };

  // Export Sales to CSV
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      alert('Nenhuma venda encontrada para exportar com os filtros atuais.');
      return;
    }

    const headers = ['Pedido', 'Data', 'Hora', 'Aluno', 'E-mail', 'CPF', 'Curso', 'Categoria', 'Valor (R$)', 'Forma de Pagamento', 'Status', 'Motivo Cancelamento'];
    const rows = filteredSales.map((s) => [
      s.orderNumber,
      s.date,
      s.time,
      `"${s.studentName}"`,
      s.studentEmail,
      s.studentCpf || '',
      `"${s.courseTitle}"`,
      `"${s.courseCategory}"`,
      s.amount.toFixed(2),
      s.paymentMethod,
      s.status.toUpperCase(),
      `"${s.cancellationReason || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_vendas_deds_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório de vendas exportado com sucesso em CSV!');
  };

  const monthlyRevenue = [
    { month: 'Jan', revenue: 14200, height: '65%' },
    { month: 'Fev', revenue: 16800, height: '72%' },
    { month: 'Mar', revenue: 19400, height: '80%' },
    { month: 'Abr', revenue: 18100, height: '76%' },
    { month: 'Mai', revenue: 21500, height: '88%' },
    { month: 'Jun', revenue: 24300, height: '94%' },
    { month: 'Jul', revenue: 26900, height: '98%' },
    { month: 'Ago', revenue: 25400, height: '92%' },
    { month: 'Set', revenue: 28900, height: '100%' },
    { month: 'Out', revenue: 31200, height: '100%' },
  ];

  const categoryDistribution = [
    { name: 'Tecnologia & IA', share: 38, count: '3.120 alunos', color: 'bg-primary' },
    { name: 'Finanças & Negócios', share: 24, count: '1.980 alunos', color: 'bg-secondary' },
    { name: 'Marketing Digital', share: 18, count: '1.450 alunos', color: 'bg-accent-emerald-bright' },
    { name: 'Design & UI/UX', share: 12, count: '980 alunos', color: 'bg-accent-gold' },
    { name: 'Recursos Humanos & Outros', share: 8, count: '640 alunos', color: 'bg-purple-400' },
  ];

  const paymentMethods = [
    { method: 'PIX Instantâneo', share: '62%', count: 'R$ 92.330', icon: 'qr_code_2', color: 'text-accent-emerald-bright' },
    { method: 'Cartão de Crédito (até 12x)', share: '31%', count: 'R$ 46.165', icon: 'credit_card', color: 'text-primary' },
    { method: 'Boleto Bancário', share: '7%', count: 'R$ 10.425', icon: 'receipt_long', color: 'text-text-tertiary' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-4 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-white/20 animate-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Header & Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">insights</span>
            Módulo de Análise &amp; Relatório de Vendas Funcional
          </h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            Gestão analítica completa: vendas realizadas, controle de cancelamentos, filtros de datas avançados e BI educacional.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-surface-raised rounded-xl border border-border-subtle flex-wrap">
          <button
            type="button"
            onClick={() => setPeriod('30d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === '30d'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Últimos 30 dias
          </button>
          <button
            type="button"
            onClick={() => setPeriod('90d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === '90d'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Últimos 90 dias
          </button>
          <button
            type="button"
            onClick={() => setPeriod('ano')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'ano'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Ano 2026
          </button>
          <button
            type="button"
            onClick={() => setPeriod('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'todos'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Histórico Todo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm">
          <span className="text-xs font-bold text-text-tertiary uppercase">Taxa de Conversão</span>
          <p className="text-3xl font-bold text-text-primary mt-1">4.2%</p>
          <span className="text-[11px] text-accent-emerald-bright font-semibold flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">arrow_upward</span> +0.8% acima da média educacional
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm">
          <span className="text-xs font-bold text-text-tertiary uppercase">Ticket Médio Vendas</span>
          <p className="text-3xl font-bold text-text-primary mt-1">
            R$ {salesSummary.averageTicket.toFixed(2).replace('.', ',')}
          </p>
          <span className="text-[11px] text-accent-emerald-bright font-semibold flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">trending_up</span> Crescimento consistente
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm">
          <span className="text-xs font-bold text-text-tertiary uppercase">Taxa de Conclusão</span>
          <p className="text-3xl font-bold text-text-primary mt-1">78.4%</p>
          <span className="text-[11px] text-primary font-semibold flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">check_circle</span> Alunos concluem e emitem certificado
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm">
          <span className="text-xs font-bold text-text-tertiary uppercase">Satisfação dos Alunos</span>
          <p className="text-3xl font-bold text-text-primary mt-1">
            4.89 <span className="text-base text-accent-gold">★</span>
          </p>
          <span className="text-[11px] text-accent-gold font-semibold flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">sentiment_very_satisfied</span> 98.4% de aprovação declarada
          </span>
        </div>
      </div>

      {/* =========================================================================
          NOVA SEÇÃO REQUISITADA: RELATÓRIO DE VENDAS FUNCIONAL & CANCELAMENTOS
         ========================================================================= */}
      <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">receipt_long</span>
              </span>
              <h3 className="text-base font-bold text-text-primary">
                Relatório Operacional de Vendas &amp; Cancelamentos
              </h3>
            </div>
            <p className="text-xs text-text-tertiary mt-1">
              Registro analítico de pedidos, estornos, filtros temporais e reversão de acesso.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Baixar planilha CSV com os dados filtrados"
            >
              <span className="material-symbols-outlined text-sm text-emerald-400">download</span>
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Resumo Rápido dos Filtros Ativos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle">
            <span className="text-[10px] font-bold text-text-tertiary uppercase">Receita no Período</span>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">
              R$ {salesSummary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle">
            <span className="text-[10px] font-bold text-text-tertiary uppercase">Vendas Aprovadas</span>
            <p className="text-lg font-bold text-text-primary mt-0.5">{salesSummary.approvedCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle">
            <span className="text-[10px] font-bold text-text-tertiary uppercase">Vendas Canceladas</span>
            <p className="text-lg font-bold text-status-danger mt-0.5">{salesSummary.cancelledCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle">
            <span className="text-[10px] font-bold text-text-tertiary uppercase">Taxa de Cancelamento</span>
            <p className="text-lg font-bold text-amber-400 mt-0.5">{salesSummary.cancellationRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Barra de Filtros Avançados: Datas, Anos, Status e Busca */}
        <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">filter_alt</span>
              Filtro de Datas &amp; Parâmetros Avançados
            </span>
            {(searchFilter || statusFilter !== 'todos' || yearFilter !== 'todos' || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">restart_alt</span>
                Limpar Filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            {/* Campo de Busca Textual */}
            <div className="lg:col-span-4">
              <label className="block text-[11px] font-bold text-text-tertiary mb-1">
                Buscar por Aluno, E-mail ou Curso
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Nome, e-mail, curso ou nº pedido..."
                  className="w-full pl-9 pr-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                />
                <span className="material-symbols-outlined text-text-tertiary text-sm absolute left-3 top-2.5">
                  search
                </span>
              </div>
            </div>

            {/* Filtro de Ano */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-text-tertiary mb-1">
                Ano
              </label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value as 'todos' | '2026' | '2025')}
                className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer"
              >
                <option value="todos">Todos os Anos</option>
                <option value="2026">Ano 2026</option>
                <option value="2025">Ano 2025</option>
              </select>
            </div>

            {/* Filtro Data Inicial */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-text-tertiary mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer font-mono"
              />
            </div>

            {/* Filtro Data Final */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-text-tertiary mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer font-mono"
              />
            </div>

            {/* Filtro de Status */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-text-tertiary mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'aprovada' | 'pendente' | 'cancelada')}
                className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary cursor-pointer"
              >
                <option value="todos">Todos os Status</option>
                <option value="aprovada">Aprovadas</option>
                <option value="pendente">Pendentes</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Transações de Vendas */}
        <div className="overflow-x-auto rounded-xl border border-border-subtle bg-surface-raised">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-overlay border-b border-border-subtle text-text-tertiary font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Pedido / Data</th>
                <th className="p-3.5">Aluno Comprador</th>
                <th className="p-3.5">Curso / Categoria</th>
                <th className="p-3.5">Valor / Forma</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-tertiary">
                    Nenhuma transação de venda localizada para o intervalo selecionado.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-surface-overlay/50 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-text-primary block">{sale.orderNumber}</span>
                      <span className="text-[10px] text-text-tertiary">
                        {sale.date} • {sale.time}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-text-primary">{sale.studentName}</p>
                      <span className="text-[10px] text-text-tertiary block">{sale.studentEmail}</span>
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-text-primary line-clamp-1">{sale.courseTitle}</p>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-overlay text-text-tertiary inline-block mt-0.5">
                        {sale.courseCategory}
                      </span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-bold text-text-primary block">
                        R$ {sale.amount.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          {sale.paymentMethod === 'PIX'
                            ? 'qr_code_2'
                            : sale.paymentMethod === 'Cartão de Crédito'
                            ? 'credit_card'
                            : 'receipt_long'}
                        </span>
                        {sale.paymentMethod}
                      </span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      {sale.status === 'aprovada' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Aprovada
                        </span>
                      ) : sale.status === 'pendente' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Pendente
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            Cancelada
                          </span>
                          {sale.cancellationReason && (
                            <span className="text-[10px] text-text-tertiary block mt-0.5 max-w-[200px] truncate" title={sale.cancellationReason}>
                              {sale.cancellationReason}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      {sale.status === 'aprovada' ? (
                        <button
                          type="button"
                          onClick={() => setSaleToCancel(sale)}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-overlay hover:bg-status-danger/15 text-text-tertiary hover:text-status-danger border border-border-subtle hover:border-status-danger/30 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ml-auto"
                          title="Cancelar venda e estornar valor"
                        >
                          <span className="material-symbols-outlined text-xs">cancel</span>
                          <span>Cancelar Venda</span>
                        </button>
                      ) : sale.status === 'cancelada' ? (
                        <span className="text-[11px] text-text-tertiary italic">Estornado</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSalesList((prev) =>
                              prev.map((s) => (s.id === sale.id ? { ...s, status: 'aprovada' as const } : s))
                            );
                            showToast(`Venda ${sale.orderNumber} aprovada manualmente!`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-[11px] font-bold transition-colors cursor-pointer ml-auto"
                        >
                          Aprovar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Chart: Revenue By Month */}
      <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Evolução da Receita Mensal Consolidada (2026)
            </h3>
            <span className="text-xs text-text-tertiary">Comparativo de faturamento mensal e progressão de crescimento</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary-container" />
              <span className="text-text-secondary">Faturamento Líquido (R$)</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="h-64 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-border-subtle">
          {monthlyRevenue.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
              <span className="text-[10px] font-bold text-text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-surface-overlay px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                R$ {(item.revenue / 1000).toFixed(1)}k
              </span>
              <div
                style={{ height: item.height }}
                className="w-full max-w-[42px] bg-gradient-to-t from-primary/80 to-accent-emerald-bright rounded-t-lg transition-all group-hover:brightness-110 shadow-sm"
              />
              <span className="text-xs font-semibold text-text-tertiary group-hover:text-text-primary transition-colors">
                {item.month}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-text-tertiary mt-3">
          <span>Meta atingida em 100% dos meses do período</span>
          <span>Crescimento consolidado de +119% de Jan a Outubro</span>
        </div>
      </div>

      {/* Grid: Categories Share & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Share */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-1">
            Distribuição de Alunos por Categoria
          </h3>
          <p className="text-xs text-text-tertiary mb-5">Participação no volume total de matrículas ativas</p>

          <div className="space-y-4">
            {categoryDistribution.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-primary">{cat.name}</span>
                  <span className="text-text-tertiary font-semibold">{cat.count} ({cat.share}%)</span>
                </div>
                <div className="w-full h-2.5 bg-surface-overlay rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                    style={{ width: `${cat.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-1">
              Métodos de Pagamento Utilizados
            </h3>
            <p className="text-xs text-text-tertiary mb-5">Prevalência de checkout instantâneo</p>

            <div className="space-y-4">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.method}
                  className="p-3 rounded-xl bg-surface-overlay/70 border border-border-subtle flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-2xl ${pm.color}`}>{pm.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-text-primary block">{pm.method}</span>
                      <span className="text-[11px] text-text-tertiary">{pm.count} faturados</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-text-primary">{pm.share}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">bolt</span>
            <span>PIX com aprovação em 3 segundos aumenta conversão de novos alunos em 28%.</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL DE CANCELAMENTO DE VENDA
         ========================================================================= */}
      {saleToCancel && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B0F17] border border-border-subtle rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2 text-status-danger font-bold text-sm">
                <span className="material-symbols-outlined text-lg">cancel</span>
                <span>Confirmar Cancelamento de Venda</span>
              </div>
              <button
                type="button"
                onClick={() => setSaleToCancel(null)}
                className="text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle text-xs space-y-1">
              <p className="font-bold text-text-primary">{saleToCancel.orderNumber}</p>
              <p className="text-text-secondary">Aluno: <strong className="text-text-primary">{saleToCancel.studentName}</strong></p>
              <p className="text-text-secondary">Curso: <strong className="text-text-primary">{saleToCancel.courseTitle}</strong></p>
              <p className="text-text-secondary">Valor: <strong className="text-emerald-400">R$ {saleToCancel.amount.toFixed(2).replace('.', ',')}</strong></p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-text-secondary">
                Motivo do Cancelamento / Reversão
              </label>

              <div className="space-y-2">
                {[
                  'Direito de arrependimento (7 dias)',
                  'Pagamento em duplicidade',
                  'Problema no meio de pagamento / Chargeback',
                  'Desistência antes do início do curso',
                  'Outro',
                ].map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-raised border border-border-subtle text-xs cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      checked={cancellationReason === reason}
                      onChange={() => setCancellationReason(reason)}
                      className="text-primary cursor-pointer"
                    />
                    <span className="text-text-primary font-medium">{reason}</span>
                  </label>
                ))}
              </div>

              {cancellationReason === 'Outro' && (
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Descreva o motivo detalhado do cancelamento..."
                  className="w-full p-2.5 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary resize-none"
                />
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
              <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">warning</span>
              <span>
                Ao confirmar, o status será alterado para <strong>Cancelada</strong> e o curso será removido da matrícula ativa do aluno na plataforma.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSaleToCancel(null)}
                className="px-4 py-2 rounded-xl bg-surface-overlay text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                className="px-5 py-2 rounded-xl bg-status-danger hover:bg-status-danger/90 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
