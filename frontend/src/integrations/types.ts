/**
 * Types & Core Interfaces for Mais Contratos Enterprise Integrations
 * Grupo RioMais CLM Platform
 */

export type IntegrationCategory = 
  | 'receita'
  | 'assinatura'
  | 'erp'
  | 'comunicacao'
  | 'email'
  | 'storage'
  | 'ia';

export type IntegrationStatus = 'conectado' | 'desconectado' | 'erro' | 'sincronizando';

export interface IntegrationHealth {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  latencyMs?: number;
  lastCheckedAt: string;
  lastSyncAt?: string;
  endpointUrl?: string;
  details?: string;
  version?: string;
}

export interface IntegrationTestResult {
  success: boolean;
  message: string;
  latencyMs: number;
  timestamp: string;
  payload?: Record<string, unknown>;
  error?: string;
}

export interface IntegrationSyncResult {
  success: boolean;
  message: string;
  syncedRecords: number;
  timestamp: string;
  details?: Record<string, unknown>;
}
