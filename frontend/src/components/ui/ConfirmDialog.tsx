import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="text-rose-600" size={24} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={24} />;
      case 'success':
        return <CheckCircle2 className="text-emerald-500" size={24} />;
      case 'info':
      default:
        return <Info className="text-indigo-500" size={24} />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger': return 'bg-rose-100 dark:bg-rose-500/20';
      case 'warning': return 'bg-amber-100 dark:bg-amber-500/20';
      case 'success': return 'bg-emerald-100 dark:bg-emerald-500/20';
      case 'info':
      default: return 'bg-indigo-100 dark:bg-indigo-500/20';
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'danger': return 'danger';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info':
      default: return 'primary';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="sm">
      <div className="flex flex-col items-center text-center -mt-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${getIconBg()}`}>
          {getIcon()}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {message}
        </p>
        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getButtonVariant()}
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
