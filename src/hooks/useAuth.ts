import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast'; // adjust if using another toast lib
import { register, login, logout } from '../services/auth.service';
import { mapError } from '../utils/errorMessages';

/** Register mutation */
export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation(register, {
    onSuccess: (data) => {
      toast.success('تم التسجيل بنجاح');
      // Invalidate any auth‑related queries if you have them
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: any) => {
      toast.error(mapError(error));
    },
  });
};

/** Login mutation */
export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation(login, {
    onSuccess: (data) => {
      toast.success('تم تسجيل الدخول');
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: any) => {
      toast.error(mapError(error));
    },
  });
};

/** Logout mutation */
export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation(logout, {
    onSuccess: () => {
      toast.success('تم تسجيل الخروج');
      // Clear auth queries and possibly other user data
      queryClient.clear();
    },
    onError: (error: any) => {
      toast.error(mapError(error));
    },
  });
};
