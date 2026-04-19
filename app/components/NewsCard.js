'use client';
import { motion } from 'framer-motion';
import { ExternalLink, Clock, Sparkles } from 'lucide-react';

export default function NewsCard({ article, onClick, isSelected, onSelect, hasSummary }) {
  const formattedDate = new Date(article.pubDate).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`relative glass card-hover rounded-[2rem] overflow-hidden flex flex-col h-full cursor-pointer group shadow-xl transition-all duration-300 ${
        isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-500/5' : ''
      }`}
      onClick={() => onClick(article)}
    >
      {/* Selection Overlay */}
      <div 
        className="absolute top-4 right-4 z-20"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(article.id);
        }}
      >
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/40' : 'bg-black/40 border-white/20 backdrop-blur-md group-hover:border-white/40'
        }`}>
          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
        </div>
      </div>
      {/* Thumbnail */}
      <div className="relative h-56 w-full overflow-hidden">
        <img
          src={article.thumbnail}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1504711432869-efd597cdd042?q=80&w=800&auto=format&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
        <div className="absolute top-4 left-4">
          <span 
            className="px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 backdrop-blur-md border border-white/10"
            style={{ backgroundColor: article.sourceColor + '99', color: 'white' }}
          >
            <span>{article.sourceIcon}</span>
            {article.sourceName}
          </span>
        </div>

        {/* AI Summary Indicator */}
        {hasSummary && (
          <div className="absolute bottom-4 right-4 z-20">
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 flex items-center gap-2"
            >
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-tighter">AI Ready</span>
            </motion.div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 mb-4 uppercase tracking-widest">
          <Clock size={12} className="text-indigo-400" />
          {formattedDate}
        </div>
        
        <h3 className="text-xl font-bold mb-4 line-clamp-2 leading-[1.4] font-heading group-hover:text-indigo-300 transition-colors">
          {article.title}
        </h3>
        
        <p className="text-[15px] text-slate-400 line-clamp-3 mb-6 flex-grow leading-relaxed font-light">
          {article.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-5 border-t border-white/5">
          <span className="text-sm font-semibold text-indigo-400 flex items-center gap-2 group-hover:gap-3 transition-all">
            Đọc bài viết <ExternalLink size={14} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
