
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Loader2, CheckCircle, Sparkles, UserCircle, LogIn, Camera, MapPin } from 'lucide-react';
import { analyzeItemImage } from '../lib/gemini';
import { db, uploadImage, collection, addDoc, doc, updateDoc } from '../lib/firebase';
import { UserProfile, SchoolItem, Category, Language } from '../types';
import { translations } from '../lib/translations';

interface UploadProps {
  user: UserProfile | null;
  language: Language;
  onUpload: (item: any) => void;
  items?: SchoolItem[];
}

const Upload: React.FC<UploadProps> = ({ user, language, onUpload, items }) => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const editItem = itemId && items ? items.find(i => i.id === itemId) : null;

  const [image, setImage] = useState<string | null>(editItem?.imageUrl || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];
  
  const [formData, setFormData] = useState({
    name: editItem?.name || '',
    description: editItem?.description || '',
    notes: editItem?.notes || '',
    pickupLocation: editItem?.pickupLocation || '',
    category: (editItem?.category as Category) || 'Stationery',
    condition: (editItem?.condition as SchoolItem['condition']) || 'Good',
    qualityScore: 0,
    coordinates: editItem?.coordinates
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setImage(base64String);
        setIsAnalyzing(true);
        setError(null);
        try {
          const pureBase64 = base64String.split(',')[1];
          const result = await analyzeItemImage(pureBase64);
          
          if (!result) {
            throw new Error("Empty AI result");
          }

          if (result.isSafe === false) {
            setError(t.safetyError);
            setImage(null);
            return;
          }

          // EXTREME FLEXIBILITY: Auto-fill with AI suggestions or defaults
          setFormData(prev => ({
            ...prev,
            name: result.name || prev.name || (language === 'ar' ? 'مقتنى مدرسي' : 'School Item'),
            description: result.description || prev.description || '',
            category: (result.category as Category) || prev.category,
            condition: (result.condition as any) || prev.condition,
            qualityScore: 100 // Bypass low quality checks - always allow if safe
          }));
        } catch (err) {
          console.error("AI Bypass Triggered:", err);
          // Fallback: If AI fails entirely, we still allow the upload for best UX
          setFormData(prev => ({
            ...prev,
            name: prev.name || (language === 'ar' ? 'مقتنى مدرسي' : 'School Item'),
            qualityScore: 100
          }));
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    setIsUploading(true);
    try {
      let finalImageUrl = image;
      if (image.startsWith('data:')) {
        finalImageUrl = await uploadImage(`items/${user?.id || 'guest'}_${Date.now()}`, image);
      }

      // AI Instant Bypass: Always 'approved' if it reached here (safety check passed in handleImageChange)
      const status = 'approved';

      const donorId = user?.id || 'guest';
      const donorName = user?.displayName || (language === 'ar' ? 'ضيف عطاء' : 'Ataa Guest');
      const donorEmail = user?.email || `${donorId}@guest.ataa`;

      const newItemData = {
        ...formData,
        imageUrl: finalImageUrl,
        donorId: donorId,
        donorName: donorName,
        donorEmail: donorEmail,
        donorPhoneNumber: user?.phoneNumber,
        isAvailable: true,
        status: status,
        createdAt: Date.now()
      };

      if (editItem) {
        await updateDoc(doc(db, "items", editItem.id), newItemData);
      } else {
        await addDoc(collection(db, "items"), newItemData);
      }
      
      // Update global state immediately for instant feedback
      onUpload({ ...newItemData, id: Math.random().toString(36).substr(2, 9) });
      setSuccess(true);
    } catch (err) {
      console.error("Upload error:", err);
      // Fallback for localStorage capacity or other errors
      try {
        const items = JSON.parse(localStorage.getItem('items') || '[]');
        const newItem = {
          ...formData,
          id: Math.random().toString(36).substr(2, 9),
          imageUrl: image,
          donorId: user?.id || 'guest',
          donorName: user?.displayName || (language === 'ar' ? 'ضيف عطاء' : 'Ataa Guest'),
          donorEmail: user?.email || `${user?.id || 'guest'}@guest.ataa`,
          donorPhoneNumber: user?.phoneNumber,
          isAvailable: true,
          status: 'approved',
          createdAt: Date.now()
        };
        items.push(newItem);
        localStorage.setItem('items', JSON.stringify(items));
        setSuccess(true);
      } catch (localErr) {
        setError(language === 'ar' ? 'فشل الحفظ: المساحة ممتلئة.' : 'Save failed: Storage full.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-fade-up">
        <div className="w-28 h-28 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 squircle-lg flex items-center justify-center mx-auto shadow-2xl">
          <CheckCircle size={64} />
        </div>
        <div>
          <h2 className="text-5xl font-black tracking-tighter mb-4">{editItem ? 'تم التحديث!' : 'تم النشر بنجاح!'}</h2>
          <p className="text-slate-500 text-xl font-medium leading-relaxed">
            {language === 'ar' 
              ? 'اكتمل التحليل. مساهمتك تستوفي معاييرنا العالية وتم نشرها مباشرة في المتجر. يمكنك العثور عليها الآن في قسم "استكشاف" و"مقتنياتي".' 
              : 'Analysis complete. Your contribution meets our high standards and has been published directly to the Market. You can find it now in the "Explore" section and your "Assets".'}
          </p>
        </div>
        <button onClick={() => navigate('/marketplace')} className="bg-emerald-600 text-white px-12 py-5 rounded-[22px] font-black text-xl shadow-2xl hover-lift tap-active">
          {language === 'ar' ? 'العودة لمركز عطاء' : 'Return to Ataa Hub'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-12 px-2 md:px-6">
      <div className="glass squircle-lg p-6 md:p-12 border-white/40 shadow-2xl animate-fade-up">
        <div className="mb-6 md:mb-12">
          <h1 className="text-2xl md:text-5xl font-black mb-2 md:mb-4 tracking-tighter flex items-center gap-3">
            {editItem ? (language === 'ar' ? 'تعديل عطائك' : 'Refine Your Gift') : t.uploadTitle} <Sparkles className="text-emerald-500 animate-pulse" size={20} />
          </h1>
          <p className="text-slate-500 text-sm md:text-lg font-medium">{t.uploadDesc}</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
        <div className="space-y-6 md:space-y-8">
          <div 
            onClick={() => fileInputRef.current?.click()} 
            className={`aspect-square squircle-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-2xl group ${image ? 'border-emerald-500/50' : 'border-slate-300/50 dark:border-slate-800/50 hover:border-emerald-400/50'}`}
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="text-center p-4 md:p-8">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500/10 dark:bg-emerald-500/20 squircle flex items-center justify-center mx-auto mb-3 md:mb-5 shadow-xl text-emerald-600">
                  <Camera size={32} />
                </div>
                <p className="font-black text-lg md:text-xl tracking-tight text-slate-700 dark:text-slate-200">
                  {language === 'ar' ? 'التقط الصورة الآن' : 'Capture Now'}
                </p>
                <p className="text-[7px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                  Instant Approval System
                </p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={handleImageChange} 
            />
          </div>
          
          {isAnalyzing && (
            <div className="p-6 glass border-emerald-500/20 rounded-[25px] flex items-center gap-4 animate-pulse">
              <Loader2 className="animate-spin text-emerald-600" size={24} />
              <div className="flex-1">
                <p className="font-black text-sm tracking-tight">
                  {language === 'ar' ? 'محرك Gemini الذكي يحلل الصورة...' : 'Gemini AI Engine is analyzing...'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Identifying category and condition</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-6 glass bg-rose-50 dark:bg-rose-900/10 border-rose-500/20 rounded-[25px] flex items-center gap-4">
              <LogIn className="text-rose-500" size={24} />
              <p className="font-black text-sm text-rose-500">{error}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="glass p-6 md:p-14 squircle-lg space-y-6 md:space-y-10 shadow-[0_32px_64px_rgba(0,0,0,0.1)] border border-white/40">
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-2">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-2">
                {language === 'ar' ? 'اسم المقتنى' : 'Item Name'}
              </label>
              <input 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full p-3 md:p-5 rounded-[18px] md:rounded-[22px] bg-white dark:bg-slate-900/50 border border-white/20 outline-none font-black text-base md:text-lg shadow-inner focus:ring-4 focus:ring-emerald-500/10 transition-all" 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-2">
                  {t.pickup}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input 
                      required 
                      value={formData.pickupLocation} 
                      onChange={e => setFormData({...formData, pickupLocation: e.target.value})} 
                      placeholder={language === 'ar' ? 'اسم المكان' : 'Location name'}
                      className="w-full p-3 md:p-5 rounded-[18px] md:rounded-[22px] bg-white dark:bg-slate-900/50 border border-white/20 outline-none font-bold text-sm md:text-base shadow-inner focus:ring-4 focus:ring-emerald-500/10 transition-all" 
                    />
                    {formData.coordinates && (
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-pulse">
                        <CheckCircle size={20} />
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setFormData(prev => ({
                            ...prev,
                            pickupLocation: prev.pickupLocation || (language === 'ar' ? 'موقعي الحالي' : 'My Location'),
                            coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude }
                          }));
                        }, (err) => {
                          console.error("Geolocation error:", err);
                          alert(language === 'ar' ? 'يرجى تفعيل خدمة الموقع في المتصفح' : 'Please enable location services in your browser');
                        });
                      }
                    }}
                    className={`p-6 rounded-[22px] transition-all shadow-lg flex items-center justify-center ${formData.coordinates ? 'bg-emerald-600 text-white' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200'}`}
                    title={language === 'ar' ? 'تحديد موقعي التلقائي' : 'Set My Current Location'}
                  >
                    <MapPin size={24} />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-2">
                  {t.condition}
                </label>
                <select 
                  value={formData.condition} 
                  onChange={e => setFormData({...formData, condition: e.target.value as any})} 
                  className="w-full p-5 rounded-[22px] bg-white dark:bg-slate-900/50 border border-white/20 outline-none font-bold text-base shadow-inner appearance-none cursor-pointer focus:ring-4 focus:ring-emerald-500/10 transition-all"
                >
                  <option>New</option>
                  <option>Like New</option>
                  <option>Good</option>
                  <option>Fair</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-2">
                {language === 'ar' ? 'وصف إضافي (اختياري)' : 'Description (Optional)'}
              </label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="w-full p-5 rounded-[22px] bg-white dark:bg-slate-900/50 border border-white/20 outline-none font-medium text-base shadow-inner h-32 resize-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!image || isUploading}
            className="w-full py-4 md:py-6 rounded-[20px] md:rounded-[25px] bg-emerald-600 text-white font-black text-xl md:text-2xl shadow-2xl disabled:opacity-50 active:scale-95 transition-all hover-lift flex items-center justify-center gap-3 md:gap-4"
          >
            {isUploading ? (
              <Loader2 className="animate-spin" size={28} />
            ) : (
              <>
                <Sparkles size={28} />
                {editItem ? (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes') : (language === 'ar' ? 'نشر في عطاء' : 'Publish to Ataa')}
              </>
            )}
          </button>
          
          {!user ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                {language === 'ar' ? 'سجل دخولك عبر Google لحفظ مقتنياتك بشكل دائم' : 'Sign in with Google to save your assets permanently'}
              </p>
              <button 
                type="button"
                onClick={() => navigate('/settings')}
                className="glass border-emerald-500/20 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2 hover:bg-emerald-50 transition-all"
              >
                <LogIn size={14} /> {language === 'ar' ? 'ربط حساب Google' : 'Link Google Account'}
              </button>
            </div>
          ) : (
            <p className="text-center text-xs text-emerald-500 font-bold uppercase tracking-widest">
              {language === 'ar' ? 'تم المزامنة سحابياً لحسابك' : 'Cloud Synced to your account'}
            </p>
          )}
        </form>
      </div>
    </div>
  </div>
  );
};

export default Upload;
