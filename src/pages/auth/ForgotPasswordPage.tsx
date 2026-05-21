import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/services/auth.service';
import { Logo } from '@/components/common/Logo';

const schema = z.object({
  email: z.string().email('Email invalide'),
});

type FormData = z.infer<typeof schema>;

export const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
    } catch { /* ignore */ } finally {
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
        <div className="flex items-center gap-3 mb-7">
          <Logo size={36} />
          <span className="font-sora font-bold text-base" style={{ color: 'var(--text-primary)' }}>ARCANA TECH</span>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
            >
              <h2 className="font-sora text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Mot de passe oublie
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Entrez votre email pour recevoir un lien de reinitialisation.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Adresse email
                  </label>
                  <div className="glass-input-wrap">
                    <Mail size={16} className="glass-input-icon" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="admin@universite.bj"
                      className="glass-input"
                    />
                  </div>
                  {errors.email && <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 font-semibold rounded-xl btn-accent disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi...
                    </span>
                  ) : 'Envoyer le lien'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
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
                Email envoye !
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Verifiez votre boite mail et suivez les instructions pour reinitialiser votre mot de passe.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Link
          to="/login"
          className="flex items-center gap-2 text-sm font-medium mt-7 link-accent group"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Retour a la connexion
        </Link>
      </motion.div>
    </div>
  );
};
