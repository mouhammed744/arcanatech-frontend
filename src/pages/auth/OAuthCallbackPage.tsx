import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/store';
import { setTokens, fetchProfileThunk, logout } from '@/store/slices/authSlice';
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * OAuthCallbackPage - Reçoit les tokens JWT depuis le backend OAuth
 *
 * FLUX :
 * 1. L'utilisateur clique sur "Google" / "Facebook" / "Instagram"
 * 2. Le frontend redirige vers le backend : /api/auth/{provider}/redirect
 * 3. Le backend redirige vers le provider OAuth (Google, etc.)
 * 4. Le provider redirige vers le backend : /api/auth/{provider}/callback?code=xxx
 * 5. Le backend traite le code, crée/connecte l'utilisateur, génère les tokens JWT
 * 6. Le backend redirige ici : /auth/oauth/callback?accessToken=xxx&refreshToken=xxx
 * 7. Cette page lit les tokens, les stocke, et redirige vers le dashboard
 */
export const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const oauthError = searchParams.get('oauth_error');

    if (oauthError) {
      setStatus('error');
      setErrorMsg(decodeURIComponent(oauthError));
      setTimeout(() => navigate('/login'), 4000);
      return;
    }

    if (!accessToken || !refreshToken) {
      setStatus('error');
      setErrorMsg('Tokens manquants dans la réponse OAuth.');
      setTimeout(() => navigate('/login'), 4000);
      return;
    }

    // Stocker les tokens
    dispatch(setTokens({ accessToken, refreshToken, expiresIn: 0 }));

    // Charger le profil utilisateur
    const allowedRoles = ['admin', 'superadmin', 'scolarite'];
    dispatch(fetchProfileThunk())
      .then((result) => {
        const user = (result as any).payload as { role?: string; universityId?: number } | undefined;
        if (user?.role && !allowedRoles.includes(user.role)) {
          dispatch(logout());
          setStatus('error');
          setErrorMsg('Accès réservé aux administrateurs.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        const destination = user?.universityId ? '/dashboard' : '/setup/university';
        setStatus('success');
        setTimeout(() => navigate(destination, { replace: true }), 1200);
      })
      .catch(() => {
        // Profil non chargé — rediriger vers setup pour que l'utilisateur choisisse
        setStatus('success');
        setTimeout(() => navigate('/setup/university', { replace: true }), 1200);
      });
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center"
      >
        <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
          <Shield size={32} className="text-white" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 size={36} className="text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Connexion en cours...</h2>
            <p className="text-slate-500 text-sm">
              Authentification via le réseau social en cours.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={36} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Connexion réussie !</h2>
            <p className="text-slate-500 text-sm">
              Redirection en cours...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={36} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Erreur de connexion</h2>
            <p className="text-red-600 text-sm mb-4">{errorMsg}</p>
            <p className="text-slate-400 text-xs">
              Redirection vers la page de connexion...
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};
