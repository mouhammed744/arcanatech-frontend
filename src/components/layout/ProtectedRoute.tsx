import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchProfileThunk, logout } from '@/store/slices/authSlice';
import { isTokenExpired } from '@/lib/security';

const ALLOWED_ROLES = ['admin', 'superadmin', 'scolarite'];

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, accessToken, refreshToken, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Vérifier l'expiration du token à chaque navigation
  useEffect(() => {
    if (accessToken && isTokenExpired(accessToken)) {
      // L'access token est expiré
      if (!refreshToken || isTokenExpired(refreshToken, 0)) {
        // Le refresh token est aussi expiré → déconnexion
        dispatch(logout());
      }
      // Sinon l'intercepteur API se chargera du refresh
    }
  }, [accessToken, refreshToken, dispatch]);

  // Charger le profil utilisateur si pas encore chargé
  useEffect(() => {
    if (isAuthenticated && !user && accessToken) {
      dispatch(fetchProfileThunk());
    }
  }, [isAuthenticated, user, accessToken, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Bloquer les utilisateurs non-admin (students, teachers)
  if (user && !ALLOWED_ROLES.includes(user.role)) {
    dispatch(logout());
    return <Navigate to="/login" state={{ error: 'Accès réservé aux administrateurs.' }} replace />;
  }

  // Nouvel utilisateur OAuth sans université → forcer la sélection d'université
  if (user && !user.universityId) {
    return <Navigate to="/setup/university" replace />;
  }

  return <>{children}</>;
};
