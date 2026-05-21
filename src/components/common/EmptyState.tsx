import { cn } from '@/lib/utils';

interface ActionObject { label: string; onClick: () => void; icon?: React.ReactNode; }
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode | ActionObject;
  className?: string;
}

const isActionObject = (a: unknown): a is ActionObject =>
  typeof a === 'object' && a !== null && 'label' in a && 'onClick' in a;

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center py-16 px-6 text-center animate-float-in',
      className,
    )}
  >
    {icon && (
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 relative overflow-hidden"
        style={{
          background: 'rgba(var(--accent-rgb), 0.08)',
          border: '1px solid rgba(var(--accent-rgb), 0.18)',
          color: 'var(--accent)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(var(--accent-rgb), 0.14), transparent 60%)',
          }}
        />
        <div className="relative">{icon}</div>
      </div>
    )}
    <h3 className="text-lg font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
      {title}
    </h3>
    {description && (
      <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>
    )}
    {action && (
      <div className="mt-6">
        {isActionObject(action) ? (
          <button
            onClick={action.onClick}
            className="btn-accent inline-flex items-center gap-2"
          >
            {action.icon}
            {action.label}
          </button>
        ) : (
          action
        )}
      </div>
    )}
  </div>
);
