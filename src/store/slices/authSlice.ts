import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, LoginCredentials, AuthTokens, User } from '@/types';
import { isTwoFactorChallenge } from '@/types';
import { secureStorage, isTokenExpired } from '@/lib/security';

const VALID_ACCENTS = ['indigo', 'blue', 'sky', 'emerald', 'amber', 'rose', 'orange', 'teal'];

function applyUniversityTheme(user: User | null) {
  if (!user?.university?.accentPreset) return;
  const accent = user.university.accentPreset;
  if (VALID_ACCENTS.includes(accent)) {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('uniaccess_accent', accent);
  }
}

const TOKEN_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
} as const;

function loadInitialState(): AuthState {
  const accessToken = secureStorage.get(TOKEN_KEYS.access);
  const refreshToken = secureStorage.get(TOKEN_KEYS.refresh);

  const hasValidRefresh = refreshToken && !isTokenExpired(refreshToken, 0);
  const hasValidAccess = accessToken && !isTokenExpired(accessToken, 0);

  return {
    user: null,
    accessToken: hasValidAccess ? accessToken : null,
    refreshToken: hasValidRefresh ? refreshToken : null,
    isAuthenticated: !!(hasValidAccess || hasValidRefresh),
    isLoading: false,
  };
}

const initialState: AuthState = loadInitialState();

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const { authService } = await import('@/services/auth.service');
      return await authService.login(credentials);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Email ou mot de passe incorrect');
    }
  },
);

export const fetchProfileThunk = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const { authService } = await import('@/services/auth.service');
    return await authService.getProfile();
  } catch {
    return rejectWithValue('Impossible de charger le profil');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken ?? state.refreshToken;
      state.isAuthenticated = true;

      secureStorage.set(TOKEN_KEYS.access, action.payload.accessToken);
      if (action.payload.refreshToken) {
        secureStorage.set(TOKEN_KEYS.refresh, action.payload.refreshToken);
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;

      secureStorage.remove(TOKEN_KEYS.access);
      secureStorage.remove(TOKEN_KEYS.refresh);
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    loginFulfilled: (state, action: PayloadAction<{ user: User; tokens: AuthTokens }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;

      secureStorage.set(TOKEN_KEYS.access, action.payload.tokens.accessToken);
      secureStorage.set(TOKEN_KEYS.refresh, action.payload.tokens.refreshToken);

      applyUniversityTheme(action.payload.user);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;

        if (isTwoFactorChallenge(action.payload)) {
          return;
        }

        const payload = action.payload;
        state.user = payload.user;
        state.accessToken = payload.tokens.accessToken;
        state.refreshToken = payload.tokens.refreshToken;
        state.isAuthenticated = true;

        secureStorage.set(TOKEN_KEYS.access, payload.tokens.accessToken);
        secureStorage.set(TOKEN_KEYS.refresh, payload.tokens.refreshToken);

        applyUniversityTheme(payload.user);
      })
      .addCase(loginThunk.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        applyUniversityTheme(action.payload);
      })
      .addCase(fetchProfileThunk.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        secureStorage.remove(TOKEN_KEYS.access);
        secureStorage.remove(TOKEN_KEYS.refresh);
      });
  },
});

export const { setTokens, logout, setUser, loginFulfilled } = authSlice.actions;
export default authSlice.reducer;
