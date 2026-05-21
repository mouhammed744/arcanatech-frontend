import { useEffect, useRef, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Smartphone, ArrowLeft, Send } from 'lucide-react';
import { twoFactorService } from '@/services/twoFactor.service';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Logo } from '@/components/common/Logo';
import { isTwoFactorChallenge } from '@/types';

interface LocationState {
  challengeToken?: string;
  method?: 'totp' | 'email' | 'both';
  maskedEmail?: string;
}

export const TwoFactorVerifyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { finalizeLogin } = useAuth();

  const state = location.state as LocationState | null;
  const challengeToken = state?.challengeToken;
  const method = state?.method;
  const maskedEmail = state?.maskedEmail;

  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'email'>(
    method === 'email' ? 'email' : 'totp',
  );
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => digits.join(''), [digits]);

  // Redirection si l etat est manquant (page visitee en direct)
  useEffect(() => {
    if (!challengeToken) {
      navigate('/login', { replace: true });
    }
  }, [challengeToken, navigate]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, [selectedMethod]);

  const handleDigit = (index: number, raw: string) => {
    setError('');
    const v = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < 5) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    const next = Array(6).fill('');
    pasted.forEach((d, i) => (next[i] = d));
    setDigits(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSendEmailCode = async () => {
    if (!challengeToken) return;
    setSendingEmail(true);
    setError('');
    setInfo('');
    try {
      const res = await twoFactorService.sendCode(challengeToken);
      setInfo(res.message);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Impossible d envoyer le code.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Auto-submit quand 6 chiffres sont entres
  useEffect(() => {
    if (code.length === 6 && !loading && challengeToken) {
      void handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleVerify = async () => {
    if (!challengeToken || code.length !== 6) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await twoFactorService.verify(challengeToken, code, selectedMethod);
      if (isTwoFactorChallenge(res)) {
        // Impossible en theorie, mais garde-fou
        setError('Reponse inattendue du serveur.');
        return;
      }
      finalizeLogin({ user: res.user, tokens: res.tokens });
    } catch (e) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg =
        err.response?.data?.errors?.code?.[0] ||
        err.response?.data?.message ||
        'Code invalide ou expire.';
      setError(msg);
      setDigits(Array(6).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  if (!challengeToken) return null;

  const allowEmail = method === 'email' || method === 'both';
  const allowTotp = method === 'totp' || method === 'both';

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-app)' }}>
      <div className="blob-1" />
      <div className="blob-2" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card-xl w-full max-w-md p-8 relative z-10"
      >
        <button
          onClick={() => navigate('/login')}
          className="btn-ghost inline-flex items-center gap-1 mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'var(--accent-gradient)',
              boxShadow: '0 10px 28px rgba(var(--accent-rgb), 0.4)',
            }}
          >
            <Shield size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Verification en deux etapes
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Securisez l acces a votre compte
            </p>
          </div>
        </div>

        {method === 'both' && (
          <div className="glass-tabs w-full mb-5">
            <button
              onClick={() => setSelectedMethod('totp')}
              aria-selected={selectedMethod === 'totp'}
              className={`glass-tab flex-1 inline-flex items-center justify-center gap-2 ${selectedMethod === 'totp' ? 'active' : ''}`}
            >
              <Smartphone size={14} /> Application
            </button>
            <button
              onClick={() => setSelectedMethod('email')}
              aria-selected={selectedMethod === 'email'}
              className={`glass-tab flex-1 inline-flex items-center justify-center gap-2 ${selectedMethod === 'email' ? 'active' : ''}`}
            >
              <Mail size={14} /> Email
            </button>
          </div>
        )}

        <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {selectedMethod === 'totp' && allowTotp && 'Entrez le code a 6 chiffres genere par votre application d authentification.'}
          {selectedMethod === 'email' && allowEmail && (
            <>
              Un code a ete envoye a <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{maskedEmail}</span>.
            </>
          )}
        </p>

        {info && (
          <div className="mb-4 p-3 rounded-xl text-sm"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669' }}>
            {info}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#DC2626' }}>
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-between mb-5" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`otp-input ${d ? 'filled' : ''}`}
              aria-label={`Chiffre ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="btn-accent w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <LoadingSpinner size="sm" /> : <Shield size={16} />}
          Verifier
        </button>

        {selectedMethod === 'email' && allowEmail && (
          <button
            onClick={handleSendEmailCode}
            disabled={sendingEmail}
            className="btn-ghost w-full mt-3 inline-flex items-center justify-center gap-2 text-sm"
          >
            {sendingEmail ? <LoadingSpinner size="sm" /> : <Send size={14} />}
            {sendingEmail ? 'Envoi...' : 'Renvoyer un code par email'}
          </button>
        )}

        <div className="divider-gradient" />

        <div className="text-center">
          <Logo size={28} className="justify-center opacity-60" />
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
            Vos codes sont verifies de maniere securisee et expirent rapidement.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default TwoFactorVerifyPage;
