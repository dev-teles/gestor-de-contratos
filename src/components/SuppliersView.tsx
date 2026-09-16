import React, { useState, useEffect, useRef } from 'react';
import { Contract, Supplier, UserRole } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface SuppliersViewProps {
  suppliers: Supplier[];
  contracts?: Contract[];
  onAddSupplier: (newSupplier: Supplier) => void;
  onDeleteSupplier?: (supplierId: string) => void;
  onSelectSupplierContracts?: (supplierId: string) => void;
  currentRole?: UserRole;
  initialSearchTerm?: string;
  onClearInitialSearchTerm?: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  contracts = [],
  onAddSupplier,
  onDeleteSupplier,
  onSelectSupplierContracts,
  currentRole = 'administrador',
  initialSearchTerm,
  onClearInitialSearchTerm,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sincroniza termo de busca quando navegado via busca rápida ou auditoria
  useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      if (onClearInitialSearchTerm) {
        onClearInitialSearchTerm();
      }
    }
  }, [initialSearchTerm, onClearInitialSearchTerm]);

  // Calcula estatísticas ativas calculadas em tempo real com base no estado global de contratos
  const getSupplierStats = (supplier: Supplier) => {
    if (!contracts || contracts.length === 0) {
      return {
        count: supplier.activeContractsCount,
        volume: supplier.totalFinancialVolume,
      };
    }
    const matched = contracts.filter(
      (c) =>
        c.supplierId === supplier.id ||
        c.supplierName.toLowerCase() === supplier.razaoSocial.toLowerCase() ||
        c.supplierCnpj.replace(/\D/g, '') === supplier.cnpj.replace(/\D/g, '')
    );
    if (matched.length > 0) {
      return {
        count: matched.length,
        volume: matched.reduce((sum, c) => sum + (c.totalValue || 0), 0),
      };
    }
    return {
      count: supplier.activeContractsCount,
      volume: supplier.totalFinancialVolume,
    };
  };

  // Deletion Confirmation State
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeletingSupplier, setIsDeletingSupplier] = useState(false);

  // New Supplier Form State
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Serviços de TI', 'Software SaaS']);
  const [riskLevel, setRiskLevel] = useState<'baixo' | 'medio' | 'alto'>('baixo');
  const [isConsultingReceita, setIsConsultingReceita] = useState(false);

  // Referências para evitar vazamento de memória e stale closures em temporizadores assíncronos
  const receitaTimerRef = useRef<NodeJS.Timeout | number | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | number | null>(null);

  // Limpeza de todos os timers ao desmontar o componente
  useEffect(() => {
    return () => {
      if (receitaTimerRef.current) clearTimeout(receitaTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Reseta completamente todos os estados do formulário para evitar vazamento de dados
  const resetForm = () => {
    if (receitaTimerRef.current) {
      clearTimeout(receitaTimerRef.current);
      receitaTimerRef.current = null;
    }
    setCnpj('');
    setRazaoSocial('');
    setNomeFantasia('');
    setInscricaoEstadual('');
    setContactName('');
    setContactRole('');
    setContactEmail('');
    setContactPhone('');
    setSelectedTags(['Serviços de TI', 'Software SaaS']);
    setRiskLevel('baixo');
    setIsConsultingReceita(false);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    resetForm();
  };

  // Acessibilidade: fechar o drawer com a tecla Escape (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDrawerOpen) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleCloseDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  const availableTags = [
    'Serviços de TI',
    'Software SaaS',
    'Infraestrutura',
    'Segurança da Informação',
    'Logística',
    'Manutenção Predial',
    'Serviços Contábeis',
    'Consultoria Jurídica',
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConsultarReceita = () => {
    setIsConsultingReceita(true);
    showToast('Consultando bases da Receita Federal e Sintegra...');

    if (receitaTimerRef.current) {
      clearTimeout(receitaTimerRef.current);
    }

    receitaTimerRef.current = setTimeout(() => {
      setIsConsultingReceita(false);

      // Elimina o stale closure: obtém o valor mais recente do estado no momento da execução
      setCnpj((currentCnpj) => (currentCnpj.trim() ? currentCnpj : '45.109.882/0001-33'));
      setRazaoSocial((prev) => (prev.trim() ? prev : 'Omni Cloud Soluções em Tecnologia Ltda.'));
      setNomeFantasia((prev) => (prev.trim() ? prev : 'Omni Cloud Brasil • DataCenters'));
      setInscricaoEstadual((prev) => (prev.trim() ? prev : '119.882.341.002'));
      setContactName((prev) => (prev.trim() ? prev : 'Marcos Vinícius de Oliveira'));
      setContactRole((prev) => (prev.trim() ? prev : 'Diretor de Alianças Corporativas'));
      setContactEmail((prev) => (prev.trim() ? prev : 'm.vinicius@omnicloud.com.br'));
      setContactPhone((prev) => (prev.trim() ? prev : '+55 (11) 3221-9988'));
      showToast('Dados cadastrais sincronizados com a Receita Federal!');
    }, 1200);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações estritas em JavaScript - sem fallbacks com dados fictícios hardcoded
    const rawCnpj = cnpj.replace(/\D/g, '');
    if (!rawCnpj) {
      showToast('Informe o CNPJ do fornecedor.');
      return;
    }
    if (rawCnpj.length !== 14) {
      showToast('CNPJ inválido: o CNPJ deve conter exatamente 14 dígitos numéricos.');
      return;
    }

    if (!razaoSocial.trim()) {
      showToast('Preencha a Razão Social do fornecedor.');
      return;
    }

    if (!contactName.trim()) {
      showToast('Preencha o nome do Contato Principal / Representante Legal.');
      return;
    }

    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      showToast('Preencha um e-mail corporativo válido para o contato.');
      return;
    }

    if (selectedTags.length === 0) {
      showToast('Selecione pelo menos uma tag de atividade para o fornecedor.');
      return;
    }

    const formattedCnpj = rawCnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );

    const now = new Date();
    const formattedSync = `Hoje às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const newSupplier: Supplier = {
      id: 'sup-' + Date.now(),
      cnpj: formattedCnpj,
      razaoSocial: razaoSocial.trim(),
      nomeFantasia: nomeFantasia.trim() || razaoSocial.trim(),
      inscricaoEstadual: inscricaoEstadual.trim() || 'Isento',
      contactName: contactName.trim(),
      contactRole: contactRole.trim() || 'Representante Legal',
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      activities: selectedTags,
      riskLevel: riskLevel,
      activeContractsCount: 0,
      totalFinancialVolume: 0,
      status: 'ativo',
      syncDate: formattedSync,
    };

    onAddSupplier(newSupplier);
    handleCloseDrawer();
    showToast(`Fornecedor ${newSupplier.razaoSocial} cadastrado e homologado com sucesso!`);
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (statusFilter !== 'todos' && s.status !== statusFilter) return false;

    if (categoryFilter !== 'todas') {
      const cat = categoryFilter.toLowerCase();
      const matchesCategory = s.activities.some((act) => {
        const a = act.toLowerCase();
        if (a === cat) return true;
        if (cat === 'tecnologia e nuvem') {
          return (
            a.includes('ti') ||
            a.includes('saas') ||
            a.includes('software') ||
            a.includes('nuvem') ||
            a.includes('cloud') ||
            a.includes('segurança')
          );
        }
        if (cat === 'consultoria e auditoria') {
          return (
            a.includes('consultoria') ||
            a.includes('auditoria') ||
            a.includes('jurídica') ||
            a.includes('contábeis')
          );
        }
        if (cat === 'facilities e infraestrutura') {
          return (
            a.includes('infraestrutura') ||
            a.includes('predial') ||
            a.includes('manutenção') ||
            a.includes('facilities') ||
            a.includes('logística')
          );
        }
        return a.includes(cat);
      });
      if (!matchesCategory) return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.razaoSocial.toLowerCase().includes(q) ||
        s.nomeFantasia.toLowerCase().includes(q) ||
        s.cnpj.includes(q) ||
        s.contactName.toLowerCase().includes(q) ||
        s.activities.some((act) => act.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalHomologados = suppliers.filter((s) => s.status === 'ativo').length;
  const totalEmHomologacao = suppliers.filter((s) => s.status === 'homologacao').length;

  return (
    <div className="flex flex-col w-full relative">
      <div className="p-6 flex flex-col gap-5 w-full max-w-[1600px] mx-auto animate-in fade-in duration-300">
        {/* Header & Global Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-bold text-[#0b1c30] tracking-tight leading-none">
                Gestão de Fornecedores
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] text-[11px] font-semibold border border-[#dce9ff]">
                Governança & Risco
              </span>
            </div>
            <p className="text-[13px] text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
              <span>Homologação de parceiros e compliance fiscal de terceiros</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => showToast('Exportando cadastro geral de fornecedores em CSV...')}
              className="h-9 px-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-500">download</span>
              <span>Exportar CSV</span>
            </button>

            {currentRole !== 'visualizador' && (
              <button
                type="button"
                id="btn-new-supplier"
                onClick={() => setIsDrawerOpen(true)}
                className="h-9 px-4 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] active:scale-[0.98] text-white text-[13px] font-semibold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">domain_add</span>
                <span>Novo Fornecedor</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] text-slate-500 font-medium">
                Total Registrado
              </span>
              <span className="text-[24px] font-bold text-slate-900 tracking-tight leading-none mt-1">
                {suppliers.length}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Base ativa corporativa</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0051d5] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">apartment</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] text-slate-500 font-medium">
                Homologados & Ativos
              </span>
              <span className="text-[24px] font-bold text-emerald-600 tracking-tight leading-none mt-1">
                {totalHomologados}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Certidões e CND válidas</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] text-slate-500 font-medium">
                Em Homologação
              </span>
              <span className="text-[24px] font-bold text-amber-600 tracking-tight leading-none mt-1">
                {totalEmHomologacao}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Processos em análise</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] text-slate-500 font-medium">
                Volume Financeiro YTD
              </span>
              <span className="text-[24px] font-bold text-slate-900 tracking-tight leading-none mt-1">
                R$ 48,2M
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Alocado em vigência</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[280px]">
            <label htmlFor="filter-supplier-search" className="sr-only">
              Filtrar fornecedores por Razão Social, Nome Fantasia ou CNPJ
            </label>
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              id="filter-supplier-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por Razão Social, Nome Fantasia ou CNPJ..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50/70 border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="filter-supplier-status" className="sr-only">
              Filtrar por Status de Homologação
            </label>
            <select
              id="filter-supplier-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Homologados / Ativos</option>
              <option value="homologacao">Em Homologação</option>
              <option value="bloqueado">Bloqueados</option>
            </select>

            <label htmlFor="filter-supplier-category" className="sr-only">
              Filtrar por Categoria ou Atividade
            </label>
            <select
              id="filter-supplier-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/10 cursor-pointer"
            >
              <option value="todas">Todas as Categorias</option>
              <option value="Tecnologia e Nuvem">Tecnologia e Nuvem</option>
              <option value="Consultoria e Auditoria">Consultoria e Auditoria</option>
              <option value="Facilities e Infraestrutura">Facilities e Infraestrutura</option>
              <option value="Serviços de TI">Serviços de TI</option>
              <option value="Software SaaS">Software SaaS</option>
              <option value="Infraestrutura">Infraestrutura</option>
              <option value="Segurança da Informação">Segurança da Informação</option>
              <option value="Logística">Logística</option>
              <option value="Manutenção Predial">Manutenção Predial</option>
              <option value="Serviços Contábeis">Serviços Contábeis</option>
              <option value="Consultoria Jurídica">Consultoria Jurídica</option>
            </select>
          </div>
        </div>

        {/* Suppliers Data Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-slate-50/75 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200/80">
                  <th className="py-3 px-4">Fornecedor / CNPJ</th>
                  <th className="py-3 px-4">Representante Legal</th>
                  <th className="py-3 px-4">Atividades & Tags</th>
                  <th className="py-3 px-4">Risco & Compliance</th>
                  <th className="py-3 px-4">Contratos / Volume</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Fornecedor */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0051d5] flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100/60">
                          {supplier.razaoSocial.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-semibold text-slate-900 group-hover:text-[#0051d5] transition-colors">
                            {supplier.razaoSocial}
                          </span>
                          <span className="text-[11px] text-slate-500">{supplier.nomeFantasia}</span>
                          <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                            CNPJ: {supplier.cnpj}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contato Principal */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-medium text-slate-800">
                          {supplier.contactName}
                        </span>
                        <span className="text-[11px] text-slate-400">{supplier.contactRole}</span>
                        <span className="text-[11px] text-[#0051d5] hover:underline mt-0.5">{supplier.contactEmail}</span>
                      </div>
                    </td>

                    {/* Atividades Tags - Cleaned up to avoid visual clutter */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        {supplier.activities.slice(0, 2).map((act, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium whitespace-nowrap"
                          >
                            {act}
                          </span>
                        ))}
                        {supplier.activities.length > 2 && (
                          <span
                            title={supplier.activities.slice(2).join(', ')}
                            className="px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-200 text-[10px] font-medium cursor-help"
                          >
                            +{supplier.activities.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Risco */}
                    <td className="py-3 px-4">
                      {supplier.riskLevel === 'baixo' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Baixo Risco
                        </span>
                      )}
                      {supplier.riskLevel === 'medio' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Médio Risco
                        </span>
                      )}
                      {supplier.riskLevel === 'alto' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-medium border border-rose-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Alto Risco
                        </span>
                      )}
                    </td>

                    {/* Contratos / Volume */}
                    <td className="py-3 px-4">
                      {(() => {
                        const stats = getSupplierStats(supplier);
                        return (
                          <div className="flex flex-col">
                            <span className="text-[12px] font-semibold text-slate-900">
                              {stats.count} {stats.count === 1 ? 'contrato' : 'contratos'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              R$ {stats.volume.toLocaleString('pt-BR')},00
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {supplier.status === 'ativo' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Homologado
                        </span>
                      )}
                      {supplier.status === 'homologacao' && (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Em Homologação
                          </span>
                          {supplier.statusReason && (
                            <span className="text-[10px] text-slate-400 mt-0.5 max-w-[130px] truncate">
                              {supplier.statusReason}
                            </span>
                          )}
                        </div>
                      )}
                      {supplier.status === 'bloqueado' && (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-medium border border-rose-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Bloqueado
                          </span>
                          {supplier.statusReason && (
                            <span className="text-[10px] text-rose-500 mt-0.5 max-w-[130px] truncate">
                              {supplier.statusReason}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          id={`btn-view-supplier-${supplier.id}`}
                          onClick={() => {
                            if (onSelectSupplierContracts) {
                              onSelectSupplierContracts(supplier.id);
                            } else {
                              showToast(`Filtrando contratos de ${supplier.razaoSocial}`);
                            }
                          }}
                          className="h-7 px-2.5 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-[#0051d5] text-[12px] font-medium transition-colors"
                        >
                          Ver Contratos
                        </button>

                        {currentRole === 'administrador' && (
                          <button
                            type="button"
                            id={`btn-delete-supplier-${supplier.id}`}
                            onClick={() => setSupplierToDelete(supplier)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Excluir Fornecedor (Exclusivo Administrador)"
                          >
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Exibindo <strong>{filteredSuppliers.length}</strong> de{' '}
              <strong>{suppliers.length}</strong> fornecedores registrados
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Página 1 de 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer "Cadastrar Novo Fornecedor" */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in"
          onClick={handleCloseDrawer}
          aria-hidden="true"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-supplier-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-gray-200 animate-in slide-in-from-right duration-300"
          >
            {/* Header - Fixed Top with 100% Solid Background */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0 z-20 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0051d5] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">domain_add</span>
                </div>
                <div className="flex flex-col">
                  <h2
                    id="drawer-supplier-title"
                    className="text-[17px] font-bold text-[#0b1c30] leading-tight"
                  >
                    Cadastrar Novo Fornecedor
                  </h2>
                  <span className="text-[11px] text-gray-500">
                    Homologação integrada com a Receita Federal
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDrawer}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                title="Fechar (Esc)"
                aria-label="Fechar painel de cadastro"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Body Form - Scrollable Area Only */}
            <form onSubmit={handleSaveSupplier} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {/* CNPJ with Auto-lookup */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="supplier-cnpj" className="text-[12px] font-bold text-[#0b1c30]">
                    CNPJ *
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="supplier-cnpj"
                      type="text"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      required
                      className="flex-1 h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] font-mono text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                    />
                    <button
                      type="button"
                      disabled={isConsultingReceita}
                      onClick={handleConsultarReceita}
                      className="h-10 px-3.5 rounded-xl bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0051d5] text-[12px] font-bold transition-all flex items-center gap-1 shrink-0 border border-[#dce9ff]"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${isConsultingReceita ? 'animate-spin' : ''}`}>
                        {isConsultingReceita ? 'sync' : 'search'}
                      </span>
                      <span>{isConsultingReceita ? 'Buscando...' : 'Consultar Receita'}</span>
                    </button>
                  </div>
                </div>

                {/* Razão Social */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="supplier-razao-social" className="text-[12px] font-bold text-[#0b1c30]">
                    Razão Social *
                  </label>
                  <input
                    id="supplier-razao-social"
                    type="text"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Ex: Amazon Web Services Brasil Ltda."
                    required
                    className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                  />
                </div>

                {/* Nome Fantasia & IE */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="supplier-nome-fantasia" className="text-[12px] font-bold text-[#0b1c30]">
                      Nome Fantasia
                    </label>
                    <input
                      id="supplier-nome-fantasia"
                      type="text"
                      value={nomeFantasia}
                      onChange={(e) => setNomeFantasia(e.target.value)}
                      placeholder="AWS Brasil"
                      className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="supplier-inscricao-estadual" className="text-[12px] font-bold text-[#0b1c30]">
                      Inscrição Estadual
                    </label>
                    <input
                      id="supplier-inscricao-estadual"
                      type="text"
                      value={inscricaoEstadual}
                      onChange={(e) => setInscricaoEstadual(e.target.value)}
                      placeholder="114.839.201.110 ou Isento"
                      className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                    />
                  </div>
                </div>

                {/* Contato Principal & Representante Legal */}
                <fieldset className="p-3.5 rounded-2xl bg-[#eff4ff]/50 border border-[#dce9ff] flex flex-col gap-3">
                  <legend className="text-[12px] font-bold text-[#0b1c30] flex items-center gap-1.5 px-1">
                    <span className="material-symbols-outlined text-[16px] text-[#0051d5]">badge</span>
                    Contato Principal & Representante Legal
                  </legend>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="supplier-contact-name" className="text-[11px] font-bold text-[#0b1c30]">
                        Nome do Representante *
                      </label>
                      <input
                        id="supplier-contact-name"
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Nome completo do titular"
                        className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="supplier-contact-role" className="text-[11px] font-bold text-[#0b1c30]">
                        Cargo / Função
                      </label>
                      <input
                        id="supplier-contact-role"
                        type="text"
                        value={contactRole}
                        onChange={(e) => setContactRole(e.target.value)}
                        placeholder="Cargo (ex: Diretor de Contas)"
                        className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="supplier-contact-email" className="text-[11px] font-bold text-[#0b1c30]">
                        E-mail Corporativo *
                      </label>
                      <input
                        id="supplier-contact-email"
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contato@empresa.com.br"
                        className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="supplier-contact-phone" className="text-[11px] font-bold text-[#0b1c30]">
                        Telefone / WhatsApp
                      </label>
                      <input
                        id="supplier-contact-phone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+55 (11) 90000-0000"
                        className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-[12px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Tags de Atividades */}
                <div className="flex flex-col gap-1.5">
                  <span id="supplier-tags-label" className="text-[12px] font-bold text-[#0b1c30]">
                    Tags de Atividades *
                  </span>
                  <div
                    role="group"
                    aria-labelledby="supplier-tags-label"
                    className="flex flex-wrap gap-1.5"
                  >
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleTag(tag)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            isSelected
                              ? 'bg-[#0051d5] text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nível de Risco & Compliance */}
                <div className="flex flex-col gap-1.5">
                  <span id="supplier-risk-label" className="text-[12px] font-bold text-[#0b1c30]">
                    Nível de Risco & Compliance
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby="supplier-risk-label"
                    className="grid grid-cols-3 gap-2"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={riskLevel === 'baixo'}
                      onClick={() => setRiskLevel('baixo')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        riskLevel === 'baixo'
                          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] text-emerald-600">verified</span>
                      <span className="text-[11px] font-bold">Baixo Risco</span>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={riskLevel === 'medio'}
                      onClick={() => setRiskLevel('medio')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        riskLevel === 'medio'
                          ? 'border-amber-500 bg-amber-50/80 text-amber-900 ring-2 ring-amber-500/20'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] text-amber-600">warning</span>
                      <span className="text-[11px] font-bold">Médio Risco</span>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={riskLevel === 'alto'}
                      onClick={() => setRiskLevel('alto')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        riskLevel === 'alto'
                          ? 'border-red-500 bg-red-50/80 text-red-900 ring-2 ring-red-500/20'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] text-red-600">security_update_warning</span>
                      <span className="text-[11px] font-bold">Alto Risco</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer - Fixed Bottom with Solid Background */}
              <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-2 bg-white shrink-0 shadow-xs">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="h-10 px-4 rounded-xl text-gray-600 hover:bg-gray-100 text-[13px] font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-[13px] font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>Salvar Fornecedor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Supplier Deletion */}
      <ConfirmationModal
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={() => {
          if (!supplierToDelete) return;
          setIsDeletingSupplier(true);
          setTimeout(() => {
            if (onDeleteSupplier) {
              onDeleteSupplier(supplierToDelete.id);
            }
            showToast(`Fornecedor ${supplierToDelete.razaoSocial} excluído com sucesso.`);
            setIsDeletingSupplier(false);
            setSupplierToDelete(null);
          }, 300);
        }}
        isLoading={isDeletingSupplier}
        title="Excluir Fornecedor Cadastrado"
        message={
          <>
            Você tem certeza de que deseja remover o cadastro da empresa{' '}
            <strong className="text-slate-900 font-semibold">
              {supplierToDelete?.razaoSocial}
            </strong>
            ?
          </>
        }
        confirmText="Sim, Excluir Fornecedor"
        cancelText="Cancelar"
        variant="danger"
        icon="domain_disabled"
        destructiveNotice={
          (() => {
            if (!supplierToDelete) return undefined;
            const stats = getSupplierStats(supplierToDelete);
            return stats.count > 0
              ? `Alerta Crítico: Esta empresa possui ${stats.count} contrato(s) ativo(s) registrado(s) no sistema, somando volume de R$ ${stats.volume.toLocaleString('pt-BR')},00. A exclusão afetará a rastreabilidade e histórico dos contratos associados.`
              : 'Atenção: A exclusão removerá permanentemente os dados societários, contatos dos representantes e certidões fiscais deste fornecedor.';
          })()
        }
        itemDetails={
          supplierToDelete
            ? [
                { label: 'Razão Social', value: supplierToDelete.razaoSocial, highlighted: true },
                { label: 'CNPJ', value: supplierToDelete.cnpj, highlighted: true },
                { label: 'Nome Fantasia', value: supplierToDelete.nomeFantasia },
                {
                  label: 'Contratos Ativos',
                  value: `${getSupplierStats(supplierToDelete).count} instrumentos vinculados`,
                },
                {
                  label: 'Volume Financeiro Total',
                  value: `R$ ${getSupplierStats(supplierToDelete).volume.toLocaleString('pt-BR')},00`,
                },
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
