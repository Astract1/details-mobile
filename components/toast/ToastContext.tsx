import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, ToastType } from './Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    visible: boolean;
    duration: number;
  }>({
    message: '',
    type: 'info',
    visible: false,
    duration: 3000,
  });

  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    setToast({ message, type, visible: true, duration });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const contextValue: ToastContextType = {
    showToast,
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
        duration={toast.duration}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
