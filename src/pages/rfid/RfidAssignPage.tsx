import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, CreditCard, Wifi, WifiOff, Trash2,
  ShieldCheck, ShieldOff, X, CheckCircle, AlertCircle,
  Users, Loader2,
} from 'lucide-react';
import { usePageTitle }   from '@/hooks/usePageTitle';
import { useAppSelector } from '@/store';
import { studentService } from '@/services/student.service';
import { rfidService }    from '@/services/rfid.service';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/* ════════════════════════════════════════════════════════════════════════════
   PAGE  — Attribution des cartes RFID
   Règle : numéro de carte = matricule de l'étudiant (toujours)
══════════════════════════════════════════════════════════════════════════════ */
export const RfidAssignPage = () => {
  usePageTitle('Attribution RFID');
  const queryClient  = useQueryClient();
  const authUser     = useAppSelector((s) => s.auth.user);
  const universityId = authUser?.universityId ?? 1;

  /* ── états ──────────────────────────────────────────────────────────── */
  const [search,     setSearch]     = useState('');
  const [filterCard, setFilterCard] = useState<'all' | 'with' | 'without'>('all');

  // Feedback inline par ligne (studentId → message)
  const [rowFeedback, setRowFeedback] = useState<Map<number, { type: 'ok' | 'err'; text: string }>>(new Map());

  // Modal gestion carte existante
  const [modal, setModal] = useState<{
    studentId:   number;
    studentName: string;
    regNum:      string;
    cardId:      string;
    cardNumber:  string;
    isActive:    boolean;
  } | null>(null);
  const [modalMsg, setModalMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  /* ── données ─────────────────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['students-rfid', universityId, search],
    queryFn: () => studentService.getAll(universityId, { search: search || undefined, limit: 200 } as any),
  });

  const raw: any[]  = (data as any)?.data ?? [];
  const students    = raw.filter((s) => {
    if (filterCard === 'with')    return !!s.rfid_card;
    if (filterCard === 'without') return !s.rfid_card;
    return true;
  });
  const withCard    = raw.filter((s) => !!s.rfid_card).length;
  const withoutCard = raw.length - withCard;

  /* ── helpers ─────────────────────────────────────────────────────────── */
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['students-rfid'] });
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };

  const setFeedback = (id: number, type: 'ok' | 'err', text: string) => {
    setRowFeedback((prev) => new Map(prev).set(id, { type, text }));
    setTimeout(() => setRowFeedback((prev) => { const n = new Map(prev); n.delete(id); return n; }), 3000);
  };

  /* ── mutation : attribution / réattribution (matricule = n° carte) ─── */
  const assignMut = useMutation({
    mutationFn: ({ studentId, regNum }: { studentId: number; regNum: string }) =>
      rfidService.assignToStudent(universityId, studentId, regNum),
    onSuccess: (_res, vars) => {
      setFeedback(vars.studentId, 'ok', 'Carte attribuée avec succès');
      refresh();
    },
    onError: (e: any, vars) => {
      setFeedback(vars.studentId, 'err', e?.response?.data?.message ?? "Erreur d'attribution.");
    },
  });

  /* ── mutations modal ────────────────────────────────────────────────── */
  const toggleMut = useMutation({
    mutationFn: (cardId: string) => rfidService.toggleCard(universityId, cardId),
    onSuccess: (res) => { setModalMsg({ type: 'ok', text: res.message }); refresh(); setTimeout(() => setModal(null), 900); },
    onError:   (e: any) => setModalMsg({ type: 'err', text: e?.response?.data?.message ?? 'Erreur.' }),
  });

  const deleteMut = useMutation({
    mutationFn: (cardId: string) => rfidService.deleteCard(universityId, cardId),
    onSuccess: (res) => { setModalMsg({ type: 'ok', text: res.message }); refresh(); setTimeout(() => setModal(null), 900); },
    onError:   (e: any) => setModalMsg({ type: 'err', text: e?.response?.data?.message ?? 'Erreur.' }),
  });

  /* ── ouvrir modal ────────────────────────────────────────────────────── */
  const openManageModal = (s: any) => {
    setModalMsg(null);
    setModal({
      studentId:   s.id,
      studentName: s.name ?? '—',
      regNum:      s.registration_number,
      cardId:      String(s.rfid_card.id),
      cardNumber:  s.rfid_card.card_number,
      isActive:    s.rfid_card.is_active,
    });
  };

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
          Attribution des cartes RFID
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          La carte est attribuée automatiquement à la création. Ce panneau permet de gérer les cartes existantes ou d'en attribuer manuellement.
        </p>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────── */}
      {!isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Total étudiants', value: raw.length,   color: '#818CF8', icon: Users },
            { label: 'Avec carte',      value: withCard,     color: '#10B981', icon: CreditCard },
            { label: 'Sans carte',      value: withoutCard,  color: '#F59E0B', icon: CreditCard },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} style={{
              borderRadius: 14, padding: '16px 20px',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '14px 14px 0 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} style={{ color }} />
                </div>
              </div>
              <p style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filtres ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '12px 14px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              borderRadius: 10, border: '1px solid var(--border-input)',
              background: 'var(--bg-input)', color: 'var(--text-primary)',
              fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)',
            }}
          />
        </div>
        {(['all','with','without'] as const).map((f) => {
          const labels = { all: 'Tous', with: '✓ Avec carte', without: '✗ Sans carte' };
          const active = filterCard === f;
          return (
            <button key={f} type="button" onClick={() => setFilterCard(f)} style={{
              padding: '8px 14px', borderRadius: 10,
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border-input)'}`,
              background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
              fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
            }}>
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        {isLoading ? <LoadingSpinner centered /> : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Users size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Aucun étudiant trouvé</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  {['Étudiant', 'Matricule / N° carte', 'Niveau', 'Statut', 'Action'].map((h) => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s: any, i: number) => {
                  const card       = s.rfid_card;
                  const hasCard    = !!card;
                  const active     = card?.is_active;
                  const isEven     = i % 2 === 0;
                  const feedback   = rowFeedback.get(s.id);
                  const isLoading2 = assignMut.isPending &&
                    (assignMut.variables as any)?.studentId === s.id;

                  return (
                    <tr
                      key={s.id}
                      style={{ borderBottom: '1px solid var(--border-color)', background: isEven ? 'transparent' : 'rgba(255,255,255,0.012)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isEven ? 'transparent' : 'rgba(255,255,255,0.012)')}
                    >
                      {/* Étudiant */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--accent-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: '#fff',
                          }}>
                            {(s.name ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{s.name ?? '—'}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.email ?? ''}</p>
                          </div>
                        </div>
                      </td>

                      {/* Matricule = N° carte */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {s.registration_number}
                        </span>
                        {hasCard && card.card_number !== s.registration_number && (
                          <p style={{ fontSize: 10, color: '#F59E0B', marginTop: 2 }}>
                            Carte actuelle : {card.card_number}
                          </p>
                        )}
                      </td>

                      {/* Niveau */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: '#818CF8' }}>
                          {s.level}
                        </span>
                      </td>

                      {/* Statut */}
                      <td style={{ padding: '12px 16px' }}>
                        {feedback ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                            background: feedback.type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)',
                            color: feedback.type === 'ok' ? '#10B981' : '#EF4444',
                          }}>
                            {feedback.type === 'ok' ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                            {feedback.text}
                          </span>
                        ) : hasCard ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                            background: active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)',
                            color: active ? '#10B981' : '#EF4444',
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? '#10B981' : '#EF4444', display: 'inline-block' }} />
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(245,158,11,0.10)', color: '#F59E0B' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                            Aucune carte
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '12px 16px' }}>
                        {hasCard ? (
                          <button type="button" onClick={() => openManageModal(s)} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                            background: 'rgba(99,102,241,0.1)', color: '#818CF8',
                            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                          }}>
                            <CreditCard size={13} /> Gérer
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isLoading2}
                            onClick={() => assignMut.mutate({ studentId: s.id, regNum: s.registration_number })}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '7px 14px', borderRadius: 9, border: 'none',
                              cursor: isLoading2 ? 'not-allowed' : 'pointer',
                              background: 'var(--accent-gradient)', color: '#fff',
                              fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                              boxShadow: 'var(--shadow-accent)', opacity: isLoading2 ? 0.7 : 1,
                            }}
                          >
                            {isLoading2
                              ? <Loader2 size={13} className="animate-spin" />
                              : <CreditCard size={13} />}
                            {isLoading2 ? 'Attribution...' : 'Attribuer'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MODAL — Gestion carte existante (activer / désactiver / supprimer)
      ════════════════════════════════════════════════════════════════ */}
      {modal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          onClick={() => setModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)', borderRadius: 20, padding: '28px 28px 24px',
              width: '100%', maxWidth: 400,
              border: '1px solid var(--border-color)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-accent)' }}>
                  <CreditCard size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Gérer la carte RFID</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {modal.studentName} · {modal.regNum}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setModal(null)} style={{
                width: 30, height: 30, borderRadius: 8, border: 'none',
                background: 'var(--bg-secondary)', color: 'var(--text-muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={15} />
              </button>
            </div>

            {/* Carte visuelle */}
            <div style={{
              borderRadius: 14, padding: '16px 20px', marginBottom: 18,
              background: modal.isActive
                ? 'linear-gradient(135deg,#059669,#10B981,#34D399)'
                : 'linear-gradient(135deg,#374151,#6B7280)',
              boxShadow: modal.isActive ? '0 8px 24px rgba(16,185,129,0.40)' : '0 8px 24px rgba(0,0,0,0.30)',
              color: '#fff', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.75 }}>Carte RFID Étudiant</span>
                {modal.isActive ? <Wifi size={16} style={{ opacity: 0.9 }} /> : <WifiOff size={16} style={{ opacity: 0.65 }} />}
              </div>
              <p style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: 700, letterSpacing: '0.14em', marginBottom: 12 }}>
                {modal.cardNumber}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{modal.studentName}</span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
                  {modal.isActive ? '● ACTIVE' : '● INACTIVE'}
                </span>
              </div>
            </div>

            {/* Feedback */}
            {modalMsg && (
              <div style={{
                marginBottom: 16, padding: '10px 14px', borderRadius: 10, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
                background: modalMsg.type === 'ok' ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                border: `1px solid ${modalMsg.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: modalMsg.type === 'ok' ? '#10B981' : '#EF4444',
              }}>
                {modalMsg.type === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {modalMsg.text}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                disabled={toggleMut.isPending}
                onClick={() => { setModalMsg(null); toggleMut.mutate(modal.cardId); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: modal.isActive ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                  color: modal.isActive ? '#F59E0B' : '#10B981',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                  opacity: toggleMut.isPending ? 0.6 : 1,
                }}
              >
                {modal.isActive ? <><ShieldOff size={14} /> Désactiver</> : <><ShieldCheck size={14} /> Activer</>}
              </button>
              <button
                type="button"
                disabled={deleteMut.isPending}
                onClick={() => {
                  if (window.confirm('Supprimer définitivement cette carte ?')) {
                    setModalMsg(null);
                    deleteMut.mutate(modal.cardId);
                  }
                }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'rgba(239,68,68,0.10)', color: '#EF4444',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                  opacity: deleteMut.isPending ? 0.6 : 1,
                }}
              >
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RfidAssignPage;
