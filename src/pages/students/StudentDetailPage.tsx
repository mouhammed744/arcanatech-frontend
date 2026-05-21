import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Edit, User, Mail, Phone, CreditCard,
  BookOpen, Hash, Wifi, WifiOff,
  Trash2, ShieldCheck, ShieldOff, CheckCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { studentService } from '@/services/student.service';
import { rfidService }    from '@/services/rfid.service';
import { usePageTitle }   from '@/hooks/usePageTitle';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader }     from '@/components/common/PageHeader';
import { useAppSelector } from '@/store';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const InfoRow = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
    <Icon size={16} style={{ color: 'var(--text-muted)', marginTop: 3, flexShrink: 0 }} />
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{value ?? '—'}</p>
    </div>
  </div>
);

type Tab = 'info' | 'rfid';

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export const StudentDetailPage = () => {
  usePageTitle('Détail étudiant');
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const authUser     = useAppSelector((s) => s.auth.user);
  const universityId = authUser?.universityId ?? 1;

  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [rfidMsg,   setRfidMsg]   = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  /* ── query ────────────────────────────────────────────────────────────── */
  const { data: raw, isLoading, error } = useQuery({
    queryKey: ['student', universityId, id],
    queryFn:  () => studentService.getById(universityId, id!),
    enabled:  !!id,
  });

  /* ── mutations RFID ──────────────────────────────────────────────────── */
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['student', universityId, id] });
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };

  // Attribution directe : le numéro de carte = matricule de l'étudiant
  const assignMut = useMutation({
    mutationFn: () => {
      const matricule = (raw as any)?.registration_number ?? '';
      return rfidService.assignToStudent(universityId, Number(id), matricule);
    },
    onSuccess: (res) => { setRfidMsg({ type: 'ok', text: res.message }); refresh(); },
    onError:   (e: any) => setRfidMsg({ type: 'err', text: e?.response?.data?.message ?? "Erreur d'attribution." }),
  });

  const toggleMut = useMutation({
    mutationFn: (cardId: string) => rfidService.toggleCard(universityId, cardId),
    onSuccess: (res) => { setRfidMsg({ type: 'ok', text: res.message }); refresh(); },
    onError:   (e: any) => setRfidMsg({ type: 'err', text: e?.response?.data?.message ?? 'Erreur statut.' }),
  });

  const deleteMut = useMutation({
    mutationFn: (cardId: string) => rfidService.deleteCard(universityId, cardId),
    onSuccess: (res) => { setRfidMsg({ type: 'ok', text: res.message }); refresh(); },
    onError:   (e: any) => setRfidMsg({ type: 'err', text: e?.response?.data?.message ?? 'Erreur suppression.' }),
  });

  /* ── states ──────────────────────────────────────────────────────────── */
  if (isLoading) return <LoadingSpinner centered />;
  if (error || !raw) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: '#EF4444' }}>Erreur lors du chargement de l'étudiant.</p>
        <button onClick={() => navigate('/students')} style={{ marginTop: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Retour à la liste
        </button>
      </div>
    );
  }

  /* ── données dérivées ─────────────────────────────────────────────────── */
  const s          = raw as any;
  const fullName   = s.user?.name ?? s.name ?? '—';
  const email      = s.user?.email ?? s.email ?? '—';
  const phone      = s.user?.phone ?? s.phone;
  const gender     = s.user?.gender ?? s.gender;
  const regNum     = s.registration_number;
  const level      = s.level;
  const rfidCard   = s.rfid_card;
  const hasCard    = !!rfidCard;
  const isActive   = rfidCard?.is_active ?? false;
  const cardId     = String(rfidCard?.id ?? '');

  const genderDisplay = gender === 'M' ? '♂ Masculin' : gender === 'F' ? '♀ Féminin' : null;

  /* ── tab button ───────────────────────────────────────────────────────── */
  const TabBtn = ({ tab, label, badge }: { tab: Tab; label: string; badge?: string }) => {
    const active = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => { setActiveTab(tab); setRfidMsg(null); }}
        style={{
          padding: '11px 22px',
          border: 'none',
          borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
          background: 'transparent',
          fontSize: 13, fontWeight: active ? 700 : 500,
          color: active ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7,
          transition: 'color 0.15s',
          fontFamily: 'var(--font-body)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        {badge !== undefined && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99,
            background: active ? 'var(--accent)' : 'var(--bg-secondary)',
            color: active ? '#fff' : 'var(--text-muted)',
          }}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <PageHeader
        title={fullName}
        subtitle={regNum}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('/students')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >
              <ArrowLeft size={15} /> Retour
            </button>
            <Link
              to={`/students/${id}/edit`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10,
                background: 'var(--accent-gradient)', color: '#fff',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}
            >
              <Edit size={15} /> Modifier
            </Link>
          </div>
        }
      />

      {/* ── Tabs bar ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        borderRadius: '14px 14px 0 0',
        padding: '0 6px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <TabBtn tab="info" label="📋 Informations" />
        <TabBtn tab="rfid" label="💳 Carte RFID" badge={hasCard ? (isActive ? 'Active' : 'Inactive') : '—'} />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB INFORMATIONS
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>

          {/* Infos personnelles */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '22px 24px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>
              Informations personnelles
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <InfoRow icon={User}       label="Nom complet" value={fullName} />
              <InfoRow icon={Mail}       label="Email"       value={email} />
              {phone && <InfoRow icon={Phone} label="Téléphone" value={phone} />}
              {genderDisplay && (
                <InfoRow
                  icon={User}
                  label="Sexe"
                  value={
                    <span style={{ color: gender === 'F' ? '#EC4899' : '#60A5FA', fontWeight: 600 }}>
                      {genderDisplay}
                    </span>
                  }
                />
              )}
              <InfoRow icon={Hash}       label="Matricule"   value={<span style={{ fontFamily: 'monospace' }}>{regNum}</span>} />
              <InfoRow icon={BookOpen}   label="Niveau"      value={level} />
              <InfoRow
                icon={CreditCard}
                label="Carte RFID"
                value={
                  hasCard ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                      color: isActive ? '#10B981' : '#EF4444',
                    }}>
                      {isActive ? '● Active' : '● Inactive'} — {rfidCard.card_number}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 13 }}>Non assignée</span>
                  )
                }
              />
            </div>
          </div>

          {/* Statistiques */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '22px 24px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Statistiques
            </h2>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)', lineHeight: 1, marginBottom: 4 }}>
              {s.overall_statistics?.total_courses ?? s.enrollment_count ?? 0}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>cours inscrits</p>

            {s.overall_statistics?.overall_attendance_rate != null && (
              <>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Taux de présence</p>
                <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-secondary)', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    width: `${s.overall_statistics.overall_attendance_rate}%`,
                    height: '100%', background: 'var(--accent-gradient)', borderRadius: 99,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                  {s.overall_statistics.overall_attendance_rate}%
                </p>
              </>
            )}

            {/* Mini stats grid */}
            {s.overall_statistics && (
              <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Présences', value: s.overall_statistics.present_count, color: '#10B981' },
                  { label: 'Retards',   value: s.overall_statistics.late_count,    color: '#F59E0B' },
                  { label: 'Absences',  value: s.overall_statistics.absent_count,  color: '#EF4444' },
                  { label: 'Séances',   value: s.overall_statistics.total_sessions_attended, color: '#818CF8' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '10px 10px', borderRadius: 10, background: 'var(--bg-secondary)', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1, marginBottom: 3 }}>{value ?? 0}</p>
                    <p style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB CARTE RFID
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'rfid' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* ── Carte actuelle ────────────────────────────────────── */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '22px 24px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>
              Carte RFID actuelle
            </h2>

            {hasCard ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Visuel carte */}
                <div style={{
                  borderRadius: 16,
                  padding: '20px 22px',
                  background: isActive
                    ? 'linear-gradient(135deg,#059669,#10B981,#34D399)'
                    : 'linear-gradient(135deg,#374151,#6B7280)',
                  boxShadow: isActive
                    ? '0 10px 32px rgba(16,185,129,0.40)'
                    : '0 10px 32px rgba(0,0,0,0.30)',
                  color: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: 130,
                }}>
                  {/* Orbs décoratifs */}
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.75 }}>
                      Carte RFID Étudiant
                    </span>
                    {isActive
                      ? <Wifi size={18} style={{ opacity: 0.9 }} />
                      : <WifiOff size={18} style={{ opacity: 0.65 }} />}
                  </div>

                  <p style={{ position: 'relative', fontFamily: 'monospace', fontSize: 18, fontWeight: 700, letterSpacing: '0.15em', marginBottom: 18 }}>
                    {rfidCard.card_number}
                  </p>

                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <p style={{ fontSize: 9, opacity: 0.65, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>Titulaire</p>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{fullName}</p>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                      padding: '3px 10px', borderRadius: 99,
                      background: 'rgba(255,255,255,0.20)',
                      border: '1px solid rgba(255,255,255,0.30)',
                    }}>
                      {isActive ? '● ACTIVE' : '● INACTIVE'}
                    </span>
                  </div>
                </div>

                {/* Compteurs scans */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    { label: 'Total',    val: rfidCard.total_scans      ?? 0 },
                    { label: 'Réussis',  val: rfidCard.successful_scans ?? 0 },
                    { label: 'Refusés', val: rfidCard.failed_scans     ?? 0 },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{val}</p>
                      <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Dates */}
                {rfidCard.issued_at && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    Attribuée le <strong style={{ color: 'var(--text-secondary)' }}>
                      {new Date(rfidCard.issued_at).toLocaleDateString('fr-FR')}
                    </strong>
                    {rfidCard.last_scanned_at && (
                      <><br />Dernier scan le <strong style={{ color: 'var(--text-secondary)' }}>
                        {new Date(rfidCard.last_scanned_at).toLocaleDateString('fr-FR')}
                      </strong></>
                    )}
                  </p>
                )}

                {/* Boutons Activer/Désactiver + Supprimer */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    disabled={toggleMut.isPending}
                    onClick={() => { setRfidMsg(null); toggleMut.mutate(cardId); }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: isActive ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                      color: isActive ? '#F59E0B' : '#10B981',
                      fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                      opacity: toggleMut.isPending ? 0.6 : 1,
                    }}
                  >
                    {isActive ? <><ShieldOff size={14} /> Désactiver</> : <><ShieldCheck size={14} /> Activer</>}
                  </button>
                  <button
                    type="button"
                    disabled={deleteMut.isPending}
                    onClick={() => {
                      if (window.confirm('Supprimer définitivement cette carte RFID ? Action irréversible.')) {
                        setRfidMsg(null);
                        deleteMut.mutate(cardId);
                      }
                    }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'rgba(239,68,68,0.10)', color: '#EF4444',
                      fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                      opacity: deleteMut.isPending ? 0.6 : 1,
                    }}
                  >
                    <Trash2 size={14} /> Supprimer
                  </button>
                </div>

              </div>
            ) : (
              /* Aucune carte */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: 12 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(99,102,241,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CreditCard size={28} style={{ color: 'var(--accent)' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Aucune carte assignée</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                  Utilisez le formulaire ci-contre pour attribuer une carte RFID à cet étudiant.
                </p>
              </div>
            )}
          </div>

          {/* ── Attribution / Info ────────────────────────────────── */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '22px 24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {hasCard ? '🔄 Numéro de carte' : '➕ Attribuer une carte'}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Le numéro de la carte RFID est automatiquement le matricule de l'étudiant.
              </p>
            </div>

            {/* Numéro de carte prévu (= matricule) */}
            <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                Numéro de carte
              </p>
              <p style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.12em' }}>
                {regNum}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                = matricule de l'étudiant
              </p>
            </div>

            {/* Feedback */}
            {rfidMsg && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
                background: rfidMsg.type === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${rfidMsg.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: rfidMsg.type === 'ok' ? '#10B981' : '#EF4444',
              }}>
                <CheckCircle size={14} />
                {rfidMsg.text}
              </div>
            )}

            {/* Bouton attribution directe */}
            <button
              type="button"
              disabled={assignMut.isPending}
              onClick={() => { setRfidMsg(null); assignMut.mutate(); }}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 0', borderRadius: 10, border: 'none',
                background: 'var(--accent-gradient)', color: '#fff',
                fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
                cursor: assignMut.isPending ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-accent)',
                opacity: assignMut.isPending ? 0.7 : 1,
              }}
            >
              {assignMut.isPending
                ? <><CreditCard size={15} className="animate-spin" /> Attribution...</>
                : <><CreditCard size={15} /> {hasCard ? 'Réattribuer la carte' : 'Attribuer la carte'}</>}
            </button>

            {/* Étudiant ciblé */}
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={16} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fullName}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{regNum} · {level}</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
