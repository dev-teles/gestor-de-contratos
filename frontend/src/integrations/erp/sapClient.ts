import { PurchaseOrder, ContractFinancialMetric } from './types';
import { IntegrationTestResult } from '../types';

export interface SapConfig {
  baseUrl?: string;
  client?: string; // Ex: '100' ou '400'
  companyCode?: string; // Ex: 'BR10' (Grupo RioMais)
  environment?: 'producao' | 'qa' | 'sandbox';
}

export class SapClient {
  private config: SapConfig;

  constructor(config: SapConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://sap-gateway.gruporiomais.corp/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV',
      client: config.client || '100',
      companyCode: config.companyCode || 'RIO1',
      environment: config.environment || 'sandbox',
      ...config,
    };
  }

  async fetchPurchaseOrder(contractCode: string): Promise<PurchaseOrder | null> {
    // Simula consulta de PO no SAP S/4HANA
    return {
      poNumber: `45000${Math.floor(10000 + Math.random() * 90000)}`,
      contractCode,
      supplierCnpj: '23.412.348/0001-90',
      costCenter: 'CC-TI-0102',
      totalAmount: 120000,
      consumedAmount: 45000,
      remainingAmount: 75000,
      currency: 'BRL',
      status: 'aprovado',
      createdAt: '2025-01-15T10:00:00Z',
    };
  }

  async getFinancialMetric(contractCode: string): Promise<ContractFinancialMetric> {
    return {
      contractCode,
      erpReferenceId: `SAP-PO-45000891`,
      system: 'sap',
      totalContractValue: 240000,
      invoicedValue: 80000,
      pendingPaymentValue: 20000,
      lastMeasurementDate: '10/05/2025',
      nextPaymentDate: '15/06/2025',
      status: 'regular',
    };
  }

  async testConnection(): Promise<IntegrationTestResult> {
    const start = performance.now();
    await new Promise((res) => setTimeout(res, 350));
    return {
      success: true,
      message: 'Conexão estabelecida com SAP S/4HANA (OData Service: API_PURCHASEORDER_PROCESS_SRV).',
      latencyMs: Math.round(performance.now() - start),
      timestamp: new Date().toISOString(),
      payload: {
        system: 'SAP S/4HANA 2023',
        companyCode: this.config.companyCode,
        client: this.config.client,
        status: 'CONNECTED',
      },
    };
  }
}
