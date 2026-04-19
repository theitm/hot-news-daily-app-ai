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
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-black rounded-[2.5rem] overflow-hidden flex flex-col border border-white/10 shadow-[0_0_50px_rgba(0,0,0,1)]">
        
        {/* Close Button - Always on top */}
        <button onClick={onClose} className="absolute top-6 right-6 z-[1001] p-2.5 rounded-full bg-black/60 text-white hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md">
          <X size={24} />
        </button>

        {/* Header Image - Fixed Height */}
        <div className="relative w-full h-56 shrink-0 overflow-hidden border-b border-white/5">
          <img src={article.thumbnail} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute bottom-4 left-8">
             <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-2xl">
               {article.sourceName}
             </span>
          </div>
        </div>

        {/* Content Area - SCROLLABLE & OPAQUE */}
        <div className="flex-grow overflow-y-auto bg-black custom-scrollbar">
          <div className="p-8 md:p-12">
            {/* Title - With Indigo Accent */}
            <div className="mb-10 relative">
              <div className="absolute -left-12 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-full hidden md:block" />
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                {article.title}
              </h1>
              <p className="text-slate-500 font-medium mt-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Cập nhật lúc: {new Date(article.pubDate).toLocaleString('vi-VN')}
              </p>
            </div>

            {/* Action Bar - Floating Feel */}
            <div className="flex flex-wrap gap-4 mb-12 p-6 rounded-[2rem] bg-white/5 border border-white/10 shadow-inner">
              <button
                onClick={handleSummarize}
                disabled={isSummarizing || !!summary}
                className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex-grow sm:flex-grow-0 ${
                  isSummarizing || !!summary 
                  ? 'bg-indigo-500/10 text-indigo-400/30 border border-indigo-500/10' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] active:scale-95'
                }`}
              >
                {isSummarizing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className="text-yellow-300" />}
                {summary ? 'Đã tóm tắt' : 'Tóm tắt thông minh AI'}
              </button>

              <button
                onClick={handleTTS}
                disabled={isGeneratingAudio}
                className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 flex-grow sm:flex-grow-0 border ${
                  isGeneratingAudio 
                  ? 'bg-white/5 border-white/10 text-slate-500' 
                  : audioUrl 
                  ? 'bg-green-600 border-green-500 text-white shadow-[0_10px_30px_-10px_rgba(22,163,74,0.5)]' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {isGeneratingAudio ? <Loader2 className="animate-spin" size={18} /> : isPlaying ? <Pause size={18} /> : <Volume2 size={18} />}
                {isGeneratingAudio ? 'Đang tạo âm thanh...' : audioUrl ? (isPlaying ? 'Tạm dừng' : 'Nghe bản tóm tắt') : 'Tạo audio bản tin'}
              </button>

              <a href={article.link} target="_blank" rel="noopener" className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all ml-auto hover:bg-indigo-600/20 hover:border-indigo-600/30">
                <ExternalLink size={24} />
              </a>
            </div>

            {/* AI Summary Box */}
            <AnimatePresence>
              {summary && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12"
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                        <Sparkles size={18} />
                      </div>
                      <h3 className="text-lg font-black text-white uppercase tracking-wider">AI Tóm tắt</h3>
                    </div>
                    
                    <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                      
                      {summary ? (
                        <div className="space-y-4">
                          {summary.split(/[\*\-]/).filter(t => t.trim()).map((part, i) => (
                            <div key={i} className="flex gap-4">
                              <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                              <p className="text-slate-200 text-lg leading-relaxed font-medium">
                                {part.trim()}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                          <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-indigo-500 animate-spin" />
                          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Đang trích xuất nội dung chính...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Description */}
            <div className="text-slate-400 text-xl md:text-2xl leading-relaxed font-light mb-16 px-2">
              {article.description}
              <a href={article.link} target="_blank" rel="noopener" className="text-indigo-500 ml-3 font-medium hover:underline inline-flex items-center gap-1">
                Xem chi tiết tại nguồn <ExternalLink size={16} />
              </a>
            </div>

            {/* Footer Source Info */}
            <div className="pt-10 border-t border-white/10 flex items-center gap-6">
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
