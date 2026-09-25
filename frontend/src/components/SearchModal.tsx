import React, { useEffect } from 'react';
import { Contract, Supplier } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  contracts: Contract[];
  suppliers: Supplier[];
  onSelectContract: (contract: Contract) => void;
  onSelectSupplier: (supplierId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchTerm,
  setSearchTerm,
  contracts,
  suppliers,
  onSelectContract,
  onSelectSupplier,
}) => {
  // Listen for Escape key on window to close search modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredContracts = contracts.filter((c) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.supplierName.toLowerCase().includes(q) ||
      c.supplierCnpj.includes(q)
    );
  }).slice(0, 5);

  const filteredSuppliers = suppliers.filter((s) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.razaoSocial.toLowerCase().includes(q) ||
      s.nomeFantasia.toLowerCase().includes(q) ||
      s.cnpj.includes(q)
    );
  }).slice(0, 4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Busca rápida de contratos e fornecedores"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-[#e5eeff] dark:border-slate-800 overflow-hidden animate-in zoom-in-95"
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800/80 flex items-center gap-3 bg-white dark:bg-[#0f172a]">
          <span className="material-symbols-outlined text-gray-400 dark:text-slate-400 text-[22px]">search</span>
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite para buscar contratos, CNPJ, fornecedor ou cláusula..."
            className="w-full text-[14px] text-[#0b1c30] dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none bg-transparent border-0"
          />
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-300 text-[11px] font-mono hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 cursor-pointer"
            title="Fechar busca (tecla ESC)"
            aria-label="Fechar busca (tecla ESC)"
          >
            ESC
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-4 flex flex-col gap-4 bg-white dark:bg-[#0f172a]">
          {/* Contratos Section */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-slate-400">
              Contratos Encontrados ({filteredContracts.length})
            </span>
            <div className="flex flex-col gap-1.5">
              {filteredContracts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectContract(c);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-[#eff4ff] dark:hover:bg-slate-800/90 transition-colors cursor-pointer flex items-center justify-between border border-transparent hover:border-[#dce9ff] dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#eff4ff] dark:bg-blue-950/70 text-[#0051d5] dark:text-blue-400 flex items-center justify-center shrink-0 border border-transparent dark:border-blue-800/40">
                      <span className="material-symbols-outlined text-[18px]">description</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-bold text-[#0b1c30] dark:text-slate-100 truncate">{c.title}</span>
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 font-mono">
                        {c.code} • {c.supplierName}
                      </span>
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-[#0b1c30] dark:text-slate-100 shrink-0">
                    R$ {c.totalValue.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
              {filteredContracts.length === 0 && (
                <div className="py-4 text-center text-[12px] text-gray-400 dark:text-slate-500">
                  Nenhum contrato encontrado para "{searchTerm}"
                </div>
              )}
            </div>
          </div>

          {/* Fornecedores Section */}
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-slate-400">
              Fornecedores ({filteredSuppliers.length})
            </span>
            <div className="flex flex-col gap-1.5">
              {filteredSuppliers.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSupplier(s.id);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-[#eff4ff] dark:hover:bg-slate-800/90 transition-colors cursor-pointer flex items-center justify-between border border-transparent hover:border-[#dce9ff] dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#eff4ff] dark:bg-blue-950/70 text-[#0051d5] dark:text-blue-400 flex items-center justify-center shrink-0 border border-transparent dark:border-blue-800/40">
                      <span className="material-symbols-outlined text-[18px]">domain</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-bold text-[#0b1c30] dark:text-slate-100 truncate">{s.razaoSocial}</span>
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 font-mono">CNPJ: {s.cnpj}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-300 text-[10px] font-semibold border border-transparent dark:border-emerald-800/40">
                    {s.status}
                  </span>
                </div>
              ))}
              {filteredSuppliers.length === 0 && (
                <div className="py-4 text-center text-[12px] text-gray-400 dark:text-slate-500">
                  Nenhum fornecedor encontrado para "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
          <span>Use as setas ou clique para selecionar</span>
          <span className="font-mono">Pressione ESC para fechar</span>
        </div>
      </div>
    </div>
  );
};
