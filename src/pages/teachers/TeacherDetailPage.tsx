import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, User, Mail, Phone, BookOpen, Award } from 'lucide-react';
import { teacherService } from '@/services/teacher.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';

export const TeacherDetailPage = () => {
  usePageTitle('Detail enseignant');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const universityId = user?.universityId ?? 1;

  const { data: teacher, isLoading, error } = useQuery({
    queryKey: ['teacher', universityId, id],
    queryFn: () => teacherService.getById(universityId, id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner centered />;
  if (error || !teacher) return (
    <div className="p-6">
      <p className="text-red-500">Erreur de chargement.</p>
      <button onClick={() => navigate('/teachers')} className="mt-4 text-blue-600 hover:underline">Retour</button>
    </div>
  );

  const rows = [
    { icon: <User size={18} className="text-gray-400" />, label: 'Nom', value: teacher.firstName + ' ' + teacher.lastName },
    { icon: <Mail size={18} className="text-gray-400" />, label: 'Email', value: teacher.email },
    { icon: <Phone size={18} className="text-gray-400" />, label: 'Telephone', value: (teacher as any).phone ?? 'N/A' },
    { icon: <BookOpen size={18} className="text-gray-400" />, label: 'Departement', value: (teacher as any).department ?? 'N/A' },
    { icon: <Award size={18} className="text-gray-400" />, label: 'Grade', value: (teacher as any).grade ?? 'N/A' },
    { icon: <Award size={18} className="text-gray-400" />, label: 'Specialisation', value: (teacher as any).specialization ?? 'N/A' },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={teacher.firstName + ' ' + teacher.lastName}
        subtitle={(teacher as any).employeeNumber}
        actions={
          <div className="flex gap-3">
            <button onClick={() => navigate('/teachers')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <ArrowLeft size={16} /> Retour
            </button>
            <Link to={'/teachers/' + id + '/edit'} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Edit size={16} /> Editer
            </Link>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
          <div className="space-y-4">
            {rows.map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                {icon}
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="font-medium text-gray-900">{value}</p>
                </div>
              </div>
            ))}
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <span className={teacher.status === 'active' ? 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800' : 'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'}>
                {teacher.status === 'active' ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stats</h2>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Nb cours</span>
            <span className="font-semibold">{(teacher as any).courseCount ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
