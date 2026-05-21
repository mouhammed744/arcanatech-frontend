import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PageHeader } from '@/components/common/PageHeader';
import { authService } from '@/services/auth.service';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[a-z]/, 'Au moins une minuscule')
      .regex(/[0-9]/, 'Au moins un chiffre')
      .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

function PasswordStrengthMini({ password }: { password: string }) {
  const checks = [
    { label: '8+ caractères', valid: password.length >= 8 },
    { label: 'Majuscule', valid: /[A-Z]/.test(password) },
    { label: 'Minuscule', valid: /[a-z]/.test(password) },
    { label: 'Chiffre', valid: /[0-9]/.test(password) },
    { label: 'Spécial', valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.valid).length;

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < score
                ? score >= 4 ? 'bg-emerald-500' : score >= 3 ? 'bg-amber-400' : 'bg-rose-400'
                : ''
            }`}
            style={i >= score ? { backgroundColor: 'var(--bg-muted)' } : undefined}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {checks.map(({ label, valid }) => (
          <div key={label} className="flex items-center gap-1 text-xs">
            {valid ? (
              <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
            ) : (
              <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--bg-muted)' }} />
            )}
            <span style={{ color: valid ? '#10b981' : 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const ChangePasswordPage = () => {
  usePageTitle('Changer le mot de passe');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const watchNewPassword = watch('newPassword', '');

  const onSubmit = async (data: PasswordForm) => {
    setIsLoading(true);
    setServerError('');
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 3000);
    } catch {
      setServerError('Mot de passe actuel incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Changer le mot de passe"
        breadcrumbs={[
          { label: 'Tableau de bord', to: '/dashboard' },
          { label: 'Mon profil', to: '/profile' },
          { label: 'Changer le mot de passe' },
        ]}
      />

      <div className="max-w-lg mx-auto">
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10">
              <ShieldCheck size={24} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sécurité du compte</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Saisissez votre mot de passe actuel pour vérifier votre identité
              </p>
            </div>
          </div>

          {/* Success */}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Mot de passe modifié avec succès !</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Redirection vers votre profil...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {serverError}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Current password */}
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Mot de passe actuel *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    {...register('currentPassword')}
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Saisissez votre mot de passe actuel"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:outline-none"
                    style={{
                      border: '1px solid var(--border-input)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.currentPassword && <p className="text-xs text-rose-500 mt-1">{errors.currentPassword.message}</p>}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)' }} className="pt-5">
                <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-muted)' }}>NOUVEAU MOT DE PASSE</p>

                {/* New password */}
                <div className="mb-4">
                  <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Nouveau mot de passe *
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      {...register('newPassword')}
                      type={showNew ? 'text' : 'password'}
                      placeholder="Minimum 8 caractères"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:outline-none"
                      style={{
                        border: '1px solid var(--border-input)',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-xs text-rose-500 mt-1">{errors.newPassword.message}</p>}
                  <PasswordStrengthMini password={watchNewPassword} />
                </div>

                {/* Confirm */}
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Confirmer le nouveau mot de passe *
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      {...register('confirmPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirmer le mot de passe"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:outline-none"
                      style={{
                        border: '1px solid var(--border-input)',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-card)',
                  }}
                >
                  <ArrowLeft size={16} /> Retour
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 font-medium text-sm rounded-xl disabled:opacity-50 btn-accent"
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Vérification...</>
                  ) : (
                    <><Lock size={16} /> Modifier le mot de passe</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
