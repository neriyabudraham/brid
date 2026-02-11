import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Bot, Loader2, Minimize2 } from 'lucide-react';

export default function AiAgent({ onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'היי! אפשר להדביק פה רשימת תאריכים ושעות ואני אצור אותם (מדלגת על כפילויות). 🤖' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      
      if (data.action_performed) {
          onRefresh();
      }

    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'שגיאה בתקשורת.' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
      // Shift+Enter = שורה חדשה, Enter רגיל = שליחה
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
      }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999]" dir="rtl">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl w-80 md:w-96 border border-rose-100 overflow-hidden mb-4 flex flex-col h-[500px]"
          >
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2 font-bold"><Bot className="w-5 h-5" /> העוזרת האישית</div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><Minimize2 className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[90%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                            m.role === 'user' 
                            ? 'bg-white border text-gray-800 rounded-br-none shadow-sm' 
                            : 'bg-rose-100 text-rose-900 rounded-bl-none'
                        }`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && <div className="flex justify-end"><div className="bg-rose-50 p-3 rounded-2xl rounded-bl-none flex gap-2 items-center text-xs text-rose-400"><Loader2 className="w-3 h-3 animate-spin" /> חושבת...</div></div>}
            </div>

            <div className="p-3 bg-white border-t flex gap-2 items-end">
                <textarea 
                    className="flex-1 bg-gray-50 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200 resize-none max-h-32"
                    placeholder="הדביקי רשימת תאריכים ושעות..."
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{minHeight: '42px'}}
                />
                <button disabled={loading} onClick={handleSubmit} className="bg-rose-500 text-white p-2.5 rounded-xl hover:bg-rose-600 disabled:opacity-50 transition h-[42px] flex items-center justify-center shadow-md">
                    <Send className="w-4 h-4" />
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
          <button onClick={() => setIsOpen(true)} className="group flex items-center justify-center w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-full shadow-lg hover:shadow-rose-300/50 hover:scale-110 transition-all duration-300">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </button>
      )}
    </div>
  );
}
