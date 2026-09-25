import React, { useState, useEffect, useRef, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { SimulatedAlertEmail } from '../utils/alertSimulator';

interface SimulatedAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertEmail: SimulatedAlertEmail | null;
  onSendAnother?: () => void;
}

export const SimulatedAlertModal: React.FC<SimulatedAlertModalProps> = ({
  isOpen,
  onClose,
  alertEmail,
  onSendAnother,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'headers' | 'payload'>('preview');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [copyError, setCopyError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  // Limpeza de timers para prevenir vazamento de memória e setState em componente desmontado
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  // Limpa timers e reseta estados temporários quando o modal for fechado
  useEffect(() => {
    if (!isOpen) {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      setCopyStatus('idle');
      setCopyError(null);
    }
  }, [isOpen]);

  // Acessibilidade: fechar ao pressionar a tecla Escape (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Acessibilidade: mover foco para o botão de fechamento ao abrir
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Segurança (XSS): sanitização rigorosa do HTML do e-mail com DOMPurify
  const sanitizedHtml = useMemo(() => {
    if (!alertEmail?.htmlContent) return '';
    return DOMPurify.sanitize(alertEmail.htmlContent, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'applet'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
    });
  }, [alertEmail?.htmlContent]);

  if (!isOpen || !alertEmail) return null;

  // Tratamento assíncrono e resiliente para área de transferência
  const handleCopy = async () => {
    const textToCopy = `Assunto: ${alertEmail.subject}\nPara: ${alertEmail.to}\nCC: ${alertEmail.cc.join(', ')}\nData: ${alertEmail.dispatchedAt}\n\nResumo:\n${alertEmail.summaryText}`;

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function' && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        setCopyStatus('copied');
        setCopyError(null);
      } else {
        // Fallback para navegadores sem Clipboard API ou sem contexto seguro
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setCopyStatus('copied');
          setCopyError(null);
        } else {
          throw new Error('Falha ao copiar com execCommand');
        }
      }
    } catch (err) {
      console.warn('Erro ao copiar dados para a área de transferência:', err);
      setCopyStatus('error');
      setCopyError('Não foi possível copiar automaticamente.');
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setCopyError(null);
      }, 3500);
    }

    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => {
      setCopyStatus((prev) => (prev === 'copied' ? 'idle' : prev));
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop com clique para fechar */}
      <div
        className="fixed inset-0 bg-[#0b1c30]/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card com atributos semânticos de acessibilidade */}
      <div
        id="modal-simulated-alert"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-simulated-alert-title"
        className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-[#e5eeff] overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header with SMTP Status */}
        <div className="bg-[#0b1c30] text-white p-5 sm:px-6 flex items-start justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <span className="material-symbols-outlined text-[24px]">outgoing_mail</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="modal-simulated-alert-title"
                  className="text-[16px] font-bold text-white tracking-tight"
                >
                  Simulação de Disparo de Alerta por E-mail
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  SMTP 250 OK • Entregue
                </span>
              </div>
              <p className="text-[12px] text-gray-300 mt-0.5">
                Alerta transacional disparado com base nas regras do contrato{' '}
                <strong className="text-white font-mono">{alertEmail.contractCode}</strong>
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
            title="Fechar Modal (Esc)"
            aria-label="Fechar Modal de Alerta"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Envelope Metadata Bar */}
        <div className="bg-[#f8fafc] border-b border-gray-200 px-6 py-3.5 flex flex-col gap-2 text-[12px]">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
            <div className="sm:col-span-2 text-gray-500 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">mail</span>
              <span>Para (To):</span>
            </div>
            <div className="sm:col-span-10 flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-[#0051d5] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                {alertEmail.to}
              </span>
              <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                E-mail de Notificação Configurado
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
            <div className="sm:col-span-2 text-gray-500 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">group</span>
              <span>Cópia (CC):</span>
            </div>
            <div className="sm:col-span-10 text-gray-700 font-mono text-[11px]">
              {alertEmail.cc.join(', ')}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
            <div className="sm:col-span-2 text-gray-500 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">subject</span>
              <span>Assunto:</span>
            </div>
            <div className="sm:col-span-10 text-[#0b1c30] font-bold">
              {alertEmail.subject}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
            <div className="sm:col-span-2 font-medium">Gatilho / Data:</div>
            <div className="sm:col-span-10 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1 text-gray-700">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {alertEmail.dispatchedAt}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-semibold text-purple-700">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                {alertEmail.triggerType === 'vencimento'
                  ? `Vencimento Iminente (${alertEmail.daysRemaining} dias restantes)`
                  : `Alteração de Status (${alertEmail.previousStatus} → ${alertEmail.newStatus})`}
              </span>
              <span>•</span>
              <span className="text-gray-400 font-mono text-[10px]">
                ID: {alertEmail.smtpMessageId}
              </span>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center justify-between px-6 pt-3 pb-0 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-2 text-[12px] font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'border-[#0051d5] text-[#0051d5]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Corpo do E-mail (HTML)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('headers')}
              className={`px-3.5 py-2 text-[12px] font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'headers'
                  ? 'border-[#0051d5] text-[#0051d5]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">code</span>
              <span>Headers SMTP & Diagnóstico</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payload')}
              className={`px-3.5 py-2 text-[12px] font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'payload'
                  ? 'border-[#0051d5] text-[#0051d5]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">data_object</span>
              <span>JSON da Notificação</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {copyError && (
              <span className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md animate-in fade-in">
                {copyError}
              </span>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className={`h-8 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                copyStatus === 'copied'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : copyStatus === 'error'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-transparent'
              }`}
              title={copyError || 'Copiar resumo do e-mail para a área de transferência'}
              aria-label={
                copyStatus === 'copied'
                  ? 'E-mail copiado com sucesso'
                  : copyStatus === 'error'
                  ? 'Erro ao copiar e-mail'
                  : 'Copiar informações do e-mail'
              }
            >
              <span className="material-symbols-outlined text-[15px]">
                {copyStatus === 'copied'
                  ? 'check'
                  : copyStatus === 'error'
                  ? 'error'
                  : 'content_copy'}
              </span>
              <span>
                {copyStatus === 'copied'
                  ? 'Copiado!'
                  : copyStatus === 'error'
                  ? 'Erro ao copiar'
                  : 'Copiar E-mail'}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto max-h-[50vh] bg-slate-50/50">
          {activeTab === 'preview' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                className="prose prose-sm max-w-none"
              />

              {/* Action notice at footer */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
                  Certificado DKIM e SPF verificados pelo servidor de e-mail corporativo
                </span>
                <span className="font-mono text-[10px] text-gray-400">
                  Ref: {alertEmail.contractId}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="p-4 bg-gray-900 text-gray-100 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto">
              <div className="text-emerald-400 mb-2"># Conexão SMTP Estabelecida</div>
              <div>Connected to smtp.internal.gruporiomais.com.br:587</div>
              <div>&lt; 220 smtp.internal.gruporiomais.com.br ESMTP Postfix</div>
              <div>&gt; EHLO webapp.clm.cluster.local</div>
              <div>&lt; 250-smtp.internal.gruporiomais.com.br</div>
              <div>&lt; 250-STARTTLS</div>
              <div>&lt; 250 OK</div>
              <div>&gt; MAIL FROM: &lt;{alertEmail.replyTo}&gt;</div>
              <div>&lt; 250 2.1.0 Ok</div>
              <div>&gt; RCPT TO: &lt;{alertEmail.to}&gt;</div>
              <div>&lt; 250 2.1.5 Ok</div>
              {alertEmail.cc.map((ccEmail) => (
                <React.Fragment key={ccEmail}>
                  <div>&gt; RCPT TO: &lt;{ccEmail}&gt;</div>
                  <div>&lt; 250 2.1.5 Ok</div>
                </React.Fragment>
              ))}
              <div>&gt; DATA</div>
              <div>&lt; 354 End data with &lt;CR&gt;&lt;LF&gt;.&lt;CR&gt;&lt;LF&gt;</div>
              <div className="text-gray-400 my-2">
                <div>Message-ID: {alertEmail.smtpMessageId}</div>
                <div>Date: {new Date().toUTCString()}</div>
                <div>From: &quot;Mais Contratos | Grupo RioMais&quot; &lt;{alertEmail.replyTo}&gt;</div>
                <div>To: &lt;{alertEmail.to}&gt;</div>
                <div>Subject: {alertEmail.subject}</div>
                <div>X-Priority: {alertEmail.priority === 'urgente' ? '1 (Highest)' : '2 (High)'}</div>
                <div>X-Contract-Code: {alertEmail.contractCode}</div>
                <div>X-Trigger: {alertEmail.triggerType}</div>
              </div>
              <div className="text-emerald-400">&lt; 250 2.0.0 Ok: queued as 4X8m9P2l8Z9948</div>
              <div>&gt; QUIT</div>
              <div>&lt; 221 2.0.0 Bye</div>
            </div>
          )}

          {activeTab === 'payload' && (
            <pre className="p-4 bg-gray-900 text-purple-300 rounded-2xl font-mono text-[11px] overflow-x-auto leading-relaxed">
              {JSON.stringify(alertEmail, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[12px] text-gray-600">
              Disparo computado na <strong>Central de Notificações</strong> e registrado na{' '}
              <strong>Trilha de Auditoria</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onSendAnother && (
              <button
                type="button"
                onClick={onSendAnother}
                className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12px] font-bold transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Testar Outro Disparo</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-5 rounded-xl bg-[#0051d5] hover:bg-[#003ea8] text-white text-[12px] font-bold shadow-md shadow-blue-500/10 transition-all"
            >
              Entendido / Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
