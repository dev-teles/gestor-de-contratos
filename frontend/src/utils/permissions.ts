import { UserRole } from '../types';

export interface RolePermissions {
  canViewAudit: boolean;
  canExportAudit: boolean;
  canCreateContract: boolean;
  canEditContract: boolean;
  canDeleteContract: boolean;
  canRescindContract: boolean;
  canCreateAddendum: boolean;
  canCreateSupplier: boolean;
  canDeleteSupplier: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
  canManageApiKeys: boolean;
  canManageSecurity: boolean;
  allowedSettingsTabs: ('geral' | 'notificacoes' | 'perfis' | 'integracoes' | 'seguranca')[];
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  administrador: {
    canViewAudit: true,
    canExportAudit: true,
    canCreateContract: true,
    canEditContract: true,
    canDeleteContract: true,
    canRescindContract: true,
    canCreateAddendum: true,
    canCreateSupplier: true,
    canDeleteSupplier: true,
    canManageSettings: true,
    canManageUsers: true,
    canManageApiKeys: true,
    canManageSecurity: true,
    allowedSettingsTabs: ['geral', 'notificacoes', 'perfis', 'integracoes', 'seguranca'],
  },
  editor: {
    canViewAudit: false,
    canExportAudit: false,
    canCreateContract: true,
    canEditContract: true,
    canDeleteContract: false,
    canRescindContract: false,
    canCreateAddendum: true,
    canCreateSupplier: true,
    canDeleteSupplier: false,
    canManageSettings: false,
    canManageUsers: false,
    canManageApiKeys: false,
    canManageSecurity: false,
    allowedSettingsTabs: ['geral', 'notificacoes'],
  },
  visualizador: {
    canViewAudit: false,
    canExportAudit: false,
    canCreateContract: false,
    canEditContract: false,
    canDeleteContract: false,
    canRescindContract: false,
    canCreateAddendum: false,
    canCreateSupplier: false,
    canDeleteSupplier: false,
    canManageSettings: false,
    canManageUsers: false,
    canManageApiKeys: false,
    canManageSecurity: false,
    allowedSettingsTabs: [],
  },
};

export const getRolePermissions = (role: UserRole = 'administrador'): RolePermissions => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.visualizador;
};

export interface RoleInfo {
  name: string;
  shortLabel: string;
  scopeBadge: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
  icon: string;
}

export const ROLE_DETAILS: Record<UserRole, RoleInfo> = {
  administrador: {
    name: 'Administrador Geral',
    shortLabel: 'Administrador',
    scopeBadge: 'Controle Total & Governança',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
    description: 'Acesso irrestrito a governança, trilha de auditoria pericial, gestão de usuários, exclusão e parametrização global.',
    icon: 'admin_panel_settings',
  },
  editor: {
    name: 'Editor Operacional',
    shortLabel: 'Editor',
    scopeBadge: 'Edição & Minutas',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    description: 'Permissão para cadastrar minutas, editar cláusulas e gerenciar fornecedores. Bloqueado para exclusões, auditoria e governança.',
    icon: 'edit_document',
  },
  visualizador: {
    name: 'Visualizador de Consulta',
    shortLabel: 'Visualizador',
    scopeBadge: 'Somente Leitura (Consulta)',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    description: 'Acesso restrito para consulta e leitura de contratos e fornecedores. Sem permissão de inserção, alteração, exclusão ou auditoria.',
    icon: 'visibility',
  },
};
