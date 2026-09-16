import React, { useState } from 'react';
import { ASSETS } from '../constants/assets';
import { UserRole } from '../types';

interface LoginViewProps {
  onLogin: (credentials: { email: string; password: string; role: UserRole; name: string }) => void;
  defaultEmail?: string;
}

// Preset corporate accounts for fast review and testing
const PRESET_ACCOUNTS: Array<{
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  department: string;
  avatarInitials: string;
  badgeColor: string;
}> = [
  {
    name: 'Lucas Teles',
    email: 'lucas.teles@gruporiomais.com.br',
    role: 'administrador',
    roleLabel: 'Admin',
    department: 'Diretoria Jurídica & Governança',
    avatarInitials: 'LT',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    name: 'Ana Beatriz Souza',
    email: 'ana.souza@gruporiomais.com.br',
    role: 'editor',
    roleLabel: 'Editor',
    department: 'Controladoria & Suprimentos',
    avatarInitials: 'AS',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    name: 'Marcos Vinícius Pires',
    email: 'marcos.pires@gruporiomais.com.br',
    role: 'visualizador',
    roleLabel: 'Viewer',
    department: 'Auditoria & Compliance',
    avatarInitials: 'MP',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, defaultEmail = '' }) => {
  const [email, setEmail] = useState(defaultEmail || 'lucas.teles@gruporiomais.com.br');
  const [password, setPassword] = useState('rioMais@2025');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [logoError, setLogoError] = useState(false);

  // Validation & feedback state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySubmitted, setRecoverySubmitted] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');

  const validateForm = (): boolean => {
    let isValid = true;

    // Email validation
    if (!email.trim()) {
      setEmailError('O e-mail corporativo é obrigatório.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Informe um endereço de e-mail válido.');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Password validation
    if (!password.trim()) {
      setPasswordError('A senha de acesso é obrigatória.');
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError('A senha deve conter no mínimo 4 caracteres.');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate brief secure authentication handshake
    setTimeout(() => {
      // Find if email matches known user or determine role
      const matchedUser = PRESET_ACCOUNTS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      const assignedRole: UserRole = matchedUser ? matchedUser.role : 'administrador';
      const assignedName = matchedUser
        ? matchedUser.name
        : email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      onLogin({
        email: email.trim(),
        password: password.trim(),
        role: assignedRole,
        name: assignedName,
      });

      setIsSubmitting(false);
    }, 450);
  };

  const handleSelectPreset = (preset: typeof PRESET_ACCOUNTS[0]) => {
    setEmail(preset.email);
    setPassword('rioMais@2025');
    setEmailError('');
    setPasswordError('');
  };

  const handleOpenForgotPassword = () => {
    setRecoveryEmail(email || '');
    setRecoverySubmitted(false);
    setRecoveryError('');
    setIsForgotPasswordOpen(true);
  };

  const handleSendRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail.trim())) {
      setRecoveryError('Por favor, informe um e-mail corporativo válido para recuperação.');
      return;
    }

    const token = `AUTH-REC-${Math.floor(100000 + Math.random() * 900000)}`;
    setRecoveryToken(token);
    setRecoverySubmitted(true);
    setRecoveryError('');
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9ff] flex flex-col justify-between relative overflow-hidden selection:bg-[#0051d5]/20 selection:text-[#0051d5]">
      {/* Subtle geometric background accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#eff4ff] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-80" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-[#e5eeff]/70 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none opacity-80" />

      {/* Top Brand Bar */}
      <header className="w-full h-16 px-6 sm:px-12 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {!logoError ? (
            <img
              src={ASSETS.logo}
              alt="Mais Contratos Logo"
              className="h-8 w-auto object-contain shrink-0"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#0051d5] flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[17px] font-bold text-[#0b1c30] tracking-tight leading-tight">
              Mais Contratos
            </span>
            <span className="text-[10px] text-[#76777d] uppercase tracking-wider font-semibold">
              Grupo RioMais
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#5a6275] bg-white/80 border border-[#e5eeff] px-3 py-1.5 rounded-full shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Ambiente Seguro Corporativo</span>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-[440px]">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
            {/* Header / Intro */}
            <div className="mb-6 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#eff4ff] text-[#0051d5] text-[11px] font-bold tracking-wide uppercase mb-3">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Portal de Acesso Restrito
              </div>
              <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
                Entrar na sua conta
              </h1>
              <p className="text-sm text-[#5a6275] mt-1.5">
                Informe suas credenciais para gerenciar contratos, fornecedores e conformidade.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* E-mail Field */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-[#0b1c30] uppercase tracking-wider mb-1.5"
                >
                  E-mail Corporativo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#76777d]">
                    <span className="material-symbols-outlined text-[19px]">mail</span>
                  </div>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="nome.sobrenome@gruporiomais.com.br"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-white border text-sm rounded-xl text-[#0b1c30] placeholder-[#94a3b8] transition-all focus:outline-none focus:ring-2 ${
                      emailError
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
                        : 'border-[#d0ddef] focus:border-[#0051d5] focus:ring-[#0051d5]/15'
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[#0b1c30] uppercase tracking-wider"
                  >
                    Senha de Acesso <span className="text-rose-500">*</span>
                  </label>
                  {/* Botão Esqueci a Senha */}
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-xs font-semibold text-[#0051d5] hover:text-[#003ea8] hover:underline transition-colors focus:outline-none"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#76777d]">
                    <span className="material-symbols-outlined text-[19px]">lock</span>
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-11 py-2.5 bg-white border text-sm rounded-xl text-[#0b1c30] placeholder-[#94a3b8] transition-all focus:outline-none focus:ring-2 ${
                      passwordError
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
                        : 'border-[#d0ddef] focus:border-[#0051d5] focus:ring-[#0051d5]/15'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#76777d] hover:text-[#0b1c30] transition-colors focus:outline-none"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#5a6275] select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#cbd5e1] text-[#0051d5] focus:ring-[#0051d5]"
                  />
                  <span>Lembrar meu acesso neste dispositivo</span>
                </label>
              </div>

              {/* Botão de Enviar */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-[#0051d5] hover:bg-[#0041ab] active:bg-[#003893] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#0051d5]/20 hover:shadow-lg hover:shadow-[#0051d5]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Autenticando sessão...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Accounts Selection */}
            <div className="mt-6 pt-5 border-t border-[#f0f4fc]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
                  Atalhos de Acesso Rápido
                </span>
                <span className="text-[10px] text-[#94a3b8]">Clique para preencher</span>
              </div>
              <div className="space-y-1.5">
                {PRESET_ACCOUNTS.map((acc) => {
                  const isSelected = email.toLowerCase() === acc.email.toLowerCase();
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleSelectPreset(acc)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all border ${
                        isSelected
                          ? 'bg-[#eff4ff] border-[#0051d5]/30 shadow-xs'
                          : 'bg-white hover:bg-[#f8f9ff] border-gray-100 hover:border-[#d0ddef]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#131b2e] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                          {acc.avatarInitials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[#0b1c30] truncate">
                              {acc.name}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${acc.badgeColor}`}
                            >
                              {acc.roleLabel}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#76777d] truncate">
                            {acc.department}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-[#76777d] shrink-0">
                        login
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Security & ICP Badge Footer */}
          <div className="mt-5 text-center text-xs text-[#76777d] flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 font-medium text-[11px] text-[#5a6275]">
              <span className="material-symbols-outlined text-[15px] text-[#0051d5]">verified_user</span>
              <span>Conexão Segura TLS 1.3 • ICP-Brasil • Trilha de Auditoria</span>
            </div>
            <p className="text-[10px] text-[#94a3b8]">
              Acesso monitorado em conformidade com as diretrizes de governança do Grupo RioMais.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#94a3b8] border-t border-[#e5eeff]/60 bg-white/50 backdrop-blur-xs z-10">
        © {new Date().getFullYear()} Grupo RioMais • Mais Contratos CLM. Todos os direitos reservados.
      </footer>

      {/* Modal: Esqueci a Senha */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-2xl max-w-md w-full p-6 sm:p-7 relative animate-in zoom-in-95 duration-150">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fechar"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {!recoverySubmitted ? (
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[24px]">lock_reset</span>
                </div>
                <h3 className="text-lg font-bold text-[#0b1c30]">
                  Recuperar Senha de Acesso
                </h3>
                <p className="text-xs text-[#5a6275] mt-1.5 leading-relaxed">
                  Digite seu e-mail institucional do Grupo RioMais. Nós enviaremos um link de
                  redefinição criptografado e um protocolo temporário de validação.
                </p>

                <form onSubmit={handleSendRecovery} className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="recovery-email"
                      className="block text-xs font-semibold text-[#0b1c30] uppercase tracking-wider mb-1.5"
                    >
                      E-mail Institucional
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#76777d]">
                        <span className="material-symbols-outlined text-[18px]">mail</span>
                      </div>
                      <input
                        id="recovery-email"
                        type="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="seu.email@gruporiomais.com.br"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#d0ddef] text-sm rounded-xl text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/15"
                      />
                    </div>
                    {recoveryError && (
                      <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {recoveryError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#0051d5] hover:bg-[#0041ab] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Enviar Link de Recuperação</span>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-[26px]">mark_email_read</span>
                </div>
                <h3 className="text-lg font-bold text-[#0b1c30]">
                  Instruções Enviadas!
                </h3>
                <p className="text-xs text-[#5a6275] mt-2 leading-relaxed">
                  Um e-mail com as diretrizes de redefinição e carimbo de segurança foi enviado para:
                </p>
                <div className="mt-2.5 px-3 py-2 bg-[#f8f9ff] border border-[#e5eeff] rounded-xl text-xs font-semibold text-[#0051d5] break-all">
                  {recoveryEmail}
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 text-left">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">token</span>
                    Protocolo Corporativo Provisório:
                  </div>
                  <code className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold text-amber-900">
                    {recoveryToken}
                  </code>
                  <p className="mt-1 text-amber-800/80">
                    Válido por 30 minutos. Caso não receba em 3 minutos, verifique a pasta de quarentena.
                  </p>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="w-full py-2.5 bg-[#0051d5] hover:bg-[#0041ab] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Voltar para o Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
