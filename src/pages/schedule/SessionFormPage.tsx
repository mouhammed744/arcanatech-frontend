import { useEffect, type ReactNode } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, BookOpen, Users, Loader2, CalendarDays, type LucideIcon } from 'lucide-react';
import { scheduleService, type ScheduleEntry } from '@/services/schedule.service';
import filiereService from '@/services/filiere.service';
import apiClient from '@/services/api';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppSelector } from '@/store';

interface CourseOption  { id: number; name: string; code: string }
interface ClassroomOption { id: number; name: string; building?: string; room_number?: string }

const schema = z.object({
  course_id:          z.string().min(1, 'Cours requis'),
  classroom_id:       z.string().min(1, 'Salle requise'),
  day_of_week:        z.enum(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], {
    message: 'Jour requis',
  }),
  start_time:         z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:mm'),
  end_time:           z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:mm'),
  session_type:       z.enum(['CM','TD','TP','Projet','lecture']).default('CM'),
  recurrence_pattern: z.enum(['weekly','biweekly','once']).default('weekly'),
  start_date:         z.string().min(1, 'Date de début requise'),
  end_date:           z.string().optional(),
  filiere_ids:        z.array(z.number()).optional(),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

const DAYS = [
  { value: 'Monday',    label: 'Lundi'    },
  { value: 'Tuesday',   label: 'Mardi'    },
  { value: 'Wednesday', label: 'Mercredi' },
  { value: 'Thursday',  label: 'Jeudi'    },
  { value: 'Friday',    label: 'Vendredi' },
  { value: 'Saturday',  label: 'Samedi'   },
] as const;

const SESSION_TYPES = [
  { value: 'CM',      label: 'CM — Cours Magistral',  color: 'text-blue-600'    },
  { value: 'TD',      label: 'TD — Travaux Dirigés',  color: 'text-emerald-600' },
  { value: 'TP',      label: 'TP — Travaux Pratiques', color: 'text-orange-600' },
  { value: 'Projet',  label: 'Projet',                color: 'text-purple-600'  },
  { value: 'lecture', label: 'Lecture',               color: 'text-sky-600'     },
] as const;

const RECURRENCE = [
  { value: 'weekly',   label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Bi-hebdomadaire' },
  { value: 'once',     label: 'Une seule fois' },
] as const;

const entryToForm = (e: ScheduleEntry): Partial<FormData> => ({
  course_id:          String(e.courseId),
  classroom_id:       String(e.roomId),
  day_of_week:        e.dayOfWeek as FormData['day_of_week'],
  start_time:         e.startTime.slice(0, 5),
  end_time:           e.endTime.slice(0, 5),
  session_type:       (e.courseType as FormData['session_type']) ?? 'CM',
  recurrence_pattern: (e.recurrencePattern as FormData['recurrence_pattern']) ?? 'weekly',
  start_date:         e.startDate ?? '',
  end_date:           e.endDate ?? '',
  filiere_ids:        [],
});

export const SessionFormPage = () => {
  const { id }     = useParams<{ id: string }>();
  const isEdit     = !!id;
  usePageTitle(isEdit ? 'Modifier la séance' : 'Nouvelle séance');

  const navigate    = useNavigate();
  const location    = useLocation();
  const qClient     = useQueryClient();
  const user        = useAppSelector((s) => s.auth.user);
  const universityId = user?.universityId ?? 1;

  const stateEntry  = (location.state as { entry?: ScheduleEntry } | null)?.entry;

  const { data: coursesRes } = useQuery({
    queryKey: ['courses-list', universityId],
    queryFn:  () =>
      apiClient
        .get<{ data: CourseOption[] }>(`/universities/${universityId}/courses`, {
          params: { limit: 200 },
        })
        .then((r) => r.data.data ?? []),
  });

  const { data: classroomsRes } = useQuery({
    queryKey: ['classrooms-list', universityId],
    queryFn:  () =>
      apiClient
        .get<{ data: ClassroomOption[] }>(`/universities/${universityId}/classrooms`)
        .then((r) => r.data.data ?? []),
  });

  const { data: filieresRes } = useQuery({
    queryKey: ['filieres', universityId],
    queryFn:  () => filiereService.getAll(universityId),
  });

  const courses    = coursesRes   ?? [];
  const classrooms = classroomsRes ?? [];
  const filieres   = filieresRes?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: stateEntry ? entryToForm(stateEntry) : {
      session_type:       'CM',
      recurrence_pattern: 'weekly',
      filiere_ids:        [],
    },
  });

  useEffect(() => {
    if (stateEntry) reset(entryToForm(stateEntry));
  }, [stateEntry, reset]);

  const selectedFilieres = watch('filiere_ids') ?? [];

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      scheduleService.create(universityId, {
        course_id:          Number(data.course_id),
        classroom_id:       Number(data.classroom_id),
        day_of_week:        data.day_of_week,
        start_time:         data.start_time,
        end_time:           data.end_time,
        session_type:       data.session_type,
        recurrence_pattern: data.recurrence_pattern,
        start_date:         data.start_date,
        end_date:           data.end_date || null,
        filiere_ids:        data.filiere_ids,
      }),
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: ['schedule', universityId] });
      navigate('/schedule');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      scheduleService.update(universityId, Number(id!), {
        course_id:          Number(data.course_id),
        classroom_id:       Number(data.classroom_id),
        day_of_week:        data.day_of_week,
        start_time:         data.start_time,
        end_time:           data.end_time,
        session_type:       data.session_type,
        recurrence_pattern: data.recurrence_pattern,
        start_date:         data.start_date,
        end_date:           data.end_date || null,
      }),
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: ['schedule', universityId] });
      navigate('/schedule');
    },
  });

  const onSubmit = (data: FormData) =>
    isEdit ? updateMutation.mutate(data) : createMutation.mutate(data);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutError  = (createMutation.error || updateMutation.error) as Error | null;

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';
  const inputStyle = {
    border: '1px solid var(--border-input)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
  };
  const labelClass = 'block text-xs font-medium mb-1.5';
  const labelStyle = { color: 'var(--text-muted)' };
  const errClass   = 'mt-1 text-xs text-red-500';

  const SectionTitle = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
    <div className="flex items-center gap-2 mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <Icon size={16} style={{ color: 'var(--accent)' }} />
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</h3>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Modifier la séance' : 'Nouvelle séance'}
        subtitle={isEdit ? 'Modifier une séance existante' : 'Ajouter une séance au planning hebdomadaire'}
        breadcrumbs={[
          { label: 'Tableau de bord', to: '/dashboard' },
          { label: 'Emploi du temps', to: '/schedule' },
          { label: isEdit ? 'Modifier' : 'Nouvelle séance' },
        ]}
        actions={
          <button
            onClick={() => navigate('/schedule')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-card-hover)]"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} /> Retour
          </button>
        }
      />

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
          >
            <SectionTitle icon={BookOpen}>Cours et salle</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="md:col-span-2">
                <label className={labelClass} style={labelStyle}>Cours *</label>
                <select {...register('course_id')} className={inputClass} style={inputStyle}>
                  <option value="">— Sélectionner un cours —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code ? `[${c.code}] ` : ''}{c.name}
                    </option>
                  ))}
                </select>
                {errors.course_id && <p className={errClass}>{errors.course_id.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className={labelClass} style={labelStyle}>Salle *</label>
                <select {...register('classroom_id')} className={inputClass} style={inputStyle}>
                  <option value="">— Sélectionner une salle —</option>
                  {classrooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}{r.building ? ` — Bâtiment ${r.building}` : ''}{r.room_number ? ` (${r.room_number})` : ''}
                    </option>
                  ))}
                </select>
                {errors.classroom_id && <p className={errClass}>{errors.classroom_id.message}</p>}
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Type de séance *</label>
                <select {...register('session_type')} className={inputClass} style={inputStyle}>
                  {SESSION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Récurrence *</label>
                <select {...register('recurrence_pattern')} className={inputClass} style={inputStyle}>
                  {RECURRENCE.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
          >
            <SectionTitle icon={CalendarDays}>Horaire récurrent</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div>
                <label className={labelClass} style={labelStyle}>Jour *</label>
                <select {...register('day_of_week')} className={inputClass} style={inputStyle}>
                  <option value="">— Choisir —</option>
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                {errors.day_of_week && <p className={errClass}>{errors.day_of_week.message}</p>}
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Heure de début *</label>
                <input
                  {...register('start_time')}
                  type="time"
                  className={inputClass}
                  style={inputStyle}
                />
                {errors.start_time && <p className={errClass}>{errors.start_time.message}</p>}
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Heure de fin *</label>
                <input
                  {...register('end_time')}
                  type="time"
                  className={inputClass}
                  style={inputStyle}
                />
                {errors.end_time && <p className={errClass}>{errors.end_time.message}</p>}
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Valide à partir du *</label>
                <input
                  {...register('start_date')}
                  type="date"
                  className={inputClass}
                  style={inputStyle}
                />
                {errors.start_date && <p className={errClass}>{errors.start_date.message}</p>}
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>Jusqu'au <span className="opacity-50">(optionnel)</span></label>
                <input
                  {...register('end_date')}
                  type="date"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {!isEdit && filieres.length > 0 && (
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
            >
              <SectionTitle icon={Users}>Filières concernées <span className="font-normal opacity-60">(optionnel)</span></SectionTitle>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Associer ce cours aux filières sélectionnées pour qu'il apparaisse dans leur emploi du temps.
              </p>
              <Controller
                control={control}
                name="filiere_ids"
                render={({ field }) => (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {filieres.map((f) => {
                      const checked = (field.value ?? []).includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            const current = field.value ?? [];
                            field.onChange(
                              checked
                                ? current.filter((x) => x !== f.id)
                                : [...current, f.id],
                            );
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all border ${
                            checked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'hover:border-blue-400'
                          }`}
                          style={!checked ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' } : {}}
                        >
                          <span
                            className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 flex items-center justify-center ${
                              checked ? 'bg-white border-white' : 'border-current'
                            }`}
                          >
                            {checked && (
                              <svg viewBox="0 0 8 8" className="w-2 h-2 fill-blue-600">
                                <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <span className="truncate font-medium">{f.name}</span>
                          {f.level && (
                            <span className={`ml-auto text-xs flex-shrink-0 ${checked ? 'text-blue-200' : ''}`}
                              style={!checked ? { color: 'var(--text-muted)' } : {}}>
                              {f.level}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {selectedFilieres.length > 0 && (
                <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {selectedFilieres.length} filière{selectedFilieres.length > 1 ? 's' : ''} sélectionnée{selectedFilieres.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {mutError && (
            <div className="rounded-xl p-4 bg-red-50 border border-red-200 text-sm text-red-700">
              {mutError.message || 'Une erreur est survenue lors de l\'enregistrement.'}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pb-6">
            <button
              type="button"
              onClick={() => navigate('/schedule')}
              className="px-5 py-2.5 rounded-xl text-sm transition-colors hover:bg-[var(--bg-card-hover)]"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isPending
                ? 'Enregistrement...'
                : isEdit ? 'Enregistrer les modifications' : 'Créer la séance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
