import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Search,
  Users,
  BookOpen,
  Filter,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Pencil,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import filiereService from '@/services/filiere.service';
import type { Filiere } from '@/types/filiere.types';

/**
 * Page de gestion des Filières
 *
 * L'administrateur peut :
 * - Voir toutes les filières avec le nombre d'étudiants
 * - Créer, modifier, supprimer des filières
 * - Accéder à la mise à jour en masse par filière
 */
export default function FilieresListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const universityId = user?.universityId ?? 1;

  useEffect(() => {
    loadFilieres();
  }, [universityId, search, levelFilter]);

  const loadFilieres = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await filiereService.getAll(universityId, {
        search: search || undefined,
        level: levelFilter || undefined,
      });
      // Normalize snake_case → camelCase (compatibility backend)
      const normalized = (result.data as any[]).map((f: any) => ({
        id: f.id,
        code: f.code,
        name: f.name,
        description: f.description,
        level: f.level,
        department: f.department,
        isActive: f.isActive ?? f.is_active ?? true,
        studentsCount: f.studentsCount ?? f.students_count ?? 0,
      })) as Filiere[];
      setFilieres(normalized);
    } catch (err: any) {
      console.error('Erreur chargement filières:', err);
      const msg = err?.response?.data?.message
        || err?.message
        || 'Impossible de charger les filières. Vérifiez que le serveur est démarré et les migrations exécutées.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const levels = ['L1', 'L2', 'L3', 'M1', 'M2'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Filières
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez les filières et la mise à jour en masse des emplois du temps
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/filieres/bulk-update"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Mise à jour en masse
          </Link>
          <Link
            to="/filieres/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-colors btn-accent"
          >
            <Plus className="h-4 w-4" />
            Nouvelle filière
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une filière..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none"
            style={{
              border: '1px solid var(--border-input)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg py-2.5 px-3 text-sm focus:outline-none"
            style={{
              border: '1px solid var(--border-input)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Tous les niveaux</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Erreur de chargement */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Erreur lors du chargement des filières
            </p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</p>
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
              💡 Si le problème persiste, exécutez <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">php artisan migrate</code> dans le dossier du backend.
            </p>
          </div>
          <button
            onClick={loadFilieres}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Réessayer
          </button>
        </div>
      )}

      {/* Liste des filières */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : !error && filieres.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm dark:bg-gray-800">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Aucune filière
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Créez votre première filière pour organiser les étudiants
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filieres.map((filiere) => (
            <div
              key={filiere.id}
              onClick={() => navigate(`/filieres/${filiere.id}`)}
              className="group rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-gray-800 border border-gray-100 dark:border-gray-700 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-sm flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${getColorForLevel(filiere.level)})`,
                    }}
                  >
                    {filiere.code.substring(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-semibold transition-colors group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                      {filiere.name}
                    </h3>
                    <p className="text-xs text-gray-500">{filiere.code} — {filiere.level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/filieres/${filiere.id}/edit`); }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bg-secondary)]"
                    style={{ color: 'var(--text-muted)' }}
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>

              {filiere.description && (
                <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                  {filiere.description}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{filiere.studentsCount ?? 0}</span>
                    <span className="text-gray-400">étudiants</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {filiere.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <ToggleRight className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      <ToggleLeft className="h-3 w-3" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {filiere.department && (
                <div className="mt-2 text-xs text-gray-400">
                  Département : {filiere.department}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getColorForLevel(level: string): string {
  const colors: Record<string, string> = {
    L1: '#6366F1, #818CF8',
    L2: '#0EA5E9, #38BDF8',
    L3: '#10B981, #34D399',
    M1: '#F59E0B, #FBBF24',
    M2: '#EF4444, #F87171',
  };
  return colors[level] || '#6366F1, #818CF8';
}
