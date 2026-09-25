import React, { useState, useMemo } from 'react';
import { UserAccountItem, UserRole, AuditLog } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface CollaboratorsViewProps {
  users: UserAccountItem[];
  onAddUser: (user: UserAccountItem) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onToggleUserStatus?: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
  currentRole: UserRole;
  onLogAudit?: (log: AuditLog) => void;
}

const DEPARTMENTS = [
  'Diretoria Jurídica & Governança',
  'Controladoria e Suprimentos',
  'Auditoria e Compliance',
  'Engenharia e Obras',
  'Tecnologia e Operações',
  'Recursos Humanos',
  'Financeiro & Tesouraria',
  'Diretoria Executiva',
];

export const CollaboratorsView: React.FC<CollaboratorsViewProps> = ({
  users,
  onAddUser,
  onUpdateUserRole,
  onToggleUserStatus,
  onDeleteUser,
  currentRole,
  onLogAudit,
}) => {
  const isAdmin = currentRole === 'administrador';

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | UserRole>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'pendente' | 'bloqueado'>('todos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State for New Collaborator
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Diretoria Jurídica & Governança');
  const [jobTitle, setJobTitle] = useState('');
  const [matricula, setMatricula] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('editor');
  const [sendActivationEmail, setSendActivationEmail] = useState(true);
  const [require2FA, setRequire2FA] = useState(true);

  // Role Edit & Delete Modals
  const [userToEditRole, setUserToEditRole] = useState<UserAccountItem | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserAccountItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mask formatting
  const handleCpfChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 3) setDocumentNumber(raw);
    else if (raw.length <= 6) setDocumentNumber(`${raw.slice(0, 3)}.${raw.slice(3)}`);
    else if (raw.length <= 9) setDocumentNumber(`${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`);
    else setDocumentNumber(`${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`);
  };

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) setPhone(raw ? `(${raw}` : '');
    else if (raw.length <= 7) setPhone(`(${raw.slice(0, 2)}) ${raw.slice(2)}`);
    else setPhone(`(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`);
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'administrador').length;
    const editors = users.filter((u) => u.role === 'editor').length;
    const viewers = users.filter((u) => u.role === 'visualizador').length;
    const active2FA = users.filter((u) => u.twoFactorEnabled).length;
    const pending = users.filter((u) => u.status === 'pendente').length;
    return { total, admins, editors, viewers, active2FA, pending };
  }, [users]);

  // Filtered Collaborators
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.jobTitle && u.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.matricula && u.matricula.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = roleFilter === 'todos' || u.role === roleFilter;
      const matchStatus = statusFilter === 'todos' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleOpenAddModal = () => {
    if (!isAdmin) {
      showToast('Acesso negado: Somente administradores têm permissão para cadastrar novos colaboradores.');
      return;
    }
    // Generate suggested registration number
    const randomNum = Math.floor(100 + Math.random() * 900);
    setMatricula(`RIO-${randomNum}`);
    setIsAddModalOpen(true);
  };

  const handleCreateCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Ação restrita: Somente Administradores podem registrar novos colaboradores.');
      return;
    }

    if (!name.trim()) {
      showToast('Por favor, informe o nome completo do colaborador.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      showToast('Por favor, informe um e-mail corporativo válido.');
      return;
    }

    // Check duplicate email
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      showToast('Já existe um colaborador cadastrado com este e-mail corporativo.');
      return;
    }

    const newUser: UserAccountItem = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      department,
      jobTitle: jobTitle.trim() || 'Especialista Corporativo',
      matricula: matricula.trim() || `RIO-${Math.floor(1000 + Math.random() * 9000)}`,
      documentNumber: documentNumber.trim() || '—',
      phone: phone.trim() || '—',
      role: selectedRole,
      status: sendActivationEmail ? 'pendente' : 'ativo',
      twoFactorEnabled: require2FA,
      lastLogin: 'Ainda não acessou',
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };

    onAddUser(newUser);

    // Audit log
    if (onLogAudit) {
      onLogAudit({
        id: `aud-${Date.now()}`,
        user: 'Lucas Teles (Admin)',
        userEmail: 'lucas.teles@gruporiomais.com.br',
        role: 'Administrador Geral',
        action: 'NOVO_COLABORADOR_CADASTRADO',
        detail: `Colaborador ${newUser.name} (${newUser.email}) registrado com papel ${newUser.role.toUpperCase()} no departamento ${newUser.department}.`,
        resource: `Colaborador ${newUser.email}`,
        resourceType: 'seguranca',
        ip: '189.40.72.112',
        location: 'São Paulo, Brasil',
        timestamp: 'Agora mesmo',
        type: 'security',
        severity: newUser.role === 'administrador' ? 'alto' : 'baixo',
      });
    }

    setIsAddModalOpen(false);
    resetForm();
    showToast(`Colaborador ${newUser.name} registrado com sucesso!`);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setDepartment('Diretoria Jurídica & Governança');
    setJobTitle('');
    setMatricula('');
    setDocumentNumber('');
    setPhone('');
    setSelectedRole('editor');
    setSendActivationEmail(true);
    setRequire2FA(true);
  };

  const handleConfirmRoleChange = (newRole: UserRole) => {
    if (!userToEditRole || !isAdmin) return;

    onUpdateUserRole(userToEditRole.id, newRole);

    if (onLogAudit) {
      onLogAudit({
        id: `aud-${Date.now()}`,
        user: 'Lucas Teles (Admin)',
        userEmail: 'lucas.teles@gruporiomais.com.br',
        role: 'Administrador Geral',
        action: 'ALCADA_COLABORADOR_ATUALIZADA',
        detail: `Alçada do colaborador ${userToEditRole.name} alterada de ${userToEditRole.role.toUpperCase()} para ${newRole.toUpperCase()}.`,
        resource: `Colaborador ${userToEditRole.email}`,
        resourceType: 'seguranca',
        ip: '189.40.72.112',
        location: 'São Paulo, Brasil',
        timestamp: 'Agora mesmo',
        type: 'security',
        severity: newRole === 'administrador' ? 'alto' : 'baixo',
      });
    }

    showToast(`Alçada de ${userToEditRole.name} alterada para ${newRole.toUpperCase()}.`);
    setUserToEditRole(null);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete || !isAdmin || !onDeleteUser) return;

    onDeleteUser(userToDelete.id);

    if (onLogAudit) {
      onLogAudit({
        id: `aud-${Date.now()}`,
        user: 'Lucas Teles (Admin)',
        userEmail: 'lucas.teles@gruporiomais.com.br',
        role: 'Administrador Geral',
        action: 'COLABORADOR_REMOVIDO',
        detail: `Acesso do colaborador ${userToDelete.name} (${userToDelete.email}) revogado permanentemente.`,
        resource: `Colaborador ${userToDelete.email}`,
        resourceType: 'seguranca',
        ip: '189.40.72.112',
        location: 'São Paulo, Brasil',
        timestamp: 'Agora mesmo',
        type: 'security',
        severity: 'alto',
      });
    }

    showToast(`Acesso do colaborador ${userToDelete.name} revogado com sucesso.`);
    setUserToDelete(null);
  };

  const handleExportCsv = () => {
    const headers = 'ID;Nome;Email;Departamento;Cargo;Matricula;Documento;Papel;Status;2FA;CriadoEm;UltimoLogin\n';
    const rows = filteredUsers
      .map(
        (u) =>
          `"${u.id}";"${u.name}";"${u.email}";"${u.department}";"${u.jobTitle || ''}";"${u.matricula || ''}";"${u.documentNumber || ''}";"${u.role}";"${u.status}";"${u.twoFactorEnabled ? 'Sim' : 'Não'}";"${u.createdAt || ''}";"${u.lastLogin}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `colaboradores_riomais_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exportação da base de colaboradores gerada com sucesso!');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="material-symbols-outlined text-[13px]">shield_person</span>
            Administrador
          </span>
        );
      case 'editor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="material-symbols-outlined text-[13px]">edit_note</span>
            Editor
          </span>
        );
      case 'visualizador':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="material-symbols-outlined text-[13px]">visibility</span>
            Visualizador
          </span>
        );
    }
  };

  const getStatusBadge = (status: 'ativo' | 'pendente' | 'bloqueado') => {
    switch (status) {
      case 'ativo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Ativo
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Convite Pendente
          </span>
        );
      case 'bloqueado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Bloqueado
          </span>
        );
    }
  };

  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarBg = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white';
      case 'editor':
        return 'bg-gradient-to-br from-blue-600 to-cyan-700 text-white';
      case 'visualizador':
        return 'bg-gradient-to-br from-amber-500 to-orange-600 text-white';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-gray-700 transition-all animate-bounce">
          <span className="material-symbols-outlined text-blue-400 text-[20px]">info</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Non-Admin Security Notice Banner */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-900">
                Acesso em Modo de Consulta ({currentRole.toUpperCase()})
              </p>
              <p className="text-[11px] text-amber-700">
                Por política de governança e alçadas do Grupo RioMais,{' '}
                <strong>somente Administradores têm permissão para registrar e editar colaboradores</strong>.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-200/60 text-amber-800 text-[10px] font-bold shrink-0">
            Ação Restrita
          </span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">badge</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Gestão e Registro de Colaboradores
              </h1>
              <p className="text-xs text-gray-500">
                Controle centralizado de alçadas, credenciais e onboarding da equipe RioMais
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Exportar CSV</span>
          </button>

          {/* Primary Action Button: Protected for Admins only */}
          {isAdmin ? (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-[#0051d5] hover:bg-[#0040a8] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all hover:shadow hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Novo Colaborador</span>
            </button>
          ) : (
            <div className="relative group">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold flex items-center gap-2 cursor-not-allowed border border-gray-200"
                title="Apenas administradores podem registrar novos colaboradores"
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Novo Colaborador</span>
              </button>
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex w-64 p-2 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl z-50 text-center leading-tight">
                Apenas Administradores podem registrar novos colaboradores na plataforma.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Total
          </span>
          <span className="text-2xl font-bold text-gray-900">{metrics.total}</span>
          <span className="text-[10px] text-gray-400 block mt-0.5">colaboradores</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-purple-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider block mb-1">
            Administradores
          </span>
          <span className="text-2xl font-bold text-purple-700">{metrics.admins}</span>
          <span className="text-[10px] text-purple-500 block mt-0.5">governança total</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block mb-1">
            Editores
          </span>
          <span className="text-2xl font-bold text-blue-700">{metrics.editors}</span>
          <span className="text-[10px] text-blue-500 block mt-0.5">gestão contratual</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block mb-1">
            Visualizadores
          </span>
          <span className="text-2xl font-bold text-amber-700">{metrics.viewers}</span>
          <span className="text-[10px] text-amber-500 block mt-0.5">somente consulta</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
            2FA Ativado
          </span>
          <span className="text-2xl font-bold text-emerald-700">{metrics.active2FA}</span>
          <span className="text-[10px] text-emerald-500 block mt-0.5">com duplo fator</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Pendentes
          </span>
          <span className="text-2xl font-bold text-amber-600">{metrics.pending}</span>
          <span className="text-[10px] text-gray-400 block mt-0.5">onboarding</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail, departamento, cargo ou matrícula..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5] transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-gray-500 font-medium">Papel:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'todos' | UserRole)}
              className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
            >
              <option value="todos">Todos os Papéis</option>
              <option value="administrador">Administradores</option>
              <option value="editor">Editores</option>
              <option value="visualizador">Visualizadores</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-gray-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'todos' | 'ativo' | 'pendente' | 'bloqueado')}
              className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="pendente">Pendentes</option>
              <option value="bloqueado">Bloqueados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collaborators Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Colaborador</th>
                <th className="py-3.5 px-4">Departamento & Cargo</th>
                <th className="py-3.5 px-4">Alçada (Papel)</th>
                <th className="py-3.5 px-4">Status & 2FA</th>
                <th className="py-3.5 px-4">Último Acesso</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <span className="material-symbols-outlined text-[36px] text-gray-300 block mb-2">
                      person_off
                    </span>
                    <p className="font-medium text-gray-600">Nenhum colaborador encontrado</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Ajuste os termos de busca ou filtros aplicados.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Collaborator Identification */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${getAvatarBg(
                            user.role
                          )}`}
                        >
                          {getInitials(user.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.matricula && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-600">
                                {user.matricula}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department & Role */}
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-gray-800">{user.department}</p>
                      <p className="text-[11px] text-gray-500">{user.jobTitle || 'Especialista'}</p>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <div>{getRoleBadge(user.role)}</div>
                        {user.createdAt && (
                          <span className="text-[10px] text-gray-400">Cadastrado: {user.createdAt}</span>
                        )}
                      </div>
                    </td>

                    {/* Status & 2FA */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <div>{getStatusBadge(user.status)}</div>
                        <div className="flex items-center gap-1 text-[11px]">
                          {user.twoFactorEnabled ? (
                            <span className="text-emerald-600 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[13px]">verified_user</span>
                              2FA Ativo
                            </span>
                          ) : (
                            <span className="text-gray-400 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[13px]">gpp_maybe</span>
                              2FA Inativo
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4">
                      <p className="text-gray-700 font-medium">{user.lastLogin}</p>
                      <p className="text-[10px] text-gray-400">
                        {user.documentNumber ? `Doc: ${user.documentNumber}` : 'Doc: Não informado'}
                      </p>
                    </td>

                    {/* Actions: Full access for Admin, Read-only indicator for others */}
                    <td className="py-3.5 px-4 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setUserToEditRole(user)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Alterar alçada / papel funcional"
                          >
                            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                          </button>

                          {onToggleUserStatus && (
                            <button
                              type="button"
                              onClick={() => {
                                onToggleUserStatus(user.id);
                                showToast(
                                  `Status de ${user.name} alterado para ${
                                    user.status === 'ativo' ? 'Bloqueado' : 'Ativo'
                                  }.`
                                );
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                user.status === 'ativo'
                                  ? 'hover:bg-amber-50 text-gray-500 hover:text-amber-600'
                                  : 'hover:bg-emerald-50 text-emerald-600'
                              }`}
                              title={user.status === 'ativo' ? 'Bloquear acesso' : 'Reativar colaborador'}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {user.status === 'ativo' ? 'block' : 'check_circle'}
                              </span>
                            </button>
                          )}

                          {onDeleteUser && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(user)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Revogar credencial / Excluir"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Somente Leitura</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTRAR NOVO COLABORADOR (EXCLUSIVO PARA ADMINISTRADORES) */}
      {isAddModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">person_add</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Registrar Novo Colaborador</h2>
                  <p className="text-xs text-gray-500">
                    Defina credenciais, departamento e a alçada de acesso na plataforma RioMais
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCollaborator} className="p-6 flex flex-col gap-5">
              {/* Row 1: Nome & E-mail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Dra. Mariana Vasconcelos"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    E-mail Corporativo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mariana.vasconcelos@gruporiomais.com.br"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                  />
                </div>
              </div>

              {/* Row 2: Departamento & Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Departamento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Ex: Advogada Sênior de Contratos"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                  />
                </div>
              </div>

              {/* Row 3: Matrícula, CPF & Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Matrícula Funcional
                  </label>
                  <input
                    type="text"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                    placeholder="RIO-0890"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    CPF (Documento)
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Telefone Corporativo / Ramal
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0051d5]/20 focus:border-[#0051d5]"
                  />
                </div>
              </div>

              {/* Row 4: Seleção de Papel Funcional (RBAC) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Alçada de Acesso ao Sistema <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Administrador */}
                  <div
                    onClick={() => setSelectedRole('administrador')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedRole === 'administrador'
                        ? 'border-purple-600 bg-purple-50/50 shadow-sm ring-2 ring-purple-600/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="material-symbols-outlined text-purple-700 text-[18px]">
                        shield_person
                      </span>
                      <span className="text-xs font-bold text-purple-900">Administrador</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-snug">
                      Governança total: cadastra colaboradores, gerencia chaves, configurações e auditoria.
                    </p>
                  </div>

                  {/* Editor */}
                  <div
                    onClick={() => setSelectedRole('editor')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedRole === 'editor'
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-600/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="material-symbols-outlined text-blue-700 text-[18px]">
                        edit_note
                      </span>
                      <span className="text-xs font-bold text-blue-900">Editor</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-snug">
                      Elaboração e edição de minutas, contratos, aditivos e despacho de assinaturas.
                    </p>
                  </div>

                  {/* Visualizador */}
                  <div
                    onClick={() => setSelectedRole('visualizador')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedRole === 'visualizador'
                        ? 'border-amber-600 bg-amber-50/50 shadow-sm ring-2 ring-amber-600/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="material-symbols-outlined text-amber-700 text-[18px]">
                        visibility
                      </span>
                      <span className="text-xs font-bold text-amber-900">Visualizador</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-snug">
                      Acesso somente leitura a contratos, fornecedores e dashboards analíticos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 5: Políticas de Segurança e Convite */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2.5">
                <span className="text-xs font-semibold text-gray-700">Políticas de Onboarding & Segurança</span>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={sendActivationEmail}
                    onChange={(e) => setSendActivationEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0051d5] focus:ring-[#0051d5]"
                  />
                  <span>Enviar e-mail corporativo com link temporário de ativação de credencial</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={require2FA}
                    onChange={(e) => setRequire2FA(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0051d5] focus:ring-[#0051d5]"
                  />
                  <span>Exigir configuração de Autenticação em Dois Fatores (2FA/TOTP) no primeiro login</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0051d5] hover:bg-[#0040a8] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  <span>Registrar Colaborador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAR ALÇADA / PAPEL (ADMIN ONLY) */}
      {userToEditRole && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Alterar Alçada Funcional</h3>
                <p className="text-xs text-gray-500">{userToEditRole.name}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              Selecione o novo papel de acesso atribuído a este colaborador. A alteração será registrada
              imediatamente na trilha de auditoria forense.
            </p>

            <div className="flex flex-col gap-2">
              {(['administrador', 'editor', 'visualizador'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleConfirmRoleChange(r)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    userToEditRole.role === r
                      ? 'border-[#0051d5] bg-blue-50/50 font-semibold text-[#0051d5]'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="capitalize text-xs font-bold">{r}</span>
                  </div>
                  {userToEditRole.role === r && (
                    <span className="material-symbols-outlined text-[18px] text-[#0051d5]">check</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setUserToEditRole(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: EXCLUIR COLABORADOR */}
      {userToDelete && isAdmin && (
        <ConfirmationModal
          isOpen={true}
          title="Revogar Acesso do Colaborador"
          message={`Tem certeza de que deseja revogar o acesso corporativo de "${userToDelete.name}" (${userToDelete.email})? Esta ação cancelará suas credenciais e será registrada na auditoria.`}
          confirmLabel="Revogar Acesso"
          cancelLabel="Cancelar"
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
};
