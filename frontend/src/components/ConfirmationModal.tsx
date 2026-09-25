import React, { useEffect, useRef } from 'react';

export interface ConfirmationModalDetailItem {
  label: string;
  value: string | React.ReactNode;
  highlighted?: boolean;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: string;
  itemDetails?: ConfirmationModalDetailItem[];
  isLoading?: boolean;
  destructiveNotice?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar Exclusão',
  cancelText = 'Cancelar',
  variant = 'danger',
  icon,
  itemDetails,
  isLoading = false,
  destructiveNotice,
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  // Focus confirm button when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
          defaultIcon: 'warning',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500/30',
          badgeBorder: 'border-amber-200 bg-amber-50 text-amber-800',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 text-[#0051d5] border-blue-200',
          defaultIcon: 'info',
          btnBg: 'bg-[#0051d5] hover:bg-[#0041ab] text-white focus:ring-[#0051d5]/30',
          badgeBorder: 'border-blue-200 bg-blue-50 text-blue-800',
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-red-100 text-[#ba1a1a] border-red-200',
          defaultIcon: 'delete_forever',
          btnBg: 'bg-[#ba1a1a] hover:bg-[#991515] text-white focus:ring-red-500/30',
          badgeBorder: 'border-red-200 bg-red-50/70 text-red-900',
        };
    }
  };

  const currentStyles = getVariantStyles();
  const displayIcon = icon || currentStyles.defaultIcon;

  return (
    <div
      id="confirmation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div
        id="confirmation-modal-card"
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${currentStyles.iconBg}`}
          >
            <span className="material-symbols-outlined text-[26px]">
              {displayIcon}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="confirmation-modal-title"
              className="text-[18px] font-bold text-slate-900 tracking-tight leading-snug"
            >
              {title}
            </h3>
            {message && (
              <div className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">
                {message}
              </div>
            )}
          </div>

          <button
            type="button"
            id="confirmation-modal-close-icon"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Fechar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Optional Metadata Details Card */}
        {itemDetails && itemDetails.length > 0 && (
          <div className="px-6 py-3">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 divide-y divide-slate-200/60 text-[12px] overflow-hidden">
              {itemDetails.map((item, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-3"
                >
                  <span className="text-slate-500 font-medium shrink-0">
                    {item.label}
                  </span>
                  <span
                    className={`text-right font-semibold truncate ${
                      item.highlighted ? 'text-slate-900 font-mono font-bold' : 'text-slate-800'
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Destructive Warning Box */}
        {destructiveNotice && (
          <div className="px-6 py-2">
            <div
              className={`p-3 rounded-xl border text-[12px] flex items-start gap-2.5 ${currentStyles.badgeBorder}`}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                report
              </span>
              <span className="leading-snug">{destructiveNotice}</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-6 pt-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            id="confirmation-modal-cancel-btn"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[13px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            ref={confirmBtnRef}
            id="confirmation-modal-confirm-btn"
            onClick={onConfirm}
            disabled={isLoading}
            className={`h-10 px-5 rounded-xl text-[13px] font-semibold transition-all shadow-sm flex items-center gap-2 focus:outline-none focus:ring-2 disabled:opacity-50 ${currentStyles.btnBg}`}
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">
                  progress_activity
                </span>
                <span>Processando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">
                  {variant === 'danger' ? 'delete' : 'check'}
                </span>
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
