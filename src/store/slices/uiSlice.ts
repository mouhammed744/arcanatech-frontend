import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AccentColor = 'indigo' | 'blue' | 'sky' | 'emerald' | 'amber' | 'rose' | 'orange' | 'teal';
/** Mode Focus = pédagogie / données · Mode Campus = temps réel / opérationnel */
export type UiMode = 'focus' | 'campus';
type UiDensity = 'compact' | 'normal' | 'comfortable';

interface UiState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  accentColor: AccentColor;
  uiDensity: UiDensity;
  uiMode: UiMode;
  currentPageTitle: string;
}

const getStoredTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('uniaccess_theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredAccent = (): AccentColor => {
  const stored = localStorage.getItem('uniaccess_accent') as AccentColor;
  const valid: AccentColor[] = ['indigo', 'blue', 'sky', 'emerald', 'amber', 'rose', 'orange', 'teal'];
  return valid.includes(stored) ? stored : 'indigo';
};

const getStoredDensity = (): UiDensity => {
  const stored = localStorage.getItem('uniaccess_density') as UiDensity;
  const valid: UiDensity[] = ['compact', 'normal', 'comfortable'];
  return valid.includes(stored) ? stored : 'normal';
};

const getStoredUiMode = (): UiMode => {
  const stored = localStorage.getItem('uniaccess_ui_mode') as UiMode;
  return stored === 'campus' || stored === 'focus' ? stored : 'focus';
};

const applyTheme = (theme: 'light' | 'dark') => {
  // Add transition class for smooth switch
  document.documentElement.classList.add('theme-transitioning');
  document.documentElement.classList.toggle('dark', theme === 'dark');
  // Remove transition class after animation completes
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 600);
};

const applyAccent = (accent: AccentColor) => {
  document.documentElement.setAttribute('data-accent', accent);
};

const applyDensity = (density: UiDensity) => {
  document.documentElement.setAttribute('data-density', density);
};

const applyUiMode = (mode: UiMode) => {
  document.documentElement.setAttribute('data-ui-mode', mode);
};

const initialState: UiState = {
  sidebarCollapsed: false,
  theme: getStoredTheme(),
  accentColor: getStoredAccent(),
  uiDensity: getStoredDensity(),
  uiMode: getStoredUiMode(),
  currentPageTitle: '',
};

// Apply initial values to DOM
applyTheme(initialState.theme);
applyAccent(initialState.accentColor);
applyDensity(initialState.uiDensity);
applyUiMode(initialState.uiMode);

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('uniaccess_theme', action.payload);
      applyTheme(action.payload);
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      localStorage.setItem('uniaccess_theme', newTheme);
      applyTheme(newTheme);
    },
    setAccentColor: (state, action: PayloadAction<AccentColor>) => {
      state.accentColor = action.payload;
      localStorage.setItem('uniaccess_accent', action.payload);
      applyAccent(action.payload);
    },
    setUiDensity: (state, action: PayloadAction<UiDensity>) => {
      state.uiDensity = action.payload;
      localStorage.setItem('uniaccess_density', action.payload);
      applyDensity(action.payload);
    },
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.currentPageTitle = action.payload;
    },
    setUiMode: (state, action: PayloadAction<UiMode>) => {
      state.uiMode = action.payload;
      localStorage.setItem('uniaccess_ui_mode', action.payload);
      applyUiMode(action.payload);
    },
    toggleUiMode: (state) => {
      const next: UiMode = state.uiMode === 'focus' ? 'campus' : 'focus';
      state.uiMode = next;
      localStorage.setItem('uniaccess_ui_mode', next);
      applyUiMode(next);
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setTheme, toggleTheme, setAccentColor, setUiDensity, setPageTitle, setUiMode, toggleUiMode } = uiSlice.actions;
export default uiSlice.reducer;
