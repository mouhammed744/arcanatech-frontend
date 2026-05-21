import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, BookOpen, Clock, MapPin, User as UserIcon, LayoutGrid, Rows3, ChevronDown } from 'lucide-react';
import { scheduleService, type ScheduleEntry } from '@/services/schedule.service';
import filiereService from '@/services/filiere.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAppSelector } from '@/store';

const DAYS_EN = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_FR = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

const TYPE_CONFIG: Record<string, { grad: string; text: string; border: string; bg: string }> = {
  CM:      { grad: 'linear-gradient(135deg,#6366F1,#818CF8)', text: '#4F46E5', border: '#A5B4FC', bg: 'rgba(99,102,241,0.06)' },
  TD:      { grad: 'linear-gradient(135deg,#10B981,#34D399)', text: '#059669', border: '#6EE7B7', bg: 'rgba(16,185,129,0.06)' },
  TP:      { grad: 'linear-gradient(135deg,#F59E0B,#FCD34D)', text: '#D97706', border: '#FDE68A', bg: 'rgba(245,158,11,0.06)' },
  Projet:  { grad: 'linear-gradient(135deg,#EC4899,#F9A8D4)', text: '#DB2777', border: '#FBCFE8', bg: 'rgba(236,72,153,0.06)' },
  lecture: { grad: 'linear-gradient(135deg,#06B6D4,#38BDF8)', text: '#0891B2', border: '#A5F3FC', bg: 'rgba(6,182,212,0.06)' },
};
const DEFAULT_TYPE = TYPE_CONFIG.lecture;

const parseHour = (t: string): number => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h + (m ?? 0) / 60;
};
const fmt = (t: string) => t?.slice(0, 5) ?? '';

type SessionCardProps = {
  e: ScheduleEntry;
  idx: number;
  dayEntries: ScheduleEntry[];
  isToday: boolean;
  nowHour: number;
  navigate: ReturnType<typeof useNavigate>;
  onDelete: (id: number) => void;
};

const SessionCard = ({ e, idx, dayEntries, isToday, nowHour, navigate, onDelete }: SessionCardProps) => {
  const start = parseHour(e.startTime);
  const end = parseHour(e.endTime);
  const isNow = isToday && start <= nowHour && nowHour < end;
  const isPast = isToday && end < nowHour;
  const tc = TYPE_CONFIG[e.courseType] ?? DEFAULT_TYPE;
  const showNow = isToday && idx > 0 && parseHour(dayEntries[idx - 1].endTime) <= nowHour && start > nowHour;

  return (
    <div>
      {showNow && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px', margin: '4px 0' }}>
          <div className="now-pulse" style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
          <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg, #EF4444, transparent)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', letterSpacing: '0.05em', flexShrink: 0 }}>
            MAINTENANT · {String(new Date().getHours()).padStart(2, '0')}:{String(new Date().getMinutes()).padStart(2, '0')}
          </span>
        </div>
      )}

      <motion.div
        layout
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: isPast ? 0.5 : 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        style={{
          display: 'flex',
          gap: 0,
          margin: '4px 16px',
          borderRadius: 14,
          overflow: 'hidden',
          border: `1px solid ${isNow ? tc.border : 'var(--border-color)'}`,
          background: isNow ? tc.bg : isPast ? 'var(--bg-muted)' : 'var(--bg-card)',
          boxShadow: isNow ? `0 4px 20px rgba(99,102,241,0.12)` : 'none',
        }}
        className="glass-card-hover"
      >
        <div style={{ width: 4, background: tc.grad, flexShrink: 0 }} />
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 72, borderRight: '1px solid var(--border-color)', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{fmt(e.startTime)}</span>
          <div style={{ width: 1, height: 14, background: 'var(--border-color)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(e.endTime)}</span>
        </div>
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: tc.text, background: tc.bg, borderRadius: 99, padding: '2px 8px', border: `1px solid ${tc.border}` }}>
                {e.courseType || 'Cours'}
              </span>
              {isNow && <span className="now-pulse" style={{ fontSize: 10, fontWeight: 700, color: '#EF4444' }}>● EN COURS</span>}
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {e.courseName}{e.courseCode ? ` · ${e.courseCode}` : ''}
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {e.roomName && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                  <MapPin size={11} /> {e.roomName}
                </span>
              )}
              {e.teacherName && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                  <UserIcon size={11} /> {e.teacherName}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                <Clock size={11} /> {Math.round((end - start) * 60)} min
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => navigate(`/schedule/sessions/${e.id}/edit`, { state: { entry: e } })}
              style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}
              title="Modifier"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Supprimer "${e.courseName}" ?`)) onDelete(e.id);
              }}
              style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}
              title="Supprimer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const SchedulePage = () => {
  usePageTitle('Emploi du temps');
  const navigate  = useNavigate();
  const qClient   = useQueryClient();
  const user      = useAppSelector((s) => s.auth.user);
  const universityId = user?.universityId ?? 1;

  const todayIndex = Math.min(Math.max(new Date().getDay() - 1, 0), 5);
  const [activeDayIdx, setActiveDayIdx]     = useState(todayIndex);
  const [activeFiliereId, setActiveFiliereId] = useState<number | 'all'>('all');
  const [timelineMode, setTimelineMode] = useState<'day' | 'week'>('day');

  const { data: filieresData } = useQuery({ queryKey: ['filieres', universityId], queryFn: () => filiereService.getAll(universityId) });
  const filieres: any[] = filieresData?.data ?? [];

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['schedule', universityId, activeFiliereId],
    queryFn: () => scheduleService.getAll(universityId, activeFiliereId !== 'all' ? { filiere_id: activeFiliereId } : {}),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => scheduleService.delete(universityId, id),
    onSuccess: () => qClient.invalidateQueries({ queryKey: ['schedule', universityId] }),
  });

  const activeDay = DAYS_EN[activeDayIdx];
  const dayEntries = entries
    .filter((e) => e.dayOfWeek.toLowerCase() === activeDay.toLowerCase())
    .sort((a, b) => parseHour(a.startTime) - parseHour(b.startTime));

  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
  const isToday = activeDayIdx === todayIndex;

  const weekBlocks = useMemo(() => {
    return DAYS_FR.map((dayFr, idx) => {
      const dayEn = DAYS_EN[idx];
      const list = entries
        .filter((e) => e.dayOfWeek.toLowerCase() === dayEn.toLowerCase())
        .sort((a, b) => parseHour(a.startTime) - parseHour(b.startTime));
      return { dayFr, dayEn, idx, list };
    });
  }, [entries]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Emploi du temps</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Timeline hebdomadaire par filière</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

          {/* Filière selector */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={activeFiliereId}
              onChange={(e) => setActiveFiliereId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                paddingLeft: 12,
                paddingRight: 32,
                paddingTop: 7,
                paddingBottom: 7,
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: 220,
              }}
            >
              <option value="all">Toutes les filières</option>
              {filieres.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.level}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              style={{
                position: 'absolute',
                right: 10,
                pointerEvents: 'none',
                color: 'var(--text-muted)',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              padding: 3,
              borderRadius: 12,
              background: 'var(--bg-muted)',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              onClick={() => setTimelineMode('day')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                background: timelineMode === 'day' ? 'var(--accent-gradient)' : 'transparent',
                color: timelineMode === 'day' ? '#fff' : 'var(--text-secondary)',
                boxShadow: timelineMode === 'day' ? 'var(--shadow-accent)' : 'none',
              }}
            >
              <LayoutGrid size={14} /> Jour
            </button>
            <button
              type="button"
              onClick={() => setTimelineMode('week')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                background: timelineMode === 'week' ? 'var(--accent-gradient)' : 'transparent',
                color: timelineMode === 'week' ? '#fff' : 'var(--text-secondary)',
                boxShadow: timelineMode === 'week' ? 'var(--shadow-accent)' : 'none',
              }}
            >
              <Rows3 size={14} /> Semaine
            </button>
          </div>
          <button
            onClick={() => navigate('/schedule/sessions/new')}
            className="btn-accent"
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <Plus size={15} /> Nouvelle séance
          </button>
        </div>
      </div>


      {/* Day selector — masqué en vue semaine */}
      {timelineMode === 'day' && (
      <div className="fade-up fade-up-2" style={{ display: 'flex', gap: 8 }}>
        {DAYS_FR.map((day, idx) => {
          const count = entries.filter((e) => e.dayOfWeek.toLowerCase() === DAYS_EN[idx].toLowerCase()).length;
          const isActive = idx === activeDayIdx;
          const isCurrentDay = idx === todayIndex;
          return (
            <button key={day} onClick={() => setActiveDayIdx(idx)} style={{ flex: 1, padding: '12px 8px', borderRadius: 14, cursor: 'pointer', border: isActive ? 'none' : '1px solid var(--border-color)', fontFamily: 'var(--font-body)', background: isActive ? 'var(--accent-gradient)' : 'var(--bg-card)', boxShadow: isActive ? 'var(--shadow-accent)' : 'var(--shadow-xs)', transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)', transform: isActive ? 'scale(1.03)' : 'scale(1)' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{day.slice(0,3)}</p>
              {count > 0 ? (
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: isActive ? '#fff' : 'var(--text-primary)' }}>{count}</p>
              ) : (
                <p style={{ fontSize: 18, color: isActive ? 'rgba(255,255,255,0.4)' : 'var(--border-color)' }}>–</p>
              )}
              {isCurrentDay && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isActive ? '#fff' : 'var(--accent)', margin: '4px auto 0' }} />}
            </button>
          );
        })}
      </div>
      )}

      {/* Timeline */}
      <div className="fade-up fade-up-3" style={{ borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
        {/* Day header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              {timelineMode === 'week' ? 'Timeline magnétique · semaine' : DAYS_FR[activeDayIdx]}
            </h3>
            {timelineMode === 'day' && isToday && <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>● Aujourd'hui</p>}
            {timelineMode === 'week' && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Défilez la semaine — les séances apparaissent en douceur</p>}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-muted)', borderRadius: 99, padding: '4px 12px' }}>
            {timelineMode === 'week'
              ? `${entries.length} séance${entries.length !== 1 ? 's' : ''}`
              : `${dayEntries.length} séance${dayEntries.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--accent-muted)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : timelineMode === 'week' ? (
          <div style={{ maxHeight: 'min(70vh, 720px)', overflowY: 'auto', padding: '8px 0 20px' }}>
            {entries.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 12 }}>
                <BookOpen size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>Aucune séance cette semaine</p>
              </div>
            ) : (
              weekBlocks.map(({ dayFr, list, idx }) => (
                <div key={dayFr} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      padding: '10px 24px',
                      background: 'linear-gradient(180deg, var(--bg-card) 70%, transparent)',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      {dayFr}
                      {idx === todayIndex ? <span style={{ color: 'var(--accent)', marginLeft: 8 }}>· Aujourd&apos;hui</span> : null}
                    </span>
                  </div>
                  <AnimatePresence mode="popLayout">
                    {list.map((e, sidx) => (
                      <SessionCard
                        key={e.id}
                        e={e}
                        idx={sidx}
                        dayEntries={list}
                        isToday={idx === todayIndex}
                        nowHour={nowHour}
                        navigate={navigate}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        ) : dayEntries.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 12 }}>
            <BookOpen size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>Aucune séance ce jour</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cliquez sur &quot;Nouvelle séance&quot; pour en ajouter</p>
          </div>
        ) : (
          <div style={{ padding: '8px 0 20px' }}>
            <AnimatePresence mode="popLayout">
              {dayEntries.map((e, idx) => (
                <SessionCard
                  key={e.id}
                  e={e}
                  idx={idx}
                  dayEntries={dayEntries}
                  isToday={isToday}
                  nowHour={nowHour}
                  navigate={navigate}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <span key={type} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.text }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
};
