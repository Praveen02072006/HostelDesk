import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - reduces unnecessary refetches
      gcTime: 1000 * 60 * 15, // 15 minutes - keep cache longer
      refetchOnWindowFocus: false, // Prevents lag on tab switch
      refetchOnReconnect: true,
      retry: (failureCount, error: unknown) => {
        const err = error as { response?: { status?: number } };
        if (err?.response?.status === 401 || err?.response?.status === 403) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false, // Don't retry mutations
    },
  },
});

import { ErrorBoundary } from './components/layout/ErrorBoundary';

// Lazy load devtools only in dev mode
const ReactQueryDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import('@tanstack/react-query-devtools').then(mod => ({
        default: mod.ReactQueryDevtools,
      }))
    )
  : null;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-surface-card)',
              color: 'var(--color-text-primary)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
            },
          }}
        />
        {ReactQueryDevtools && (
          <React.Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          </React.Suspense>
        )}
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

