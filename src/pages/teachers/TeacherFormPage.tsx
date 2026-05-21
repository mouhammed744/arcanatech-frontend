import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { teacherService } from '@/services/teacher.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppSelector } from '@/store';

const schema = z.object({
  firstName:   z.string().min(1, 'Prénom requis'),
  lastName:    z.string().min(1, 'Nom requis'),
  email:       z.string().email('Email invalide'),
  phone:       z.string().optional(),
  specialty:   z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const TeacherFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  usePageTitle(isEdit ? 'Modifier enseignant' : 'Nouvel enseignant');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const universityId = user?.universityId ?? 1;

  const { data: teacher, isLoading: loadingTeacher } = useQuery({
    queryKey: ['teacher', universityId, id],
    queryFn: () => teacherService.getById(universityId, id!),
    enabled: isEdit,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    // defaultValues = valeurs initiales stables (create mode)
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', specialty: '' },
    // values = réactif : se synchronise quand teacher charge (edit mode)
    values: teacher ? {
      firstName:  (teacher as any).user?.name?.split(' ')[0] ?? '',
      lastName:   (teacher as any).user?.name?.split(' ').slice(1).join(' ') ?? '',
      email:      (teacher as any).user?.email ?? '',
      phone:      (teacher as any).user?.phone ?? '',
      specialty:  (teacher as any).specialty ?? '',
    } : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => teacherService.create(universityId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teachers'] }); navigate('/teachers'); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => teacherService.update(universityId, id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', universityId, id] });
      navigate('/teachers');
    },
  });

  if (isEdit && loadingTeacher) return <LoadingSpinner centered />;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const fc = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
  const lc = 'block text-sm font-medium mb-1 text-[var(--text-secondary)]';

  const onSubmit = (d: FormData) => isEdit ? updateMutation.mutate(d) : createMutation.mutate(d);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={isEdit ? 'Modifier enseignant' : 'Nouvel enseignant'}
        subtitle={isEdit ? 'Modifier les informations' : 'Créer un enseignant'}
        actions={
          <button onClick={() => navigate('/teachers')} className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors" style={{ borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} /> Annuler
          </button>
        }
      />
      <div className="rounded-xl shadow-sm p-6 max-w-2xl" style={{ backgroundColor: 'var(--bg-card)', borderWidth: 1, borderColor: 'var(--border-color)' }}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Prénom *</label>
              <input {...register('firstName')} className={fc} placeholder="ex : Jean-Baptiste" />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className={lc}>Nom de famille *</label>
              <input {...register('lastName')} className={fc} placeholder="ex : Ahouandjinou" />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Adresse email professionnelle *</label>
              <input {...register('email')} type="email" className={fc} placeholder="prenom.nom@universite.bj" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className={lc}>Numéro de téléphone</label>
              <input {...register('phone')} className={fc} placeholder="+229 01 XX XX XX" />
            </div>
          </div>
          <div>
            <label className={lc}>Domaine de spécialité</label>
            <input {...register('specialty')} className={fc} placeholder="ex : Réseaux et Télécommunications, Génie Logiciel…" />
          </div>

          {(createMutation.isError || updateMutation.isError) && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg space-y-1">
              <p className="font-medium">
                {(createMutation.error as any)?.response?.data?.message
                  || (updateMutation.error as any)?.response?.data?.message
                  || 'Une erreur est survenue. Vérifiez les informations saisies.'}
              </p>
              {(() => {
                const errs = (createMutation.error as any)?.response?.data?.errors
                  || (updateMutation.error as any)?.response?.data?.errors;
                if (!errs) return null;
                return Object.values(errs).flat().map((msg: any, i: number) => (
                  <p key={i} className="text-xs">• {msg}</p>
                ));
              })()}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button type="button" onClick={() => navigate('/teachers')} className="px-4 py-2 border rounded-lg transition-colors" style={{ borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}>
              Annuler
            </button>
            <button type="submit" disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save size={16} /> {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
