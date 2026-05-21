import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'slate' | 'accent';
  isLoading?: boolean;
  suffix?: string;
  onClick?: () => void;
}

const colorMap = {
  blue:   { grad: 'linear-gradient(135deg,#3B82F6 0%,#6366F1 100%)', shadow: 'rgba(59,130,246,0.35)'  },
  green:  { grad: 'linear-gradient(135deg,#10B981 0%,#14B8A6 100%)', shadow: 'rgba(16,185,129,0.35)'  },
  orange: { grad: 'linear-gradient(135deg,#F59E0B 0%,#F97316 100%)', shadow: 'rgba(245,158,11,0.35)'  },
  red:    { grad: 'linear-gradient(135deg,#EF4444 0%,#F43F5E 100%)', shadow: 'rgba(239,68,68,0.35)'   },
  purple: { grad: 'linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%)', shadow: 'rgba(99,102,241,0.35)'  },
  slate:  { grad: 'linear-gradient(135deg,#64748B 0%,#475569 100%)', shadow: 'rgba(100,116,139,0.30)' },
  accent: { grad: 'var(--accent-gradient)',                           shadow: 'rgba(var(--accent-rgb),0.38)' },
} as const;

export const StatCard = ({
  title, value, icon: Icon, change, changeLabel,
  color = 'accent', isLoading, suffix, onClick,
}: StatCardProps) => {
  const { grad, shadow } = colorMap[color];

  if (isLoading) {
    return (
      <div className="stat-card shimmer-premium" aria-busy="true">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--bg-muted)' }} />
            <div className="h-8 rounded w-1/2" style={{ backgroundColor: 'var(--bg-muted)' }} />
            <div className="h-3 rounded w-2/3" style={{ backgroundColor: 'var(--bg-muted)' }} />
          </div>
          <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: 'var(--bg-muted)' }} />
        </div>
      </div>
    );
  }

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={cn('stat-card w-full text-left', onClick && 'cursor-pointer')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider truncate" style={{ color: 'var(--text-muted)' }}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-2 leading-none" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {value}
            {suffix && (
              <span className="text-base ml-1 font-semibold" style={{ color: 'var(--text-muted)' }}>
                {suffix}
              </span>
            )}
          </p>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1.5 mt-3 text-xs font-semibold',
                change > 0 ? 'text-emerald-500' : change < 0 ? 'text-rose-500' : '',
              )}
              style={change === 0 ? { color: 'var(--text-muted)' } : undefined}
            >
              {change > 0 ? <TrendingUp size={14} /> : change < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
              <span>{change > 0 ? '+' : ''}{change}%</span>
              {changeLabel && (
                <span className="font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
          style={{
            background: grad,
            boxShadow: `0 10px 28px ${shadow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
          }}
        >
          <Icon size={22} className="text-white relative z-10" strokeWidth={2.2} />
        </div>
      </div>
    </Wrapper>
  );
};
