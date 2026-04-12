import { Toaster } from 'sonner';
import 'sonner/dist/styles.css';
import { useAppSelector } from '@/store/hooks';

/** Toaster عام: RTL، ألوان الوضع، مسافة آمنة فوق شريط الجوال السفلي */
export function AppToaster() {
  const mode = useAppSelector((s) => s.theme.mode);

  return (
    <Toaster
      theme={mode}
      dir="rtl"
      position="bottom-center"
      richColors
      closeButton
      expand
      visibleToasts={4}
      gap={10}
      duration={4500}
      offset="1rem"
      mobileOffset={{ bottom: 'max(5.25rem, calc(env(safe-area-inset-bottom, 0px) + 4.5rem))' }}
      toastOptions={{
        classNames: {
          toast:
            '!w-[min(100vw-1.25rem,28rem)] !max-w-[min(100vw-1.25rem,28rem)] !rounded-2xl !font-sans',
          title: '!text-sm !font-semibold !leading-snug',
          description: '!text-xs !leading-relaxed !opacity-95',
        },
      }}
      containerAriaLabel="إشعارات التطبيق"
    />
  );
}
