import { cn } from '@/lib/utils';
import type { AttendanceStatus } from '@/types';
import { CheckCircle, Clock, XCircle, AlertCircle, Ban, type LucideIcon } from 'lucide-react';

const config: Record<AttendanceStatus, { label: string; className: string; icon: LucideIcon }> = {
  present: { label: 'Present',  className: 'badge-present', icon: CheckCircle },
  late:    { label: 'Retard',   className: 'badge-late',    icon: Clock },
  absent:  { label: 'Absent',   className: 'badge-absent',  icon: XCircle },
  excused: { label: 'Excuse',   className: 'badge-excused', icon: AlertCircle },
  refused: { label: 'Refuse',   className: 'badge-refused', icon: Ban },
};

interface RfidBadgeProps {
  status: AttendanceStatus;
  minutesLate?: number;
  size?: 'sm' | 'md';
  animate?: boolean;
  showLabel?: boolean;
}

export const RfidBadge = ({ status, minutesLate, size = 'md', animate, showLabel = true }: RfidBadgeProps) => {
  const { label, className, icon: Icon } = config[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold transition-all duration-200',
        size === 'sm' ? 'text-[11px] px-2.5 py-1' : 'text-xs px-3 py-1.5',
        className,
        animate && status === 'present' && 'animate-pulse-ring',
      )}
    >
      <Icon size={size === 'sm' ? 11 : 13} strokeWidth={2.4} />
      {showLabel && <span>{label}</span>}
      {status === 'late' && minutesLate !== undefined && minutesLate > 0 && (
        <span className="opacity-80 font-medium">· {minutesLate} min</span>
      )}
    </span>
  );
};
