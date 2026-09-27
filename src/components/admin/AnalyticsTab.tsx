import React, { useState } from 'react';
import { Course, UserAccount } from '../../types';

interface AnalyticsTabProps {
  courses: Course[];
  users: UserAccount[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ courses, users }) => {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ano'>('30d');

  const monthlyRevenue = [
    { month: 'Jan', revenue: 14200, target: 12000, height: '65%' },
    { month: 'Fev', revenue: 16800, target: 15000, height: '72%' },
    { month: 'Mar', revenue: 19400, target: 18000, height: '80%' },
    { month: 'Abr', revenue: 18100, target: 18000, height: '76%' },
    { month: 'Mai', revenue: 21500, target: 20000, height: '88%' },
    { month: 'Jun', revenue: 24300, target: 22000, height: '94%' },
    { month: 'Jul', revenue: 26900, target: 24000, height: '98%' },
    { month: 'Ago', revenue: 25400, target: 25000, height: '92%' },
    { month: 'Set', revenue: 28900, target: 26000, height: '100%' },
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
      {/* Header & Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">insights</span>
            Análise de Desempenho &amp; Business Intelligence
          </h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            Métricas consolidadas de vendas, conversão de alunos, engajamento e conclusão de cursos.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-surface-raised rounded-xl border border-border-subtle">
          <button
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
            onClick={() => setPeriod('ano')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'ano'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Ano 2026
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm">
          <span className="text-xs font-bold text-text-tertiary uppercase">Taxa de Conversão</span>
          <p className="text-3xl font-bold text-text-primary mt-1">4.2%</p>
          <span className="text-[11px] text-accent-emerald-bright font-semibold flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">arrow_upward</span> +0.8% em relação à média do setor
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm">
          <span className="text-xs font-bold text-text-tertiary uppercase">Ticket Médio</span>
          <p className="text-3xl font-bold text-text-primary mt-1">R$ 168,50</p>
          <span className="text-[11px] text-accent-emerald-bright font-semibold flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">trending_up</span> Crescimento com combos e pós-venda
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
          <span className="text-xs font-bold text-text-tertiary uppercase">NPS / Avaliação Média</span>
          <p className="text-3xl font-bold text-text-primary mt-1">4.87 <span className="text-base text-accent-gold">★</span></p>
          <span className="text-[11px] text-accent-gold font-semibold flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-xs">sentiment_very_satisfied</span> 98.2% de satisfação declarada
          </span>
        </div>
      </div>

      {/* Visual Chart: Revenue By Month */}
      <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Evolução da Receita Mensal (Jan a Setembro de 2026)
            </h3>
            <span className="text-xs text-text-tertiary">Comparativo de faturamento real vs meta de crescimento</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary-container" />
              <span className="text-text-secondary">Faturamento Real (R$)</span>
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
          <span>Crescimento consolidado de +103% de Jan a Set</span>
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
    </div>
  );
};
