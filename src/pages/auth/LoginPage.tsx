import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, GraduationCap, BarChart3, CalendarRange } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { Logo } from '@/components/common/Logo';
import { LegalModal, type LegalType } from '@/components/common/LegalModal';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caracteres'),
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  {
    Icon: GraduationCap,
    title: 'Gestion etudiants',
    desc: 'RFID, QR Code, NFC',
    color: { bg: 'rgba(34, 211, 238, 0.38)', border: 'rgba(34, 211, 238, 0.70)', icon: 'rgba(34, 211, 238, 0.55)', iconColor: '#A5F3FC', glow: 'rgba(34, 211, 238, 0.45)' },
  },
  {
    Icon: BarChart3,
    title: 'Stats temps reel',
    desc: 'Ponctualite & retards',
    color: { bg: 'rgba(52, 211, 153, 0.38)', border: 'rgba(52, 211, 153, 0.70)', icon: 'rgba(52, 211, 153, 0.55)', iconColor: '#A7F3D0', glow: 'rgba(52, 211, 153, 0.45)' },
  },
  {
    Icon: ShieldCheck,
    title: 'Controle d acces',
    desc: 'Automatise & securise',
    color: { bg: 'rgba(251, 146, 60, 0.38)', border: 'rgba(251, 146, 60, 0.70)', icon: 'rgba(251, 146, 60, 0.55)', iconColor: '#FDE68A', glow: 'rgba(251, 146, 60, 0.45)' },
  },
  {
    Icon: CalendarRange,
    title: 'Emplois du temps',
    desc: 'Planification avancee',
    color: { bg: 'rgba(167, 139, 250, 0.38)', border: 'rgba(167, 139, 250, 0.70)', icon: 'rgba(167, 139, 250, 0.55)', iconColor: '#DDD6FE', glow: 'rgba(167, 139, 250, 0.45)' },
  },
];

export const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [legalModal, setLegalModal] = useState<LegalType>(null);
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('oauth_error');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    const res = await login(data);
    if (res && !res.success && 'error' in res) setError(res.error as string);
  };

  return (
    <div className="min-h-screen flex relative overflow-x-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-30"
             style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)' }} />
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-25"
             style={{ background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 60%)' }} />
        <div className="absolute top-1/3 right-1/4 w-[320px] h-[320px] rounded-full blur-3xl opacity-20"
             style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 60%)' }} />
      </div>

      {/* Left brand panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(96, 165, 250, 0.10) 0%, transparent 60%), ' +
            'linear-gradient(160deg, #020817 0%, #050f24 35%, #070e20 70%, #0a1628 100%)',
        }}
      >
        {/* Halos discrets sur fond nuit */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-20%', left: '-10%', width: '70%', height: '70%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-15%', right: '-10%', width: '60%', height: '60%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Grille subtile en surimpression */}
        <div className="absolute inset-0 opacity-[0.10]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 75%)',
        }} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative z-10 text-center max-w-md">
          <Logo size={88} className="justify-center mb-8" />
          <h1
            className="font-sora text-4xl xl:text-5xl font-bold mb-3 tracking-tight"
            style={{
              color: '#FFFFFF',
              textShadow: '0 2px 20px rgba(255, 255, 255, 0.25), 0 0 40px rgba(147, 197, 253, 0.30)',
              letterSpacing: '-0.01em',
            }}
          >
            ARCANA TECH
          </h1>
          <p className="text-base xl:text-lg mb-10 font-medium" style={{ color: 'rgba(255, 255, 255, 0.90)', textShadow: '0 1px 8px rgba(0,0,0,0.25)' }}>
            Systeme de controle d acces intelligent pour l enseignement superieur
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            {FEATURES.map(({ Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.10, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, scale: 1.04, transition: { duration: 0.22, ease: 'easeOut' } }}
                whileTap={{ scale: 0.97 }}
                className="p-4 cursor-default"
                style={{
                  background: color.bg,
                  border: `1px solid ${color.border}`,
                  borderRadius: 14,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: `0 8px 32px rgba(0,0,0,0.22), 0 0 0 0 ${color.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                  transition: 'box-shadow 0.25s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.30), 0 0 24px ${color.glow}, inset 0 1px 0 rgba(255,255,255,0.20)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px rgba(0,0,0,0.22), 0 0 0 0 ${color.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`;
                }}
              >
                <motion.div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
                  style={{
                    background: color.icon,
                    color: color.iconColor,
                    border: `1px solid ${color.border}`,
                    boxShadow: `0 4px 14px rgba(0,0,0,0.18), 0 0 12px ${color.glow}`,
                  }}
                >
                  <Icon size={20} />
                </motion.div>
                <p className="font-bold text-sm" style={{ color: '#FFFFFF', textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>{title}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255, 255, 255, 0.78)' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <Logo size={36} showText textClassName="text-[var(--text-primary)]" />
          </div>

          <div className="glass-card-xl p-7 sm:p-8">
            <div className="mb-6">
              <h2 className="font-sora text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Connexion
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Accedez a votre espace d administration
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mb-4 p-3 rounded-xl text-sm font-medium"
                  style={{
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: 'var(--danger)',
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <OAuthButtons
              label="Se connecter avec"
              error={oauthError ? decodeURIComponent(oauthError) : undefined}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Adresse email
                </label>
                <div className="glass-input-wrap">
                  <Mail size={16} className="glass-input-icon" />
                  <input {...register('email')} type="email" placeholder="Votre adresse email" className="glass-input" />
                </div>
                {errors.email && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Mot de passe
                </label>
                <div className="glass-input-wrap">
                  <Lock size={16} className="glass-input-icon" />
                  <input
                    {...register('password')}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="........"
                    className="glass-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label={showPwd ? 'Masquer' : 'Afficher'}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
                  <input type="checkbox" className="rounded" style={{ accentColor: 'var(--accent)' }} />
                  Se souvenir de moi
                </label>
                <Link to="/forgot-password" className="text-sm font-medium link-accent">
                  Mot de passe oublie ?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 font-semibold rounded-xl btn-accent disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connexion...
                  </span>
                ) : 'Se connecter'}
              </button>
            </form>

            <p className="text-sm text-center mt-6" style={{ color: 'var(--text-muted)' }}>
              Pas encore de compte ?{' '}
              <Link to="/register" className="font-semibold link-accent">
                Creer un compte
              </Link>
            </p>
          </div>

          <div className="text-center mt-6 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <button type="button" onClick={() => setLegalModal('terms')} className="underline underline-offset-2 hover:text-[var(--accent)] transition-colors">
                Conditions d utilisation
              </button>
              <span>.</span>
              <button type="button" onClick={() => setLegalModal('privacy')} className="underline underline-offset-2 hover:text-[var(--accent)] transition-colors">
                Politique de confidentialite
              </button>
            </div>
            <p className="text-xs opacity-60" style={{ color: 'var(--text-muted)' }}>
              ARCANA TECH &copy; {new Date().getFullYear()} &mdash; Systeme de gestion universitaire
            </p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
      </AnimatePresence>
    </div>
  );
};
