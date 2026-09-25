import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, UserRole, Contract, AuditLog } from '../types';
import { ASSETS } from '../constants/assets';

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  currentRole: UserRole;
  contracts: Contract[];
  onAddAuditLog?: (log: Partial<AuditLog>) => void;
  onSimulateAlert?: (
    contract: Contract,
    triggerType: 'vencimento' | 'mudanca_status',
    options?: { customEmail?: string }
  ) => void;
  onNavigateTab?: (tab: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  onUpdateProfile,
  currentRole,
  contracts,
  onAddAuditLog,
  onSimulateAlert,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'dados_gerais' | 'assinatura_digital' | 'certificado_icp' | 'seguranca' | 'notificacoes'
  >('dados_gerais');

  // Form states for general data
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [avatarError, setAvatarError] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security tab states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Interactive Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(null);

  // Certificate test modal / state
  const [isTestingCertificate, setIsTestingCertificate] = useState(false);
  const [certificateTestResult, setCertificateTestResult] = useState<string | null>(null);

  // Synchronize when parent prop changes
  useEffect(() => {
    setFormData(userProfile);
  }, [userProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Canvas drawing handlers & state synchronization:
  // Se o usuário troca de aba, a tag <canvas> é desmontada.
  // Ao remontar a aba 'assinatura_digital', se houver assinatura fixada prévia (savedSignatureUrl),
  // nós a restauramos no canvas; caso contrário, garantimos hasDrawnSignature = false para que
  // o texto de ajuda seja exibido e o usuário não consiga salvar uma assinatura em branco.
  useEffect(() => {
    if (activeSubTab === 'assinatura_digital') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.strokeStyle = '#0051d5';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (savedSignatureUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          setHasDrawnSignature(true);
        };
        img.src = savedSignatureUrl;
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawnSignature(false);
      }
    } else {
      // Ao sair da aba sem fixar assinatura, limpa o estado de desenho fantasma
      if (!savedSignatureUrl) {
        setHasDrawnSignature(false);
      }
    }
  }, [activeSubTab, savedSignatureUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawnSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasDrawnSignature(false);
    setSavedSignatureUrl(null);
  };

  const handleFixSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawnSignature) {
      showToast('Por favor, desenhe sua assinatura no espaço indicado antes de fixar.');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Checagem de segurança para garantir que o canvas não está em branco
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasPixels = new Uint32Array(imageData.data.buffer).some((pixel) => pixel !== 0);

    if (!hasPixels) {
      setHasDrawnSignature(false);
      showToast('O espaço de assinatura está em branco. Desenhe sua assinatura com o cursor.');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    setSavedSignatureUrl(dataUrl);
    showToast('Assinatura manuscrita capturada e salva com sucesso!');

    if (onAddAuditLog) {
      onAddAuditLog({
        action: 'ASSINATURA_DIGITAL_CAPTURADA',
        detail: `Assinatura manuscrita capturada e registrada para ${formData.name}`,
        resource: formData.email,
        resourceType: 'sistema',
        type: 'security',
        severity: 'baixo',
      });
    }
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    onUpdateProfile(formData);

    if (onAddAuditLog) {
      onAddAuditLog({
        action: 'PERFIL_USUARIO_ATUALIZADO',
        detail: `Perfil de ${formData.name} atualizado (E-mail: ${formData.email}, Cargo: ${formData.jobTitle})`,
        resource: formData.email,
        resourceType: 'sistema',
        type: 'update',
        severity: 'baixo',
      });
    }

    showToast('Alterações do perfil salvas com sucesso!');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Por favor, informe a senha atual.');
      return;
    }
    if (newPassword.length < 8) {
      showToast('A nova senha deve possuir no mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('A confirmação de senha não confere com a nova senha.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess(true);
    showToast('Senha de acesso alterada com sucesso!');

    if (onAddAuditLog) {
      onAddAuditLog({
        action: 'SENHA_ALTERADA',
        detail: `Credenciais de acesso do usuário ${formData.email} renovadas com sucesso.`,
        resource: formData.email,
        resourceType: 'sistema',
        type: 'security',
        severity: 'medio',
      });
    }

    setTimeout(() => setPasswordSuccess(false), 5000);
  };

  const handleRunCertificateTest = () => {
    setIsTestingCertificate(true);
    setCertificateTestResult(null);

    setTimeout(() => {
      setIsTestingCertificate(false);
      setCertificateTestResult(
        `Assinatura criptográfica válida! Carimbo do tempo RFC-3161 gerado com sucesso pelo servidor de carimbo Certisign. Hash: SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}`
      );
      showToast('Certificado ICP-Brasil testado e homologado com sucesso!');
    }, 1200);
  };

  const handleTriggerTestAlert = () => {
    const targetContract = contracts[0];
    if (targetContract && onSimulateAlert) {
      onSimulateAlert(targetContract, 'vencimento', {
        customEmail: formData.email,
      });
      showToast(`Alerta de teste enviado para ${formData.email}!`);
    } else {
      showToast('Nenhum contrato disponível para teste.');
    }
  };

  const handleExportDataLgpd = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portabilidade_dados_lgpd_${formData.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exportação de dados pessoais (LGPD Art. 18) concluída!');
  };

  // Role details mapping
  const roleDisplay: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
    administrador: {
      label: 'Administrador Geral & CLO',
      color: 'text-[#0051d5]',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    editor: {
      label: 'Editor & Gestor Contratual',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    visualizador: {
      label: 'Visualizador & Auditor',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
  };

  const activeContractsCount = contracts.filter((c) => c.status === 'vigente').length;

  return (
    <div id="page-meu-perfil" className="flex-1 flex flex-col p-6 max-w-7xl w-full mx-auto gap-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0b1c30] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          <span className="text-[13px] font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Quick Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[12px] text-gray-500">
            <button
              onClick={() => onNavigateTab?.('dashboard')}
              className="hover:text-[#0051d5] transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">home</span>
              Dashboard
            </button>
            <span>/</span>
            <span className="text-[#0b1c30] font-semibold">Meu Perfil</span>
          </div>
          <h1 className="text-[24px] font-extrabold text-[#0b1c30] tracking-tight flex items-center gap-2.5">
            <span>Meu Perfil & Credenciais</span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0051d5] border border-blue-200">
              Assinador Verificado
            </span>
          </h1>
        </div>

        {/* Global CTAs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportDataLgpd}
            title="Exportar dados pessoais em JSON conforme LGPD Art. 18"
            className="h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-[12px] font-semibold hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-gray-500">download</span>
            <span>Portabilidade LGPD</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveProfile()}
            className="h-10 px-4 rounded-xl bg-[#0051d5] text-white text-[13px] font-semibold hover:bg-[#003ea8] flex items-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {/* Identity Hero Banner Card */}
      <div className="bg-white rounded-3xl border border-[#e5eeff] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden">
        {/* Subtle decorative background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50/80 via-transparent to-transparent pointer-events-none rounded-full blur-2xl" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* Avatar and Main Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative group">
              {!avatarError && formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.name}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-[#0051d5]/10 shadow-md transition-all group-hover:ring-[#0051d5]/40"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0051d5] to-[#0b1c30] text-white flex items-center justify-center font-bold text-2xl shadow-md">
                  {formData.signatureInitials || 'CM'}
                </div>
              )}
              {/* Online Indicator */}
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs" />

              {/* Quick change photo button */}
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute inset-0 rounded-2xl bg-black/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-[11px] font-medium backdrop-blur-xs"
                title="Alterar foto de perfil"
              >
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                <span>Alterar</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[20px] font-bold text-[#0b1c30] leading-tight">{formData.name}</h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                    roleDisplay[currentRole]?.bg || 'bg-blue-50'
                  } ${roleDisplay[currentRole]?.color || 'text-[#0051d5]'} ${
                    roleDisplay[currentRole]?.border || 'border-blue-200'
                  }`}
                >
                  {roleDisplay[currentRole]?.label || currentRole}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Conta Ativa
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-500">
                <span className="flex items-center gap-1 text-[#0b1c30] font-medium">
                  <span className="material-symbols-outlined text-[16px] text-[#0051d5]">badge</span>
                  {formData.jobTitle}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-gray-400">mail</span>
                  {formData.email}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-gray-400">domain</span>
                  {formData.department}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1 text-[12px] text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
                  Certificado ICP-Brasil {formData.icpCertificate.type} ({formData.icpCertificate.status})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-blue-600">fingerprint</span>
                  {formData.documentNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto shrink-0">
            <div className="p-3 bg-[#f8fafc] rounded-2xl border border-gray-100 flex flex-col gap-0.5 min-w-[110px]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Contratos</span>
              <span className="text-[18px] font-black text-[#0b1c30]">{contracts.length}</span>
              <span className="text-[10px] text-emerald-600 font-semibold">{activeContractsCount} vigentes</span>
            </div>

            <div className="p-3 bg-[#f8fafc] rounded-2xl border border-gray-100 flex flex-col gap-0.5 min-w-[110px]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">2FA / MFA</span>
              <span className="text-[18px] font-black text-emerald-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Ativo
              </span>
              <span className="text-[10px] text-gray-400 font-medium">TOTP App</span>
            </div>

            <div className="p-3 bg-[#f8fafc] rounded-2xl border border-gray-100 flex flex-col gap-0.5 min-w-[110px]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Alçada</span>
              <span className="text-[18px] font-black text-[#0051d5]">Tier 1</span>
              <span className="text-[10px] text-gray-400 font-medium">Assinatura Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e5eeff] overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveSubTab('dados_gerais')}
          className={`h-11 px-4 text-[13px] font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'dados_gerais'
              ? 'border-[#0051d5] text-[#0051d5]'
              : 'border-transparent text-gray-500 hover:text-[#0b1c30]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
          <span>Dados Pessoais & Cargo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('assinatura_digital')}
          className={`h-11 px-4 text-[13px] font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'assinatura_digital'
              ? 'border-[#0051d5] text-[#0051d5]'
              : 'border-transparent text-gray-500 hover:text-[#0b1c30]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">draw</span>
          <span>Rubrica & Assinatura Digital</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('certificado_icp')}
          className={`h-11 px-4 text-[13px] font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'certificado_icp'
              ? 'border-[#0051d5] text-[#0051d5]'
              : 'border-transparent text-gray-500 hover:text-[#0b1c30]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span>Certificado Digital ICP-Brasil</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('seguranca')}
          className={`h-11 px-4 text-[13px] font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'seguranca'
              ? 'border-[#0051d5] text-[#0051d5]'
              : 'border-transparent text-gray-500 hover:text-[#0b1c30]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">security</span>
          <span>Segurança & Sessões</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('notificacoes')}
          className={`h-11 px-4 text-[13px] font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'notificacoes'
              ? 'border-[#0051d5] text-[#0051d5]'
              : 'border-transparent text-gray-500 hover:text-[#0b1c30]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">notifications_active</span>
          <span>Preferências de Notificação</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DADOS GERAIS                                      */}
      {/* ======================================================== */}
      {activeSubTab === 'dados_gerais' && (
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Main Form */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">account_box</span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0b1c30]">Informações Cadastrais Corporativas</h3>
                    <p className="text-[11px] text-gray-500">
                      Identificação exibida em minutas, carimbos de auditoria e manifestações de aceite.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#0b1c30]">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#0b1c30]">E-mail Corporativo</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#0b1c30]">Cargo / Função</label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      className="h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#0b1c30]">Departamento / Área</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#0b1c30]">Telefone / Celular</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+55 (11) 98765-4321"
                      className="h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#0b1c30]">
                      Registro Profissional ({formData.documentType})
                    </label>
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      placeholder="ex: OAB/SP 412.980 ou CPF"
                      className="h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-2">
                  <label className="text-[12px] font-bold text-[#0b1c30]">Biografia & Competências</label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="p-3.5 rounded-xl border border-gray-200 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                    placeholder="Descreva brevemente suas atribuições jurídicas ou corporativas..."
                  />
                </div>
              </div>

              {/* Regional Preferences */}
              <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">language</span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0b1c30]">Preferências Regionais & Fuso Horário</h3>
                    <p className="text-[11px] text-gray-500">
                      Formatação de carimbos de tempo, moeda e idioma para exportação de minutas.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#0b1c30]">Fuso Horário Padrão</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] bg-white"
                    >
                      <option value="America/Sao_Paulo (UTC-03:00)">Brasília / São Paulo (UTC-03:00)</option>
                      <option value="America/Manaus (UTC-04:00)">Manaus (UTC-04:00)</option>
                      <option value="America/New_York (UTC-05:00)">New York (UTC-05:00)</option>
                      <option value="Europe/Lisbon (UTC+00:00)">Lisboa (UTC+00:00)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#0b1c30]">Idioma da Interface</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] bg-white"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (United States)</option>
                      <option value="es-ES">Español</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Aside Cards */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              {/* Card Papel & Acessos */}
              <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                    Papel Atribuído
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#0051d5]">shield_person</span>
                </div>
                <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#dce9ff] flex flex-col gap-1">
                  <span className="text-[14px] font-bold text-[#0051d5]">{roleDisplay[currentRole]?.label}</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Você possui autorização para homologar minutas, assinar digitalmente e gerenciar governança corporativa.
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                  <span>Gestor Responsável</span>
                  <span className="font-semibold text-[#0b1c30]">Diretoria Executiva</span>
                </div>
              </div>

              {/* Card Rubrica Rápida */}
              <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                    Rubrica Padrão
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('assinatura_digital')}
                    className="text-[11px] text-[#0051d5] font-semibold hover:underline"
                  >
                    Editar
                  </button>
                </div>
                <div className="h-20 rounded-xl bg-[#f8fafc] border border-dashed border-gray-300 flex items-center justify-center">
                  <span className="font-serif italic text-[32px] text-[#0051d5] tracking-widest select-none">
                    {formData.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 text-center">
                  Inserida automaticamente nas páginas intermediárias dos contratos assinados.
                </p>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#0051d5] text-white text-[13px] font-bold hover:bg-[#003ea8] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                <span>Salvar Informações</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 2: RUBRICA & ASSINATURA DIGITAL                      */}
      {/* ======================================================== */}
      {activeSubTab === 'assinatura_digital' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">draw</span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0b1c30]">Desenhar Assinatura Manuscrita</h3>
                    <p className="text-[11px] text-gray-500">
                      Utilize o mouse ou touchpad para desenhar sua assinatura manuscrita.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearCanvas}
                  className="h-8 px-3 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">refresh</span>
                  <span>Limpar</span>
                </button>
              </div>

              {/* Interactive Canvas Area */}
              <div className="relative rounded-2xl border-2 border-dashed border-[#0051d5]/30 bg-[#fbfdff] overflow-hidden p-2 flex flex-col items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={190}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair w-full max-w-full touch-none"
                />
                {!hasDrawnSignature && (
                  <div className="absolute pointer-events-none text-center text-gray-400 flex flex-col items-center gap-1">
                    <span className="material-symbols-outlined text-[28px] text-[#0051d5]/40">edit_note</span>
                    <span className="text-[12px] font-medium">Assine neste espaço com o cursor</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                  Conforme MP 2.200-2/2001 (Validade Jurídica Eletrônica)
                </span>
                <button
                  type="button"
                  id="btn-fixar-assinatura-manuscrita"
                  disabled={!hasDrawnSignature}
                  onClick={handleFixSignature}
                  className={`h-8 px-3.5 rounded-lg text-[12px] font-semibold transition-all ${
                    hasDrawnSignature
                      ? 'bg-[#0051d5] text-white hover:bg-[#003ea8] cursor-pointer shadow-xs active:scale-[0.98]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  Fixar Assinatura
                </button>
              </div>
            </div>

            {/* Estilos de Rubrica Tipográfica Alternativa */}
            <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <h3 className="text-[14px] font-bold text-[#0b1c30]">Estilo de Rubrica Tipográfica (Automática)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'rubrica_estilizada', font: 'font-serif italic', label: 'Elegante Clássico' },
                  { id: 'manuscrita', font: 'font-mono font-semibold', label: 'Técnico Moderno' },
                  { id: 'certificado_digital', font: 'font-sans font-bold tracking-widest', label: 'Selo ICP Oficial' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        signatureStyle: st.id as 'rubrica_estilizada' | 'manuscrita' | 'certificado_digital',
                      });
                      showToast(`Estilo de rubrica alterado para "${st.label}"`);
                    }}
                    className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                      formData.signatureStyle === st.id
                        ? 'border-[#0051d5] bg-blue-50/50 shadow-xs ring-1 ring-[#0051d5]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#0b1c30]">{st.label}</span>
                      {formData.signatureStyle === st.id && (
                        <span className="material-symbols-outlined text-[16px] text-[#0051d5]">check_circle</span>
                      )}
                    </div>
                    <div className="h-12 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                      <span className={`text-[18px] text-[#0051d5] ${st.font}`}>
                        {formData.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                  Pré-visualização do Carimbo em Contratos
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                  Válido ICP
                </span>
              </div>

              {/* Mock contract document page */}
              <div className="p-4 bg-[#f8fafc] rounded-xl border border-gray-200/80 flex flex-col gap-3 font-sans">
                <div className="h-2 w-28 bg-gray-300 rounded" />
                <div className="h-1.5 w-full bg-gray-200 rounded" />
                <div className="h-1.5 w-4/5 bg-gray-200 rounded" />

                {/* The Signature Box */}
                <div className="mt-4 p-3.5 bg-white rounded-xl border border-blue-200 shadow-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>ASSINADO DIGITALMENTE POR:</span>
                    <span className="font-mono text-[9px]">ID: 88C6-CLM</span>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <div className="w-10 h-10 rounded-lg bg-[#0051d5] text-white flex items-center justify-center font-serif text-lg font-bold shrink-0">
                      {formData.signatureInitials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-bold text-[#0b1c30] leading-tight truncate">
                        {formData.name}
                      </span>
                      <span className="text-[10px] text-gray-500 truncate">
                        {formData.jobTitle} • {formData.documentNumber}
                      </span>
                    </div>
                  </div>

                  {savedSignatureUrl && (
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-medium">Assinatura Gráfica Capturada:</span>
                      <img
                        src={savedSignatureUrl}
                        alt="Assinatura manuscrita capturada"
                        className="h-8 max-w-[140px] object-contain"
                      />
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex flex-col gap-1 text-[9px] text-gray-500 font-mono">
                    <div>DATA/HORA: {new Date().toLocaleDateString('pt-BR')} às 14:30:00 UTC-03:00</div>
                    <div>AUTORIDADE: Certisign ICP-Brasil v5</div>
                    <div className="truncate text-blue-700">HASH: SHA256-4F9C218A77330BEE1289D456FE78AB19</div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                Este carimbo criptográfico é gravado nos metadados do PDF com conformidade ICP-Brasil e PAdES (PDF Advanced Electronic Signatures).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CERTIFICADO DIGITAL ICP-BRASIL                    */}
      {/* ======================================================== */}
      {activeSubTab === 'certificado_icp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Certificado Ativo Card */}
            <div className="bg-white rounded-2xl border border-[#e5eeff] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[28px]">verified</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[17px] font-bold text-[#0b1c30]">
                        Certificado Digital ICP-Brasil ({formData.icpCertificate.type})
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Ativo & Conforme
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500">
                      Habilitado para assinaturas qualificadas com valor jurídico pleno.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunCertificateTest}
                  disabled={isTestingCertificate}
                  className="h-9 px-3.5 rounded-xl bg-blue-50 text-[#0051d5] hover:bg-blue-100 text-[12px] font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <span className={`material-symbols-outlined text-[18px] ${isTestingCertificate ? 'animate-spin' : ''}`}>
                    {isTestingCertificate ? 'sync' : 'network_check'}
                  </span>
                  <span>{isTestingCertificate ? 'Testando...' : 'Testar Assinatura'}</span>
                </button>
              </div>

              {certificateTestResult && (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[12px] text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">check_circle</span>
                  <span className="leading-relaxed font-medium">{certificateTestResult}</span>
                </div>
              )}

              {/* Certificate Technical Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-gray-100 flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    Autoridade Certificadora (AC)
                  </span>
                  <span className="text-[13px] font-semibold text-[#0b1c30]">{formData.icpCertificate.issuer}</span>
                </div>

                <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-gray-100 flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    Validade da Chave Privada
                  </span>
                  <span className="text-[13px] font-semibold text-emerald-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">event_available</span>
                    Até {new Date(formData.icpCertificate.validUntil).toLocaleDateString('pt-BR')} (2 anos restantes)
                  </span>
                </div>

                <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-gray-100 flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    Número de Série (Hex)
                  </span>
                  <span className="text-[12px] font-mono text-gray-700">{formData.icpCertificate.serialNumber}</span>
                </div>

                <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-gray-100 flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    Tipo do Certificado
                  </span>
                  <span className="text-[13px] font-semibold text-[#0b1c30]">
                    Pessoa Física A1 (Software PKCS#12)
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-1 font-mono text-[11px] text-gray-600">
                <span className="font-bold text-gray-700">Digital Thumbprint (SHA-256):</span>
                <span className="break-all text-[#0051d5]">{formData.icpCertificate.thumbprint}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-3">
              <span className="text-[12px] font-bold text-[#0b1c30]">Renovação ou Novo Certificado</span>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Você pode importar um novo arquivo `.pfx` ou conectar um token criptográfico físico (A3) para atualizar sua credencial de assinatura.
              </p>
              <button
                type="button"
                onClick={() => showToast('Seletor de certificado PKCS#12 aberto.')}
                className="w-full h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-bold text-[#0b1c30] flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px] text-[#0051d5]">upload_file</span>
                <span>Importar Certificado .PFX</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SEGURANÇA & SESSÕES                               */}
      {/* ======================================================== */}
      {activeSubTab === 'seguranca' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Alterar Senha Card */}
            <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#0b1c30]">Alteração de Senha</h3>
                  <p className="text-[11px] text-gray-500">Mantenha sua conta corporativa protegida com uma senha forte.</p>
                </div>
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-[12px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Sua senha foi alterada com sucesso!</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-gray-600">Senha Atual</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-600">Nova Senha</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-600">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-[#0051d5] text-white text-[12px] font-bold hover:bg-[#003ea8] transition-colors"
                >
                  Atualizar Senha
                </button>
              </div>
            </form>

            {/* Sessões Ativas Card */}
            <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">devices</span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0b1c30]">Sessões Ativas & Dispositivos</h3>
                    <p className="text-[11px] text-gray-500">Aparelhos conectados no momento à sua conta Mais Contratos (Grupo RioMais).</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => showToast('Todas as outras sessões foram desconectadas!')}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
                >
                  Encerrar outras sessões
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="p-3 rounded-xl bg-[#f8fafc] border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[22px] text-[#0051d5]">laptop_mac</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#0b1c30]">Google Chrome no macOS</span>
                        <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                          Esta sessão
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500">Rio de Janeiro, Brasil • IP 189.40.12.98</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">Ativo agora</span>
                </div>

                <div className="p-3 rounded-xl bg-[#f8fafc] border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[22px] text-gray-500">phone_iphone</span>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#0b1c30]">Mais Contratos Mobile App (iOS)</span>
                      <span className="text-[11px] text-gray-500">São Paulo, Brasil • Há 2 horas</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Sessão mobile revogada com sucesso!')}
                    className="text-[11px] text-gray-400 hover:text-red-600 font-semibold"
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* 2FA Card */}
            <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
                  Autenticação em Dois Fatores (2FA)
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ativado
                </span>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 flex flex-col gap-2">
                <span className="text-[12px] font-bold text-[#0051d5]">Aplicativo Autenticador Vinculado</span>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Códigos de 6 dígitos gerados via Google Authenticator ou 1Password são solicitados em cada novo login corporativo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => showToast('Chaves de recuperação de 2FA geradas e enviadas para seu e-mail.')}
                className="h-9 px-3 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px] text-[#0051d5]">key</span>
                <span>Visualizar Códigos de Backup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: NOTIFICAÇÕES PESSOAIS                             */}
      {/* ======================================================== */}
      {activeSubTab === 'notificacoes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-[15px] font-bold text-[#0b1c30]">Canais e Alertas Direcionados a Você</h3>
                  <p className="text-[11px] text-gray-500">
                    Defina quais notificações você deseja receber no seu endereço corporativo ({formData.email}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerTestAlert}
                  className="h-9 px-3.5 rounded-xl bg-blue-50 text-[#0051d5] hover:bg-blue-100 text-[12px] font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
                  <span>Disparar Alerta de Teste</span>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  {
                    key: 'contractExpirationAlerts',
                    title: 'Avisos de Vencimento de Contratos Atribuídos',
                    sub: 'Alertas automáticos com 30, 15 e 7 dias de antecedência do término da vigência.',
                    icon: 'hourglass_bottom',
                  },
                  {
                    key: 'statusChangeAlerts',
                    title: 'Mudança de Status Contratual',
                    sub: 'Notificações imediatas quando um contrato passar para Vigente, Expirado ou Sem Assinatura.',
                    icon: 'sync_alt',
                  },
                  {
                    key: 'aiRiskAlerts',
                    title: 'Alertas Críticos de Compliance & IA Jurídica',
                    sub: 'Avisos de cláusulas abusivas, fornecedores em risco fiscal ou SLA descumprido.',
                    icon: 'psychology',
                  },
                  {
                    key: 'weeklyDigest',
                    title: 'Relatório Executivo Semanal Consolidado',
                    sub: 'Resumo entregue toda segunda-feira com saving, volumetria e renovações da semana.',
                    icon: 'newspaper',
                  },
                  {
                    key: 'browserPush',
                    title: 'Notificações Push no Navegador',
                    sub: 'Alertas no canto da tela quando contratos forem aprovados ou assinados.',
                    icon: 'desktop_windows',
                  },
                ].map((item) => {
                  const isChecked =
                    formData.notifications[item.key as keyof typeof formData.notifications] ?? true;
                  return (
                    <div
                      key={item.key}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            [item.key]: !isChecked,
                          },
                        });
                      }}
                      className="p-3.5 rounded-xl border border-gray-200/80 hover:border-gray-300 bg-white flex items-center justify-between gap-4 cursor-pointer transition-all select-none"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0051d5] flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-[#0b1c30]">{item.title}</span>
                          <span className="text-[11px] text-gray-500 leading-relaxed">{item.sub}</span>
                        </div>
                      </div>

                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
                          isChecked ? 'bg-[#0051d5]' : 'bg-gray-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                            isChecked ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveProfile()}
                  className="h-10 px-5 rounded-xl bg-[#0051d5] text-white text-[12px] font-bold hover:bg-[#003ea8] transition-colors shadow-sm"
                >
                  Salvar Preferências
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Trocar Foto de Perfil */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[16px] font-bold text-[#0b1c30]">Alterar Foto de Perfil</h3>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[12px] font-bold text-[#0b1c30]">URL da Imagem</label>
              <input
                type="url"
                value={customAvatarUrl}
                onChange={(e) => setCustomAvatarUrl(e.target.value)}
                placeholder="https://exemplo.com/minha-foto.jpg"
                className="h-10 px-3.5 rounded-xl border border-gray-300 text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
              />

              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                Ou selecione um avatar corporativo padrão:
              </span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Foto Oficial', url: ASSETS.carlosAvatar },
                  { label: 'Alternativo 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
                  { label: 'Alternativo 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
                ].map((opt) => (
                  <div
                    key={opt.label}
                    onClick={() => {
                      setFormData({ ...formData, avatarUrl: opt.url });
                      setAvatarError(false);
                      setIsAvatarModalOpen(false);
                      showToast('Foto de perfil atualizada!');
                    }}
                    className="p-2 rounded-xl border border-gray-200 hover:border-[#0051d5] hover:bg-blue-50/50 cursor-pointer flex flex-col items-center gap-1.5 transition-all text-center"
                  >
                    <img src={opt.url} alt={opt.label} className="w-14 h-14 rounded-full object-cover shadow-xs" />
                    <span className="text-[11px] font-semibold text-[#0b1c30]">{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="h-9 px-4 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (customAvatarUrl.trim()) {
                    setFormData({ ...formData, avatarUrl: customAvatarUrl.trim() });
                    setAvatarError(false);
                    setIsAvatarModalOpen(false);
                    showToast('Foto de perfil atualizada!');
                  }
                }}
                className="h-9 px-4 rounded-xl bg-[#0051d5] text-white text-[12px] font-bold hover:bg-[#003ea8]"
              >
                Aplicar URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
