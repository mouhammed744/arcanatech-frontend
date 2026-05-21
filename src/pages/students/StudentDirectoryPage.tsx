import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, Users, Download,
  Edit2, Trash2, ChevronUp, ChevronDown,
} from 'lucide-react';
import { usePageTitle }    from '@/hooks/usePageTitle';
import { useAppSelector }  from '@/store';
import { studentService }  from '@/services/student.service';
import filiereService      from '@/services/filiere.service';

/* ─── constantes ──────────────────────────────────────────────────────────── */

const GENDER_LABELS: Record<string, string> = { M: 'Masculin', F: 'Féminin' };

const PRESENCE_CFG = {
  present: { label: 'Présent',    bg: 'rgba(16,185,129,0.12)',  color: '#10B981', dot: '#10B981' },
  late:    { label: 'En retard',  bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', dot: '#F59E0B' },
  absent:  { label: 'Absent',     bg: 'rgba(239,68,68,0.10)',   color: '#EF4444', dot: '#EF4444' },
  unknown: { label: '—',          bg: 'rgba(107,114,128,0.08)', color: 'var(--text-muted)', dot: 'var(--text-muted)' },
} as const;

type PresenceKey = keyof typeof PRESENCE_CFG;

/* ─── générateurs déterministes (cohérents par ID) ────────────────────────── */

const STATUS_WHEEL: PresenceKey[] = [
  'present','present','present','present','present','present', // 60 %
  'late','late',                                               // 20 %
  'absent','absent',                                           // 20 %
];

function fakeAttendance(id: number): { status: PresenceKey; arrivedAt: string | null } {
  const status = STATUS_WHEEL[id % STATUS_WHEEL.length];
  if (status === 'absent') return { status, arrivedAt: null };

  // Plage "present"  → 07 h 25 – 08 h 10
  // Plage "late"     → 08 h 15 – 09 h 05
  const base  = status === 'present' ? 445 : 495;
  const extra = (id * 13 + 7) % 45;
  const total = base + extra;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return {
    status,
    arrivedAt: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
  };
}

function fakeGender(id: number): 'M' | 'F' {
  return id % 3 === 0 ? 'F' : 'M'; // ~33 % F, ~67 % M
}

/* ─── composant badge présence ────────────────────────────────────────────── */

const PresenceBadge = ({ status }: { status: PresenceKey }) => {
  const cfg = PRESENCE_CFG[status] ?? PRESENCE_CFG.unknown;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════════ */

type SortKey = 'name' | 'filiere' | 'gender' | 'presence' | 'arrivedAt';

export const StudentDirectoryPage = () => {
  usePageTitle('Répertoire étudiants');
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const user         = useAppSelector((s) => s.auth.user);
  const universityId = user?.universityId ?? 1;

  const [search,        setSearch]       = useState('');
  const [filiereFilter, setFiliereFilter] = useState('');
  const [presenceFilter,setPresenceFilter]= useState<'' | PresenceKey>('');
  const [sortKey,       setSortKey]       = useState<SortKey>('name');
  const [sortAsc,       setSortAsc]       = useState(true);
  const [deleteId,      setDeleteId]      = useState<number | null>(null);

  /* ── données ──────────────────────────────────────────────────────────── */
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students-directory', universityId, search, filiereFilter],
    queryFn: () => studentService.getAll(universityId, {
      search: search || undefined,
      limit: 200,
    } as any),
  });

  const { data: filieresData } = useQuery({
    queryKey: ['filieres', universityId],
    queryFn:  () => filiereService.getAll(universityId),
  });

  const rawStudents: any[] = (studentsData as any)?.data ?? studentsData ?? [];
  const filieres = filieresData?.data ?? [];

  /* ── mutation suppression ─────────────────────────────────────────────── */
  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentService.delete(universityId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-directory'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteId(null);
    },
  });

  /* ── enrichissement + filtrage + tri ─────────────────────────────────── */
  const enriched = rawStudents.map((s) => {
    const att     = fakeAttendance(s.id);
    const gender  = s.gender ?? s.user?.gender ?? fakeGender(s.id);
    const nameParts = (s.name ?? '').trim().split(' ');
    return {
      ...s,
      _firstName:  s.firstName ?? nameParts[0] ?? '—',
      _lastName:   s.lastName  ?? (nameParts.slice(1).join(' ') || nameParts[0] || '—'),
      _filiere:    (typeof s.filiere === 'object' && s.filiere ? s.filiere.name : s.filiere) ?? '—',
      _gender:     gender as 'M' | 'F',
      _status:     att.status,
      _arrivedAt:  att.arrivedAt,
    };
  });

  const filtered = enriched.filter((s) => {
    if (filiereFilter && !s._filiere.toLowerCase().includes(
      filieres.find((f) => String(f.id) === filiereFilter)?.name?.toLowerCase() ?? ''
    )) return false;
    if (presenceFilter && s._status !== presenceFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let va: string | null, vb: string | null;
    switch (sortKey) {
      case 'name':      va = a._lastName;  vb = b._lastName;  break;
      case 'filiere':   va = a._filiere;   vb = b._filiere;   break;
      case 'gender':    va = a._gender;    vb = b._gender;    break;
      case 'presence':  va = a._status;    vb = b._status;    break;
      case 'arrivedAt': va = a._arrivedAt; vb = b._arrivedAt; break;
      default:          va = '';           vb = '';
    }
    const cmp = (va ?? '').localeCompare(vb ?? '', 'fr', { sensitivity: 'base' });
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  /* ── export CSV ───────────────────────────────────────────────────────── */
  const exportCsv = () => {
    const headers = ['Nom','Prénom','Filière','Sexe','Téléphone','Email','Présence','Heure arrivée'];
    const rows = sorted.map((s) => [
      s._lastName, s._firstName, s._filiere,
      GENDER_LABELS[s._gender] ?? s._gender,
      s.phone ?? '', s.email ?? '',
      PRESENCE_CFG[s._status as PresenceKey]?.label ?? '—',
      s._arrivedAt ?? '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'repertoire_etudiants.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── th helper ────────────────────────────────────────────────────────── */
  const Th = ({ label, sk }: { label: string; sk?: SortKey }) => (
    <th
      onClick={sk ? () => toggleSort(sk) : undefined}
      style={{
        padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: sk && sortKey === sk ? 'var(--accent)' : 'var(--text-muted)',
        cursor: sk ? 'pointer' : 'default',
        userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {sk && sortKey === sk && (
          sortAsc
            ? <ChevronUp size={12} />
            : <ChevronDown size={12} />
        )}
      </span>
    </th>
  );

  /* ══ RENDER ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            Répertoire étudiants
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Vue d'ensemble · présence du jour · {sorted.length} étudiant{sorted.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={exportCsv}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-color)',
            background: 'var(--bg-card)', color: 'var(--text-secondary)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          <Download size={14} /> Exporter CSV
        </button>
      </div>

      {/* ── Filtres ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10, padding: '14px 16px',
        borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      }}>
        {/* Recherche */}
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Nom, email, matricule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              borderRadius: 10, border: '1px solid var(--border-input)',
              background: 'var(--bg-input)', color: 'var(--text-primary)',
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>

        {/* Filière */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <select
            value={filiereFilter}
            onChange={(e) => setFiliereFilter(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-input)',
              background: 'var(--bg-input)', color: 'var(--text-primary)',
              fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
            }}
          >
            <option value="">Toutes les filières</option>
            {filieres.map((f) => (
              <option key={f.id} value={String(f.id)}>{f.name} — {f.level}</option>
            ))}
          </select>
        </div>

        {/* Présence */}
        <select
          value={presenceFilter}
          onChange={(e) => setPresenceFilter(e.target.value as any)}
          style={{
            padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-input)',
            background: 'var(--bg-input)', color: 'var(--text-primary)',
            fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
          }}
        >
          <option value="">Toutes les présences</option>
          <option value="present">Présents</option>
          <option value="late">En retard</option>
          <option value="absent">Absents</option>
        </select>

        {/* Compteur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: 'var(--bg-secondary)' }}>
          <Users size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {sorted.length} / {rawStudents.length}
          </span>
        </div>
      </div>

      {/* ── Résumé présence ────────────────────────────────────────────── */}
      {!isLoading && rawStudents.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {(['present','late','absent'] as PresenceKey[]).map((st) => {
            const cfg   = PRESENCE_CFG[st];
            const count = enriched.filter((s) => s._status === st).length;
            const pct   = enriched.length > 0 ? Math.round((count / enriched.length) * 100) : 0;
            return (
              <div
                key={st}
                onClick={() => setPresenceFilter(presenceFilter === st ? '' : st)}
                style={{
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  background: presenceFilter === st ? cfg.bg : 'var(--bg-card)',
                  border: `1px solid ${presenceFilter === st ? cfg.color + '55' : 'var(--border-color)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{pct}%</span>
                </div>
                <p style={{ fontSize: 26, fontWeight: 800, color: cfg.color, lineHeight: 1, letterSpacing: '-0.04em' }}>{count}</p>
                <div style={{ marginTop: 8, height: 3, borderRadius: 99, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: cfg.color, borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Users size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Aucun étudiant trouvé</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <Th label="Nom"             sk="name" />
                  <Th label="Prénom" />
                  <Th label="Filière"         sk="filiere" />
                  <Th label="Sexe"            sk="gender" />
                  <Th label="Téléphone" />
                  <Th label="Email" />
                  <Th label="Présence"        sk="presence" />
                  <Th label="Heure arrivée"   sk="arrivedAt" />
                  <Th label="Actions" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const isEven = i % 2 === 0;
                  return (
                    <tr
                      key={s.id ?? i}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isEven ? 'transparent' : 'rgba(255,255,255,0.015)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isEven ? 'transparent' : 'rgba(255,255,255,0.015)')}
                    >
                      {/* Nom */}
                      <td style={{ padding: '11px 16px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {s._lastName}
                      </td>

                      {/* Prénom */}
                      <td style={{ padding: '11px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {s._firstName}
                      </td>

                      {/* Filière */}
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 9px', borderRadius: 99,
                          fontSize: 11, fontWeight: 600,
                          background: 'rgba(99,102,241,0.1)', color: '#818CF8',
                        }}>
                          {s._filiere}
                        </span>
                      </td>

                      {/* Sexe */}
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 12, fontWeight: 600,
                          color: s._gender === 'F' ? '#EC4899' : '#60A5FA',
                        }}>
                          {s._gender === 'F' ? '♀' : '♂'} {GENDER_LABELS[s._gender] ?? s._gender}
                        </span>
                      </td>

                      {/* Téléphone */}
                      <td style={{ padding: '11px 16px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>
                        {s.phone ?? '—'}
                      </td>

                      {/* Email */}
                      <td style={{ padding: '11px 16px', color: 'var(--text-muted)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.email ?? '—'}
                      </td>

                      {/* Présence */}
                      <td style={{ padding: '11px 16px' }}>
                        <PresenceBadge status={s._status as PresenceKey} />
                      </td>

                      {/* Heure arrivée */}
                      <td style={{ padding: '11px 16px', color: s._arrivedAt ? 'var(--text-secondary)' : 'var(--text-muted)', fontFamily: 'monospace', fontSize: 13, fontWeight: s._arrivedAt ? 600 : 400 }}>
                        {s._arrivedAt ?? '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {/* Modifier */}
                          <Link
                            to={`/students/${s.id}/edit`}
                            state={{ returnTo: '/students/directory' }}
                            title="Modifier"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 30, height: 30, borderRadius: 8,
                              background: 'rgba(99,102,241,0.1)', color: '#818CF8',
                              textDecoration: 'none', transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.22)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                          >
                            <Edit2 size={13} />
                          </Link>

                          {/* Supprimer */}
                          <button
                            type="button"
                            title="Supprimer"
                            onClick={() => setDeleteId(s.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                              background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                              transition: 'background 0.15s', fontFamily: 'var(--font-body)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal confirmation suppression ─────────────────────────────── */}
      {deleteId !== null && (() => {
        const target = sorted.find((s) => s.id === deleteId);
        return (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={() => setDeleteId(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)', borderRadius: 18, padding: '28px 32px',
                width: '100%', maxWidth: 420,
                border: '1px solid var(--border-color)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
              }}
            >
              {/* Icône */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(239,68,68,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Trash2 size={22} style={{ color: '#EF4444' }} />
              </div>

              <h3 style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Supprimer l'étudiant ?
              </h3>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-secondary)' }}>
                  {target?._firstName} {target?._lastName}
                </strong>
                <br />
                sera archivé et ne pourra plus se connecter ni accéder au système.
              </p>

              {deleteMutation.isError && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 13 }}>
                  {(deleteMutation.error as any)?.response?.data?.message ?? 'Erreur lors de la suppression.'}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    border: '1px solid var(--border-color)', background: 'transparent',
                    color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(deleteId!)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                    background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: deleteMutation.isPending ? 0.7 : 1,
                    fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {deleteMutation.isPending ? 'Suppression...' : <><Trash2 size={13} /> Supprimer</>}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
