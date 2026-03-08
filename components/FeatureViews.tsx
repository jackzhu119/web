
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, User, Plus, Trash2, Bell, Navigation, Save, X, ExternalLink } from 'lucide-react';
import { Reminder, UserProfile, Language } from '../types';
import { t } from '../translations';

// --- REMINDERS COMPONENT ---
interface RemindersProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  lang: Language;
}

export const RemindersView: React.FC<RemindersProps> = ({ reminders, setReminders, lang }) => {
  const [newMed, setNewMed] = useState('');
  const [newTime, setNewTime] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const T = t[lang];

  const handleAdd = () => {
    if (!newMed || !newTime) return;
    const newItem: Reminder = {
      id: Date.now().toString(),
      medication: newMed,
      time: newTime,
      days: [],
      enabled: true
    };
    setReminders(prev => [...prev, newItem]);
    setNewMed('');
    setNewTime('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="flex flex-col h-full">
       <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Clock className="text-blue-500" /> {T.reminders}
          </h2>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
          >
             {isAdding ? <X size={20} /> : <Plus size={20} />}
          </button>
       </div>

       <AnimatePresence>
         {isAdding && (
           <motion.div 
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="overflow-hidden mb-4"
           >
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <input 
                  type="text" 
                  placeholder={T.med_name} 
                  value={newMed}
                  onChange={(e) => setNewMed(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                />
                <input 
                  type="time" 
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                />
                <button 
                  onClick={handleAdd}
                  disabled={!newMed || !newTime}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {T.add_reminder}
                </button>
             </div>
           </motion.div>
         )}
       </AnimatePresence>

       <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-20">
          {reminders.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
               <Bell size={48} className="mx-auto mb-3 opacity-20" />
               <p>{T.reminder_placeholder}</p>
            </div>
          ) : (
            reminders.map(item => (
               <motion.div 
                 key={item.id}
                 layout
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className={`p-4 rounded-2xl border flex items-center justify-between ${item.enabled ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}
               >
                  <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-full ${item.enabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                        <Bell size={20} />
                     </div>
                     <div>
                        <h3 className="font-bold text-slate-800">{item.medication}</h3>
                        <p className="text-sm text-slate-500 font-mono">{item.time}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div 
                       onClick={() => toggleReminder(item.id)}
                       className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${item.enabled ? 'bg-blue-500' : 'bg-slate-300'}`}
                     >
                        <motion.div 
                          layout 
                          className="w-4 h-4 bg-white rounded-full shadow-sm"
                          animate={{ x: item.enabled ? 16 : 0 }}
                        />
                     </div>
                     <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={18} />
                     </button>
                  </div>
               </motion.div>
            ))
          )}
       </div>
    </div>
  );
};

// --- MAP COMPONENT ---
interface MapProps {
  lang: Language;
}

export const PharmacyMap: React.FC<MapProps> = ({ lang }) => {
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string>('');
  const T = t[lang];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => {
          console.error(err);
          setError(T.location_denied);
          // Fallback to a default location (e.g. Shanghai/NY) just for demo UI
          // setCoords({ lat: 31.2304, lng: 121.4737 });
        }
      );
    } else {
      setError(T.location_denied);
    }
  }, [lang]);

  const openGoogleMaps = () => {
    if (coords) {
      window.open(`https://www.google.com/maps/search/pharmacy/@${coords.lat},${coords.lng},15z`, '_blank');
    }
  };

  // Mock list for visual completeness
  const mockPharmacies = [
    { name: lang === 'zh' ? "益丰大药房" : "CVS Pharmacy", dist: "0.4 km" },
    { name: lang === 'zh' ? "老百姓大药房" : "Walgreens", dist: "0.8 km" },
    { name: lang === 'zh' ? "国大药房" : "Rite Aid", dist: "1.2 km" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <MapPin className="text-indigo-500" /> {T.pharmacy_map}
          </h2>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
         {/* Map View */}
         <div className="w-full h-64 bg-slate-100 rounded-3xl overflow-hidden relative border border-slate-200 shadow-inner">
            {coords ? (
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng-0.01}%2C${coords.lat-0.01}%2C${coords.lng+0.01}%2C${coords.lat+0.01}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`}
                className="opacity-90 hover:opacity-100 transition-opacity"
              ></iframe>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-400 gap-2">
                 <Navigation className="animate-pulse" size={32} />
                 <p>{error || T.locating}</p>
              </div>
            )}
            
            <button 
              onClick={openGoogleMaps}
              className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1 hover:scale-105 transition-transform"
            >
              {T.open_in_maps} <ExternalLink size={12} />
            </button>
         </div>

         {/* Nearby List */}
         <div className="flex-1 overflow-y-auto no-scrollbar">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{T.nearby_pharmacies}</h3>
            <div className="space-y-3 pb-20">
               {mockPharmacies.map((p, i) => (
                 <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center hover:border-indigo-200 transition-colors cursor-pointer" onClick={openGoogleMaps}>
                    <div className="flex items-center gap-3">
                       <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                          <MapPin size={18} />
                       </div>
                       <span className="font-bold text-slate-700">{p.name}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{p.dist}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

// --- PROFILE COMPONENT ---
interface ProfileProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  lang: Language;
  onSave: () => void;
}

export const HealthProfile: React.FC<ProfileProps> = ({ profile, setProfile, lang, onSave }) => {
  const T = t[lang];

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <User className="text-teal-500" /> {T.my_profile}
          </h2>
          <button 
            onClick={onSave}
            className="flex items-center gap-1 bg-teal-600 text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-teal-700 transition-colors shadow-lg shadow-teal-500/20 active:scale-95"
          >
             <Save size={16} /> {T.save_profile}
          </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 space-y-5">
         <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
               <User size={48} className="text-teal-200" />
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase">{T.name}</label>
               <input 
                 value={profile.name}
                 onChange={(e) => handleChange('name', e.target.value)}
                 className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-teal-500 outline-none transition-colors"
               />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase">{T.age}</label>
               <input 
                 type="number"
                 value={profile.age}
                 onChange={(e) => handleChange('age', e.target.value)}
                 className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-teal-500 outline-none transition-colors"
               />
            </div>
         </div>

         <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase">{T.gender}</label>
             <div className="flex gap-2">
                {[
                  { val: 'male', label: T.gender_male }, 
                  { val: 'female', label: T.gender_female }, 
                  { val: 'other', label: T.gender_other }
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => handleChange('gender', opt.val)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                       profile.gender === opt.val 
                       ? 'bg-teal-50 border-teal-500 text-teal-700' 
                       : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
             </div>
         </div>

         <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase">{T.allergies}</label>
             <textarea 
               value={profile.allergies}
               onChange={(e) => handleChange('allergies', e.target.value)}
               className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-teal-500 outline-none transition-colors h-24 resize-none"
             />
         </div>

         <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase">{T.conditions}</label>
             <textarea 
               value={profile.conditions}
               onChange={(e) => handleChange('conditions', e.target.value)}
               className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:border-teal-500 outline-none transition-colors h-24 resize-none"
             />
         </div>
      </div>
    </div>
  );
};
