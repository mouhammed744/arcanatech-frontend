import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Edit, Trash2, Clock } from 'lucide-react';
import { courseService } from '@/services/course.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const typeColors: Record<string, string> = {
  CM: 'bg-blue-100 text-blue-800',
  TD: 'bg-green-100 text-green-800',
  TP: 'bg-orange-100 text-orange-800',
  Projet: 'bg-purple-100 text-purple-800',
};

export const CoursesListPage = () => {
  usePageTitle('Cours');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: coursesResponse, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getAll({ page: 1, pageSize: 100 }),
  });
  const courses = coursesResponse?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => courseService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setDeleteId(null); },
  });

  if (isLoading) return <LoadingSpinner centered />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Cours"
        subtitle={(courses as any[]).length + ' cours'}
        actions={
          <button onClick={() => navigate('/courses/new')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Nouveau cours
          </button>
        }
      />
      {(courses as any[]).length === 0 ? (
        <EmptyState title="Aucun cours" description="Ajoutez un cours" action={{ label: 'Ajouter', onClick: () => navigate('/courses/new') }} />
      ) : (
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  {['Code','Intitule','Enseignant','Type','Marge retard','Statut','Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {(courses as any[]).map((course) => (
                  <tr key={course.id} className="transition-colors" style={{ ['--tw-divide-color' as any]: 'var(--border-color)' }}>
                    <td className="px-6 py-4 text-sm font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{course.code}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{course.name}</p>
                      {course.description && <p className="text-xs truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{course.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{course.teacherName ?? course.teacherId ?? 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ' + (typeColors[course.courseType] ?? 'bg-gray-100 text-gray-800')}>
                        {course.courseType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}><Clock size={14} /> {course.lateMarginMinutes ?? 0} min</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={course.status === 'active' ? 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}>
                        {course.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate('/courses/' + course.id)} className="p-1.5 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" style={{ color: 'var(--text-muted)' }}><Eye size={16} /></button>
                        <button onClick={() => navigate('/courses/' + course.id + '/edit')} className="p-1.5 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded" style={{ color: 'var(--text-muted)' }}><Edit size={16} /></button>
                        <button onClick={() => setDeleteId(course.id)} className="p-1.5 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" style={{ color: 'var(--text-muted)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ConfirmDialog isOpen={!!deleteId} title="Supprimer le cours" message="Action irreversible." onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }} onCancel={() => setDeleteId(null)} isLoading={deleteMutation.isPending} />
    </div>
  );
};
