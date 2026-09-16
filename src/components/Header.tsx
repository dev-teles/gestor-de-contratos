import React, { useState, useRef } from 'react';
import { ASSETS } from '../constants/assets';
import { NotificationItem, UserRole, UserProfile } from '../types';
import { useClickOutside } from '../hooks/useClickOutside';

interface HeaderProps {
  currentRole: UserRole;
  userProfile?: UserProfile;
  onOpenProfile?: () => void;
  onNewContractClick?: () => void;
  onOpenNewContract?: () => void;
  onNavigateContract?: (code: string) => void;
  onSelectNotificationContract?: (contractId: string) => void;
  notifications: NotificationItem[];
  onMarkNotificationsRead?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onOpenSearch?: () => void;
  breadcrumb?: { section: string; page: string };
  onToggleMobileSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onRoleChange?: (role: UserRole) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  userProfile,
  onOpenProfile,
  onNewContractClick,
  onOpenNewContract,
  onNavigateContract,
  onSelectNotificationContract,
  notifications,
  onMarkNotificationsRead,
  searchQuery = '',
  setSearchQuery,
  onOpenSearch,
  breadcrumb = { section: 'Workspace', page: 'Operações Contratuais' },
  onToggleMobileSidebar,
  isSidebarCollapsed = false,
  onToggleCollapse,
  onRoleChange,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const effectiveSearch = setSearchQuery ? searchQuery : localSearch;
  const handleSearchChange = (val: string) => {
    if (setSearchQuery) {
      setSearchQuery(val);
    } else {
      setLocalSearch(val);
    }
  };

  const handleCreateContract = () => {
    if (onOpenNewContract) {
      onOpenNewContract();
    } else if (onNewContractClick) {
      onNewContractClick();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  useClickOutside(notifRef, () => setShowNotifications(false), showNotifications);
  useClickOutside(profileRef, () => setShowProfileMenu(false), showProfileMenu);

  return (
    <header className="h-16 w-full shrink-0 bg-[#f8f9ff]/90 backdrop-blur-xl border-b border-[#e5eeff] shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-20 flex items-center justify-between px-3 sm:px-6">
      {/* Left: Navigation toggles, Breadcrumb & Search */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors lg:hidden flex items-center justify-center"
          title="Menu de navegação"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-[#76777d] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors hidden lg:flex items-center justify-center"
            title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isSidebarCollapsed ? 'menu_open' : 'dock_to_left'}
            </span>
          </button>
        )}

        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#45464d] dark:text-slate-400">
          <span className="material-symbols-outlined text-[18px] text-[#76777d] dark:text-slate-400">folder_open</span>
          <span>{breadcrumb.section}</span>
          <span className="material-symbols-outlined text-[14px] text-[#c6c6cd] dark:text-slate-600">chevron_right</span>
          <span className="text-[12px] text-[#0b1c30] dark:text-slate-100 font-semibold truncate max-w-xs">{breadcrumb.page}</span>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-2.5 text-[#76777d] dark:text-slate-400 text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={effectiveSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (onOpenSearch && !effectiveSearch) {
                // optionally trigger global search modal on click
              }
            }}
            placeholder="Buscar contratos... ⌘K"
            className="w-36 sm:w-64 md:w-80 h-9 pl-8 pr-7 rounded-xl bg-[#eff4ff] dark:bg-[#162033] text-[13px] text-[#0b1c30] dark:text-slate-100 placeholder:text-[#45464d]/70 dark:placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#1e293b] focus:ring-2 focus:ring-[#0051d5]/20 dark:focus:ring-blue-500/30 border border-transparent dark:border-slate-700/60 focus:border-[#0051d5]/30 dark:focus:border-blue-500/50 transition-all font-medium"
          />
          {effectiveSearch && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 text-xs transition-colors"
              title="Limpar busca"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-4">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-[#45464d] hover:bg-[#dce9ff]/60 hover:text-[#0b1c30] transition-colors"
            title="Notificações"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white"></span>
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-[#e5eeff] p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[#0b1c30]">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#0051d5] text-white text-[10px] font-bold">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                <button
                  onClick={onMarkNotificationsRead}
                  className="text-[11px] text-[#0051d5] hover:underline font-semibold"
                >
                  Marcar lidas
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-2 max-h-96 overflow-y-auto pr-0.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.contractCode) {
                        if (onSelectNotificationContract) {
                          onSelectNotificationContract(n.contractCode);
                        } else if (onNavigateContract) {
                          onNavigateContract(n.contractCode);
                        }
                        setShowNotifications(false);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                      n.read ? 'bg-[#eff4ff]/40 border-transparent' : 'bg-white border-[#e5eeff] shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          n.type === 'expiracao'
                            ? 'bg-[#ffdad6] text-[#ba1a1a]'
                            : n.type === 'assinatura'
                            ? 'bg-[#dce9ff] text-[#0051d5]'
                            : 'bg-[#dbe1ff] text-[#00174b]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {n.type === 'expiracao' ? 'timelapse' : n.type === 'assinatura' ? 'draw' : n.type === 'status' ? 'sync_alt' : 'domain_add'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[12px] font-bold text-[#0b1c30] truncate group-hover:text-[#0051d5] transition-colors">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-[#76777d] shrink-0">{n.timeAgo}</span>
                        </div>
                        <p className="text-[11px] text-[#45464d] line-clamp-2 mt-0.5">{n.description}</p>
                        {n.badgeText && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                n.urgent
                                  ? 'bg-[#ffdad6] text-[#ba1a1a]'
                                  : 'bg-[#e5eeff] text-[#0051d5]'
                              }`}
                            >
                              {n.badgeText}
                            </span>
                            {n.actionText && (
                              <span className="text-[10px] text-[#0051d5] font-semibold group-hover:underline">
                                {n.actionText}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] text-[#0051d5] font-semibold hover:underline"
                >
                  Fechar Central
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Novo Contrato CTA Button - Only shown when allowed */}
        {currentRole !== 'visualizador' && (
          <button
            type="button"
            id="btn-header-new-contract"
            onClick={handleCreateContract}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#0051d5] text-white text-[13px] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:bg-[#003ea8] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Novo Contrato</span>
          </button>
        )}

        <div className="h-6 w-[1px] bg-[#dce9ff]"></div>

        {/* User Profile Avatar with Direct Image from HTML */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-1 cursor-pointer group select-none"
          >
            <div className="relative">
              {!avatarError && (userProfile?.avatarUrl || ASSETS.carlosAvatar) ? (
                <img
                  alt={userProfile?.name || "Lucas Teles"}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-[#0051d5]/20 shadow-sm group-hover:ring-[#0051d5] transition-all"
                  src={userProfile?.avatarUrl || ASSETS.carlosAvatar}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0051d5] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {userProfile?.signatureInitials || 'LT'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"></span>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[12px] font-bold text-[#0b1c30] group-hover:text-[#0051d5] transition-colors leading-tight">
                {userProfile?.name || 'Lucas Teles'}
              </span>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                    currentRole === 'administrador'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : currentRole === 'editor'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {currentRole === 'administrador' ? 'Admin' : currentRole === 'editor' ? 'Editor' : 'Visualizador'}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#76777d] text-[18px]">expand_more</span>
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-[#e5eeff] p-1.5 z-50 animate-in fade-in">
              <div
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenProfile?.();
                }}
                className="px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-[#eff4ff]/60 rounded-xl transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-[#0b1c30]">{userProfile?.name || 'Lucas Teles'}</p>
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                      currentRole === 'administrador'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : currentRole === 'editor'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {currentRole}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 truncate">{userProfile?.email || 'lucas.teles@gruporiomais.com.br'}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Conectado • ICP A1
                </span>
              </div>

              {/* Quick Role Switcher */}
              {onRoleChange && (
                <div className="px-2 py-1.5 border-b border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Papel Atual (Permissões)</span>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {(['administrador', 'editor', 'visualizador'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          onRoleChange(r);
                          setShowProfileMenu(false);
                        }}
                        className={`px-1.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                          currentRole === r
                            ? 'bg-[#0051d5] text-white shadow-xs'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {r === 'administrador' ? 'Admin' : r === 'editor' ? 'Editor' : 'Viewer'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenProfile?.();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-gray-700 hover:bg-[#eff4ff] hover:text-[#0051d5] font-semibold transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#0051d5]">badge</span>
                  <span>Meu Perfil & Credenciais</span>
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-[12px] text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold transition-colors text-left border-t border-gray-100"
                  >
                    <span className="material-symbols-outlined text-[16px] text-rose-500">logout</span>
                    <span>Sair da Conta</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
