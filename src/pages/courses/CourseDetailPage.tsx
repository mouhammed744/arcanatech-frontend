import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, BookOpen, Clock, User, Hash } from 'lucide-react';
import { courseService } from '@/services/course.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';

const typeColors: Record<string, string> = {
  CM: 'bg-blue-100 text-blue-800',
  TD: 'bg-green-100 text-green-800',
  TP: 'bg-orange-100 text-orange-800',
  Projet: 'bg-purple-100 text-purple-800',
};

export const CourseDetailPage = () => {
  usePageTitle('Detail cours');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: () => courseService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner centered />;
  if (error || !course) return (
    <div className="p-6">
      <p className="text-red-500">Erreur de chargement.</p>
      <button onClick={() => navigate('/courses')} className="mt-4 text-blue-600 hover:underline">Retour</button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={(course as any).name}
        subtitle={(course as any).code}
        actions={
          <div className="flex gap-3">
            <button onClick={() => navigate('/courses')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><ArrowLeft size={16} /> Retour</button>
            <Link to={'/courses/' + id + '/edit'} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit size={16} /> Editer</Link>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du cours</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Hash size={18} className="text-gray-400" /><div><p className="text-sm text-gray-500">Code</p><p className="font-medium font-mono text-gray-900">{(course as any).code}</p></div></div>
            <div className="flex items-center gap-3"><BookOpen size={18} className="text-gray-400" /><div><p className="text-sm text-gray-500">Intitule</p><p className="font-medium text-gray-900">{(course as any).name}</p></div></div>
            <div className="flex items-center gap-3"><User size={18} className="text-gray-400" /><div><p className="text-sm text-gray-500">Enseignant</p><p className="font-medium text-gray-900">{(course as any).teacherName ?? (course as any).teacherId ?? 'N/A'}</p></div></div>
            <div className="flex items-center gap-3"><Clock size={18} className="text-gray-400" /><div><p className="text-sm text-gray-500">Marge de retard</p><p className="font-medium text-gray-900">{(course as any).lateMarginMinutes ?? 0} minutes</p></div></div>
            {(course as any).description && (
              <div><p className="text-sm text-gray-500">Description</p><p className="text-gray-900">{(course as any).description}</p></div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Type</span>
              <span className={'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ' + (typeColors[(course as any).courseType] ?? 'bg-gray-100 text-gray-800')}>{(course as any).courseType}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Credits</span>
              <span className="font-semibold">{(course as any).credits ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Semestre</span>
              <span className="font-semibold">{(course as any).semester ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Annee academique</span>
              <span className="font-semibold">{(course as any).academicYear ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Statut</span>
              <span className={(course as any).status === 'active' ? 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800' : 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'}>
                {(course as any).status === 'active' ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
