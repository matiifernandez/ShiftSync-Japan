import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  message: string | null;
  type: ToastType;
  isVisible: boolean;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<ToastType>("info");
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string, toastType: ToastType = "info") => {
    if (timer) clearTimeout(timer);
    
    setMessage(msg);
    setType(toastType);
    setIsVisible(true);

    const newTimer = setTimeout(() => {
      setIsVisible(false);
      // clear message after animation (approx)
      setTimeout(() => setMessage(null), 300);
    }, 3000);

    setTimer(newTimer);
  }, [timer]);

  const hideToast = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, message, type, isVisible }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
