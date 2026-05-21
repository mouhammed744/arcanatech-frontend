import { AnimatePresence, motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { useRfidLive } from '@/hooks/useRfidLive';
import { RfidBadge } from './RfidBadge';
import { formatDateTime } from '@/lib/utils';

interface LiveRfidFeedProps {
  maxItems?: number;
  className?: string;
}

export const LiveRfidFeed = ({ maxItems = 15, className }: LiveRfidFeedProps) => {
  const { events } = useRfidLive(maxItems);

  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Flux RFID en direct</h3>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{events.length} événements</span>
      </div>

      {/* Feed */}
      <div className="max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10" style={{ color: 'var(--text-muted)' }}>
            <WifiOff size={28} className="mb-2 opacity-50" />
            <p className="text-sm">En attente de scans...</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-[var(--bg-card-hover)]"
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: event.isNew ? 'var(--accent-muted)' : undefined,
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Wifi size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {event.studentName || 'Inconnu'}
                    </p>
                    <RfidBadge
                      status={event.attendanceStatus}
                      minutesLate={event.minutesLate}
                      size="sm"
                      animate={event.isNew}
                    />
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{event.roomName} · {event.courseName || '—'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDateTime(event.scannedAt)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
