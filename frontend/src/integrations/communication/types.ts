export type NotificationChannel = 'slack' | 'teams' | 'custom_webhook';

export interface ContractAlertPayload {
  contractCode: string;
  contractTitle: string;
  supplierName: string;
  daysRemaining: number;
  totalValue: number;
  status: string;
  urgency: 'baixa' | 'media' | 'alta' | 'critica';
  actionUrl?: string;
  responsibleEmail?: string;
}

export interface SlackBlockMessage {
  text: string;
  blocks: Array<Record<string, unknown>>;
}

export interface TeamsAdaptiveCardMessage {
  type: 'message';
  attachments: Array<{
    contentType: 'application/vnd.microsoft.card.adaptive';
    content: Record<string, unknown>;
  }>;
}

export interface WebhookDeliveryLog {
  id: string;
  targetUrl: string;
  event: string;
  statusCode: number;
  statusText: string;
  durationMs: number;
  timestamp: string;
  payload: Record<string, unknown>;
  signatureHash?: string;
}
