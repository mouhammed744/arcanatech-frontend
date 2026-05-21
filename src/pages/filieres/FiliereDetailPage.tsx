import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  Plus,
  Users,
  GraduationCap,
  CreditCard,
  Mail,
  Hash,
  BookOpen,
  Eye,
  CheckCircle,
  XCircle,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import filiereService from '@/services/filiere.service';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function FiliereDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const universityId = user?.universityId ?? 1;

  const { data: filiere, isLoading, error } = useQuery({
    queryKey: ['filiere', universityId, id],
    queryFn: () => filiereService.getById(universityId, Number(id)),
    enabled: !!id,
  });

  usePageTitle(filiere ? `${filiere.name} (${filiere.level})` : 'Filière');

  if (isLoading) return <LoadingSpinner centered />;

  if (error || !filiere) {
    return (
      <div className="p-6">
        <p className="text-red-500">Impossible de charger cette filière.</p>
        <button
          onClick={() => navigate('/filieres')}
          className="mt-4 flex items-center gap-1"
          style={{ color: 'var(--accent)' }}
        >
          <ArrowLeft size={16} /> Retour aux filières
        </button>
      </div>
    );
  }

  // Le backend retourne les étudiants en snake_case
  const students = (filiere.students as any[]) ?? [];

  const levelColors: Record<string, string> = {
    L1: '#6366F1, #818CF8',
    L2: '#0EA5E9, #38BDF8',
    L3: '#10B981, #34D399',
    M1: '#F59E0B, #FBBF24',
    M2: '#EF4444, #F87171',
    D1: '#8B5CF6, #A78BFA',
    D2: '#EC4899, #F472B6',
    D3: '#14B8A6, #2DD4BF',
  };

  const gradient = levelColors[filiere.level] ?? '#6366F1, #818CF8';

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/filieres')}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-sm flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${gradient})` }}
          >
            {filiere.code?.substring(0, 3)}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {filiere.name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                {filiere.code}
              </span>
              <span style={{ color: 'var(--border-color)' }}>·</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: `linear-gradient(135deg, ${gradient})`, color: '#fff' }}
              >
                {filiere.level}
              </span>
              {filiere.department && (
                <>
                  <span style={{ color: 'var(--border-color)' }}>·</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Building2 size={12} className="inline mr-1" />
                    {filiere.department}
                  </span>
                </>
              )}
              <span style={{ color: 'var(--border-color)' }}>·</span>
              {filiere.isActive ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={12} /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <XCircle size={12} /> Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/filieres/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <Pencil size={15} /> Modifier
          </Link>
          <Link
            to={`/students/new?filiereId=${id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium text-sm transition-colors"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Plus size={15} /> Ajouter un étudiant
          </Link>
        </div>
      </div>

      {/* ─── Stats rapides ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-soft)' }}
          >
            <Users size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {students.length}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>étudiants</p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}
          >
            <CreditCard size={20} style={{ color: '#10B981' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {students.filter((s: any) => s.has_rfid && s.rfid_active).length}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>cartes RFID actives</p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}
          >
            <BookOpen size={20} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {(filiere as any).timetable?.length ?? 0}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>créneaux cours</p>
          </div>
        </div>
      </div>

      {/* ─── Description ─── */}
      {filiere.description && (
        <div
          className="rounded-xl px-5 py-4"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {filiere.description}
          </p>
        </div>
      )}

      {/* ─── Liste des étudiants ─── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
      >
        {/* En-tête du tableau */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <GraduationCap size={18} style={{ color: 'var(--accent)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Étudiants inscrits
            </h2>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {students.length}
            </span>
          </div>
          <Link
            to={`/students/new?filiereId=${id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            <Plus size={14} /> Ajouter
          </Link>
        </div>

        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <Users size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Aucun étudiant dans cette filière
            </p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Commencez par ajouter des étudiants
            </p>
            <Link
              to={`/students/new?filiereId=${id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <Plus size={15} /> Ajouter le premier étudiant
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    <Hash size={12} className="inline mr-1" /> Matricule
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Nom complet
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    <Mail size={12} className="inline mr-1" /> Email
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Niveau
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    <CreditCard size={12} className="inline mr-1" /> RFID
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((s: any, idx: number) => (
                  <tr
                    key={s.id}
                    className="transition-colors"
                    style={{
                      borderBottom: idx < students.length - 1 ? '1px solid var(--border-color)' : undefined,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s.registration_number}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {s.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {s.email}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        {s.level}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {s.has_rfid && s.rfid_active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle size={13} /> Active
                        </span>
                      ) : s.has_rfid ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <XCircle size={13} /> Inactive
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Non assignée
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/students/${s.id}`}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Voir le détail"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          to={`/students/${s.id}/edit`}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Modifier"
                        >
                          <Pencil size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
