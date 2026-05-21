import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  danger:  { icon: AlertTriangle, iconColor: '#DC2626', iconBg: 'rgba(239,68,68,0.12)',  iconBorder: 'rgba(239,68,68,0.25)' },
  warning: { icon: AlertTriangle, iconColor: '#D97706', iconBg: 'rgba(245,158,11,0.12)', iconBorder: 'rgba(245,158,11,0.25)' },
  info:    { icon: Info,          iconColor: '#0891B2', iconBg: 'rgba(6,182,212,0.12)',  iconBorder: 'rgba(6,182,212,0.25)' },
  success: { icon: CheckCircle2,  iconColor: '#059669', iconBg: 'rgba(16,185,129,0.12)', iconBorder: 'rgba(16,185,129,0.25)' },
} as const;

export const ConfirmDialog = ({
  isOpen, title, message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isLoading,
  onConfirm, onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const { icon: Icon, iconColor, iconBg, iconBorder } = variantConfig[variant];
  const confirmBtnClass = variant === 'danger' ? 'btn-danger' : 'btn-accent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 glass-backdrop" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="glass-modal relative max-w-md w-full p-6 z-10"
      >
        <button
          onClick={onCancel}
          aria-label="Fermer"
          className="absolute top-4 right-4 btn-icon"
          style={{ width: 32, height: 32 }}
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div
            className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0')}
            style={{ background: iconBg, border: `1px solid ${iconBorder}` }}
          >
            <Icon size={22} style={{ color: iconColor }} />
          </div>
          <div className="flex-1 pt-1">
            <h3 id="confirm-title" className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h3>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary" disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(confirmBtnClass, 'inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed')}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
