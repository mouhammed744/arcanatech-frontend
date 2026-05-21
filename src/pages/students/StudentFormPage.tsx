import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { studentService } from '@/services/student.service';
import { rfidService } from '@/services/rfid.service';
import filiereService from '@/services/filiere.service';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppSelector } from '@/store';

const LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3'] as const;

const GENDERS = [
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
] as const;

const studentSchema = z.object({
  registrationNumber: z.string().min(1, 'Numéro matricule requis').max(50, 'Numéro trop long'),
  firstName:          z.string().min(2, 'Prénom requis (min 2 caractères)').max(50),
  lastName:           z.string().min(2, 'Nom requis (min 2 caractères)').max(50),
  email:              z.string().email('Email invalide'),
  phone:              z.string().optional(),
  gender:             z.enum(['M', 'F']).optional(),
  level:              z.enum(LEVELS, { message: 'Niveau requis' }),
  filiereId:          z.string().min(1, 'Filière requise'),
});

type StudentFormData = z.infer<typeof studentSchema>;

// ---------------------------------------------------------------------------
// Normalise la réponse API quel que soit le format :
//   • show   → { id, name, email, phone, gender, registration_number, level, filiere_id, filiere, user:{…} }
//   • update → { message, student: { id, name, email, … } }
//   • index  → { id, name, email, phone, gender, registration_number, level, filiere:{id,name,code} }
// ---------------------------------------------------------------------------
function normalizeStudentData(raw: any) {
  if (!raw) return null;
  // Déballer { student: {…} } (réponse create/update)
  const s = ('student' in raw && raw.student) ? raw.student : raw;

  const name = s.name
    ?? [s.user?.prenom ?? s.user?.first_name, s.user?.nom ?? s.user?.last_name]
        .filter(Boolean).join(' ')
    ?? '';

  const parts     = name.trim().split(/\s+/);
  const firstName = parts[0] ?? '';
  const lastName  = parts.slice(1).join(' ');

  return {
    id:                  s.id,
    name,
    firstName,
    lastName,
    email:               s.email ?? s.user?.email ?? '',
    phone:               s.phone ?? s.user?.phone ?? s.user?.telephone ?? '',
    gender:              (s.gender ?? s.user?.genre ?? s.user?.gender) as 'M' | 'F' | undefined,
    registration_number: s.registration_number ?? s.numero_matricule ?? '',
    level:               (s.level ?? s.niveau ?? 'L1') as typeof LEVELS[number],
    filiere_id:          s.filiere_id ?? s.filiere?.id ?? null as number | null,
  };
}

// ---------------------------------------------------------------------------

export const StudentFormPage = () => {
  const { id }              = useParams<{ id: string }>();
  const [searchParams]      = useSearchParams();
  const location            = useLocation();
  const navigate            = useNavigate();
  const queryClient         = useQueryClient();
  const user                = useAppSelector((state) => state.auth.user);
  const universityId        = user?.universityId ?? 1;

  const isEdit              = !!id;
  const preselectedFiliereId = searchParams.get('filiereId') ?? '';

  // Page de retour : mémorisée dans le state de navigation (ex: depuis le répertoire)
  const returnTo = (location.state as any)?.returnTo ?? '/students';

  usePageTitle(isEdit ? 'Modifier étudiant' : 'Nouvel étudiant');

  // ── Données étudiant (mode édition) ───────────────────────────────────────
  const { data: rawStudentData, isLoading: loadingStudent } = useQuery({
    queryKey: ['student', universityId, id],
    queryFn:  () => studentService.getById(universityId, id!),
    enabled:  isEdit,
  });

  const student = normalizeStudentData(rawStudentData as any);

  // ── Filières ──────────────────────────────────────────────────────────────
  const { data: filieresData, isLoading: loadingFilieres } = useQuery({
    queryKey: ['filieres', universityId],
    queryFn:  () => filiereService.getAll(universityId),
  });
  const filieres = filieresData?.data ?? [];

  // ── Formulaire ────────────────────────────────────────────────────────────
  const { register, handleSubmit, setValue, formState: { errors } } =
    useForm<StudentFormData>({
      resolver: zodResolver(studentSchema),
      // "values" est réactif : se resynchronise quand student charge
      values: student ? {
        registrationNumber: student.registration_number,
        firstName:          student.firstName,
        lastName:           student.lastName,
        email:              student.email,
        phone:              student.phone,
        gender:             student.gender,
        level:              student.level,
        filiereId:          student.filiere_id ? String(student.filiere_id) : '',
      } : {
        registrationNumber: '',
        firstName:          '',
        lastName:           '',
        email:              '',
        phone:              '',
        gender:             undefined,
        level:              'L1' as const,
        filiereId:          preselectedFiliereId,
      },
    });

  // Force la sélection de la filière quand les options ET les données sont prêtes.
  // Nécessaire car le <select> HTML ignore la valeur si les <option> n'existent pas encore.
  useEffect(() => {
    if (isEdit && student?.filiere_id && filieres.length > 0) {
      setValue('filiereId', String(student.filiere_id), { shouldValidate: false });
    }
  }, [isEdit, student?.filiere_id, filieres.length, setValue]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['students'] });
    queryClient.invalidateQueries({ queryKey: ['students-directory'] });
    queryClient.invalidateQueries({ queryKey: ['filiere'] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      // 1. Créer l'étudiant
      const res = await studentService.create(universityId, {
        first_name:          data.firstName.trim(),
        last_name:           data.lastName.trim(),
        email:               data.email.trim().toLowerCase(),
        phone:               data.phone || undefined,
        gender:              data.gender || undefined,
        registration_number: data.registrationNumber.trim(),
        level:               data.level,
        filiere_id:          data.filiereId ? Number(data.filiereId) : null,
      });

      // 2. Attribuer automatiquement la carte RFID (numéro = matricule)
      const studentId = (res as any)?.student?.id ?? (res as any)?.id;
      if (studentId) {
        try {
          await rfidService.assignToStudent(
            universityId,
            studentId,
            data.registrationNumber.trim(),
          );
        } catch {
          // L'étudiant est créé même si l'attribution RFID échoue
        }
      }

      return res;
    },
    onSuccess: () => {
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ['students-rfid'] });
      if (preselectedFiliereId) navigate(`/filieres/${preselectedFiliereId}`);
      else navigate(returnTo);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: StudentFormData) =>
      studentService.update(universityId, id!, {
        first_name:          data.firstName.trim(),
        last_name:           data.lastName.trim(),
        email:               data.email.trim().toLowerCase(),
        phone:               data.phone || undefined,
        gender:              data.gender || undefined,
        registration_number: data.registrationNumber.trim(),
        level:               data.level,
        filiere_id:          data.filiereId ? Number(data.filiereId) : null,
      }),
    onSuccess: () => {
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ['student', universityId, id] });
      navigate(returnTo);
    },
  });

  const onSubmit = (data: StudentFormData) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const mutationError  = createMutation.error || updateMutation.error;
  const errorMessage   = mutationError
    ? ((mutationError as any)?.response?.data?.message ?? 'Une erreur est survenue')
    : null;
  const isPending      = createMutation.isPending || updateMutation.isPending;

  if (isEdit && loadingStudent) return <LoadingSpinner centered />;

  const inputStyle = {
    border:          '1px solid var(--border-input)',
    backgroundColor: 'var(--bg-input)',
    color:           'var(--text-primary)',
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={isEdit ? 'Modifier étudiant' : 'Nouvel étudiant'}
        subtitle={isEdit ? (student?.name || 'Chargement...') : 'Créer un étudiant'}
        actions={
          <button
            onClick={() => navigate(returnTo)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} /> Annuler
          </button>
        }
      />

      <div
        className="rounded-xl p-6 max-w-2xl"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
      >
        {errorMessage && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── Ligne 1 : Matricule + Filière ─────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Numéro matricule *
              </label>
              <input
                {...register('registrationNumber')}
                placeholder="Ex: LCS-2024-0001"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
              {errors.registrationNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.registrationNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Filière *
              </label>
              <select
                {...register('filiereId')}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              >
                <option value="">
                  {loadingFilieres ? 'Chargement des filières…' : 'Sélectionner une filière'}
                </option>
                {filieres.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.name} ({f.code}) — {f.level}
                  </option>
                ))}
              </select>
              {errors.filiereId && (
                <p className="mt-1 text-xs text-red-500">{errors.filiereId.message}</p>
              )}
            </div>
          </div>

          {/* ── Ligne 2 : Prénom + Nom ────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Prénom *
              </label>
              <input
                {...register('firstName')}
                placeholder="Théophile"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Nom *
              </label>
              <input
                {...register('lastName')}
                placeholder="ZANNOU"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* ── Ligne 3 : Email ───────────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Email *
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="t.zannou@lcs.edu"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={inputStyle}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* ── Ligne 4 : Téléphone + Niveau + Sexe ──────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Téléphone
              </label>
              <input
                {...register('phone')}
                placeholder="+229 90 00 00 00"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Niveau *
              </label>
              <select
                {...register('level')}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
              {errors.level && (
                <p className="mt-1 text-xs text-red-500">{errors.level.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Sexe
              </label>
              <select
                {...register('gender')}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              >
                <option value="">Non précisé</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Boutons ───────────────────────────────────────────────────── */}
          <div
            className="flex justify-end gap-3 pt-4"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <button
              type="button"
              onClick={() => navigate(returnTo)}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-colors"
              style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-accent)' }}
            >
              <Save size={16} />
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
