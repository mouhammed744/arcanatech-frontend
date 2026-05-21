import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Smartphone, Mail, Check, Copy, X, AlertTriangle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { twoFactorService } from '@/services/twoFactor.service';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import type { TwoFactorSetupResponse, TwoFactorStatus } from '@/types';

export const TwoFactorSetupPage = () => {
  usePageTitle('Authentification a deux facteurs');

  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setup, setSetup] = useState<TwoFactorSetupResponse | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [disableOpen, setDisableOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const s = await twoFactorService.status();
      setStatus(s);
    } catch {
      setStatus({ enabled: false, method: null, confirmedAt: null });
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    setError('');
    setSubmitting(true);
    try {
      const r = await twoFactorService.setup();
      setSetup(r);
      setCode('');
    } catch {
      setError('Impossible de demarrer la configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmTotp = async () => {
    if (code.length !== 6) return;
    setError('');
    setSubmitting(true);
    try {
      await twoFactorService.confirm(code, 'totp');
      setMsg('Authentification TOTP activee avec succes.');
      setSetup(null);
      setCode('');
      await loadStatus();
    } catch (e) {
      const err = e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      setError(err.response?.data?.errors?.code?.[0] || err.response?.data?.message || 'Code invalide.');
    } finally {
      setSubmitting(false);
    }
  };

  const enableEmailOnly = async () => {
    setError('');
    setSubmitting(true);
    try {
      await twoFactorService.enableEmail();
      setMsg('2FA par email activee. Vous recevrez un code a chaque connexion.');
      await loadStatus();
    } catch {
      setError('Impossible d activer la 2FA email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    setError('');
    setSubmitting(true);
    try {
      await twoFactorService.disable(password);
      setMsg('2FA desactivee.');
      setPassword('');
      setDisableOpen(false);
      await loadStatus();
    } catch (e) {
      const err = e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      setError(err.response?.data?.errors?.password?.[0] || err.response?.data?.message || 'Mot de passe incorrect.');
    } finally {
      setSubmitting(false);
    }
  };

  const copySecret = () => {
    if (!setup) return;
    navigator.clipboard.writeText(setup.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingSpinner centered label="Chargement..." />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-6 space-y-6"
    >
      <PageHeader
        title="Authentification a deux facteurs"
        subtitle="Ajoutez une couche de securite supplementaire a votre compte."
      />

      {msg && (
        <div className="glass-card p-4 flex items-center gap-3"
          style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)' }}>
          <Check size={20} style={{ color: '#059669' }} />
          <p className="text-sm font-medium" style={{ color: '#065F46' }}>{msg}</p>
        </div>
      )}
      {error && (
        <div className="glass-card p-4 flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <AlertTriangle size={20} style={{ color: '#DC2626' }} />
          <p className="text-sm font-medium" style={{ color: '#991B1B' }}>{error}</p>
        </div>
      )}

      {/* Statut actuel */}
      <div className="glass-card-xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: status?.enabled ? 'linear-gradient(135deg,#10B981,#14B8A6)' : 'var(--bg-muted)',
                boxShadow: status?.enabled ? '0 10px 24px rgba(16,185,129,0.3)' : 'none',
                border: status?.enabled ? 'none' : '1px solid var(--border-color)',
              }}
            >
              <Shield size={26} className={status?.enabled ? 'text-white' : ''} style={{ color: status?.enabled ? undefined : 'var(--text-muted)' }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {status?.enabled ? '2FA activee' : '2FA desactivee'}
              </h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {status?.enabled
                  ? `Methode : ${status.method === 'totp' ? 'Application d authentification' : status.method === 'email' ? 'Code par email' : 'Application + Email'}`
                  : 'Activez la 2FA pour mieux proteger votre compte.'}
              </p>
            </div>
          </div>

          {status?.enabled && (
            <button className="btn-danger inline-flex items-center gap-2" onClick={() => setDisableOpen(true)}>
              <X size={16} /> Desactiver
            </button>
          )}
        </div>
      </div>

      {/* Options d activation */}
      {!status?.enabled && !setup && (
        <div className="grid md:grid-cols-2 gap-4 stagger-list">
          <div className="glass-card-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)' }}>
                <Smartphone size={20} />
              </div>
              <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Application (recommande)</h4>
            </div>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Scannez un QR code avec Google Authenticator, Authy, 1Password...
            </p>
            <button className="btn-accent w-full" onClick={startSetup} disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : 'Configurer TOTP'}
            </button>
          </div>

          <div className="glass-card-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(6,182,212,0.12)', color: '#0891B2' }}>
                <Mail size={20} />
              </div>
              <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Email</h4>
            </div>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Un code a usage unique sera envoye a chaque connexion sur votre email.
            </p>
            <button className="btn-secondary w-full" onClick={enableEmailOnly} disabled={submitting}>
              Activer par email
            </button>
          </div>
        </div>
      )}

      {/* Etape 2 : scanner le QR */}
      {setup && (
        <div className="glass-card-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Smartphone size={18} /> Scannez le QR code
          </h3>

          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(setup.qrCodeUrl)}`}
                alt="QR code 2FA"
                width={220}
                height={220}
              />
            </div>

            <div className="w-full">
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                Saisie manuelle (si vous ne pouvez pas scanner) :
              </p>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 p-3 rounded-xl font-mono text-sm tracking-wider"
                  style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-color)' }}
                >
                  {setup.manualEntry}
                </code>
                <button
                  onClick={copySecret}
                  className="btn-icon"
                  aria-label="Copier"
                >
                  {copied ? <Check size={16} style={{ color: '#059669' }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>

          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Code a 6 chiffres genere par l application
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="glass-input font-mono text-lg tracking-widest text-center"
            placeholder="000000"
          />

          <div className="flex gap-3 justify-end mt-5">
            <button className="btn-secondary" onClick={() => setSetup(null)}>Annuler</button>
            <button className="btn-accent inline-flex items-center gap-2"
              onClick={confirmTotp} disabled={submitting || code.length !== 6}>
              {submitting ? <LoadingSpinner size="sm" /> : <Check size={16} />}
              Activer
            </button>
          </div>
        </div>
      )}

      {/* Dialog desactivation */}
      {disableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 glass-backdrop" onClick={() => setDisableOpen(false)} />
          <div className="glass-modal relative max-w-md w-full p-6 z-10">
            <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Desactiver la 2FA</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Confirmez votre mot de passe pour desactiver l authentification a deux facteurs.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="glass-input mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setDisableOpen(false)}>Annuler</button>
              <button className="btn-danger inline-flex items-center gap-2"
                onClick={handleDisable} disabled={submitting || !password}>
                {submitting ? <LoadingSpinner size="sm" /> : <X size={16} />}
                Desactiver
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default TwoFactorSetupPage;
