import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, Pencil, Trash2, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { studentService } from '@/services/student.service';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppSelector } from '@/store';
import type { Student } from '@/types';

export const StudentsListPage: React.FC = () => {
  usePageTitle('Étudiants');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const user = useAppSelector((s) => s.auth.user);
  const universityId = user?.universityId ?? 1;

  const { data, isLoading } = useQuery({
    queryKey: ['students', universityId, search],
    queryFn: () => studentService.getAll(universityId, { search: search || undefined, limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentService.delete(universityId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDeleteId(null);
    },
  });

  const students: Student[] = data?.data ?? [];
  const total = data?.pagination?.total ?? students.length;

  if (isLoading) return <LoadingSpinner centered />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Étudiants"
        subtitle={`${total} étudiant${total > 1 ? 's' : ''}`}
        actions={
          <button
            onClick={() => navigate('/students/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Plus size={16} /> Nouvel étudiant
          </button>
        }
      />

      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="relative max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none"
              style={{ border: '1px solid var(--border-input)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {students.length === 0 ? (
          <EmptyState
            title="Aucun étudiant"
            description={search ? 'Aucun étudiant ne correspond à votre recherche.' : 'Commencez par ajouter un étudiant.'}
            action={{ label: 'Ajouter un étudiant', onClick: () => navigate('/students/new') }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Matricule</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Nom complet</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Niveau</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Carte RFID</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {s.registration_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                      {s.phone && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {s.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}>
                        {s.level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.rfid_card?.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CreditCard size={11} /> Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                          Non assignée
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
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
                          state={{ returnTo: '/students' }}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Modifier"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => setDeleteId(s.id)}
                          className="p-1.5 rounded-lg transition-colors hover:text-red-600"
                          style={{ color: 'var(--text-muted)' }}
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Supprimer cet étudiant ?"
        message="L'étudiant sera archivé. Ses données de présence sont conservées."
        confirmLabel="Supprimer"
        onConfirm={() => { if (deleteId !== null) deleteMutation.mutate(deleteId); }}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default StudentsListPage;
