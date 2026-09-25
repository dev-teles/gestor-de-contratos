import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import { Contract, Supplier, AuditLog, UserProfile, UserRole } from '../types';
import { calculateDaysRemaining } from '../utils/contractMonitor';

interface DashboardViewProps {
  currentRole?: UserRole;
  setCurrentRole?: (role: UserRole) => void;
  onNavigateContract: (id: string) => void;
  onNavigateSettings?: () => void;
  onNavigateNewContract?: () => void;
  contracts?: Contract[];
  suppliers?: Supplier[];
  auditLogs?: AuditLog[];
  userProfile?: UserProfile;
  onSelectContract?: (contract: Contract) => void;
  onViewAllContracts?: () => void;
  onOpenNewContract?: () => void;
}

type DashboardSubTab = 'geral' | 'graficos' | 'vencimentos' | 'movimentacoes';

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentRole = 'administrador',
  setCurrentRole,
  onNavigateContract,
  onNavigateSettings,
  onNavigateNewContract,
  contracts = [],
  suppliers = [],
  auditLogs = [],
  userProfile,
  onSelectContract,
  onViewAllContracts,
  onOpenNewContract,
}) => {
  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardSubTab>('geral');
  const [expirationHorizonFilter, setExpirationHorizonFilter] = useState<'todos' | 'criticos' | 'atencao'>('todos');
  const [dateRange, setDateRange] = useState('Últimos 30 dias');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Status Filter for Pie Chart Widget
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  // Category Chart Controls
  const [categoryMetric, setCategoryMetric] = useState<'valor' | 'quantidade'>('valor');
  const [categorySort, setCategorySort] = useState<'valor' | 'nome'>('valor');
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleContractClick = (codeOrId: string) => {
    if (onSelectContract && contracts.length > 0) {
      const found = contracts.find((c) => c.code === codeOrId || c.id === codeOrId);
      if (found) {
        onSelectContract(found);
        return;
      }
    }
    if (onNavigateContract) {
      onNavigateContract(codeOrId);
    }
  };

  // Dynamic contract stats
  const totalContractsCount = contracts.length;
  const activeContracts = useMemo(() => contracts.filter((c) => c.status === 'vigente'), [contracts]);
  const expiringContracts = useMemo(
    () =>
      contracts.filter((c) => {
        if (c.status === 'expirado') return false;
        const days = calculateDaysRemaining(c);
        return c.status === 'avencer' || (days <= 60 && days > 0);
      }),
    [contracts]
  );
  const expiring30Contracts = useMemo(
    () =>
      contracts.filter((c) => {
        if (c.status === 'expirado') return false;
        const days = calculateDaysRemaining(c);
        return days <= 30 && days > 0;
      }),
    [contracts]
  );
  const expiring60Contracts = useMemo(
    () =>
      contracts.filter((c) => {
        if (c.status === 'expirado') return false;
        const days = calculateDaysRemaining(c);
        return days > 30 && days <= 60;
      }),
    [contracts]
  );
  const unsignedContracts = useMemo(
    () => contracts.filter((c) => c.status === 'sem_assinatura' || !c.isSigned),
    [contracts]
  );
  const reviewContracts = useMemo(
    () => contracts.filter((c) => c.status === 'em_renovacao' || c.status === 'revisao'),
    [contracts]
  );

  const totalFinancialVolume = useMemo(
    () => contracts.reduce((acc, c) => acc + (c.totalValue || 0), 0),
    [contracts]
  );

  const averageTicket = totalContractsCount > 0 ? totalFinancialVolume / totalContractsCount : 0;
  const compliancePercentage =
    totalContractsCount > 0 ? Math.round((activeContracts.length / totalContractsCount) * 100) : 100;

  // Status breakdown data for Recharts PieChart
  const statusData = useMemo(() => {
    if (totalContractsCount === 0) return [];

    const items = [
      {
        id: 'vigente',
        name: 'Vigentes / Ativos',
        value: activeContracts.length,
        percentage: Math.round((activeContracts.length / totalContractsCount) * 100),
        financialVolume: activeContracts.reduce((acc, c) => acc + (c.totalValue || 0), 0),
        color: '#059669', // Emerald
        bgColor: '#ecfdf5',
        textColor: '#059669',
        icon: 'verified',
        description: 'Contratos em plena vigência com obrigações regulares',
      },
      {
        id: 'avencer',
        name: 'A Vencer (30/60d)',
        value: expiringContracts.length,
        percentage: Math.round((expiringContracts.length / totalContractsCount) * 100),
        financialVolume: expiringContracts.reduce((acc, c) => acc + (c.totalValue || 0), 0),
        color: '#d97706', // Amber
        bgColor: '#fffbeb',
        textColor: '#b45309',
        icon: 'notification_important',
        description: 'Prazos contratuais expirando nos próximos dois meses',
      },
      {
        id: 'sem_assinatura',
        name: 'Pendente Assinatura',
        value: unsignedContracts.length,
        percentage: Math.round((unsignedContracts.length / totalContractsCount) * 100),
        financialVolume: unsignedContracts.reduce((acc, c) => acc + (c.totalValue || 0), 0),
        color: '#dc2626', // Crimson Red
        bgColor: '#fef2f2',
        textColor: '#b91c1c',
        icon: 'draw',
        description: 'Minutas aguardando signatários digitais',
      },
      {
        id: 'renovacao',
        name: 'Em Renovação / Revisão',
        value: reviewContracts.length,
        percentage: Math.round((reviewContracts.length / totalContractsCount) * 100),
        financialVolume: reviewContracts.reduce((acc, c) => acc + (c.totalValue || 0), 0),
        color: '#2563eb', // Blue
        bgColor: '#eff6ff',
        textColor: '#1d4ed8',
        icon: 'autorenew',
        description: 'Repactuação de valores e reajustes de índice em negociação',
      },
    ];

    return items.filter((item) => item.value > 0);
  }, [totalContractsCount, activeContracts, expiringContracts, unsignedContracts, reviewContracts]);

  const filteredStatusData = useMemo(() => {
    if (selectedStatusFilter === 'todos') {
      return statusData;
    }
    return statusData.filter((item) => item.id === selectedStatusFilter);
  }, [statusData, selectedStatusFilter]);

  // Category breakdown data for Recharts BarChart
  const rawCategoryData = useMemo(() => {
    if (totalContractsCount === 0) return [];

    const categoryMap: { [cat: string]: { totalValue: number; count: number } } = {};
    contracts.forEach((c) => {
      const cat = c.category || 'Outros';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { totalValue: 0, count: 0 };
      }
      categoryMap[cat].totalValue += c.totalValue || 0;
      categoryMap[cat].count += 1;
    });

    const categoryMeta: { [k: string]: { color: string; icon: string } } = {
      'Infra Cloud': { color: '#0051d5', icon: 'cloud' },
      'TI & Cloud': { color: '#0051d5', icon: 'cloud' },
      'Facilities': { color: '#2563eb', icon: 'apartment' },
      'Logística': { color: '#059669', icon: 'local_shipping' },
      'Telecom': { color: '#7c3aed', icon: 'cell_tower' },
      'Consultoria & Jurídico': { color: '#ea580c', icon: 'gavel' },
      'RH & Benefícios': { color: '#db2777', icon: 'group' },
    };

    return Object.entries(categoryMap).map(([category, info]) => {
      const meta = categoryMeta[category] || { color: '#0051d5', icon: 'folder' };
      return {
        category,
        shortName: category.length > 14 ? category.slice(0, 12) + '...' : category,
        totalValue: info.totalValue,
        valueMillions: Number((info.totalValue / 1000000).toFixed(2)),
        contractCount: info.count,
        averageTicket: Math.round(info.totalValue / info.count),
        color: meta.color,
        icon: meta.icon,
      };
    });
  }, [totalContractsCount, contracts]);

  const sortedCategoryData = useMemo(() => {
    const list = [...rawCategoryData];
    if (categorySort === 'nome') {
      return list.sort((a, b) => a.category.localeCompare(b.category));
    }
    if (categoryMetric === 'quantidade') {
      return list.sort((a, b) => b.contractCount - a.contractCount);
    }
    return list.sort((a, b) => b.totalValue - a.totalValue);
  }, [rawCategoryData, categoryMetric, categorySort]);

  // Expiration contracts list
  const expirationContractsList = useMemo(() => {
    return contracts
      .filter((c) => {
        if (c.status === 'expirado') return false;
        const days = calculateDaysRemaining(c);
        return c.status === 'avencer' || (days <= 90 && days > 0);
      })
      .map((c) => {
        const days = calculateDaysRemaining(c);
        let criticality: 'critico' | 'atencao' | 'normal' = 'normal';
        if (days <= 30) criticality = 'critico';
        else if (days <= 60) criticality = 'atencao';

        const monthlyCost = c.monthlyValue
          ? c.monthlyValue
          : c.totalValue
          ? c.totalValue / 12
          : 0;

        return {
          id: c.code || c.id,
          rawContract: c,
          company: c.supplierName || 'Fornecedor',
          category: c.category || 'Geral',
          manager: c.manager || 'Lucas Teles',
          cost: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyCost) + '/mês',
          date: c.endDate || '—',
          days,
          criticality,
        };
      })
      .sort((a, b) => a.days - b.days);
  }, [contracts]);

  const filteredExpirationContracts = useMemo(() => {
    if (expirationHorizonFilter === 'criticos') {
      return expirationContractsList.filter((item) => item.criticality === 'critico');
    }
    if (expirationHorizonFilter === 'atencao') {
      return expirationContractsList.filter((item) => item.criticality === 'atencao');
    }
    return expirationContractsList;
  }, [expirationContractsList, expirationHorizonFilter]);

  // Format currency helper
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const userName = userProfile?.name ? userProfile.name.split(' ')[0] : 'Lucas';

  return (
    <div className="flex flex-col w-full">
      <div className="p-6 flex flex-col gap-6 w-full max-w-[1600px] mx-auto animate-in fade-in duration-300">
        {/* Top Greeting & Global Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-bold text-[#0b1c30] tracking-tight leading-none">
                Olá, {userName}!
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] text-[12px] font-semibold border border-[#dce9ff]">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                Visão Geral Atualizada
              </span>
            </div>
            <p className="text-[14px] text-[#45464d] mt-1.5">
              {totalContractsCount === 0
                ? 'Sistema inicializado sem informações • Banco de dados limpo e pronto para cadastros.'
                : `Aqui está o panorama dos seus contratos hoje. ${
                    expiring30Contracts.length > 0
                      ? `${expiring30Contracts.length} alertas demandando ação prioritária.`
                      : 'Todos os contratos estão em conformidade.'
                  }`}
            </p>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Role Switcher Pill Bar */}
            <div className="flex items-center p-1 bg-[#eff4ff] rounded-xl border border-[#dce9ff]">
              <button
                type="button"
                onClick={() => setCurrentRole && setCurrentRole('administrador')}
                className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1 ${
                  currentRole === 'administrador'
                    ? 'bg-white text-[#0b1c30] shadow-sm'
                    : 'text-[#45464d] hover:text-[#0b1c30]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#0051d5]">
                  admin_panel_settings
                </span>
                <span>Administrador</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentRole && setCurrentRole('editor')}
                className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1 ${
                  currentRole === 'editor'
                    ? 'bg-white text-[#0b1c30] shadow-sm'
                    : 'text-[#45464d] hover:text-[#0b1c30]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#0051d5]">
                  edit_document
                </span>
                <span>Editor</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentRole && setCurrentRole('visualizador')}
                className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1 ${
                  currentRole === 'visualizador'
                    ? 'bg-white text-[#0b1c30] shadow-sm'
                    : 'text-[#45464d] hover:text-[#0b1c30]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-[#0051d5]">visibility</span>
                <span>Visualizador</span>
              </button>
            </div>

            {/* Date Range Filter */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  showToast(`Filtro atualizado: ${e.target.value}`);
                }}
                className="h-9 px-3 pr-8 rounded-xl bg-white text-[#0b1c30] text-[13px] font-medium shadow-sm border border-[#e5eeff] hover:bg-[#eff4ff] transition-colors focus:outline-none appearance-none cursor-pointer"
              >
                <option>Últimos 30 dias</option>
                <option>Último Trimestre</option>
                <option>Ano Vigente (2025)</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-2 text-[#76777d] pointer-events-none text-[16px]">
                expand_more
              </span>
            </div>

            {/* Executive Export Button */}
            <button
              type="button"
              onClick={() => showToast('Relatório Executivo exportado em PDF com sucesso!')}
              className="h-9 px-3.5 rounded-xl bg-[#0b1c30] text-white text-[13px] font-medium shadow-sm hover:bg-[#131b2e] active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Relatório Executivo</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs: Executive Overview vs Deep-Dive Modules */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[#e5eeff] pb-3">
          <div className="flex items-center p-1 bg-[#eff4ff] rounded-2xl border border-[#dce9ff]/70 shadow-xs overflow-x-auto max-w-full">
            <button
              type="button"
              id="tab-btn-geral"
              onClick={() => setActiveDashboardTab('geral')}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeDashboardTab === 'geral'
                  ? 'bg-[#0051d5] text-white shadow-md shadow-[#0051d5]/20'
                  : 'text-[#45464d] hover:text-[#0b1c30] hover:bg-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
              <span>Visão Geral</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold uppercase ${
                  activeDashboardTab === 'geral'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#dce9ff] text-[#0051d5]'
                }`}
              >
                Principal
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-graficos"
              onClick={() => setActiveDashboardTab('graficos')}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeDashboardTab === 'graficos'
                  ? 'bg-[#0051d5] text-white shadow-md shadow-[#0051d5]/20'
                  : 'text-[#45464d] hover:text-[#0b1c30] hover:bg-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">pie_chart</span>
              <span>Gráficos & Distribuição</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeDashboardTab === 'graficos'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#e5eeff] text-[#45464d]'
                }`}
              >
                {totalContractsCount}
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-vencimentos"
              onClick={() => setActiveDashboardTab('vencimentos')}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeDashboardTab === 'vencimentos'
                  ? 'bg-[#0051d5] text-white shadow-md shadow-[#0051d5]/20'
                  : 'text-[#45464d] hover:text-[#0b1c30] hover:bg-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">timer</span>
              <span>Prazos & Vencimentos</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeDashboardTab === 'vencimentos'
                    ? 'bg-amber-300 text-amber-950 font-extrabold'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {expiringContracts.length} Alertas
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-movimentacoes"
              onClick={() => setActiveDashboardTab('movimentacoes')}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeDashboardTab === 'movimentacoes'
                  ? 'bg-[#0051d5] text-white shadow-md shadow-[#0051d5]/20'
                  : 'text-[#45464d] hover:text-[#0b1c30] hover:bg-white/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Movimentações & Auditoria</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeDashboardTab === 'movimentacoes'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#e5eeff] text-[#45464d]'
                }`}
              >
                {auditLogs.length}
              </span>
            </button>
          </div>

          <div className="text-[12px] text-[#45464d] flex items-center gap-2">
            {activeDashboardTab === 'geral' ? (
              <span className="flex items-center gap-1 font-medium text-[#059669] bg-[#ecfdf5] px-2.5 py-1 rounded-lg border border-[#a7f3d0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
                Exibindo métricas essenciais priorizadas
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setActiveDashboardTab('geral')}
                className="flex items-center gap-1 text-[#0051d5] hover:underline font-semibold bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#dce9ff]"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Voltar à Visão Geral
              </button>
            )}
          </div>
        </div>

        {/* ================= TAB 1: VISÃO GERAL (INFORMAÇÕES MAIS IMPORTANTES) ================= */}
        {activeDashboardTab === 'geral' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* KPI Summary Grid (4 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Card 1: Contratos Ativos */}
              <div className="p-4 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-[#45464d] font-semibold">
                      Contratos Ativos
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-[34px] font-bold text-[#0b1c30] tracking-tight leading-none">
                        {activeContracts.length}
                      </span>
                      <span className="text-[12px] text-[#45464d]">unidades</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#0051d5]">
                    <span className="material-symbols-outlined text-[22px]">
                      assignment_turned_in
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-50">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#059669] text-[12px] font-semibold">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    <span>
                      {totalContractsCount === 0 ? '0% este mês' : `${activeContracts.length} ativos`}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#45464d]">
                    {compliancePercentage}% em conformidade
                  </span>
                </div>
              </div>

              {/* Card 2: A Vencer */}
              <div className="p-4 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] uppercase tracking-wider text-[#b45309] font-semibold">
                        A Vencer (30/60 dias)
                      </span>
                      {expiringContracts.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse"></span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-[34px] font-bold text-[#9a3412] tracking-tight leading-none">
                        {expiringContracts.length}
                      </span>
                      <span className="text-[12px] font-semibold text-[#b45309]">
                        {expiringContracts.length === 0 ? 'em dia' : 'em risco'}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#fffbeb] flex items-center justify-center text-[#d97706]">
                    <span className="material-symbols-outlined text-[22px]">
                      notification_important
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mt-4 pt-1">
                  <div className="flex justify-between items-center text-[11px] text-[#45464d]">
                    <span>
                      {expiring30Contracts.length} em 30d • {expiring60Contracts.length} em 60d
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveDashboardTab('vencimentos')}
                      className="text-[11px] text-[#b45309] font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span>Ver prazos</span>
                      <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                    </button>
                  </div>
                  <div className="w-full h-1.5 bg-[#eff4ff] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f59e0b] rounded-full"
                      style={{
                        width:
                          totalContractsCount > 0
                            ? `${Math.min(100, Math.round((expiringContracts.length / totalContractsCount) * 100))}%`
                            : '0%',
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Card 3: Sem Assinatura */}
              <div className="p-4 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] uppercase tracking-wider text-[#ba1a1a] font-semibold">
                        Sem Assinatura
                      </span>
                      {unsignedContracts.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-[#ffdad6] text-[#ba1a1a] text-[10px] uppercase font-bold">
                          Atraso
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-[34px] font-bold text-[#ba1a1a] tracking-tight leading-none">
                        {unsignedContracts.length}
                      </span>
                      <span className="text-[12px] font-medium text-[#ba1a1a]/80">
                        {unsignedContracts.length === 0 ? 'regularizado' : 'bloqueados'}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#ffdad6]/40 flex items-center justify-center text-[#ba1a1a]">
                    <span className="material-symbols-outlined text-[22px]">edit_document</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-50">
                  <span className="text-[11px] text-[#ba1a1a] font-bold">
                    {unsignedContracts.length === 0
                      ? 'Nenhuma pendência'
                      : `${unsignedContracts.length} pendências`}
                  </span>
                  {unsignedContracts.length > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        showToast(`Notificação disparada para ${unsignedContracts.length} signatários!`)
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#ba1a1a] text-white text-[12px] font-semibold hover:bg-[#991b1b] active:scale-[0.98] transition-all flex items-center gap-1 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[14px]">send</span>
                      Cobrar
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#059669] font-medium">Fluxo em dia</span>
                  )}
                </div>
              </div>

              {/* Card 4: Valor Total Sob Gestão */}
              <div className="p-4 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-[#45464d] font-semibold">
                      Valor Total Sob Gestão
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-[28px] font-bold text-[#0b1c30] tracking-tight leading-none">
                        {formatBRL(totalFinancialVolume)}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#0051d5]">
                    <span className="material-symbols-outlined text-[22px]">account_balance</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-50">
                  <span className="text-[12px] text-[#45464d]">
                    Ticket Médio:{' '}
                    <strong className="text-[#0b1c30]">{formatBRL(averageTicket)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveDashboardTab('graficos')}
                    className="text-[11px] text-[#0051d5] font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>Ver gráficos</span>
                    <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Painel 1: Prioridades & Ação Imediata (2 Colunas) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Coluna 1: Vencimentos Imediatos */}
              <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#fffbeb] text-[#d97706] flex items-center justify-center border border-amber-200/60">
                        <span className="material-symbols-outlined text-[18px]">warning</span>
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-[#0b1c30]">Vencimentos Imediatos</h3>
                        <span className="text-[11px] text-[#45464d]">
                          A vencer nos próximos 30 dias com alto impacto operacional
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#b45309] text-[11px] font-bold border border-amber-200">
                      {expiring30Contracts.length} Urgentes
                    </span>
                  </div>

                  {expiring30Contracts.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-[20px]">
                          event_available
                        </span>
                      </div>
                      <p className="text-[13px] font-bold text-[#0b1c30]">
                        Nenhum vencimento pendente
                      </p>
                      <p className="text-[11px] text-[#45464d] mt-0.5 max-w-xs">
                        Não há contratos com prazo crítico para os próximos 30 dias.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 my-2">
                      {expiring30Contracts.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-[#eff4ff]/40 hover:bg-[#eff4ff] border border-[#e5eeff] transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#fffbeb] text-[#d97706] flex flex-col items-center justify-center shrink-0 border border-amber-200/60">
                              <span className="text-[15px] leading-none font-extrabold">
                                {item.remainingDays ?? '—'}
                              </span>
                              <span className="text-[8px] uppercase font-bold">dias</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[13px] font-bold text-[#0b1c30] truncate">
                                {item.supplierName || item.title}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-[#45464d]">
                                <span className="font-semibold text-[#0051d5]">
                                  {formatBRL(item.monthlyValue || (item.totalValue ? item.totalValue / 12 : 0))}/mês
                                </span>
                                <span>•</span>
                                <span>Vencimento {item.endDate || 'Em breve'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleContractClick(item.code || item.id)}
                              className="h-8 px-2.5 rounded-lg bg-white text-[#0b1c30] text-[12px] font-semibold border border-gray-200 hover:bg-gray-50 shadow-xs"
                            >
                              Detalhes
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                showToast(`Processo de renovação iniciado para ${item.supplierName || item.title}!`)
                              }
                              className="h-8 px-2.5 rounded-lg bg-[#0051d5] text-white text-[12px] font-semibold hover:bg-[#003ea8] shadow-xs flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">sync</span>
                              Renovar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-1 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-[#45464d]">
                    {expiringContracts.length} contratos no radar do bimestre
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveDashboardTab('vencimentos')}
                    className="text-[12px] font-bold text-[#0051d5] hover:underline flex items-center gap-1"
                  >
                    <span>Ver Prazos & Vencimentos</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Coluna 2: Aprovações & Cobranças Pendentes */}
              <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#0051d5] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">
                          pending_actions
                        </span>
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-[#0b1c30]">
                          Pendências & Fluxo de Aprovação
                        </h3>
                        <span className="text-[11px] text-[#45464d]">
                          Minutas aguardando chancela jurídica e assinaturas eletrônicas
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] text-[11px] font-bold">
                      {unsignedContracts.length} Pendências
                    </span>
                  </div>

                  {unsignedContracts.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-[22px]">check_circle</span>
                      </div>
                      <p className="text-[13px] font-bold text-[#0b1c30]">
                        Nenhuma pendência operacional
                      </p>
                      <p className="text-[11px] text-[#45464d] mt-0.5 max-w-xs">
                        Todas as minutas e fluxos de assinatura estão regulares e em conformidade.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 my-2">
                      <div className="p-3 rounded-xl bg-[#eff4ff]/40 hover:bg-[#eff4ff] border border-[#e5eeff] transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-[#ffdad6]/50 text-[#ba1a1a] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px]">draw</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-[#0b1c30]">
                              {unsignedContracts.length} Sem Assinatura
                            </span>
                            <span className="text-[11px] text-[#45464d]">
                              Instrumentos aguardando conclusão de assinaturas digitais
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            showToast(
                              `Cobrança em massa disparada aos signatários de ${unsignedContracts.length} contratos!`
                            )
                          }
                          className="h-8 px-3 rounded-lg bg-[#ba1a1a] text-white text-[12px] font-semibold hover:bg-[#991b1b] shadow-xs flex items-center gap-1 shrink-0"
                        >
                          <span className="material-symbols-outlined text-[15px]">send</span>
                          Cobrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-1 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-[#45464d]">Trilha de auditoria SHA-256 ativa</span>
                  <button
                    type="button"
                    onClick={() => setActiveDashboardTab('movimentacoes')}
                    className="text-[12px] font-bold text-[#0051d5] hover:underline flex items-center gap-1"
                  >
                    <span>Ver Movimentações & Auditoria</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Painel 2: Síntese Orçamentária & Distribuição da Carteira */}
            <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[17px] font-bold text-[#0b1c30]">
                      Panorama Orçamentário & Distribuição da Carteira
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] text-[11px] font-bold border border-[#dce9ff]">
                      {formatBRL(totalFinancialVolume)} Sob Gestão
                    </span>
                  </div>
                  <p className="text-[12px] text-[#45464d] mt-0.5">
                    Resumo executivo de proporcionalidade e alocação nas principais contas contratuais
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDashboardTab('graficos')}
                  className="px-4 py-2 rounded-xl bg-[#0051d5] text-white text-[13px] font-bold shadow-md shadow-[#0051d5]/20 hover:bg-[#003ea8] transition-all flex items-center gap-1.5 self-start md:self-auto shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">pie_chart</span>
                  <span>Acessar Gráficos & Análise Completa</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>

              {totalContractsCount === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[26px]">monitoring</span>
                  </div>
                  <h4 className="text-[15px] font-bold text-[#0b1c30]">Banco de Dados Inicializado</h4>
                  <p className="text-[12px] text-[#45464d] mt-1 leading-relaxed">
                    O aplicativo foi iniciado com 0 registros. Assim que você cadastrar contratos e fornecedores, os gráficos e métricas de distribuição serão consolidados aqui automaticamente.
                  </p>
                  {onOpenNewContract && currentRole !== 'visualizador' && (
                    <button
                      type="button"
                      onClick={onOpenNewContract}
                      className="mt-4 px-4 py-2 rounded-xl bg-[#0051d5] text-white text-[13px] font-semibold hover:bg-[#003ea8] transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      <span>Cadastrar Primeiro Contrato</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Esquerda: Proporções de Status */}
                  <div className="flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold text-[#0b1c30] uppercase tracking-wider">
                        Situação dos Contratos
                      </span>
                      <span className="text-[11px] text-[#45464d]">
                        {totalContractsCount} instrumentos totais
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 my-auto py-2">
                      {statusData.map((item) => (
                        <div key={item.id} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="font-semibold text-[#0b1c30] flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                              ></span>
                              {item.name}
                            </span>
                            <span className="text-[#45464d]">
                              <strong>{item.value}</strong> ({item.percentage}%) • {formatBRL(item.financialVolume)}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${item.percentage}%`,
                                backgroundColor: item.color,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direita: Top Categorias */}
                  <div className="flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold text-[#0b1c30] uppercase tracking-wider">
                        Alocação por Macrocategoria
                      </span>
                      <span className="text-[11px] text-[#45464d]">
                        {rawCategoryData.length} categorias
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 my-auto py-2">
                      {rawCategoryData.slice(0, 4).map((cat) => {
                        const pct =
                          totalFinancialVolume > 0
                            ? Math.round((cat.totalValue / totalFinancialVolume) * 100)
                            : 0;
                        return (
                          <div key={cat.category} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[12px]">
                              <span className="font-semibold text-[#0b1c30] flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                ></span>
                                {cat.category}
                              </span>
                              <span className="text-[#45464d]">
                                <strong>{formatBRL(cat.totalValue)}</strong> ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: cat.color,
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: GRÁFICOS & DISTRIBUIÇÃO ================= */}
        {activeDashboardTab === 'graficos' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Header da Aba Gráficos */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#e5eeff] shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">pie_chart</span>
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-[#0b1c30]">
                    Gráficos e Distribuição Analítica
                  </h2>
                  <p className="text-[12px] text-[#45464d]">
                    Visualizações detalhadas de distribuição por status e alocação financeira por categoria
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDashboardTab('geral')}
                className="px-3.5 py-1.5 rounded-xl bg-[#eff4ff] text-[#0051d5] hover:bg-[#dce9ff] text-[12px] font-bold transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Voltar para Visão Geral
              </button>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider">
                    Total Alocado
                  </span>
                  <div className="text-[20px] font-bold text-[#0b1c30] mt-0.5">
                    {formatBRL(totalFinancialVolume)}
                  </div>
                  <span className="text-[10px] text-[#0051d5] font-medium">
                    {rawCategoryData.length} categorias
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#eff4ff] text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    account_balance_wallet
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider">
                    Maior Alocação
                  </span>
                  <div className="text-[20px] font-bold text-[#0051d5] mt-0.5">
                    {sortedCategoryData[0]?.category || '—'}
                  </div>
                  <span className="text-[10px] text-[#45464d] font-medium">
                    {sortedCategoryData[0] ? formatBRL(sortedCategoryData[0].totalValue) : 'R$ 0,00'}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#eff4ff] text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">cloud</span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider">
                    Regularidade
                  </span>
                  <div className="text-[20px] font-bold text-[#059669] mt-0.5">
                    {compliancePercentage}% Vigentes
                  </div>
                  <span className="text-[10px] text-[#059669] font-medium">
                    {activeContracts.length} contratos ativos
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider">
                    Ticket Médio
                  </span>
                  <div className="text-[20px] font-bold text-[#0b1c30] mt-0.5">
                    {formatBRL(averageTicket)}
                  </div>
                  <span className="text-[10px] text-[#45464d] font-medium">Por instrumento</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#eff4ff] text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">analytics</span>
                </div>
              </div>
            </div>

            {totalContractsCount === 0 ? (
              <div className="p-12 bg-white rounded-2xl border border-[#e5eeff] shadow-xs text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[32px]">pie_chart</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#0b1c30]">Nenhum Dado para Exibição Gráfica</h3>
                <p className="text-[13px] text-[#45464d] mt-1.5 max-w-md">
                  O banco de dados foi inicializado limpo com 0 contratos. Cadastre novos contratos para habilitar os gráficos de distribuição por status e volumetria por macrocategoria.
                </p>
                {onOpenNewContract && currentRole !== 'visualizador' && (
                  <button
                    type="button"
                    onClick={onOpenNewContract}
                    className="mt-5 px-4 py-2.5 rounded-xl bg-[#0051d5] text-white text-[13px] font-semibold hover:bg-[#003ea8] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Adicionar Primeiro Contrato</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* Widget 1: Status Distribution (Recharts Donut) */}
                <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-xs flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[18px] font-bold text-[#0b1c30] tracking-tight">
                          Distribuição por Status
                        </h2>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] text-[11px] font-bold border border-[#dce9ff]">
                          {totalContractsCount} Instrumentos
                        </span>
                      </div>
                      <span className="text-[11px] text-[#45464d] mt-0.5">
                        Proporção de vigência, vencimentos e minutas
                      </span>
                    </div>
                  </div>

                  <div className="h-[260px] w-full relative flex items-center justify-center my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-[#0b1c30] text-white p-2.5 rounded-xl shadow-xl text-xs border border-white/10 z-50 min-w-[170px]">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
                                    <span className="font-bold">{data.name}</span>
                                  </div>
                                  <div className="text-gray-300 text-[11px]">
                                    {data.value} {data.value === 1 ? 'contrato' : 'contratos'} ({data.percentage}%)
                                  </div>
                                  {data.financialVolume !== undefined && (
                                    <div className="text-[#60a5fa] font-semibold text-[11px] mt-0.5">
                                      {formatBRL(data.financialVolume)}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Pie
                          data={filteredStatusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={3}
                          onMouseEnter={(_, index) => setActivePieIndex(index)}
                          onMouseLeave={() => setActivePieIndex(null)}
                        >
                          {filteredStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.id}`}
                              fill={entry.color}
                              stroke="#ffffff"
                              strokeWidth={2}
                              style={{
                                filter: activePieIndex === index ? 'brightness(1.1)' : 'none',
                                cursor: 'pointer',
                              }}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[26px] font-bold text-[#0b1c30] leading-none">
                        {totalContractsCount}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[#76777d] tracking-wider mt-0.5">
                        Contratos
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100">
                    {statusData.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#eff4ff]/30">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-bold text-[#0b1c30] truncate">{item.name}</span>
                          <span className="text-[10px] text-[#45464d]">
                            {item.value} ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Widget 2: Values by Category (Recharts Bar Chart) */}
                <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-xs flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-col">
                      <h2 className="text-[18px] font-bold text-[#0b1c30] tracking-tight">
                        Alocação por Macrocategoria
                      </h2>
                      <span className="text-[11px] text-[#45464d] mt-0.5">
                        Valores consolidados em carteira
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Metric Toggle */}
                      <div className="flex items-center gap-1 bg-[#eff4ff] p-0.5 rounded-lg border border-[#dce9ff]">
                        <button
                          type="button"
                          id="btn-metric-valor"
                          onClick={() => setCategoryMetric('valor')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            categoryMetric === 'valor'
                              ? 'bg-white text-[#0051d5] shadow-xs'
                              : 'text-[#45464d] hover:text-[#0b1c30]'
                          }`}
                        >
                          Valor (R$)
                        </button>
                        <button
                          type="button"
                          id="btn-metric-qtd"
                          onClick={() => setCategoryMetric('quantidade')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            categoryMetric === 'quantidade'
                              ? 'bg-white text-[#0051d5] shadow-xs'
                              : 'text-[#45464d] hover:text-[#0b1c30]'
                          }`}
                        >
                          Qtd
                        </button>
                      </div>

                      {/* Sorting Toggle: Valor vs Nome */}
                      <div className="flex items-center gap-1 bg-[#f8fafc] p-0.5 rounded-lg border border-gray-200">
                        <button
                          type="button"
                          id="btn-sort-category-valor"
                          title="Ordenar por volume ou quantidade"
                          onClick={() => setCategorySort('valor')}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                            categorySort === 'valor'
                              ? 'bg-white text-[#0b1c30] shadow-xs border border-gray-200/80 font-bold'
                              : 'text-[#64748b] hover:text-[#0b1c30]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">sort</span>
                          <span>{categoryMetric === 'valor' ? 'Valor' : 'Qtd'}</span>
                        </button>
                        <button
                          type="button"
                          id="btn-sort-category-nome"
                          title="Ordenar por nome da categoria (A-Z)"
                          onClick={() => setCategorySort('nome')}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                            categorySort === 'nome'
                              ? 'bg-white text-[#0b1c30] shadow-xs border border-gray-200/80 font-bold'
                              : 'text-[#64748b] hover:text-[#0b1c30]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">sort_by_alpha</span>
                          <span>Nome</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="h-[260px] w-full my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sortedCategoryData}
                        layout="vertical"
                        margin={{ top: 8, right: 30, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5eeff" />
                        <XAxis
                          type="number"
                          tick={{ fill: '#76777d', fontSize: 11 }}
                          tickFormatter={(v) => (categoryMetric === 'valor' ? `R$ ${v}M` : `${v}`)}
                          axisLine={{ stroke: '#e5eeff' }}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="shortName"
                          type="category"
                          tick={{ fill: '#0b1c30', fontSize: 11, fontWeight: 600 }}
                          axisLine={{ stroke: '#e5eeff' }}
                          tickLine={false}
                          width={80}
                        />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload;
                              return (
                                <div className="bg-[#0b1c30] text-white p-2.5 rounded-xl shadow-xl text-xs border border-white/10 z-50 min-w-[180px]">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="font-bold text-[13px]">{item.category}</span>
                                  </div>
                                  <div className="text-gray-300 text-[11px] flex justify-between gap-2">
                                    <span>Volume Total:</span>
                                    <span className="text-white font-semibold">{formatBRL(item.totalValue)}</span>
                                  </div>
                                  <div className="text-gray-300 text-[11px] flex justify-between gap-2">
                                    <span>Contratos:</span>
                                    <span className="text-white font-semibold">{item.contractCount}</span>
                                  </div>
                                  <div className="text-gray-300 text-[11px] flex justify-between gap-2 pt-1 border-t border-white/10 mt-1">
                                    <span>Ticket Médio:</span>
                                    <span className="text-[#60a5fa] font-semibold">{formatBRL(item.averageTicket)}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey={categoryMetric === 'valor' ? 'valueMillions' : 'contractCount'}
                          radius={[0, 6, 6, 0]}
                          barSize={18}
                        >
                          {sortedCategoryData.map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#45464d]">
                    <span>Total consolidado: {formatBRL(totalFinancialVolume)}</span>
                    <button
                      type="button"
                      onClick={onViewAllContracts}
                      className="font-bold text-[#0051d5] hover:underline flex items-center gap-0.5"
                    >
                      <span>Ver Contratos</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: PRAZOS & VENCIMENTOS ================= */}
        {activeDashboardTab === 'vencimentos' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Header da Aba Vencimentos */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#e5eeff] shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#fffbeb] text-[#d97706] flex items-center justify-center border border-amber-200/60">
                  <span className="material-symbols-outlined text-[22px]">timer</span>
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-[#0b1c30]">
                    Linha do Tempo de Prazos & Vencimentos
                  </h2>
                  <p className="text-[12px] text-[#45464d]">
                    Acompanhamento proativo de contratos com renovação, renegociação ou término agendados
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDashboardTab('geral')}
                className="px-3.5 py-1.5 rounded-xl bg-[#eff4ff] text-[#0051d5] hover:bg-[#dce9ff] text-[12px] font-bold transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Voltar para Visão Geral
              </button>
            </div>

            {/* Métricas Específicas de Prazos e Vencimentos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                    No Radar
                  </span>
                  <div className="text-[20px] font-bold text-amber-800 mt-0.5">
                    {expiringContracts.length} Contratos
                  </div>
                  <span className="text-[10px] text-[#45464d] font-medium">Próximos 60 dias</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/50">
                  <span className="material-symbols-outlined text-[20px]">
                    notification_important
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">
                    Críticos (&lt;30 dias)
                  </span>
                  <div className="text-[20px] font-bold text-red-700 mt-0.5">
                    {expiring30Contracts.length} Unidades
                  </div>
                  <span className="text-[10px] text-red-600 font-medium">Ação prioritária</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200/50">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
                    Atenção (30-60d)
                  </span>
                  <div className="text-[20px] font-bold text-amber-700 mt-0.5">
                    {expiring60Contracts.length} Unidades
                  </div>
                  <span className="text-[10px] text-[#45464d] font-medium">Em planejamento</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/50">
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider">
                    Regra de Notificação
                  </span>
                  <div className="text-[20px] font-bold text-[#0051d5] mt-0.5">60 • 30 • 15d</div>
                  <span className="text-[10px] text-[#059669] font-medium">Disparos ativos</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0051d5] flex items-center justify-center border border-blue-200/50">
                  <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
                </div>
              </div>
            </div>

            {/* Section: Upcoming Expirations Timeline (Full Width) */}
            <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-xs flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-[#0b1c30] tracking-tight">
                    Filtro de Criticidade e Horizonte
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#b45309] text-[11px] font-bold border border-amber-200">
                    {filteredExpirationContracts.length} Exibidos
                  </span>
                </div>

                {/* Horizon Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setExpirationHorizonFilter('todos')}
                    className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-colors border ${
                      expirationHorizonFilter === 'todos'
                        ? 'bg-[#0051d5] text-white border-transparent shadow-xs'
                        : 'bg-[#eff4ff] text-[#45464d] hover:text-[#0b1c30] hover:bg-[#dce9ff] border-transparent'
                    }`}
                  >
                    Todos ({expirationContractsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpirationHorizonFilter('criticos')}
                    className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-colors border ${
                      expirationHorizonFilter === 'criticos'
                        ? 'bg-[#ba1a1a] text-white border-transparent shadow-xs'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200/80'
                    }`}
                  >
                    Críticos (&lt; 30 dias)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpirationHorizonFilter('atencao')}
                    className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-colors border ${
                      expirationHorizonFilter === 'atencao'
                        ? 'bg-[#d97706] text-white border-transparent shadow-xs'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200/80'
                    }`}
                  >
                    Atenção (30 a 60 dias)
                  </button>
                </div>
              </div>

              {/* Expiration Cards List dynamically mapped */}
              {filteredExpirationContracts.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#fffbeb] text-[#d97706] flex items-center justify-center mb-3 border border-amber-200">
                    <span className="material-symbols-outlined text-[26px]">event_available</span>
                  </div>
                  <h4 className="text-[15px] font-bold text-[#0b1c30]">
                    Nenhum Contrato no Radar de Vencimento
                  </h4>
                  <p className="text-[12px] text-[#45464d] mt-1 max-w-sm">
                    {totalContractsCount === 0
                      ? 'O banco de dados não possui contratos cadastrados no momento.'
                      : 'Todos os contratos cadastrados possuem prazos regulares superiores ao horizonte filtrado.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 my-2">
                  {filteredExpirationContracts.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#eff4ff]/40 hover:bg-[#eff4ff] border border-transparent hover:border-[#dce9ff] transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                            item.criticality === 'critico'
                              ? 'bg-red-50 text-red-700 border-red-200/80'
                              : item.criticality === 'atencao'
                              ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                              : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                        >
                          <span className="text-[16px] leading-none font-extrabold">
                            {item.days}
                          </span>
                          <span className="text-[9px] leading-tight uppercase font-bold">
                            dias
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] text-[#0b1c30] font-bold truncate">
                              {item.company}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-[#e5eeff] text-[#0b1c30] text-[10px] font-medium border border-transparent">
                              {item.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#45464d] mt-0.5">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span className="font-semibold text-[#0051d5]">{item.cost}</span>
                            <span>•</span>
                            <span>Vencimento em {item.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleContractClick(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[#0b1c30] text-[12px] font-semibold hover:bg-gray-50 shadow-xs transition-colors"
                        >
                          Ver Instrumento
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            showToast(`Processo de renovação iniciado para ${item.company}!`)
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#0051d5] text-white text-[12px] font-semibold hover:bg-[#003ea8] shadow-xs flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">sync</span>
                          Renovar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: MOVIMENTAÇÕES & AUDITORIA ================= */}
        {activeDashboardTab === 'movimentacoes' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Header da Aba Movimentações */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#e5eeff] shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-[#0b1c30]">
                    Movimentações & Trilha de Auditoria
                  </h2>
                  <p className="text-[12px] text-[#45464d]">
                    Histórico imutável de eventos, chancelas, assinaturas e alterações cadastrais
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDashboardTab('geral')}
                className="px-3.5 py-1.5 rounded-xl bg-[#eff4ff] text-[#0051d5] hover:bg-[#dce9ff] text-[12px] font-bold transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Voltar para Visão Geral
              </button>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider">
                    Total Registrado
                  </span>
                  <div className="text-[20px] font-bold text-[#0051d5] mt-0.5">
                    {auditLogs.length} Eventos
                  </div>
                  <span className="text-[10px] text-[#45464d] font-medium">Trilha auditada</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#eff4ff] text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">security</span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider">
                    Integridade
                  </span>
                  <div className="text-[20px] font-bold text-[#059669] mt-0.5">100% Válida</div>
                  <span className="text-[10px] text-[#059669] font-medium">SHA-256 verificado</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider">
                    Conformidade
                  </span>
                  <div className="text-[20px] font-bold text-[#0b1c30] mt-0.5">ICP-Brasil / LGPD</div>
                  <span className="text-[10px] text-[#45464d] font-medium">Carimbo de tempo</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#eff4ff] text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">history_edu</span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider">
                    Operador Ativo
                  </span>
                  <div className="text-[20px] font-bold text-[#0b1c30] mt-0.5 truncate">
                    {userName}
                  </div>
                  <span className="text-[10px] text-[#0051d5] font-medium capitalize">
                    {currentRole}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#eff4ff] text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
              </div>
            </div>

            {/* Bottom Section: Role-Based Ledger Table */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              {/* Left Action Card (4 cols) */}
              <div className="xl:col-span-4 flex flex-col gap-4">
                <div className="p-4 bg-white rounded-2xl border border-[#e5eeff] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                      </div>
                      <span className="text-[15px] font-bold text-[#0b1c30]">
                        Protocolo Criptográfico
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#059669] text-[12px] font-bold">
                      Ativo
                    </span>
                  </div>
                  <p className="text-[13px] text-[#45464d] mt-2 leading-relaxed">
                    Todos os blocos de eventos, uploads de minutas e assinaturas são gravados com hash SHA-256 e carimbo de tempo inviolável em conformidade com o padrão ICP-Brasil.
                  </p>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-50">
                    <span className="text-[11px] text-[#45464d]">Padrão ICP-Brasil / LGPD</span>
                    <span className="text-[11px] text-[#059669] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
                      Hash ativo
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Movements Table (8 cols) */}
              <div className="xl:col-span-8 p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col">
                    <h2 className="text-[18px] font-bold text-[#0b1c30] tracking-tight">
                      Movimentações Recentes
                    </h2>
                    <span className="text-[11px] text-[#45464d]">
                      Últimas atualizações cadastrais e tramitações registradas
                    </span>
                  </div>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-[26px]">history_edu</span>
                    </div>
                    <h4 className="text-[15px] font-bold text-[#0b1c30]">
                      Trilha de Auditoria Inicializada (0 Eventos)
                    </h4>
                    <p className="text-[12px] text-[#45464d] mt-1 max-w-md leading-relaxed">
                      O banco de dados foi iniciado agora com 0 informações. Qualquer nova ação no sistema — criação de contratos, atualizações de status ou cadastros de fornecedores — será registrada aqui em tempo real.
                    </p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="bg-[#eff4ff]/70 text-[#45464d] text-[11px] uppercase tracking-wider font-semibold">
                          <th className="py-2.5 px-3 rounded-l-lg">Ação • Recurso</th>
                          <th className="py-2.5 px-3">Usuário Responsável</th>
                          <th className="py-2.5 px-3">Data e Hora</th>
                          <th className="py-2.5 px-3 text-right rounded-r-lg">Hash SHA-256</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {auditLogs.slice(0, 8).map((log) => (
                          <tr key={log.id} className="hover:bg-[#eff4ff]/40 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-[#0b1c30]">{log.action}</span>
                                <span className="text-[11px] text-[#45464d]">{log.resource}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-[#45464d]">{log.user}</td>
                            <td className="py-2.5 px-3 text-[#45464d] text-[11px]">{log.timestamp}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[10px] text-[#76777d]">
                              {log.hash ? log.hash.slice(0, 16) + '...' : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131b2e] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-white/10 animate-in fade-in slide-in-from-bottom-3">
          <span className="material-symbols-outlined text-[#316bf3] text-[20px]">info</span>
          <span className="text-[13px] font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
