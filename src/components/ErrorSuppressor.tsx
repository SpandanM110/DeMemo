'use client';

import { useEffect } from 'react';

/**
 * This component suppresses the [object Event] error that occurs
 * when MetaMask fires events during React Fast Refresh.
 * This is a known issue with MetaMask + React hot reloading.
 */
export default function ErrorSuppressor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      
      // Check if it's an Event object (common MetaMask issue during hot reload)
      if (
        reason instanceof Event ||
        (reason && typeof reason === 'object' && 'type' in reason && 'target' in reason) ||
        (reason && typeof reason === 'object' && reason.constructor?.name === 'Event') ||
        String(reason) === '[object Event]'
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    };

    // Handler for general errors
    const handleError = (event: ErrorEvent) => {
      if (
        event.message === '[object Event]' ||
        (event.error instanceof Event) ||
        (event.error && typeof event.error === 'object' && 'type' in event.error && 'target' in event.error)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    };

    // Add handlers with capture phase to catch errors early
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return <>{children}</>;
}
