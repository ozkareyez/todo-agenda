'use client';

import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#2D3436',
            color: '#FFFFFF',
            borderRadius: '12px',
          },
        }}
      />
    </>
  );
}