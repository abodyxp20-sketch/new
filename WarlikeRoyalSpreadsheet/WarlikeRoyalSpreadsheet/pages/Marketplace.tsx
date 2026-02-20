import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Package, ShoppingBag, Edit3, Star, Heart, Plus, X, QrCode, Sparkles, Zap, Loader2, Trash2, MessageCircle, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { SchoolItem, Category, Language, UserProfile, ItemRequest, ThemeMode, BorrowRequest } from '../types';
import { translations } from '../lib/translations';
import { performSemanticSearch } from '../lib/gemini';
import { db, deleteDoc, doc, addDoc, collection } from '../lib/firebase';
import MessagingSystem from '../src/components/MessagingSystem';
import { isValidPhone, isValidRegion, normalizePhone, sanitizeText, safeDate } from '../lib/security';

interface MarketplaceProps {
  items: SchoolItem[];
  requests: ItemRequest[];
  user: UserProfile;
  language: Language;
  theme: ThemeMode;
  onPostRequest: (req: ItemRequest) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ items, requests, user, language, theme, onPostRequest }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAISearching, setIsAISearching] = useState(false);
  const [viewMode, setViewMode] = useState<'items' | 'requests'>('items');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All' | 'My Listings'>('All');
  const [selectedItem, setSelectedItem] = useState<SchoolItem | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestInput, setRequestInput] = useState({ name: '', category: 'Stationery' as Category, quantity: 1, region: '', contactNumber: '', neededBefore: '', notes: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [borrowForm, setBorrowForm] = useState({ contact: '', region: '', notes: '' });
  const [borrowStatus, setBorrowStatus] = useState<string | null>(null);
  
  const t = translations[language];
  const navigate = useNavigate();

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this item?')) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'items', itemId));
      setSelectedItem(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditItem = (item: SchoolItem) => {
    navigate(`/upload/${item.id}`);
  };

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsAISearching(true);
    try {
      const result = await performSemanticSearch(searchTerm, language);
      if (result.category) {
        setSelectedCategory(result.category as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAISearching(false);
    }
  };


  const submitRequest = () => {
    if (!requestInput.name.trim()) return;

    if (!isValidRegion(requestInput.region || '')) {
      alert(language === 'ar' ? 'يرجى تحديد المنطقة.' : 'Please provide region.');
      return;
    }

    const cleanedPhone = normalizePhone(requestInput.contactNumber || '');
    if (!isValidPhone(cleanedPhone)) {
      alert(language === 'ar' ? 'رقم التواصل غير صالح.' : 'Contact number is invalid.');
      return;
    }

    const newRequest: ItemRequest = {
      id: crypto.randomUUID(),
      studentId: user.id || 'guest',
      studentName: sanitizeText(user.displayName || (language === 'ar' ? 'طالب' : 'Student'), 80),
      itemName: sanitizeText(requestInput.name.trim(), 120),
      category: requestInput.category,
      quantity: Math.max(1, Number(requestInput.quantity || 1)),
      region: sanitizeText(requestInput.region || '', 80),
      contactNumber: cleanedPhone,
      neededBefore: safeDate(requestInput.neededBefore),
      notes: sanitizeText(requestInput.notes || '', 500),
      createdAt: Date.now(),
    };

    onPostRequest(newRequest);
    setRequestInput({ name: '', category: 'Stationery', quantity: 1, region: '', contactNumber: '', neededBefore: '', notes: '' });
    setShowRequestModal(false);
  };


  const handleBorrowRequest = async () => {
    if (!selectedItem) return;

    if (!isValidPhone(borrowForm.contact)) {
      setBorrowStatus(language === 'ar' ? 'يرجى إدخال رقم تواصل صالح.' : 'Please enter a valid contact number.');
      return;
    }

    if (!isValidRegion(borrowForm.region)) {
      setBorrowStatus(language === 'ar' ? 'يرجى إدخال المنطقة.' : 'Please provide your region.');
      return;
    }

    const borrowRequest: BorrowRequest = {
      id: crypto.randomUUID(),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      ownerId: selectedItem.donorId,
      ownerName: selectedItem.donorName,
      borrowerId: user.id || 'guest',
      borrowerName: user.displayName || (language === 'ar' ? 'طالب' : 'Student'),
      borrowerContact: normalizePhone(borrowForm.contact),
      region: sanitizeText(borrowForm.region, 80),
      notes: sanitizeText(borrowForm.notes || '', 500),
      status: 'pending',
      createdAt: Date.now(),
    };

    await addDoc(collection(db, 'borrow_requests'), borrowRequest);
    setBorrowStatus(language === 'ar' ? 'تم إرسال طلب الاستعارة بنجاح.' : 'Borrow request sent successfully.');
    setBorrowForm({ contact: '', region: '', notes: '' });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesCategory = false;
    if (selectedCategory === 'All') matchesCategory = true;
    else if (selectedCategory === 'My Listings') matchesCategory = item.donorId === user.id;
    else matchesCategory = item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 animate-fade-up">
        <div className="px-2">
          <h1 className="text-3xl md:text-6xl font-black mb-2 tracking-tighter flex items-center gap-3">
            {t.marketTitle} <Sparkles className="text-amber-500 animate-pulse" size={24} />
          </h1>
          <p className="text-slate-500 text-sm md:text-lg font-medium">{t.marketDesc}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 px-2">
          <form onSubmit={handleSemanticSearch} className="relative group w-full sm:w-auto">
            <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors`} size={18} />
            <input 
              type="text" 
              placeholder={language === 'ar' ? 'اسأل ذكاء عطاء...' : 'Ask Ataa AI...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full md:w-[450px] ${language === 'ar' ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3.5 rounded-[20px] glass border-emerald-500/10 focus:ring-8 focus:ring-emerald-500/5 transition-all font-black text-sm outline-none`}
            />
            <button 
              type="submit" 
              className={`absolute ${language === 'ar' ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 p-2 text-emerald-600 hover:bg-white/50 rounded-xl transition-all tap-active`}
              disabled={isAISearching}
            >
              {isAISearching ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
            </button>
          </form>
          <button 
            onClick={() => setShowRequestModal(true)}
            className="w-full sm:w-auto p-3.5 squircle bg-emerald-600 text-white shadow-2xl hover:scale-110 active:scale-90 transition-all shadow-emerald-500/20 flex items-center justify-center"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 glass squircle-lg w-fit animate-fade-up mx-auto md:mx-0">
        <button 
          onClick={() => setViewMode('items')}
          className={`px-6 md:px-10 py-3 md:py-4 rounded-[20px] md:rounded-[25px] font-black text-xs md:text-sm uppercase tracking-widest transition-all ${viewMode === 'items' ? 'bg-white dark:bg-slate-800 shadow-2xl text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {t.browse}
        </button>
        <button 
          onClick={() => setViewMode('requests')}
          className={`px-6 md:px-10 py-3 md:py-4 rounded-[20px] md:rounded-[25px] font-black text-xs md:text-sm uppercase tracking-widest transition-all ${viewMode === 'requests' ? 'bg-white dark:bg-slate-800 shadow-2xl text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {t.requests}
        </button>
      </div>

      {viewMode === 'items' ? (
        <>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-2 animate-fade-up">
            {['All', 'My Listings', 'Stationery', 'Electronics', 'Books', 'Uniforms', 'Art Supplies', 'Other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={`flex-shrink-0 px-6 md:px-10 py-3 md:py-5 squircle text-xs md:text-sm font-black transition-all shadow-xl tap-active border ${
                  selectedCategory === cat 
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/20' 
                    : 'glass border-white/40 text-slate-500 hover:bg-white/60 dark:hover:bg-slate-900/60'
                }`}
              >
                {cat === 'My Listings' ? (language === 'ar' ? 'مقتنياتي' : 'My Vault') : cat}
              </button>
            ))}
          </div>

      {/* iOS 26 Aesthetic Items Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-10 animate-fade-up px-2">
        {filteredItems.map((item) => (
          <div key={item.id} className="group glass squircle-lg overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-700 border-white/40 border flex flex-col relative tap-active">
            <div className="aspect-[1/1] md:aspect-[4/3] relative overflow-hidden" onClick={() => setSelectedItem(item)}>
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 cursor-pointer" 
              />
              <div className={`absolute top-2 md:top-5 ${language === 'ar' ? 'right-2 md:right-5' : 'left-2 md:left-5'} flex gap-3`}>
                <div className="glass bg-white/70 dark:bg-slate-900/70 border-white px-2 md:px-5 py-1 md:py-2 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-emerald-600 shadow-2xl flex items-center gap-1 md:gap-2">
                  <Zap size={10} /> <span className="hidden xs:inline">{item.category}</span>
                </div>
              </div>
            </div>
                
                <div className="p-4 md:p-8 flex-1 flex flex-col">
                  <h3 className="font-black text-lg md:text-2xl tracking-tight mb-1 group-hover:text-emerald-600 transition-colors cursor-pointer" onClick={() => setSelectedItem(item)}>{item.name}</h3>
                  <p className="text-slate-500 font-medium text-[10px] md:text-sm mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
                  
                  <div className="flex items-center gap-1 text-slate-500 font-bold mb-3">
                    <MapPin size={10} className="text-emerald-500" />
                    <span className="truncate text-[8px] md:text-[10px]">{item.pickupLocation}</span>
                  </div>
                  
          <div className="mt-auto pt-3 md:pt-4 border-t border-white/40 dark:border-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5 md:gap-4">
              <img src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${item.donorName}`} className="w-6 h-6 md:w-10 md:h-10 rounded-[8px] md:rounded-[15px] ring-2 md:ring-4 ring-emerald-500/10 shadow-lg" />
              <span className="text-[8px] md:text-[10px] text-slate-500 font-black tracking-tight truncate max-w-[40px] md:max-w-none">{item.donorName}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedItem(item);
                  setShowMessaging(true);
                }}
                className="bg-blue-600 text-white p-1.5 md:p-3.5 rounded-[10px] md:rounded-[18px] shadow-2xl tap-active hover-lift"
                title={t.contactDonorButton || 'Contact Donor'}
              >
                <MessageCircle size={14} />
              </button>
              <button
                onClick={() => setSelectedItem(item)}
                className="bg-emerald-600 text-white p-1.5 md:p-3.5 rounded-[10px] md:rounded-[18px] shadow-2xl tap-active hover-lift"
              >
                <ShoppingBag size={14} />
              </button>
            </div>
          </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Needs Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-fade-up">
          {requests.map(req => (
            <div key={req.id} className="glass p-10 squircle-lg border-blue-500/10 hover-lift relative overflow-hidden shadow-2xl">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 squircle flex items-center justify-center shadow-lg">
                  <Heart size={32} />
                </div>
                <div>
                  <h4 className="font-black text-2xl tracking-tight">{req.itemName}</h4>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{req.category}</p>
                </div>
              </div>
              <p className="text-base text-slate-500 font-medium mb-3">
                {language === 'ar' ? 'طلب بواسطة ' : 'Need by '} <span className="text-emerald-600 font-black">{req.studentName}</span>
              </p>
              <p className="text-xs text-slate-500 font-bold mb-2">{language === 'ar' ? 'الكمية:' : 'Quantity:'} {req.quantity || 1}</p>
              {req.region && <p className="text-xs text-slate-500 font-bold mb-2">{language === 'ar' ? 'المنطقة:' : 'Region:'} {req.region}</p>}
              {req.contactNumber && <p className="text-xs text-slate-500 font-bold mb-2">{language === 'ar' ? 'التواصل:' : 'Contact:'} {req.contactNumber}</p>}
              {req.notes && <p className="text-xs text-slate-500 font-medium mb-3 line-clamp-2">{req.notes}</p>}
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-t border-white/30 pt-4">
                Manifested {new Date(req.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Detail Sheet (Modal) */}
      {selectedItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-900 squircle-lg shadow-[0_40px_100px_rgba(0,0,0,0.5)] max-w-6xl w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-500 border border-white/20">
            <button 
              onClick={() => setSelectedItem(null)}
              className={`absolute top-8 ${language === 'ar' ? 'left-8' : 'right-8'} p-4 glass squircle hover:bg-rose-500 hover:text-white transition-all z-20 tap-active`}
            >
              <X size={28} />
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              <div className="h-full min-h-[400px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <img 
                  src={selectedItem.imageUrl} 
                  className="w-full h-full object-contain lg:rounded-l-[40px] shadow-2xl" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800';
                  }}
                />
              </div>
              <div className="p-10 md:p-16 space-y-10 overflow-y-auto">
                <div>
                  <div className="inline-flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-[0.2em] mb-6 glass border-emerald-500/20 px-5 py-2 rounded-full">
                    <Package size={18} /> {selectedItem.category}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter leading-tight">{selectedItem.name}</h2>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-slate-500 text-lg leading-relaxed font-medium whitespace-pre-wrap">{selectedItem.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 glass squircle border-slate-200 dark:border-slate-800 shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.condition}</p>
                    <p className="font-black text-2xl text-emerald-600 tracking-tight">{selectedItem.condition}</p>
                  </div>
                  <div className="p-6 glass squircle border-slate-200 dark:border-slate-800 shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.pickup}</p>
                    <p className="font-black text-2xl text-blue-600 tracking-tight flex items-center gap-2">
                      <MapPin size={22}/> {selectedItem.pickupLocation}
                      {selectedItem.coordinates && (
                        <a 
                          href={`https://www.google.com/maps?q=${selectedItem.coordinates.lat},${selectedItem.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all"
                        >
                          <Zap size={16} />
                        </a>
                      )}
                    </p>
                  </div>
                </div>

                          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                              <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100">
                                <QRCodeSVG 
                                  value={JSON.stringify({
                                    id: selectedItem.id,
                                    name: selectedItem.name,
                                    donor: selectedItem.donorName,
                                    status: 'verified'
                                  })}
                                  size={256}
                                  level="H"
                                  includeMargin={true}
                                  className="w-16 h-16 md:w-20 md:h-20"
                                />
                              </div>
                              <div className="flex-1 space-y-1">
                                <h4 className="font-black text-xs md:text-sm tracking-tight text-slate-800 dark:text-white uppercase tracking-widest">Digital Identity</h4>
                                <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider">
                                  Scan to verify asset details and creator info. Verified by Ataa Neural Shield.
                                </p>
                              </div>
                            </div>
                          </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={borrowForm.contact}
                    onChange={(e) => setBorrowForm((prev) => ({ ...prev, contact: normalizePhone(e.target.value) }))}
                    placeholder={language === 'ar' ? 'رقم تواصل للاستعارة' : 'Borrower contact number'}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <input
                    value={borrowForm.region}
                    onChange={(e) => setBorrowForm((prev) => ({ ...prev, region: e.target.value }))}
                    placeholder={language === 'ar' ? 'المنطقة' : 'Region'}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <textarea
                    value={borrowForm.notes}
                    onChange={(e) => setBorrowForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder={language === 'ar' ? 'ملاحظات إضافية' : 'Additional notes'}
                    className="md:col-span-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 min-h-[90px]"
                  />
                </div>
                {borrowStatus && <p className="text-sm font-bold text-emerald-600">{borrowStatus}</p>}

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setShowMessaging(true);
                      setSelectedItem(selectedItem);
                    }}
                    className="flex-1 bg-blue-600 text-white py-5 squircle font-black text-lg md:text-xl shadow-2xl shadow-blue-500/30 tap-active hover-lift"
                  >
                    {language === 'ar' ? 'تواصل مع المانح' : 'Contact Donor'}
                  </button>
                  <button 
                    onClick={handleBorrowRequest}
                    className="flex-1 bg-emerald-600 text-white py-5 squircle font-black text-lg md:text-xl shadow-2xl shadow-emerald-500/30 tap-active hover-lift"
                  >
                    {language === 'ar' ? 'إرسال طلب استعارة' : 'Send Borrow Request'}
                  </button>
                  {selectedItem.donorId === user.id && (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleEditItem(selectedItem)}
                        className="p-6 glass squircle text-blue-600 hover:bg-blue-50 transition-all tap-active"
                        title={language === 'ar' ? 'تعديل' : 'Edit'}
                      >
                        <Edit3 size={28} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(selectedItem.id)}
                        disabled={isDeleting}
                        className="p-6 glass squircle text-rose-600 hover:bg-rose-50 transition-all tap-active disabled:opacity-50"
                        title={language === 'ar' ? 'حذف' : 'Delete'}
                      >
                        {isDeleting ? <Loader2 className="animate-spin" size={28} /> : <Trash2 size={28} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {showRequestModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass max-w-md w-full p-8 rounded-[2rem] border border-white/30 space-y-5">
            <h3 className="text-2xl font-black tracking-tight">{language === 'ar' ? 'طلب احتياج جديد' : 'Create New Request'}</h3>
            <input
              value={requestInput.name}
              onChange={(e) => setRequestInput((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={language === 'ar' ? 'ما الذي تحتاجه؟' : 'What do you need?'}
              className="w-full p-4 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-white/40 outline-none"
            />
            <select
              value={requestInput.category}
              onChange={(e) => setRequestInput((prev) => ({ ...prev, category: e.target.value as Category }))}
              className="w-full p-4 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-white/40 outline-none"
            >
              {['Stationery', 'Electronics', 'Books', 'Uniforms', 'Art Supplies', 'Other'].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={requestInput.quantity}
              onChange={(e) => setRequestInput((prev) => ({ ...prev, quantity: Number(e.target.value || 1) }))}
              placeholder={language === 'ar' ? 'الكمية المطلوبة' : 'Required quantity'}
              className="w-full p-4 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-white/40 outline-none"
            />
            <input
              value={requestInput.region}
              onChange={(e) => setRequestInput((prev) => ({ ...prev, region: e.target.value }))}
              placeholder={language === 'ar' ? 'المنطقة' : 'Region'}
              className="w-full p-4 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-white/40 outline-none"
            />
            <input
              value={requestInput.contactNumber}
              onChange={(e) => setRequestInput((prev) => ({ ...prev, contactNumber: normalizePhone(e.target.value) }))}
              placeholder={language === 'ar' ? 'رقم التواصل' : 'Contact number'}
              className="w-full p-4 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-white/40 outline-none"
            />
            <input
              type="date"
              value={requestInput.neededBefore}
              onChange={(e) => setRequestInput((prev) => ({ ...prev, neededBefore: e.target.value }))}
              className="w-full p-4 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-white/40 outline-none"
            />
            <textarea
              value={requestInput.notes}
              onChange={(e) => setRequestInput((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder={language === 'ar' ? 'تفاصيل إضافية للطلب' : 'Extra request details'}
              className="w-full p-4 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-white/40 outline-none min-h-[90px]"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRequestModal(false)} className="flex-1 py-3 rounded-2xl bg-slate-200/70 dark:bg-slate-700/70 font-bold">
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={submitRequest} className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold">
                {language === 'ar' ? 'إرسال' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messaging System Modal */}
      {showMessaging && selectedItem && (
        <MessagingSystem
          currentUser={user}
          item={selectedItem}
          isOpen={showMessaging}
          onClose={() => setShowMessaging(false)}
          language={language}
        />
      )}
    </div>
  );
};

export default Marketplace;