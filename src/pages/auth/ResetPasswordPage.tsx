import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/services/auth.service';
import { Logo } from '@/components/common/Logo';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[a-z]/, 'Au moins une minuscule')
      .regex(/[0-9]/, 'Au moins un chiffre')
      .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['', 'bg-rose-500', 'bg-orange-400', 'bg-amber-400', 'bg-lime-400', 'bg-emerald-500'];
  const labels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-white/10'}`} />
        ))}
      </div>
      <p className="text-xs" style={{ color: score >= 4 ? '#10b981' : score >= 3 ? '#f59e0b' : '#f43f5e' }}>
        {labels[score]}
      </p>
    </div>
  );
}

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchPwd = watch('password', '');

  // Redirection auto vers /login 4s après succès
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => navigate('/login'), 4000);
    return () => clearTimeout(t);
  }, [success, navigate]);

  // Token manquant → rediriger
  useEffect(() => {
    if (!token || !email) navigate('/forgot-password');
  }, [token, email, navigate]);

  const onSubmit = async (data: FormData) => {
    setError('');
    setIsLoading(true);
    try {
      await authService.resetPassword(token, data.password);
      setSuccess(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Lien invalide ou expiré. Veuillez refaire une demande.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card-xl p-7 sm:p-8"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-7">
          <Logo size={36} />
          <span className="font-sora font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            ARCANA TECH
          </span>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Succès ── */}
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              className="text-center py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 12 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
                  border: '1px solid rgba(16,185,129,0.25)',
                }}
              >
                <CheckCircle2 size={36} style={{ color: '#10B981' }} />
              </motion.div>
              <h3 className="font-sora text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Mot de passe modifié !
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Votre mot de passe a été réinitialisé avec succès.
                <br />Redirection vers la connexion dans quelques secondes...
              </p>
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--accent)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                />
              </div>
            </motion.div>
          ) : (
            /* ── Formulaire ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
            >
              <h2
                className="font-sora text-2xl sm:text-3xl font-bold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Nouveau mot de passe
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Choisissez un mot de passe fort pour <strong style={{ color: 'var(--text-secondary)' }}>{email}</strong>
              </p>

              {/* Erreur serveur */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2"
                    style={{
                      background: 'rgba(244,63,94,0.08)',
                      border: '1px solid rgba(244,63,94,0.25)',
                      color: 'var(--danger)',
                    }}
                  >
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Nouveau mot de passe */}
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-wider block mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Nouveau mot de passe
                  </label>
                  <div className="glass-input-wrap">
                    <Lock size={16} className="glass-input-icon" />
                    <input
                      {...register('password')}
                      type={showPwd ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="glass-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>
                      {errors.password.message}
                    </p>
                  )}
                  <StrengthBar password={watchPwd} />
                </div>

                {/* Confirmer mot de passe */}
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-wider block mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Confirmer le mot de passe
                  </label>
                  <div className="glass-input-wrap">
                    <Lock size={16} className="glass-input-icon" />
                    <input
                      {...register('confirmPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="glass-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 font-semibold rounded-xl btn-accent disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Modification...
                    </span>
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <Link
          to="/login"
          className="flex items-center gap-2 text-sm font-medium mt-7 link-accent group"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Retour à la connexion
        </Link>
      </motion.div>
    </div>
  );
};
