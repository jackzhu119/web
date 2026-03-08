import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 min-w-[320px] max-w-md"
          style={{
            background: type === 'error' ? 'linear-gradient(to right, rgba(220, 38, 38, 0.9), rgba(185, 28, 28, 0.9))' : 
                        type === 'success' ? 'linear-gradient(to right, rgba(22, 163, 74, 0.9), rgba(21, 128, 61, 0.9))' : 
                        'linear-gradient(to right, rgba(37, 99, 235, 0.9), rgba(29, 78, 216, 0.9))',
            color: 'white'
          }}
        >
          <div className="bg-white/20 p-1.5 rounded-full shrink-0">
            {type === 'error' && <AlertCircle size={18} className="text-white" />}
            {type === 'success' && <CheckCircle2 size={18} className="text-white" />}
            {type === 'info' && <Info size={18} className="text-white" />}
          </div>
          
          <span className="flex-1 text-sm font-medium tracking-wide drop-shadow-sm">{message}</span>
          
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};