import { toast as sonnerToast, type ExternalToast } from 'sonner';

const base: ExternalToast = { duration: 4500 };

export const appToast = {
  success(title: string, description?: string, options?: ExternalToast) {
    return sonnerToast.success(title, { ...base, ...options, description: description ?? options?.description });
  },
  error(title: string, description?: string, options?: ExternalToast) {
    return sonnerToast.error(title, {
      ...base,
      ...options,
      duration: options?.duration ?? 6500,
      description: description ?? options?.description,
    });
  },
  warning(title: string, description?: string, options?: ExternalToast) {
    return sonnerToast.warning(title, { ...base, ...options, description: description ?? options?.description });
  },
  info(title: string, description?: string, options?: ExternalToast) {
    return sonnerToast.info(title, { ...base, ...options, description: description ?? options?.description });
  },
};

export { toast as rawToast } from 'sonner';
