import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { roomService } from '@/services/room.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  code: z.string().min(1, 'Code requis'),
  building: z.string().min(1, 'Batiment requis'),
  floor: z.coerce.number().int(),
  capacity: z.coerce.number().int().min(1, 'Capacite invalide'),
  type: z.enum(['lecture', 'lab', 'seminar', 'amphitheater']),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

export const RoomFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  usePageTitle(isEdit ? 'Modifier salle' : 'Nouvelle salle');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: room, isLoading: loadingRoom } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomService.getById(id!),
    enabled: isEdit,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: room ? {
      name: room.name, code: room.code,
      building: room.building ?? '',
      floor: (room as any).floor ?? 0,
      capacity: room.capacity,
      type: room.type as any,
    } : { floor: 0, capacity: 30, type: 'lecture' },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => roomService.create(data as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rooms'] }); navigate('/rooms'); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => roomService.update(id!, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      navigate('/rooms');
    },
  });

  if (isEdit && loadingRoom) return <LoadingSpinner centered />;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const fc = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
  const lc = 'block text-sm font-medium mb-1' + ' ' + 'text-[var(--text-secondary)]';

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={isEdit ? 'Modifier salle' : 'Nouvelle salle'}
        subtitle={isEdit ? 'Modification de ' + room?.name : 'Creer une salle'}
        actions={<button onClick={() => navigate('/rooms')} className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors" style={{ borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}><ArrowLeft size={16} /> Annuler</button>}
      />
      <div className="rounded-xl shadow-sm p-6 max-w-2xl" style={{ backgroundColor: 'var(--bg-card)', borderWidth: 1, borderColor: 'var(--border-color)' }}>
        <form onSubmit={handleSubmit(d => isEdit ? updateMutation.mutate(d) : createMutation.mutate(d))} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>Nom *</label><input {...register('name')} className={fc} placeholder="Salle 101" />{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}</div>
            <div><label className={lc}>Code *</label><input {...register('code')} className={fc} placeholder="S101" />{errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>Batiment *</label><input {...register('building')} className={fc} placeholder="Bat. A" />{errors.building && <p className="mt-1 text-xs text-red-500">{errors.building.message}</p>}</div>
            <div><label className={lc}>Etage</label><input {...register('floor')} type="number" className={fc} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>Capacite *</label><input {...register('capacity')} type="number" min={1} className={fc} />{errors.capacity && <p className="mt-1 text-xs text-red-500">{errors.capacity.message}</p>}</div>
            <div>
              <label className={lc}>Type *</label>
              <select {...register('type')} className={fc}>
                <option value="lecture">Cours magistral</option>
                <option value="lab">Laboratoire</option>
                <option value="seminar">Seminaire</option>
                <option value="amphitheater">Amphitheatre</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button type="button" onClick={() => navigate('/rooms')} className="px-4 py-2 border rounded-lg transition-colors" style={{ borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}>Annuler</button>
            <button type="submit" disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save size={16} /> {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
