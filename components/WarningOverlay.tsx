import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ShieldAlert, AlertCircle, Info } from 'lucide-react';
import { Language } from '../types';

export type WarningLevel = 'RED' | 'ORANGE' | 'BLUE' | null;

interface WarningOverlayProps {
  level: WarningLevel;
  title: string;
  message: string;
  onClose: () => void;
  lang: Language;
}

export const WarningOverlay: React.FC<WarningOverlayProps> = ({ level, title, message, onClose, lang }) => {
  const [audioPlayed, setAudioPlayed] = useState(false);

  useEffect(() => {
    if (level === 'RED' && !audioPlayed) {
      // Play urgent alarm sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Placeholder alarm
      audio.play().catch(() => {});
      
      // Speak the warning
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
      
      setAudioPlayed(true);
    } else if (level === 'ORANGE' && !audioPlayed) {
       const utterance = new SpeechSynthesisUtterance(message);
       utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
       window.speechSynthesis.speak(utterance);
       setAudioPlayed(true);
    }
  }, [level, message, lang, audioPlayed]);

  if (!level) return null;

  const getStyles = () => {
    switch (level) {
      case 'RED':
        return {
          bg: 'bg-red-600',
          icon: <ShieldAlert size={80} className="text-white animate-pulse" />,
          textColor: 'text-white',
          borderColor: 'border-red-500'
        };
      case 'ORANGE':
        return {
          bg: 'bg-orange-500',
          icon: <AlertTriangle size={60} className="text-white" />,
          textColor: 'text-white',
          borderColor: 'border-orange-400'
        };
      case 'BLUE':
        return {
          bg: 'bg-blue-500',
          icon: <Info size={50} className="text-white" />,
          textColor: 'text-white',
          borderColor: 'border-blue-400'
        };
      default:
        return { bg: 'bg-white', icon: null, textColor: 'text-black', borderColor: 'border-gray-200' };
    }
  };

  const styles = getStyles();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          className={`${styles.bg} w-full max-w-md rounded-3xl p-8 shadow-2xl border-4 ${styles.borderColor} relative overflow-hidden text-center`}
        >
          {/* Background Animation for Red Alert */}
          {level === 'RED' && (
             <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(0,0,0,0.1)_20px,rgba(0,0,0,0.1)_40px)] animate-pulse pointer-events-none"></div>
          )}

          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="bg-white/20 p-6 rounded-full shadow-lg">
              {styles.icon}
            </div>
            
            <div className={styles.textColor}>
              <h2 className="text-3xl font-bold mb-2">{title}</h2>
              <p className="text-lg font-medium opacity-90 leading-relaxed">{message}</p>
            </div>

            <button
              onClick={onClose}
              className="mt-4 bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              {lang === 'zh' ? '我知道了' : 'I Understand'}
              <X size={20} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
