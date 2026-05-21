import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Eye,
  Filter,
  Shield,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Wifi,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDataTable } from '@/hooks/useDataTable';
import { rfidService } from '@/services/rfid.service';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { RfidBadge } from '@/components/common/RfidBadge';
import { LiveRfidFeed } from '@/components/common/LiveRfidFeed';
import { formatDateTime, downloadBlob } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

/**
 * Page Accès RFID - Monitoring en temps réel
 *
 * Affiche tous les événements d'accès RFID avec :
 * - Accès normaux (étudiants)
 * - Accès admin (carte passe-partout)
 * - Overrides admin (forcer accès étudiant en retard)
 * - Refus d'accès avec raisons détaillées
 *
 * L'admin peut :
 * - Voir tous les logs en temps réel
 * - Filtrer par statut, type d'accès, date
 * - Forcer l'accès pour un étudiant refusé (override)
 * - Exporter les logs en CSV
 */

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'present', label: 'Présent' },
  { value: 'late', label: 'En retard' },
  { value: 'absent', label: 'Absent' },
  { value: 'refused', label: 'Refusé' },
];

const ACCESS_TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'normal', label: 'Normal (étudiant)' },
  { value: 'admin_scan', label: 'Carte admin' },
  { value: 'admin_override', label: 'Override admin' },
];

/** Badge pour le type d'accès */
function AccessTypeBadge({ type }: { type: string }) {
  switch (type) {
    case 'admin_scan':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      );
    case 'admin_override':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <ShieldCheck className="h-3 w-3" />
          Override
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          <Wifi className="h-3 w-3" />
          RFID
        </span>
      );
  }
}

/** Badge pour la raison de refus */
function RefusalReasonBadge({ reason }: { reason: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    card_not_found: { label: 'Carte inconnue', color: 'red' },
    card_inactive: { label: 'Carte inactive', color: 'gray' },
    no_course_today: { label: 'Pas de cours', color: 'blue' },
    outside_course_hours: { label: 'Hors horaire', color: 'orange' },
    max_lateness_exceeded: { label: 'Retard excessif', color: 'red' },
    wrong_classroom: { label: 'Mauvaise salle', color: 'red' },
    no_student_linked: { label: 'Non lié', color: 'gray' },
  };

  const info = labels[reason] || { label: reason, color: 'gray' };
  const colorClasses: Record<string, string> = {
    red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colorClasses[info.color]}`}>
      <AlertTriangle className="h-3 w-3" />
      {info.label}
    </span>
  );
}

export const RfidAccessPage: React.FC = () => {
  usePageTitle('Accès RFID');
  const { user } = useAuth();
  const { page, setPage, pageSize } = useDataTable();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [accessTypeFilter, setAccessTypeFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  // Modal override admin
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideData, setOverrideData] = useState({
    studentId: 0,
    classroomId: 0,
    timetableEntryId: 0,
    studentName: '',
    reason: '',
  });
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rfid-events', page, pageSize, startDate, endDate, statusFilter, accessTypeFilter],
    queryFn: () =>
      rfidService.getEvents({
        page,
        pageSize,
        startDate,
        endDate,
        status: statusFilter,
        accessType: accessTypeFilter,
      } as any),
  });

  const events = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await rfidService.exportCsv({ startDate, endDate, status: statusFilter } as any);
      downloadBlob(blob, 'acces-rfid.csv');
    } finally {
      setExporting(false);
    }
  };

  const handleAdminOverride = async () => {
    if (!overrideData.reason.trim()) return;
    setOverrideSubmitting(true);
    try {
      await rfidService.adminOverride(user?.universityId ?? 1, {
        studentId: overrideData.studentId,
        classroomId: overrideData.classroomId,
        timetableEntryId: overrideData.timetableEntryId,
        reason: overrideData.reason,
      });
      setShowOverrideModal(false);
      setOverrideData({ studentId: 0, classroomId: 0, timetableEntryId: 0, studentName: '', reason: '' });
      refetch();
    } catch (err) {
      console.error('Erreur override:', err);
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Accès RFID
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {total} événement{total > 1 ? 's' : ''} · Monitoring en temps réel
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Download size={16} />
          {exporting ? 'Export...' : 'Exporter CSV'}
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Date début</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Date fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Type d'accès</label>
          <select
            value={accessTypeFilter}
            onChange={(e) => setAccessTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {ACCESS_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setPage(1)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Filter size={14} />
          Filtrer
        </button>
      </div>

      {/* Contenu principal */}
      <div className="flex gap-5">
        {/* Tableau */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 dark:bg-gray-800 dark:border-gray-700">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          ) : events.length === 0 ? (
            <EmptyState title="Aucun accès" description="Aucun événement RFID ne correspond aux filtres." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 dark:bg-gray-750 dark:border-gray-600">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Date/Heure
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Personne
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Salle
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Cours
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Statut
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Détail
                    </th>
                    {isAdmin && (
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                  {events.map((e: any) => (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-gray-400">
                        {formatDateTime(e.timestamp || e.scannedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {e.personType === 'admin' && (
                            <Shield className="h-3.5 w-3.5 text-purple-500" />
                          )}
                          <div className="font-medium text-slate-800 dark:text-white text-xs">
                            {e.person ||
                              (e.student
                                ? e.student.firstName + ' ' + e.student.lastName
                                : '-')}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-gray-400">
                        {e.classroom || e.room?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-gray-400">
                        {e.course?.name || e.courseName || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <RfidBadge status={e.attendanceStatus || e.status} showLabel />
                      </td>
                      <td className="px-4 py-3">
                        <AccessTypeBadge type={e.accessType || e.access_type || 'normal'} />
                      </td>
                      <td className="px-4 py-3">
                        {e.reason || e.refusalReason ? (
                          <RefusalReasonBadge reason={e.reason || e.refusalReason} />
                        ) : e.minutesLate > 0 ? (
                          <span className="text-xs text-amber-600">{e.minutesLate} min retard</span>
                        ) : e.isAdminOverride || e.is_admin_override ? (
                          <span className="text-xs text-amber-600">
                            {e.overrideReason || e.override_reason || 'Override admin'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={'/rfid-access/' + e.id}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-600 text-slate-500 hover:text-blue-600 transition-colors inline-flex"
                              title="Voir les détails"
                            >
                              <Eye size={14} />
                            </Link>
                            {/* Bouton Override : uniquement si l'événement est refusé pour retard */}
                            {(e.status === 'refused' || e.attendanceStatus === 'refused') &&
                              (e.reason === 'max_lateness_exceeded' ||
                                e.refusalReason === 'max_lateness_exceeded') && (
                                <button
                                  onClick={() => {
                                    setOverrideData({
                                      studentId: e.studentId || e.student?.id || 0,
                                      classroomId: e.classroomId || e.room?.id || 0,
                                      timetableEntryId: e.timetableEntryId || e.sessionId || 0,
                                      studentName:
                                        e.person ||
                                        (e.student
                                          ? e.student.firstName + ' ' + e.student.lastName
                                          : 'Étudiant'),
                                      reason: '',
                                    });
                                    setShowOverrideModal(true);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 hover:text-amber-700 transition-colors inline-flex"
                                  title="Autoriser l'accès (override admin)"
                                >
                                  <UserCheck size={14} />
                                </button>
                              )}
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-gray-700">
              <p className="text-sm text-slate-500">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Préc.
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Suiv.
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Feed */}
        <div className="w-80 flex-shrink-0">
          <LiveRfidFeed />
        </div>
      </div>

      {/* Modal Override Admin */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Override Admin
                </h3>
                <p className="text-sm text-gray-500">
                  Autoriser l'accès malgré le retard
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Vous allez autoriser <strong>{overrideData.studentName}</strong> à entrer en salle
                  malgré un retard excessif. Cette action sera enregistrée dans l'historique.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Raison de l'autorisation *
                </label>
                <textarea
                  value={overrideData.reason}
                  onChange={(e) =>
                    setOverrideData((p) => ({ ...p, reason: e.target.value }))
                  }
                  placeholder="Ex: Transport en grève, raison médicale, autorisation exceptionnelle..."
                  rows={3}
                  className="w-full rounded-lg p-3 text-sm focus:outline-none"
                  style={{
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAdminOverride}
                  disabled={!overrideData.reason.trim() || overrideSubmitting}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {overrideSubmitting ? 'Autorisation...' : 'Autoriser l\'accès'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RfidAccessPage;
