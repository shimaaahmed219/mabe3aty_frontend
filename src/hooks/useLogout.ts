import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { authApi } from '@/lib/api';

export function useLogout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  }, [dispatch, navigate]);
}
