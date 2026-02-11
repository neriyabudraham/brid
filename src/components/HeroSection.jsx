import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

const DynamicIcon = ({ name, className }) => {
  const IconComponent = Icons[name] || Icons.Sparkles;
  return <IconComponent className={className} />;
};

export default function HeroSection({ settings }) {
  const colorMap = {
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    gold: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    sage: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  
  const theme = colorMap[settings.themeColor] || colorMap.rose;

  return (
    <div className="relative mb-10 text-center">
      <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} transition={{duration:0.6}}>
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-xl mb-6 rotate-3 border-4 border-white ${theme}`}>
           <DynamicIcon name={settings.heroIcon} className="w-12 h-12" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 tracking-tight leading-tight">
          {settings.heroTitle}
        </h1>
        <p className="text-xl text-gray-500 whitespace-pre-line max-w-2xl mx-auto leading-relaxed">
          {settings.heroSubtitle}
        </p>
      </motion.div>
      <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-5xl mx-auto text-right">
        {settings.cards?.map((card, i) => (
           <motion.div key={i} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.2}} 
             className="bg-white/90 backdrop-blur-sm p-8 rounded-[2rem] shadow-sm border border-white hover:border-rose-100 hover:shadow-md transition-all">
             <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50">
               <div className={`p-3 rounded-2xl ${card.color === 'rose' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
                 <DynamicIcon name={card.icon} className="w-6 h-6"/>
               </div>
               <h3 className="font-bold text-xl text-gray-800">{card.title}</h3>
             </div>
             <ul className="space-y-3">
               {card.items.map((item, idx) => (
                 <li key={idx} className="flex items-start gap-3 text-gray-600 text-base">
                   <span className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${card.color === 'rose' ? 'bg-rose-400' : 'bg-orange-400'}`}></span>
                   {item}
                 </li>
               ))}
             </ul>
           </motion.div>
        ))}
      </div>
    </div>
  );
}
