export type UserRole = 'administrador' | 'editor' | 'visualizador';

export type PermissionAccessLevel = 'total' | 'leitura' | 'bloqueado';

export interface GranularPermission {
  id: string;
  category: 'contratos' | 'fornecedores' | 'assinaturas' | 'ia_juridica' | 'governanca';
  name: string;
  description: string;
  administrador: PermissionAccessLevel;
  editor: PermissionAccessLevel;
  visualizador: PermissionAccessLevel;
}

export type ContractStatus = 'vigente' | 'avencer' | 'sem_assinatura' | 'expirado';

export interface Signer {
  id: string;
  name: string;
  role: string;
  cpf: string;
  signed: boolean;
  signedAt?: string;
  avatarInitials: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  addedAt: string;
  type: 'pdf' | 'doc';
  description?: string;
}

export interface AiInsight {
  topic: string;
  summary: string;
  icon: string;
}

export interface Contract {
  id: string;
  code: string;
  internalId: string;
  title: string;
  supplierId: string;
  supplierName: string;
  supplierCnpj: string;
  category: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  remainingDays: number;
  totalValue: number;
  monthlyValue?: number;
  periodicity: 'mensal' | 'anual' | 'demanda' | 'plurianual';
  status: ContractStatus;
  signatureStatus: string;
  hasOcr: boolean;
  progressPercent: number;
  riskCritical?: boolean;
  isSigned: boolean;
  signedDate?: string;
  signingMethod?: string;
  notes?: string;
  notificationEmail?: string;
  notifyOnExpiration?: boolean;
  notifyOnStatusChange?: boolean;
  signers: Signer[];
  attachments: Attachment[];
  aiInsights: {
    executiveSummary: string;
    items: AiInsight[];
    criticalRisk?: string;
  };
}

export interface Supplier {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  activities: string[];
  riskLevel: 'baixo' | 'medio' | 'alto';
  activeContractsCount: number;
  totalFinancialVolume: number;
  status: 'ativo' | 'homologacao' | 'bloqueado';
  statusReason?: string;
  syncDate?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  type: 'expiracao' | 'assinatura' | 'fornecedor' | 'risco_ia' | 'status';
  contractCode?: string;
  read: boolean;
  urgent?: boolean;
  badgeText?: string;
  actionText?: string;
}

export interface AuditFieldDiff {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

export interface AuditLog {
  id: string;
  user: string;
  userEmail?: string;
  role?: string;
  action: string;
  detail: string;
  resource?: string;
  resourceType?: 'contrato' | 'fornecedor' | 'seguranca' | 'sistema';
  resourceId?: string;
  ip?: string;
  location?: string;
  timestamp: string;
  date?: string;
  type: 'add' | 'permission' | 'warning' | 'security' | 'contract' | 'supplier' | 'update' | 'delete';
  severity?: 'baixo' | 'medio' | 'alto';
  changes?: AuditFieldDiff[];
  integrityHash?: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  keyFull?: string;
  environment: 'producao' | 'sandbox';
  scope: 'Leitura & Escrita' | 'Somente Consulta' | 'Assinaturas Digitais';
  createdAt: string;
  lastUsedAt: string;
  status: 'ativo' | 'revogado';
}

export interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  status: 'ativo' | 'pausado';
  lastDeliveryStatus: '200 OK' | '500 Error' | 'Pendente';
  lastDeliveryAt: string;
}

export interface UserAccountItem {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  status: 'ativo' | 'pendente' | 'bloqueado';
  twoFactorEnabled: boolean;
  lastLogin: string;
  jobTitle?: string;
  phone?: string;
  documentNumber?: string;
  matricula?: string;
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  department: string;
  jobTitle: string;
  role: UserRole;
  documentNumber: string;
  documentType: 'CPF' | 'OAB' | 'Matrícula';
  timezone: string;
  language: string;
  bio: string;
  twoFactorEnabled: boolean;
  icpCertificate: {
    status: 'ativo' | 'expirado' | 'pendente';
    type: 'e-CPF A1' | 'e-CPF A3' | 'e-CNPJ A1';
    issuer: string;
    serialNumber: string;
    validUntil: string;
    thumbprint: string;
  };
  signatureInitials: string;
  signatureStyle: 'rubrica_estilizada' | 'manuscrita' | 'certificado_digital';
  notifications: {
    emailAlerts: boolean;
    contractExpirationAlerts: boolean;
    statusChangeAlerts: boolean;
    aiRiskAlerts: boolean;
    weeklyDigest: boolean;
    browserPush: boolean;
  };
}

export interface IntegrationConnector {
  id: string;
  name: string;
  category: 'assinatura' | 'erp' | 'comunicacao' | 'storage' | 'receita' | 'email' | 'ia';
  icon: string;
  description: string;
  connected: boolean;
  statusText: string;
  lastSync?: string;
  latencyMs?: number;
}

export interface SystemSettings {
  notice30Days: boolean;
  notice60Days: boolean;
  signaturePending7Days: boolean;
  aiRiskInstantAlert: boolean;
  legalEmail: string;
  financeEmail: string;
  smtpStatus: 'conectado' | 'desconectado';
  slackWebhookStatus: 'ativo' | 'inativo';
  smsStatus: 'opcional' | 'ativo';
  // Security settings
  twoFactorRequired?: boolean;
  ssoEnabled?: boolean;
  sessionTimeoutMinutes?: number;
  ipWhitelistEnabled?: boolean;
  ipWhitelist?: string;
  passwordExpirationDays?: number;
  // General settings
  companyName?: string;
  companyCnpj?: string;
  contractPrefix?: string;
  currency?: string;
  timezone?: string;
  // Approval tiers
  tier1Limit?: number;
  tier2Limit?: number;
  requireDualSignatureAbove?: number;
  granularPermissions?: GranularPermission[];
  rbacMatrix: {
    module: string;
    subtext: string;
    admin: boolean;
    editor: boolean;
    visualizador: boolean | 'leitura';
  }[];
}
