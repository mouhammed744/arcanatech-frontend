import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Users,
  Clock,
  MapPin,
  Calendar,
  BookOpen,
  Shield,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import filiereService from '@/services/filiere.service';
import type { Filiere, BulkScheduleUpdateDto } from '@/types/filiere.types';

export default function BulkUpdatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const universityId = user?.universityId ?? 1;

  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [courses, _setCourses] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [classrooms, _setClassrooms] = useState<Array<{ id: number; name: string; building: string }>>([]);
  void _setCourses; void _setClassrooms;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    affectedStudents?: number;
    affectedEntries?: number;
  } | null>(null);

  const [selectedFilieres, setSelectedFilieres] = useState<number[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | ''>('');
  const [updates, setUpdates] = useState({
    classroomId: '' as number | '',
    startTime: '',
    endTime: '',
    dayOfWeek: '',
    startDate: '',
    endDate: '',
  });

  const daysOfWeek = [
    { value: 'Monday', label: 'Lundi' },
    { value: 'Tuesday', label: 'Mardi' },
    { value: 'Wednesday', label: 'Mercredi' },
    { value: 'Thursday', label: 'Jeudi' },
    { value: 'Friday', label: 'Vendredi' },
    { value: 'Saturday', label: 'Samedi' },
  ];

  useEffect(() => {
    loadData();
  }, [universityId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [filieresResult] = await Promise.all([
        filiereService.getAll(universityId, { activeOnly: true }),
      ]);
      setFilieres(filieresResult.data);
    } catch (err) {
      console.error('Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFiliere = (id: number) => {
    setSelectedFilieres((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const selectAllFilieres = () => {
    if (selectedFilieres.length === filieres.length) {
      setSelectedFilieres([]);
    } else {
      setSelectedFilieres(filieres.map((f) => f.id));
    }
  };

  const totalStudents = filieres
    .filter((f) => selectedFilieres.includes(f.id))
    .reduce((sum, f) => sum + f.studentsCount, 0);

  const hasUpdates = Object.values(updates).some((v) => v !== '' && v !== 0);

  const handleSubmit = async () => {
    if (selectedFilieres.length === 0 || !selectedCourse || !hasUpdates) return;

    setSubmitting(true);
    setResult(null);

    try {
      const dto: BulkScheduleUpdateDto = {
        filiereIds: selectedFilieres,
        courseId: selectedCourse as number,
        updates: {
          ...(updates.classroomId && { classroomId: updates.classroomId as number }),
          ...(updates.startTime && { startTime: updates.startTime + ':00' }),
          ...(updates.endTime && { endTime: updates.endTime + ':00' }),
          ...(updates.dayOfWeek && { dayOfWeek: updates.dayOfWeek }),
          ...(updates.startDate && { startDate: updates.startDate }),
          ...(updates.endDate && { endDate: updates.endDate }),
        },
      };

      const response = await filiereService.bulkUpdateSchedule(universityId, dto);
      setResult({
        success: true,
        message: response.message,
        affectedStudents: response.details.affectedStudents,
        affectedEntries: response.details.affectedEntries,
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.response?.data?.message || 'Erreur lors de la mise à jour',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/filieres')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mise à jour en masse
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Modifier l'emploi du temps pour tous les étudiants de filière(s)
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
              Protection des données personnelles
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Cette interface permet de modifier uniquement les informations d'emploi du temps
              (heure, date, salle). Les informations personnelles des étudiants (nom, email,
              carte RFID...) ne peuvent <strong>pas</strong> être modifiées en masse.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filières ciblées
              </h2>
              <button
                onClick={selectAllFilieres}
                className="text-xs font-medium link-accent"
              >
                {selectedFilieres.length === filieres.length ? 'Désélectionner tout' : 'Tout sélectionner'}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filieres.map((filiere) => (
                  <label
                    key={filiere.id}
                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all"
                    style={{
                      borderColor: selectedFilieres.includes(filiere.id) ? 'var(--accent)' : 'var(--border-color)',
                      backgroundColor: selectedFilieres.includes(filiere.id) ? 'var(--accent-muted)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFilieres.includes(filiere.id)}
                      onChange={() => toggleFiliere(filiere.id)}
                      className="h-4 w-4 rounded border-gray-300"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {filiere.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {filiere.code} · {filiere.level} · {filiere.studentsCount} étudiants
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {selectedFilieres.length > 0 && (
              <div className="mt-4 rounded-lg p-3" style={{ backgroundColor: 'var(--accent-muted)' }}>
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--accent)' }}>
                  <Users className="h-4 w-4" />
                  {selectedFilieres.length} filière(s) · {totalStudents} étudiants concernés
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <BookOpen className="inline h-5 w-5 mr-2" style={{ color: 'var(--accent)' }} />
              Cours à modifier
            </h2>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Sélectionner un cours...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <Zap className="inline h-5 w-5 mr-2 text-amber-500" />
              Modifications à appliquer
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Remplissez uniquement les champs que vous souhaitez modifier.
              Les champs vides ne seront pas modifiés.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  Nouvelle salle
                </label>
                <select
                  value={updates.classroomId}
                  onChange={(e) =>
                    setUpdates((p) => ({
                      ...p,
                      classroomId: e.target.value ? Number(e.target.value) : '',
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Ne pas modifier</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.building}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Nouveau jour
                </label>
                <select
                  value={updates.dayOfWeek}
                  onChange={(e) => setUpdates((p) => ({ ...p, dayOfWeek: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Ne pas modifier</option>
                  {daysOfWeek.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Nouvelle heure de début
                </label>
                <input
                  type="time"
                  value={updates.startTime}
                  onChange={(e) => setUpdates((p) => ({ ...p, startTime: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Nouvelle heure de fin
                </label>
                <input
                  type="time"
                  value={updates.endTime}
                  onChange={(e) => setUpdates((p) => ({ ...p, endTime: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Date de début de période
                </label>
                <input
                  type="date"
                  value={updates.startDate}
                  onChange={(e) => setUpdates((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Date de fin de période
                </label>
                <input
                  type="date"
                  value={updates.endDate}
                  onChange={(e) => setUpdates((p) => ({ ...p, endDate: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {result && (
            <div
              className={`rounded-xl p-4 ${
                result.success
                  ? 'border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                  : 'border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      result.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.success && result.affectedStudents !== undefined && (
                    <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                      {result.affectedEntries} session(s) modifiée(s) · {result.affectedStudents} étudiant(s)
                      concerné(s)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
            <div className="text-sm text-gray-500">
              {selectedFilieres.length > 0 && hasUpdates && selectedCourse ? (
                <span className="font-medium" style={{ color: 'var(--accent)' }}>
                  Prêt à mettre à jour {totalStudents} étudiants de {selectedFilieres.length} filière(s)
                </span>
              ) : (
                'Sélectionnez des filières, un cours et au moins une modification'
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={selectedFilieres.length === 0 || !selectedCourse || !hasUpdates || submitting}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors btn-accent"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Mise à jour en cours...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Appliquer la mise à jour
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
