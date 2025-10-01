// src/pages/_app.tsx
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { initializeDemoData } from '@/utils/initDemoData';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize demo data on first load
    initializeDemoData();

    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.log('Service worker registration failed:', error);
      });
    }
  }, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
