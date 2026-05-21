import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import filiereService from '@/services/filiere.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppSelector } from '@/store';

const schema = z.object({
  code:        z.string().min(1, 'Code requis').max(20),
  name:        z.string().min(1, 'Nom requis').max(255),
  level:       z.string().min(1, 'Niveau requis'),
  department:  z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3'];

export default function FiliereFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  usePageTitle(isEdit ? 'Modifier filière' : 'Nouvelle filière');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  const universityId = user?.universityId ?? 1;

  const { data: filiere, isLoading } = useQuery({
    queryKey: ['filiere', universityId, id],
    queryFn: () => filiereService.getById(universityId, Number(id)),
    enabled: isEdit,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', name: '', level: '', department: '', description: '' },
    values: filiere ? {
      code:        (filiere as any).code ?? '',
      name:        (filiere as any).name ?? '',
      level:       (filiere as any).level ?? '',
      department:  (filiere as any).department ?? '',
      description: (filiere as any).description ?? '',
    } : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => filiereService.create(universityId, data as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['filieres'] }); navigate('/filieres'); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => filiereService.update(universityId, Number(id), data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filieres'] });
      queryClient.invalidateQueries({ queryKey: ['filiere', universityId, id] });
      navigate('/filieres');
    },
  });

  if (isEdit && isLoading) return <LoadingSpinner centered />;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const fc = 'w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';
  const lc = 'block text-sm font-medium mb-1 text-[var(--text-secondary)]';

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={isEdit ? 'Modifier la filière' : 'Nouvelle filière'}
        subtitle={isEdit ? 'Modifier les informations' : 'Créer une filière'}
        actions={
          <button onClick={() => navigate('/filieres')} className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors" style={{ borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} /> Retour
          </button>
        }
      />

      <div className="rounded-xl p-6 max-w-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <form
          onSubmit={handleSubmit((d) => isEdit ? updateMutation.mutate(d) : createMutation.mutate(d))}
          className="space-y-5"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Code *</label>
              <input {...register('code')} className={fc} placeholder="INFO-L1" />
              {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
            </div>
            <div>
              <label className={lc}>Niveau *</label>
              <select {...register('level')} className={fc}>
                <option value="">Sélectionner un niveau</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {errors.level && <p className="mt-1 text-xs text-red-500">{errors.level.message}</p>}
            </div>
          </div>

          <div>
            <label className={lc}>Nom de la filière *</label>
            <input {...register('name')} className={fc} placeholder="Licence Informatique" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className={lc}>Département</label>
            <input {...register('department')} className={fc} placeholder="Sciences et Technologies" />
          </div>

          <div>
            <label className={lc}>Description</label>
            <textarea {...register('description')} rows={3} className={fc} placeholder="Description de la filière..." />
          </div>

          {(createMutation.isError || updateMutation.isError) && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg space-y-1">
              <p className="font-medium">
                {(createMutation.error as any)?.response?.data?.message
                  || (updateMutation.error as any)?.response?.data?.message
                  || 'Une erreur est survenue. Vérifiez les informations saisies.'}
              </p>
              {/* Afficher les erreurs de validation Laravel */}
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
            <button type="button" onClick={() => navigate('/filieres')} className="px-4 py-2 border rounded-lg text-sm transition-colors" style={{ borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}>
              Annuler
            </button>
            <button type="submit" disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
              <Save size={16} /> {isPending ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer la filière'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
