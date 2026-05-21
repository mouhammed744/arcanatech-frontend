import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  BarChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Target } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { statsService } from '@/services/stats.service';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const PROGRAMS = [
  { id: '', name: 'Tous les programmes' },
  { id: 'prog-1', name: 'Informatique' },
  { id: 'prog-2', name: 'Mathématiques' },
  { id: 'prog-3', name: 'Physique' },
];

const rankMedals = ['🥇', '🥈', '🥉'];

export const StatsPage: React.FC = () => {
  usePageTitle('Statistiques');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [programId, setProgramId] = useState('');

  const filters = { startDate, endDate, programId };

  const { data: punctualityData, isLoading: loadingPunct } = useQuery({
    queryKey: ['stats-punctuality', filters],
    queryFn: () => statsService.getPunctualityOverTime(filters),
  });

  const { data: courseData, isLoading: loadingCourse } = useQuery({
    queryKey: ['stats-courses', filters],
    queryFn: () => statsService.getCourseStats(filters),
  });

  const { data: rankings, isLoading: loadingRank } = useQuery({
    queryKey: ['stats-rankings', filters],
    queryFn: () => statsService.getStudentRankings(filters),
  });

  const avgPunctuality = useMemo(() => {
    if (!punctualityData?.length) return 0;
    const sum = punctualityData.reduce((acc, r) => acc + (r.punctualityRate ?? 0), 0);
    return Math.round(sum / punctualityData.length);
  }, [punctualityData]);

  /* ── couleur dynamique selon le score ── */
  const scoreColors = useMemo(() => {
    if (avgPunctuality >= 80) return { from: '#10B981', to: '#34D399', text: '#34D399', label: 'Excellent', glow: 'rgba(16,185,129,0.3)' };
    if (avgPunctuality >= 60) return { from: '#F59E0B', to: '#FBBF24', text: '#FBBF24', label: 'Moyen',    glow: 'rgba(245,158,11,0.3)'  };
    return                           { from: '#EF4444', to: '#F87171', text: '#F87171', label: 'Faible',   glow: 'rgba(239,68,68,0.3)'   };
  }, [avgPunctuality]);

  /* ── tendance de la courbe ── */
  const trend = useMemo(() => {
    if (!punctualityData || punctualityData.length < 2) return 'stable';
    const first = punctualityData[0]?.punctualityRate ?? 0;
    const last  = punctualityData[punctualityData.length - 1]?.punctualityRate ?? 0;
    if (last > first + 2) return 'up';
    if (last < first - 2) return 'down';
    return 'stable';
  }, [punctualityData]);

  const trendColors = {
    up:     { stroke: '#10B981', from: 'rgba(16,185,129,0.28)', to: 'rgba(16,185,129,0)',  label: '↑ En hausse'  },
    down:   { stroke: '#EF4444', from: 'rgba(239,68,68,0.28)',  to: 'rgba(239,68,68,0)',   label: '↓ En baisse'  },
    stable: { stroke: '#6366F1', from: 'rgba(99,102,241,0.28)', to: 'rgba(99,102,241,0)',  label: '→ Stable'     },
  };
  const tc = trendColors[trend];

  const radialData = useMemo(
    () => [{ name: 'Score', value: avgPunctuality, fill: 'url(#radGrad)' }],
    [avgPunctuality],
  );

  const showConfetti = avgPunctuality >= 85;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
              Statistiques
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Ponctualité & présence — vue progression</p>
          </div>
        </div>
      </motion.div>

      {/* Filtres glass */}
      <div
        className="fade-up"
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          padding: 16,
          borderRadius: 18,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Date début</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid var(--border-input)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Date fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid var(--border-input)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Programme</label>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid var(--border-input)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              minWidth: 180,
            }}
          >
            {PROGRAMS.map((p) => (
              <option key={p.id || 'all'} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hub gamifié — jauge centrale */}
      <div
        className="fade-up fade-up-1"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            position: 'relative',
            borderRadius: 22,
            padding: 24,
            border: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.08) 100%)',
            backdropFilter: 'blur(16px)',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
          }}
        >
          <AnimatePresence>
            {showConfetti && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background:
                    'radial-gradient(circle at 20% 30%, rgba(251,191,36,0.25) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(99,102,241,0.2) 0%, transparent 45%)',
                }}
              />
            )}
          </AnimatePresence>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-accent)',
              }}
            >
              <Target size={20} color="#fff" />
            </span>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Niveau campus</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>Ponctualité moyenne</p>
            </div>
          </div>
          {loadingPunct ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <LoadingSpinner />
            </div>
          ) : (
            <div style={{ position: 'relative', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="58%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                  <defs>
                    <linearGradient id="radGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={scoreColors.from} />
                      <stop offset="100%" stopColor={scoreColors.to} />
                    </linearGradient>
                  </defs>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <motion.span
                  key={avgPunctuality}
                  initial={{ scale: 0.85, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 800,
                    letterSpacing: '-0.05em', color: scoreColors.text,
                    textShadow: `0 0 24px ${scoreColors.glow}`,
                  }}
                >
                  {avgPunctuality}%
                </motion.span>
                <span style={{ fontSize: 12, fontWeight: 700, color: scoreColors.text, opacity: 0.85, marginTop: 2 }}>
                  {scoreColors.label}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 1 }}>sur la période</span>
              </div>
            </div>
          )}
          {showConfetti && (
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> Semestre validé — objectifs dépassés
            </p>
          )}
        </div>

        <div
          style={{
            borderRadius: 22,
            padding: 22,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(12px)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              Ponctualité dans le temps
            </h2>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: tc.stroke,
              background: `${tc.from.replace('0.28', '0.12')}`,
              border: `1px solid ${tc.stroke}40`,
              borderRadius: 99, padding: '3px 10px',
            }}>
              {tc.label}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Courbe d&apos;activité — même source que le tableau de bord</p>
          {loadingPunct ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
              <LoadingSpinner />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={punctualityData || []}>
                <defs>
                  <linearGradient id="statsPGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={tc.stroke} stopOpacity={0.32} />
                    <stop offset="95%" stopColor={tc.stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 100]} unit="%" axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [typeof v === 'number' ? `${v.toFixed(1)}%` : '—', 'Ponctualité']}
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${tc.stroke}40`,
                    background: 'var(--bg-card)',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
                  }}
                  cursor={{ stroke: tc.stroke, strokeWidth: 1, strokeDasharray: '4 3' }}
                />
                <Area
                  type="monotone"
                  dataKey="punctualityRate"
                  stroke={tc.stroke}
                  strokeWidth={2.5}
                  fill="url(#statsPGrad)"
                  name="Taux"
                  dot={false}
                  activeDot={{ r: 5, fill: tc.stroke, stroke: 'var(--bg-card)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Barres par cours */}
      <div
        className="fade-up fade-up-2"
        style={{
          borderRadius: 22,
          padding: 22,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>Présences par cours</h2>
        {loadingCourse ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
            <LoadingSpinner />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={courseData || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 100]} />
              <YAxis type="category" dataKey="courseName" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={140} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                }}
              />
              <Legend />
              <Bar dataKey="presentPercentage" fill="#10B981" name="Présences (%)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="latePercentage" fill="#F59E0B" name="Retards (%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Classement */}
      <div
        className="fade-up fade-up-3"
        style={{
          borderRadius: 22,
          padding: 22,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Trophy size={20} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Classement étudiants</h2>
        </div>
        {loadingRank ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
            <LoadingSpinner />
          </div>
        ) : !rankings || rankings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Aucune donnée disponible</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Étudiant</th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Programme</th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ponctualité</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r, idx) => {
                  const name = r.studentName ?? `${(r as { firstName?: string }).firstName ?? ''} ${(r as { lastName?: string }).lastName ?? ''}`.trim();
                  const pct = r.punctualityRate ?? 0;
                  return (
                    <motion.tr
                      key={r.studentId ?? idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                        {idx < 3 ? rankMedals[idx] : idx + 1}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{name || '—'}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{r.programName ?? '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 96, height: 6, borderRadius: 99, background: 'var(--bg-muted)', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, pct)}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              style={{ height: '100%', borderRadius: 99, background: 'var(--accent-gradient)' }}
                            />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(pct)}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;
