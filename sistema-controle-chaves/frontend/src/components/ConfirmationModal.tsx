import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export type ConfirmationType = 'danger' | 'success' | 'warning';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const icons = {
    danger: <AlertTriangle size={48} className="text-red-500" />,
    success: <CheckCircle2 size={48} className="text-emerald-500" />,
    warning: <AlertTriangle size={48} className="text-amber-500" />
  };

  const buttonStyles = {
    danger: 'bg-red-600 hover:bg-red-700 shadow-red-200',
    success: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
    warning: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            {icons[type]}
          </div>
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 font-bold hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm}
            className={`px-6 py-2.5 text-white font-bold rounded-lg transition-colors shadow-md active:scale-[0.98] text-sm ${buttonStyles[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
