import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

const colors = [
    { id: 'rose', name: 'ורוד עדין', hex: '#f43f5e' },
    { id: 'gold', name: 'זהב יוקרתי', hex: '#d97706' },
    { id: 'purple', name: 'לילך', hex: '#a855f7' },
    { id: 'blue', name: 'שמיים', hex: '#3b82f6' },
    { id: 'sage', name: 'מרווה', hex: '#10b981' }
];

const icons = ['Sparkles', 'Heart', 'Crown', 'Gem', 'Star', 'Flower', 'Feather'];

export default function AdminPanel({ settings, onClose, onSave }) {
  const initialCities = settings.city_list || (settings.available_cities || []).map(c => ({ name: c, address: `${c}, כתובת תעודכן בקרוב` }));
  const [formData, setFormData] = useState({ ...settings, city_list: initialCities });
  const [tab, setTab] = useState('design');

  const DynamicIcon = ({ name }) => { const I = Icons[name] || Icons.Star; return <I className="w-5 h-5"/>; };
  const handleCityChange = (idx, field, value) => { const newCities = [...formData.city_list]; newCities[idx][field] = value; setFormData({ ...formData, city_list: newCities }); };
  const addCity = () => { setFormData({ ...formData, city_list: [...formData.city_list, { name: '', address: '' }] }); };
  const removeCity = (idx) => { const newCities = formData.city_list.filter((_, i) => i !== idx); setFormData({ ...formData, city_list: newCities }); };

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/20">
        <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-xl flex items-center gap-2 text-gray-800"><Icons.Settings className="w-5 h-5 text-rose-600"/> עריכת האתר</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><Icons.X className="w-5 h-5"/></button>
        </div>
        <div className="flex border-b bg-white overflow-x-auto">
            {['design', 'content', 'locations', 'general', 'automation'].map(t => (
                <button key={t} onClick={() => setTab(t)} className={`flex-1 py-4 px-4 font-medium whitespace-nowrap transition-colors ${tab===t ? 'text-rose-600 border-b-2 border-rose-600 bg-rose-50/50' : 'text-gray-500 hover:bg-gray-50'}`}>
                    {t==='design'?'עיצוב':t==='content'?'תוכן':t==='locations'?'ערים':t==='general'?'כללי':'אוטומציה ו-AI'}
                </button>
            ))}
        </div>
        <div className="p-8 overflow-y-auto flex-1 bg-[#f8fafc]">
            {tab === 'locations' && (
                <div className="space-y-6">
                    <div className="space-y-3">
                        {formData.city_list.map((city, idx) => (
                            <div key={idx} className="flex gap-3 items-start bg-white p-4 rounded-xl border shadow-sm">
                                <div className="flex-1"><label className="text-xs font-bold text-gray-500 mb-1 block">שם העיר</label><input className="w-full border p-2 rounded-lg" value={city.name} onChange={(e) => handleCityChange(idx, 'name', e.target.value)} /></div>
                                <div className="flex-[2]"><label className="text-xs font-bold text-gray-500 mb-1 block">כתובת מלאה</label><input className="w-full border p-2 rounded-lg" value={city.address} onChange={(e) => handleCityChange(idx, 'address', e.target.value)} /></div>
                                <button onClick={() => removeCity(idx)} className="mt-6 p-2 text-red-400 hover:bg-red-50 rounded-full"><Icons.Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addCity} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-rose-400 font-bold flex items-center justify-center gap-2"><Icons.Plus className="w-5 h-5" /> הוספת עיר</button>
                </div>
            )}
            {tab === 'design' && (
                <div className="space-y-8">
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Icons.Palette className="w-4 h-4 text-rose-500"/> צבע ראשי</h3>
                        <div className="flex gap-4 flex-wrap">
                            {colors.map(c => (
                                <button key={c.id} onClick={() => setFormData({...formData, themeColor: c.id})} className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${formData.themeColor === c.id ? 'border-gray-800 bg-gray-50' : 'border-transparent hover:bg-white'}`}>
                                    <div className="w-12 h-12 rounded-full shadow-md" style={{backgroundColor: c.hex}}></div><span className="text-xs font-medium text-gray-600">{c.name}</span>{formData.themeColor === c.id && <Icons.CheckCircle2 className="w-5 h-5 text-gray-800 absolute -top-2 -right-2 bg-white rounded-full"/>}
                                </button>
                            ))}
                        </div>
                    </section>
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Icons.Star className="w-4 h-4 text-rose-500"/> אייקון כותרת</h3>
                        <div className="grid grid-cols-7 gap-3">
                            {icons.map(icon => (
                                <button key={icon} onClick={() => setFormData({...formData, heroIcon: icon})} className={`p-3 rounded-xl border-2 flex items-center justify-center transition-all ${formData.heroIcon === icon ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-100 hover:border-gray-300'}`}><DynamicIcon name={icon} /></button>
                            ))}
                        </div>
                    </section>
                </div>
            )}
            {tab === 'content' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <label className="block font-bold text-gray-700">כותרת ראשית</label><input className="w-full border p-3 rounded-xl" value={formData.heroTitle} onChange={e=>setFormData({...formData, heroTitle: e.target.value})} />
                        <label className="block font-bold text-gray-700">טקסט פתיחה</label><textarea className="w-full border p-3 rounded-xl h-24" value={formData.heroSubtitle} onChange={e=>setFormData({...formData, heroSubtitle: e.target.value})} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {formData.cards.map((card, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 relative">
                                <div className="flex gap-2"><input className="font-bold border-b border-dashed flex-1 py-1" value={card.title} onChange={e=>{const newCards = [...formData.cards]; newCards[idx].title = e.target.value; setFormData({...formData, cards: newCards});}} /></div>
                                <div className="space-y-2">{card.items.map((item, itemIdx) => (<input key={itemIdx} className="w-full text-sm border p-2 rounded-lg bg-gray-50" value={item} onChange={e=>{const newCards = [...formData.cards]; newCards[idx].items[itemIdx] = e.target.value; setFormData({...formData, cards: newCards});}} />))}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {tab === 'general' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                     <div><label className="block font-bold text-sm mb-2 text-gray-600">מספר טלפון (וואטסאפ)</label><input className="w-full border p-3 rounded-xl ltr" dir="ltr" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} /></div>
                     <div><label className="block font-bold text-sm mb-2 text-gray-600">טקסט ליד הטלפון</label><input className="w-full border p-3 rounded-xl" value={formData.contactText} onChange={e => setFormData({...formData, contactText: e.target.value})} /></div>
                     <div className="pt-4 border-t"><label className="block font-bold text-sm mb-2 text-gray-600">Webhook URL</label><input className="w-full border p-3 rounded-xl bg-gray-50 font-mono text-xs" dir="ltr" value={formData.webhook_url} onChange={e => setFormData({...formData, webhook_url: e.target.value})} /></div>
                </div>
            )}
            {tab === 'automation' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                     <div className="bg-purple-50 p-4 rounded-xl text-sm text-purple-800 border border-purple-100 mb-4">הגדרות עבור סוכן הבינה המלאכותית (הצ'אט) ועבור תזכורות אוטומטיות.</div>
                     
                     <div className="bg-white p-4 border-2 border-purple-100 rounded-xl">
                        <label className="block font-bold text-sm mb-2 text-purple-700">OpenAI API Key (עבור הצ'אט החכם)</label>
                        <input className="w-full border p-3 rounded-xl bg-gray-50 text-xs font-mono" type="password" value={formData.openaiKey || ''} onChange={e => setFormData({...formData, openaiKey: e.target.value})} placeholder="sk-..." />
                     </div>

                     <div className="grid md:grid-cols-2 gap-4">
                         <div><label className="block font-bold text-sm mb-2">Botomat API Key</label><input className="w-full border p-3 rounded-xl bg-gray-50 text-xs" value={formData.botomatKey || ''} onChange={e => setFormData({...formData, botomatKey: e.target.value})} /></div>
                         <div><label className="block font-bold text-sm mb-2">Session ID</label><input className="w-full border p-3 rounded-xl bg-gray-50 text-xs" value={formData.botomatSession || ''} onChange={e => setFormData({...formData, botomatSession: e.target.value})} /></div>
                     </div>
                     <div><label className="block font-bold text-sm mb-2">שעת שליחת תזכורות</label><input type="time" className="w-full border p-3 rounded-xl" value={formData.dailySummaryTime || '20:00'} onChange={e => setFormData({...formData, dailySummaryTime: e.target.value})} /></div>
                     <div><label className="block font-bold text-sm mb-2">ניסוח הודעה</label><textarea className="w-full border p-3 rounded-xl h-24 text-sm" value={formData.dailySummaryTemplate || "היי {name}, מחכה לך מחר בשעה {time}..."} onChange={e => setFormData({...formData, dailySummaryTemplate: e.target.value})} /></div>
                </div>
            )}
        </div>
        <div className="p-5 border-t bg-white flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors">ביטול</button>
            <button onClick={() => onSave(formData)} className="px-8 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center gap-2"><Icons.Save className="w-4 h-4" /> שמירת שינויים</button>
        </div>
      </div>
    </div>
  );
}
