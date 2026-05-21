import { ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Breadcrumb { label: string; to?: string; }
interface ActionObject { label: string; to?: string; onClick?: () => void; icon?: React.ReactNode; }

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  action?: ActionObject;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader = ({
  title, subtitle, breadcrumbs, action, actions, children, className,
}: PageHeaderProps) => (
  <div className={cn('flex items-start justify-between mb-7 flex-wrap gap-4 fade-up', className)}>
    <div className="min-w-0">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} className="opacity-50" />}
              {b.to ? (
                <Link to={b.to} className="link-accent transition-colors hover:underline underline-offset-2">
                  {b.label}
                </Link>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <h1
        className="text-2xl md:text-3xl font-bold tracking-tight"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
    <div className="flex items-center gap-3">
      {children}
      {actions}
      {action && (
        action.to ? (
          <Link to={action.to} className="btn-accent inline-flex items-center gap-2">
            {action.icon || <Plus size={16} />}
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="btn-accent inline-flex items-center gap-2">
            {action.icon || <Plus size={16} />}
            {action.label}
          </button>
        )
      )}
    </div>
  </div>
);
