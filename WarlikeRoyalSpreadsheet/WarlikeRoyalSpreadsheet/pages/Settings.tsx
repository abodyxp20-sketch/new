
import React, { useState, useRef } from 'react';
import { 
  UserCircle, Bell, Shield, Monitor, LogOut, ChevronRight, 
  Camera, Loader2, AlertCircle, HelpCircle,
  ShieldCheck, Lock, CheckCircle, Mail, User, ArrowRight, Sparkles, GraduationCap, CheckCircle2, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Language, ThemeMode, SchoolItem } from '../types';
import { translations } from '../lib/translations';
import { db, uploadImage, doc, updateDoc, auth, signOut, getLocalData, setLocalData, signInWithGoogle } from '../lib/firebase';

interface SettingsProps {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  language: Language;
  toggleLanguage: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, setUser, theme, setTheme, language, toggleLanguage }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'notify' | 'privacy' | 'support'>('account');
  const [isUpdatingPic, setIsUpdatingPic] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Auth state for guest users
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', displayName: '', grade: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    await new Promise(r => setTimeout(r, 1200)); // Simulate brainy AI processing

    try {
      const users = getLocalData('users');

      if (authMode === 'login') {
        // Special Admin Access
        if (formData.email === 'admin@ataa.edu' && formData.password === 'admin123') {
           const adminProfile: UserProfile = {
            id: 'admin-id',
            displayName: 'System Admin',
            email: 'admin@ataa.edu',
            role: 'Admin',
            socialPoints: 9999,
            unlockedBadges: ['ataa-legend'],
            avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Admin',
            profilePic: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Admin',
            preferences: { theme: 'dark', notifications: { email: true, inApp: true }, language: language, privacyShowHistory: true }
          };
          localStorage.setItem('ataa_current_user', JSON.stringify(adminProfile));
          window.location.reload();
          return;
        }

        const foundUser = users.find((u: any) => u.email === formData.email && u.password === formData.password);
        if (foundUser) {
          localStorage.setItem('ataa_current_user', JSON.stringify(foundUser));
          window.location.reload();
        } else {
          setAuthError(language === 'ar' ? "بيانات الدخول غير صحيحة" : "Invalid credentials.");
        }
      } else {
        const exists = users.find((u: any) => u.email === formData.email);
        if (exists) throw new Error(language === 'ar' ? "البريد مستخدم بالفعل" : "Email already in use.");

        const newId = Math.random().toString(36).substr(2, 9);
        const newProfile: UserProfile & { password?: string } = {
          id: newId,
          displayName: formData.displayName,
          email: formData.email,
          password: formData.password,
          grade: formData.grade,
          socialPoints: 50, // Welcome points
          unlockedBadges: [],
          avatar: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${formData.displayName}`,
          profilePic: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${formData.displayName}`,
          role: 'Student',
          preferences: { theme: 'system', notifications: { email: true, inApp: true }, language: language, privacyShowHistory: true }
        };

        // Link Guest Items to this new user
        const allItems: SchoolItem[] = getLocalData('items');
        const linkedItems = allItems.map(item => {
          if (item.donorId === 'guest') {
            return { ...item, donorId: newId, donorName: formData.displayName };
          }
          return item;
        });
        setLocalData('items', linkedItems);

        users.push(newProfile);
        setLocalData('users', users);
        localStorage.setItem('ataa_current_user', JSON.stringify(newProfile));
        window.location.reload();
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };



  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle(language);
      window.location.reload();
    } catch (error: any) {
      setAuthError(error?.message || (language === 'ar' ? 'تعذر تسجيل الدخول عبر Google.' : 'Unable to sign in with Google.'));
    } finally {
      setIsLoading(false);
    }
  };

  const NavItem = ({ id, icon: Icon, label }: any) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`w-full flex items-center justify-between p-5 squircle transition-all duration-500 tap-active ${activeTab === id ? 'bg-emerald-600 text-white shadow-2xl' : 'hover:bg-white/40 dark:hover:bg-slate-900/40 text-slate-600 dark:text-slate-400'}`}
    >
      <div className="flex items-center gap-5"><Icon size={24} /><span className="font-black text-lg tracking-tight">{label}</span></div>
      <ChevronRight size={20} className={language === 'ar' ? 'rotate-180' : ''} />
    </button>
  );

  // GUEST / AUTH HUB
  if (!user || user.id === 'guest') {
    return (
      <div className="max-w-6xl mx-auto py-12 md:py-24 px-4 animate-fade-up">
        {/* Language Quick-Switch for Guests */}
        <div className="flex justify-end mb-8">
          <button 
            onClick={toggleLanguage} 
            className="glass px-6 py-3 rounded-2xl flex items-center gap-3 font-black text-emerald-600 hover-lift shadow-lg"
          >
            <Globe size={20} />
            {language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="w-24 h-24 bg-emerald-600 squircle flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <Sparkles className="text-white" size={48} />
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter">
              {t.joinAtaa}
            </h1>
            <p className="text-slate-500 text-xl md:text-2xl font-medium leading-relaxed">
              {language === 'ar' 
                ? 'انضم إلى آلاف الطلاب الذين يساهمون في بناء مستقبل تعليمي مستدام ومترابط.'
                : 'Join thousands of students building a sustainable and connected educational future.'
              }
            </p>
            <div className="flex gap-6">
               <div className="p-6 glass squircle flex-1 text-center shadow-xl">
                  <p className="text-3xl font-black text-emerald-600 tabular-nums">2.4k</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Exchanges</p>
               </div>
               <div className="p-6 glass squircle flex-1 text-center shadow-xl">
                  <p className="text-3xl font-black text-blue-600 tabular-nums">150</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Trees Saved</p>
               </div>
            </div>
          </div>

          <div className="glass p-10 md:p-14 squircle-lg shadow-2xl border-white/40 border">
             <form onSubmit={handleAuth} className="space-y-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full mb-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-4 rounded-[18px] font-black text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                  {language === 'ar' ? 'تسجيل الدخول بحساب Google' : 'Continue with Google'}
                </button>

                <div className="relative mb-4">
                  <div className="border-t border-slate-200 dark:border-slate-700"></div>
                  <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white dark:bg-slate-900 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {language === 'ar' ? 'أو' : 'OR'}
                  </span>
                </div>

                <div className="flex gap-2 p-1.5 bg-slate-200/50 dark:bg-slate-900/50 rounded-[20px] mb-6">
                  <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-4 rounded-[15px] font-black text-base transition-all ${authMode === 'login' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-xl' : 'text-slate-500'}`}>{t.login}</button>
                  <button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 py-4 rounded-[15px] font-black text-base transition-all ${authMode === 'signup' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-xl' : 'text-slate-500'}`}>{t.signup}</button>
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-6">
                    <div className="relative">
                      <User className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-slate-400`} size={20} />
                      <input required type="text" placeholder={language === 'ar' ? 'الاسم بالكامل' : 'Full Name'} value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className={`w-full ${language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-4.5 rounded-[20px] bg-white dark:bg-slate-900/50 border-white/30 border outline-none font-black text-lg shadow-inner`} />
                    </div>
                    <div className="relative">
                      <GraduationCap className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-slate-400`} size={20} />
                      <input required type="text" placeholder={t.grade} value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className={`w-full ${language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-4.5 rounded-[20px] bg-white dark:bg-slate-900/50 border-white/30 border outline-none font-black text-lg shadow-inner`} />
                    </div>
                  </div>
                )}

                <div className="relative">
                  <Mail className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-slate-400`} size={20} />
                  <input required type="email" placeholder={t.email} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full ${language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-4.5 rounded-[20px] bg-white dark:bg-slate-900/50 border-white/30 border outline-none font-black text-lg shadow-inner`} />
                </div>
                
                <div className="relative">
                  <Lock className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-slate-400`} size={20} />
                  <input required type="password" placeholder={t.password} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={`w-full ${language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-4.5 rounded-[20px] bg-white dark:bg-slate-900/50 border-white/30 border outline-none font-black text-lg shadow-inner`} />
                </div>

                {authError && <div className="text-xs text-rose-500 font-black flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl"><AlertCircle size={16}/> {authError}</div>}
                
                <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-5 rounded-[22px] font-black text-xl flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                  {isLoading ? <Loader2 className="animate-spin" /> : (authMode === 'login' ? t.login : t.signup)}
                  {!isLoading && <ArrowRight size={24} className={language === 'ar' ? 'rotate-180' : ''} />}
                </button>
             </form>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN SETTINGS
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 min-h-[85vh] pb-32 animate-fade-up px-4">
      <div className="lg:col-span-4 space-y-6">
        <div className="mb-10">
          <h1 className="text-5xl font-black mb-3 tracking-tighter">{t.settings}</h1>
          <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
            <ShieldCheck size={16} /> Secure Legacy Session
          </div>
        </div>
        <div className="space-y-3">
          <NavItem id="account" icon={UserCircle} label={t.account} />
          <NavItem id="appearance" icon={Monitor} label={t.appearance} />
          <NavItem id="privacy" icon={Shield} label={t.privacy} />
          <NavItem id="support" icon={HelpCircle} label={t.support} />
        </div>
        <div className="pt-10">
          <button onClick={() => { localStorage.removeItem('ataa_current_user'); window.location.reload(); }} className="w-full flex items-center gap-4 p-5 squircle text-rose-500 font-black hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all tap-active">
            <LogOut size={26} /> {t.signOut}
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 glass p-8 md:p-16 squircle-lg border-white/30 shadow-2xl">
        {activeTab === 'account' && (
          <div className="space-y-16">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative">
                <div className="w-32 h-32 rounded-[30px] overflow-hidden border-4 border-emerald-500 shadow-2xl shadow-emerald-500/20">
                  <img src={user.avatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user.id}`} className="w-full h-full object-cover" />
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-3 rounded-[15px] shadow-2xl hover:scale-110 transition-transform">
                  <Camera size={22} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-3xl font-black tracking-tight">{user.displayName}</h3>
                <p className="text-slate-500 font-bold text-lg">{user.email}</p>
                <span className="mt-4 inline-flex px-5 py-2 glass border-emerald-500/30 text-emerald-600 text-xs font-black rounded-full uppercase tracking-[0.2em]">{user.role}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] block">{language === 'ar' ? 'الاسم المستعار' : 'Display Name'}</label>
                <input value={user.displayName} onChange={e => setUser({...user, displayName: e.target.value})} className="w-full p-5 rounded-[20px] glass border outline-none font-black text-xl shadow-inner focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] block">{t.grade}</label>
                <input value={user.grade || ''} onChange={e => setUser({...user, grade: e.target.value})} className="w-full p-5 rounded-[20px] glass border outline-none font-black text-xl shadow-inner focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>
            </div>

            {/* Premium Language Segmented Control */}
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] block">{t.language}</label>
               <div className="flex gap-2 p-1.5 bg-slate-200/50 dark:bg-slate-900/50 rounded-[22px]">
                  <button 
                    onClick={() => language !== 'ar' && toggleLanguage()}
                    className={`flex-1 py-4 rounded-[18px] font-black text-base transition-all flex items-center justify-center gap-3 ${language === 'ar' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-xl' : 'text-slate-500'}`}
                  >
                    العربية
                  </button>
                  <button 
                    onClick={() => language !== 'en' && toggleLanguage()}
                    className={`flex-1 py-4 rounded-[18px] font-black text-base transition-all flex items-center justify-center gap-3 ${language === 'en' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-xl' : 'text-slate-500'}`}
                  >
                    English
                  </button>
               </div>
            </div>

            <div className="pt-4">
               <button className="w-full py-5 squircle bg-emerald-600 text-white font-black text-lg shadow-2xl tap-active hover-lift">
                  {t.save}
               </button>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-12">
            <h3 className="text-4xl font-black tracking-tighter">{t.appearance}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['light', 'dark', 'system'].map(mode => (
                <button 
                  key={mode} 
                  onClick={() => setTheme(mode as any)}
                  className={`p-8 squircle border-2 transition-all flex flex-col items-center gap-4 tap-active ${theme === mode ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-xl' : 'border-transparent glass'}`}
                >
                  <Monitor size={32} className={theme === mode ? 'text-emerald-600' : 'text-slate-400'} />
                  <span className="font-black uppercase tracking-widest text-xs">{(t as any)[mode]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
