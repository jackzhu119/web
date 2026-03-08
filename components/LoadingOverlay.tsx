
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Brain, Database, ScanLine, CheckCircle2, Stethoscope, HeartPulse, FileText, Search, Zap, Dna, Microscope, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { t } from '../translations';

interface LoadingOverlayProps {
  message?: string;
  type: 'DRUG' | 'DIAGNOSIS';
  lang: Language;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, type, lang }) => {
  const [phase, setPhase] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const T = t[lang];

  // Configuration for Drug Search Mode
  const drugPhases = lang === 'zh' ? [
    { text: "启动视觉神经...", icon: ScanLine },
    { text: "解析药品特征...", icon: Microscope },
    { text: "检索全球药典...", icon: Database },
    { text: "生成用药指引...", icon: FileText },
    { text: "即将完成...", icon: CheckCircle2 },
  ] : [
    { text: "Initializing Vision...", icon: ScanLine },
    { text: "Analyzing Features...", icon: Microscope },
    { text: "Searching Database...", icon: Database },
    { text: "Generating Guide...", icon: FileText },
    { text: "Finalizing...", icon: CheckCircle2 },
  ];

  // Configuration for Diagnosis Mode
  const diagnosisPhases = lang === 'zh' ? [
    { text: "连接 AI 医疗大脑...", icon: Brain },
    { text: "分析症状描述...", icon: Stethoscope },
    { text: "匹配病理模型...", icon: Dna },
    { text: "生成诊断建议...", icon: HeartPulse },
    { text: "整理康复方案...", icon: CheckCircle2 },
  ] : [
    { text: "Connecting AI Brain...", icon: Brain },
    { text: "Analyzing Symptoms...", icon: Stethoscope },
    { text: "Matching Pathology...", icon: Dna },
    { text: "Generating Advice...", icon: HeartPulse },
    { text: "Creating Plan...", icon: CheckCircle2 },
  ];

  const currentPhases = type === 'DIAGNOSIS' ? diagnosisPhases : drugPhases;
  
  // Theme colors based on mode
  const theme = type === 'DIAGNOSIS' 
    ? {
        accent: "text-rose-400",
        bgGradient: "from-indigo-900/40 via-purple-900/40 to-slate-900/80",
        ringColor: "border-rose-500/30",
        ringGlow: "shadow-[0_0_30px_rgba(244,63,94,0.3)]",
        progressBar: "bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500",
        particle: "bg-rose-400"
      }
    : {
        accent: "text-cyan-400",
        bgGradient: "from-slate-900/40 via-blue-900/40 to-cyan-900/80",
        ringColor: "border-cyan-500/30",
        ringGlow: "shadow-[0_0_30px_rgba(34,211,238,0.3)]",
        progressBar: "bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500",
        particle: "bg-cyan-400"
      };

  // Phase Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p < currentPhases.length - 1 ? p + 1 : p));
    }, 1200); 
    return () => clearInterval(interval);
  }, [currentPhases.length]);

  // Tips Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % T.loading_tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [T.loading_tips.length]);

  const ActiveIcon = currentPhases[phase].icon;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md text-white overflow-hidden font-sans select-none`}
    >
      {/* --- Ambient Background --- */}
      <div className="absolute inset-0 z-0">
        {/* Animated Gradient */}
        <div className={`absolute inset-0 bg-gradient-radial ${theme.bgGradient} opacity-60`}></div>
        
        {/* Moving Grid */}
        <div className="absolute inset-0 opacity-[0.05]" 
             style={{ 
               backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
               backgroundSize: '40px 40px',
               maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
             }}>
        </div>

        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${theme.particle} opacity-40`}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight 
            }}
            animate={{ 
              y: [null, Math.random() * window.innerHeight],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 10 + Math.random() * 10, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
        ))}
      </div>

      {/* --- Main Content --- */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        
        {/* Central Visualization */}
        <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
           {/* Outer Rotating Ring */}
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
             className={`absolute inset-0 rounded-full border-[1px] ${theme.ringColor} border-t-transparent border-l-transparent`}
           />
           {/* Inner Counter-Rotating Ring */}
           <motion.div 
             animate={{ rotate: -360 }}
             transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
             className={`absolute inset-4 rounded-full border-[2px] ${theme.ringColor} border-b-transparent border-r-transparent opacity-70`}
           />
           
           {/* Pulsing Glow Background */}
           <motion.div 
             animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.1, 0.2, 0.1] }}
             transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             className={`absolute inset-0 rounded-full ${theme.bgGradient} blur-2xl`}
           />

           {/* Central Icon Container */}
           <div className={`relative w-24 h-24 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 flex items-center justify-center ${theme.ringGlow}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase}
                  initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotateY: -90 }}
                  transition={{ duration: 0.4 }}
                >
                  <ActiveIcon size={40} className={`text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]`} />
                </motion.div>
              </AnimatePresence>
              
              {/* Scanning Line Effect */}
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className={`absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-50`}
              />
           </div>
        </div>

        {/* Text Status */}
        <div className="text-center space-y-6 w-full">
           <div className="h-8 relative overflow-hidden">
             <AnimatePresence mode="wait">
               <motion.h2 
                 key={message || currentPhases[phase].text}
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -20, opacity: 0 }}
                 className="text-2xl font-medium tracking-wide text-white absolute inset-0 flex items-center justify-center"
               >
                 {message || currentPhases[phase].text}
               </motion.h2>
             </AnimatePresence>
           </div>

           {/* Progress Bar */}
           <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden relative">
              {/* Shimmer Effect */}
              <motion.div 
                 className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2 z-20"
                 animate={{ x: ['-100%', '200%'] }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className={`h-full ${theme.progressBar} shadow-[0_0_10px_currentColor]`}
                initial={{ width: "5%" }}
                animate={{ width: `${Math.min(((phase + 1) / currentPhases.length) * 100, 95)}%` }}
                transition={{ duration: 0.5 }}
              />
           </div>

           {/* Health Tips Carousel */}
           <div className="mt-8 pt-6 border-t border-white/5 relative min-h-[60px]">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
                {lang === 'zh' ? 'AI 知识库' : 'DID YOU KNOW'}
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-sm text-slate-300 font-light leading-relaxed px-4"
                >
                  {T.loading_tips[tipIndex]}
                </motion.p>
              </AnimatePresence>
           </div>
        </div>

      </div>
    </motion.div>
  );
};
