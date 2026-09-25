export function renderContractExpirationTemplate(data: {
  contractCode: string;
  contractTitle: string;
  supplierName: string;
  daysRemaining: number;
  endDate: string;
  totalValueFormatted: string;
  recipientName?: string;
}): string {
  const isUrgent = data.daysRemaining <= 15;
  const statusColor = isUrgent ? '#e11d48' : '#2563eb';
  const badgeText = isUrgent ? 'URGENTE: VENCIMENTO IMINENTE' : 'AVISO PREVENTIVO DE VENCIMENTO';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Notificação de Contrato | Grupo RioMais</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <!-- Header -->
    <tr>
      <td style="background: #0b1c30; padding: 24px 32px; border-bottom: 3px solid ${statusColor};">
        <table width="100%">
          <tr>
            <td>
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Mais Contratos</h1>
              <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Governança Corporativa • Grupo RioMais</span>
            </td>
            <td align="right">
              <span style="background: ${statusColor}; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px;">${badgeText}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a;">Prezado(a) Gestor(a),</h2>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
          Informamos que o instrumento contratual abaixo atingiu o marco de controle de vigência e requer sua avaliação para renovação, repactuação ou encerramento formal:
        </p>

        <!-- Contract Details Card -->
        <table width="100%" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; padding: 16px;">
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #64748b; width: 140px;">Código do Contrato:</td>
            <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0051d5;">${data.contractCode}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #64748b;">Objeto / Título:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #0f172a;">${data.contractTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #64748b;">Fornecedor:</td>
            <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #0f172a;">${data.supplierName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #64748b;">Término da Vigência:</td>
            <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: ${statusColor};">${data.endDate} (${data.daysRemaining} dias restantes)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #64748b;">Valor Global:</td>
            <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #0f172a;">${data.totalValueFormatted}</td>
          </tr>
        </table>

        <!-- Call to Action -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 8px 0 24px 0;">
              <a href="https://maiscontratos.gruporiomais.com.br" style="background: #0051d5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                Acessar Painel de Contratos
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          Este é um alerta automático gerado pelo sistema <strong>Mais Contratos</strong> em conformidade com as políticas de governança e alçadas do Grupo RioMais.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #f1f5f9; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
        Grupo RioMais S.A. • Departamento Jurídico & Controladoria Corporativa<br>
        Ambiente de Notificação Integrada • Certificação de Entrega SMTP
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
