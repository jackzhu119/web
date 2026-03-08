
import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Camera, Sparkles, Stethoscope, Pill, ArrowRight, Activity, ScanLine, ImagePlus, X, Globe, Mail, Mic, MicOff, Binary, Aperture, Zap, Clock, MapPin, User, BookOpen, Trash2, Plus } from 'lucide-react';
import { AppMode, DrugInfo, DiagnosisInfo, LoadingState, Language, SpeechRecognition, Article, Reminder, UserProfile } from './types';
import { t } from './translations';
import { getDrugInfoFromImage, getDrugInfoFromText, analyzeSymptoms } from './services/qwenService';
import { ResultCard } from './components/ResultCard';
import { DiagnosisResultCard } from './components/DiagnosisResultCard';
import { LoadingOverlay } from './components/LoadingOverlay';
import { Toast, ToastType } from './components/Toast';
import { RemindersView, PharmacyMap, HealthProfile } from './components/FeatureViews';
import { WarningOverlay, WarningLevel } from './components/WarningOverlay';

type Tab = 'DRUG' | 'DIAGNOSIS';

// --- OPTIMIZATION: Static Background Component (Never Re-renders) ---
const CyberBackground = memo(() => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#f8fafc] transform-gpu">
    {/* CSS-based Texture (Lighter than SVG filters) */}
    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>
    
    {/* Grid - CSS rendered */}
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

    {/* GPU Accelerated Orbs */}
    <motion.div 
      initial={{ x: 0, y: 0 }}
      animate={{ x: [0, 50, -50, 0], y: [0, -30, 30, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-blue-200/40 to-cyan-200/40 rounded-full blur-[120px] will-change-transform"
    />
    <motion.div 
      initial={{ x: 0, y: 0 }}
      animate={{ x: [0, -40, 40, 0], y: [0, 60, -60, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-indigo-200/40 to-purple-200/40 rounded-full blur-[100px] will-change-transform"
    />
  </div>
), () => true);

// --- OPTIMIZATION: Memoized Header ---
const Header = memo(({ lang, toggleLanguage }: { lang: Language, toggleLanguage: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="fixed top-0 left-0 right-0 z-40 p-4 md:p-6 flex justify-between items-center pointer-events-none"
  >
     <div className="pointer-events-auto flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
           <Activity size={18} />
        </div>
        <span className="font-bold text-slate-700 tracking-tight hidden sm:block">SmartMed</span>
     </div>
    <button 
      onClick={toggleLanguage}
      className="pointer-events-auto bg-white/60 backdrop-blur-xl border border-white/60 shadow-sm rounded-full px-4 py-2 flex items-center gap-2 hover:bg-white transition-all text-slate-600 font-medium text-xs md:text-sm group active:scale-95"
    >
      <Globe size={14} className="group-hover:rotate-180 transition-transform duration-500" />
      <span>{lang === 'zh' ? 'EN' : '中文'}</span>
    </button>
  </motion.div>
));

const FeatureModal = ({ 
  isOpen, onClose, title, children 
}: { 
  isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode 
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
          onClick={onClose} 
        />
        <motion.div 
          initial={{ y: "100%", opacity: 0.5 }} 
          animate={{ y: 0, opacity: 1 }} 
          exit={{ y: "100%", opacity: 0 }} 
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-white rounded-t-[2rem] md:rounded-3xl shadow-2xl relative z-10 w-full md:max-w-md h-[85vh] md:h-[600px] flex flex-col overflow-hidden"
        >
           {/* Handle for mobile drag */}
           <div className="w-full flex justify-center pt-3 pb-1 md:hidden" onClick={onClose}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
           </div>

           <div className="flex-1 p-6 overflow-hidden relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-20"
              >
                <X size={20} className="text-slate-500" />
              </button>
              {children}
           </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

function App() {
  const [lang, setLang] = useState<Language>('zh');
  const [activeTab, setActiveTab] = useState<Tab>('DRUG');
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  
  // Data States
  const [drugInfo, setDrugInfo] = useState<DrugInfo | null>(null);
  const [diagnosisInfo, setDiagnosisInfo] = useState<DiagnosisInfo | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '' });
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  // Feature States
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '', age: '', gender: 'male', allergies: '', conditions: ''
  });

  // Inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [symptomsQuery, setSymptomsQuery] = useState('');
  const [diagnosisImage, setDiagnosisImage] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // New Feature States (Modals)
  const [activeFeature, setActiveFeature] = useState<'reminders' | 'map' | 'profile' | 'articles' | null>(null);
  
  // Warning System State
  const [warningLevel, setWarningLevel] = useState<WarningLevel>(null);
  const [warningTitle, setWarningTitle] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  // Scanning Simulation State
  const [isScanning, setIsScanning] = useState(false);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Refs
  const drugFileInputRef = useRef<HTMLInputElement>(null);
  const diagnosisFileInputRef = useRef<HTMLInputElement>(null);

  const T = t[lang];

  // --- Effects ---

  // Auto detect language & Load Data
  useEffect(() => {
    const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
    setLang(browserLang);
    
    // Load local storage
    const savedHistory = localStorage.getItem('drug_search_history');
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));

    const savedReminders = localStorage.getItem('smartmed_reminders');
    if (savedReminders) setReminders(JSON.parse(savedReminders));

    const savedProfile = localStorage.getItem('smartmed_profile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
  }, []);

  // Persist Data
  useEffect(() => {
    localStorage.setItem('smartmed_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const saveProfile = useCallback(() => {
    localStorage.setItem('smartmed_profile', JSON.stringify(userProfile));
    showToast(T.profile_saved, 'success');
  }, [userProfile, T.profile_saved]);

  // Reminder Checker (Runs every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      reminders.forEach(r => {
        if (r.enabled && r.time === currentTime && now.getSeconds() < 2) {
           // Simple alert for demo, real app would use Push API
           showToast(`${T.time_to_take} ${r.medication}`, 'info');
           try {
             const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
             audio.play().catch(() => {});
           } catch(e){}
        }
      });
    }, 1000); // Check every second to catch the minute change accurately

    return () => clearInterval(interval);
  }, [reminders, T.time_to_take]);

  // Clear inputs when switching tabs
  useEffect(() => {
    setSearchQuery('');
    setSymptomsQuery('');
    setDiagnosisImage(null);
    setShowHistory(false);
  }, [activeTab]);

  // --- Handlers ---

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  }, []);

  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  const toggleLanguage = useCallback(() => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  }, []);

  const addToHistory = (query: string) => {
    if (!query) return;
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(i => i !== query)].slice(0, 5);
      localStorage.setItem('drug_search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory([]);
    localStorage.removeItem('drug_search_history');
  };

  // Voice Recognition Logic
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        showToast(T.voice_error, 'error');
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
        recognition.continuous = false; 
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const lastResultIndex = event.results.length - 1;
          const transcript = event.results[lastResultIndex][0].transcript;
          
          if (event.results[lastResultIndex].isFinal) {
             setSymptomsQuery((prev) => {
               const needsSpace = prev.length > 0 && !prev.endsWith(' ');
               return prev + (needsSpace ? ' ' : '') + transcript;
             });
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (event.error !== 'no-speech') {
             showToast(T.voice_error, 'error');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        console.error("Voice start error", e);
        showToast(T.voice_error, 'error');
      }
    }
  }, [isListening, lang, T.voice_error, showToast]);

  // --- Warning System Logic ---
  const checkInteractions = useCallback((info: DrugInfo) => {
    let level: WarningLevel = null;
    let title = '';
    let msg = '';

    // 1. Allergy Check (Red)
    if (userProfile.allergies) {
      const allergies = userProfile.allergies.split(/[,，\s]+/).filter(Boolean);
      const isAllergic = allergies.some(allergy => 
        info.name.includes(allergy) || 
        info.contraindications.includes(allergy) ||
        info.summary.includes(allergy)
      );

      if (isAllergic) {
        level = 'RED';
        title = lang === 'zh' ? '严重过敏预警' : 'Severe Allergy Alert';
        msg = lang === 'zh' 
          ? `检测到该药品可能含有您过敏的成分（${userProfile.allergies}），请严禁服用！`
          : `This medication may contain ingredients you are allergic to (${userProfile.allergies}). Do NOT take it!`;
        setWarningLevel(level);
        setWarningTitle(title);
        setWarningMessage(msg);
        return true; // Stop flow
      }
    }

    // 2. Interaction Check (Orange)
    // Simple keyword matching against existing reminders
    const existingMeds = reminders.map(r => r.medication);
    if (existingMeds.length > 0 && info.common_interactions) {
       const interaction = info.common_interactions.find(interaction => 
          existingMeds.some(med => interaction.includes(med))
       );
       
       if (interaction) {
          level = 'ORANGE';
          title = lang === 'zh' ? '药物相互作用风险' : 'Drug Interaction Risk';
          msg = lang === 'zh'
            ? `此药可能与您正在服用的药物（${existingMeds.join(', ')}）产生相互作用。建议咨询医生。`
            : `This drug may interact with your current medications (${existingMeds.join(', ')}). Consult a doctor.`;
          setWarningLevel(level);
          setWarningTitle(title);
          setWarningMessage(msg);
          return true; // Stop flow (or just warn)
       }
    }

    // 3. High Risk Check (Orange/Red depending on severity, let's say Orange for general high risk without specific allergy)
    if (info.isHighRisk && !level) {
       level = 'ORANGE';
       title = lang === 'zh' ? '高危药品提醒' : 'High Risk Medication';
       msg = info.riskReason || (lang === 'zh' ? '此药品属于高危药品，请严格遵医嘱服用。' : 'This is a high-risk medication. Follow instructions strictly.');
       setWarningLevel(level);
       setWarningTitle(title);
       setWarningMessage(msg);
       return true;
    }

    return false;
  }, [userProfile, reminders, lang]);

  // --- Helper: Image Compression ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleScan = () => {
    // Simulate camera scanning process
    setIsScanning(true);
    
    // 1. Simulate "Focusing"
    setTimeout(() => {
       // 2. Simulate "Success"
       try {
         const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Ding sound
         audio.play().catch(() => {});
       } catch(e) {}
       
       setTimeout(() => {
          setIsScanning(false);
          drugFileInputRef.current?.click();
       }, 400);
    }, 800);
  };

  const handleDrugSearch = useCallback(async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const query = typeof e === 'string' ? e : searchQuery;

    if (!query.trim()) return;
    
    addToHistory(query);
    setShowHistory(false);

    setLoading({ isLoading: true, message: T.loading_drug });
    setTimeout(async () => {
        try {
            const info = await getDrugInfoFromText(query, lang);
            
            // Run Safety Checks
            const hasWarning = checkInteractions(info);
            
            setDrugInfo(info);
            setMode(AppMode.RESULT);
        } catch (error: any) {
            showToast(error.message || "Search failed", 'error');
        } finally {
            setLoading({ isLoading: false, message: '' });
        }
    }, 10);
  }, [searchQuery, lang, T.loading_drug, showToast]);

  const handleDrugFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading({ isLoading: true, message: T.loading_vision });
    
    try {
        // Compress image before sending
        const base64String = await compressImage(file);
        
        const info = await getDrugInfoFromImage(base64String, lang);
        
        // Run Safety Checks
        const hasWarning = checkInteractions(info);

        setDrugInfo(info);
        setMode(AppMode.RESULT);
    } catch (error: any) {
        showToast(`${T.upload_fail}: ` + (error.message || "Error"), 'error');
    } finally {
        setLoading({ isLoading: false, message: '' });
        if (drugFileInputRef.current) drugFileInputRef.current.value = '';
    }
  }, [lang, T.loading_vision, T.upload_fail, showToast]);

  const handleDiagnosisFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const compressedBase64 = await compressImage(file);
        setDiagnosisImage(compressedBase64);
        if (diagnosisFileInputRef.current) diagnosisFileInputRef.current.value = '';
        showToast(T.image_attached, 'success');
    } catch (error) {
        showToast("Image processing failed", 'error');
    }
  }, [showToast, T.image_attached]);

  const handleSymptomAnalysis = useCallback(async () => {
    if (!symptomsQuery.trim() && !diagnosisImage) {
        showToast(T.missing_input, 'error');
        return;
    }

    setLoading({ isLoading: true, message: T.loading_diagnosis });
    setTimeout(async () => {
        try {
          const info = await analyzeSymptoms(symptomsQuery, diagnosisImage || undefined, lang);
          setDiagnosisInfo(info);
          setMode(AppMode.DIAGNOSIS_RESULT);
        } catch (error: any) {
           showToast(`${T.diagnosis_fail}: ` + (error.message || "Error"), 'error');
        } finally {
          setLoading({ isLoading: false, message: '' });
        }
    }, 50);
  }, [symptomsQuery, diagnosisImage, lang, T.missing_input, T.loading_diagnosis, T.diagnosis_fail, showToast]);

  const handleDiagnosisItemClick = useCallback(async (itemQuery: string) => {
    setLoading({ 
        isLoading: true, 
        message: lang === 'zh' ? `正在查询 "${itemQuery}" 详情...` : `Researching "${itemQuery}"...` 
    });

    setTimeout(async () => {
        try {
           const info = await getDrugInfoFromText(itemQuery, lang);
           setDrugInfo(info);
           setMode(AppMode.RESULT); 
        } catch (error: any) {
           showToast(lang === 'zh' ? "查询详情失败" : "Failed to fetch details", 'error');
        } finally {
           setLoading({ isLoading: false, message: '' });
        }
    }, 80);
  }, [lang, showToast]);

  const clearDiagnosisImage = useCallback(() => setDiagnosisImage(null), []);

  const handleBack = useCallback(() => {
    if (mode === AppMode.RESULT && diagnosisInfo !== null) {
      setMode(AppMode.DIAGNOSIS_RESULT);
      setTimeout(() => setDrugInfo(null), 300); 
    } else {
      setMode(AppMode.HOME);
      setTimeout(() => {
          setDrugInfo(null);
          setDiagnosisInfo(null);
      }, 300); 
    }
  }, [mode, diagnosisInfo]);

  // Mock Data for Articles
  const articles: Article[] = [
    { id: '1', category: '科普', title: lang === 'zh' ? '抗生素使用的五大误区' : '5 Myths About Antibiotics', snippet: lang === 'zh' ? '感冒了一定要吃抗生素吗？医生告诉你真相...' : 'Do you really need antibiotics for a cold? Experts say...', readTime: '3 min' },
    { id: '2', category: '生活', title: lang === 'zh' ? '如何通过饮食增强免疫力' : 'Boosting Immunity Through Diet', snippet: lang === 'zh' ? '合理的膳食搭配比补品更重要...' : 'Balanced meals are better than supplements...', readTime: '4 min' },
    { id: '3', category: '急救', title: lang === 'zh' ? '家庭常备药箱指南' : 'Home First Aid Kit Essentials', snippet: lang === 'zh' ? '每个家庭都应该准备这几类基础药物...' : 'Every home should have these basic medications...', readTime: '5 min' },
  ];

  // --- Render ---

  return (
    <div className="min-h-screen text-slate-800 font-sans relative overflow-x-hidden flex flex-col selection:bg-indigo-500/20">
      <CyberBackground />
      
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={closeToast} />
      
      {/* Warning Overlay */}
      <WarningOverlay 
        level={warningLevel} 
        title={warningTitle} 
        message={warningMessage} 
        onClose={() => setWarningLevel(null)} 
        lang={lang} 
      />

      {/* Scanning Simulation Overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
          >
             {/* Camera Viewfinder Simulation */}
             <div className="relative w-full h-full max-w-lg max-h-[80vh] border-2 border-white/20 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scan"></div>
                
                {/* Green Focus Box */}
                <motion.div 
                  initial={{ scale: 1.2, opacity: 0, borderColor: 'white' }}
                  animate={{ scale: 1, opacity: 1, borderColor: '#22c55e' }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 rounded-2xl flex items-center justify-center"
                >
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                </motion.div>

                <div className="absolute bottom-10 left-0 right-0 text-center text-white font-bold text-xl drop-shadow-md">
                   {lang === 'zh' ? '正在识别药盒...' : 'Scanning Medicine...'}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Functional Feature Modal */}
      <FeatureModal 
        isOpen={!!activeFeature} 
        onClose={() => setActiveFeature(null)} 
        title=""
      >
        {activeFeature === 'reminders' && (
           <RemindersView reminders={reminders} setReminders={setReminders} lang={lang} />
        )}
        {activeFeature === 'map' && (
           <PharmacyMap lang={lang} />
        )}
        {activeFeature === 'profile' && (
           <HealthProfile profile={userProfile} setProfile={setUserProfile} lang={lang} onSave={saveProfile} />
        )}
        {activeFeature === 'articles' && (
           <div className="flex flex-col h-full items-center justify-center text-center p-6 space-y-4">
              <BookOpen size={48} className="text-blue-200" />
              <h3 className="text-xl font-bold text-slate-700">{T.daily_read}</h3>
              <p className="text-slate-500">{lang === 'zh' ? '更多健康资讯接入中...' : 'More articles coming soon...'}</p>
              <button onClick={() => setActiveFeature(null)} className="px-6 py-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 font-medium">Close</button>
           </div>
        )}
      </FeatureModal>

      <input type="file" ref={drugFileInputRef} accept="image/*" className="hidden" onChange={handleDrugFileUpload} />
      <input type="file" ref={diagnosisFileInputRef} accept="image/*" className="hidden" onChange={handleDiagnosisFileUpload} />

      <AnimatePresence>
        {mode === AppMode.HOME && (
          <Header lang={lang} toggleLanguage={toggleLanguage} />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex-1 flex flex-col">
        
        {loading.isLoading && <LoadingOverlay message={loading.message} type={activeTab} lang={lang} />}

        <AnimatePresence mode="wait">
          {mode === AppMode.RESULT && drugInfo ? (
            <motion.div 
              key="drug-result"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }} 
              className="w-full h-screen fixed inset-0 z-50 bg-[#f8fafc]"
            >
              <ResultCard info={drugInfo} onBack={handleBack} lang={lang} />
            </motion.div>
          ) : mode === AppMode.DIAGNOSIS_RESULT && diagnosisInfo ? (
             <motion.div 
              key="diagnosis-result"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }} 
              className="w-full h-screen fixed inset-0 z-50 bg-[#f8fafc]"
            >
              <DiagnosisResultCard 
                info={diagnosisInfo} 
                onBack={handleBack} 
                lang={lang} 
                onItemClick={handleDiagnosisItemClick}
              />
            </motion.div>
          ) : (
            
            /* --- HOME VIEW --- */
            <motion.div 
              key="home"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col max-w-7xl mx-auto w-full min-h-[90vh] pb-24"
            >
              <div className="flex flex-col lg:flex-row items-center justify-center p-4 md:p-8 gap-8 lg:gap-20 flex-1">
                {/* Left Column */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 lg:flex-1 relative mt-16 lg:mt-0">
                   <div className="absolute -top-20 -left-20 opacity-20 pointer-events-none hidden lg:block">
                      <Binary size={200} className="text-slate-400" />
                   </div>

                   <div className="relative inline-block transform-gpu">
                     <motion.div 
                       animate={{ 
                          boxShadow: activeTab === 'DRUG' 
                              ? "0 20px 50px -12px rgba(59, 130, 246, 0.5)" 
                              : "0 20px 50px -12px rgba(99, 102, 241, 0.5)"
                       }}
                       className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center transition-colors duration-500 relative z-10 bg-gradient-to-br ${activeTab === 'DRUG' ? 'from-blue-500 to-cyan-400' : 'from-indigo-500 to-purple-500'}`}
                     >
                       <AnimatePresence mode="wait">
                          <motion.div
                              key={activeTab}
                              initial={{ scale: 0.8, opacity: 0, rotate: -30 }}
                              animate={{ scale: 1, opacity: 1, rotate: 0 }}
                              exit={{ scale: 0.8, opacity: 0, rotate: 30 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                               {activeTab === 'DRUG' ? <Pill size={56} className="text-white" /> : <Stethoscope size={56} className="text-white" />}
                          </motion.div>
                       </AnimatePresence>
                     </motion.div>
                  </div>

                  <div className="space-y-6 max-w-xl">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900 leading-[1.1]">
                      {T.title.split(' ')[0]}<span className={`bg-clip-text text-transparent bg-gradient-to-r ${activeTab === 'DRUG' ? 'from-blue-600 to-cyan-500' : 'from-indigo-600 to-purple-500'}`}>Med</span>
                    </h1>
                    <h2 className="text-2xl md:text-3xl font-light text-slate-600 whitespace-pre-line tracking-tight">
                      {T.hero_title}
                    </h2>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                       <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono text-slate-500 flex items-center gap-1">
                          <Aperture size={12} /> Computer Vision
                       </span>
                       <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono text-slate-500 flex items-center gap-1">
                          <Zap size={12} /> LLM Reasoning
                       </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Interaction Hub */}
                <div className="w-full max-w-md lg:max-w-[540px] lg:flex-1 perspective-1000 transform-gpu z-20">
                   <div className="relative bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] rounded-[3rem] p-3 md:p-5 overflow-visible group">
                      
                      {/* Navigation Pills */}
                      <div className="flex bg-slate-100/50 p-1.5 rounded-[2rem] mb-6 relative z-10 backdrop-blur-sm">
                        <button 
                          onClick={() => setActiveTab('DRUG')}
                          className={`flex-1 py-3.5 rounded-[1.7rem] text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'DRUG' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <ScanLine size={18} /> {T.tab_drug}
                        </button>
                        <button 
                          onClick={() => setActiveTab('DIAGNOSIS')}
                          className={`flex-1 py-3.5 rounded-[1.7rem] text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'DIAGNOSIS' ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <Activity size={18} /> {T.tab_diagnosis}
                        </button>
                      </div>

                      <div className="bg-white/50 rounded-[2.5rem] p-6 min-h-[440px] flex flex-col relative border border-white/60">
                        <AnimatePresence mode="wait">
                          {activeTab === 'DRUG' ? (
                            <motion.div
                              key="drug-panel"
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              className="flex flex-col h-full gap-5"
                            >
                               <div className="relative flex-1 group overflow-hidden rounded-[2rem] bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-center gap-3">
                                  <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-wider text-xs">
                                     <Sparkles size={14} /> {T.daily_read}
                                  </div>
                                  <p className="text-slate-600 font-medium leading-relaxed">
                                     {lang === 'zh' ? '即使症状缓解，也要遵医嘱完成抗生素疗程，以免产生耐药性。' : 'Finish the full course of antibiotics even if you feel better to prevent resistance.'}
                                  </p>
                                  <div className="mt-2 flex gap-2">
                                     <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md">#Antibiotics</span>
                                     <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-md">#Health</span>
                                  </div>
                               </div>

                               <div className="flex flex-col gap-3">
                                  <span className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{T.or_manual}</span>
                                  <form onSubmit={handleDrugSearch} className="relative group">
                                    <div className="relative flex items-center bg-white rounded-2xl shadow-sm border border-slate-200 focus-within:border-blue-400 transition-colors p-1 z-20">
                                        <div className="pl-4 text-slate-400">
                                           <Search size={20} />
                                        </div>
                                        <input
                                          type="text"
                                          value={searchQuery}
                                          onChange={(e) => setSearchQuery(e.target.value)}
                                          onFocus={() => setShowHistory(true)}
                                          placeholder={T.search_placeholder}
                                          className="flex-1 bg-transparent border-none outline-none py-3.5 px-3 text-slate-700 placeholder:text-slate-400 font-medium"
                                        />
                                        <button 
                                          type="submit"
                                          disabled={!searchQuery.trim()}
                                          className="bg-slate-900 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-slate-900"
                                        >
                                           <ArrowRight size={18} />
                                        </button>
                                    </div>

                                    {/* Search History Dropdown */}
                                    {showHistory && searchHistory.length > 0 && (
                                      <div className="absolute top-full left-2 right-2 bg-white rounded-b-2xl shadow-xl border border-slate-100 mt-[-10px] pt-4 z-10 overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-400 border-b border-slate-50">
                                           <span>{T.search_history}</span>
                                           <button onClick={clearHistory} className="hover:text-red-500">{T.clear_history}</button>
                                        </div>
                                        {searchHistory.map((item, i) => (
                                          <div 
                                            key={i} 
                                            onClick={() => { setSearchQuery(item); handleDrugSearch(item); }}
                                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm text-slate-600 flex items-center gap-2"
                                          >
                                            <Clock size={12} className="text-slate-300" />
                                            {item}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </form>
                               </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="diagnosis-panel"
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              className="flex flex-col h-full gap-5"
                            >
                               <div className="flex justify-between items-end">
                                  <div className="space-y-1">
                                     <h3 className="text-xl font-bold text-slate-800">{T.symptom_title}</h3>
                                     <p className="text-xs text-slate-400 font-medium">AI-Powered Analysis</p>
                                  </div>
                                  <div className="flex gap-1">
                                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-300"></div>
                                  </div>
                               </div>

                               <div className={`relative flex-1 bg-white rounded-[1.5rem] border transition-colors duration-300 flex flex-col overflow-hidden shadow-sm ${isListening ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                                  <textarea
                                    value={symptomsQuery}
                                    onChange={(e) => setSymptomsQuery(e.target.value)}
                                    placeholder={isListening ? "" : T.symptom_placeholder}
                                    className="flex-1 w-full bg-transparent p-5 resize-none outline-none text-slate-700 placeholder:text-slate-300 text-base leading-relaxed"
                                  />
                                  {isListening && (
                                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                                         <div className="flex items-center gap-1.5 h-12">
                                            {[1,2,3,4,5].map(i => (
                                               <motion.div
                                                  key={i}
                                                  animate={{ height: [10, 30, 10] }}
                                                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                                                  className="w-1.5 bg-red-500 rounded-full"
                                               />
                                            ))}
                                         </div>
                                         <p className="text-red-500 font-bold tracking-widest text-sm uppercase">{T.voice_listening}</p>
                                    </div>
                                  )}
                                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                     <div className="flex items-center gap-2">
                                        <button
                                          onClick={toggleListening}
                                          className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                                              isListening 
                                              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                                              : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
                                          }`}
                                        >
                                          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                        </button>
                                        <button
                                          onClick={() => diagnosisFileInputRef.current?.click()}
                                          className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                                              diagnosisImage
                                              ? 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                                              : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
                                          }`}
                                        >
                                           <ImagePlus size={18} />
                                        </button>
                                     </div>
                                     <div className="text-xs text-slate-400 font-medium">
                                        {symptomsQuery.length > 0 ? `${symptomsQuery.length} chars` : 'Ready'}
                                     </div>
                                  </div>
                               </div>

                               {diagnosisImage && (
                                 <div className="relative overflow-hidden bg-white p-2 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-3">
                                    <img src={diagnosisImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                                    <div className="flex-1 min-w-0">
                                       <p className="text-sm font-bold text-slate-700 truncate">{T.image_attached}</p>
                                       <p className="text-xs text-indigo-500">Analysis Pending</p>
                                    </div>
                                    <button onClick={clearDiagnosisImage} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                       <X size={16} />
                                    </button>
                                 </div>
                               )}

                               <button 
                                  onClick={handleSymptomAnalysis}
                                  disabled={!symptomsQuery.trim() && !diagnosisImage}
                                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-2 group will-change-transform"
                                >
                                  <span>{T.start_diagnosis}</span>
                                  <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                                </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                   </div>
                </div>
              </div>

              {/* Health Articles Section */}
              <div className="px-6 md:px-12 mt-12 w-full">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                   <BookOpen size={20} className="text-blue-500"/> {T.daily_read}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {articles.map(article => (
                    <motion.div 
                      key={article.id}
                      whileHover={{ y: -5 }}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/60 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => setActiveFeature('articles')}
                    >
                       <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-1 rounded-md">{article.category}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} /> {article.readTime}</span>
                       </div>
                       <h4 className="font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{article.title}</h4>
                       <p className="text-sm text-slate-500 leading-relaxed mb-4">{article.snippet}</p>
                       <div className="text-xs font-bold text-blue-500 flex items-center gap-1">
                          {T.read_more} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform"/>
                       </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-20 px-8 py-10 border-t border-slate-200/60 bg-slate-50/50">
                  <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                     <div className="text-slate-500 text-sm max-w-md">
                        <p className="font-bold mb-2">SmartMed Guide</p>
                        <p className="leading-relaxed text-xs">{T.footer_desc}</p>
                     </div>
                     <div className="flex gap-6 text-xs text-slate-400 font-medium">
                        <a href="#" className="hover:text-slate-600">{T.footer_privacy}</a>
                        <a href="#" className="hover:text-slate-600">{T.footer_terms}</a>
                        <a href="#" className="hover:text-slate-600">{T.contact}</a>
                     </div>
                  </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Menu for New Features */}
      {mode === AppMode.HOME && (
         <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none items-end gap-4">
            
            {/* Left Actions */}
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-full px-4 py-3 flex items-center gap-4 pointer-events-auto mb-2">
                <button onClick={() => setActiveFeature('reminders')} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors flex flex-col items-center gap-1" title={T.reminders}>
                   <Clock size={24} />
                   <span className="text-[10px] font-bold">{T.reminders}</span>
                </button>
                 <button onClick={() => setActiveFeature('map')} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors flex flex-col items-center gap-1" title={T.pharmacy_map}>
                   <MapPin size={24} />
                   <span className="text-[10px] font-bold">{T.pharmacy_map}</span>
                </button>
            </div>

            {/* CENTER LARGE CAMERA BUTTON */}
            <button 
              onClick={handleScan}
              className="pointer-events-auto w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-xl shadow-blue-500/40 border-4 border-white flex flex-col items-center justify-center text-white transform transition-transform hover:scale-105 active:scale-95 mb-4 animate-bounce-slow"
            >
               <Camera size={40} />
               <span className="text-xs font-bold mt-1">{lang === 'zh' ? '拍药盒' : 'Scan'}</span>
            </button>

            {/* Right Actions */}
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-full px-4 py-3 flex items-center gap-4 pointer-events-auto mb-2">
                 <button onClick={() => setActiveFeature('profile')} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors flex flex-col items-center gap-1" title={T.my_profile}>
                   <User size={24} />
                   <span className="text-[10px] font-bold">{T.my_profile}</span>
                </button>
                 <button onClick={() => setActiveFeature('articles')} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors flex flex-col items-center gap-1" title={T.daily_read}>
                   <BookOpen size={24} />
                   <span className="text-[10px] font-bold">{T.daily_read}</span>
                </button>
            </div>
         </div>
      )}

      {/* Contact Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-xs text-slate-500 hover:scale-105 transition-transform hover:bg-white hover:text-blue-600 cursor-pointer group">
          <Mail size={14} className="group-hover:animate-bounce" />
          <span>zzy2630816871@gmail.com</span>
        </div>
      </div>
    </div>
  );
}

export default App;
