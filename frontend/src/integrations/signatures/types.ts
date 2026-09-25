export type SignatureProvider = 'docusign' | 'clicksign';

export type SignatureAuthMethod = 
  | 'email_token' 
  | 'sms_token' 
  | 'whatsapp_token' 
  | 'certificado_icp_brasil_a1' 
  | 'certificado_icp_brasil_a3';

export interface EnvelopeSigner {
  id?: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  role: 'signatario' | 'testemunha' | 'aprovador' | 'observador';
  authMethod: SignatureAuthMethod;
  order?: number;
  signedAt?: string;
  status: 'pendente' | 'assinado' | 'recusado';
}

export interface CreateEnvelopeRequest {
  contractCode: string;
  contractTitle: string;
  documentName: string;
  documentBase64?: string;
  signers: EnvelopeSigner[];
  deadlineDays?: number;
  message?: string;
  autoRemindDays?: number;
  icpRequired?: boolean;
}

export interface EnvelopeResponse {
  envelopeId: string;
  provider: SignatureProvider;
  contractCode: string;
  status: 'rascunho' | 'enviado' | 'em_andamento' | 'concluido' | 'cancelado';
  createdAt: string;
  expiresAt: string;
  signers: EnvelopeSigner[];
  auditTrailHash?: string;
  signingUrl?: string;
}

export interface SignatureWebhookEvent {
  event: 'envelope_created' | 'envelope_sent' | 'signer_signed' | 'envelope_completed' | 'envelope_declined';
  envelopeId: string;
  provider: SignatureProvider;
  timestamp: string;
  data: Record<string, unknown>;
}
