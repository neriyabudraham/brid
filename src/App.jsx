import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths, isBefore, startOfMonth, startOfDay, parse } from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronRight, ChevronLeft, CalendarX, Settings, Phone, X, User, Mail, Trash2, Edit2, Clock, Plus, AlertTriangle, CheckCircle2, MapPin, XCircle, ArrowRightLeft, Save, Eraser, Info } from 'lucide-react';
import { base44 } from './api/base44Client';

import HeroSection from './components/HeroSection';
import CalendarGrid from './components/CalendarGrid';
import AdminPanel from './components/AdminPanel';
import AiAgent from './components/AiAgent';

const defaultSettings = {
  themeColor: 'rose',
  heroTitle: "קביעת פגישת ניסיון לכלות",
  heroSubtitle: "היי אהובה, איזה כיף שנפגש בקרוב! 🥰\nתבחרי את הזמן שהכי נוח לך לפגישת הנסיון.",
  heroIcon: "Sparkles",
  cards: [
    { title: "ממליצה לך להביא:", icon: "Camera", items: ["השראות לשיער", "השראות לאיפור", "תמונה של השמלה"], color: "rose" },
    { title: "חשוב לדעת:", icon: "Info", items: ["אורך הפגישה שעה", "שיער ואיפור בלבד - 30 דק'", "לבוא עם פנים נקיות"], color: "orange" }
  ],
  contactText: "יש שאלות? שלחי הודעה בווטסאפ:",
  contactPhone: "0555613997",
  webhook_url: '',
  city_list: [] 
};

// --- עזרים ---
const addMinutes = (timeStr, minutes) => {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + minutes, 0, 0);
    return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
};

const formatPhoneIL = (phone) => {
  if (!phone) return '';
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = p.substring(1);
  if (!p.startsWith('972')) p = '972' + p;
  return p;
};

// --- פירמוט ויזואלי חכם ---
const cleanAutoFillPhone = (raw) => {
    if (!raw) return '';
    let clean = raw.toString();
    clean = clean.replace(/[\s-]/g, '');
    if (clean.startsWith('+972')) clean = '0' + clean.slice(4);
    else if (clean.startsWith('972')) clean = '0' + clean.slice(3);
    return clean;
};

const formatPhoneDisplay = (value) => {
    const clean = cleanAutoFillPhone(value);
    if (!clean.startsWith('0')) return value;

    if (clean.startsWith('05') || clean.startsWith('07')) {
         if (clean.length > 3) return clean.slice(0, 3) + '-' + clean.slice(3, 10);
    } else if (clean.length > 2) { 
         return clean.slice(0, 2) + '-' + clean.slice(2, 9);
    }
    return clean.slice(0, 10);
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [slots, setSlots] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  
  const [adminDate, setAdminDate] = useState(null);
  const [addSlotForm, setAddSlotForm] = useState({ startHour: '09:00', endHour: '14:00', locationIdx: '0' });
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [editingSlot, setEditingSlot] = useState(null);
  const [editForm, setEditForm] = useState({ start: '', end: '' });

  const [managingSlot, setManagingSlot] = useState(null);
  const [moveForm, setMoveForm] = useState({ date: '', time: '' });
  
  const [clientEditForm, setClientEditForm] = useState({ name: '', phone: '', email: '' });
  const [isClientEditing, setIsClientEditing] = useState(false); 
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  const [toast, setToast] = useState(null); 
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('user') === 'admin') setIsAdmin(true);
    fetchData();
  }, []);

  useEffect(() => {
      if (toast) {
          const timer = setTimeout(() => setToast(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [toast]);

  useEffect(() => {
    if (managingSlot) {
        setClientEditForm({
            name: managingSlot.bride_name || '',
            phone: formatPhoneDisplay(managingSlot.bride_phone || ''),
            email: managingSlot.bride_email || ''
        });
        setShowDeleteOptions(false);
        setIsClientEditing(!managingSlot.bride_name);
    }
  }, [managingSlot]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchData = async () => {
    try {
      const [fetchedSlots, fetchedSettings] = await Promise.all([
        base44.entities.BookingSlot.list(),
        base44.entities.AppSettings.list()
      ]);
      setSlots(fetchedSlots.filter(s => isAdmin ? true : s.is_active !== false));
      if (fetchedSettings?.[0]) setSettings({...defaultSettings, ...fetchedSettings[0]});
    } catch (e) { console.error(e); }
  };

  const handleAdminAdd = async () => {
    if (!adminDate) return;
    const dateStr = format(adminDate, 'dd.MM.yy');
    let current = addSlotForm.startHour;
    const end = addSlotForm.endHour;
    const selectedCity = settings.city_list?.[addSlotForm.locationIdx] || { name: 'ירושלים' };
    const loc = selectedCity.name; 
    const daySlots = slots.filter(s => s.date === dateStr);
    let i = Math.max(...daySlots.map(s => s.time_order || 0), -1) + 1;

    let count = 0;
    while (current < end) {
        const next = addMinutes(current, 60);
        if (next > end && current < end) break; 
        if (current >= end) break;
        await base44.entities.BookingSlot.create({
            date: dateStr, time: `${current}-${next}`, location: loc, is_active: 1, is_booked: 0, time_order: i
        });
        current = next;
        i++;
        count++;
    }
    fetchData();
    setAdminDate(null);
    showToast(`נוצרו ${count} תורים חדשים בהצלחה`);
  };

  const openEditSlot = (slot) => {
      const [start, end] = slot.time.split('-');
      setEditingSlot(slot);
      setEditForm({ start, end });
  };

  const checkConflictAndSave = async () => {
      if (!editingSlot) return;
      const newTime = `${editForm.start}-${editForm.end}`;
      await base44.entities.BookingSlot.update(editingSlot.id, { ...editingSlot, time: newTime });
      setEditingSlot(null);
      fetchData();
      showToast('השעות עודכנו בהצלחה');
  };

  const handlePhoneChange = (e, setter) => {
      const val = e.target.value;
      const formatted = formatPhoneDisplay(val);
      setter(prev => ({...prev, phone: formatted}));
  };

  const handleBook = async () => {
      if (!form.name || form.name.length < 2) return showToast("אנא מלאי שם מלא", "error");
      if (!form.phone || form.phone.length < 9) return showToast("אנא מלאי מספר טלפון תקין", "error");

      setIsSubmitting(true);
      const fullCity = settings.city_list?.find(c => c.name === bookingSlot.location);
      const fullAddress = fullCity ? fullCity.address : bookingSlot.location;
      const bookedData = { ...form, date: bookingSlot.date, time: bookingSlot.time, location: fullAddress, id: bookingSlot.id };
      
      try {
          await base44.entities.BookingSlot.update(bookingSlot.id, {...bookingSlot, is_booked: true, ...form});
          if (settings.webhook_url) {
            fetch(settings.webhook_url, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ ...bookedData, phone: formatPhoneIL(form.phone) })
            }).catch(console.error);
          }
          setBookingSuccess(bookedData);
          setBookingSlot(null);
          setForm({name:'', phone:'', email:''});
          fetchData();
      } catch (e) { showToast("אירעה שגיאה בביצוע ההרשמה", "error"); }
      setIsSubmitting(false);
  };

  const handleCancelBooking = async () => {
      setConfirmDialog({
          title: "ביטול פגישה",
          message: "האם את בטוחה שברצונך לבטל את הפגישה? הרישום יימחק.",
          confirmText: "כן, בטלי פגישה",
          isDestructive: true,
          onConfirm: async () => {
              await base44.entities.BookingSlot.update(bookingSuccess.id, { is_booked: false, bride_name: null, bride_phone: null, bride_email: null });
              setBookingSuccess(false);
              fetchData();
              showToast("הפגישה בוטלה בהצלחה");
              setConfirmDialog(null);
          }
      });
  };

  const handleUpdateClientDetails = async () => {
      if (!managingSlot) return;
      try {
          await base44.entities.BookingSlot.update(managingSlot.id, {
              ...managingSlot,
              bride_name: clientEditForm.name,
              bride_phone: clientEditForm.phone,
              bride_email: clientEditForm.email,
              is_booked: 1
          });
          showToast("הפרטים עודכנו בהצלחה!");
          fetchData();
          setIsClientEditing(false); 
          setManagingSlot({
              ...managingSlot,
              bride_name: clientEditForm.name,
              bride_phone: clientEditForm.phone,
              bride_email: clientEditForm.email
          });
      } catch(e) { showToast("שגיאה בעדכון הפרטים", "error"); }
  };

  const handleClearBooking = async () => {
      setConfirmDialog({
          title: "ניקוי רישום",
          message: "האם את בטוחה? פרטי הכלה יימחקו והמשבצת תחזור להיות פנויה להרשמה.",
          confirmText: "נקה רישום",
          isDestructive: true,
          onConfirm: async () => {
              try {
                  await base44.entities.BookingSlot.update(managingSlot.id, {
                      ...managingSlot,
                      is_booked: false,
                      bride_name: null,
                      bride_phone: null,
                      bride_email: null,
                      booked_at: null
                  });
                  showToast("הרישום נוקה בהצלחה");
                  setManagingSlot(null);
                  fetchData();
                  setConfirmDialog(null);
              } catch(e) { console.error(e); }
          }
      });
  };

  const handleDeleteSlot = async () => {
      setConfirmDialog({
          title: "מחיקת תור",
          message: "זהירות: שעה זו תימחק לחלוטין מלוח השנה ולא תהיה זמינה יותר.",
          confirmText: "מחק תור",
          isDestructive: true,
          onConfirm: async () => {
              try {
                  await base44.entities.BookingSlot.delete(managingSlot.id);
                  showToast("התור נמחק");
                  setManagingSlot(null);
                  fetchData();
                  setConfirmDialog(null);
              } catch(e) { console.error(e); }
          }
      });
  };

  const handleMoveAppointment = async () => {
      if (!managingSlot || !moveForm.date || !moveForm.time) return;
      const dateStr = format(new Date(moveForm.date), 'dd.MM.yy');
      
      setConfirmDialog({
          title: "הזזת פגישה",
          message: `להעביר את ${clientEditForm.name || managingSlot.bride_name} לתאריך ${dateStr} בשעה ${moveForm.time}?`,
          confirmText: "אשרי הזזה",
          onConfirm: async () => {
              const endTime = addMinutes(moveForm.time, 60);
              const fullTime = `${moveForm.time}-${endTime}`;
              try {
                  await base44.entities.BookingSlot.update(managingSlot.id, {
                      ...managingSlot,
                      date: dateStr,
                      time: fullTime,
                      bride_name: clientEditForm.name, 
                      bride_phone: clientEditForm.phone,
                      bride_email: clientEditForm.email
                  });
                  showToast("הפגישה הוזזה בהצלחה");
                  setManagingSlot(null);
                  setMoveForm({ date: '', time: '' });
                  fetchData();
                  setConfirmDialog(null);
              } catch (e) {
                  showToast("שגיאה בהזזת הפגישה", "error");
                  console.error(e);
              }
          }
      });
  };

  const selectedDaySlots = selectedDate ? slots.filter(s => s.date === format(selectedDate, 'dd.MM.yy')) : [];
  const isSelectedDatePast = selectedDate && isBefore(selectedDate, startOfDay(new Date()));
  
  // סינון לתצוגה: מנהל+עבר = רק תפוסים
  const displaySlots = selectedDaySlots.filter(s => {
      if (!isAdmin) return true; 
      if (isAdmin && isSelectedDatePast) {
          return s.is_booked;
      }
      return true;
  });

  const cityOptions = settings.city_list && settings.city_list.length > 0 ? settings.city_list : (settings.available_cities || []).map(c => ({ name: c, address: c }));

  return (
    <div className="min-h-screen bg-[#fff1f2] pb-20 font-sans text-gray-800" dir="rtl">
        {isAdmin && <AiAgent onRefresh={fetchData} />}
        {isAdmin && <button onClick={() => setShowAdmin(true)} className="fixed top-4 left-4 z-50 bg-gray-900 text-white px-5 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-black transition-all hover:scale-105"><Settings className="w-4 h-4"/> ניהול אתר</button>}
        
        <div className="max-w-4xl mx-auto pt-12 px-4">
            {!selectedDate && !bookingSuccess && <HeroSection settings={settings} />}

            {!bookingSuccess && (
                <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-rose-100/50 mb-12 border border-white">
                      {!selectedDate && (
                          <div className="flex justify-between items-center mb-8">
                             <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 hover:bg-rose-50 rounded-full text-rose-600 transition"><ChevronRight/></button>
                             <h2 className="text-2xl font-bold text-gray-800">
                                 {format(currentMonth, 'MMMM yyyy', {locale: he})}
                             </h2>
                             <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 hover:bg-rose-50 rounded-full text-rose-600 transition"><ChevronLeft/></button>
                          </div>
                      )}
                      
                      {!selectedDate && (
                          <>
                             <div className="grid grid-cols-7 text-center mb-4 text-gray-400 text-sm font-medium">
                                 {['א','ב','ג','ד','ה','ו','ש'].map(d=><div key={d}>{d}</div>)}
                             </div>
                             <CalendarGrid 
                                 currentMonth={currentMonth} 
                                 slots={slots} 
                                 isAdmin={isAdmin} 
                                 onSelectDate={setSelectedDate} 
                                 onAdminAdd={setAdminDate} 
                             />
                          </>
                      )}
                </div>
            )}
        </div>

        {/* --- TOAST --- */}
        <AnimatePresence>
            {toast && (
                <motion.div 
                    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} 
                    className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-900 text-white'}`}
                >
                    {toast.type === 'error' ? <AlertTriangle className="w-5 h-5"/> : <CheckCircle2 className="w-5 h-5"/>}
                    {toast.message}
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- CONFIRM DIALOG --- */}
        {confirmDialog && (
            <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
                <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmDialog.isDestructive ? 'bg-red-100 text-red-500' : 'bg-rose-100 text-rose-500'}`}>
                        {confirmDialog.isDestructive ? <Trash2 className="w-7 h-7"/> : <Info className="w-7 h-7"/>}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{confirmDialog.title}</h3>
                    <p className="text-gray-500 mb-6 text-sm">{confirmDialog.message}</p>
                    <div className="flex gap-3">
                        <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200">ביטול</button>
                        <button onClick={confirmDialog.onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-white ${confirmDialog.isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-900 hover:bg-black'}`}>
                            {confirmDialog.confirmText || "אישור"}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}

        <AnimatePresence>
            {selectedDate && (
                <motion.div initial={{y: '100%'}} animate={{y: 0}} exit={{y: '100%'}} transition={{type:"spring", damping: 25}} className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md overflow-y-auto">
                    <div className="max-w-3xl mx-auto min-h-screen relative p-6">
                        <button onClick={() => setSelectedDate(null)} className="fixed top-6 right-6 p-3 bg-gray-100 rounded-full hover:bg-gray-200 z-50"><X/></button>
                        <div className="mt-12 mb-8 text-center">
                            <h2 className="text-4xl font-bold text-gray-800 mb-2">{format(selectedDate, 'eeee', {locale:he})}</h2>
                            <p className="text-xl text-gray-500">{format(selectedDate, 'd בMMMM yyyy', {locale:he})}</p>
                        </div>
                        <div className="grid gap-4">
                            {/* רשימת התורים המסוננת */}
                            {displaySlots.length === 0 && isSelectedDatePast && isAdmin && (
                                <div className="text-center py-10 text-gray-400">לא היו פגישות בתאריך זה</div>
                            )}

                            {displaySlots.sort((a,b) => a.time.localeCompare(b.time)).map(slot => (
                                <div key={slot.id} onClick={() => { if (isAdmin && slot.is_booked) setManagingSlot(slot); else if (!slot.is_booked && !isAdmin) setBookingSlot(slot); }}
                                    className={`p-6 rounded-2xl border transition-all flex justify-between items-center group ${slot.is_booked ? (isAdmin ? 'bg-rose-50 border-rose-200 cursor-pointer' : 'bg-gray-50 border-gray-100 opacity-60 grayscale cursor-not-allowed') : 'bg-white border-rose-100 shadow-sm hover:border-rose-300 hover:shadow-md cursor-pointer'}`}>
                                    <div className="flex items-center gap-6">
                                        <span className="text-3xl font-bold text-rose-500">{slot.time}</span>
                                        <div className="flex flex-col">
                                            {/* הצגת פרטים שונה לעתיד ולעבר */}
                                            {isSelectedDatePast && isAdmin ? (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800">{slot.bride_name || 'ללא שם'}</span>
                                                    <span className="text-xs text-gray-500">{formatPhoneDisplay(slot.bride_phone)}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">סטטוס</span>
                                                    {slot.is_booked ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-800">{isAdmin ? (slot.bride_name || 'תפוס') : 'נתפס'}</span>
                                                            {isAdmin && <span className="text-xs text-gray-500">{formatPhoneDisplay(slot.bride_phone)}</span>}
                                                        </div>
                                                    ) : <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md w-fit font-medium">פנוי להרשמה</span>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {/* כפתורי פעולה למנהל - רק בעתיד */}
                                    {isAdmin && !slot.is_booked && !isSelectedDatePast && <div className="flex gap-2"><button onClick={(e)=>{e.stopPropagation(); openEditSlot(slot)}} className="text-blue-400 p-3 hover:bg-blue-50 rounded-full"><Edit2 className="w-5 h-5"/></button><button onClick={(e)=>{e.stopPropagation(); setManagingSlot(slot)}} className="text-red-400 p-3 hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5"/></button></div>}
                                    {isAdmin && slot.is_booked && <button className="bg-rose-200 text-rose-700 px-3 py-1 rounded-full text-xs font-bold">ניהול</button>}
                                </div>
                            ))}
                            {/* כפתור הוספה - רק אם זה לא עבר */}
                            {isAdmin && !isSelectedDatePast && <button onClick={() => setAdminDate(selectedDate)} className="mt-8 w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:border-rose-400 font-bold flex items-center justify-center gap-2"><Plus/> הוספת תורים</button>}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {showAdmin && <AdminPanel settings={settings} onClose={() => setShowAdmin(false)} onSave={(s) => {base44.entities.AppSettings.create(s).then(()=>{setSettings(s); setShowAdmin(false); showToast("הגדרות נשמרו")})}} />}
        
        {/* Modal: ניהול לקוחה קיימת */}
        {managingSlot && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setManagingSlot(null)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"><X /></button>
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">👰</div>
                        <h3 className="text-xl font-bold text-gray-800">ניהול פגישה</h3>
                        <p className="text-sm text-gray-500">{managingSlot.date} | {managingSlot.time}</p>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-2xl mb-6 border border-gray-100 relative">
                        {managingSlot.is_booked ? (
                            <>
                                <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-gray-700 text-sm flex items-center gap-2"><User className="w-4 h-4"/> פרטי הכלה</h4>{!isClientEditing && <button onClick={() => setIsClientEditing(true)} className="text-rose-500 hover:bg-rose-100 p-2 rounded-full transition"><Edit2 className="w-4 h-4"/></button>}</div>
                                {isClientEditing ? (
                                    <div className="space-y-3">
                                        <input className="w-full border p-2 rounded-xl" value={clientEditForm.name} onChange={e => setClientEditForm({...clientEditForm, name: e.target.value})} placeholder="שם מלא" autoComplete="name" />
                                        <input className="w-full border p-2 rounded-xl" value={clientEditForm.phone} onChange={e => handlePhoneChange(e, setClientEditForm)} placeholder="טלפון" autoComplete="tel" dir="ltr" />
                                        <input className="w-full border p-2 rounded-xl" value={clientEditForm.email} onChange={e => setClientEditForm({...clientEditForm, email: e.target.value})} placeholder="מייל" autoComplete="email" />
                                        <div className="flex gap-2 mt-2"><button onClick={() => setIsClientEditing(false)} className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-lg font-bold text-sm">ביטול</button><button onClick={handleUpdateClientDetails} className="flex-1 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4"/> שמור</button></div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 text-sm text-gray-700">
                                        <div className="flex justify-between border-b pb-2"><span className="text-gray-400">שם:</span><span className="font-bold">{clientEditForm.name || '-'}</span></div>
                                        <div className="flex justify-between border-b pb-2"><span className="text-gray-400">טלפון:</span><span className="font-mono text-lg" dir="ltr">{clientEditForm.phone || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-400">מייל:</span><span>{clientEditForm.email || '-'}</span></div>
                                    </div>
                                )}
                            </>
                        ) : <div className="text-center text-gray-500 py-4">תור זה פנוי וריק</div>}
                    </div>
                    {managingSlot.is_booked && (
                        <div className="border-t pt-4">
                            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm"><ArrowRightLeft className="w-4 h-4"/> הזזה למועד אחר</h4>
                            <div className="flex gap-3 mb-4">
                                <input type="date" className="flex-1 border p-2 rounded-lg" onChange={e => setMoveForm({...moveForm, date: e.target.value})} />
                                <input type="time" className="flex-1 border p-2 rounded-lg" onChange={e => setMoveForm({...moveForm, time: e.target.value})} />
                            </div>
                            <button onClick={handleMoveAppointment} disabled={!moveForm.date || !moveForm.time} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg">שמירת שינויים והזזה</button>
                        </div>
                    )}
                    <div className="border-t pt-3 mt-2">
                         {!showDeleteOptions ? (
                             <div className="flex justify-between items-center cursor-pointer hover:bg-red-50 p-2 rounded-lg transition" onClick={() => setShowDeleteOptions(true)}>
                                 <span className="text-xs text-gray-400">מחיקה וניהול משבצת</span><div className="text-red-400 bg-red-50 p-2 rounded-full"><Trash2 className="w-4 h-4"/></div>
                             </div>
                         ) : (
                             <div className="bg-red-50 p-4 rounded-xl space-y-2">
                                 {managingSlot.is_booked && <button onClick={handleClearBooking} className="w-full text-right px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-medium flex items-center gap-2"><Eraser className="w-4 h-4"/> נקה פרטים</button>}
                                 <button onClick={handleDeleteSlot} className="w-full text-right px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"><Trash2 className="w-4 h-4"/> מחק לגמרי</button>
                                 <button onClick={() => setShowDeleteOptions(false)} className="w-full text-center text-xs text-gray-400 mt-2">ביטול</button>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        )}

        {/* Modal: הוספת רצף תורים (Admin) */}
        {adminDate && (
             <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">הוספת רצף תורים ({format(adminDate, 'dd/MM')})</h3>
                    <div className="space-y-3">
                        <input className="w-full border p-2 rounded-lg" type="time" value={addSlotForm.startHour} onChange={e=>setAddSlotForm({...addSlotForm, startHour:e.target.value})} />
                        <input className="w-full border p-2 rounded-lg" type="time" value={addSlotForm.endHour} onChange={e=>setAddSlotForm({...addSlotForm, endHour:e.target.value})} />
                        <select className="w-full border p-2 rounded-lg" value={addSlotForm.locationIdx} onChange={e=>setAddSlotForm({...addSlotForm, locationIdx:e.target.value})}>{cityOptions.map((c, i) => <option key={i} value={i}>{c.name}</option>)}</select>
                        <div className="flex gap-2 mt-4"><button onClick={()=>setAdminDate(null)} className="flex-1 py-2 bg-gray-100 rounded-lg font-medium text-gray-600">ביטול</button><button onClick={handleAdminAdd} className="flex-1 py-2 bg-rose-600 text-white rounded-lg font-bold shadow-lg">צור תורים</button></div>
                    </div>
                </div>
             </div>
        )}

        {/* Modal: הרשמה (User) */}
        {bookingSlot && (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
                    <h3 className="text-2xl font-bold mb-6">הרשמה לפגישה</h3>
                    <div className="space-y-4">
                        <input className="w-full border p-3 rounded-xl" placeholder="שם מלא" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoComplete="name" />
                        <input className="w-full border p-3 rounded-xl" placeholder="טלפון" value={form.phone} onChange={e=>handlePhoneChange(e, setForm)} dir="ltr" autoComplete="tel" />
                        <input className="w-full border p-3 rounded-xl" placeholder="מייל" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} autoComplete="email" />
                        <button onClick={handleBook} disabled={isSubmitting} className="w-full py-4 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-lg">{isSubmitting?'...':'אשרי'}</button>
                    </div>
                    <button onClick={()=>setBookingSlot(null)} className="w-full mt-4 text-gray-400">ביטול</button>
                </div>
            </div>
        )}
        
        {/* Modal: אישור הרשמה */}
        {bookingSuccess && (
            <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center p-6 overflow-y-auto">
                <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="text-center max-w-md w-full">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><CheckCircle2 className="w-12 h-12 text-green-600" /></div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">איזה כיף, נרשמת בהצלחה!</h2>
                    <p className="text-gray-600 mb-8">שריינתי לך את התור לפגישת הניסיון.</p>
                    <div className="bg-gray-50 p-6 rounded-3xl mb-8 border border-gray-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-3"><span className="text-gray-500">תאריך</span><span className="font-bold text-lg">{bookingSuccess.date}</span></div>
                        <div className="flex justify-between items-center border-b border-gray-200 pb-3"><span className="text-gray-500">שעה</span><span className="font-bold text-lg">{bookingSuccess.time}</span></div>
                        <div className="text-right"><span className="text-gray-500 text-sm block mb-1">מיקום וכתובת</span><span className="font-bold text-rose-600 block leading-tight">{bookingSuccess.location}</span></div>
                    </div>
                    <div className="space-y-3">
                        <p className="text-sm text-gray-400">צריכה לשנות משהו? שלחי לי הודעה בווטסאפ.</p>
                        <button onClick={handleCancelBooking} className="text-red-400 hover:text-red-600 text-sm font-medium flex items-center justify-center gap-1 mx-auto hover:bg-red-50 px-4 py-2 rounded-full transition"><XCircle className="w-4 h-4" /> ביטול הפגישה ומחיקת הרישום</button>
                    </div>
                </motion.div>
            </div>
        )}

        {/* Modal: עריכת זמן (Admin) */}
        {editingSlot && (
            <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">עריכת שעות פגישה</h3>
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1"><label className="text-xs font-bold text-gray-500">התחלה</label><input type="time" className="w-full border p-2 rounded-lg" value={editForm.start} onChange={e=>setEditForm({...editForm, start:e.target.value})} /></div>
                        <div className="flex-1"><label className="text-xs font-bold text-gray-500">סיום</label><input type="time" className="w-full border p-2 rounded-lg" value={editForm.end} onChange={e=>setEditForm({...editForm, end:e.target.value})} /></div>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={()=>setEditingSlot(null)} className="flex-1 py-2 bg-gray-100 rounded-lg font-medium text-gray-600">ביטול</button>
                         <button onClick={checkConflictAndSave} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200">שמור</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
