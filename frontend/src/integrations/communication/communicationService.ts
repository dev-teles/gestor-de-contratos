import { SlackClient } from './slackClient';
import { TeamsClient } from './teamsClient';
import { WebhookDispatcher } from './webhookDispatcher';
import { ContractAlertPayload, NotificationChannel, WebhookDeliveryLog } from './types';
import { IntegrationSyncResult, IntegrationTestResult } from '../types';

export class CommunicationService {
  private slack: SlackClient;
  private teams: TeamsClient;
  private webhooks: WebhookDispatcher;

  constructor() {
    this.slack = new SlackClient();
    this.teams = new TeamsClient();
    this.webhooks = new WebhookDispatcher();
  }

  async broadcastContractAlert(
    payload: ContractAlertPayload,
    channels: NotificationChannel[] = ['slack', 'teams']
  ): Promise<{ results: Array<{ channel: NotificationChannel; success: boolean; message: string }> }> {
    const results: Array<{ channel: NotificationChannel; success: boolean; message: string }> = [];

    if (channels.includes('slack')) {
      const res = await this.slack.sendAlert(payload);
      results.push({ channel: 'slack', success: res.success, message: res.message });
    }

    if (channels.includes('teams')) {
      const res = await this.teams.sendAlert(payload);
      results.push({ channel: 'teams', success: res.success, message: res.message });
    }

    return { results };
  }

  async dispatchWebhook(url: string, event: string, data: Record<string, unknown>): Promise<WebhookDeliveryLog> {
    return this.webhooks.dispatch(url, event, data);
  }

  async testConnection(channel: 'slack' | 'teams' = 'slack'): Promise<IntegrationTestResult> {
    if (channel === 'teams') {
      return this.teams.testConnection();
    }
    return this.slack.testConnection();
  }

  async syncChannels(): Promise<IntegrationSyncResult> {
    await new Promise((res) => setTimeout(res, 600));
    return {
      success: true,
      message: 'Canais de comunicação Slack (#contratos-riomais) e Teams sincronizados.',
      syncedRecords: 2,
      timestamp: new Date().toISOString(),
      details: {
        slackBotStatus: 'ONLINE',
        teamsCardListener: 'ACTIVE',
        activeSubscribersCount: 28,
      },
    };
  }
}

export const communicationService = new CommunicationService();
