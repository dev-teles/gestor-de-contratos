/**
 * Mais Contratos - Enterprise Integrations Hub
 * Grupo RioMais CLM Platform
 *
 * Módulos de Integração:
 * 1. receita-federal - Consulta de CNPJ, Sintegra, CNAE e Compliance Societário
 * 2. signatures - DocuSign & Clicksign (ICP-Brasil, Envelopes Digitais)
 * 3. erp - SAP S/4HANA & TOTVS Protheus (Purchase Orders, Centros de Custo)
 * 4. communication - Slack & Microsoft Teams (Block Kit, Adaptive Cards, Webhooks)
 * 5. email - SMTP & SendGrid (Templates RioMais, Avisos de Vencimento)
 * 6. storage - Google Workspace & SharePoint (Repositório, Integridade SHA-256)
 * 7. gemini - Google Gemini Legal AI (Análise de Cláusulas, Multas, SLA, Q&A)
 */

export * from './types';
export * from './manager';

// Sub-módulos dedicados
export * as ReceitaFederalIntegration from './receita-federal';
export * as SignaturesIntegration from './signatures';
export * as ErpIntegration from './erp';
export * as CommunicationIntegration from './communication';
export * as EmailIntegration from './email';
export * as StorageIntegration from './storage';
export * as GeminiIntegration from './gemini';

// Instâncias prontas para uso direto
export { receitaFederalService } from './receita-federal';
export { signaturesService } from './signatures';
export { erpSyncService } from './erp';
export { communicationService } from './communication';
export { emailService } from './email';
export { storageService } from './storage';
export { geminiService } from './gemini';
export { integrationsManager } from './manager';
