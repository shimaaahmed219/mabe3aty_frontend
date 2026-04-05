import { createSlice } from '@reduxjs/toolkit';

type ThemeState = { mode: 'light' | 'dark' };

const rawTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
const stored: 'light' | 'dark' | null =
  rawTheme === 'light' || rawTheme === 'dark' ? rawTheme : null;
const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const initialState: ThemeState = {
  mode: stored ?? (prefersDark ? 'dark' : 'light'),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
    },
    setTheme: (state, action: { payload: 'light' | 'dark' }) => {
      state.mode = action.payload;
      localStorage.setItem('theme', state.mode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
