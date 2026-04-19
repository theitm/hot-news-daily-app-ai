'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Volume2, Loader2, ExternalLink, Pause } from 'lucide-react';
import axios from 'axios';

export default function ArticleModal({ article, onClose, initialSummary, onSummaryGenerated }) {
  const [summary, setSummary] = useState(initialSummary || '');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSummarize = async () => {
    if (isSummarizing || summary) return;
    setIsSummarizing(true);
    
    // Get custom config from localStorage
    const savedConfig = localStorage.getItem('ai-news-config-v2') || localStorage.getItem('ai-news-config');
    const config = savedConfig ? JSON.parse(savedConfig) : null;
    
    // Rotation logic: Pick random key and random model if lists exist
    let apiConfig = null;
    if (config) {
      if (config.apiKeys && config.apiKeys.length > 0 && config.models && config.models.length > 0) {
        const randomKey = config.apiKeys[Math.floor(Math.random() * config.apiKeys.length)];
        const randomModel = config.models[Math.floor(Math.random() * config.models.length)];
        apiConfig = {
          apiUrl: config.apiUrl,
          apiKey: randomKey,
          model: randomModel
        };
      } else {
        apiConfig = {
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
          model: config.model
        };
      }
    }

    try {
      const response = await axios.post('/api/ai/summarize', {
        text: article.description,
        title: article.title,
        config: apiConfig
      });
      setSummary(response.data.summary);
      if (onSummaryGenerated) {
        onSummaryGenerated(article.id, response.data.summary);
      }
    } catch (error) {
      alert('Không thể tóm tắt bài viết.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleTTS = async () => {
    if (isGeneratingAudio) return;
    
    // Check if we already have audio for the CURRENT state (summary or full)
    // If summary exists but audio was generated for full text, we need to re-generate
    if (audioUrl) {
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
      else { audioRef.current.play(); setIsPlaying(true); }
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const textToRead = summary ? `Sau đây là bản tóm tắt tin tức: ${summary}` : `${article.title}. ${article.description}`;
      const response = await axios.post('/api/tts', { text: textToRead }, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      setAudioUrl(url);
    } catch (error) {
      alert('Không thể tạo âm thanh.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Reset audio when summary is generated to ensure next click reads the summary
  useEffect(() => {
    if (summary) {
      setAudioUrl(null);
      setIsPlaying(false);
    }
  }, [summary]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full h-full md:max-w-4xl md:h-[90vh] bg-black md:rounded-[2.5rem] overflow-hidden flex flex-col border-0 md:border md:border-white/10 shadow-2xl">
        
        {/* Close Button - Always on top */}
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 z-[1001] p-2 md:p-2.5 rounded-full bg-black/60 text-white hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md">
          <X size={24} />
        </button>

        {/* Header Image - Fixed Height */}
        <div className="relative w-full h-48 md:h-64 shrink-0 overflow-hidden border-b border-white/5">
          <img src={article.thumbnail} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 md:left-8">
             <span className="px-3 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-2xl">
               {article.sourceName}
             </span>
          </div>
        </div>

        {/* Content Area - SCROLLABLE & OPAQUE */}
        <div className="flex-grow overflow-y-auto bg-black custom-scrollbar pb-20 md:pb-0">
          <div className="p-6 md:p-12">
            {/* Title - With Indigo Accent */}
            <div className="mb-8 md:mb-10 relative">
              <div className="absolute -left-12 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-full hidden md:block" />
              <h1 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tight">
                {article.title}
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-medium mt-3 md:mt-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-500" />
                Cập nhật: {new Date(article.pubDate).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
              </p>
            </div>

            {/* Action Bar - Floating Feel */}
            <div className="flex flex-wrap gap-3 md:gap-4 mb-10 md:mb-12 p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-white/5 border border-white/10">
              <button
                onClick={handleSummarize}
                disabled={isSummarizing || !!summary}
                className={`flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-wider transition-all flex-grow sm:flex-grow-0 ${
                  isSummarizing || !!summary 
                  ? 'bg-indigo-500/10 text-indigo-400/30 border border-indigo-500/10' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95'
                }`}
              >
                {isSummarizing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} className="text-yellow-300" />}
                {summary ? 'Đã tóm tắt' : 'Tóm tắt AI'}
              </button>

              <button
                onClick={handleTTS}
                disabled={isGeneratingAudio}
                className={`flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-wider transition-all active:scale-95 flex-grow sm:flex-grow-0 border ${
                  isGeneratingAudio 
                  ? 'bg-white/5 border-white/10 text-slate-500' 
                  : audioUrl 
                  ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/20' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {isGeneratingAudio ? <Loader2 className="animate-spin" size={16} /> : isPlaying ? <Pause size={16} /> : <Volume2 size={16} />}
                {isGeneratingAudio ? 'Đang tạo...' : audioUrl ? (isPlaying ? 'Tạm dừng' : 'Nghe ngay') : 'Nghe tóm tắt'}
              </button>

              <a href={article.link} target="_blank" rel="noopener" className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all ml-auto">
                <ExternalLink size={20} />
              </a>
            </div>

            {/* AI Summary Box */}
            <AnimatePresence>
              {summary && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10 md:mb-12"
                >
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-indigo-600/20 text-indigo-400">
                        <Sparkles size={16} />
                      </div>
                      <h3 className="text-sm md:text-lg font-black text-white uppercase tracking-wider">AI Tóm tắt</h3>
                    </div>
                    
                    <div className="bg-white/5 rounded-2xl md:rounded-[2rem] p-6 md:p-8 border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                      
                      <div className="space-y-3 md:space-y-4">
                        {summary.split(/[\*\-]/).filter(t => t.trim()).map((part, i) => (
                          <div key={i} className="flex gap-3 md:gap-4">
                            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            <p className="text-slate-200 text-sm md:text-lg leading-relaxed font-medium">
                              {part.trim()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Description */}
            <div className="text-slate-400 text-base md:text-2xl leading-relaxed font-light mb-12 md:mb-16">
              {article.description}
              <a href={article.link} target="_blank" rel="noopener" className="text-indigo-500 ml-2 font-medium hover:underline inline-flex items-center gap-1">
                Chi tiết <ExternalLink size={14} />
              </a>
            </div>

            {/* Footer Source Info */}
            <div className="pt-8 md:pt-10 border-t border-white/10 flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xl md:text-2xl font-black">
                {article.sourceName.charAt(0)}
              </div>
              <div>
                <p className="text-white text-base md:text-xl font-black tracking-tight">{article.sourceName}</p>
                <p className="text-slate-500 text-xs md:text-sm font-medium">Nguồn tin đã xác thực</p>
              </div>
            </div>
          </div>
        </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {article.sourceName.charAt(0)}
              </div>
              <div>
                <p className="text-white text-xl font-black tracking-tight">{article.sourceName}</p>
                <p className="text-slate-500 font-medium">Nguồn tin đã được xác thực</p>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Engine */}
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} className="hidden" />
        )}
      </div>
    </div>
  );
}
