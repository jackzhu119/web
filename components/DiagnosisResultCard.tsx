
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiagnosisInfo, Language } from '../types';
import { t } from '../translations';
import { 
  ArrowLeft, Volume2, StopCircle, Stethoscope, 
  Activity, Thermometer, ShieldAlert, Utensils, HeartPulse, Sparkles, AlertCircle, Dna, Copy, Check, Type, ArrowRight, MousePointerClick, ChevronRight, Pill, Home
} from 'lucide-react';
import { FollowUpChat } from './FollowUpChat';

interface DiagnosisResultCardProps {
  info: DiagnosisInfo;
  onBack: () => void;
  lang: Language;
  onItemClick: (query: string) => void;
}

// Optimization: Use React.memo to prevent re-renders
export const DiagnosisResultCard: React.FC<DiagnosisResultCardProps> = React.memo(({ info, onBack, lang, onItemClick }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [fontScale, setFontScale] = useState(0); 
  const T = t[lang];

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlayAudio = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(info.summary);
    utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    const text = `
🩺 ${T.diagnosis_report}
⚠️ ${info.urgency}
---
📝 ${info.summary}
👉 ${info.potential_conditions.map(c => `${c.name} (${c.probability})`).join(', ')}
💊 ${T.rec_meds}: ${info.potential_conditions[0].medications.join(', ')}
🥗 ${T.lifestyle}: ${info.lifestyle_advice}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFontScale = () => {
    setFontScale(prev => (prev + 1) % 3);
  };

  // Theme based on urgency
  const getTheme = () => {
    switch (info.urgency) {
      case 'High':
        return {
          bg: 'from-rose-500 to-red-600',
          shadow: 'shadow-red-500/30'
        };
      case 'Medium':
        return {
          bg: 'from-amber-400 to-orange-500',
          shadow: 'shadow-orange-500/30'
        };
      default: // Low
        return {
          bg: 'from-emerald-400 to-teal-500',
          shadow: 'shadow-emerald-500/30'
        };
    }
  };

  const theme = getTheme();
  const selectedCondition = info.potential_conditions[selectedIndex];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const chatContext = JSON.stringify(info);
  const contentStyle = { fontSize: fontScale === 0 ? '100%' : fontScale === 1 ? '115%' : '130%' };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-slate-50">
      
      {/* Decorative Side Elements */}
      <div className="hidden xl:block absolute top-1/2 left-10 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none">
         <Stethoscope size={400} className="text-indigo-800" />
      </div>

      {/* Sticky Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-2 overflow-hidden text-sm">
          <button onClick={onBack} className="text-slate-500 hover:text-blue-600 flex items-center gap-1">
             <Home size={14} /> {T.home}
           </button>
           <ChevronRight size={14} className="text-slate-300" />
          <span className="font-semibold text-slate-800 flex items-center gap-2">
            <Stethoscope size={18} className="text-blue-500"/>
            {T.diagnosis_report}
          </span>
        </div>

        <div className="flex items-center gap-2">
           <button onClick={toggleFontScale} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-all flex items-center justify-center relative">
             <Type size={20} />
             {fontScale > 0 && (
               <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                 {fontScale === 1 ? '+' : '++'}
               </span>
             )}
          </button>
           <button onClick={handleCopy} className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-all flex items-center gap-1 active:scale-95">
             {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
           <button 
            onClick={onBack}
            className="ml-2 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-sm active:scale-95 border border-slate-200"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div 
        className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar space-y-6 max-w-5xl mx-auto w-full relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div style={contentStyle} className="transition-all duration-300">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Column (Diagnosis) */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Urgency & Summary Card */}
              <motion.div variants={itemVariants} className={`bg-gradient-to-br ${theme.bg} rounded-[2rem] p-6 text-white shadow-xl ${theme.shadow} relative overflow-hidden group`}>
                <div className="absolute -right-10 -top-10 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                  <Activity size={180} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[0.8em] font-bold uppercase tracking-wider border border-white/20 shadow-sm">
                      {info.urgency === 'High' ? T.urgency_high : info.urgency === 'Medium' ? T.urgency_med : T.urgency_low}
                    </span>
                    <button 
                      onClick={handlePlayAudio}
                      className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-800 px-4 py-1.5 rounded-full font-bold text-[0.8em] shadow-lg transition-all active:scale-95"
                    >
                      {isPlaying ? <StopCircle size={16} /> : <Volume2 size={16} />}
                      <span>{T.play}</span>
                    </button>
                  </div>
                  
                  <h1 className="text-[1.8em] font-bold mb-3 flex items-center gap-3">
                    <Sparkles size={28} className="text-yellow-300"/>
                    {T.preliminary_analysis}
                  </h1>
                  <p className="text-white/95 leading-relaxed text-[1em] font-medium max-w-2xl">
                    {info.summary}
                  </p>
                </div>
              </motion.div>

              {/* --- Interactive Conditions --- */}
              <motion.div variants={itemVariants} className="space-y-4">
                
                {/* Condition Selector Pills */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                  {info.potential_conditions.map((condition, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={`relative flex-shrink-0 px-6 py-3 rounded-2xl transition-all outline-none border ${
                        selectedIndex === index 
                          ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-300 transform scale-[1.02]' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-bold text-[0.95em]">{condition.name}</span>
                        <span className={`text-[0.7em] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide ${
                            selectedIndex === index ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {condition.probability}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Main Condition Content */}
                <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
                  <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedIndex}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                      >
                        {/* Pathology Description */}
                        <div>
                           <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                                <AlertCircle size={20} />
                              </div>
                              <h4 className="font-bold text-slate-800 text-[1.1em]">{T.pathology}</h4>
                           </div>
                           <p className="text-slate-600 text-[1em] leading-relaxed pl-2 border-l-4 border-blue-100">
                              {selectedCondition.explanation}
                           </p>
                        </div>

                        {/* Action Grid - Medications & Treatments */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Medications Section */}
                          <div className="bg-purple-50/50 rounded-3xl p-5 border border-purple-100">
                            <div className="flex items-center gap-3 mb-4">
                               <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                                  <Pill size={20} />
                               </div>
                               <h4 className="font-bold text-slate-800 text-[1.1em]">{T.rec_meds}</h4>
                            </div>
                            
                            {selectedCondition.medications.length > 0 ? (
                              <div className="space-y-3">
                                {selectedCondition.medications.map((med, idx) => (
                                  <motion.button 
                                    key={idx} 
                                    whileHover={{ scale: 1.02, x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onItemClick(med)}
                                    className="w-full text-left bg-white p-4 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group relative overflow-hidden"
                                  >
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <span className="font-bold text-slate-700 group-hover:text-purple-700 transition-colors text-[0.95em]">{med}</span>
                                        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                           <ChevronRight size={16} />
                                        </div>
                                    </div>
                                    <p className="text-[0.7em] text-slate-400 mt-1 flex items-center gap-1">
                                      <MousePointerClick size={10} /> Tap for details
                                    </p>
                                  </motion.button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-400 italic text-sm">{T.no_meds}</p>
                            )}
                          </div>

                          {/* Treatments Section */}
                          <div className="bg-emerald-50/50 rounded-3xl p-5 border border-emerald-100">
                             <div className="flex items-center gap-3 mb-4">
                               <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                  <HeartPulse size={20} />
                               </div>
                               <h4 className="font-bold text-slate-800 text-[1.1em]">{T.adj_treatment}</h4>
                            </div>

                            {selectedCondition.treatments.length > 0 ? (
                              <div className="space-y-3">
                                {selectedCondition.treatments.map((t, idx) => (
                                  <motion.button 
                                    key={idx} 
                                    whileHover={{ scale: 1.02, x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onItemClick(t)}
                                    className="w-full text-left bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group relative overflow-hidden"
                                  >
                                     <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <span className="font-bold text-slate-700 group-hover:text-emerald-700 transition-colors text-[0.95em]">{t}</span>
                                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                           <ChevronRight size={16} />
                                        </div>
                                    </div>
                                    <p className="text-[0.7em] text-slate-400 mt-1 flex items-center gap-1">
                                      <MousePointerClick size={10} /> Tap for details
                                    </p>
                                  </motion.button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-400 italic text-sm">{T.no_treatments}</p>
                            )}
                          </div>
                        </div>

                      </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Generic Lifestyle Advice */}
              <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[2rem] p-6 border border-blue-100 flex gap-4 items-start">
                <div className="p-3 bg-white rounded-full shadow-sm text-indigo-600 shrink-0">
                   <Utensils size={24} />
                </div>
                <div>
                    <h3 className="text-indigo-900 font-bold mb-2 text-[1.1em]">{T.lifestyle}</h3>
                    <p className="text-slate-700 text-[1em] leading-relaxed">
                    {info.lifestyle_advice}
                    </p>
                </div>
              </motion.div>

              {/* Disclaimer Footer */}
              <motion.div variants={itemVariants} className="flex gap-3 bg-slate-100 rounded-2xl p-5 text-[0.8em] text-slate-500 items-start">
                <ShieldAlert size={20} className="shrink-0 mt-0.5 text-slate-400" />
                <p>
                  <strong>{T.disclaimer_title}</strong> {T.disclaimer_text}
                </p>
              </motion.div>
           </div>

           {/* Right Column: AI Chat */}
           <motion.div variants={itemVariants} className="lg:col-span-1 h-full min-h-[400px]">
              <div className="sticky top-24">
                 <FollowUpChat 
                    contextText={chatContext} 
                    lang={lang}
                    suggestions={[T.suggested_q1_diag, T.suggested_q2_diag]}
                  />
              </div>
           </motion.div>

         </div>
         <div className="text-center text-[10px] text-slate-400 py-6 border-t border-slate-100 mt-8">
            <p>{T.source_attribution}</p>
         </div>
        </div>
      </motion.div>
    </div>
  );
});
