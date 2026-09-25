import React, { useState, useRef, useEffect } from 'react';
import { ASSETS } from '../constants/assets';
import { UserRole } from '../types';
import { useClickOutside } from '../hooks/useClickOutside';
import { RioMaisLogo } from './RioMaisLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  isCollapsed = false,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
  onLogout,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // References to detect click-outside on both desktop and mobile sidebar containers
  const desktopRoleMenuRef = useRef<HTMLDivElement>(null);
  const mobileRoleMenuRef = useRef<HTMLDivElement>(null);

  // Reusable click-outside hook with ESC key & touch support
  useClickOutside([desktopRoleMenuRef, mobileRoleMenuRef], () => setShowRoleMenu(false), {
    enabled: showRoleMenu,
    closeOnEsc: true,
  });

  // Close role menu if sidebar collapse state changes
  useEffect(() => {
    setShowRoleMenu(false);
  }, [isCollapsed, isMobileOpen]);

  const roleLabels: Record<UserRole, { label: string; sub: string; badge: string; color: string }> = {
    administrador: { label: 'Administrador', sub: 'Acesso Total & Governança', badge: 'Controle Total', color: 'bg-purple-600' },
    editor: { label: 'Editor', sub: 'Minutas, Edição & Contratos', badge: 'Edição Ativa', color: 'bg-[#316bf3]' },
    visualizador: { label: 'Visualizador', sub: 'Consulta & Relatórios', badge: 'Somente Leitura', color: 'bg-amber-600' },
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', restrictedFor: [] },
    { id: 'fornecedores', label: 'Fornecedores', icon: 'domain', restrictedFor: [] },
    { id: 'contratos', label: 'Contratos', icon: 'description', restrictedFor: [] },
    { id: 'colaboradores', label: 'Colaboradores', icon: 'badge', restrictedFor: [] },
    { id: 'auditoria', label: 'Auditoria', icon: 'history', restrictedFor: ['editor', 'visualizador'] },
    { id: 'configuracoes', label: 'Configurações', icon: 'settings', restrictedFor: ['visualizador'] },
    { id: 'perfil', label: 'Meu Perfil', icon: 'account_circle', restrictedFor: [] },
  ];

  const handleNavClick = (tabId: string) => {
    setShowRoleMenu(false);
    setActiveTab(tabId);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  // Reusable navigation component inside either desktop or mobile sidebar
  const renderSidebarContent = (mobileView: boolean = false) => (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className={`h-16 px-4 flex items-center justify-between bg-[#131b2e]/95 border-b border-white/5`}>
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity min-w-0"
          >
            <RioMaisLogo size={34} />
            {(!isCollapsed || mobileView) && (
              <div className="flex flex-col min-w-0">
                <span className="text-[17px] font-bold text-white tracking-tight leading-tight truncate">
                  Mais Contratos
                </span>
                <span className="text-[10px] text-[#7c839b] uppercase tracking-wider font-semibold">
                  Grupo RioMais
                </span>
              </div>
            )}
          </div>

          {/* Controls: Collapse toggle on desktop, or close button on mobile */}
          {mobileView ? (
            <button
              onClick={() => setIsMobileOpen?.(false)}
              className="p-1.5 rounded-lg text-[#7c839b] hover:text-white hover:bg-white/10 transition-colors"
              title="Fechar menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          ) : (
            setIsCollapsed && (
              <button
                onClick={() => setIsCollapsed((prev) => !prev)}
                className={`p-1.5 rounded-lg text-[#7c839b] hover:text-white hover:bg-white/10 transition-colors ${
                  isCollapsed ? 'mx-auto' : ''
                }`}
                title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isCollapsed ? 'chevron_right' : 'dock_to_left'}
                </span>
              </button>
            )
          )}
        </div>

        {/* Navigation Items */}
        <div className={`py-3 ${isCollapsed && !mobileView ? 'px-2' : 'px-3'}`}>
          <nav className="flex flex-col gap-1">
            {navItems
              .filter((item) => !item.restrictedFor?.includes(currentRole))
              .map((item) => {
                const isActive =
                  activeTab === item.id || (item.id === 'contratos' && activeTab === 'contrato_detalhe');

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={
                      isCollapsed && !mobileView
                        ? item.label
                        : undefined
                    }
                    className={`w-full flex items-center rounded-xl text-[13px] font-medium transition-all ${
                      isCollapsed && !mobileView
                        ? 'justify-center p-2.5'
                        : 'gap-3 px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-[#316bf3] text-white font-semibold shadow-sm'
                        : 'text-[#7c839b] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="relative flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                    </div>
                    {(!isCollapsed || mobileView) && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{item.label}</span>
                      </div>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>
      </div>

      {/* Role Permission Selector at Bottom */}
      <div
        ref={mobileView ? mobileRoleMenuRef : desktopRoleMenuRef}
        className={`p-3 bg-black/20 border-t border-white/5 relative ${isCollapsed && !mobileView ? 'p-2' : 'p-3'}`}
      >
        <div className="flex flex-col gap-1.5">
          {(!isCollapsed || mobileView) && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-[#7c839b] uppercase tracking-wider font-semibold">
                Nível de Permissão
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs ${roleLabels[currentRole].color}`}>
                {roleLabels[currentRole].badge}
              </span>
            </div>
          )}

          <div
            id="sidebar-role-selector-button"
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={showRoleMenu}
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowRoleMenu(!showRoleMenu);
              }
            }}
            title={isCollapsed && !mobileView ? roleLabels[currentRole].label : undefined}
            className={`flex items-center rounded-xl bg-white/[0.07] hover:bg-white/[0.12] transition-colors cursor-pointer ${
              isCollapsed && !mobileView
                ? 'justify-center p-2'
                : 'justify-between p-2'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-[#dbe1ff] text-[20px] shrink-0">
                shield_person
              </span>
              {(!isCollapsed || mobileView) && (
                <div className="flex flex-col text-left truncate">
                  <span className="text-[12px] font-semibold text-white truncate">
                    {roleLabels[currentRole].label}
                  </span>
                  <span className="text-[10px] text-[#7c839b] truncate">
                    {roleLabels[currentRole].sub}
                  </span>
                </div>
              )}
            </div>
            {(!isCollapsed || mobileView) && (
              <span className="material-symbols-outlined text-[#7c839b] text-[18px] shrink-0">
                unfold_more
              </span>
            )}
          </div>

          {/* Role Dropdown */}
          {showRoleMenu && (
            <div
              role="menu"
              aria-labelledby="sidebar-role-selector-button"
              className={`absolute bottom-16 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 ${
                isCollapsed && !mobileView ? 'left-2 w-56' : 'left-3 right-3'
              }`}
            >
              <div className="px-2 py-1 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Alternar Papel
              </div>
              {(['administrador', 'editor', 'visualizador'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  role="menuitem"
                  onClick={() => {
                    setCurrentRole(r);
                    setShowRoleMenu(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] transition-colors text-left ${
                    currentRole === r
                      ? 'bg-[#316bf3] text-white font-semibold'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{roleLabels[r].label}</span>
                    <span className="text-[10px] opacity-75">{roleLabels[r].sub}</span>
                  </div>
                  {currentRole === r && (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  )}
                </button>
              ))}

              {onLogout && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setShowRoleMenu(false);
                    onLogout();
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors text-left border-t border-white/10 mt-1 pt-2"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Sair da Conta</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop In-Flow Sidebar (Occupies true flex space, NEVER covers screen) */}
      <aside
        className={`hidden lg:flex flex-col justify-between shrink-0 h-full bg-[#131b2e] z-30 shadow-[0_1px_8px_rgba(0,0,0,0.1)] select-none transition-all duration-300 relative ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* 2. Mobile / Narrow-Screen Drawer (Only renders when explicitly opened, dismissible) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileOpen?.(false)}
          />
          {/* Slide-over Menu */}
          <aside className="relative w-72 max-w-[85vw] h-full bg-[#131b2e] flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
