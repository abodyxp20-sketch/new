import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift, Recycle, Users, Sparkles, Award, Leaf, Coins, Cloud, Trophy, GraduationCap, BookOpen, Heart, CheckCircle, Upload as UploadIcon, Zap, Package, ShoppingBag, UserCircle } from 'lucide-react';
import { UserProfile, Language, SchoolItem } from '../types';
import { translations } from '../lib/translations';
import { ALL_BADGES } from '../App';

interface HomeProps {
  user: UserProfile;
  language: Language;
  items: SchoolItem[];
}

const Home: React.FC<HomeProps> = ({ user, language, items }) => {
  const t = translations[language];

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.1 });

    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => observer.observe(el));
    return () => reveals.forEach(el => observer.unobserve(el));
  }, []);

  const approvedCount = items.filter(i => i.status === 'approved').length;
  const treesSaved = Math.max(2, Math.floor(approvedCount * 0.4));
  const co2Reduced = (approvedCount * 0.5 + 5.2).toFixed(1);
  const moneySaved = approvedCount * 25 + 150;

  return (
    <div className="space-y-16 md:space-y-32 pb-16 overflow-x-hidden">
      {/* iOS 26 Hero Section - High Quality Imagery */}
      <section className="relative overflow-hidden squircle-lg min-h-[550px] md:min-h-[700px] flex items-center shadow-2xl animate-fade-up">
        {/* Unsplash Education Background */}
        <div className="absolute inset-0 z-0">
           <img 
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=2000" 
            alt="School Exchange Environment"
            className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/95 via-emerald-900/80 to-blue-900/50" />
           <div className="absolute inset-0 backdrop-blur-[1px]" />
        </div>

        <div className="relative z-10 max-w-4xl px-8 md:px-24 py-16 text-center md:text-right">
          <div className="inline-flex items-center gap-2 glass border-white/30 px-6 py-2.5 rounded-full text-xs md:text-sm font-black mb-10 tracking-widest uppercase text-emerald-200">
            <Sparkles size={16} className="text-amber-300" /> {t.slogan}
          </div>
          <h1 className="text-5xl md:text-8xl font-black leading-[1] mb-10 tracking-tighter text-white">
            {t.heroTitle}
          </h1>
          <p className="text-xl md:text-3xl text-emerald-50 mb-14 max-w-2xl leading-relaxed font-medium mx-auto md:mr-0 md:ml-auto">
            {t.heroDesc}
          </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-end gap-6">
            <Link to="/marketplace" className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 rounded-[22px] font-black text-xl tap-active hover-lift flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30">
              {t.heroAction1 || t.browse} <ArrowRight size={22} className={language === 'ar' ? 'rotate-180' : ''} />
            </Link>
            <Link to="/upload" className="glass border-white/20 text-white px-10 py-5 rounded-[22px] font-black text-xl hover:bg-white/10 transition-all text-center tap-active flex items-center justify-center gap-3">
              <Gift size={22} /> {t.heroAction2 || t.donate}
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 pb-16">
              <div className="glass p-8 rounded-[32px] border-white/20 text-center space-y-4 hover-lift">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">{language === 'ar' ? 'لوحة الاحتياجات' : 'Needs Board'}</h3>
                <p className="text-emerald-50/70 font-medium text-sm leading-relaxed">
                  {language === 'ar' ? 'اطلب ما ينقصك وسيقوم زملاؤك بمساعدتك فوراً.' : 'Request what you lack and your peers will help you.'}
                </p>
              </div>
              <div className="glass p-8 rounded-[32px] border-white/20 text-center space-y-4 hover-lift">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Cloud size={32} />
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">{language === 'ar' ? 'تزامن عابر للأجهزة' : 'Cross-Device Sync'}</h3>
                <p className="text-emerald-50/70 font-medium text-sm leading-relaxed">
                  {language === 'ar' ? 'بياناتك محدثة دائماً بين هاتفك وحاسوبك تلقائياً.' : 'Your data is always synced between phone and PC.'}
                </p>
              </div>
              <div className="glass p-8 rounded-[32px] border-white/20 text-center space-y-4 hover-lift">
                <div className="w-16 h-16 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserCircle size={32} />
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">{language === 'ar' ? 'هوية رقمية أنيقة' : 'Sleek Digital ID'}</h3>
                <p className="text-emerald-50/70 font-medium text-sm leading-relaxed">
                  {language === 'ar' ? 'استخدم شخصياتنا المميزة بدلاً من الصور التقليدية.' : 'Use our unique avatars instead of traditional photos.'}
                </p>
              </div>
        </div>
        
        {/* Floating Abstract Vectors */}
        <div className="absolute top-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-bounce-slow" />
      </section>

      {/* Modern Impact Grid */}
      <section className="reveal space-y-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] text-xs mb-4">
            <BookOpen size={20} /> {t.ecoDashboard}
          </div>
          <h2 className="text-4xl md:text-6xl font-black px-4 tracking-tight">{t.ecoDesc}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {[
            { label: t.treesSaved, value: treesSaved, icon: Leaf, color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
            { label: t.co2Saved, value: co2Reduced, icon: Cloud, color: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" },
            { label: t.moneySaved, value: `$${moneySaved}`, icon: Coins, color: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" },
          ].map((stat, i) => (
            <div key={i} className="glass p-12 squircle border-white/40 dark:border-slate-800/40 hover-lift flex flex-col items-center text-center group shadow-xl">
              <div className={`w-24 h-24 rounded-[28px] flex items-center justify-center mb-8 group-hover:rotate-6 transition-all shadow-lg ${stat.color}`}>
                <stat.icon size={44} />
              </div>
              <p className="text-5xl md:text-7xl font-black mb-2 tracking-tighter text-slate-800 dark:text-white tabular-nums">{stat.value}</p>
              <p className="text-slate-500 font-black uppercase tracking-[0.15em] text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Enhanced Badge Showcase */}
      <section className="reveal space-y-10">
        <div className="flex items-center justify-between px-6">
          <h3 className="text-3xl md:text-4xl font-black flex items-center gap-4">
            <Award className="text-amber-500" /> {t.unlockedBadges}
          </h3>
          <Link to="/settings" className="text-emerald-600 font-black text-sm uppercase tracking-widest hover:underline flex items-center gap-2">
            {language === 'ar' ? 'عرض الكل' : 'View All'} <ArrowRight size={16} className={language === 'ar' ? 'rotate-180' : ''} />
          </Link>
        </div>
        <div className="flex gap-8 overflow-x-auto pb-10 scrollbar-hide px-6">
          {ALL_BADGES.map((badge) => {
            const unlocked = user.id !== 'guest' && user.unlockedBadges.includes(badge.id);
            return (
              <div key={badge.id} className={`flex-shrink-0 w-64 md:w-72 p-10 squircle border transition-all duration-700 ${unlocked ? 'glass border-emerald-500/40 shadow-2xl scale-105' : 'bg-slate-200/40 dark:bg-slate-900/40 opacity-40 grayscale border-transparent'}`}>
                <div className={`text-5xl md:text-7xl mb-8 p-8 rounded-[28px] inline-block shadow-inner ${unlocked ? badge.color + ' text-white' : 'bg-slate-300 dark:bg-slate-800'}`}>
                  {badge.icon}
                </div>
                <h4 className="font-black text-2xl md:text-3xl mb-3 leading-tight tracking-tight">{language === 'ar' ? badge.nameAr : badge.nameEn}</h4>
                <p className="text-xs text-slate-500 font-black uppercase tracking-widest opacity-70">{badge.condition}</p>
                {unlocked && <div className="mt-4 flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest"> <Sparkles size={12} /> Unlocked Legacy </div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Community Legends List */}
      <section className="reveal space-y-12 pb-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] text-xs mb-4">
            <Trophy size={20} /> {t.leaderboard}
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight">{language === 'ar' ? 'أساطير مجتمع عطاء' : 'Community Legends'}</h2>
        </div>

        <div className="max-w-4xl mx-auto space-y-8 px-4">
          {[
            { name: "Ali Ahmed", points: 1250, avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ali", rank: "Legacy King" },
            { name: user.displayName || "Guest", points: user.socialPoints || 0, avatar: user.avatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user.id || 'Guest'}`, rank: "Rising Star" },
            { name: "Omar Khalid", points: 840, avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Omar", rank: "Top Donor" }
          ].sort((a,b) => b.points - a.points).map((c, i) => (
            <div key={i} className={`glass p-8 md:p-10 squircle flex items-center justify-between hover-lift border-white/20 dark:border-slate-800/20 shadow-2xl relative overflow-hidden ${c.name === user.displayName ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10' : ''}`}>
              <div className="flex items-center gap-8 md:gap-12 relative z-10">
                <span className="text-3xl md:text-5xl font-black text-slate-300/30 w-12">{i + 1}</span>
                <div className="relative">
                  <img src={c.avatar} className="w-16 h-16 md:w-24 md:h-24 rounded-[30px] object-cover border-4 border-white/50 shadow-2xl" />
                  {i === 0 && <div className="absolute -top-4 -right-4 bg-amber-400 text-white p-2 rounded-full shadow-lg animate-bounce"><Trophy size={20} /></div>}
                </div>
                <div>
                  <p className="font-black text-xl md:text-3xl tracking-tight">{c.name}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] mt-1">{c.rank}</p>
                </div>
              </div>
              <div className="text-right relative z-10">
                <p className="text-3xl md:text-5xl font-black text-emerald-600 tabular-nums">{c.points}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.socialPoints}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <style>{`
        .animate-bounce-slow { animation: bounce-slow 6s ease-in-out infinite; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default Home;