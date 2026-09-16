import React, { useState, useEffect } from 'react';
import {
  Contract,
  ContractStatus,
  Supplier,
  UserRole,
  SystemSettings,
  NotificationItem,
  AuditLog,
  UserProfile,
} from './types';
import {
  initialContracts,
  initialSuppliers,
  initialSettings,
  initialNotifications,
  initialAuditLogs,
  initialUserProfile,
} from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ContractsListView } from './components/ContractsListView';
import { ContractDetailView } from './components/ContractDetailView';
import { SuppliersView } from './components/SuppliersView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';
import { SearchModal } from './components/SearchModal';
import { SimulatedAlertModal } from './components/SimulatedAlertModal';
<<<<<<< HEAD
=======
import { LoginView } from './components/LoginView';
>>>>>>> origin/master
import { simulateContractAlert, SimulatedAlertEmail } from './utils/alertSimulator';
import { useContractExpirationMonitor } from './hooks/useContractExpirationMonitor';
import { calculateDaysRemaining } from './utils/contractMonitor';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contratos' | 'fornecedores' | 'auditoria' | 'configuracoes' | 'perfil'>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('administrador');
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [auditFilterResource, setAuditFilterResource] = useState<string>('');

<<<<<<< HEAD
=======
  // Authentication gate: Required to access the application
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('maiscontratos_logged_in') === 'true';
    } catch {
      return false;
    }
  });

>>>>>>> origin/master
  // Enforce Light Mode strictly across the application
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try {
      localStorage.removeItem('maiscontratos_dark_mode');
      localStorage.removeItem('contractflow_dark_mode');
    } catch (e) {}
  }, []);

  // RBAC Access Guard: Automatically redirect if current role does not have access to the tab
  useEffect(() => {
    if (currentRole === 'visualizador' && (activeTab === 'auditoria' || activeTab === 'configuracoes')) {
      setActiveTab('dashboard');
    } else if (currentRole === 'editor' && activeTab === 'auditoria') {
      setActiveTab('dashboard');
    }
  }, [currentRole, activeTab]);

  // Proactive contract expiration monitoring hook (< 30 days)
  const { expiringContracts, monitorContract } = useContractExpirationMonitor({
    contracts,
    setNotifications,
    enabled: settings.notice30Days !== false,
    thresholdDays: 30,
    checkIntervalMs: 60000,
  });

  // Search & Modals
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewContractDrawerOpen, setIsNewContractDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Simulated Alert State
  const [currentSimulatedAlert, setCurrentSimulatedAlert] = useState<SimulatedAlertEmail | null>(null);
  const [isSimulatedAlertModalOpen, setIsSimulatedAlertModalOpen] = useState(false);

  // Cross-view filters
  const [contractSupplierFilter, setContractSupplierFilter] = useState('');
  const [supplierSearchFilter, setSupplierSearchFilter] = useState('');

  // Global keyboard shortcut (Ctrl+K or ⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddNewContract = (newContractData: Partial<Contract>) => {
    // Calculate accurate remaining days based on provided endDate or fallback
    let calculatedRemainingDays = newContractData.remainingDays ?? 365;
    if (newContractData.endDate) {
      const days = calculateDaysRemaining({
        endDate: newContractData.endDate,
        remainingDays: newContractData.remainingDays,
        status: newContractData.status,
      });
      if (days !== 999) {
        calculatedRemainingDays = days;
      }
    }

    const createdContract: Contract = {
      id: newContractData.id || `ctr-${Date.now()}`,
      code: newContractData.code || `CTR-2025-${Math.floor(100 + Math.random() * 900)}`,
      internalId: newContractData.internalId || `#${Math.floor(1000 + Math.random() * 9000)}-25`,
      title: newContractData.title || 'Novo Instrumento Contratual',
      supplierId: newContractData.supplierId || suppliers[0]?.id || 'sup-padrao',
      supplierName: newContractData.supplierName || suppliers[0]?.razaoSocial || 'Fornecedor em Homologação',
      supplierCnpj: newContractData.supplierCnpj || suppliers[0]?.cnpj || '00.000.000/0001-00',
      category: newContractData.category || 'Tecnologia / SaaS',
      startDate: newContractData.startDate || '2025-05-01',
      endDate: newContractData.endDate || '2026-05-01',
      totalDays: newContractData.totalDays || 365,
      remainingDays: calculatedRemainingDays,
      totalValue: newContractData.totalValue || 120000,
      monthlyValue: newContractData.monthlyValue,
      periodicity: newContractData.periodicity || 'mensal',
      status: newContractData.status || 'vigente',
      signatureStatus: newContractData.signatureStatus || 'Assinado Digitalmente',
      hasOcr: newContractData.hasOcr ?? true,
      progressPercent: newContractData.progressPercent || 2,
      isSigned: newContractData.isSigned ?? true,
      signers: newContractData.signers || [],
      attachments: newContractData.attachments || [],
      aiInsights: newContractData.aiInsights || {
        executiveSummary: 'Novo contrato em fase de homologação.',
        items: [],
      },
    };

    setContracts((prev) => [createdContract, ...prev]);

    // Immediately evaluate new contract for expiration threshold (< 30 days)
    monitorContract(createdContract);

    // Register immutable audit log for contract creation
    addAuditLog({
      action: 'CONTRATO_CRIADO',
      detail: `Novo contrato ${createdContract.code} ("${createdContract.title}") cadastrado com sucesso`,
      resource: createdContract.code,
      resourceType: 'contrato',
      resourceId: createdContract.id,
      type: 'add',
      severity: 'baixo',
      changes: [
        { field: 'code', label: 'Código', oldValue: '—', newValue: createdContract.code },
        { field: 'title', label: 'Título/Objeto', oldValue: '—', newValue: createdContract.title },
        { field: 'supplier', label: 'Fornecedor', oldValue: '—', newValue: createdContract.supplierName },
        { field: 'totalValue', label: 'Valor Global', oldValue: 'R$ 0,00', newValue: `R$ ${createdContract.totalValue.toLocaleString('pt-BR')},00` },
        { field: 'status', label: 'Status Inicial', oldValue: '—', newValue: createdContract.status },
      ],
    });
  };

  const addAuditLog = (newLog: Partial<AuditLog>) => {
    const userName =
      currentRole === 'administrador'
        ? userProfile?.name || 'Lucas Teles'
        : currentRole === 'editor'
        ? 'Dr. Felipe Prado'
        : 'Roberto Vianna';
    const userEmail =
      currentRole === 'administrador'
        ? userProfile?.email || 'lucas.teles@gruporiomais.com.br'
        : currentRole === 'editor'
        ? 'felipe.prado@juridico.com.br'
        : 'roberto.vianna@controladoria.com';
    const roleLabel =
      currentRole === 'administrador'
        ? 'Administrador'
        : currentRole === 'editor'
        ? 'Editor'
        : 'Visualizador';
    const now = new Date();
    const formattedTime = `Hoje, ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    const formattedDate = now.toISOString().split('T')[0];

    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: userName,
      userEmail: userEmail,
      role: roleLabel,
      action: newLog.action || 'OPERACAO_SISTEMA',
      detail: newLog.detail || 'Operação registrada na trilha imutável',
      resource: newLog.resource,
      resourceType: newLog.resourceType,
      resourceId: newLog.resourceId,
      ip: '189.40.112.44',
      location: 'São Paulo, SP',
      timestamp: formattedTime,
      date: formattedDate,
      type: newLog.type || 'contract',
      severity: newLog.severity || 'baixo',
      changes: newLog.changes,
      integrityHash: `SHA256-${Math.random().toString(36).substring(2, 9).toUpperCase()}${Date.now().toString(36).toUpperCase()}`,
      ...newLog,
    };

    setAuditLogs((prev) => [log, ...prev]);
  };

<<<<<<< HEAD
=======
  const handleLogin = (credentials: {
    email: string;
    password: string;
    role: UserRole;
    name: string;
  }) => {
    setCurrentRole(credentials.role);
    setUserProfile((prev) => ({
      ...prev,
      name: credentials.name || prev.name,
      email: credentials.email || prev.email,
      role: credentials.role,
    }));
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem('maiscontratos_logged_in', 'true');
      sessionStorage.setItem('maiscontratos_user_email', credentials.email);
      sessionStorage.setItem('maiscontratos_user_role', credentials.role);
      sessionStorage.setItem('maiscontratos_user_name', credentials.name);
    } catch {}

    addAuditLog({
      action: 'LOGIN_REALIZADO',
      detail: `Sessão corporativa autenticada com sucesso para ${credentials.name} (${credentials.email})`,
      resource: credentials.email,
      resourceType: 'sistema',
      type: 'security',
      severity: 'baixo',
    });
  };

  const handleLogout = () => {
    addAuditLog({
      action: 'LOGOUT_REALIZADO',
      detail: `Sessão encerrada com segurança pelo usuário ${userProfile.name} (${userProfile.email})`,
      resource: userProfile.email,
      resourceType: 'sistema',
      type: 'security',
      severity: 'baixo',
    });

    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('maiscontratos_logged_in');
      sessionStorage.removeItem('maiscontratos_user_email');
      sessionStorage.removeItem('maiscontratos_user_role');
      sessionStorage.removeItem('maiscontratos_user_name');
    } catch {}
  };

>>>>>>> origin/master
  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers((prev) => [newSupplier, ...prev]);

    // Register immutable audit log for supplier registration
    addAuditLog({
      action: 'FORNECEDOR_CADASTRADO',
      detail: `Cadastro societário do fornecedor ${newSupplier.razaoSocial} (CNPJ ${newSupplier.cnpj}) homologado`,
      resource: newSupplier.razaoSocial,
      resourceType: 'fornecedor',
      resourceId: newSupplier.id,
      type: 'add',
      severity: 'baixo',
      changes: [
        { field: 'cnpj', label: 'CNPJ', oldValue: '—', newValue: newSupplier.cnpj },
        { field: 'razaoSocial', label: 'Razão Social', oldValue: '—', newValue: newSupplier.razaoSocial },
        { field: 'nomeFantasia', label: 'Nome Fantasia', oldValue: '—', newValue: newSupplier.nomeFantasia },
        { field: 'status', label: 'Status', oldValue: '—', newValue: newSupplier.status },
      ],
    });
  };

  const handleDeleteContract = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    setContracts((prev) => prev.filter((c) => c.id !== contractId));
    if (selectedContract?.id === contractId) {
      setSelectedContract(null);
    }

    if (contract) {
      addAuditLog({
        action: 'CONTRATO_EXCLUIDO',
        detail: `Contrato ${contract.code} ("${contract.title}") excluído após confirmação em modal de segurança`,
        resource: contract.code,
        resourceType: 'contrato',
        resourceId: contract.id,
        type: 'delete',
        severity: 'alto',
        changes: [
          { field: 'status', label: 'Status do Instrumento', oldValue: contract.status, newValue: 'EXCLUÍDO' },
          { field: 'totalValue', label: 'Valor Removido', oldValue: `R$ ${contract.totalValue.toLocaleString('pt-BR')},00`, newValue: 'R$ 0,00' },
        ],
      });
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));

    if (supplier) {
      addAuditLog({
        action: 'FORNECEDOR_EXCLUIDO',
        detail: `Fornecedor ${supplier.razaoSocial} (CNPJ ${supplier.cnpj}) foi excluído da base ativa`,
        resource: supplier.razaoSocial,
        resourceType: 'fornecedor',
        resourceId: supplier.id,
        type: 'delete',
        severity: 'alto',
        changes: [
          { field: 'status', label: 'Status Cadastral', oldValue: supplier.status, newValue: 'EXCLUÍDO' },
        ],
      });
    }
  };

  const handleSelectSupplierContracts = (supplierId: string) => {
    setContractSupplierFilter(supplierId);
    setSelectedContract(null);
    setActiveTab('contratos');
  };

  const handleSelectSupplier = (supplierIdOrName: string) => {
    setSelectedContract(null);
    const found = suppliers.find(
      (s) =>
        s.id === supplierIdOrName ||
        s.razaoSocial.toLowerCase() === supplierIdOrName.toLowerCase() ||
        s.cnpj === supplierIdOrName
    );
    setSupplierSearchFilter(found ? found.razaoSocial : supplierIdOrName);
    setActiveTab('fornecedores');
  };

  /**
   * Updates an existing contract's properties (such as notificationEmail, status, notes)
   */
  const handleUpdateContract = (updatedContract: Contract) => {
    const oldContract = contracts.find((c) => c.id === updatedContract.id);
    setContracts((prev) =>
      prev.map((c) => (c.id === updatedContract.id ? updatedContract : c))
    );
    if (selectedContract?.id === updatedContract.id) {
      setSelectedContract(updatedContract);
    }

    if (oldContract) {
      const changes: { field: string; label: string; oldValue: string; newValue: string }[] = [];
      if (oldContract.notificationEmail !== updatedContract.notificationEmail) {
        changes.push({
          field: 'notificationEmail',
          label: 'E-mail de Notificação',
          oldValue: oldContract.notificationEmail || 'Não configurado',
          newValue: updatedContract.notificationEmail || 'Não configurado',
        });
      }
      if (oldContract.status !== updatedContract.status) {
        changes.push({
          field: 'status',
          label: 'Status Operacional',
          oldValue: oldContract.status,
          newValue: updatedContract.status,
        });
      }

      if (changes.length > 0) {
        addAuditLog({
          action: 'CONFIGURACAO_CONTRATO_ATUALIZADA',
          detail: `Configurações do contrato ${updatedContract.code} atualizadas (E-mail: ${updatedContract.notificationEmail || 'padrão'})`,
          resource: updatedContract.code,
          resourceType: 'contrato',
          resourceId: updatedContract.id,
          type: 'update',
          severity: 'baixo',
          changes,
        });
      }
    }
  };

  /**
   * Simulates triggering an alert when a contract expires or changes status.
   */
  const handleSimulateAlert = (
    contract: Contract,
    triggerType: 'vencimento' | 'mudanca_status',
    options?: { newStatus?: ContractStatus; daysRemaining?: number; customEmail?: string }
  ) => {
    const result = simulateContractAlert(contract, triggerType, options);

    // 1. If status change was simulated and newStatus is present, update contract state
    if (triggerType === 'mudanca_status' && options?.newStatus && options.newStatus !== contract.status) {
      const updatedContract: Contract = {
        ...contract,
        status: options.newStatus,
        notificationEmail: options.customEmail || contract.notificationEmail,
      };
      setContracts((prev) =>
        prev.map((c) => (c.id === contract.id ? updatedContract : c))
      );
      if (selectedContract?.id === contract.id) {
        setSelectedContract(updatedContract);
      }
    } else if (options?.customEmail && options.customEmail !== contract.notificationEmail) {
      const updatedContract: Contract = {
        ...contract,
        notificationEmail: options.customEmail,
      };
      setContracts((prev) =>
        prev.map((c) => (c.id === contract.id ? updatedContract : c))
      );
      if (selectedContract?.id === contract.id) {
        setSelectedContract(updatedContract);
      }
    }

    // 2. Add to notification center
    setNotifications((prev) => [result.notification, ...prev]);

    // 3. Register in audit log
    if (result.auditLog.action) {
      addAuditLog({
        action: result.auditLog.action,
        detail: result.auditLog.detail || 'Disparo de alerta simulado',
        resource: result.auditLog.resource || contract.code,
        resourceType: 'contrato',
        resourceId: contract.id,
        type: result.auditLog.type || 'warning',
        severity: result.auditLog.severity || 'medio',
        changes: result.auditLog.changes || [],
      });
    }

    // 4. Open the simulated email preview modal
    setCurrentSimulatedAlert(result.simulatedEmail);
    setIsSimulatedAlertModalOpen(true);
  };

<<<<<<< HEAD
=======
  // Enforce login screen: User MUST be authenticated to access the CLM platform
  if (!isAuthenticated) {
    return (
      <LoginView
        onLogin={handleLogin}
        defaultEmail={userProfile?.email}
      />
    );
  }

>>>>>>> origin/master
  return (
    <div className="flex h-screen w-full bg-[#f7f9fd] text-[#0b1c30] font-sans overflow-hidden antialiased select-none selection:bg-[#0051d5] selection:text-white">
      {/* In-Flow Enterprise Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedContract(null);
          if (tab !== 'auditoria') {
            setAuditFilterResource('');
          }
          setActiveTab(tab);
        }}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
<<<<<<< HEAD
=======
        onLogout={handleLogout}
>>>>>>> origin/master
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Enterprise Top Header */}
        <Header
          currentRole={currentRole}
          userProfile={userProfile}
<<<<<<< HEAD
=======
          onLogout={handleLogout}
>>>>>>> origin/master
          onOpenProfile={() => {
            setSelectedContract(null);
            setActiveTab('perfil');
          }}
          breadcrumb={{
            section: 'Workspace',
            page:
              activeTab === 'dashboard'
                ? 'Dashboard Executivo'
                : activeTab === 'contratos'
                ? 'Gestão de Contratos'
                : activeTab === 'fornecedores'
                ? 'Diretório de Fornecedores'
                : activeTab === 'auditoria'
                ? 'Trilha de Auditoria & Logs'
                : activeTab === 'configuracoes'
                ? 'Configurações do Sistema'
                : 'Meu Perfil & Credenciais',
          }}
          notifications={notifications}
          onMarkNotificationsRead={() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          }}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onOpenNewContract={() => {
            setActiveTab('contratos');
            setIsNewContractDrawerOpen(true);
          }}
          onSelectNotificationContract={(contractId) => {
            const found = contracts.find((c) => c.id === contractId || c.code === contractId);
            if (found) {
              setSelectedContract(found);
            }
          }}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
          {selectedContract ? (
            <ContractDetailView
              contract={selectedContract}
              onBack={() => setSelectedContract(null)}
              onDeleteContract={handleDeleteContract}
              onUpdateContract={handleUpdateContract}
              onSimulateAlert={handleSimulateAlert}
              onViewAuditTrail={(contractCode) => {
                setSelectedContract(null);
                setAuditFilterResource(contractCode);
                setActiveTab('auditoria');
              }}
              currentRole={currentRole}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  contracts={contracts}
                  suppliers={suppliers}
                  auditLogs={auditLogs}
                  userProfile={userProfile}
                  currentRole={currentRole}
                  setCurrentRole={setCurrentRole}
                  onSelectContract={(contract) => setSelectedContract(contract)}
                  onNavigateContract={(code) => {
                    const found = contracts.find((c) => c.code === code || c.id === code);
                    if (found) {
                      setSelectedContract(found);
                    } else {
                      setActiveTab('contratos');
                    }
                  }}
                  onViewAllContracts={() => setActiveTab('contratos')}
                  onOpenNewContract={() => {
                    setActiveTab('contratos');
                    setIsNewContractDrawerOpen(true);
                  }}
                  onNavigateSettings={() => setActiveTab('configuracoes')}
                />
              )}

              {activeTab === 'contratos' && (
                <ContractsListView
                  contracts={contracts}
                  suppliers={suppliers}
                  onSelectContract={(contract) => setSelectedContract(contract)}
                  onAddNewContract={handleAddNewContract}
                  onDeleteContract={handleDeleteContract}
                  isDrawerOpen={isNewContractDrawerOpen}
                  setIsDrawerOpen={setIsNewContractDrawerOpen}
                  currentRole={currentRole}
                  initialSupplierFilter={contractSupplierFilter}
                  onClearInitialSupplierFilter={() => setContractSupplierFilter('')}
                />
              )}

              {activeTab === 'fornecedores' && (
                <SuppliersView
                  suppliers={suppliers}
                  contracts={contracts}
                  onAddSupplier={handleAddSupplier}
                  onDeleteSupplier={handleDeleteSupplier}
                  onSelectSupplierContracts={handleSelectSupplierContracts}
                  currentRole={currentRole}
                  initialSearchTerm={supplierSearchFilter}
                  onClearInitialSearchTerm={() => setSupplierSearchFilter('')}
                />
              )}

              {activeTab === 'auditoria' && (
                <AuditLogView
                  logs={auditLogs}
                  onSelectContract={(contractCode) => {
                    const found = contracts.find((c) => c.code === contractCode || c.id === contractCode);
                    if (found) {
                      setSelectedContract(found);
                    } else {
                      setActiveTab('contratos');
                    }
                  }}
                  onSelectSupplier={(supplierId) => {
                    handleSelectSupplier(supplierId);
                  }}
                  currentRole={currentRole}
                  initialFilterResource={auditFilterResource}
                />
              )}

              {activeTab === 'configuracoes' && (
                <SettingsView
                  settings={settings}
                  onUpdateSettings={setSettings}
                  notifications={notifications}
                  onNavigateToAudit={() => setActiveTab('auditoria')}
                  currentRole={currentRole}
                  onRoleChange={setCurrentRole}
                  onNavigateDashboard={() => setActiveTab('dashboard')}
                  auditLogs={auditLogs}
                  onAddAuditLog={addAuditLog}
                />
              )}

              {activeTab === 'perfil' && (
                <ProfileView
                  userProfile={userProfile}
                  onUpdateProfile={setUserProfile}
                  currentRole={currentRole}
                  contracts={contracts}
                  onAddAuditLog={addAuditLog}
                  onSimulateAlert={handleSimulateAlert}
                  onNavigateTab={(tab) => {
                    setSelectedContract(null);
                    if (
                      tab === 'dashboard' ||
                      tab === 'contratos' ||
                      tab === 'fornecedores' ||
                      tab === 'auditoria' ||
                      tab === 'configuracoes' ||
                      tab === 'perfil'
                    ) {
                      setActiveTab(tab);
                    }
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Quick Global Search Modal (⌘K) */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        contracts={contracts}
        suppliers={suppliers}
        onSelectContract={(contract) => setSelectedContract(contract)}
        onSelectSupplier={(supplierId) => {
          handleSelectSupplier(supplierId);
        }}
      />

      {/* Simulated Transactional Email Alert Modal */}
      <SimulatedAlertModal
        isOpen={isSimulatedAlertModalOpen}
        onClose={() => setIsSimulatedAlertModalOpen(false)}
        alertEmail={currentSimulatedAlert}
        onSendAnother={() => {
          const target = selectedContract || contracts[0];
          if (target) {
            handleSimulateAlert(
              target,
              currentSimulatedAlert?.triggerType === 'vencimento' ? 'mudanca_status' : 'vencimento',
              {
                newStatus: target.status === 'expirado' ? 'vigente' : 'expirado',
                daysRemaining: 7,
              }
            );
          }
        }}
      />
    </div>
  );
}
