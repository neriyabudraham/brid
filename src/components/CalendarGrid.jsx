import React from 'react';
import { format, isSameDay, isSameMonth, addDays, startOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

const toGematria = (num) => {
  const map = {
    1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳', 6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳', 10: 'י׳',
    11: 'י״א', 12: 'י״ב', 13: 'י״ג', 14: 'י״ד', 15: 'ט״ו', 16: 'ט״ז', 17: 'י״ז', 18: 'י״ח', 19: 'י״ט', 20: 'כ׳',
    21: 'כ״א', 22: 'כ״ב', 23: 'כ״ג', 24: 'כ״ד', 25: 'כ״ה', 26: 'כ״ו', 27: 'כ״ז', 28: 'כ״ח', 29: 'כ״ט', 30: 'ל׳'
  };
  return map[num] || num;
};

export default function CalendarGrid({ currentMonth, slots, isAdmin, onSelectDate, onAdminAdd }) {
  const today = startOfDay(new Date());
  
  let startDate;
  if (isAdmin || !isSameMonth(currentMonth, today)) {
      startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  } else {
      startDate = startOfWeek(today, { weekStartsOn: 0 });
  }

  const monthEnd = endOfMonth(currentMonth);
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getDayStatus = (date) => {
    const dateStr = format(date, 'dd.MM.yy');
    const daySlots = slots.filter(s => s.date === dateStr);
    
    if (daySlots.length === 0) return { status: 'empty', label: '' };
    
    const isPast = date < today;
    const bookedCount = daySlots.filter(s => s.is_booked).length;
    const availableCount = daySlots.length - bookedCount;

    if (isAdmin && isPast) {
        if (bookedCount > 0) return { status: 'past_bookings', label: `${bookedCount} פגישות` };
        return { status: 'empty', label: '' };
    }

    if (availableCount > 0) return { status: 'available', label: `${availableCount} פנויים` };
    return { status: 'full', label: 'מלא' };
  };

  const getHebrewDate = (date) => {
      try {
          const parts = new Intl.DateTimeFormat('he-IL', { calendar: 'hebrew', day: 'numeric', month: 'long' }).formatToParts(date);
          const dayPart = parts.find(p => p.type === 'day')?.value;
          const monthPart = parts.find(p => p.type === 'month')?.value;
          const dayNum = parseInt(dayPart);
          const gematriaDay = !isNaN(dayNum) ? toGematria(dayNum) : dayPart;
          const cleanMonth = monthPart ? monthPart.replace(/^ה/, '') : '';
          return `${gematriaDay} ${cleanMonth}`;
      } catch (e) { return ''; }
  };

  return (
    <div className="grid grid-cols-7 gap-1 md:gap-3 mb-2">
      {days.map((date, i) => {
        const { status, label } = getDayStatus(date);
        
        const isPast = date < today; 
        const isToday = isSameDay(date, today);
        const isCurrentMonth = isSameMonth(date, currentMonth);
        
        const dayNum = format(date, 'd');
        const hebrewDateStr = getHebrewDate(date);

        let baseClasses = "relative h-20 md:h-24 rounded-xl md:rounded-2xl border transition-all flex flex-col items-center justify-start pt-2 cursor-pointer overflow-hidden";
        
        if (!isCurrentMonth) {
            baseClasses += " opacity-40 bg-gray-50"; 
        } else if (isPast) {
            if (isAdmin) {
                baseClasses += " bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-gray-300";
            } else {
                baseClasses += " opacity-40 bg-gray-50 cursor-default";
            }
        } else {
            baseClasses += " bg-white hover:shadow-md hover:border-rose-200";
        }

        if (isToday) {
            baseClasses += " ring-2 ring-rose-400 ring-offset-1 bg-rose-50";
        } else {
            baseClasses += " border-gray-100";
        }

        return (
          <div 
            key={i} 
            onClick={() => {
               if (isAdmin || (!isPast && status !== 'empty')) {
                   onSelectDate(date);
               } else if (isAdmin) {
                   onAdminAdd(date);
               }
            }}
            className={baseClasses}
          >
            {/* מספר לועזי */}
            <span className={`text-lg md:text-xl font-medium leading-none ${isToday ? 'text-rose-600 font-bold' : 'text-gray-700'}`}>
              {dayNum}
            </span>
            
            {/* תאריך עברי - שורה אחת, לא נשבר, פונט קטן */}
            <span className="text-[9px] md:text-[11px] text-gray-400 mt-0.5 font-sans font-normal tracking-wide whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-1">
                {hebrewDateStr}
            </span>

            {/* סטטוס - ממוקם אבסולוטית למטה כדי לא להזיז את התאריך */}
            {status !== 'empty' && (
              <div className={`
                absolute bottom-1.5 md:bottom-2
                text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap
                ${status === 'available' ? 'bg-rose-100 text-rose-600' : ''}
                ${status === 'full' ? 'bg-gray-100 text-gray-400 line-through' : ''}
                ${status === 'past_bookings' ? 'bg-slate-200 text-slate-600' : ''} 
                ${(isPast && !isAdmin) ? 'grayscale opacity-50' : ''}
              `}>
                {label}
              </div>
            )}
            
            {status === 'empty' && isAdmin && isCurrentMonth && !isPast && (
                <span className="text-[12px] text-gray-300 absolute bottom-1 select-none">+</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
