import { createSlice } from '@reduxjs/toolkit';
import type { User } from '@/lib/api';

type AuthState = {
  user: User | null;
  token: string | null;
  loaded: boolean;
};

const token = localStorage.getItem('token');

const initialState: AuthState = {
  user: null,
  token,
  loaded: !token,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: { payload: { user: User; token: string } }) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loaded = true;
      localStorage.setItem('token', action.payload.token);
    },
    setUser: (state, action: { payload: User }) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    },
    setLoaded: (state, action: { payload: boolean }) => {
      state.loaded = action.payload;
    },
  },
});

export const { setAuth, setUser, logout, setLoaded } = authSlice.actions;
export default authSlice.reducer;
