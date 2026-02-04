
import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, BarChart3, Check, X, Clock, Sparkles, Loader2, Zap, User, TrendingUp, PackageSearch, CheckCircle2, AlertCircle } from 'lucide-react';
import { SchoolItem, Language, Category } from '../types';
import { translations } from '../lib/translations';
import { getAdminInsights } from '../lib/gemini';
import { db, doc, updateDoc, deleteDoc } from '../lib/firebase';

interface AdminProps {
  items: SchoolItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  language: Language;
}

const Admin: React.FC<AdminProps> = ({ items, language }) => {
  const t = translations[language];
  const pendingItems = items.filter(i => i.status === 'pending');
  const approvedItems = items.filter(i => i.status === 'approved');
  const [aiInsights, setAiInsights] = useState<{ summary: string, topNeed: string, riskLevel: string } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [modifyingId, setModifyingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (items.length === 0) return;
      setLoadingInsights(true);
      try {
        const insights = await getAdminInsights(JSON.stringify(items.slice(0, 20)));
        setAiInsights(insights);
      } catch (err) {
        console.error("Insights Error:", err);
      } finally {
        setLoadingInsights(false);
      }
    };
    fetchInsights();
  }, [items.length]);

  const handleApprove = async (id: string) => {
    setModifyingId(id);
    try {
      const itemRef = doc(db, "items", id);
      await updateDoc(itemRef, { status: 'approved' });
    } catch (err) {
      console.error(err);
    } finally {
      setModifyingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setModifyingId(id);
    try {
      const itemRef = doc(db, "items", id);
      await deleteDoc(itemRef);
    } catch (err) {
      console.error(err);
    } finally {
      setModifyingId(null);
    }
  };

  // Analytics Calculations
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    items.forEach(item => {
      stats[item.category] = (stats[item.category] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const maxCategoryCount = Math.max(...categoryStats.map(s => s[1]), 1);

  return (
    <div className="space-y-8 animate-fade-up pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3 tracking-tight">
            <ShieldCheck size={40} className="text-emerald-500" /> {t.admin}
          </h1>
          <p className="text-slate-500 font-medium">
            {language === 'ar' ? 'نظام الإشراف السحابي والتحليل الذكي' : 'Cloud Moderation & Intelligent Analytics'}
          </p>
        </div>
      </div>

      {/* Top Level Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-3xl font-black tracking-tighter">{pendingItems.length}</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{language === 'ar' ? 'قيد الانتظار' : 'Pending Review'}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-3xl font-black tracking-tighter">{approvedItems.length}</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{language === 'ar' ? 'تمت الموافقة' : 'Approved Items'}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-3xl font-black tracking-tighter">+{Math.floor(approvedItems.length * 1.5)}%</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{language === 'ar' ? 'معدل النمو' : 'Growth Rate'}</p>
          </div>
        </div>

        <div className="glass p-6 rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center">
            <BarChart3 size={28} />
          </div>
          <div>
            <p className="text-3xl font-black tracking-tighter">{items.length}</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{language === 'ar' ? 'إجمالي الأصول' : 'Total Assets'}</p>
          </div>
        </div>
      </div>

      {/* Main Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* AI Co-Pilot Insights */}
        <div className="lg:col-span-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 md:p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3">
              <Sparkles className="text-amber-300 animate-pulse" /> 
              {language === 'ar' ? 'تحليلات الذكاء الاصطناعي' : 'AI Strategic Summary'}
            </h3>
            {loadingInsights ? (
              <div className="flex items-center gap-4 py-8">
                <Loader2 className="animate-spin text-amber-300" size={32} />
                <p className="font-bold opacity-70 tracking-wide uppercase text-sm">Mining community data for strategic patterns...</p>
              </div>
            ) : aiInsights ? (
              <div className="space-y-8">
                <p className="text-xl md:text-2xl font-medium opacity-90 leading-relaxed italic border-l-4 border-amber-500 pl-6 py-2">
                  "{aiInsights.summary}"
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass bg-white/5 border-white/10 p-5 rounded-[2rem]">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">Category Saturation</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-amber-300">{aiInsights.topNeed}</span>
                      <PackageSearch size={24} className="opacity-30" />
                    </div>
                  </div>
                  <div className="glass bg-white/5 border-white/10 p-5 rounded-[2rem]">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">Community Integrity</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-black ${aiInsights.riskLevel === 'Low' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {aiInsights.riskLevel} Risk Detected
                      </span>
                      <ShieldCheck size={24} className="opacity-30" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="opacity-50 font-bold py-10">Waiting for data synchronization to generate insights.</p>
            )}
          </div>
          <Zap size={250} className="absolute -right-20 -bottom-20 text-white opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
        </div>

        {/* Category Distribution Chart */}
        <div className="lg:col-span-4 glass p-8 md:p-10 rounded-[3rem] border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-full">
          <h3 className="text-lg font-black mb-6 flex items-center gap-3">
            <PackageSearch size={22} className="text-emerald-500" />
            {language === 'ar' ? 'توزيع الفئات' : 'Category Density'}
          </h3>
          <div className="space-y-6 flex-1">
            {categoryStats.length > 0 ? categoryStats.map(([cat, count]) => (
              <div key={cat} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>{cat}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{count}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-1000 ease-out"
                    style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-sm">
                No categories to display
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Moderation Section */}
      <div className="glass rounded-[3rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="p-8 md:p-10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-2xl font-black flex items-center gap-3 tracking-tight">
             <AlertCircle size={28} className="text-amber-500" />
             {language === 'ar' ? 'طلبات قيد المراجعة' : 'Global Moderation Queue'}
             <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-4 py-1 rounded-xl text-sm font-black">{pendingItems.length}</span>
          </h3>
        </div>

        {pendingItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className={`px-10 py-5 ${language === 'ar' ? 'text-right' : ''}`}>{language === 'ar' ? 'الأداة' : 'Resource Item'}</th>
                  <th className={`px-10 py-5 ${language === 'ar' ? 'text-right' : ''}`}>{language === 'ar' ? 'المتبرع' : 'Contributor'}</th>
                  <th className={`px-10 py-5 ${language === 'ar' ? 'text-right' : ''}`}>{language === 'ar' ? 'الفئة' : 'Category'}</th>
                  <th className="px-10 py-5 text-center">{language === 'ar' ? 'اتخاذ قرار' : 'Resolution'}</th>
                </tr>
              </thead>
              <tbody className="divide-y border-slate-200 dark:border-slate-800">
                {pendingItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-500/10">
                          <img src={item.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-black text-lg leading-tight">{item.name}</p>
                          <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">{item.condition}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                          <User size={14} />
                        </div>
                        <span className="font-bold text-sm">{item.donorName}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                       <span className="bg-slate-200/50 dark:bg-slate-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-300 dark:border-slate-700">
                        {item.category}
                       </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleApprove(item.id)}
                          disabled={modifyingId === item.id}
                          className="bg-emerald-100 text-emerald-600 p-3.5 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-lg active:scale-90 disabled:opacity-50"
                          title="Approve Listing"
                        >
                          {modifyingId === item.id ? <Loader2 size={24} className="animate-spin" /> : <Check size={24} />}
                        </button>
                        <button 
                          onClick={() => handleReject(item.id)}
                          disabled={modifyingId === item.id}
                          className="bg-rose-100 text-rose-600 p-3.5 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-lg active:scale-90 disabled:opacity-50"
                          title="Reject Listing"
                        >
                          {modifyingId === item.id ? <Loader2 size={24} className="animate-spin" /> : <X size={24} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-24 text-center space-y-6 opacity-60">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check size={40} />
            </div>
            <div>
              <p className="font-black text-2xl tracking-tight uppercase tracking-widest">
                {language === 'ar' ? 'جميع الطلبات منظمة' : 'Moderation Complete'}
              </p>
              <p className="text-slate-500 font-medium">Your global queue is currently empty. Great job!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
