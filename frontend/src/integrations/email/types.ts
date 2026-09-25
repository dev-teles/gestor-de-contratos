export type EmailTemplateType = 
  | 'aviso_vencimento' 
  | 'mudanca_status' 
  | 'solicitacao_assinatura' 
  | 'alerta_risco_compliance'
  | 'resumo_semanal';

export interface EmailDispatchOptions {
  to: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  htmlContent: string;
  templateType?: EmailTemplateType;
  metadata?: Record<string, unknown>;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId: string;
  recipient: string;
  smtpStatus: string;
  dispatchedAt: string;
  latencyMs: number;
}
