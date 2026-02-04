import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, PlusCircle, Settings, Home, ShieldCheck, Languages, LogOut, UserCircle, Globe, GraduationCap, Sparkles } from 'lucide-react';
import { UserProfile, Language, ThemeMode } from '../types';
import { translations } from '../lib/translations';

interface NavbarProps {
  user: UserProfile | null;
  theme: ThemeMode;
  language: Language;
  toggleLanguage: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, language, toggleLanguage }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const t = translations[language];

  const navItems = [
    { path: '/', icon: Home, label: language === 'ar' ? 'الرئيسية' : 'Home' },
    { path: '/marketplace', icon: LayoutGrid, label: language === 'ar' ? 'السوق' : 'Market' },
    { path: '/upload', icon: PlusCircle, label: t.donate },
    { path: '/settings', icon: Settings, label: t.settings },
  ];

  if (user && (user.role === 'Admin' || user.role === 'Teacher')) {
    navItems.push({ path: '/admin', icon: ShieldCheck, label: t.admin });
  }

  const handleLogout = () => {
    localStorage.removeItem('ataa_current_user');
    window.location.reload();
  };

  return (
    <>
      {/* Desktop Navbar - iOS Glass Style */}
      <nav className="sticky top-0 z-50 glass px-4 md:px-12 hidden md:block border-b border-white/20 transition-all duration-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/40 transition-all" />
              <div className="relative z-10 w-14 h-14 bg-gradient-to-tr from-emerald-600 to-blue-500 rounded-[18px] flex items-center justify-center shadow-xl transform group-hover:rotate-6 transition-transform">
                <GraduationCap size={32} className="text-white" />
                <Sparkles size={14} className="absolute -top-1 -right-1 text-amber-300 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black bg-gradient-to-r from-emerald-700 to-blue-700 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent tracking-tighter leading-none">
                {t.appName}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">{language === 'ar' ? 'منصة التبادل' : 'Exchange Hub'}</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={`px-6 py-2.5 rounded-2xl font-black transition-all text-sm flex items-center gap-2 active:scale-95 ${location.pathname === item.path ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20' : 'text-slate-500 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}>
                <item.icon size={18} /> {item.label}
              </Link>
            ))}
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-3" />
            
            <button 
              onClick={toggleLanguage} 
              className="flex items-center gap-2 px-4 py-2 hover:bg-white/40 dark:hover:bg-slate-800/40 rounded-2xl transition-all active:scale-90 text-slate-600 dark:text-slate-300 font-bold text-sm"
            >
              <Globe size={18} className="text-emerald-500" />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>
            
            {user && user.id !== 'guest' ? (
              <div className="relative group ml-4">
                <img src={user.avatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user.id}`} className="w-11 h-11 rounded-2xl border-2 border-emerald-500 cursor-pointer object-cover shadow-lg" />
                <div className="absolute right-0 top-full mt-3 w-56 glass rounded-[2rem] shadow-2xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all p-3 border border-white/30">
                  <div className="p-4 border-b border-white/20 mb-2">
                    <p className="font-black text-sm truncate">{user.displayName}</p>
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{user.socialPoints} Points</p>
                  </div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 font-black hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-95 transition-all">
                    <LogOut size={18} /> {t.signOut}
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/settings" className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all ml-4">
                {t.login}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Header - Compact & Premium */}
      <header className="md:hidden sticky top-3 z-[60] mx-3">
        <div className="glass squircle-lg p-2.5 flex items-center justify-between shadow-2xl border border-white/40">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gradient-to-tr from-emerald-600 to-blue-500 rounded-[10px] flex items-center justify-center text-white shadow-lg">
                <GraduationCap size={18} />
             </div>
             <span className="text-xl font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent tracking-tighter">{t.appName}</span>
           </div>
           <div className="flex items-center gap-2">
             <button onClick={toggleLanguage} className="px-2 py-1.5 bg-white/50 dark:bg-slate-800/50 rounded-xl active:scale-90 transition-all font-black text-[10px]">
                {language === 'ar' ? 'EN' : 'AR'}
             </button>
             {user && user.id !== 'guest' ? (
               <img src={user.avatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user.id}`} onClick={() => navigate('/settings')} className="w-8 h-8 rounded-xl border-2 border-emerald-500 object-cover shadow-lg active:scale-90 transition-all" />
             ) : (
               <button onClick={() => navigate('/settings')} className="p-2 bg-emerald-600 text-white rounded-xl active:scale-90 transition-all"><UserCircle size={20} /></button>
             )}
           </div>
        </div>
      </header>

      {/* Navigation Dock - Improved for UX */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-sm">
        <div className="glass rounded-[2rem] border border-white/40 dark:border-slate-800/40 shadow-[0_20px_50px_rgba(0,0,0,0.2)] px-2 py-2 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const shortLabel = item.label.split(' ')[0];
            
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`relative flex flex-col items-center justify-center py-1.5 px-4 rounded-[1.5rem] transition-all duration-500 active:scale-75 group
                  ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-[1.3rem] animate-in zoom-in-75 duration-500" />
                )}

                <item.icon 
                  size={22} 
                  className={`transition-all duration-500 ease-out z-10 
                    ${isActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'}`} 
                />
                
                <span className={`text-[8px] font-black uppercase tracking-[0.1em] z-10 transition-all duration-500
                  ${isActive ? 'opacity-100 max-h-4 mt-1' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                  {shortLabel}
                </span>

                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-emerald-600 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;