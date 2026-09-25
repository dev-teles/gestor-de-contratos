import React, { useState, useEffect } from 'react';
import {
  SystemSettings,
  NotificationItem,
  AuditLog,
  UserAccountItem,
  ApiKeyItem,
  WebhookItem,
  IntegrationConnector,
  UserRole,
  GranularPermission,
  PermissionAccessLevel,
} from '../types';
import {
  initialUsers,
  initialApiKeys,
  initialWebhooks,
  initialIntegrations,
  initialAuditLogs,
  initialGranularPermissions,
} from '../data/initialData';
import { integrationsManager } from '../integrations';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  notifications: NotificationItem[];
  onNavigateToAudit?: () => void;
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onNavigateDashboard?: () => void;
  auditLogs?: AuditLog[];
  onAddAuditLog?: (log: Partial<AuditLog>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  notifications,
  onNavigateToAudit,
  currentRole = 'administrador',
  onRoleChange,
  onNavigateDashboard,
  auditLogs: auditLogsProp,
  onAddAuditLog,
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'notificacoes' | 'perfis' | 'integracoes' | 'seguranca'>(
    currentRole === 'administrador' ? 'perfis' : 'geral'
  );

  // Keep activeTab aligned with role permissions
  useEffect(() => {
    if (currentRole !== 'administrador' && (activeTab === 'perfis' || activeTab === 'integracoes' || activeTab === 'seguranca')) {
      setActiveTab('geral');
    }
  }, [currentRole, activeTab]);

  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States for Granular Permissions & RBAC
  const [granularPermissions, setGranularPermissions] = useState<GranularPermission[]>(
    formData.granularPermissions && formData.granularPermissions.length > 0
      ? formData.granularPermissions
      : initialGranularPermissions
  );
  const [rbacSubTab, setRbacSubTab] = useState<'matriz' | 'usuarios' | 'simulador'>('matriz');
  const [permCategoryFilter, setPermCategoryFilter] = useState<
    'todas' | 'contratos' | 'fornecedores' | 'assinaturas' | 'ia_juridica' | 'governanca'
  >('todas');
  const [isMatrixExportModalOpen, setIsMatrixExportModalOpen] = useState(false);
  const [simulatorRole, setSimulatorRole] = useState<UserRole>('visualizador');
  const [simulatorActionId, setSimulatorActionId] = useState<string>('perm-contracts-create');

  // States for Users (Perfis & Permissões)
  const [users, setUsers] = useState<UserAccountItem[]>(initialUsers);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'todos' | UserRole>('todos');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDept, setNewUserDept] = useState('Jurídico Corporativo');
  const [newUserRole, setNewUserRole] = useState<UserRole>('editor');

  // States for Integrations & API
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(initialApiKeys);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(initialWebhooks);
  const [integrations, setIntegrations] = useState<IntegrationConnector[]>(initialIntegrations);
  const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState<'producao' | 'sandbox'>('producao');
  const [newKeyScope, setNewKeyScope] = useState<'Leitura & Escrita' | 'Somente Consulta' | 'Assinaturas Digitais'>('Leitura & Escrita');
  const [isNewWebhookModalOpen, setIsNewWebhookModalOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedWebhookEvents, setSelectedWebhookEvents] = useState<string[]>(['contract.signed', 'contract.activated']);
  const [syncingIntegrationId, setSyncingIntegrationId] = useState<string | null>(null);
  const [testingIntegrationId, setTestingIntegrationId] = useState<string | null>(null);

  // States for Security & Audit
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(auditLogsProp || initialAuditLogs);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditFilterType, setAuditFilterType] = useState<string>('todos');

  // Sincroniza logs corporativos quando o estado global do App for atualizado
  useEffect(() => {
    if (auditLogsProp) {
      setAuditLogs(auditLogsProp);
    }
  }, [auditLogsProp]);

  // Registra o evento de auditoria tanto no estado visual local quanto na governança global imutável
  const logAuditEvent = (newAuditLog: AuditLog) => {
    setAuditLogs((logs) => [newAuditLog, ...logs]);
    if (onAddAuditLog) {
      onAddAuditLog(newAuditLog);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggle = (key: keyof Pick<SystemSettings, 'notice30Days' | 'notice60Days' | 'signaturePending7Days' | 'aiRiskInstantAlert' | 'twoFactorRequired' | 'ssoEnabled' | 'ipWhitelistEnabled'>) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    showToast('Preferências e configurações corporativas salvas com sucesso!');
  };

  // Granular RBAC Handlers
  const handleToggleGranular = (permId: string, role: 'administrador' | 'editor' | 'visualizador') => {
    setGranularPermissions((prev) =>
      prev.map((perm) => {
        if (perm.id === permId) {
          const currentLevel = perm[role];
          let nextLevel: PermissionAccessLevel = 'total';
          if (currentLevel === 'total') nextLevel = 'leitura';
          else if (currentLevel === 'leitura') nextLevel = 'bloqueado';
          else nextLevel = 'total';

          const roleNameLabel =
            role === 'administrador' ? 'ADMINISTRADOR' : role === 'editor' ? 'EDITOR' : 'VISUALIZADOR';

          // Add to audit logs
          const newAuditLog: AuditLog = {
            id: `audit-${Date.now()}`,
            user: 'Lucas Teles',
            userEmail: 'lucas.teles@gruporiomais.com.br',
            role: 'Administrador Geral',
            action: 'RBAC_PERMISSAO_ALTERADA',
            detail: `Nível do papel ${roleNameLabel} na regra "${perm.name}" alterado de ${currentLevel.toUpperCase()} para ${nextLevel.toUpperCase()}`,
            resource: `RBAC / ${perm.category}`,
            ip: '189.40.72.112',
            location: 'São Paulo, Brasil',
            timestamp: 'Agora mesmo',
            type: 'permission',
            severity: nextLevel === 'bloqueado' ? 'medio' : 'baixo',
          };
          logAuditEvent(newAuditLog);

          showToast(`Permissão "${perm.name}" para ${roleNameLabel}: ${nextLevel.toUpperCase()}`);
          return {
            ...perm,
            [role]: nextLevel,
          };
        }
        return perm;
      })
    );
  };

  const handleSaveGranularPermissions = () => {
    const updatedSettings: SystemSettings = {
      ...formData,
      granularPermissions,
    };
    setFormData(updatedSettings);
    onUpdateSettings(updatedSettings);

    const newAuditLog: AuditLog = {
      id: `audit-${Date.now()}`,
      user: 'Lucas Teles',
      userEmail: 'lucas.teles@gruporiomais.com.br',
      role: 'Administrador Geral',
      action: 'RBAC_MATRIZ_SALVA',
      detail: `Matriz de permissões granulares salva e sincronizada para 3 papéis (${granularPermissions.length} regras)`,
      resource: 'Políticas de Acesso Corporativas',
      ip: '189.40.72.112',
      location: 'São Paulo, Brasil',
      timestamp: 'Agora mesmo',
      type: 'security',
      severity: 'medio',
    };
    logAuditEvent(newAuditLog);
    showToast('Matriz de acessos granulares salva com sucesso na governança corporativa!');
  };

  const handleResetGranularPermissions = () => {
    setGranularPermissions(initialGranularPermissions);
    const newAuditLog: AuditLog = {
      id: `audit-${Date.now()}`,
      user: 'Lucas Teles',
      userEmail: 'lucas.teles@gruporiomais.com.br',
      role: 'Administrador Geral',
      action: 'RBAC_PADROES_RESTAURADOS',
      detail: 'Permissões granulares redefinidas para a matriz recomendada de mercado',
      resource: 'Políticas de Acesso Corporativas',
      ip: '189.40.72.112',
      location: 'São Paulo, Brasil',
      timestamp: 'Agora mesmo',
      type: 'warning',
      severity: 'alto',
    };
    logAuditEvent(newAuditLog);
    showToast('Permissões restauradas para o baseline padrão corporativo.');
  };

  const safeCopy = (text: string, label: string) => {
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

  const handleCopyMatrixJson = () => {
    const jsonStr = JSON.stringify(granularPermissions, null, 2);
    safeCopy(jsonStr, 'Matriz de permissões copiada em formato JSON para a área de transferência!');
  };

  // User Actions
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Preencha o nome e e-mail do usuário.');
      return;
    }
    const newUser: UserAccountItem = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      department: newUserDept,
      role: newUserRole,
      status: 'ativo',
      twoFactorEnabled: false,
      lastLogin: 'Primeiro acesso pendente',
    };
    setUsers((prev) => [newUser, ...prev]);
    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');

    const newAuditLog: AuditLog = {
      id: `audit-${Date.now()}`,
      user: 'Lucas Teles',
      userEmail: 'lucas.teles@gruporiomais.com.br',
      role: 'Administrador Geral',
      action: 'USUARIO_CONVIDADO',
      detail: `Novo colaborador ${newUser.name} cadastrado com perfil ${newUser.role.toUpperCase()}`,
      resource: `Usuário ${newUser.email}`,
      ip: '189.40.72.112',
      location: 'São Paulo, Brasil',
      timestamp: 'Agora mesmo',
      type: 'security',
      severity: 'medio',
    };
    logAuditEvent(newAuditLog);
    showToast(`Usuário ${newUser.name} convidado com perfil ${newUser.role.toUpperCase()}!`);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'ativo' ? 'bloqueado' : 'ativo';
          showToast(`Usuário ${u.name} agora está ${nextStatus === 'ativo' ? 'Ativo' : 'Bloqueado'}.`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleChangeUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const prevRole = u.role;
          const updatedUser = { ...u, role: newRole };
          const newAuditLog: AuditLog = {
            id: `audit-${Date.now()}`,
            user: 'Lucas Teles',
            userEmail: 'lucas.teles@gruporiomais.com.br',
            role: 'Administrador Geral',
            action: 'PAPEL_USUARIO_ATUALIZADO',
            detail: `Papel do colaborador ${u.name} alterado de ${prevRole.toUpperCase()} para ${newRole.toUpperCase()}`,
            resource: `Usuário ${u.email}`,
            ip: '189.40.72.112',
            location: 'São Paulo, Brasil',
            timestamp: 'Agora mesmo',
            type: 'security',
            severity: newRole === 'administrador' ? 'alto' : 'baixo',
          };
          logAuditEvent(newAuditLog);
          return updatedUser;
        }
        return u;
      })
    );
    showToast(`Papel funcional alterado com sucesso para ${newRole.toUpperCase()}.`);
  };

  // API Key Actions
  const handleGenerateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      showToast('Defina uma identificação para a chave de API.');
      return;
    }
    const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const prefix = newKeyEnv === 'producao' ? `cf_live_${randomHex.substring(0, 6)}...` : `cf_test_${randomHex.substring(0, 6)}...`;
    const fullKey = newKeyEnv === 'producao' ? `cf_live_${randomHex}` : `cf_test_${randomHex}`;

    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      keyPrefix: prefix,
      keyFull: fullKey,
      environment: newKeyEnv,
      scope: newKeyScope,
      createdAt: 'Hoje',
      lastUsedAt: 'Ainda não utilizada',
      status: 'ativo',
    };

    setApiKeys((prev) => [newKey, ...prev]);
    setIsNewKeyModalOpen(false);
    setNewKeyName('');
    showToast('Nova chave de API gerada com sucesso! Guarde-a com segurança.');
  };

  const handleRevokeApiKey = (keyId: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, status: 'revogado' } : k))
    );
    showToast('Chave de API revogada e invalidada imediatamente.');
  };

  const copyToClipboard = (text: string, label: string) => {
    safeCopy(text, `${label} copiado para a área de transferência!`);
  };

  // Webhook Actions
  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) {
      showToast('Informe a URL de destino para o webhook.');
      return;
    }
    const newWh: WebhookItem = {
      id: `wh-${Date.now()}`,
      url: newWebhookUrl.trim(),
      events: selectedWebhookEvents,
      status: 'ativo',
      lastDeliveryStatus: 'Pendente',
      lastDeliveryAt: 'Sem envios',
    };
    setWebhooks((prev) => [newWh, ...prev]);
    setIsNewWebhookModalOpen(false);
    setNewWebhookUrl('');
    showToast('Webhook cadastrado com sucesso!');
  };

  const handleTestWebhook = (wh: WebhookItem) => {
    showToast(`Ping de teste disparado para ${wh.url} (Resposta: 200 OK em 182ms)!`);
  };

  // Integration Actions
  const handleToggleIntegration = (intId: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === intId) {
          const next = !item.connected;
          showToast(`Conector ${item.name} ${next ? 'ativado' : 'pausado'}.`);
          return {
            ...item,
            connected: next,
            statusText: next ? 'Conexão ativa' : 'Pausado pelo administrador',
          };
        }
        return item;
      })
    );
  };

  const handleTestIntegration = async (intId: string, name: string) => {
    setTestingIntegrationId(intId);
    try {
      const result = await integrationsManager.testConnection(intId);
      if (result.success) {
        setIntegrations((prev) =>
          prev.map((item) =>
            item.id === intId
              ? { ...item, statusText: `Online (${result.latencyMs}ms)`, latencyMs: result.latencyMs }
              : item
          )
        );
        showToast(`[${name}] ${result.message} (Latência: ${result.latencyMs}ms)`);
      } else {
        showToast(`[${name}] Falha no teste: ${result.message}`);
      }
    } catch (err: unknown) {
      showToast(`Erro ao testar ${name}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTestingIntegrationId(null);
    }
  };

  const handleSyncIntegration = async (intId: string, name: string) => {
    setSyncingIntegrationId(intId);
    try {
      const result = await integrationsManager.sync(intId);
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === intId
            ? { ...item, lastSync: 'Agora', statusText: 'Sincronizado com sucesso' }
            : item
        )
      );
      showToast(`[${name}] ${result.message} (${result.syncedRecords} registros)`);
    } catch (err: unknown) {
      showToast(`Erro na sincronização de ${name}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSyncingIntegrationId(null);
    }
  };

  // Export Audit CSV
  const handleExportAuditCsv = () => {
    const headers = 'ID;Data/Hora;Usuário;Email;Papel;Ação;Recurso;IP;Localização;Severidade\n';
    const rows = auditLogs
      .map(
        (l) =>
          `"${l.id}";"${l.timestamp}";"${l.user}";"${l.userEmail || ''}";"${l.role || ''}";"${l.action}";"${l.resource || ''}";"${l.ip || ''}";"${l.location || ''}";"${l.severity || 'baixo'}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trilha-auditoria-clm-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório de auditoria exportado em formato CSV!');
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'todos' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
      (log.resource && log.resource.toLowerCase().includes(auditSearchTerm.toLowerCase())) ||
      (log.ip && log.ip.toLowerCase().includes(auditSearchTerm.toLowerCase()));

    if (auditFilterType === 'todos') return matchesSearch;
    if (auditFilterType === 'seguranca') return matchesSearch && (log.type === 'security' || log.type === 'permission');
    if (auditFilterType === 'contratos') return matchesSearch && log.type === 'contract';
    if (auditFilterType === 'avisos') return matchesSearch && log.type === 'warning';
    return matchesSearch;
  });

  // RBAC Access Control Guard: Viewer has NO settings access
  if (currentRole === 'visualizador') {
    return null;
  }

  return (
    <div className="flex flex-col w-full">
      <div className="p-6 flex flex-col gap-6 w-full max-w-[1600px] mx-auto animate-in fade-in duration-300">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-[26px] font-bold text-[#0b1c30] tracking-tight leading-none">
                Configurações do Sistema
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] text-[11px] font-bold border border-[#dce9ff]">
                Governança & Alertas
              </span>
            </div>
            <p className="text-[13px] text-[#45464d] mt-1">
              Governança corporativa, automações de vencimento, matriz de perfis RBAC, conectores de API e trilha de auditoria
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData(settings);
                showToast('Alterações descartadas.');
              }}
              className="h-9 px-3.5 rounded-xl bg-white border border-[#e5eeff] text-[#45464d] hover:text-[#0b1c30] hover:bg-[#eff4ff] text-[13px] font-semibold transition-colors"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-9 px-4 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-[13px] font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>Salvar Preferências</span>
            </button>
          </div>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`px-4 py-2.5 text-[13px] font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'geral'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Geral</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notificacoes')}
            className={`px-4 py-2.5 text-[13px] font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'notificacoes'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            <span>Notificações & Alertas</span>
          </button>

          {currentRole === 'administrador' && (
            <button
              type="button"
              onClick={() => setActiveTab('perfis')}
              className={`px-4 py-2.5 text-[13px] font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'perfis'
                  ? 'border-[#0051d5] text-[#0051d5]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
              <span>Perfis & Permissões (RBAC)</span>
            </button>
          )}

          {currentRole === 'administrador' && (
            <button
              type="button"
              onClick={() => setActiveTab('integracoes')}
              className={`px-4 py-2.5 text-[13px] font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'integracoes'
                  ? 'border-[#0051d5] text-[#0051d5]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">integration_instructions</span>
              <span>Integrações & API</span>
            </button>
          )}

          {currentRole === 'administrador' && (
            <button
              type="button"
              onClick={() => setActiveTab('seguranca')}
              className={`px-4 py-2.5 text-[13px] font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'seguranca'
                  ? 'border-[#0051d5] text-[#0051d5]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Segurança & Auditoria</span>
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: GERAL                                            */}
        {/* ======================================================== */}
        {activeTab === 'geral' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Theme & Visual Standards Card (Light Theme Standard) */}
              <div
                id="card-visual-settings"
                className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#0051d5]/10 text-[#0051d5]">
                      <span className="material-symbols-outlined text-[24px]">
                        light_mode
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[16px] font-bold text-[#0b1c30]">
                          Aparência & Identidade Visual
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
                          Tema Claro Corporativo
                        </span>
                      </div>
                      <span className="text-[12px] text-[#45464d]">
                        Padrão visual corporativo unificado com alto contraste e legibilidade para análise de minutas e relatórios.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#e5eeff] bg-[#f8f9ff] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-[#0051d5]">check_circle</span>
                    <div>
                      <p className="text-[13px] font-bold text-[#0b1c30]">
                        Tema Claro Corporativo Padronizado
                      </p>
                      <p className="text-[11px] text-[#45464d]">
                        Configuração de contraste calibrada para visualização precisa de contratos, termos e auditorias.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-[#dce9ff] text-[12px] font-semibold text-[#0051d5]">
                    Ativo
                  </span>
                </div>
              </div>

              {/* Organization Data Card */}
              <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">business</span>
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#0b1c30]">
                      Identificação da Empresa Contratante
                    </h2>
                    <span className="text-[12px] text-[#45464d]">
                      Dados cadastrais corporativos utilizados em cabeçalhos de minutas e relatórios oficiais.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-600">Razão Social</label>
                    <input
                      type="text"
                      value={formData.companyName || ''}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-600">CNPJ Institucional</label>
                    <input
                      type="text"
                      value={formData.companyCnpj || ''}
                      onChange={(e) => setFormData({ ...formData, companyCnpj: e.target.value })}
                      className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-600">Moeda Padrão de Contabilização</label>
                    <select
                      value={formData.currency || 'BRL (R$)'}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] focus:bg-white focus:outline-none"
                    >
                      <option value="BRL (R$)">BRL (R$) - Real Brasileiro</option>
                      <option value="USD ($)">USD ($) - Dólar Americano</option>
                      <option value="EUR (€)">EUR (€) - Euro</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-600">Fuso Horário Oficial</label>
                    <select
                      value={formData.timezone || 'América/São Paulo (GMT-3)'}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] focus:bg-white focus:outline-none"
                    >
                      <option value="América/São Paulo (GMT-3)">América/São Paulo (GMT-3) - Brasília</option>
                      <option value="América/Manaus (GMT-4)">América/Manaus (GMT-4)</option>
                      <option value="UTC (GMT+0)">UTC (GMT+0)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Numbering and Prefix */}
              <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">tag</span>
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#0b1c30]">
                      Padronização de Numeração Contratual
                    </h2>
                    <span className="text-[12px] text-[#45464d]">
                      Geração de códigos únicos com indexação automática para novos instrumentos e aditivos.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-600">Prefixo de Contratos Vigentes</label>
                    <input
                      type="text"
                      value={formData.contractPrefix || 'CTR-2025-'}
                      onChange={(e) => setFormData({ ...formData, contractPrefix: e.target.value })}
                      className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] font-mono focus:bg-white focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-400">Exemplo gerado: {formData.contractPrefix || 'CTR-2025-'}089</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-gray-600">Formato de Termos Aditivos</label>
                    <input
                      type="text"
                      defaultValue="AD-01, AD-02 (Sequencial Sufixo)"
                      disabled
                      className="h-9 px-3 rounded-xl bg-gray-100 border border-gray-200 text-[13px] text-gray-500 font-mono cursor-not-allowed"
                    />
                    <span className="text-[10px] text-gray-400">Vinculado automaticamente ao contrato pai</span>
                  </div>
                </div>
              </div>
            </div>

            {/* General Info Right Column */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-3">
                <span className="text-[14px] font-bold text-[#0b1c30] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0051d5] text-[20px]">verified</span>
                  Status da Instância Corporativa
                </span>
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 text-[12px]">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Esquema de Cores</span>
                    <span className="font-bold flex items-center gap-1 text-[#0b1c30]">
                      <span className={`material-symbols-outlined text-[16px] ${formData.darkMode ? 'text-blue-400' : 'text-amber-500'}`}>
                        {formData.darkMode ? 'dark_mode' : 'light_mode'}
                      </span>
                      {formData.darkMode ? 'Escuro (Ativo)' : 'Claro (Padrão)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Versão da Plataforma</span>
                    <span className="font-bold text-[#0b1c30]">v3.4.2 Enterprise</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Motor de OCR & IA</span>
                    <span className="font-bold text-purple-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      Gemini 2.5 Pro
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Custódia Criptográfica</span>
                    <span className="font-bold text-emerald-700">AES-256 Imutável</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">SLA Contratual</span>
                    <span className="font-bold text-emerald-700">99.98% Garantido</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-200 flex flex-col gap-2">
                <span className="text-[13px] font-bold text-[#0051d5] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">policy</span>
                  Política de Retenção Contratual
                </span>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Os arquivos digitais e minutas em PDF/A permanecem sob custódia digital por 5 anos após a data de rescisão ou expiração, em estrita conformidade com o Código Civil e a LGPD.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: NOTIFICAÇÕES & ALERTAS                           */}
        {/* ======================================================== */}
        {activeTab === 'notificacoes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Left Column: Proactive Engine & Destinatários (7 Columns) */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {/* Section: Motor de Alertas Proativos */}
              <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-[16px] font-bold text-[#0b1c30]">
                        Motor de Alertas Proativos & Inteligência Preditiva
                      </h2>
                      <span className="text-[12px] text-[#45464d]">
                        Disparos automáticos para mitigar reajustes compulsórios e multas por rescisão imotivada.
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] text-[10px] font-bold border border-emerald-200">
                      SLA 99.98%
                    </span>
                    <span className="text-[10px] text-gray-400">Fila Ativa: 18 disparos hoje</span>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
                  {/* Toggle 1: 30 dias */}
                  <div className="flex items-start justify-between p-3 rounded-xl bg-[#eff4ff]/40 border border-[#dce9ff]/60 hover:bg-[#eff4ff] transition-colors">
                    <div className="flex flex-col pr-4">
                      <span className="text-[13px] font-bold text-[#0b1c30]">
                        Aviso Prévio com 30 Dias de Antecedência
                      </span>
                      <span className="text-[11px] text-[#45464d] mt-0.5">
                        Notificar gestor do contrato e departamento de compras sobre janelas de renovação contratual.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('notice30Days')}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                        formData.notice30Days ? 'bg-[#0051d5]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                          formData.notice30Days ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      ></span>
                    </button>
                  </div>

                  {/* Toggle 2: 60 dias */}
                  <div className="flex items-start justify-between p-3 rounded-xl bg-[#eff4ff]/40 border border-[#dce9ff]/60 hover:bg-[#eff4ff] transition-colors">
                    <div className="flex flex-col pr-4">
                      <span className="text-[13px] font-bold text-[#0b1c30]">
                        Alerta Crítico com 60 Dias (Reajuste de Índices)
                      </span>
                      <span className="text-[11px] text-[#45464d] mt-0.5">
                        Obrigatório para contratos com cláusula de reajuste automático por índice (IPCA/IGP-M/Dólar).
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('notice60Days')}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                        formData.notice60Days ? 'bg-[#0051d5]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                          formData.notice60Days ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      ></span>
                    </button>
                  </div>

                  {/* Toggle 3: Pendência Assinatura */}
                  <div className="flex items-start justify-between p-3 rounded-xl bg-[#eff4ff]/40 border border-[#dce9ff]/60 hover:bg-[#eff4ff] transition-colors">
                    <div className="flex flex-col pr-4">
                      <span className="text-[13px] font-bold text-[#0b1c30]">
                        Pendência de Assinatura (&gt; 7 dias)
                      </span>
                      <span className="text-[11px] text-[#45464d] mt-0.5">
                        Reenviar lembrete automático aos signatários com minuta parada na mesa de aprovação.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('signaturePending7Days')}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                        formData.signaturePending7Days ? 'bg-[#0051d5]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                          formData.signaturePending7Days ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      ></span>
                    </button>
                  </div>

                  {/* Toggle 4: Alerta Risco IA */}
                  <div className="flex items-start justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-200 hover:bg-purple-50 transition-colors">
                    <div className="flex flex-col pr-4">
                      <span className="text-[13px] font-bold text-purple-950 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-purple-600">auto_awesome</span>
                        Alerta Instantâneo de Risco por IA (Gemini)
                      </span>
                      <span className="text-[11px] text-purple-800/80 mt-0.5">
                        Disparar e-mail imediato se o motor de IA identificar cláusula leonina ou multa de rescisão abusiva.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('aiRiskInstantAlert')}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                        formData.aiRiskInstantAlert ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                          formData.aiRiskInstantAlert ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      ></span>
                    </button>
                  </div>
                </div>

                {/* Destinatários Padrão */}
                <div className="pt-3 border-t border-gray-100 flex flex-col gap-3">
                  <span className="text-[13px] font-bold text-[#0b1c30]">
                    Destinatários Padrão para Notificações Corporativas
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-gray-600">
                        Departamento Jurídico
                      </label>
                      <input
                        type="email"
                        value={formData.legalEmail}
                        onChange={(e) => setFormData({ ...formData, legalEmail: e.target.value })}
                        className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[12px] text-[#0b1c30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-gray-600">
                        Controladoria / Finanças
                      </label>
                      <input
                        type="email"
                        value={formData.financeEmail}
                        onChange={(e) => setFormData({ ...formData, financeEmail: e.target.value })}
                        className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[12px] text-[#0b1c30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Notification Dropdown Simulation & Channel Health (5 Columns) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Live Preview of Notification Center */}
              <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0051d5] text-[20px]">preview</span>
                    <span className="text-[14px] font-bold text-[#0b1c30]">
                      Simulação da Central de Notificações
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0051d5] text-[10px] font-bold">
                    Preview Ativo
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Visualização em tempo real do dropdown de alertas para os usuários corporativos:
                </p>

                {/* Dropdown Simulation Box */}
                <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <span className="text-[12px] font-bold text-[#0b1c30]">Notificações (3)</span>
                    <span className="text-[10px] text-[#0051d5] font-semibold">Marcar todas como lidas</span>
                  </div>

                  {notifications.slice(0, 3).map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-white border border-[#e5eeff] shadow-sm flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-[#0b1c30]">{n.title}</span>
                        <span className="text-[10px] text-gray-400">{n.timeAgo}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-tight">{n.description}</p>
                      {n.badgeText && (
                        <div className="mt-1 flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              n.urgent ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-[#0051d5]'
                            }`}
                          >
                            {n.badgeText}
                          </span>
                          <span className="text-[11px] text-[#0051d5] font-bold hover:underline cursor-pointer">
                            Ver contrato →
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel Health Status */}
              <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-3">
                <span className="text-[14px] font-bold text-[#0b1c30] flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">lan</span>
                  Integridade dos Canais de Notificação
                </span>

                <div className="flex flex-col gap-2.5">
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-600 text-[18px]">mail</span>
                      <span className="text-[12px] font-semibold text-gray-800">Servidor SMTP Transacional</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Conectado (142ms)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-600 text-[18px]">chat</span>
                      <span className="text-[12px] font-semibold text-gray-800">Webhook Slack Jurídico</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Ativo (#alertas-clm)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-600 text-[18px]">sms</span>
                      <span className="text-[12px] font-semibold text-gray-800">SMS / WhatsApp Corporativo</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">
                      Opcional
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => showToast('Disparo de e-mail de teste enviado para o endereço corporativo!')}
                  className="mt-2 w-full h-9 rounded-xl bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0051d5] text-[12px] font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Testar Disparo de Alerta</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PERFIS & PERMISSÕES (RBAC)                       */}
        {/* ======================================================== */}
        {activeTab === 'perfis' && currentRole === 'administrador' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Top Cards: Os 3 Papéis Funcionais Oficiais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Administrador */}
              <div className="p-4 rounded-2xl bg-white border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-[#0b1c30]">Administrador</h3>
                      <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Governança & Controle Total
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {users.filter((u) => u.role === 'administrador').length} ativos
                  </span>
                </div>
                <p className="text-[11px] text-[#45464d] leading-relaxed">
                  Poderes irrestritos sobre parametrização corporativa, expurgo definitivo de contratos, gestão de usuários, credenciais de API REST e auditoria pericial.
                </p>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1 text-purple-700 font-bold">
                    <span className="material-symbols-outlined text-[14px]">verified_user</span>
                    Acesso Crítico
                  </span>
                  <span>100% dos módulos liberados</span>
                </div>
              </div>

              {/* Card 2: Editor */}
              <div className="p-4 rounded-2xl bg-white border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0051d5] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">edit_document</span>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-[#0b1c30]">Editor</h3>
                      <span className="text-[11px] font-semibold text-[#0051d5] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        Minutas & Operações
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {users.filter((u) => u.role === 'editor').length} ativos
                  </span>
                </div>
                <p className="text-[11px] text-[#45464d] leading-relaxed">
                  Autorizado a cadastrar contratos, editar termos, formular minutas, homologar fornecedores e disparar envelopes para assinatura ICP-Brasil.
                </p>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1 text-[#0051d5] font-bold">
                    <span className="material-symbols-outlined text-[14px]">draw</span>
                    Acesso Operacional Alto
                  </span>
                  <span>Sem poder de exclusão definitiva</span>
                </div>
              </div>

              {/* Card 3: Visualizador */}
              <div className="p-4 rounded-2xl bg-white border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-[#0b1c30]">Visualizador</h3>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Somente Leitura & Consulta
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {users.filter((u) => u.role === 'visualizador').length} ativos
                  </span>
                </div>
                <p className="text-[11px] text-[#45464d] leading-relaxed">
                  Acesso estrito de consulta e pesquisa. Permite visualizar contratos, dashboards gerenciais, pareceres neurais de IA e baixar relatórios analíticos em PDF.
                </p>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Acesso Seguro Zero-Escrita
                  </span>
                  <span>Somente Consulta Liberada</span>
                </div>
              </div>
            </div>

            {/* Subtabs Selector: Matriz Granular vs Colaboradores vs Simulador */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-[#eff4ff] rounded-2xl border border-[#dce9ff]">
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setRbacSubTab('matriz')}
                  className={`h-9 px-4 rounded-xl text-[12px] font-bold transition-all flex items-center gap-2 ${
                    rbacSubTab === 'matriz'
                      ? 'bg-[#0051d5] text-white shadow-sm'
                      : 'text-[#0b1c30] hover:bg-white/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">table_view</span>
                  <span>Matriz Granular de Acessos</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                      rbacSubTab === 'matriz' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {granularPermissions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRbacSubTab('usuarios')}
                  className={`h-9 px-4 rounded-xl text-[12px] font-bold transition-all flex items-center gap-2 ${
                    rbacSubTab === 'usuarios'
                      ? 'bg-[#0051d5] text-white shadow-sm'
                      : 'text-[#0b1c30] hover:bg-white/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  <span>Colaboradores & Papéis</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                      rbacSubTab === 'usuarios' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {users.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRbacSubTab('simulador')}
                  className={`h-9 px-4 rounded-xl text-[12px] font-bold transition-all flex items-center gap-2 ${
                    rbacSubTab === 'simulador'
                      ? 'bg-[#0051d5] text-white shadow-sm'
                      : 'text-[#0b1c30] hover:bg-white/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">rule</span>
                  <span>Simulador & Validador de Acessos</span>
                  <span className="px-1.5 py-0.2 text-[9px] rounded-md font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
                    Ao Vivo
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 px-2">
                <button
                  type="button"
                  onClick={() => setIsMatrixExportModalOpen(true)}
                  className="h-8 px-2.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-[#0b1c30] text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">data_object</span>
                  <span>Exportar JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveGranularPermissions}
                  className="h-8 px-3 rounded-lg bg-[#0051d5] hover:bg-[#003ea8] text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Salvar Matriz</span>
                </button>
              </div>
            </div>

            {/* SUBTAB 1: MATRIZ GRANULAR DE ACESSOS */}
            {rbacSubTab === 'matriz' && (
              <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] font-bold text-[#0b1c30] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0051d5] text-[22px]">tune</span>
                      Controle Granular por Papel Funcional
                    </h2>
                    <span className="text-[12px] text-[#45464d]">
                      Defina individualmente se cada papel possui acesso Total (Leitura e Escrita), Somente Leitura ou Acesso Bloqueado.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetGranularPermissions}
                      className="h-8 px-3 rounded-xl border border-gray-200 text-gray-600 hover:text-[#0b1c30] hover:bg-gray-50 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                      <span>Restaurar Baseline Padrão</span>
                    </button>
                  </div>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-100">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
                    Filtrar Módulo:
                  </span>
                  {(
                    [
                      { key: 'todas', label: 'Todas as Regras' },
                      { key: 'contratos', label: 'Contratos & Minutas' },
                      { key: 'fornecedores', label: 'Fornecedores' },
                      { key: 'assinaturas', label: 'Assinaturas Digitais' },
                      { key: 'ia_juridica', label: 'IA Jurídica' },
                      { key: 'governanca', label: 'Governança & Segurança' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setPermCategoryFilter(cat.key)}
                      className={`h-7 px-2.5 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                        permCategoryFilter === cat.key
                          ? 'bg-[#0051d5] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Granular Table */}
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="bg-[#eff4ff]/80 text-[#45464d] text-[11px] uppercase tracking-wider font-semibold border-b border-[#e5eeff]">
                        <th className="py-3 px-3 w-[46%]">Funcionalidade / Ação do Sistema</th>
                        <th className="py-3 px-3 text-center w-[18%]">
                          <div className="flex flex-col items-center">
                            <span className="text-purple-900 font-bold">Administrador</span>
                            <span className="text-[9px] font-normal text-purple-700 lowercase">governança total</span>
                          </div>
                        </th>
                        <th className="py-3 px-3 text-center w-[18%]">
                          <div className="flex flex-col items-center">
                            <span className="text-[#0051d5] font-bold">Editor</span>
                            <span className="text-[9px] font-normal text-blue-600 lowercase">criação & edição</span>
                          </div>
                        </th>
                        <th className="py-3 px-3 text-center w-[18%]">
                          <div className="flex flex-col items-center">
                            <span className="text-emerald-800 font-bold">Visualizador</span>
                            <span className="text-[9px] font-normal text-emerald-600 lowercase">somente leitura</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {granularPermissions
                        .filter(
                          (p) => permCategoryFilter === 'todas' || p.category === permCategoryFilter
                        )
                        .map((perm) => (
                          <tr key={perm.id} className="hover:bg-[#eff4ff]/30 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#0b1c30]">{perm.name}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                      perm.category === 'contratos'
                                        ? 'bg-blue-50 text-blue-700'
                                        : perm.category === 'fornecedores'
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : perm.category === 'assinaturas'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : perm.category === 'ia_juridica'
                                        ? 'bg-purple-50 text-purple-700'
                                        : 'bg-amber-50 text-amber-800'
                                    }`}
                                  >
                                    {perm.category === 'contratos'
                                      ? 'Contratos'
                                      : perm.category === 'fornecedores'
                                      ? 'Fornecedores'
                                      : perm.category === 'assinaturas'
                                      ? 'Assinaturas'
                                      : perm.category === 'ia_juridica'
                                      ? 'IA Jurídica'
                                      : 'Governança'}
                                  </span>
                                </div>
                                <span className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                                  {perm.description}
                                </span>
                              </div>
                            </td>

                            {/* Column: Administrador */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleGranular(perm.id, 'administrador')}
                                title="Clique para alternar permissão de Administrador (Total / Leitura / Bloqueado)"
                                className="inline-flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                              >
                                {perm.administrador === 'total' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 hover:bg-emerald-100">
                                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                                    <span>Total</span>
                                  </span>
                                )}
                                {perm.administrador === 'leitura' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 hover:bg-blue-100">
                                    <span className="material-symbols-outlined text-[15px]">visibility</span>
                                    <span>Leitura</span>
                                  </span>
                                )}
                                {perm.administrador === 'bloqueado' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400 text-[11px] font-bold border border-gray-200 hover:bg-gray-200">
                                    <span className="material-symbols-outlined text-[15px]">block</span>
                                    <span>Bloqueado</span>
                                  </span>
                                )}
                              </button>
                            </td>

                            {/* Column: Editor */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleGranular(perm.id, 'editor')}
                                title="Clique para alternar permissão de Editor (Total / Leitura / Bloqueado)"
                                className="inline-flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                              >
                                {perm.editor === 'total' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 hover:bg-emerald-100">
                                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                                    <span>Total</span>
                                  </span>
                                )}
                                {perm.editor === 'leitura' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 hover:bg-blue-100">
                                    <span className="material-symbols-outlined text-[15px]">visibility</span>
                                    <span>Leitura</span>
                                  </span>
                                )}
                                {perm.editor === 'bloqueado' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400 text-[11px] font-bold border border-gray-200 hover:bg-gray-200">
                                    <span className="material-symbols-outlined text-[15px]">block</span>
                                    <span>Bloqueado</span>
                                  </span>
                                )}
                              </button>
                            </td>

                            {/* Column: Visualizador */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleGranular(perm.id, 'visualizador')}
                                title="Clique para alternar permissão de Visualizador (Total / Leitura / Bloqueado)"
                                className="inline-flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                              >
                                {perm.visualizador === 'total' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 hover:bg-emerald-100">
                                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                                    <span>Total</span>
                                  </span>
                                )}
                                {perm.visualizador === 'leitura' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 hover:bg-blue-100">
                                    <span className="material-symbols-outlined text-[15px]">visibility</span>
                                    <span>Leitura</span>
                                  </span>
                                )}
                                {perm.visualizador === 'bloqueado' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400 text-[11px] font-bold border border-gray-200 hover:bg-gray-200">
                                    <span className="material-symbols-outlined text-[15px]">block</span>
                                    <span>Bloqueado</span>
                                  </span>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend & Instructions Footer */}
                <div className="p-3 bg-[#eff4ff]/60 rounded-xl border border-[#dce9ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#45464d]">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-bold text-[#0b1c30]">Legenda de Níveis:</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <span className="material-symbols-outlined text-[15px]">check_circle</span>
                      Total (Leitura & Escrita)
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
                      <span className="material-symbols-outlined text-[15px]">visibility</span>
                      Leitura (Apenas Consulta)
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-500 font-semibold">
                      <span className="material-symbols-outlined text-[15px]">block</span>
                      Bloqueado (Acesso Negado)
                    </span>
                  </div>

                  <span className="text-[10px] text-gray-500 italic">
                    Dica: Clique em qualquer selo para alternar entre Total ➔ Leitura ➔ Bloqueado.
                  </span>
                </div>
              </div>
            )}

            {/* SUBTAB 2: COLABORADORES & ATRIBUIÇÃO DE PAPÉIS */}
            {rbacSubTab === 'usuarios' && (
              <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">badge</span>
                    </div>
                    <div>
                      <h2 className="text-[16px] font-bold text-[#0b1c30]">
                        Diretório de Colaboradores & Papéis Ativos
                      </h2>
                      <span className="text-[12px] text-[#45464d]">
                        Atribua diretamente os papéis de Administrador, Editor ou Visualizador para cada colaborador.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="h-9 px-3.5 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-[12px] font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Convidar Usuário</span>
                  </button>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="Buscar por nome, e-mail ou departamento..."
                      className="w-full h-9 pl-9 pr-3 rounded-xl bg-gray-50 border border-gray-200 text-[12px] text-[#0b1c30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {(['todos', 'administrador', 'editor', 'visualizador'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRoleFilter(role)}
                        className={`h-8 px-3 rounded-lg text-[11px] font-bold capitalize transition-colors whitespace-nowrap ${
                          selectedRoleFilter === role
                            ? 'bg-[#0051d5] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {role === 'todos'
                          ? `Todos (${users.length})`
                          : `${role} (${users.filter((u) => u.role === role).length})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Users Table */}
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="bg-[#eff4ff]/80 text-[#45464d] text-[11px] uppercase tracking-wider font-semibold border-b border-[#e5eeff]">
                        <th className="py-2.5 px-3">Colaborador</th>
                        <th className="py-2.5 px-3">Departamento</th>
                        <th className="py-2.5 px-3">Papel Funcional (RBAC)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">2FA (MFA)</th>
                        <th className="py-2.5 px-3">Último Acesso</th>
                        <th className="py-2.5 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#eff4ff]/30 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full font-bold text-[12px] flex items-center justify-center shrink-0 ${
                                  u.role === 'administrador'
                                    ? 'bg-purple-100 text-purple-700'
                                    : u.role === 'editor'
                                    ? 'bg-blue-100 text-[#0051d5]'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {u.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-[#0b1c30] truncate">{u.name}</span>
                                <span className="text-[11px] text-gray-500 font-mono truncate">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-600">{u.department}</td>
                          <td className="py-3 px-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value as UserRole)}
                              className={`h-7 px-2.5 rounded-lg text-[11px] font-bold uppercase border cursor-pointer focus:outline-none focus:ring-2 ${
                                u.role === 'administrador'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-300'
                                  : u.role === 'editor'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-300'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-300'
                              }`}
                            >
                              <option value="administrador">ADMINISTRADOR</option>
                              <option value="editor">EDITOR</option>
                              <option value="visualizador">VISUALIZADOR</option>
                            </select>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.status === 'ativo'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : u.status === 'pendente'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {u.status === 'ativo' ? 'Ativo' : u.status === 'pendente' ? 'Pendente' : 'Bloqueado'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {u.twoFactorEnabled ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                                <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                                Ativo
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-400">Inativo</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-gray-500 text-[11px]">{u.lastLogin}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => showToast(`Link para redefinição de senha enviado para ${u.email}!`)}
                                title="Resetar Senha"
                                className="p-1 rounded-lg text-gray-500 hover:text-[#0051d5] hover:bg-blue-50 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">key</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u.id)}
                                title={u.status === 'ativo' ? 'Bloquear Acesso' : 'Desbloquear'}
                                className={`p-1 rounded-lg transition-colors ${
                                  u.status === 'ativo'
                                    ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                    : 'text-red-600 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {u.status === 'ativo' ? 'lock' : 'lock_open'}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUBTAB 3: SIMULADOR & VALIDADOR DE ACESSOS */}
            {rbacSubTab === 'simulador' && (
              <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-6 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">verified</span>
                    </div>
                    <div>
                      <h2 className="text-[16px] font-bold text-[#0b1c30]">
                        Simulador & Validador de Políticas em Tempo Real
                      </h2>
                      <span className="text-[12px] text-[#45464d]">
                        Teste interativamente o comportamento do sistema para cada papel funcional antes de publicar regras.
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                    Motor de Decisão RBAC Ativo
                  </span>
                </div>

                {/* Role Switcher */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-3">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Passo 1: Selecione o Papel Funcional a ser testado
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        {
                          role: 'visualizador' as UserRole,
                          label: 'Visualizador',
                          sub: 'Consulta & Leitura',
                          icon: 'visibility',
                          activeColor: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
                        },
                        {
                          role: 'editor' as UserRole,
                          label: 'Editor',
                          sub: 'Minutas & Execução',
                          icon: 'edit_document',
                          activeColor: 'bg-[#0051d5] text-white border-[#0051d5] shadow-sm',
                        },
                        {
                          role: 'administrador' as UserRole,
                          label: 'Administrador',
                          sub: 'Governança Total',
                          icon: 'admin_panel_settings',
                          activeColor: 'bg-purple-700 text-white border-purple-700 shadow-sm',
                        },
                      ] as const
                    ).map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => setSimulatorRole(r.role)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          simulatorRole === r.role
                            ? r.activeColor
                            : 'bg-white border-gray-200 text-[#0b1c30] hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            simulatorRole === r.role ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">{r.icon}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold">{r.label}</span>
                          <span
                            className={`text-[10px] ${
                              simulatorRole === r.role ? 'text-white/80' : 'text-gray-500'
                            }`}
                          >
                            {r.sub}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Practical Scenario Tester */}
                <div className="p-4 rounded-xl bg-[#eff4ff]/60 border border-[#dce9ff] flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider">
                      Passo 2: Selecione uma Ação Prática para Testar Autorização
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Papel Simulado: <strong className="uppercase text-[#0b1c30]">{simulatorRole}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-semibold text-[#0b1c30]">Ação ou Funcionalidade</label>
                      <select
                        value={simulatorActionId}
                        onChange={(e) => setSimulatorActionId(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-white border border-gray-300 text-[13px] font-bold text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                      >
                        <option value="perm-contracts-create">Cadastrar Novo Contrato e Upload de Minuta</option>
                        <option value="perm-contracts-edit">Editar Metadados, Cláusulas e Repactuações</option>
                        <option value="perm-contracts-addendum">Elaborar e Emitir Termos Aditivos</option>
                        <option value="perm-contracts-delete">Excluir e Rescindir Contrato Definitivamente</option>
                        <option value="perm-contracts-export">Exportar Relatórios Gerenciais & TCO em PDF</option>
                        <option value="perm-suppliers-create">Cadastrar e Homologar Novo Fornecedor</option>
                        <option value="perm-signatures-sign">Assinar com Certificado ICP-Brasil (A1/A3)</option>
                        <option value="perm-ai-reanalyze">Disparar Reanálise Neural de IA Jurídica</option>
                        <option value="perm-gov-users">Gerenciar Usuários e Atribuir Papéis RBAC</option>
                        <option value="perm-gov-api">Gerar / Revogar Chaves de API REST & Webhooks</option>
                        <option value="perm-gov-audit">Acessar Trilha Forense de Auditoria (Logs)</option>
                      </select>
                    </div>

                    {/* Simulation Result Output */}
                    {(() => {
                      const perm =
                        granularPermissions.find((p) => p.id === simulatorActionId) ||
                        granularPermissions[0];
                      const level = perm ? perm[simulatorRole] : 'bloqueado';

                      return (
                        <div
                          className={`p-4 rounded-xl border flex flex-col gap-2 animate-in zoom-in-95 ${
                            level === 'total'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : level === 'leitura'
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : 'bg-red-50 border-red-200 text-red-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Decisão da Matriz RBAC:
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                level === 'total'
                                  ? 'bg-emerald-600 text-white'
                                  : level === 'leitura'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-red-600 text-white'
                              }`}
                            >
                              {level === 'total'
                                ? 'AUTORIZADO (200 OK)'
                                : level === 'leitura'
                                ? 'SOMENTE LEITURA (200 OK)'
                                : 'ACESSO NEGADO (403 FORBIDDEN)'}
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-[22px] shrink-0 mt-0.5">
                              {level === 'total'
                                ? 'check_circle'
                                : level === 'leitura'
                                ? 'visibility'
                                : 'gpp_bad'}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold">
                                {level === 'total' && 'Acesso Pleno de Execução & Gravação'}
                                {level === 'leitura' && 'Acesso Restrito a Somente Consulta'}
                                {level === 'bloqueado' && 'Operação Estritamente Proibida'}
                              </span>
                              <span className="text-[11px] opacity-90 mt-0.5 leading-snug">
                                {level === 'total' &&
                                  `O perfil ${simulatorRole.toUpperCase()} possui autorização total para executar '${perm?.name}'.`}
                                {level === 'leitura' &&
                                  `O perfil ${simulatorRole.toUpperCase()} pode visualizar os dados de '${perm?.name}', mas não pode gravar ou alterar.`}
                                {level === 'bloqueado' &&
                                  `O perfil ${simulatorRole.toUpperCase()} está impedido de acessar '${perm?.name}' pelas políticas de governança.`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Overview Breakdown of Active Permissions for Selected Role */}
                <div className="flex flex-col gap-3">
                  <span className="text-[12px] font-bold text-[#0b1c30]">
                    Mapa de Acessos Ativos para o Papel: <strong className="uppercase text-[#0051d5]">{simulatorRole}</strong>
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Authorized Total */}
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-emerald-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          Acesso Total ({granularPermissions.filter((p) => p[simulatorRole] === 'total').length})
                        </span>
                      </div>
                      <ul className="text-[11px] text-emerald-950 flex flex-col gap-1 max-h-48 overflow-y-auto">
                        {granularPermissions
                          .filter((p) => p[simulatorRole] === 'total')
                          .map((p) => (
                            <li key={p.id} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                              <span className="truncate">{p.name}</span>
                            </li>
                          ))}
                        {granularPermissions.filter((p) => p[simulatorRole] === 'total').length === 0 && (
                          <li className="text-gray-400 italic">Nenhum acesso total concedido</li>
                        )}
                      </ul>
                    </div>

                    {/* Read Only */}
                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-blue-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          Somente Leitura ({granularPermissions.filter((p) => p[simulatorRole] === 'leitura').length})
                        </span>
                      </div>
                      <ul className="text-[11px] text-blue-950 flex flex-col gap-1 max-h-48 overflow-y-auto">
                        {granularPermissions
                          .filter((p) => p[simulatorRole] === 'leitura')
                          .map((p) => (
                            <li key={p.id} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                              <span className="truncate">{p.name}</span>
                            </li>
                          ))}
                        {granularPermissions.filter((p) => p[simulatorRole] === 'leitura').length === 0 && (
                          <li className="text-gray-400 italic">Nenhum módulo em somente leitura</li>
                        )}
                      </ul>
                    </div>

                    {/* Blocked */}
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-gray-700">
                        <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">block</span>
                          Bloqueado ({granularPermissions.filter((p) => p[simulatorRole] === 'bloqueado').length})
                        </span>
                      </div>
                      <ul className="text-[11px] text-gray-600 flex flex-col gap-1 max-h-48 overflow-y-auto">
                        {granularPermissions
                          .filter((p) => p[simulatorRole] === 'bloqueado')
                          .map((p) => (
                            <li key={p.id} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
                              <span className="truncate">{p.name}</span>
                            </li>
                          ))}
                        {granularPermissions.filter((p) => p[simulatorRole] === 'bloqueado').length === 0 && (
                          <li className="text-gray-400 italic">Nenhuma restrição imposta</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Alçadas de Aprovação & Limites Financeiros */}
            <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#0b1c30]">
                    Alçadas de Aprovação & Limites Financeiros de Celebração
                  </h2>
                  <span className="text-[12px] text-[#45464d]">
                    Exigência hierárquica de assinaturas para celebração de contratos baseada em valor total.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Nível 1 • Visualizador / Compras Básicas
                  </span>
                  <div className="flex items-center gap-1 text-[16px] font-bold text-[#0b1c30]">
                    <span>Até R$</span>
                    <input
                      type="number"
                      value={formData.tier1Limit || 50000}
                      onChange={(e) => setFormData({ ...formData, tier1Limit: Number(e.target.value) })}
                      className="w-28 h-8 px-2 rounded-lg bg-white border border-gray-300 text-[14px] font-bold text-[#0b1c30]"
                    />
                  </div>
                  <span className="text-[11px] text-gray-500">Aprovação direta para termos de rotina e insumos básicos.</span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider">
                    Nível 2 • Editor de Contratos
                  </span>
                  <div className="flex items-center gap-1 text-[16px] font-bold text-[#0b1c30]">
                    <span>Até R$</span>
                    <input
                      type="number"
                      value={formData.tier2Limit || 250000}
                      onChange={(e) => setFormData({ ...formData, tier2Limit: Number(e.target.value) })}
                      className="w-28 h-8 px-2 rounded-lg bg-white border border-blue-300 text-[14px] font-bold text-[#0b1c30]"
                    />
                  </div>
                  <span className="text-[11px] text-gray-500">Exige parecer jurídico favorável e validação fiscal.</span>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                    Nível 3 • Administrador & Diretoria C-Level
                  </span>
                  <div className="text-[16px] font-bold text-purple-950">
                    Acima de R$ {(formData.tier2Limit || 250000).toLocaleString('pt-BR')}
                  </div>
                  <span className="text-[11px] text-gray-500">Obrigatório duplo signatário executivo com certificado ICP-Brasil.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: INTEGRAÇÕES & API                                */}
        {/* ======================================================== */}
        {activeTab === 'integracoes' && currentRole === 'administrador' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Section 1: API Keys Management */}
            <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">vpn_key</span>
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#0b1c30]">
                      Chaves de Acesso à API REST (OpenAPI 3.0)
                    </h2>
                    <span className="text-[12px] text-[#45464d]">
                      Credenciais para integração direta de sistemas legados, ERPs e pipelines de automação contratual.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewKeyModalOpen(true)}
                  className="h-9 px-3.5 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-[12px] font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">add_moderator</span>
                  <span>Gerar Nova Chave</span>
                </button>
              </div>

              {/* API Keys Table */}
              <div className="w-full overflow-x-auto pt-2 border-t border-gray-100">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-[#eff4ff]/80 text-[#45464d] text-[11px] uppercase tracking-wider font-semibold border-b border-[#e5eeff]">
                      <th className="py-2.5 px-3">Identificação da Chave</th>
                      <th className="py-2.5 px-3">Token Prefix</th>
                      <th className="py-2.5 px-3">Ambiente</th>
                      <th className="py-2.5 px-3">Escopo</th>
                      <th className="py-2.5 px-3">Criada em</th>
                      <th className="py-2.5 px-3">Último Uso</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-[#eff4ff]/30 transition-colors">
                        <td className="py-3 px-3 font-bold text-[#0b1c30]">{key.name}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-700">
                          <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 select-all">
                            {key.keyPrefix}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              key.environment === 'producao'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {key.environment}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600 font-medium">{key.scope}</td>
                        <td className="py-3 px-3 text-gray-500 text-[11px]">{key.createdAt}</td>
                        <td className="py-3 px-3 text-gray-500 text-[11px]">{key.lastUsedAt}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(key.keyFull || key.keyPrefix, 'Chave de API')}
                              title="Copiar Token"
                              className="p-1 rounded-lg text-gray-500 hover:text-[#0051d5] hover:bg-blue-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">content_copy</span>
                            </button>
                            {key.status === 'ativo' ? (
                              <button
                                type="button"
                                onClick={() => handleRevokeApiKey(key.id)}
                                title="Revogar Chave"
                                className="p-1 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">cancel</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-red-600 font-bold">Revogada</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Endpoint Documentation Box */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-[12px] text-gray-700 truncate">
                  <span className="px-2 py-0.5 rounded bg-[#0051d5] text-white font-bold text-[10px]">
                    GET
                  </span>
                  <span className="truncate">https://api.gruporiomais.com.br/v2/contracts</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        'curl -X GET "https://api.gruporiomais.com.br/v2/contracts" -H "Authorization: Bearer cf_live_..."',
                        'Exemplo cURL'
                      )
                    }
                    className="h-8 px-3 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-[11px] font-semibold text-[#0b1c30] flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">terminal</span>
                    <span>Copiar cURL</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Enterprise Native Connectors */}
            <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">hub</span>
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#0b1c30]">
                    Conectores Nativos Enterprise
                  </h2>
                  <span className="text-[12px] text-[#45464d]">
                    Sincronização bidirecional com ferramentas de mercado líderes em assinatura, ERP e governança.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                {integrations.map((int) => (
                  <div
                    key={int.id}
                    className="p-4 rounded-xl bg-white border border-[#e5eeff] hover:border-blue-300 shadow-sm flex flex-col justify-between gap-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">{int.icon}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#0b1c30]">{int.name}</span>
                          <span className="text-[10px] font-bold uppercase text-[#0051d5] tracking-wider">
                            {int.category}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleIntegration(int.id)}
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                          int.connected ? 'bg-[#0051d5]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                            int.connected ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        ></span>
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-600 leading-relaxed">{int.description}</p>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${int.connected ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                        <span className="text-gray-600 truncate font-medium">{int.statusText}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTestIntegration(int.id, int.name)}
                          disabled={testingIntegrationId === int.id}
                          className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold flex items-center gap-1 disabled:opacity-50 transition-colors"
                          title="Testar latência e conectividade"
                        >
                          <span
                            className={`material-symbols-outlined text-[14px] ${
                              testingIntegrationId === int.id ? 'animate-spin' : ''
                            }`}
                          >
                            wifi_tethering
                          </span>
                          <span>{testingIntegrationId === int.id ? 'Testando...' : 'Testar'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSyncIntegration(int.id, int.name)}
                          disabled={!int.connected || syncingIntegrationId === int.id}
                          className="px-2.5 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dbeafe] text-[#0051d5] font-semibold flex items-center gap-1 disabled:opacity-50 transition-colors"
                        >
                          <span
                            className={`material-symbols-outlined text-[14px] ${
                              syncingIntegrationId === int.id ? 'animate-spin' : ''
                            }`}
                          >
                            sync
                          </span>
                          <span>{syncingIntegrationId === int.id ? 'Sincronizando...' : 'Sincronizar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Webhooks de Eventos */}
            <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">webhook</span>
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#0b1c30]">
                      Webhooks de Eventos em Tempo Real
                    </h2>
                    <span className="text-[12px] text-[#45464d]">
                      Notificações HTTP POST disparadas quando contratos são assinados, vencidos ou identificados com risco.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewWebhookModalOpen(true)}
                  className="h-9 px-3.5 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-[12px] font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">add_link</span>
                  <span>Novo Webhook</span>
                </button>
              </div>

              <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
                {webhooks.map((wh) => (
                  <div
                    key={wh.id}
                    className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-mono text-[12px] text-[#0b1c30] font-bold truncate">
                          {wh.url}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {wh.events.map((ev) => (
                          <span
                            key={ev}
                            className="px-2 py-0.5 rounded bg-blue-50 text-[#0051d5] text-[10px] font-mono font-semibold"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end text-[11px]">
                        <span className="text-emerald-700 font-bold">{wh.lastDeliveryStatus}</span>
                        <span className="text-gray-400">{wh.lastDeliveryAt}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTestWebhook(wh)}
                        className="h-8 px-3 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-[#0051d5] font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">send</span>
                        <span>Testar Ping</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: SEGURANÇA & AUDITORIA                            */}
        {/* ======================================================== */}
        {activeTab === 'seguranca' && currentRole === 'administrador' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Section 1: Security Policies & Access Controls */}
            <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">security</span>
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#0b1c30]">
                    Políticas de Acesso & Autenticação Corporativa
                  </h2>
                  <span className="text-[12px] text-[#45464d]">
                    Parâmetros de proteção de credenciais, sessão de usuários e segurança de perímetro.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                {/* 2FA Toggle */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-[#0b1c30] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#0051d5]">fingerprint</span>
                      Exigir Autenticação em Duas Etapas (2FA/MFA)
                    </span>
                    <span className="text-[11px] text-gray-500 mt-1">
                      Obrigatório para todos os colaboradores com perfil Administrador e Gestor.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('twoFactorRequired')}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                      formData.twoFactorRequired ? 'bg-[#0051d5]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                        formData.twoFactorRequired ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    ></span>
                  </button>
                </div>

                {/* SSO Toggle */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-[#0b1c30] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#0051d5]">badge</span>
                      Single Sign-On (SSO SAML 2.0 / Azure AD)
                    </span>
                    <span className="text-[11px] text-gray-500 mt-1">
                      Conectado ao Microsoft Entra ID corporativo com auto-provisionamento SCIM.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('ssoEnabled')}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 mt-0.5 ${
                      formData.ssoEnabled ? 'bg-[#0051d5]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform absolute top-1 ${
                        formData.ssoEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    ></span>
                  </button>
                </div>

                {/* Session Timeout */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-[#0b1c30]">
                    Tempo Limite de Inatividade da Sessão
                  </label>
                  <select
                    value={formData.sessionTimeoutMinutes || 30}
                    onChange={(e) =>
                      setFormData({ ...formData, sessionTimeoutMinutes: Number(e.target.value) })
                    }
                    className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-[12px] text-[#0b1c30] focus:outline-none"
                  >
                    <option value={15}>15 minutos (Alta Segurança)</option>
                    <option value={30}>30 minutos (Recomendado)</option>
                    <option value={60}>1 hora</option>
                    <option value={240}>4 horas</option>
                  </select>
                </div>

                {/* IP Whitelist */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-bold text-[#0b1c30]">
                      Restrição por IP / VPN Corporativa
                    </label>
                    <button
                      type="button"
                      onClick={() => handleToggle('ipWhitelistEnabled')}
                      className="text-[11px] text-[#0051d5] font-semibold hover:underline"
                    >
                      {formData.ipWhitelistEnabled ? 'Ativo' : 'Desativado'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.ipWhitelist || ''}
                    onChange={(e) => setFormData({ ...formData, ipWhitelist: e.target.value })}
                    placeholder="ex: 189.40.112.0/24, 201.86.72.0/24"
                    className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-[12px] font-mono text-[#0b1c30] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Immutable Audit Trail (Trilha de Auditoria) */}
            <div className="p-5 bg-white rounded-2xl border border-[#e5eeff] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">history_edu</span>
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#0b1c30]">
                      Trilha de Auditoria Imutável (Audit Trail)
                    </h2>
                    <span className="text-[12px] text-[#45464d]">
                      Registro com carimbo digital e hash criptográfico de todas as ações executadas no CLM.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {onNavigateToAudit && (
                    <button
                      type="button"
                      id="btn-goto-full-audit"
                      onClick={onNavigateToAudit}
                      className="h-9 px-3.5 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      <span>Abrir Painel Completo de Auditoria</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExportAuditCsv}
                    className="h-9 px-3.5 rounded-xl bg-white border border-[#e5eeff] hover:bg-gray-50 text-[#0b1c30] text-[12px] font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>Exportar CSV Oficial</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <div className="relative flex-1 max-w-md">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={auditSearchTerm}
                    onChange={(e) => setAuditSearchTerm(e.target.value)}
                    placeholder="Filtrar por usuário, ação, contrato ou IP..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-gray-50 border border-gray-200 text-[12px] text-[#0b1c30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {[
                    { id: 'todos', label: 'Todos os Eventos' },
                    { id: 'seguranca', label: 'Segurança & Acessos' },
                    { id: 'contratos', label: 'Contratos & Minutas' },
                    { id: 'avisos', label: 'Avisos & Bloqueios' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setAuditFilterType(filter.id)}
                      className={`h-8 px-3 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                        auditFilterType === filter.id
                          ? 'bg-[#0051d5] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audit Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-[#eff4ff]/80 text-[#45464d] text-[11px] uppercase tracking-wider font-semibold border-b border-[#e5eeff]">
                      <th className="py-2.5 px-3">Data / Hora</th>
                      <th className="py-2.5 px-3">Usuário / Agente</th>
                      <th className="py-2.5 px-3">Evento Realizado</th>
                      <th className="py-2.5 px-3">Recurso Alvo</th>
                      <th className="py-2.5 px-3">Origem (IP & Local)</th>
                      <th className="py-2.5 px-3 text-center">Severidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#eff4ff]/30 transition-colors">
                        <td className="py-3 px-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[#0b1c30]">{log.user}</span>
                            <span className="text-[10px] text-gray-500">{log.role || log.userEmail}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#0051d5] font-mono text-[11px]">
                              {log.action}
                            </span>
                            <span className="text-[11px] text-gray-600 line-clamp-1">{log.detail}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-[#0b1c30] font-mono text-[11px] font-bold border border-gray-200">
                            {log.resource || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">
                          {log.ip ? `${log.ip} (${log.location})` : 'Interno'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              log.severity === 'alto'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : log.severity === 'medio'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {log.severity || 'baixo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: LGPD Compliance & Cryptography */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-[#e5eeff] shadow-sm flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-[#0b1c30]">
                    Criptografia AES-256 e TLS 1.3
                  </span>
                  <span className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                    Todos os dados em repouso são cifrados com chaves rotativas HSM. Em trânsito, o tráfego é estritamente protegido com TLS 1.3 e certificados digitais emitidos por autoridade confiável.
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#e5eeff] shadow-sm flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0051d5] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">gavel</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-[#0b1c30]">
                    Conformidade LGPD & Contato DPO
                  </span>
                  <span className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                    Encarregado de Proteção de Dados (DPO) nomeado: <span className="font-semibold text-[#0051d5]">dpo@gruporiomais.com.br</span>. Relatório de Impacto à Proteção de Dados (RIPD) disponível para auditorias regulatórias.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: NOVO USUÁRIO                                      */}
      {/* ======================================================== */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-[16px] font-bold text-[#0b1c30]">Convidar Novo Usuário</h3>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddUser} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">Nome Completo</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="ex: Juliana Martins"
                  className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">E-mail Corporativo</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="ex: juliana.martins@empresa.com.br"
                  className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">Departamento</label>
                <select
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] focus:bg-white focus:outline-none"
                >
                  <option value="Jurídico Corporativo">Jurídico Corporativo</option>
                  <option value="Compras & Suprimentos">Compras & Suprimentos</option>
                  <option value="Controladoria Financeira">Controladoria Financeira</option>
                  <option value="Tecnologia da Informação">Tecnologia da Informação</option>
                  <option value="Diretoria Executiva">Diretoria Executiva</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">Papel Funcional (Perfil RBAC)</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] focus:bg-white focus:outline-none"
                >
                  <option value="visualizador">Visualizador (Somente Leitura & Consulta)</option>
                  <option value="editor">Editor (Elaboração, Minutas & Operações)</option>
                  <option value="administrador">Administrador (Controle Total & Governança)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#0051d5] shrink-0 mt-0.5">info</span>
                <span>
                  {newUserRole === 'administrador' && 'Administradores possuem controle irrestrito do sistema e auditoria.'}
                  {newUserRole === 'editor' && 'Editores podem cadastrar contratos, elaborar minutas e enviar para assinatura.'}
                  {newUserRole === 'visualizador' && 'Visualizadores têm acesso restrito de consulta e relatórios (zero escrita).'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="h-9 px-4 rounded-xl text-gray-600 hover:bg-gray-100 text-[12px] font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-[12px] font-bold transition-all shadow-md"
                >
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EXPORTAR MATRIZ GRANULAR JSON                    */}
      {/* ======================================================== */}
      {isMatrixExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 flex flex-col gap-4 animate-in zoom-in-95 max-h-[85vh]">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0051d5] text-[22px]">data_object</span>
                <h3 className="text-[16px] font-bold text-[#0b1c30]">Exportação da Matriz RBAC (JSON)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMatrixExportModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-[12px] text-gray-600">
              Esta é a especificação formal de permissões ativas para os papéis <code>administrador</code>, <code>editor</code> e <code>visualizador</code>.
            </p>

            <div className="relative flex-1 bg-gray-900 rounded-xl p-3 text-emerald-400 font-mono text-[11px] overflow-auto max-h-72">
              <pre>{JSON.stringify(granularPermissions, null, 2)}</pre>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-[11px] text-gray-500">
                {granularPermissions.length} regras estruturadas
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMatrixJson}
                  className="h-9 px-4 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-[12px] font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>Copiar JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMatrixExportModalOpen(false)}
                  className="h-9 px-4 rounded-xl text-gray-600 hover:bg-gray-100 text-[12px] font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: GERAR NOVA CHAVE DE API                          */}
      {/* ======================================================== */}
      {isNewKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-[16px] font-bold text-[#0b1c30]">Gerar Chave de API REST</h3>
              <button
                type="button"
                onClick={() => setIsNewKeyModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleGenerateApiKey} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">Nome / Identificação</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="ex: Pipeline Integração ERP Oracle"
                  className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">Ambiente de Execução</label>
                <select
                  value={newKeyEnv}
                  onChange={(e) => setNewKeyEnv(e.target.value as 'producao' | 'sandbox')}
                  className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] focus:bg-white focus:outline-none"
                >
                  <option value="producao">Produção (Live)</option>
                  <option value="sandbox">Sandbox / Homologação (Testes)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">Escopo de Permissões</label>
                <select
                  value={newKeyScope}
                  onChange={(e) =>
                    setNewKeyScope(
                      e.target.value as 'Leitura & Escrita' | 'Somente Consulta' | 'Assinaturas Digitais'
                    )
                  }
                  className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] focus:bg-white focus:outline-none"
                >
                  <option value="Leitura & Escrita">Leitura & Escrita (Acesso Completo)</option>
                  <option value="Somente Consulta">Somente Consulta (Read-Only)</option>
                  <option value="Assinaturas Digitais">Assinaturas Digitais & ICP</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">warning</span>
                <span>Por segurança, o token completo é exibido uma única vez após a criação.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewKeyModalOpen(false)}
                  className="h-9 px-4 rounded-xl text-gray-600 hover:bg-gray-100 text-[12px] font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-[12px] font-bold transition-all shadow-md"
                >
                  Criar Chave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOVO WEBHOOK                                      */}
      {/* ======================================================== */}
      {isNewWebhookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-[16px] font-bold text-[#0b1c30]">Cadastrar Novo Webhook</h3>
              <button
                type="button"
                onClick={() => setIsNewWebhookModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddWebhook} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-gray-600">URL de Destino (HTTPS)</label>
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://api.empresa.com.br/clm/webhooks/listener"
                  className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-[#0b1c30] font-mono focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-gray-600">Eventos Inscritos</label>
                <div className="grid grid-cols-1 gap-1.5 text-[12px]">
                  {[
                    { id: 'contract.signed', label: 'contract.signed (Contrato Assinado)' },
                    { id: 'contract.activated', label: 'contract.activated (Contrato Ativo)' },
                    { id: 'ai.risk_detected', label: 'ai.risk_detected (Alerta de Risco IA)' },
                    { id: 'supplier.blocked', label: 'supplier.blocked (Fornecedor Bloqueado)' },
                  ].map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWebhookEvents.includes(ev.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWebhookEvents((prev) => [...prev, ev.id]);
                          } else {
                            setSelectedWebhookEvents((prev) => prev.filter((x) => x !== ev.id));
                          }
                        }}
                        className="rounded text-[#0051d5] focus:ring-[#0051d5]"
                      />
                      <span className="text-[#0b1c30] text-[11px] font-mono">{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewWebhookModalOpen(false)}
                  className="h-9 px-4 rounded-xl text-gray-600 hover:bg-gray-100 text-[12px] font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-[12px] font-bold transition-all shadow-md"
                >
                  Salvar Webhook
                </button>
              </div>
            </form>
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
