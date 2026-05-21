import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { teacherService } from '@/services/teacher.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAppSelector } from '@/store';

export const TeachersListPage = () => {
  usePageTitle('Enseignants');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const user = useAppSelector((s) => s.auth.user);
  const universityId = user?.universityId ?? 1;

  const { data: teachersRaw, isLoading } = useQuery({
    queryKey: ['teachers', universityId],
    queryFn: () => teacherService.getAll(universityId),
  });
  const teachers: any[] = Array.isArray(teachersRaw)
    ? teachersRaw
    : (teachersRaw as any)?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teacherService.delete(universityId, id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teachers'] }); setDeleteId(null); },
  });

  if (isLoading) return <LoadingSpinner centered />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Enseignants"
        subtitle={teachers.length + ' enseignant(s)'}
        actions={
          <button onClick={() => navigate('/teachers/new')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Nouvel enseignant
          </button>
        }
      />
      {teachers.length === 0 ? (
        <EmptyState title="Aucun enseignant" description="Ajoutez un enseignant" action={{ label: 'Ajouter', onClick: () => navigate('/teachers/new') }} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Matricule','Nom','Departement','Grade','Statut','Nb cours','Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(teachers as any[]).map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{t.employeeNumber}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t.firstName} {t.lastName}</p>
                        <p className="text-xs text-gray-500">{t.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.department ?? 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.grade ?? 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={t.status === 'active' ? 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800' : 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'}>
                        {t.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{t.courseCount ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate('/teachers/' + t.id)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Voir"><Eye size={16} /></button>
                        <button onClick={() => navigate('/teachers/' + t.id + '/edit')} className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded" title="Modifier"><Edit size={16} /></button>
                        <button onClick={() => setDeleteId(t.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Supprimer"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Supprimer l'enseignant"
        message="Cette action est irreversible."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
