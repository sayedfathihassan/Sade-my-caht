import React, { useState, useEffect } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    let message = "حدث خطأ ما. يرجى المحاولة مرة أخرى.";
    
    try {
      const firestoreError = JSON.parse(error?.message || "");
      if (firestoreError.error?.includes("insufficient permissions")) {
        message = "عذراً، ليس لديك الصلاحيات الكافية للقيام بهذا الإجراء.";
      }
    } catch (e) {
      // Not a JSON error
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4 text-center">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl max-w-md w-full">
          <h2 className="text-2xl font-bold text-neutral-50 mb-4">عذراً!</h2>
          <p className="text-neutral-400 mb-6">{message}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 rounded-xl transition-colors"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
