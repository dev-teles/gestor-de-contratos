export type ErpSystem = 'sap' | 'totvs';

export interface PurchaseOrder {
  poNumber: string;
  contractCode: string;
  supplierCnpj: string;
  costCenter: string;
  totalAmount: number;
  consumedAmount: number;
  remainingAmount: number;
  currency: string;
  status: 'aprovado' | 'em_aprovacao' | 'encerrado' | 'bloqueado';
  createdAt: string;
}

export interface CostCenter {
  code: string;
  name: string;
  department: string;
  manager: string;
  budgetLimit: number;
  currentExpense: number;
}

export interface ContractFinancialMetric {
  contractCode: string;
  erpReferenceId: string;
  system: ErpSystem;
  totalContractValue: number;
  invoicedValue: number;
  pendingPaymentValue: number;
  lastMeasurementDate?: string;
  nextPaymentDate?: string;
  status: 'regular' | 'atrasado' | 'em_auditoria';
}

export interface ErpSyncSummary {
  system: ErpSystem;
  totalSyncedPOs: number;
  totalFinancialVolume: number;
  lastSyncTimestamp: string;
  discrepanciesFound: number;
}
