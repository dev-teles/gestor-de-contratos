import { Contract, ContractStatus, NotificationItem, AuditLog } from '../types';

export interface SimulatedAlertEmail {
  id: string;
  to: string;
  cc: string[];
  replyTo: string;
  subject: string;
  contractId: string;
  contractCode: string;
  contractTitle: string;
  supplierName: string;
  triggerType: 'vencimento' | 'mudanca_status';
  previousStatus?: ContractStatus;
  newStatus?: ContractStatus;
  daysRemaining?: number;
  dispatchedAt: string;
  smtpStatus: string;
  smtpMessageId: string;
  priority: 'alta' | 'media' | 'urgente';
  summaryText: string;
  htmlContent: string;
}

export interface SimulateAlertResult {
  simulatedEmail: SimulatedAlertEmail;
  notification: NotificationItem;
  auditLog: Partial<AuditLog>;
}

const STATUS_LABELS: Record<ContractStatus, string> = {
  vigente: 'Vigente',
  avencer: 'A Vencer',
  sem_assinatura: 'Pendente de Assinatura',
  expirado: 'Expirado',
};

/**
 * Generates a full transactional alert simulation for contract expiration or status change.
 */
export function simulateContractAlert(
  contract: Contract,
  triggerType: 'vencimento' | 'mudanca_status',
  options?: {
    newStatus?: ContractStatus;
    daysRemaining?: number;
    customRecipientEmail?: string;
  }
): SimulateAlertResult {
  const recipientEmail =
    options?.customRecipientEmail ||
    contract.notificationEmail ||
    'gestor.contratos@empresa.com.br';

  const now = new Date();
  const formattedTime = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const formattedDate = now.toLocaleDateString('pt-BR');
  const timestampFull = `${formattedDate} às ${formattedTime}`;
  const messageId = `<CLM-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@gruporiomais.internal>`;

  if (triggerType === 'vencimento') {
    const days = options?.daysRemaining ?? contract.remainingDays ?? 30;
    const isUrgent = days <= 15;
    const priority = isUrgent ? 'urgente' : 'alta';

    const subject = `[MAIS CONTRATOS - VENCIMENTO] Contrato ${contract.code} expira em ${days} dias (${contract.supplierName})`;
    const summaryText = `O contrato ${contract.code} do Grupo RioMais atingiu o marco de aviso de vencimento. Restam ${days} dias para o encerramento do prazo de vigência (${contract.endDate}).`;

    const simulatedEmail: SimulatedAlertEmail = {
      id: `alert-${Date.now()}`,
      to: recipientEmail,
      cc: ['juridico@gruporiomais.com.br', 'controladoria.contratos@gruporiomais.com.br'],
      replyTo: 'alertas@maiscontratos.com.br',
      subject,
      contractId: contract.id,
      contractCode: contract.code,
      contractTitle: contract.title,
      supplierName: contract.supplierName,
      triggerType: 'vencimento',
      daysRemaining: days,
      dispatchedAt: timestampFull,
      smtpStatus: '250 2.0.0 OK: Message queued for delivery',
      smtpMessageId: messageId,
      priority,
      summaryText,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b;">
          <div style="border-bottom: 2px solid #0051d5; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #0b1c30; margin: 0;">Mais Contratos • Grupo RioMais • Alerta Preventivo de Vencimento</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Notificação automatizada do módulo de gestão contratual</p>
          </div>
          <div style="background-color: ${isUrgent ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${isUrgent ? '#dc2626' : '#d97706'}; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px;">
            <strong style="color: ${isUrgent ? '#991b1b' : '#92400e'}; font-size: 14px;">Atenção: Término de Vigência Iminente</strong>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: ${isUrgent ? '#b91c1c' : '#b45309'};">
              Faltam apenas <strong>${days} dias</strong> para o vencimento deste instrumento (Data limite: ${contract.endDate}).
            </p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;">Código do Instrumento:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${contract.code}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Objeto / Título:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${contract.title}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Fornecedor Contratado:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${contract.supplierName} (${contract.supplierCnpj})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Valor Global:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0051d5;">R$ ${contract.totalValue.toLocaleString('pt-BR')},00</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Vigência:</td>
              <td style="padding: 6px 0; color: #0f172a;">${contract.startDate} até ${contract.endDate}</td>
            </tr>
          </table>
          <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; color: #475569;">
            <strong>Próximos passos recomendados:</strong>
            <ul style="margin: 6px 0 0 0; padding-left: 18px;">
              <li>Verificar necessidade de termo aditivo de prorrogação ou reajuste de IPCA/IGP-M.</li>
              <li>Homologar avaliação de desempenho com a área requisitante.</li>
              <li>Formalizar intenção de renovação ou notificação de encerramento contratual.</li>
            </ul>
          </div>
        </div>
      `,
    };

    const notification: NotificationItem = {
      id: `notif-alert-exp-${Date.now()}`,
      title: `Alerta de Vencimento: ${contract.code} (${days} dias restantes)`,
      description: `E-mail disparado com sucesso para ${recipientEmail}. Faltam ${days} dias para o término do contrato com ${contract.supplierName}.`,
      timeAgo: 'Agora',
      type: 'expiracao',
      contractCode: contract.code,
      read: false,
      urgent: isUrgent,
      badgeText: `${days} dias para expirar`,
      actionText: 'Ver contrato →',
    };

    const auditLog: Partial<AuditLog> = {
      action: 'ALERTA_VENCIMENTO_DISPARADO',
      detail: `Alerta de vencimento (${days} dias restantes) disparado via e-mail para ${recipientEmail}`,
      resource: contract.code,
      resourceType: 'contrato',
      resourceId: contract.id,
      type: 'warning',
      severity: isUrgent ? 'alto' : 'medio',
      changes: [
        { field: 'notificationEmail', label: 'E-mail de Notificação', oldValue: '—', newValue: recipientEmail },
        { field: 'remainingDays', label: 'Dias Restantes', oldValue: `${contract.remainingDays} dias`, newValue: `${days} dias` },
        { field: 'alertSubject', label: 'Assunto do E-mail', oldValue: '—', newValue: subject },
      ],
    };

    return { simulatedEmail, notification, auditLog };
  } else {
    // Mudança de status
    const prevStatus = contract.status;
    const newStatus = options?.newStatus || 'avencer';
    const prevLabel = STATUS_LABELS[prevStatus] || prevStatus;
    const newLabel = STATUS_LABELS[newStatus] || newStatus;

    const subject = `[ALERTA CLM - STATUS] Contrato ${contract.code} alterado para "${newLabel.toUpperCase()}"`;
    const summaryText = `O status do contrato ${contract.code} foi alterado de ${prevLabel} para ${newLabel}. Notificação enviada ao gestor responsável.`;

    const isExpirado = newStatus === 'expirado';
    const isAvencer = newStatus === 'avencer';
    const priority = isExpirado ? 'urgente' : isAvencer ? 'alta' : 'media';

    const simulatedEmail: SimulatedAlertEmail = {
      id: `alert-status-${Date.now()}`,
      to: recipientEmail,
      cc: ['juridico@gruporiomais.com.br', 'auditoria.interna@gruporiomais.com.br'],
      replyTo: 'alertas@maiscontratos.com.br',
      subject,
      contractId: contract.id,
      contractCode: contract.code,
      contractTitle: contract.title,
      supplierName: contract.supplierName,
      triggerType: 'mudanca_status',
      previousStatus: prevStatus,
      newStatus,
      dispatchedAt: timestampFull,
      smtpStatus: '250 2.0.0 OK: Message queued for delivery',
      smtpMessageId: messageId,
      priority,
      summaryText,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b;">
          <div style="border-bottom: 2px solid #0051d5; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="color: #0b1c30; margin: 0;">Mais Contratos • Grupo RioMais • Notificação de Mudança de Status</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Atualização de ciclo de vida contratual registrada</p>
          </div>
          <div style="background-color: #eff4ff; border-left: 4px solid #0051d5; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px;">
            <strong style="color: #003ea8; font-size: 14px;">Alteração de Status Homologada</strong>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #1e40af;">
              O status do contrato passou de <strong>${prevLabel}</strong> para <span style="background: #0051d5; color: white; padding: 2px 8px; border-radius: 12px; font-weight: bold;">${newLabel}</span>.
            </p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;">Código do Instrumento:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${contract.code}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Objeto / Título:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${contract.title}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Fornecedor:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${contract.supplierName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Novo Status:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0051d5;">${newLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Destinatário Notificado:</td>
              <td style="padding: 6px 0; color: #0f172a;">${recipientEmail}</td>
            </tr>
          </table>
          <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; color: #475569;">
            <strong>Impacto operacional:</strong>
            <p style="margin: 4px 0 0 0;">
              As regras de faturamento, renovação e SLA foram ajustadas conforme a nova classificação do instrumento.
            </p>
          </div>
        </div>
      `,
    };

    const notification: NotificationItem = {
      id: `notif-alert-status-${Date.now()}`,
      title: `Mudança de Status: ${contract.code} → ${newLabel}`,
      description: `Status alterado de "${prevLabel}" para "${newLabel}". Alerta despachado para ${recipientEmail}.`,
      timeAgo: 'Agora',
      type: 'status',
      contractCode: contract.code,
      read: false,
      urgent: isExpirado,
      badgeText: `Novo: ${newLabel}`,
      actionText: 'Ver contrato →',
    };

    const auditLog: Partial<AuditLog> = {
      action: 'STATUS_CONTRATO_ALTERADO',
      detail: `Status do contrato ${contract.code} alterado de "${prevLabel}" para "${newLabel}" com alerta enviado para ${recipientEmail}`,
      resource: contract.code,
      resourceType: 'contrato',
      resourceId: contract.id,
      type: 'contract',
      severity: isExpirado ? 'alto' : 'medio',
      changes: [
        { field: 'status', label: 'Status do Instrumento', oldValue: prevLabel, newValue: newLabel },
        { field: 'notificationEmail', label: 'E-mail de Notificação', oldValue: '—', newValue: recipientEmail },
        { field: 'alertSubject', label: 'Assunto do E-mail', oldValue: '—', newValue: subject },
      ],
    };

    return { simulatedEmail, notification, auditLog };
  }
}
