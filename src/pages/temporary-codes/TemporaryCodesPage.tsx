import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  KeyRound,
  Plus,
  Search,
  X,
  Copy,
  Check,
  Trash2,
  Clock,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/hooks/useAuth';
import { temporaryCodeService } from '@/services/temporaryCode.service';
import type { TemporaryCode, GenerateCodePayload, StudentSearchResult } from '@/services/temporaryCode.service';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

// ═══════════════════════════════════════════════════════
// Codes Temporaires - Generation et gestion des codes d'acces
//
// Permet a l'admin de generer un code temporaire pour un
// etudiant qui n'a pas sa carte RFID. Le code peut etre
// communique oralement et saisi sur le terminal d'acces.
// ═══════════════════════════════════════════════════════

const DURATION_OPTIONS = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 heure' },
];

/** Calcule le temps restant avant expiration */
function getTimeRemaining(expiresAt: string): string {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) return 'Expire';

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Badge de statut pour un code temporaire */
function StatusBadge({ code }: { code: TemporaryCode }) {
  if (code.isUsed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <Check className="h-3 w-3" />
        Utilise
      </span>
    );
  }
  if (code.isExpired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
        <Clock className="h-3 w-3" />
        Expire
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <RefreshCw className="h-3 w-3" />
      Actif
    </span>
  );
}

/** Formater une date pour l'affichage */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const TemporaryCodesPage: React.FC = () => {
  usePageTitle('Codes Temporaires');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const universityId = user?.universityId ?? 1;

  // State
  const [activeOnly, setActiveOnly] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<TemporaryCode | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-refresh countdown
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  // ── Data fetching ──
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['temporary-codes', universityId, activeOnly],
    queryFn: () => temporaryCodeService.list(universityId, activeOnly),
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  const codes: TemporaryCode[] = data?.data || data || [];

  // Countdown timer for auto-refresh indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset countdown when data refetches
  useEffect(() => {
    setRefreshCountdown(30);
  }, [data]);

  // ── Revoke mutation ──
  const revokeMutation = useMutation({
    mutationFn: (codeId: string) => temporaryCodeService.revoke(universityId, codeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temporary-codes'] });
    },
  });

  // ── Copy code to clipboard ──
  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // ── Handle successful generation ──
  const handleCodeGenerated = useCallback((newCode: TemporaryCode) => {
    setGeneratedCode(newCode);
    queryClient.invalidateQueries({ queryKey: ['temporary-codes'] });
  }, [queryClient]);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Codes Temporaires
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {codes.length} code{codes.length > 1 ? 's' : ''} &middot; Rafraichissement dans {refreshCountdown}s
          </p>
        </div>
        <button
          onClick={() => {
            setGeneratedCode(null);
            setShowGenerateModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Generer un code
        </button>
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveOnly(!activeOnly)}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          {activeOnly ? (
            <ToggleRight size={22} className="text-blue-600" />
          ) : (
            <ToggleLeft size={22} className="text-slate-400" />
          )}
          Codes actifs uniquement
        </button>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 dark:bg-gray-800 dark:border-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner />
          </div>
        ) : codes.length === 0 ? (
          <EmptyState
            icon={<KeyRound size={28} />}
            title="Aucun code temporaire"
            description={activeOnly ? 'Aucun code actif pour le moment.' : 'Aucun code temporaire genere.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 dark:bg-gray-750 dark:border-gray-600">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Code
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Etudiant
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Salle
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Motif
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Expire dans
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Statut
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Genere par
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                {codes.map((code: TemporaryCode) => (
                  <CodeRow
                    key={code.id}
                    code={code}
                    onRevoke={() => revokeMutation.mutate(code.id)}
                    isRevoking={revokeMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <GenerateModal
            universityId={universityId}
            generatedCode={generatedCode}
            onCodeGenerated={handleCodeGenerated}
            onCopyCode={handleCopyCode}
            copied={copied}
            onClose={() => {
              setShowGenerateModal(false);
              setGeneratedCode(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// CodeRow - Ligne du tableau pour un code temporaire
// ═══════════════════════════════════════════════════════

function CodeRow({
  code,
  onRevoke,
  isRevoking,
}: {
  code: TemporaryCode;
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const [timeRemaining, setTimeRemaining] = useState(() => getTimeRemaining(code.expiresAt));
  const isActive = !code.isExpired && !code.isUsed;

  // Update time remaining every second for active codes
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(code.expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [code.expiresAt, isActive]);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hover:bg-slate-50 dark:hover:bg-gray-750 transition-colors"
    >
      {/* Code */}
      <td className="px-4 py-3">
        <span className="font-mono text-base font-bold text-slate-800 dark:text-white tracking-wider">
          {code.code}
        </span>
      </td>

      {/* Etudiant */}
      <td className="px-4 py-3">
        <div className="font-medium text-slate-800 dark:text-white text-xs">
          {code.student.name}
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {code.student.registrationNumber}
        </div>
      </td>

      {/* Salle */}
      <td className="px-4 py-3 text-xs text-slate-600 dark:text-gray-400">
        {code.classroom || '-'}
      </td>

      {/* Motif */}
      <td className="px-4 py-3 text-xs text-slate-600 dark:text-gray-400 max-w-[200px] truncate">
        {code.reason || '-'}
      </td>

      {/* Expire dans */}
      <td className="px-4 py-3">
        {isActive ? (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            {timeRemaining}
          </span>
        ) : (
          <span className="text-xs text-slate-400">
            {formatDate(code.expiresAt)}
          </span>
        )}
      </td>

      {/* Statut */}
      <td className="px-4 py-3">
        <StatusBadge code={code} />
      </td>

      {/* Genere par */}
      <td className="px-4 py-3 text-xs text-slate-600 dark:text-gray-400">
        {code.generatedBy}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        {isActive && (
          <button
            onClick={onRevoke}
            disabled={isRevoking}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            title="Revoquer ce code"
          >
            <Trash2 size={13} />
            Revoquer
          </button>
        )}
      </td>
    </motion.tr>
  );
}

// ═══════════════════════════════════════════════════════
// GenerateModal - Modale de generation de code
// ═══════════════════════════════════════════════════════

function GenerateModal({
  universityId,
  generatedCode,
  onCodeGenerated,
  onCopyCode,
  copied,
  onClose,
}: {
  universityId: number;
  generatedCode: TemporaryCode | null;
  onCodeGenerated: (code: TemporaryCode) => void;
  onCopyCode: (code: string) => void;
  copied: boolean;
  onClose: () => void;
}) {
  // Form state
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(15);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  // Student search query
  const { data: studentsData } = useQuery({
    queryKey: ['student-search', universityId, studentSearch],
    queryFn: () => temporaryCodeService.searchStudents(universityId, studentSearch),
    enabled: studentSearch.length >= 2 && !selectedStudent,
    staleTime: 5000,
  });

  const students: StudentSearchResult[] = studentsData?.data || studentsData || [];

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: (payload: GenerateCodePayload) =>
      temporaryCodeService.generate(universityId, payload),
    onSuccess: (data) => {
      const code = data.data || data;
      onCodeGenerated(code);
    },
    onError: (err: Error) => {
      setError(err.message || 'Erreur lors de la generation du code');
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStudent = (student: StudentSearchResult) => {
    setSelectedStudent(student);
    setStudentSearch(`${student.firstName} ${student.lastName} (${student.studentNumber})`);
    setShowDropdown(false);
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setStudentSearch('');
  };

  const handleGenerate = () => {
    if (!selectedStudent) {
      setError('Veuillez selectionner un etudiant');
      return;
    }
    setError('');
    generateMutation.mutate({
      student_id: selectedStudent.id,
      reason: reason || undefined,
      duration_minutes: duration,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800 mx-4"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <KeyRound className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Generer un code temporaire
              </h3>
              <p className="text-sm text-gray-500">
                Le code sera valide pour la duree choisie
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Generated code display */}
        {generatedCode ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-6 text-center">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-2 font-medium">
                Code genere avec succes
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-4xl font-bold text-emerald-700 dark:text-emerald-300 tracking-[0.2em]">
                  {generatedCode.code}
                </span>
                <button
                  onClick={() => onCopyCode(generatedCode.code)}
                  className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-800 dark:hover:bg-emerald-700 text-emerald-700 dark:text-emerald-300 transition-colors"
                  title="Copier le code"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-xs text-emerald-500 mt-3">
                Communiquez ce code a l'etudiant. Il expire dans{' '}
                <strong>{getTimeRemaining(generatedCode.expiresAt)}</strong>.
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 dark:bg-gray-750 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Etudiant</span>
                <span className="font-medium text-slate-700 dark:text-gray-200">
                  {generatedCode.student.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Matricule</span>
                <span className="font-mono text-slate-600 dark:text-gray-300">
                  {generatedCode.student.registrationNumber}
                </span>
              </div>
              {generatedCode.classroom && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Salle</span>
                  <span className="text-slate-700 dark:text-gray-200">
                    {generatedCode.classroom}
                  </span>
                </div>
              )}
              {generatedCode.reason && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Motif</span>
                  <span className="text-slate-700 dark:text-gray-200">
                    {generatedCode.reason}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Expire a</span>
                <span className="text-slate-700 dark:text-gray-200">
                  {formatDate(generatedCode.expiresAt)}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          /* Generate form */
          <div className="space-y-4">
            {/* Student search */}
            <div ref={searchRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Etudiant *
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou matricule..."
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    if (selectedStudent) setSelectedStudent(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (studentSearch.length >= 2 && !selectedStudent) setShowDropdown(true);
                  }}
                  className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {selectedStudent && (
                  <button
                    onClick={handleClearStudent}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-600 text-slate-400"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && students.length > 0 && !selectedStudent && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {students.map((s: StudentSearchResult) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      <div className="font-medium text-sm text-slate-800 dark:text-white">
                        {s.firstName} {s.lastName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {s.studentNumber}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && studentSearch.length >= 2 && students.length === 0 && !selectedStudent && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl shadow-lg p-4 text-center">
                  <p className="text-sm text-slate-400">Aucun etudiant trouve</p>
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motif
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Carte RFID oubliee, carte en cours de remplacement..."
                rows={2}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duree de validite
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedStudent || generateMutation.isPending}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {generateMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Generation...
                  </>
                ) : (
                  <>
                    <KeyRound size={15} />
                    Generer le code
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default TemporaryCodesPage;
