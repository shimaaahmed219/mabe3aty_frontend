import type { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <div className={`w-full min-w-0 ${className}`.trim()}>
      {children}
    </div>
  );
}
