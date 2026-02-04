
import React, { useState } from 'react';
import { MessageSquare, Send, X, Bot, Loader2 } from 'lucide-react';
import { askAtaaAssistant } from '../lib/gemini';
import { translations } from '../lib/translations';
import { Language } from '../types';

interface AIChatbotProps {
  language: Language;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const t = translations[language];

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const botReply = await askAtaaAssistant(userMsg, language);
    setMessages(prev => [...prev, { role: 'bot', text: botReply || '' }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-24 md:bottom-8 right-6 z-[60]">
      {isOpen ? (
        <div className="w-80 md:w-96 glass rounded-2xl shadow-2xl overflow-hidden border border-emerald-500/20 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-bold">{language === 'ar' ? 'مساعد عطاء الذكي' : 'Ataa Assistant'}</span>
            </div>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>
          
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
            {messages.length === 0 && (
              <p className="text-center text-slate-500 text-sm mt-4">
                {language === 'ar' ? 'اسألني أي شيء عن الموارد المدرسية!' : 'Ask me anything about school supplies!'}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' ? 'bg-emerald-600 text-white' : 'glass'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <Loader2 className="animate-spin mx-auto text-emerald-600" />}
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700 flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.chatPlaceholder}
              className="flex-1 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button onClick={handleSend} className="bg-emerald-600 text-white p-2 rounded-xl">
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform animate-bounce-slow"
        >
          <MessageSquare size={28} />
        </button>
      )}
    </div>
  );
};

export default AIChatbot;
