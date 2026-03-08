
import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { askFollowUpQuestion } from '../services/qwenService';
import { t } from '../translations';

interface FollowUpChatProps {
  contextText: string;
  lang: Language;
  suggestions: string[];
}

export const FollowUpChat: React.FC<FollowUpChatProps> = memo(({ contextText, lang, suggestions }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const T = t[lang];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askFollowUpQuestion(contextText, text, lang);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: lang === 'zh' ? "抱歉，我现在无法回答这个问题。" : "Sorry, I'm unable to answer right now.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60 shadow-lg overflow-hidden relative group transform-gpu">
       <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl -z-10 opacity-50"></div>

       <div className="p-4 border-b border-indigo-50/50 bg-white/40 flex items-center gap-2">
         <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
            <Bot size={18} />
         </div>
         <span className="font-semibold text-slate-700 text-sm">{T.ask_dr_ai}</span>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[250px] max-h-[400px]">
          {messages.length === 0 && (
             <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-full mx-auto flex items-center justify-center relative">
                   <Sparkles className="text-indigo-400 absolute top-3 right-3 animate-pulse" size={16} />
                   <Bot size={32} className="text-indigo-400" />
                </div>
                <p className="text-slate-400 text-sm max-w-[200px] mx-auto leading-relaxed">
                   {lang === 'zh' ? "我是您的专属 AI 医疗顾问，有任何疑问都可以问我。" : "I am your AI medical consultant. Feel free to ask me anything."}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
             </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                 <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white text-indigo-600 border border-indigo-100'}`}>
                        {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-slate-800 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                    }`}>
                       {msg.content}
                    </div>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
               <div className="flex gap-2">
                 <div className="w-8 h-8 rounded-full bg-white text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={16} />
                 </div>
                 <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
               </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
       </div>

       <div className="p-3 bg-white border-t border-slate-100">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all"
          >
             <input
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder={T.chat_placeholder}
               disabled={isLoading}
               className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
             />
             <button 
               type="submit" 
               disabled={!input.trim() || isLoading}
               className="p-1.5 rounded-full bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
             >
                <Send size={14} />
             </button>
          </form>
       </div>
    </div>
  );
});
