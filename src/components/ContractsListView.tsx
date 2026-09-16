import React, { useState, useEffect } from 'react';
import { Contract, Supplier, ContractStatus, UserRole } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { calculateDaysRemaining } from '../utils/contractMonitor';

interface ContractsListViewProps {
  contracts: Contract[];
  suppliers: Supplier[];
  onSelectContract: (contract: Contract) => void;
  onAddNewContract: (newContract: Partial<Contract>) => void;
  onDeleteContract?: (contractId: string) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  currentRole?: UserRole;
  initialSupplierFilter?: string;
  onClearInitialSupplierFilter?: () => void;
}

type ValidityFilterType = 'todas' | 'vigente_ano' | 'vigente_2025' | 'expiracao_proxima';
type CategoryFilterType = 'todas' | 'saas_nuvem' | 'infraestrutura_hw' | 'consultoria_especializada';
type ContractPeriodicity = 'mensal' | 'anual' | 'demanda' | 'plurianual';

export const ContractsListView: React.FC<ContractsListViewProps> = ({
  contracts,
  suppliers,
  onSelectContract,
  onAddNewContract,
  onDeleteContract,
  isDrawerOpen,
  setIsDrawerOpen,
  currentRole = 'administrador',
  initialSupplierFilter,
  onClearInitialSupplierFilter,
}) => {
  const [activeFilterTab, setActiveFilterTab] = useState<'todos' | ContractStatus>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState(initialSupplierFilter || '');
  const [validityFilter, setValidityFilter] = useState<ValidityFilterType>('todas');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterType>('todas');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sincroniza filtro de fornecedor quando navegado de outra visão
  useEffect(() => {
    if (initialSupplierFilter) {
      setSelectedSupplierFilter(initialSupplierFilter);
      setActiveFilterTab('todos');
      if (onClearInitialSupplierFilter) {
        onClearInitialSupplierFilter();
      }
    }
  }, [initialSupplierFilter, onClearInitialSupplierFilter]);

  // Confirmation Modal State for Contract Deletion
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isDeletingContract, setIsDeletingContract] = useState(false);

  // New Contract Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSupplierId, setNewSupplierId] = useState(suppliers[0]?.id || '');
  const [newInternalId, setNewInternalId] = useState('#' + Math.floor(1000 + Math.random() * 9000) + '-25');
  const [newStartDate, setNewStartDate] = useState('2025-05-01');
  const [newEndDate, setNewEndDate] = useState('2026-05-01');
  const [newTotalValue, setNewTotalValue] = useState('180000');
  const [newPeriodicity, setNewPeriodicity] = useState<ContractPeriodicity>('mensal');
  const [newIsSigned, setNewIsSigned] = useState(true);
  const [newNotificationEmail, setNewNotificationEmail] = useState('gestor.contratos@empresa.com.br');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isAiFilling, setIsAiFilling] = useState(false);

  const handleValidityFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'todas' || val === 'vigente_2025' || val === 'expiracao_proxima') {
      setValidityFilter(val);
    }
  };

  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (
      val === 'todas' ||
      val === 'saas_nuvem' ||
      val === 'infraestrutura_hw' ||
      val === 'consultoria_especializada'
    ) {
      setCategoryFilter(val);
    }
  };

  const handlePeriodicityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'mensal' || val === 'anual' || val === 'demanda' || val === 'plurianual') {
      setNewPeriodicity(val);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter logic
  const filteredContracts = contracts.filter((c) => {
    if (activeFilterTab !== 'todos' && c.status !== activeFilterTab) return false;
    if (selectedSupplierFilter && c.supplierId !== selectedSupplierFilter) return false;

    if (validityFilter !== 'todas') {
      if (validityFilter === 'vigente_ano' || validityFilter === 'vigente_2025') {
        const currentYear = new Date().getFullYear();
        const startYear = c.startDate ? new Date(c.startDate).getFullYear() : null;
        const endYear = c.endDate ? new Date(c.endDate).getFullYear() : null;
        const matchesYear =
          (startYear !== null && startYear <= currentYear && (endYear === null || endYear >= currentYear)) ||
          (c.startDate && c.startDate.includes(String(currentYear))) ||
          (c.endDate && c.endDate.includes(String(currentYear))) ||
          (c.startDate && c.startDate.includes('2025')) ||
          (c.endDate && c.endDate.includes('2025'));
        if (!matchesYear) return false;
      } else if (validityFilter === 'expiracao_proxima') {
        const remainingDays = calculateDaysRemaining(c);
        const isExpiringSoon =
          c.status === 'avencer' ||
          (remainingDays > 0 && remainingDays <= 90);
        if (!isExpiringSoon) return false;
      }
    }

    if (categoryFilter !== 'todas') {
      const cat = (c.category || '').toLowerCase();
      const title = (c.title || '').toLowerCase();
      if (categoryFilter === 'saas_nuvem') {
        const matches =
          cat.includes('saas') ||
          cat.includes('nuvem') ||
          cat.includes('cloud') ||
          cat.includes('software') ||
          title.includes('cloud') ||
          title.includes('software') ||
          title.includes('saas');
        if (!matches) return false;
      } else if (categoryFilter === 'infraestrutura_hw') {
        const matches =
          cat.includes('infra') ||
          cat.includes('hw') ||
          cat.includes('hardware') ||
          cat.includes('datacenter') ||
          title.includes('hardware') ||
          title.includes('infra') ||
          title.includes('datacenter');
        if (!matches) return false;
      } else if (categoryFilter === 'consultoria_especializada') {
        const matches =
          cat.includes('consultoria') ||
          cat.includes('especializada') ||
          cat.includes('assessoria') ||
          cat.includes('jurídic') ||
          cat.includes('auditoria') ||
          title.includes('consultoria') ||
          title.includes('assessoria') ||
          title.includes('auditoria');
        if (!matches) return false;
      } else {
        if (!cat.includes(categoryFilter.toLowerCase())) return false;
      }
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.supplierName.toLowerCase().includes(q) ||
        c.supplierCnpj.includes(q)
      );
    }
    return true;
  });

  const countByStatus = {
    todos: contracts.length,
    vigente: contracts.filter((c) => c.status === 'vigente').length,
    avencer: contracts.filter((c) => c.status === 'avencer').length,
    sem_assinatura: contracts.filter((c) => c.status === 'sem_assinatura').length,
    expirado: contracts.filter((c) => c.status === 'expirado').length,
  };

  const handleSimulateAiFill = () => {
    setIsAiFilling(true);
    showToast('IA lendo minuta jurídica e extraindo metadados automaticamente...');
    setTimeout(() => {
      setIsAiFilling(false);
      setNewTitle('Fornecimento e Licenciamento de Software Cloud');
      const targetSupplier =
        suppliers.find((s) => s.id.toLowerCase().includes('aws') || s.razaoSocial.toLowerCase().includes('amazon')) ||
        suppliers[0];
      if (targetSupplier) {
        setNewSupplierId(targetSupplier.id);
      }
      setNewTotalValue('360000');
      setNewNotificationEmail('gestor.cloud@empresa.com.br');
      setUploadedFileName('Minuta_AWS_Cloud_Assinada_v2.pdf');
      setNewIsSigned(true);
      showToast('Campos preenchidos com precisão pela IA!');
    }, 1200);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === newSupplierId) || suppliers[0];
    const val = parseFloat(newTotalValue) || 100000;

    const start = new Date(newStartDate);
    const end = new Date(newEndDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diffTotalMs = !isNaN(start.getTime()) && !isNaN(end.getTime())
      ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      : 365;
    const diffRemainingMs = !isNaN(end.getTime())
      ? Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    const remainingDays = Math.max(0, diffRemainingMs);
    const elapsedDays = Math.max(0, diffTotalMs - remainingDays);
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / diffTotalMs) * 100)));

    let derivedStatus: ContractStatus = newIsSigned ? 'vigente' : 'sem_assinatura';
    if (newIsSigned && remainingDays <= 60 && remainingDays > 0) {
      derivedStatus = 'avencer';
    } else if (newIsSigned && remainingDays === 0) {
      derivedStatus = 'expirado';
    }

    const currentYear = new Date().getFullYear();
    const generatedCode = `CTR-${currentYear}-${Math.floor(100 + Math.random() * 900)}`;

    const newContract: Partial<Contract> = {
      id: 'ctr-' + Date.now(),
      code: generatedCode,
      internalId: newInternalId,
      title: newTitle || 'Contrato de Prestação de Serviços Tecnológicos',
      supplierId: sup ? sup.id : 'sup-padrao',
      supplierName: sup ? sup.razaoSocial : 'Fornecedor em Homologação',
      supplierCnpj: sup ? sup.cnpj : '00.000.000/0001-00',
      category: 'Tecnologia / SaaS',
      startDate: newStartDate,
      endDate: newEndDate,
      totalDays: diffTotalMs,
      remainingDays: remainingDays,
      totalValue: val,
      monthlyValue: newPeriodicity === 'mensal' ? Math.round(val / 12) : undefined,
      periodicity: newPeriodicity,
      status: derivedStatus,
      signatureStatus: newIsSigned ? 'Assinado Digitalmente' : 'Pendente de Assinatura',
      hasOcr: true,
      progressPercent: progressPercent,
      isSigned: newIsSigned,
      notificationEmail: newNotificationEmail.trim() || 'gestor.contratos@empresa.com.br',
      notifyOnExpiration: true,
      notifyOnStatusChange: true,
      signers: [
        {
          id: 's-auto',
          name: 'Lucas Teles',
          role: 'Diretor Jurídico & CLO',
          cpf: '***.382.918-**',
          signed: newIsSigned,
          signedAt: newIsSigned ? 'Hoje às 15:00' : undefined,
          avatarInitials: 'LT',
        },
      ],
      attachments: uploadedFileName
        ? [
            {
              id: 'att-1',
              name: uploadedFileName,
              size: '1.8 MB',
              addedAt: 'Hoje',
              type: 'pdf',
              description: 'Processado com OCR e hash ICP-Brasil',
            },
          ]
        : [],
      aiInsights: {
        executiveSummary: `Instrumento cadastrado com sucesso. Objeto: ${newTitle}. Vigência estipulada até ${newEndDate}.`,
        items: [
          {
            topic: 'Vigência e Término',
            summary: `Contrato ativo com monitoramento preventivo de vencimento em ${newEndDate}.`,
            icon: 'schedule',
          },
          {
            topic: 'Classificação Financeira',
            summary: `Valor total registrado de R$ ${val.toLocaleString('pt-BR')},00 (${newPeriodicity}).`,
            icon: 'payments',
          },
        ],
      },
    };

    onAddNewContract(newContract);
    setIsDrawerOpen(false);
    showToast(`Contrato ${generatedCode} cadastrado com sucesso!`);
  };

  return (
    <div className="flex flex-col w-full relative">
      <div className="p-6 flex flex-col gap-5 w-full max-w-[1600px] mx-auto animate-in fade-in duration-300">
        {/* Clean Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-bold text-[#0b1c30] tracking-tight leading-none">
                Repositório Central de Contratos
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] text-[11px] font-semibold border border-[#dce9ff]">
                Ciclo de Vida (CLM)
              </span>
            </div>
            <p className="text-[13px] text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
              <span>Exposição Financeira: <strong className="text-slate-800 font-semibold">R$ 18.420.900,00</strong></span>
              <span className="text-slate-300">•</span>
              <span>Conformidade: <strong className="text-emerald-600 font-semibold">98.2%</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => showToast('Exportando relatório consolidado em formato CSV/Excel...')}
              className="h-9 px-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-500">table_view</span>
              <span>Exportar CSV</span>
            </button>

            {currentRole !== 'visualizador' && (
              <button
                type="button"
                id="btn-new-contract-list"
                onClick={() => setIsDrawerOpen(true)}
                className="h-9 px-4 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] active:scale-[0.98] text-white text-[13px] font-semibold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Novo Instrumento</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Clean Minimalist KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] text-slate-500 font-medium">
                Volume Total
              </span>
              <span className="text-[24px] font-bold text-slate-900 tracking-tight leading-none mt-1">
                {countByStatus.todos}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Instrumentos cadastrados</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0051d5] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">folder_copy</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] text-slate-500 font-medium">
                Vigentes e Ativos
              </span>
              <span className="text-[24px] font-bold text-emerald-600 tracking-tight leading-none mt-1">
                {countByStatus.vigente}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">+4 novos este mês</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] text-slate-500 font-medium">
                Atenção (30-60d)
              </span>
              <span className="text-[24px] font-bold text-amber-600 tracking-tight leading-none mt-1">
                {countByStatus.avencer}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Em risco de renovação</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] text-slate-500 font-medium">
                Pendente de Assinatura
              </span>
              <span className="text-[24px] font-bold text-rose-600 tracking-tight leading-none mt-1">
                {countByStatus.sem_assinatura}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Aguardando rubricas</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">draw</span>
            </div>
          </div>
        </div>

        {/* Clean Filter Toolbar & Tab Bar */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
          {/* Segmented Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setActiveFilterTab('todos')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeFilterTab === 'todos'
                  ? 'bg-[#0051d5] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Todos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilterTab === 'todos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {countByStatus.todos}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab('vigente')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeFilterTab === 'vigente'
                  ? 'bg-[#0051d5] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Vigentes</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilterTab === 'vigente' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {countByStatus.vigente}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab('avencer')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeFilterTab === 'avencer'
                  ? 'bg-[#0051d5] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>A Vencer em 30/60 dias</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilterTab === 'avencer' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
              }`}>
                {countByStatus.avencer}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab('sem_assinatura')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeFilterTab === 'sem_assinatura'
                  ? 'bg-[#0051d5] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Sem Assinatura</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilterTab === 'sem_assinatura' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700'
              }`}>
                {countByStatus.sem_assinatura}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilterTab('expirado')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeFilterTab === 'expirado'
                  ? 'bg-[#0051d5] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Expirados</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilterTab === 'expirado' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {countByStatus.expirado}
              </span>
            </button>
          </div>

          {/* Search and Filters Controls */}
          <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
            <div className="relative flex-1 min-w-[260px]">
              <label htmlFor="contracts-search" className="sr-only">
                Filtrar por código, razão social, objeto
              </label>
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                search
              </span>
              <input
                id="contracts-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por código, razão social, objeto..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50/70 border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 transition-all"
              />
            </div>

            <label htmlFor="contracts-filter-supplier" className="sr-only">
              Filtrar por Fornecedor
            </label>
            <select
              id="contracts-filter-supplier"
              value={selectedSupplierFilter}
              onChange={(e) => setSelectedSupplierFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 cursor-pointer"
            >
              <option value="">Todos os Fornecedores</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.razaoSocial}
                </option>
              ))}
            </select>

            <label htmlFor="contracts-filter-validity" className="sr-only">
              Filtrar por Vigência
            </label>
            <select
              id="contracts-filter-validity"
              value={validityFilter}
              onChange={handleValidityFilterChange}
              className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 cursor-pointer"
            >
              <option value="todas">Todas as Vigências</option>
              <option value="vigente_ano">Vigente no Ano Atual ({new Date().getFullYear()})</option>
              <option value="expiracao_proxima">Expiração Próxima (≤ 90 dias)</option>
            </select>

            <label htmlFor="contracts-filter-category" className="sr-only">
              Filtrar por Modalidade
            </label>
            <select
              id="contracts-filter-category"
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 cursor-pointer"
            >
              <option value="todas">Todas as Modalidades</option>
              <option value="saas_nuvem">SaaS & Nuvem</option>
              <option value="infraestrutura_hw">Infraestrutura HW</option>
              <option value="consultoria_especializada">Consultoria Especializada</option>
            </select>
          </div>
        </div>

        {/* Contracts Data Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-slate-50/75 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200/80">
                  <th className="py-3 px-4">Identificação / Objeto</th>
                  <th className="py-3 px-4">Fornecedor Contratado</th>
                  <th className="py-3 px-4">Vigência & Timeline</th>
                  <th className="py-3 px-4">Status de Assinatura</th>
                  <th className="py-3 px-4">Valor Global</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mb-1 border border-slate-200">
                          <span className="material-symbols-outlined text-[26px]">search_off</span>
                        </div>
                        <p className="text-[14px] font-semibold text-slate-800">
                          Nenhum contrato encontrado
                        </p>
                        <p className="text-[12px] text-slate-500 max-w-sm">
                          Não foram localizados contratos para os filtros aplicados. Tente ajustar os termos de busca ou filtros de status.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    onClick={() => onSelectContract(contract)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Contract ID & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0051d5] flex items-center justify-center shrink-0 border border-blue-100/60">
                          <span className="material-symbols-outlined text-[18px]">description</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-semibold text-slate-900 group-hover:text-[#0051d5] transition-colors truncate">
                            {contract.title}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                            <span className="font-semibold text-[#0051d5]">{contract.code}</span>
                            <span>•</span>
                            <span>{contract.internalId}</span>
                            {contract.hasOcr && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[9px] font-medium border border-purple-200/60">
                                OCR
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Supplier */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-medium text-slate-800">
                          {contract.supplierName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {contract.supplierCnpj}
                        </span>
                      </div>
                    </td>

                    {/* Timeline & Progress */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 w-40">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>
                            {contract.startDate.slice(0, 7)} a {contract.endDate.slice(0, 7)}
                          </span>
                          <span
                            className={`font-semibold ${
                              contract.remainingDays <= 45 ? 'text-amber-600' : 'text-slate-600'
                            }`}
                          >
                            {contract.remainingDays > 0 ? `${contract.remainingDays}d` : 'Expirado'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              contract.status === 'expirado'
                                ? 'bg-slate-300'
                                : contract.remainingDays <= 45
                                ? 'bg-amber-500'
                                : 'bg-[#0051d5]'
                            }`}
                            style={{ width: `${Math.min(100, contract.progressPercent)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Signature Status Badge */}
                    <td className="py-3 px-4">
                      {contract.status === 'vigente' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Assinado Digitalmente
                        </span>
                      )}
                      {contract.status === 'avencer' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          A Vencer (Risco)
                        </span>
                      )}
                      {contract.status === 'sem_assinatura' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-medium border border-rose-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Sem Assinatura
                        </span>
                      )}
                      {contract.status === 'expirado' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Expirado
                        </span>
                      )}
                    </td>

                    {/* Total Value */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-slate-900">
                          R$ {contract.totalValue.toLocaleString('pt-BR')},00
                        </span>
                        {contract.monthlyValue && (
                          <span className="text-[11px] text-slate-400">
                            R$ {contract.monthlyValue.toLocaleString('pt-BR')}/mês
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          id={`btn-view-contract-${contract.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectContract(contract);
                          }}
                          className="h-7 px-2.5 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-[#0051d5] text-[12px] font-medium transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">visibility</span>
                          <span>Ver</span>
                        </button>

                        <button
                          type="button"
                          id={`btn-download-contract-${contract.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            showToast(`Baixando PDF assinado de ${contract.code}...`);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Baixar PDF"
                        >
                          <span className="material-symbols-outlined text-[17px]">download</span>
                        </button>

                        {currentRole === 'administrador' && (
                          <button
                            type="button"
                            id={`btn-delete-contract-${contract.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setContractToDelete(contract);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Excluir contrato (Exclusivo Administrador)"
                          >
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>

          {/* Table Footer Summary & Pagination */}
          <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Exibindo <strong>{filteredContracts.length}</strong> de{' '}
              <strong>{contracts.length}</strong> contratos registrados
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Página 1 de 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer: "Novo Instrumento Contratual" (Matches Image 7.png / HTML) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-gray-200 animate-in slide-in-from-right duration-300">
            {/* Drawer Header - Fixed Top with 100% Solid Background */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 z-20 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0051d5] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">post_add</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[17px] font-bold text-[#0b1c30] leading-tight">
                    Novo Instrumento Contratual
                  </h2>
                  <span className="text-[11px] text-gray-500">
                    Cadastro com validação automática de CNPJ e OCR
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Fechar"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Drawer Form Body - Scrollable Area Only */}
            <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {/* AI Auto-fill Banner */}
                <div className="p-3.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-2xl border border-purple-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-purple-600 text-[22px]">auto_awesome</span>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-purple-900">
                        Preenchimento Autônomo com IA
                      </span>
                      <span className="text-[10px] text-purple-700">
                        A IA lê minutas contratuais em PDF e popula os campos
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isAiFilling}
                    onClick={handleSimulateAiFill}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 shadow-sm disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[14px] ${isAiFilling ? 'animate-spin' : ''}`}>
                      {isAiFilling ? 'sync' : 'auto_fix_high'}
                    </span>
                    <span>{isAiFilling ? 'Lendo Minuta...' : 'Cadastrar com IA'}</span>
                  </button>
                </div>

                {/* Vincular Fornecedor */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold text-[#0b1c30]">
                    Vincular Fornecedor *
                  </label>
                  <select
                    value={newSupplierId}
                    onChange={(e) => setNewSupplierId(e.target.value)}
                    required
                    className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 cursor-pointer"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.razaoSocial} ({s.cnpj})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Título / Objeto */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold text-[#0b1c30]">
                    Título / Objeto do Contrato *
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Fornecimento e Licenciamento Enterprise Cloud"
                    required
                    className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                  />
                </div>

                {/* Processo Interno */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold text-[#0b1c30]">
                    Nº do Processo / Referência Interna
                  </label>
                  <input
                    type="text"
                    value={newInternalId}
                    onChange={(e) => setNewInternalId(e.target.value)}
                    placeholder="#9948-25"
                    className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] font-mono text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                  />
                </div>

                {/* Datas de Vigência */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-bold text-[#0b1c30]">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      required
                      className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-bold text-[#0b1c30]">
                      Data de Término *
                    </label>
                    <input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      required
                      className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Valores e Periodicidade */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-bold text-[#0b1c30]">
                      Valor Global (R$) *
                    </label>
                    <input
                      type="number"
                      value={newTotalValue}
                      onChange={(e) => setNewTotalValue(e.target.value)}
                      required
                      min="1"
                      className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] font-mono text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-bold text-[#0b1c30]">
                      Periodicidade
                    </label>
                    <select
                      value={newPeriodicity}
                      onChange={handlePeriodicityChange}
                      className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 cursor-pointer"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="anual">Anual</option>
                      <option value="demanda">Por Demanda</option>
                      <option value="plurianual">Plurianual</option>
                    </select>
                  </div>
                </div>

                {/* Upload do Documento / Drag & Drop */}
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold text-[#0b1c30]">
                    Minuta / Contrato Digitalizado (PDF)
                  </label>
                  <div
                    onClick={() => {
                      setIsUploading(true);
                      setTimeout(() => {
                        setIsUploading(false);
                        setUploadedFileName('Minuta_Contratual_OCR_Assinada.pdf');
                        showToast('Documento anexado com verificação OCR!');
                      }, 800);
                    }}
                    className="p-4 border-2 border-dashed border-gray-300 hover:border-[#0051d5] rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-gray-50/60 hover:bg-[#eff4ff]/40"
                  >
                    <span className="material-symbols-outlined text-[32px] text-[#0051d5]">
                      cloud_upload
                    </span>
                    <span className="text-[12px] font-bold text-gray-700 mt-1">
                      {uploadedFileName || 'Solte o arquivo PDF aqui ou clique para selecionar'}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      Processamento OCR e extração por IA automáticos
                    </span>
                  </div>
                </div>

                {/* Campo E-mail de notificação */}
                <div className="flex flex-col gap-1.5 p-3.5 bg-[#f8fafc] rounded-2xl border border-gray-200/80">
                  <label htmlFor="input-new-notification-email" className="text-[12px] font-bold text-[#0b1c30] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#0051d5]">forward_to_inbox</span>
                      E-mail de notificação
                    </span>
                    <span className="text-[10px] text-[#0051d5] font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                      Alertas Automáticos
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-new-notification-email"
                      type="email"
                      required
                      value={newNotificationEmail}
                      onChange={(e) => setNewNotificationEmail(e.target.value)}
                      placeholder="ex: gestor.contratos@empresa.com.br"
                      className="w-full h-10 px-3.5 pl-9 rounded-xl border border-gray-300 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] bg-white font-medium"
                    />
                    <span className="material-symbols-outlined text-[18px] text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      alternate_email
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                    Este endereço receberá avisos automatizados de vencimento de vigência e atualizações de status.
                  </p>
                </div>

                {/* Checkbox Assinado */}
                <div className="p-3 bg-[#eff4ff]/60 rounded-xl border border-[#dce9ff] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="chkSigned"
                      checked={newIsSigned}
                      onChange={(e) => setNewIsSigned(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0051d5] focus:ring-[#0051d5] cursor-pointer"
                    />
                    <label htmlFor="chkSigned" className="text-[12px] font-semibold text-[#0b1c30] cursor-pointer">
                      Contrato já está assinado digitalmente?
                    </label>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {newIsSigned ? 'ICP-Brasil / DocuSign' : 'Entra na fila de rubricas'}
                  </span>
                </div>
              </div>

              {/* Footer Actions - Fixed Bottom with Solid Background */}
              <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-2 bg-white shrink-0 shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-10 px-4 rounded-xl text-gray-600 hover:bg-gray-100 text-[13px] font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-[13px] font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>Salvar Contrato</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generic Confirmation Modal for Contract Deletion */}
      <ConfirmationModal
        isOpen={!!contractToDelete}
        onClose={() => setContractToDelete(null)}
        onConfirm={() => {
          if (!contractToDelete) return;
          setIsDeletingContract(true);
          setTimeout(() => {
            if (onDeleteContract) {
              onDeleteContract(contractToDelete.id);
            }
            showToast(`Contrato ${contractToDelete.code} excluído com sucesso.`);
            setIsDeletingContract(false);
            setContractToDelete(null);
          }, 300);
        }}
        isLoading={isDeletingContract}
        title="Excluir Instrumento Contratual"
        message={
          <>
            Tem certeza de que deseja remover o contrato{' '}
            <strong className="text-slate-900 font-mono font-bold">
              {contractToDelete?.code}
            </strong>
            ? Esta operação revoga o cadastro e remove o instrumento da esteira de gestão ativa.
          </>
        }
        confirmText="Sim, Excluir Contrato"
        cancelText="Cancelar"
        variant="danger"
        icon="delete_forever"
        destructiveNotice="Atenção: A exclusão é irreversível. Todos os termos aditivos, histórico de alertas e parâmetros de SLA vinculados serão permanentemente desativados."
        itemDetails={
          contractToDelete
            ? [
                { label: 'Código do Contrato', value: contractToDelete.code, highlighted: true },
                { label: 'Objeto / Título', value: contractToDelete.title },
                { label: 'Fornecedor', value: contractToDelete.supplierName },
                {
                  label: 'Valor Global',
                  value: `R$ ${contractToDelete.totalValue.toLocaleString('pt-BR')},00`,
                },
                { label: 'Data de Término', value: contractToDelete.endDate },
              ]
            : []
        }
      />

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
