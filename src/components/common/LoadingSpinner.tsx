import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  centered?: boolean;
  label?: string;
}

export const LoadingSpinner = ({ size = 'md', className, centered, label }: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-[3px]',
  };

  const spinner = (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizes[size],
        className,
      )}
      style={{
        borderColor: 'rgba(var(--accent-rgb), 0.14)',
        borderTopColor: 'var(--accent)',
      }}
      role="status"
      aria-label={label || 'Chargement'}
    />
  );

  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-32 gap-3">
        {spinner}
        {label && (
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {label}
          </span>
        )}
      </div>
    );
  }

  return spinner;
};
