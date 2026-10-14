'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import Toast from '@/components/Toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastData = {
  message: string;
  type: ToastType;
  link?: string;
  btnText?: string;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
};

type ToastContextType = {
  showToast: (
    message: string,
    type: ToastType,
    link?: string,
    btnText?: string,
    duration?: number,
    position?: ToastData['position']
  ) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastData | null>(null);

  // Show toast
  const showToast = useCallback(
    (
      message: string,
      type: ToastType,
      link?: string,
      btnText?: string,
      duration?: number,
      position?: ToastData['position']
    ) => {
      setToast({ message, type, link, btnText, duration, position });
    },
    []
  );

  // Hide toast
  const hideToast = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          link={toast.link}
          btnText={toast.btnText}
          duration={toast.duration}
          position={toast.position}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
};

// Custom hook
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
