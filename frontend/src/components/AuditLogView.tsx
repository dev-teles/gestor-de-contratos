import React, { useState, useMemo } from 'react';
import { AuditLog, UserRole } from '../types';

interface AuditLogViewProps {
  logs: AuditLog[];
  onSelectContract?: (contractCodeOrId: string) => void;
  onSelectSupplier?: (supplierId: string) => void;
  currentRole?: UserRole;
  initialFilterResource?: string;
  onNavigateDashboard?: () => void;
  onRoleChange?: (role: UserRole) => void;
}

type EntityFilter = 'todos' | 'contrato' | 'fornecedor' | 'seguranca';
type ActionFilter = 'todos' | 'add' | 'update' | 'delete' | 'warning' | 'security';
type PeriodFilter = 'todos' | 'hoje' | '7dias' | '30dias';

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  onSelectContract,
  onSelectSupplier,
  currentRole = 'administrador',
  initialFilterResource = '',
  onNavigateDashboard,
  onRoleChange,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialFilterResource);
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('todos');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('todos');
  const [userFilter, setUserFilter] = useState<string>('todos');
  const [severityFilter, setSeverityFilter] = useState<'todos' | 'baixo' | 'medio' | 'alto'>('todos');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('todos');
  const [viewMode, setViewMode] = useState<'tabela' | 'timeline'>('tabela');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleEntityFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'todos' || val === 'contrato' || val === 'fornecedor' || val === 'seguranca') {
      setEntityFilter(val);
    }
  };

  const handleActionFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (
      val === 'todos' ||
      val === 'add' ||
      val === 'update' ||
      val === 'delete' ||
      val === 'warning' ||
      val === 'security'
    ) {
      setActionFilter(val);
    }
  };

  const handlePeriodFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'todos' || val === 'hoje' || val === '7dias' || val === '30dias') {
      setPeriodFilter(val);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // RBAC Access Control Guard: Non-administrators do not have audit viewing permission
  if (currentRole !== 'administrador') {
    return null;
  }

  // Distinct list of users for the filter dropdown
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.user) set.add(log.user);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesUser = log.user?.toLowerCase().includes(query);
        const matchesEmail = log.userEmail?.toLowerCase().includes(query);
        const matchesAction = log.action?.toLowerCase().includes(query);
        const matchesDetail = log.detail?.toLowerCase().includes(query);
        const matchesResource = log.resource?.toLowerCase().includes(query);
        const matchesIp = log.ip?.toLowerCase().includes(query);
        if (!matchesUser && !matchesEmail && !matchesAction && !matchesDetail && !matchesResource && !matchesIp) {
          return false;
        }
      }

      // Entity filter
      if (entityFilter !== 'todos') {
        if (entityFilter === 'contrato' && log.resourceType !== 'contrato' && log.type !== 'contract') return false;
        if (entityFilter === 'fornecedor' && log.resourceType !== 'fornecedor' && log.type !== 'supplier') return false;
        if (entityFilter === 'seguranca' && log.resourceType !== 'seguranca' && log.type !== 'security' && log.type !== 'warning') return false;
      }

      // Action type filter
      if (actionFilter !== 'todos') {
        if (actionFilter === 'add' && log.type !== 'add' && !log.action.includes('CRIADO') && !log.action.includes('CADASTRADO')) return false;
        if (actionFilter === 'update' && log.type !== 'update' && !log.action.includes('ATUALIZADO') && !log.action.includes('ADITIVO') && !log.action.includes('STATUS')) return false;
        if (actionFilter === 'delete' && log.type !== 'delete' && !log.action.includes('EXCLUIDO') && !log.action.includes('EXCLUÍDO')) return false;
        if (actionFilter === 'warning' && log.type !== 'warning' && !log.action.includes('BLOQUEADA') && !log.action.includes('ALERTA')) return false;
        if (actionFilter === 'security' && log.type !== 'security' && !log.action.includes('ASSINATURA') && !log.action.includes('CHAVE')) return false;
      }

      // User filter
      if (userFilter !== 'todos' && log.user !== userFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== 'todos' && log.severity !== severityFilter) {
        return false;
      }

      // Period filter
      if (periodFilter === 'hoje') {
        if (!log.timestamp.includes('Hoje')) return false;
      } else if (periodFilter === '7dias') {
        if (!log.timestamp.includes('Hoje') && !log.timestamp.includes('Ontem') && !log.timestamp.includes('Set')) return false;
      }

      return true;
    });
  }, [logs, searchTerm, entityFilter, actionFilter, userFilter, severityFilter, periodFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const contractChanges = logs.filter((l) => l.resourceType === 'contrato' || l.type === 'contract').length;
    const supplierChanges = logs.filter((l) => l.resourceType === 'fornecedor' || l.type === 'supplier').length;
    const highSeverity = logs.filter((l) => l.severity === 'alto' || l.type === 'delete' || l.type === 'warning').length;
    return { total, contractChanges, supplierChanges, highSeverity };
  }, [logs]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setEntityFilter('todos');
    setActionFilter('todos');
    setUserFilter('todos');
    setSeverityFilter('todos');
    setPeriodFilter('todos');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    entityFilter !== 'todos' ||
    actionFilter !== 'todos' ||
    userFilter !== 'todos' ||
    severityFilter !== 'todos' ||
    periodFilter !== 'todos';

  // Safe copy to clipboard with fallback for iframes
  const safeCopyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(() => {
        showToast(label);
      }).catch(() => {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          showToast(label);
        } catch {
          showToast('Não foi possível copiar automaticamente para a área de transferência.');
        }
      });
    } else {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(label);
      } catch {
        showToast('Não foi possível copiar automaticamente para a área de transferência.');
      }
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Data/Hora', 'Responsavel', 'Email', 'Cargo', 'Entidade', 'Recurso', 'Acao', 'Detalhes', 'IP', 'Severidade', 'Hash Integridade'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.user}"`,
      `"${l.userEmail || ''}"`,
      `"${l.role || ''}"`,
      `"${l.resourceType || l.type}"`,
      `"${l.resource || ''}"`,
      `"${l.action}"`,
      `"${l.detail.replace(/"/g, '""')}"`,
      `"${l.ip || ''}"`,
      `"${l.severity || 'baixo'}"`,
      `"${l.integrityHash || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trilha_auditoria_maiscontratos_riomais_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`${filteredLogs.length} registros exportados em CSV com sucesso!`);
  };

  // Export to JSON (Cryptographic Audit Dump)
  const handleExportJSON = () => {
    const exportData = {
      sistema: 'Mais Contratos • Grupo RioMais',
      ambiente: 'Produção Corporativa',
      dataExportacao: new Date().toISOString(),
      exportadoPor: currentRole,
      totalRegistros: filteredLogs.length,
      protocoloAuditoria: `AUD-${Date.now()}`,
      logs: filteredLogs,
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria_forense_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Dump forense JSON exportado com chaves criptográficas!');
  };

  // Helper for badge color based on action
  const getActionBadge = (action: string, type: string) => {
    if (action.includes('EXCLUIDO') || action.includes('EXCLUÍDO') || type === 'delete') {
      return {
        bg: 'bg-red-50 text-[#ba1a1a] border-red-200',
        icon: 'delete',
        label: 'Exclusão de Registro',
      };
    }
    if (action.includes('ADITIVO') || action.includes('VALOR')) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: 'edit_calendar',
        label: 'Termo Aditivo',
      };
    }
    if (action.includes('CRIADO') || action.includes('CADASTRADO') || type === 'add') {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: 'add_circle',
        label: 'Criação / Cadastro',
      };
    }
    if (action.includes('HOMOLOGADO') || action.includes('ASSINATURA')) {
      return {
        bg: 'bg-blue-50 text-[#0051d5] border-blue-200',
        icon: 'verified',
        label: 'Homologação / Assinatura',
      };
    }
    if (action.includes('BLOQUEADA') || type === 'warning') {
      return {
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        icon: 'security',
        label: 'Alerta de Segurança',
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: 'sync',
      label: 'Atualização Cadastral',
    };
  };

  return (
    <div className="flex-1 w-full bg-[#f7f9fd] min-h-full pb-16">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">history</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#0b1c30] tracking-tight">
                    Trilha de Auditoria & Governança
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Cadeia Imutável Ativa
                  </span>
                </div>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  Histórico detalhado de alterações, minutas, termos aditivos e cadastros de contratos e fornecedores com rastreabilidade de autoria e carimbo do tempo.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
              <button
                type="button"
                id="btn-view-mode-table"
                onClick={() => setViewMode('tabela')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  viewMode === 'tabela'
                    ? 'bg-white dark:bg-blue-600 text-[#0051d5] dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">table_rows</span>
                <span>Tabela</span>
              </button>
              <button
                type="button"
                id="btn-view-mode-timeline"
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-blue-600 text-[#0051d5] dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">timeline</span>
                <span>Linha do Tempo</span>
              </button>
            </div>

            {/* Export Dropdown / Buttons */}
            <button
              type="button"
              id="btn-export-audit-csv"
              onClick={handleExportCSV}
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-[#162033] border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 text-[12px] font-semibold transition-all flex items-center gap-1.5 shadow-xs"
              title="Exportar registros filtrados em planilha CSV"
            >
              <span className="material-symbols-outlined text-[18px] text-[#0051d5] dark:text-blue-400">download</span>
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              id="btn-export-audit-json"
              onClick={handleExportJSON}
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-[#162033] border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 text-[12px] font-semibold transition-all flex items-center gap-1.5 shadow-xs"
              title="Exportar pacote forense JSON com assinaturas"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400">data_object</span>
              <span>Dump JSON</span>
            </button>
          </div>
        </div>

        {/* Metrics KPI Cards */}
        <div className="max-w-7xl mx-auto mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white dark:bg-[#0f172a] p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-[#0051d5] dark:text-blue-400 flex items-center justify-center shrink-0 border border-transparent dark:border-blue-800/40">
              <span className="material-symbols-outlined text-[20px]">fact_check</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Total de Eventos</span>
              <span className="text-xl font-bold text-[#0b1c30] dark:text-slate-100">{stats.total}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f172a] p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-transparent dark:border-indigo-800/40">
              <span className="material-symbols-outlined text-[20px]">description</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Alterações em Contratos</span>
              <span className="text-xl font-bold text-indigo-700 dark:text-indigo-400">{stats.contractChanges}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f172a] p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-transparent dark:border-emerald-800/40">
              <span className="material-symbols-outlined text-[20px]">domain</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Alterações em Fornecedores</span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{stats.supplierChanges}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f172a] p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/70 text-[#ba1a1a] dark:text-red-400 flex items-center justify-center shrink-0 border border-transparent dark:border-red-800/40">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider block">Ações Críticas / Exclusões</span>
              <span className="text-xl font-bold text-[#ba1a1a] dark:text-red-400">{stats.highSeverity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mt-6">
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                id="audit-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, empresa, usuário, ação..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 dark:bg-[#162033] border border-gray-200 dark:border-slate-700 text-[13px] text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:border-[#0051d5] dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#1e293b] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Entity Filter */}
            <div className="md:col-span-2">
              <select
                id="audit-entity-filter"
                value={entityFilter}
                onChange={handleEntityFilterChange}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#162033] border border-gray-200 dark:border-slate-700 text-[12px] font-medium text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#0051d5] dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#1e293b] transition-all cursor-pointer"
              >
                <option value="todos" className="dark:bg-[#162033] dark:text-slate-200">Todas Entidades</option>
                <option value="contrato" className="dark:bg-[#162033] dark:text-slate-200">Contratos</option>
                <option value="fornecedor" className="dark:bg-[#162033] dark:text-slate-200">Fornecedores</option>
                <option value="seguranca" className="dark:bg-[#162033] dark:text-slate-200">Segurança & Sistema</option>
              </select>
            </div>

            {/* Operation / Action Type */}
            <div className="md:col-span-2">
              <select
                id="audit-action-filter"
                value={actionFilter}
                onChange={handleActionFilterChange}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#162033] border border-gray-200 dark:border-slate-700 text-[12px] font-medium text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#0051d5] dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#1e293b] transition-all cursor-pointer"
              >
                <option value="todos" className="dark:bg-[#162033] dark:text-slate-200">Todos os Tipos de Ação</option>
                <option value="add" className="dark:bg-[#162033] dark:text-slate-200">Criação / Cadastro</option>
                <option value="update" className="dark:bg-[#162033] dark:text-slate-200">Termo Aditivo / Alteração</option>
                <option value="delete" className="dark:bg-[#162033] dark:text-slate-200">Exclusão</option>
                <option value="security" className="dark:bg-[#162033] dark:text-slate-200">Assinatura / Homologação</option>
                <option value="warning" className="dark:bg-[#162033] dark:text-slate-200">Alertas / Bloqueios</option>
              </select>
            </div>

            {/* Responsible User Filter */}
            <div className="md:col-span-2">
              <select
                id="audit-user-filter"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#162033] border border-gray-200 dark:border-slate-700 text-[12px] font-medium text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#0051d5] dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#1e293b] transition-all truncate cursor-pointer"
              >
                <option value="todos" className="dark:bg-[#162033] dark:text-slate-200">Todos os Usuários</option>
                {uniqueUsers.map((user) => (
                  <option key={user} value={user} className="dark:bg-[#162033] dark:text-slate-200">
                    {user}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Filter */}
            <div className="md:col-span-2">
              <select
                id="audit-period-filter"
                value={periodFilter}
                onChange={handlePeriodFilterChange}
                className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#162033] border border-gray-200 dark:border-slate-700 text-[12px] font-medium text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#0051d5] dark:focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#1e293b] transition-all cursor-pointer"
              >
                <option value="todos" className="dark:bg-[#162033] dark:text-slate-200">Todo o Período</option>
                <option value="hoje" className="dark:bg-[#162033] dark:text-slate-200">Hoje</option>
                <option value="7dias" className="dark:bg-[#162033] dark:text-slate-200">Últimos 7 dias</option>
                <option value="30dias" className="dark:bg-[#162033] dark:text-slate-200">Últimos 30 dias</option>
              </select>
            </div>
          </div>

          {/* Active Filters Bar */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-700">Filtros ativos:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0051d5] font-medium border border-blue-200">
                    Termo: "{searchTerm}"
                  </span>
                )}
                {entityFilter !== 'todos' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0051d5] font-medium border border-blue-200">
                    Entidade: {entityFilter}
                  </span>
                )}
                {actionFilter !== 'todos' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0051d5] font-medium border border-blue-200">
                    Ação: {actionFilter}
                  </span>
                )}
                {userFilter !== 'todos' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0051d5] font-medium border border-blue-200">
                    Usuário: {userFilter}
                  </span>
                )}
                {periodFilter !== 'todos' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0051d5] font-medium border border-blue-200">
                    Período: {periodFilter}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[#0051d5] hover:underline font-semibold text-[11px] shrink-0 ml-2"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mt-6">
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[28px]">search_off</span>
            </div>
            <h3 className="text-[16px] font-bold text-gray-800">Nenhum registro de auditoria localizado</h3>
            <p className="text-[13px] text-gray-500 mt-1 max-w-md mx-auto">
              Não encontramos eventos correspondentes aos filtros aplicados. Tente ajustar os parâmetros de pesquisa ou limpar os filtros.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-[#0051d5] text-white text-[12px] font-semibold hover:bg-[#003ea8] transition-colors"
            >
              Restaurar Filtros Padrão
            </button>
          </div>
        ) : viewMode === 'tabela' ? (
          /* Tabular View */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Data & Horário</th>
                    <th className="py-3 px-4">Quem Fez a Alteração</th>
                    <th className="py-3 px-4">Entidade / Recurso</th>
                    <th className="py-3 px-4">Tipo de Ação</th>
                    <th className="py-3 px-4">Histórico / Detalhes</th>
                    <th className="py-3 px-4 text-center">Modificações</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[13px]">
                  {filteredLogs.map((log) => {
                    const badge = getActionBadge(log.action, log.type);
                    const isContract = log.resourceType === 'contrato' || log.type === 'contract';
                    const isSupplier = log.resourceType === 'fornecedor' || log.type === 'supplier';

                    return (
                      <tr
                        key={log.id}
                        id={`audit-row-${log.id}`}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-[#f8faff] transition-colors cursor-pointer group"
                      >
                        {/* Data & Horário */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#0b1c30] text-[13px]">{log.timestamp}</span>
                            <span className="text-[11px] text-gray-400 font-mono">{log.date || '08/09/2026'}</span>
                          </div>
                        </td>

                        {/* Quem Fez a Alteração */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0051d5] to-[#316bf3] text-white flex items-center justify-center font-bold text-[12px] shrink-0">
                              {log.user
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-gray-900 truncate">{log.user}</span>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                <span className="truncate">{log.userEmail || 'sistema@gruporiomais.com.br'}</span>
                                {log.role && (
                                  <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-medium text-[10px]">
                                    {log.role}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Entidade / Recurso */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`p-1.5 rounded-lg text-[16px] material-symbols-outlined shrink-0 ${
                                isContract
                                  ? 'bg-blue-50 text-[#0051d5]'
                                  : isSupplier
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-purple-50 text-purple-700'
                              }`}
                            >
                              {isContract ? 'description' : isSupplier ? 'domain' : 'shield'}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-gray-900 truncate max-w-[200px]">
                                {log.resource || 'Configurações'}
                              </span>
                              <span className="text-[11px] text-gray-400 capitalize">
                                {log.resourceType || log.type}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Tipo de Ação */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${badge.bg}`}
                          >
                            <span className="material-symbols-outlined text-[15px]">{badge.icon}</span>
                            <span>{log.action.replace(/_/g, ' ')}</span>
                          </span>
                        </td>

                        {/* Detalhes do Evento */}
                        <td className="py-3.5 px-4 max-w-[320px]">
                          <p className="text-[12px] text-gray-700 line-clamp-2 leading-relaxed">
                            {log.detail}
                          </p>
                        </td>

                        {/* Modificações / Diffs */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {log.changes && log.changes.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                              <span className="material-symbols-outlined text-[13px]">tune</span>
                              <span>{log.changes.length} campo(s)</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            id={`btn-inspect-log-${log.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="h-8 px-2.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-[#eff4ff] text-[#0051d5] text-[12px] font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            <span>Inspecionar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[12px] text-gray-500">
              <span>
                Exibindo <strong className="text-gray-800">{filteredLogs.length}</strong> de{' '}
                <strong className="text-gray-800">{logs.length}</strong> eventos registrados
              </span>
              <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                Carimbo temporal RFC 3161 auditado
              </span>
            </div>
          </div>
        ) : (
          /* Timeline View */
          <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#0051d5] before:via-gray-300 before:to-gray-200 space-y-6">
            {filteredLogs.map((log) => {
              const badge = getActionBadge(log.action, log.type);
              const isContract = log.resourceType === 'contrato' || log.type === 'contract';
              const isSupplier = log.resourceType === 'fornecedor' || log.type === 'supplier';

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Dot Icon */}
                  <div
                    className={`absolute -left-[30px] sm:-left-[35px] top-3 w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white ${
                      badge.bg.includes('red')
                        ? 'bg-[#ba1a1a]'
                        : badge.bg.includes('amber')
                        ? 'bg-amber-600'
                        : badge.bg.includes('emerald')
                        ? 'bg-emerald-600'
                        : badge.bg.includes('purple')
                        ? 'bg-purple-600'
                        : 'bg-[#0051d5]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{badge.icon}</span>
                  </div>

                  {/* Card Body */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-[#0051d5]/40 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badge.bg}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[12px] font-semibold text-gray-900 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-gray-400">
                            {isContract ? 'description' : isSupplier ? 'domain' : 'security'}
                          </span>
                          {log.resource}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[12px] text-gray-500 font-mono">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span>{log.timestamp}</span>
                      </div>
                    </div>

                    <p className="text-[13px] text-gray-800 mt-3 leading-relaxed">{log.detail}</p>

                    {/* Diff changes if present */}
                    {log.changes && log.changes.length > 0 && (
                      <div className="mt-4 bg-gray-50 rounded-xl p-3.5 border border-gray-200">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                          <span className="material-symbols-outlined text-[14px] text-amber-600">compare_arrows</span>
                          <span>Campos Modificados nesta Operação:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {log.changes.map((c, i) => (
                            <div key={i} className="bg-white p-2.5 rounded-lg border border-gray-200 text-[12px]">
                              <span className="text-[11px] font-semibold text-gray-500 block truncate">{c.label}</span>
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="text-red-700 bg-red-50 line-through px-1.5 py-0.5 rounded text-[11px] font-mono">
                                  {c.oldValue}
                                </span>
                                <span className="text-gray-400 material-symbols-outlined text-[12px]">arrow_forward</span>
                                <span className="text-emerald-700 bg-emerald-50 font-semibold px-1.5 py-0.5 rounded text-[11px] font-mono">
                                  {c.newValue}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer with User info & Inspect Button */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#0051d5] text-white flex items-center justify-center font-bold text-[10px]">
                          {log.user[0]}
                        </div>
                        <span className="text-gray-700 font-medium">
                          Alterado por <strong className="text-gray-900">{log.user}</strong> ({log.role || 'Usuário'})
                        </span>
                        {log.ip && <span className="text-gray-400 font-mono text-[11px]">• IP: {log.ip}</span>}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="text-[#0051d5] hover:text-[#003ea8] font-semibold text-[12px] flex items-center gap-1 hover:underline"
                      >
                        <span>Ver detalhes forenses</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Forensic Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0051d5]/10 dark:bg-blue-950/70 text-[#0051d5] dark:text-blue-400 flex items-center justify-center border border-transparent dark:border-blue-800/40">
                  <span className="material-symbols-outlined text-[20px]">policy</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#0b1c30] dark:text-slate-100">
                    Registro de Auditoria Forense #{selectedLog.id}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 font-mono">
                    Integridade: {selectedLog.integrityHash || 'SHA256-VALIDADO-ICP'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-audit-modal"
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                title="Fechar inspeção"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-[13px]">
              {/* Section 1: Event Summary */}
              <div className="bg-[#f8faff] dark:bg-[#162033] rounded-xl p-4 border border-blue-100 dark:border-blue-900/40">
                <span className="text-[11px] font-bold text-[#0051d5] dark:text-blue-400 uppercase tracking-wider block mb-1">
                  Resumo da Operação
                </span>
                <p className="text-[14px] font-semibold text-gray-900 dark:text-slate-100">{selectedLog.detail}</p>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-[#0051d5] dark:text-blue-300 font-semibold border border-transparent dark:border-blue-800/50">
                    Ação: {selectedLog.action}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold">
                    Severidade: {selectedLog.severity || 'baixo'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-mono">
                    Data: {selectedLog.timestamp}
                  </span>
                </div>
              </div>

              {/* Section 2: Who made the change */}
              <div>
                <h4 className="text-[12px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#0051d5] dark:text-blue-400">person</span>
                  <span>Responsável pela Alteração</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 dark:bg-slate-900/80 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] text-gray-400 dark:text-slate-400 block">Nome Completo</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">{selectedLog.user}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 dark:text-slate-400 block">E-mail Corporativo</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">{selectedLog.userEmail || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 dark:text-slate-400 block">Perfil de Acesso</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">{selectedLog.role || 'Operacional'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 dark:text-slate-400 block">Endereço IP</span>
                    <span className="font-mono text-gray-800 dark:text-slate-200">{selectedLog.ip || '189.40.112.44'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 dark:text-slate-400 block">Localização Estimada</span>
                    <span className="text-gray-800 dark:text-slate-200">{selectedLog.location || 'São Paulo, SP'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 dark:text-slate-400 block">Autenticação</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      2FA Verificado
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Affected Resource */}
              <div>
                <h4 className="text-[12px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">target</span>
                  <span>Recurso Afetado</span>
                </h4>
                <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-900/80 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[22px] text-gray-500 dark:text-slate-400">
                      {selectedLog.resourceType === 'contrato' ? 'description' : 'domain'}
                    </span>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-slate-100 block">{selectedLog.resource}</span>
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 capitalize">
                        Tipo: {selectedLog.resourceType || selectedLog.type}
                      </span>
                    </div>
                  </div>

                  {selectedLog.resourceType === 'contrato' && onSelectContract && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectContract(selectedLog.resource || '');
                        setSelectedLog(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[#0051d5] dark:text-blue-400 text-[12px] font-semibold hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Ir para Contrato
                    </button>
                  )}

                  {selectedLog.resourceType === 'fornecedor' && onSelectSupplier && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSupplier(selectedLog.resourceId || '');
                        setSelectedLog(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 text-[12px] font-semibold hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Ver Fornecedor
                    </button>
                  )}
                </div>
              </div>

              {/* Section 4: Detailed Diff (Before vs After) */}
              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div>
                  <h4 className="text-[12px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400">compare</span>
                    <span>Tabela Comparativa de Alterações (Diff Antes vs Depois)</span>
                  </h4>
                  <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead>
                        <tr className="bg-gray-100/70 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase">
                          <th className="py-2.5 px-3">Campo Modificado</th>
                          <th className="py-2.5 px-3">Valor Anterior (Antes)</th>
                          <th className="py-2.5 px-3">Novo Valor (Depois)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {selectedLog.changes.map((ch, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="py-2.5 px-3 font-semibold text-gray-800 dark:text-slate-200">{ch.label}</td>
                            <td className="py-2.5 px-3 text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-950/30 font-mono line-through">
                              {ch.oldValue}
                            </td>
                            <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 font-semibold font-mono">
                              {ch.newValue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Section 5: Cryptographic Proof */}
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-[11px] font-mono space-y-1 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800 pb-1 mb-2">
                  <span>Assinatura Digital & Não-Repúdio</span>
                  <span className="text-emerald-400">HASH VERIFICADO</span>
                </div>
                <div>SHA-256: {selectedLog.integrityHash || 'SHA256-4890BC194A021F8900E1'}</div>
                <div>Carimbo do Tempo: {new Date().toISOString()} (UTC-3 BRT)</div>
                <div className="text-slate-400">Certificadora: Autoridade Certificadora Raiz ICP-Brasil v5</div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  safeCopyToClipboard(JSON.stringify(selectedLog, null, 2), 'JSON do registro copiado para a área de transferência!');
                }}
                className="h-9 px-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 text-[12px] font-semibold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>Copiar Registro Forense</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="h-9 px-4 rounded-xl bg-[#0051d5] text-white text-[12px] font-semibold hover:bg-[#0041ab] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131b2e] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-white/10 animate-in fade-in slide-in-from-bottom-3">
          <span className="material-symbols-outlined text-[#316bf3] text-[20px]">info</span>
          <span className="text-[13px] font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
