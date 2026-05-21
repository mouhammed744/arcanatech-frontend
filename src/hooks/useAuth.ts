import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginThunk, logout, loginFulfilled } from '@/store/slices/authSlice';
import { markFreshLogin } from '@/lib/loginFlag';
import { addNotification } from '@/store/slices/notificationsSlice';
import type { LoginCredentials, LoginApiResponse, User, AuthTokens } from '@/types';
import { isTwoFactorChallenge } from '@/types';
import { authService } from '@/services/auth.service';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  const finalizeLogin = useCallback(
    (payload: { user: User; tokens: AuthTokens }) => {
      dispatch(loginFulfilled(payload));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Connexion reussie',
          message: 'Bienvenue, ' + payload.user.firstName + ' !',
        }),
      );
      // Marque le login comme "frais" — survit aux navigations mais pas au F5
      markFreshLogin();
      navigate('/dashboard');
      return { success: true as const };
    },
    [dispatch, navigate],
  );

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await dispatch(loginThunk(credentials));
      if (loginThunk.fulfilled.match(result)) {
        const payload = result.payload as LoginApiResponse;

        if (isTwoFactorChallenge(payload)) {
          navigate('/verify-2fa', {
            state: {
              challengeToken: payload.challengeToken,
              method: payload.method,
              maskedEmail: payload.maskedEmail,
            },
          });
          return { success: true as const, requires2fa: true as const };
        }

        return finalizeLogin(payload);
      }
      return { success: false as const, error: result.payload as string };
    },
    [dispatch, navigate, finalizeLogin],
  );

  const logoutUser = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignorer l erreur serveur
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  }, [dispatch, navigate]);

  return { user, isAuthenticated, isLoading, login, logout: logoutUser, finalizeLogin };
};
