import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const CONFIGS = {
  error: {
    icon: <XCircle size={20} />,
    bar: 'bg-red-500',
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    icon_color: 'text-red-500',
  },
  success: {
    icon: <CheckCircle2 size={20} />,
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    icon_color: 'text-emerald-500',
  },
  warning: {
    icon: <AlertTriangle size={20} />,
    bar: 'bg-amber-500',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    icon_color: 'text-amber-500',
  },
  info: {
    icon: <Info size={20} />,
    bar: 'bg-blue-500',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon_color: 'text-blue-500',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const cfg = CONFIGS[toast.type];
  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3 pr-10 rounded-xl border shadow-lg max-w-sm w-full overflow-hidden animate-in slide-in-from-right-5 fade-in duration-300 ${cfg.bg}`}
    >
      <div className={`mt-0.5 shrink-0 ${cfg.icon_color}`}>{cfg.icon}</div>
      <p className={`text-sm font-medium leading-snug ${cfg.text}`}>{toast.message}</p>
      <button
        onClick={onRemove}
        className={`absolute top-2.5 right-2.5 ${cfg.icon_color} opacity-60 hover:opacity-100 transition-opacity`}
      >
        <X size={16} />
      </button>
      <div className={`absolute bottom-0 left-0 h-1 ${cfg.bar} animate-[shrink_4s_linear_forwards]`} />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}
