import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail, Lock, Shield, Eye, EyeOff, User, Phone,
  CheckCircle, AlertCircle, ArrowRight,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { LegalModal, type LegalType } from '@/components/common/LegalModal';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/services/auth.service';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { useAuth } from '@/hooks/useAuth';

// ═══ Validation Zod ═══
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'Minimum 2 caractères')
      .max(50, 'Maximum 50 caractères')
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Caractères invalides'),
    lastName: z
      .string()
      .min(2, 'Minimum 2 caractères')
      .max(50, 'Maximum 50 caractères')
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Caractères invalides'),
    email: z
      .string()
      .email('Adresse email invalide')
      .max(255, 'Email trop long'),
    phone: z
      .string()
      .regex(/^(\+?\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/, 'Numéro de téléphone invalide')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[a-z]/, 'Au moins une minuscule')
      .regex(/[0-9]/, 'Au moins un chiffre')
      .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Vous devez accepter les conditions d'utilisation",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ═══ Indicateur de force du mot de passe ═══
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ caractères', valid: password.length >= 8 },
    { label: 'Majuscule', valid: /[A-Z]/.test(password) },
    { label: 'Minuscule', valid: /[a-z]/.test(password) },
    { label: 'Chiffre', valid: /[0-9]/.test(password) },
    { label: 'Spécial (!@#...)', valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.valid).length;
  const colors = ['bg-rose-500', 'bg-rose-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'];
  const labels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < score ? colors[score] : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${score >= 4 ? 'text-emerald-600' : score >= 3 ? 'text-amber-600' : 'text-rose-500'}`}>
          {labels[score]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(({ label, valid }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs">
            {valid ? (
              <CheckCircle className="h-3 w-3 text-emerald-500" />
            ) : (
              <AlertCircle className="h-3 w-3" style={{ color: 'var(--text-placeholder)' }} />
            )}
            <span style={{ color: valid ? '#10b981' : 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ Input avec icône réutilisable ═══
const inputClass = "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none";

// ═══ Page d'inscription principale ═══
export const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalType>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  const watchPassword = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      // 1. Créer le compte
      await authService.register({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || undefined,
        password: data.password,
      });

      // 2. Connexion automatique avec les mêmes identifiants
      const result = await login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      // 3. Si la connexion auto échoue, afficher succès et rediriger vers login
      if (!result?.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2500);
      }
      // Si succès, useAuth.login() redirige déjà vers /dashboard automatiquement

    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        "Erreur lors de l'inscription";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.3) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center relative z-10"
        >
          <Logo size={80} className="justify-center mb-6" />
          <h1 className="text-4xl font-bold text-white mb-3">ARCANA TECH</h1>
          <p className="text-lg mb-8" style={{ color: 'var(--accent-light)' }}>Rejoignez votre établissement</p>
          <div className="space-y-4 text-left max-w-xs mx-auto">
            {[
              { icon: Shield, text: 'Accès sécurisé par carte RFID', accentColor: true },
              { icon: CheckCircle, text: 'Suivi de présence en temps réel', color: 'text-emerald-400' },
              { icon: Shield, text: 'Gestion complète des filières', color: 'text-amber-400' },
              { icon: ArrowRight, text: 'Inscription rapide et simple', color: 'text-sky-400' },
            ].map(({ icon: IconComp, text, color, accentColor }: any) => (
              <div key={text} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                <IconComp size={20} className={color || ''} style={accentColor ? { color: 'var(--accent-light)' } : undefined} />
                <span className="text-white/80 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg py-8"
        >
          {/* Logo mobile */}
          <div className="mb-6 lg:hidden">
            <Logo size={36} showText textClassName="text-[var(--text-primary)]" />
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Créer un compte</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Déjà inscrit ?{' '}
            <Link to="/login" className="font-medium" style={{ color: 'var(--accent)' }}>
              Se connecter
            </Link>
          </p>

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Inscription réussie !</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                      Redirection vers la page de connexion...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Server error */}
          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {serverError}
            </div>
          )}

          {/* OAuth */}
          <OAuthButtons label="Ou s'inscrire avec" />

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {/* Row 1: Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Prénom *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    {...register('firstName')}
                    placeholder="Jean"
                    className={inputClass}
                    style={{
                      border: '1px solid var(--border-input)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                {errors.firstName && <p className="text-xs text-rose-500 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Nom *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    {...register('lastName')}
                    placeholder="Dupont"
                    className={inputClass}
                    style={{
                      border: '1px solid var(--border-input)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                {errors.lastName && <p className="text-xs text-rose-500 mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Row 2: Email + Téléphone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="jean@universite.bj"
                    className={inputClass}
                    style={{
                      border: '1px solid var(--border-input)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Téléphone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="+229 90 00 00 00"
                    className={inputClass}
                    style={{
                      border: '1px solid var(--border-input)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Row 3: Mot de passe + Confirmation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Mot de passe *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    {...register('password')}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`${inputClass} !pr-10`}
                    style={{
                      border: '1px solid var(--border-input)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Confirmer *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`${inputClass} !pr-10`}
                    style={{
                      border: '1px solid var(--border-input)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* Password strength (spans full width) */}
            <PasswordStrength password={watchPassword} />

            {/* CGU */}
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="rounded border-slate-300 mt-0.5"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  J'accepte les{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setLegalModal('terms'); }}
                    style={{ color: 'var(--accent)' }}
                    className="hover:underline font-medium"
                  >
                    conditions d'utilisation
                  </button>{' '}
                  et la{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setLegalModal('privacy'); }}
                    style={{ color: 'var(--accent)' }}
                    className="hover:underline font-medium"
                  >
                    politique de confidentialité
                  </button>
                </span>
              </label>
              {errors.acceptTerms && <p className="text-xs text-rose-500 mt-1">{errors.acceptTerms.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full py-3 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-accent"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="underline underline-offset-2 transition-colors hover:text-[var(--accent)]"
              >
                Conditions d'utilisation
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="underline underline-offset-2 transition-colors hover:text-[var(--accent)]"
              >
                Politique de confidentialité
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              ARCANA TECH &copy; {new Date().getFullYear()} &mdash; Système de gestion universitaire
            </p>
          </div>
        </motion.div>
      </div>

      {/* Legal modals */}
      <AnimatePresence>
        {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
      </AnimatePresence>
    </div>
  );
};
