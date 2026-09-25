export interface ContractClauseAnalysis {
  clauseNumber: string;
  clauseTitle: string;
  category: 'multa_rescisoria' | 'sla' | 'reajuste_indice' | 'confidencialidade' | 'foro' | 'renovacao_automatica';
  riskScore: 'baixo' | 'medio' | 'alto';
  summary: string;
  recommendation: string;
}

export interface ContractAiAnalysisResult {
  contractCode: string;
  executiveSummary: string;
  overallRiskLevel: 'baixo' | 'medio' | 'alto';
  riskScoreNumeric: number; // 0 a 100
  keyClauses: ContractClauseAnalysis[];
  criticalAlerts: string[];
  slaGuarantees: string[];
  penaltySummary: string;
  autoRenewalTrapDetected: boolean;
  analyzedAt: string;
  modelUsed: string;
}

export interface ContractQuestionAnswer {
  question: string;
  answer: string;
  relevantClauses: string[];
  confidence: number;
  timestamp: string;
}
