import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Wifi, Clock, XCircle, CheckCircle, Activity,
  TrendingUp, TrendingDown, Minus, MapPin, ChevronDown,
  Radio, KeyRound, CloudSun, ArrowRight,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { statsService }   from '@/services/stats.service';
import { scheduleService } from '@/services/schedule.service';
import { LiveRfidFeed }   from '@/components/common/LiveRfidFeed';
import { usePageTitle }   from '@/hooks/usePageTitle';
import { formatDate }     from '@/lib/utils';
import { getNextSessionWindow, formatCountdown } from '@/lib/scheduleNext';
import { useAppSelector } from '@/store';

/* ─── KPI config ─────────────────────────────────────────────────────────── */
const kpiConfig = [
  {
    key: 'totalStudents',
    label: 'Étudiants',
    icon: Users,
    color: '#818CF8',
    grad: 'linear-gradient(135deg,#6366F1,#818CF8)',
    glow: 'rgba(99,102,241,0.22)',
    changeKey: null,
  },
  {
    key: 'totalScansToday',
    label: "Scans aujourd'hui",
    icon: Wifi,
    color: '#22D3EE',
    grad: 'linear-gradient(135deg,#06B6D4,#22D3EE)',
    glow: 'rgba(6,182,212,0.22)',
    changeKey: null,
  },
  {
    key: 'punctualityRateToday',
    label: 'Ponctualité',
    icon: CheckCircle,
    color: '#34D399',
    grad: 'linear-gradient(135deg,#10B981,#34D399)',
    glow: 'rgba(16,185,129,0.22)',
    changeKey: 'punctuality',
  },
  {
    key: 'lateCountToday',
    label: 'Retards',
    icon: Clock,
    color: '#FBBF24',
    grad: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
    glow: 'rgba(245,158,11,0.22)',
    changeKey: null,
  },
  {
    key: 'absentCountToday',
    label: 'Absences',
    icon: XCircle,
    color: '#F87171',
    grad: 'linear-gradient(135deg,#EF4444,#F87171)',
    glow: 'rgba(239,68,68,0.22)',
    changeKey: null,
  },
  {
    key: 'readers',
    label: 'Lecteurs actifs',
    icon: Activity,
    color: '#A78BFA',
    grad: 'linear-gradient(135deg,#8B5CF6,#A78BFA)',
    glow: 'rgba(139,92,246,0.22)',
    changeKey: null,
  },
];

const PIE_COLORS  = ['#34D399', '#FBBF24', '#F87171'];
const READER_MOCK = [
  { room: 'Amphi A',   status: 'online',      ping: 'il y a 5s' },
  { room: 'Salle 101', status: 'online',      ping: 'il y a 12s' },
  { room: 'Salle TP1', status: 'offline',     ping: 'il y a 5 min' },
  { room: 'Amphi B',   status: 'online',      ping: 'il y a 3s' },
  { room: 'Labo Info', status: 'maintenance', ping: 'il y a 1h' },
];

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 12 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay },
});

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export const DashboardPage = () => {
  usePageTitle('Tableau de bord');
  const user         = useAppSelector((s) => s.auth.user);
  const universityId = user?.universityId ?? 1;
  const firstName    = user?.firstName ?? 'Administrateur';

  const [tick, setTick]       = useState(0);
  const [quickOpen, setQuick] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const { data: scheduleEntries = [] } = useQuery({
    queryKey: ['schedule', universityId, 'dash'],
    queryFn:  () => scheduleService.getAll(universityId, {}),
    staleTime: 60_000,
  });
  const nextWindow     = useMemo(() => getNextSessionWindow(scheduleEntries), [scheduleEntries, tick]);
  const countdownLabel = useMemo(() => {
    if (nextWindow.kind !== 'upcoming') return null;
    return formatCountdown(Math.max(0, nextWindow.startsAt.getTime() - Date.now()));
  }, [nextWindow, tick]);

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn:  statsService.getKpis,
    refetchInterval: 30_000,
  });
  const { data: punctuality, isLoading: chartLoading } = useQuery({
    queryKey: ['punctuality-chart'],
    queryFn:  () => statsService.getPunctualityOverTime({
      startDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    }),
    refetchInterval: 60_000,
  });

  const pieData = kpis
    ? [
        { name: 'Présents', value: kpis.presentCountToday },
        { name: 'Retards',  value: kpis.lateCountToday },
        { name: 'Absents',  value: kpis.absentCountToday },
      ]
    : [];

  const now        = new Date();
  const hour       = now.getHours();
  const dayNames   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const monthNames = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sep.','oct.','nov.','déc.'];
  const greeting   = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const getKpiValue = (cfg: typeof kpiConfig[0]) => {
    if (!kpis) return null;
    if (cfg.key === 'readers')              return `${kpis.activeReadersCount}/${kpis.totalReadersCount}`;
    if (cfg.key === 'punctualityRateToday') return `${kpis.punctualityRateToday.toFixed(1)}%`;
    return (kpis as unknown as Record<string, number | string>)[cfg.key];
  };
  const getChange = (cfg: typeof kpiConfig[0]) => {
    if (!kpis || !cfg.changeKey) return null;
    return (kpis.comparedToYesterday as Record<string, number>)[cfg.changeKey];
  };

  /* ══ RENDER ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        {...fadeUp(0)}
        style={{
          borderRadius: 20,
          padding: '26px 30px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0057E7 0%, #0070FF 40%, #0090FF 75%, #00B4FF 100%)',
          boxShadow: '0 8px 40px rgba(0,100,255,0.45), 0 1px 0 rgba(255,255,255,0.1) inset',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* orbes */}
        <div style={{ position: 'absolute', top: -70, right: -50, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -30, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,255,0.35) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '42%', width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 120, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,220,255,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* left */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            {dayNames[now.getDay()]}, {now.getDate()} {monthNames[now.getMonth()]} {now.getFullYear()}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            {greeting},&nbsp;
            <span style={{ color: '#A5F3FF' }}>
              {firstName}
            </span>
          </h2>

          {nextWindow.kind !== 'none' && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.9)',
                background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 99, padding: '5px 12px', backdropFilter: 'blur(8px)',
              }}>
                <MapPin size={13} style={{ color: '#A5F3FF' }} />
                {nextWindow.kind === 'current' ? '● En cours' : 'Prochain'} · {nextWindow.entry.courseName}
                {nextWindow.entry.roomName ? ` · ${nextWindow.entry.roomName}` : ''}
              </span>
              {nextWindow.kind === 'upcoming' && countdownLabel && (
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
                  letterSpacing: '-0.03em', color: '#fff',
                  background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 99, padding: '5px 14px', backdropFilter: 'blur(8px)',
                }}>
                  {countdownLabel}
                </span>
              )}
            </div>
          )}
          {nextWindow.kind === 'none' && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
              Aucune séance planifiée à l'horizon.
            </p>
          )}
        </div>

        {/* right — clock */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
            {String(hour).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11,
            color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.18)', borderRadius: 99, padding: '4px 10px',
            backdropFilter: 'blur(8px)',
          }}>
            <CloudSun size={13} /> Cotonou · ~28 °C
          </span>
        </div>
      </motion.div>

      {/* ── Quick access ─────────────────────────────────────────────────── */}
      <motion.div
        {...fadeUp(0.05)}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <button
          type="button"
          onClick={() => setQuick((o) => !o)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, padding: '14px 20px', border: 'none', background: 'transparent',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            }}>
              <Radio size={15} color="#fff" />
            </span>
            <span>
              <span style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                Accès rapides campus
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>RFID &amp; codes temporaires</span>
            </span>
          </span>
          <motion.span animate={{ rotate: quickOpen ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {quickOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '0 16px 16px' }}>
                {[
                  { to: '/rfid-access',     icon: Radio,    label: 'Contrôle RFID',    sub: 'Flux temps réel',  grad: 'linear-gradient(135deg,#06B6D4,#22D3EE)', glow: 'rgba(6,182,212,0.3)' },
                  { to: '/temporary-codes', icon: KeyRound, label: 'Codes temporaires', sub: 'Accès ponctuels',  grad: 'linear-gradient(135deg,#8B5CF6,#A78BFA)', glow: 'rgba(139,92,246,0.3)' },
                ].map(({ to, icon: Icon, label, sub, grad, glow }) => (
                  <Link
                    key={to}
                    to={to}
                    style={{
                      flex: '1 1 140px', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 12, textDecoration: 'none',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                      e.currentTarget.style.boxShadow  = `0 0 16px ${glow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.boxShadow  = 'none';
                    }}
                  >
                    <span style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 4px 12px ${glow}`,
                    }}>
                      <Icon size={15} color="#fff" />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</span>
                    </span>
                    <ArrowRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── KPI Grid ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12 }}>
        {kpiConfig.map((cfg, i) => {
          const val    = getKpiValue(cfg);
          const change = getChange(cfg);
          return (
            <motion.div
              key={cfg.key}
              {...fadeUp(i * 0.05)}
              style={{
                borderRadius: 16,
                padding: '18px 18px 16px',
                position: 'relative',
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${cfg.glow.replace('0.22', '0.07')} 0%, rgba(255,255,255,0.02) 100%)`,
                border: `1px solid ${cfg.color}30`,
                boxShadow: `0 0 24px ${cfg.glow}, 0 1px 4px rgba(0,0,0,0.2)`,
                backdropFilter: 'blur(14px)',
              }}
            >
              {/* top accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cfg.grad, borderRadius: '16px 16px 0 0' }} />

              {/* label + icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  {cfg.label}
                </p>
                <span style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: cfg.grad,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 12px ${cfg.glow}`,
                }}>
                  <cfg.icon size={15} color="#fff" />
                </span>
              </div>

              {/* value */}
              {kpisLoading ? (
                <div className="skeleton" style={{ height: 28, width: '55%', borderRadius: 6 }} />
              ) : (
                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
                  color: '#fff', letterSpacing: '-0.04em', lineHeight: 1,
                }}>
                  {val ?? '—'}
                </p>
              )}

              {/* trend */}
              {change !== null && change !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  {change > 0
                    ? <TrendingUp  size={11} style={{ color: '#34D399' }} />
                    : change < 0
                      ? <TrendingDown size={11} style={{ color: '#F87171' }} />
                      : <Minus size={11} style={{ color: 'var(--text-muted)' }} />}
                  <span style={{ fontSize: 10, fontWeight: 600, color: change > 0 ? '#34D399' : change < 0 ? '#F87171' : 'var(--text-muted)' }}>
                    {change > 0 ? '+' : ''}{typeof change === 'number' ? change.toFixed(1) : change}% vs hier
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12 }}>

        {/* Area chart */}
        <motion.div
          {...fadeUp(0.12)}
          style={{
            borderRadius: 18, padding: '22px 22px 14px',
            background: 'var(--bg-card)',
            border: '1px solid rgba(99,102,241,0.18)',
            boxShadow: '0 0 30px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Évolution de la ponctualité
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>30 derniers jours</p>
            </div>
            <span style={{
              fontSize: 10, background: 'rgba(99,102,241,0.15)', color: '#818CF8',
              borderRadius: 99, padding: '4px 10px', fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              border: '1px solid rgba(99,102,241,0.25)',
            }}>
              Live
            </span>
          </div>
          {chartLoading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 10 }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={punctuality || []} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPunct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                  tickFormatter={(v) => formatDate(v, { day: '2-digit', month: '2-digit' })}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                  domain={[0, 100]} unit="%" axisLine={false} tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [typeof v === 'number' ? `${v.toFixed(1)}%` : '—', 'Ponctualité']}
                  labelFormatter={(l) => formatDate(l)}
                  contentStyle={{
                    borderRadius: 10, border: '1px solid rgba(99,102,241,0.25)',
                    backgroundColor: 'var(--bg-card)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 11,
                  }}
                  cursor={{ stroke: '#818CF8', strokeWidth: 1, strokeDasharray: '4 3' }}
                />
                <Area
                  type="monotone" dataKey="punctualityRate"
                  stroke="#6366F1" strokeWidth={2.5} fill="url(#gPunct)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#818CF8', stroke: 'var(--bg-card)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Donut */}
        <motion.div
          {...fadeUp(0.14)}
          style={{
            borderRadius: 18, padding: '20px 20px 16px',
            background: 'var(--bg-card)',
            border: '1px solid rgba(52,211,153,0.18)',
            boxShadow: '0 0 30px rgba(52,211,153,0.07), 0 1px 4px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 2 }}>
            Répartition
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
            Présence · Retard · Absence
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 10, border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 11,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 8 }}>
            {[
              { label: 'Présents', color: '#34D399', value: kpis?.presentCountToday },
              { label: 'Retards',  color: '#FBBF24', value: kpis?.lateCountToday },
              { label: 'Absents',  color: '#F87171', value: kpis?.absentCountToday },
            ].map(({ label, color, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'block', flexShrink: 0, boxShadow: `0 0 6px ${color}80` }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
                  {value ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Live Feed + Reader status ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 270px', gap: 12 }}>

        <motion.div {...fadeUp(0.16)}>
          <LiveRfidFeed className="h-full" />
        </motion.div>

        <motion.div
          {...fadeUp(0.18)}
          style={{
            borderRadius: 18, padding: '18px 20px',
            background: 'var(--bg-card)',
            border: '1px solid rgba(167,139,250,0.18)',
            boxShadow: '0 0 28px rgba(139,92,246,0.08), 0 1px 4px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Lecteurs
            </h3>
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: '#A78BFA',
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: 99, padding: '3px 9px',
            }}>
              {READER_MOCK.filter(r => r.status === 'online').length}/{READER_MOCK.length} en ligne
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {READER_MOCK.map(({ room, status, ping }, idx, arr) => {
              const dotColor = status === 'online' ? '#34D399' : status === 'offline' ? '#F87171' : '#FBBF24';
              return (
                <div
                  key={room}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: idx < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{room}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ping}</span>
                    <span
                      className={status === 'online' ? 'pulse-dot' : ''}
                      style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: dotColor,
                        boxShadow: `0 0 6px ${dotColor}90`,
                        display: 'block',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

    </div>
  );
};
