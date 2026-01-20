"use client";

import { useEffect } from "react";

export function ErrorBoundary() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('Unhandled promise rejection caught:', event.reason);
      event.preventDefault(); // Prevent the error from appearing in console
    };

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      console.warn('Uncaught error caught:', event.error);
      event.preventDefault(); // Prevent the error from appearing in console
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null; // This component doesn't render anything
}
