import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-5xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-corporate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className={`relative w-full ${widthClasses[maxWidth]} bg-white border border-corporate-300 rounded shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-corporate-50 border-b border-corporate-200">
          <div>
            <h3 className="text-base font-semibold text-corporate-900">{title}</h3>
            {subtitle && <p className="text-xs text-corporate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-corporate-400 hover:text-corporate-700 p-1 rounded hover:bg-corporate-200/60 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
