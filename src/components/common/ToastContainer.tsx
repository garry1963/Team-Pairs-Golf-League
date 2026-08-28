import React from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-8 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />;
            case 'error':
              return <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
            default:
              return <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />;
          }
        };

        const getBorderColor = () => {
          switch (toast.type) {
            case 'success': return 'border-green-200 bg-white text-slate-900 shadow-lg';
            case 'error': return 'border-red-200 bg-white text-slate-900 shadow-lg';
            case 'warning': return 'border-amber-200 bg-white text-slate-900 shadow-lg';
            default: return 'border-blue-200 bg-white text-slate-900 shadow-lg';
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border flex items-start gap-3 text-xs transition-all transform animate-in slide-in-from-right-8 duration-200 ${getBorderColor()}`}
          >
            {getIcon()}
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-xs">{toast.title}</h4>
              <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white max-w-md w-full rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
          <AlertTriangle className={`w-5 h-5 ${isDangerous ? 'text-red-500' : 'text-amber-500'}`} />
          <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
        </div>
        <div className="p-5 text-slate-600 text-xs leading-relaxed space-y-2">
          <p>{message}</p>
        </div>
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

