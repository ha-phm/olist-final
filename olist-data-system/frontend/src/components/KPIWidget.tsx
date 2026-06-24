import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

interface KPIWidgetProps {
  id?: string;
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: number; // percentage value e.g. +14.8
  color?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
}

export default function KPIWidget({
  id,
  title,
  value,
  icon: Icon,
  subtext,
  trend,
  color = 'indigo'
}: KPIWidgetProps) {
  
  const colorsMap = {
    indigo: {
      bg: 'bg-indigo-50 border-indigo-100',
      icon: 'text-indigo-600 bg-indigo-100',
      glow: 'shadow-indigo-100/50'
    },
    emerald: {
      bg: 'bg-emerald-50 border-emerald-100',
      icon: 'text-emerald-600 bg-emerald-100',
      glow: 'shadow-emerald-100/50'
    },
    amber: {
      bg: 'bg-amber-50 border-amber-100',
      icon: 'text-amber-600 bg-amber-100',
      glow: 'shadow-amber-100/50'
    },
    blue: {
      bg: 'bg-blue-50 border-blue-100',
      icon: 'text-blue-600 bg-blue-100',
      glow: 'shadow-blue-100/50'
    },
    rose: {
      bg: 'bg-rose-50 border-rose-100',
      icon: 'text-rose-600 bg-rose-100',
      glow: 'shadow-rose-100/50'
    },
    slate: {
      bg: 'bg-slate-50 border-slate-100',
      icon: 'text-slate-600 bg-slate-100',
      glow: 'shadow-slate-100/50'
    }
  };

  const selectedCol = colorsMap[color] || colorsMap.indigo;

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={`bg-white border border-slate-100 p-4 sm:p-5 lg:p-4 xl:p-6 rounded-2xl flex items-start gap-2.5 sm:gap-3 xl:gap-4 shadow-sm hover:shadow-md transition-all ${selectedCol.glow}`}
    >
      <div className={`p-2 sm:p-2.5 xl:p-3 rounded-xl ${selectedCol.icon} shrink-0`}>
        <Icon className="w-4 h-4 sm:w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[10px] xl:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 leading-tight break-words">
          {title}
        </p>
        <h3 className="font-sans font-black text-sm sm:text-base lg:text-base xl:text-2xl text-slate-800 tracking-tight leading-tight mb-1.5 break-words">
          {value}
        </h3>
        
        <div className="flex flex-wrap items-center gap-1.5">
          {trend !== undefined && (
            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] xl:text-[10px] font-extrabold shrink-0 ${
              trend >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {trend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              <span>{trend >= 0 ? `+${trend}%` : `${trend}%`}</span>
            </div>
          )}
          {subtext && (
            <span className="text-[9px] xl:text-[10px] text-slate-400 font-medium leading-tight break-words">
              {subtext}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
