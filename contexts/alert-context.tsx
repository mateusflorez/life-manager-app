import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export type ToastConfig = {
  message: string;
  type?: AlertType;
  duration?: number;
};

export type ConfirmButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
};

export type ConfirmConfig = {
  title: string;
  message?: string;
  buttons: ConfirmButton[];
};

type AlertContextType = {
  // Toast
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
  toastVisible: boolean;
  toastConfig: ToastConfig | null;

  // Confirm dialog
  showConfirm: (config: ConfirmConfig) => void;
  hideConfirm: () => void;
  confirmVisible: boolean;
  confirmConfig: ConfirmConfig | null;
};

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);
  const [toastTimeout, setToastTimeout] = useState<NodeJS.Timeout | null>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

  const showToast = useCallback((config: ToastConfig) => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    setToastConfig({
      ...config,
      type: config.type ?? 'info',
      duration: config.duration ?? 3000,
    });
    setToastVisible(true);

    const timeout = setTimeout(() => {
      setToastVisible(false);
    }, config.duration ?? 3000);

    setToastTimeout(timeout);
  }, [toastTimeout]);

  const hideToast = useCallback(() => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    setToastVisible(false);
  }, [toastTimeout]);

  const showConfirm = useCallback((config: ConfirmConfig) => {
    setConfirmConfig(config);
    setConfirmVisible(true);
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmVisible(false);
  }, []);

  return (
    <AlertContext.Provider
      value={{
        showToast,
        hideToast,
        toastVisible,
        toastConfig,
        showConfirm,
        hideConfirm,
        confirmVisible,
        confirmConfig,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
