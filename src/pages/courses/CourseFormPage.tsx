import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ArrowLeft, Save, ChevronDown } from 'lucide-react';
import { courseService } from '@/services/course.service';
import { teacherService } from '@/services/teacher.service';
import filiereService from '@/services/filiere.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAppSelector } from '@/store';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';

const LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2', 'BTS1', 'BTS2'] as const;

const schema = z.object({
  name:               z.string().min(1, 'Intitulé requis'),
  description:        z.string().optional(),
  teacherId:          z.string().min(1, 'Enseignant requis'),
  filiereId:          z.string().min(1, 'Filière requise'),
  niveau:             z.string().min(1, 'Niveau requis'),
  credits:            z.coerce.number().int().min(1).max(10),
  lateMarginMinutes:  z.coerce.number().int().min(5).max(60),
  semester:           z.coerce.number().int().min(1).max(8),
  courseType:         z.enum(['CM', 'TD', 'TP', 'Projet']),
  academicYear:       z.string().min(1, 'Année académique requise'),
});

type FormInput = z.input<typeof schema>;
type FormData  = z.output<typeof schema>;

const lc = 'block text-sm font-medium mb-1.5 text-[var(--text-secondary)]';
const fc = [
  'w-full px-3 py-2.5 rounded-lg text-sm',
  'bg-[var(--bg-input)] border border-[var(--border-color)]',
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
  'focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.5)] focus:border-[rgba(99,102,241,0.6)]',
  'transition-all duration-150',
].join(' ');

export const CourseFormPage = () => {
  const { id }    = useParams<{ id: string }>();
  const isEdit    = !!id;
  usePageTitle(isEdit ? 'Modifier cours' : 'Nouveau cours');
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const user        = useAppSelector((s) => s.auth.user);
  const universityId = user?.universityId ?? 1;

  /* existing course */
  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', id],
    queryFn:  () => courseService.getById(id!),
    enabled:  isEdit,
  });

  /* teachers list for dropdown */
  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers', universityId],
    queryFn:  () => teacherService.getAll(universityId, { perPage: 200 }),
  });
  const teachers = (teachersData as any)?.data ?? teachersData ?? [];

  /* filieres list for dropdown */
  const { data: filieresData, isLoading: loadingFilieres } = useQuery({
    queryKey: ['filieres', universityId],
    queryFn:  () => filiereService.getAll(universityId),
  });
  const filieres = filieresData?.data ?? [];

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: course ? {
      name:              (course as any).name,
      description:       (course as any).description ?? '',
      teacherId:         String((course as any).teacherId ?? ''),
      filiereId:         String((course as any).filiereId ?? ''),
      niveau:            (course as any).niveau ?? '',
      credits:           (course as any).credits ?? 3,
      lateMarginMinutes: (course as any).lateMarginMinutes ?? 15,
      semester:          (course as any).semester ?? 1,
      courseType:        (course as any).courseType ?? 'CM',
      academicYear:      (course as any).academicYear ?? '2024-2025',
    } : {
      credits: 3, lateMarginMinutes: 15, semester: 1,
      courseType: 'CM', academicYear: '2024-2025',
    },
  });

  /* Auto-fill niveau when filière changes */
  const watchedFiliereId = useWatch({ control, name: 'filiereId' });
  useEffect(() => {
    if (!watchedFiliereId) return;
    const found = filieres.find((f: any) => String(f.id) === String(watchedFiliereId));
    if (found?.level) setValue('niveau', found.level, { shouldValidate: true });
  }, [watchedFiliereId, filieres, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => courseService.create(data as any),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); navigate('/courses'); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => courseService.update(id!, data as any),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      navigate('/courses');
    },
  });

  if (isEdit && loadingCourse) return <LoadingSpinner centered />;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={isEdit ? 'Modifier le cours' : 'Nouveau cours'}
        subtitle={isEdit ? `Modification de ${(course as any)?.name ?? ''}` : 'Créer un nouveau cours'}
        actions={
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} /> Annuler
          </button>
        }
      />

      <div
        className="rounded-2xl p-6 max-w-2xl"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
      >
        <form onSubmit={handleSubmit(d => isEdit ? updateMutation.mutate(d) : createMutation.mutate(d))} className="space-y-5">

          {/* Intitulé + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Intitulé *</label>
              <input {...register('name')} className={fc} placeholder="Ex : Algorithmique avancée" />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <label className={lc}>Type *</label>
              <div style={{ position: 'relative' }}>
                <select {...register('courseType')} className={fc} style={{ appearance: 'none', paddingRight: 32 }}>
                  <option value="CM">CM — Cours magistral</option>
                  <option value="TD">TD — Travaux dirigés</option>
                  <option value="TP">TP — Travaux pratiques</option>
                  <option value="Projet">Projet</option>
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={lc}>Description</label>
            <textarea
              {...register('description')}
              className={fc + ' resize-none'}
              rows={3}
              placeholder="Description optionnelle..."
            />
          </div>

          {/* Enseignant — dropdown automatique */}
          <div>
            <label className={lc}>Enseignant *</label>
            <div style={{ position: 'relative' }}>
              <select
                {...register('teacherId')}
                className={fc}
                style={{ appearance: 'none', paddingRight: 32 }}
                disabled={loadingTeachers}
              >
                <option value="">
                  {loadingTeachers ? 'Chargement...' : '— Sélectionner un enseignant —'}
                </option>
                {Array.isArray(teachers) && teachers.map((t: any) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.firstName} {t.lastName}
                    {t.specialty ? ` · ${t.specialty}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
            {errors.teacherId && <p className="mt-1 text-xs text-red-400">{errors.teacherId.message}</p>}
          </div>

          {/* Filière + Niveau */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className={lc}>Filière *</label>
              <div style={{ position: 'relative' }}>
                <select
                  {...register('filiereId')}
                  className={fc}
                  style={{ appearance: 'none', paddingRight: 32 }}
                  disabled={loadingFilieres}
                >
                  <option value="">
                    {loadingFilieres ? 'Chargement...' : '— Sélectionner une filière —'}
                  </option>
                  {filieres.map((f: any) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.name}{f.level ? ` · ${f.level}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
              {errors.filiereId && <p className="mt-1 text-xs text-red-400">{errors.filiereId.message}</p>}
            </div>

            <div>
              <label className={lc}>Niveau *</label>
              <div style={{ position: 'relative' }}>
                <select
                  {...register('niveau')}
                  className={fc}
                  style={{ appearance: 'none', paddingRight: 32 }}
                >
                  <option value="">— Niveau —</option>
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
              {errors.niveau && <p className="mt-1 text-xs text-red-400">{errors.niveau.message}</p>}
            </div>
          </div>

          {/* Crédits + Marge retard + Semestre */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lc}>Crédits *</label>
              <input {...register('credits')} type="number" min={1} max={10} className={fc} />
              {errors.credits && <p className="mt-1 text-xs text-red-400">{errors.credits.message}</p>}
            </div>
            <div>
              <label className={lc}>Marge retard (min) *</label>
              <input {...register('lateMarginMinutes')} type="number" min={5} max={60} className={fc} />
              {errors.lateMarginMinutes && <p className="mt-1 text-xs text-red-400">{errors.lateMarginMinutes.message}</p>}
            </div>
            <div>
              <label className={lc}>Semestre *</label>
              <input {...register('semester')} type="number" min={1} max={8} className={fc} />
              {errors.semester && <p className="mt-1 text-xs text-red-400">{errors.semester.message}</p>}
            </div>
          </div>

          {/* Année académique */}
          <div>
            <label className={lc}>Année académique *</label>
            <input {...register('academicYear')} className={fc} placeholder="2024-2025" />
            {errors.academicYear && <p className="mt-1 text-xs text-red-400">{errors.academicYear.message}</p>}
          </div>

          {/* Actions */}
          <div
            className="flex justify-end gap-3 pt-4 border-t"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="px-4 py-2 border rounded-lg transition-colors text-sm"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg,#6366F1,#818CF8)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
            >
              <Save size={15} />
              {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
