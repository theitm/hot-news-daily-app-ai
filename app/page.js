'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, Newspaper, LayoutGrid, List as ListIcon, Settings, ChevronDown, CheckCircle2, Play, Square, Trash, Loader2, Volume2, Pause, Sparkles, AlertCircle, CheckCircle, X, Layout } from 'lucide-react';
import axios from 'axios';
import NewsCard from './components/NewsCard';
import ArticleModal from './components/ArticleModal';
import SettingsModal from './components/SettingsModal';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSources, setActiveSources] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [articleSummaries, setArticleSummaries] = useState({});
  const [isBatchSummarizing, setIsBatchSummarizing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({}); // { id: { status: 'pending'|'loading'|'done'|'error', error: string } }
  const [isBatchPlaying, setIsBatchPlaying] = useState(false);
  const [isBatchSummaryOpen, setIsBatchSummaryOpen] = useState(false);
  const [batchAudioUrl, setBatchAudioUrl] = useState(null);
  const [isElderlyMode, setIsElderlyMode] = useState(false);
  const audioRef = useRef(null);
  
  // Paging states
  const [pageSize, setPageSize] = useState(12);
  const [visibleCount, setVisibleCount] = useState(12);

  // Initialize filters and settings from localStorage
    useEffect(() => {
    const savedSources = localStorage.getItem('news-active-sources');
    const savedConfig = localStorage.getItem('ai-news-config-v2') || localStorage.getItem('ai-news-config');
    
    if (savedSources) {
      setActiveSources(JSON.parse(savedSources));
    } else {
      setActiveSources(['vnexpress-top', 'tuoitre-top', 'techcrunch-ai', 'the-verge-ai', 'google-ai']);
    }

    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      if (config.pageSize) {
        setPageSize(config.pageSize);
        setVisibleCount(config.pageSize);
      }
      if (config.elderlyMode !== undefined) {
        setIsElderlyMode(config.elderlyMode);
      }
    }

    // Load summaries cache
    const savedSummaries = localStorage.getItem('news-summaries-cache');
    if (savedSummaries) {
      setArticleSummaries(JSON.parse(savedSummaries));
    }
    
    fetchNews();
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (activeSources.length > 0) {
      localStorage.setItem('news-active-sources', JSON.stringify(activeSources));
    }
  }, [activeSources]);

  // Save summaries cache when they change
  useEffect(() => {
    if (Object.keys(articleSummaries).length > 0) {
      localStorage.setItem('news-summaries-cache', JSON.stringify(articleSummaries));
    }
  }, [articleSummaries]);

  // Auto-summarize when magazine is opened
  useEffect(() => {
    if (isBatchSummaryOpen && selectedIds.length > 0) {
      const needsSummary = selectedIds.some(id => !articleSummaries[id]);
      if (needsSummary) {
        handleBatchSummarize();
      }
    }
  }, [isBatchSummaryOpen, selectedIds]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const visibleIds = filteredArticles.slice(0, visibleCount).map(a => a.id);
    if (selectedIds.length === visibleIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleIds);
    }
  };

  const handleBatchSummarize = async () => {
    if (isBatchSummarizing || selectedIds.length === 0) return;
    setIsBatchSummarizing(true);
    
    const selectedArticles = articles.filter(a => selectedIds.includes(a.id));
    
    // Initialize progress
    const initialProgress = {};
    selectedArticles.forEach(a => {
      initialProgress[a.id] = { status: articleSummaries[a.id] ? 'done' : 'pending' };
    });
    setBatchProgress(initialProgress);
    
    const savedConfig = localStorage.getItem('ai-news-config-v2') || localStorage.getItem('ai-news-config');
    const config = savedConfig ? JSON.parse(savedConfig) : null;
    
    const newSummaries = { ...articleSummaries };
    const currentProgress = { ...initialProgress };

    try {
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < selectedArticles.length; i++) {
        const article = selectedArticles[i];
        if (newSummaries[article.id]) continue;

        // Set to loading
        currentProgress[article.id] = { status: 'loading' };
        setBatchProgress({ ...currentProgress });

        // Small delay between requests to avoid instant rate limits
        if (i > 0) await sleep(3000);

        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
          let apiConfig = config;
          if (config?.apiKeys?.length > 0) {
            apiConfig = {
              ...config,
              apiKey: config.apiKeys[Math.floor(Math.random() * config.apiKeys.length)],
              model: config.models[Math.floor(Math.random() * config.models.length)]
            };
          }

          try {
            const res = await axios.post('/api/ai/summarize', {
              text: article.description,
              title: article.title,
              config: apiConfig
            });
            newSummaries[article.id] = res.data.summary;
            setArticleSummaries({ ...newSummaries });
            currentProgress[article.id] = { status: 'done' };
            break; // Success, exit retry loop
          } catch (e) {
            const errorMsg = e.response?.data?.error || e.message;
            const isRateLimit = errorMsg.toLowerCase().includes('rate limit') || e.response?.status === 429;
            
            if (isRateLimit && retryCount < maxRetries) {
              currentProgress[article.id] = { status: 'loading', error: 'Bị giới hạn tốc độ. Đang đợi thử lại với Key khác...' };
              setBatchProgress({ ...currentProgress });
              await sleep(10000); // Wait 10s before retry
              retryCount++;
              continue;
            }

            console.error(`Failed to summarize ${article.id}`, e);
            currentProgress[article.id] = { status: 'error', error: errorMsg };
            break;
          }
        }
        setBatchProgress({ ...currentProgress });
      }
    } finally {
      // We keep isBatchSummarizing true if the user wants to see the results
      // But for now, we'll let them close it manually or add a close button
    }
  };

  const handleBatchTTS = async () => {
    if (isBatchPlaying) {
      audioRef.current?.pause();
      setIsBatchPlaying(false);
      return;
    }

    if (batchAudioUrl) {
      audioRef.current?.play();
      setIsBatchPlaying(true);
      return;
    }

    const selectedWithSummaries = articles
      .filter(a => selectedIds.includes(a.id) && articleSummaries[a.id])
      .map(a => `Bản tin từ ${a.sourceName}: ${articleSummaries[a.id]}`)
      .join('\n\nTiếp theo là tin mới: \n\n');

    if (!selectedWithSummaries) {
      alert('Vui lòng tóm tắt các tin đã chọn trước khi nghe bản tin tổng hợp.');
      return;
    }

    setIsBatchSummarizing(true); // Reuse loader state or add new one
    try {
      const fullText = `Chào mừng bạn đến với bản tin tổng hợp hôm nay. Sau đây là chi tiết các tin tức bạn đã chọn. \n\n ${selectedWithSummaries} \n\n Kết thúc bản tin. Chúc bạn một ngày tốt lành.`;
      const response = await axios.post('/api/tts', { text: fullText }, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      setBatchAudioUrl(url);
    } catch (error) {
      alert('Không thể tạo bản tin tổng hợp.');
    } finally {
      setIsBatchSummarizing(false);
    }
  };

  // Save filters to localStorage when they change
  useEffect(() => {
    if (activeSources.length > 0) {
      localStorage.setItem('news-active-sources', JSON.stringify(activeSources));
    }
  }, [activeSources]);

  const fetchNews = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get('/api/news');
      setArticles(response.data);
    } catch (error) {
      console.error('Fetch news error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = activeSources.includes(article.sourceId);
    return matchesSearch && matchesSource;
  });

  const sources = [
    { id: 'all', name: 'Tất cả', icon: <Newspaper size={16} /> },
    { id: 'vnexpress-top', name: 'VNExpress', icon: '📰' },
    { id: 'tuoitre-top', name: 'Tuổi Trẻ', icon: '🗞️' },
    { id: 'techcrunch-ai', name: 'TechCrunch', icon: '⚡' },
    { id: 'the-verge-ai', name: 'The Verge', icon: '◈' },
    { id: 'google-ai', name: 'Google AI', icon: '🧠' },
  ];

  const toggleSource = (id) => {
    if (id === 'all') {
      if (activeSources.length === sources.length - 1) {
        setActiveSources([]);
      } else {
        setActiveSources(sources.filter(s => s.id !== 'all').map(s => s.id));
      }
      return;
    }

    setActiveSources(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id) 
        : [...prev, id]
    );
  };

  return (
    <main className={`min-h-screen pb-20 selection:bg-indigo-500/30 ${isElderlyMode ? 'elderly-mode' : ''}`}>
      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-50 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/5 py-3 md:py-6">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Newspaper size={18} className="md:hidden" />
              <Newspaper size={28} className="hidden md:block" />
            </div>
            <h1 className="text-lg md:text-2xl font-black text-white tracking-tighter">
              TIN TỨC <span className="text-indigo-500">MỚI</span>
            </h1>
          </div>
          
          <div className="relative flex-grow max-w-xl hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm tin tức..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 md:p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300"
            >
              <Settings size={18} />
            </button>
            <button 
              onClick={fetchNews}
              disabled={refreshing}
              className="p-2 md:p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Hero Section */}
        <div className="py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
              Chào buổi tối, <br className="md:hidden" /> Hôm nay có gì mới?
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
              Tổng hợp tin tức nóng hổi nhất từ các nguồn uy tín, tích hợp trí tuệ nhân tạo tóm tắt nội dung và hỗ trợ đọc tin thông minh.
            </p>
          </motion.div>

          {/* Sources Filter */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar mb-8">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
              <button
                onClick={selectAll}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                  selectedIds.length > 0 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 size={16} />
                {selectedIds.length > 0 ? `Đã chọn ${selectedIds.length}` : 'Chọn tất cả'}
              </button>
              
              <div className="w-[1px] h-6 bg-white/10 shrink-0 mx-1" />

              {sources.map((source, index) => {
                const isActive = source.id === 'all' 
                  ? activeSources.length === sources.length - 1
                  : activeSources.includes(source.id);
                
                return (
                  <button
                    key={source.id || `src-${index}`}
                    onClick={() => toggleSource(source.id)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                      isActive 
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 translate-y-[-1px]' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base">{source.icon}</span>
                    {source.name}
                    {source.id !== 'all' && isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white ml-1 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-slate-400 font-medium animate-pulse">Đang chuẩn bị bản tin cho bạn...</p>
            </div>
          ) : (
            <>
              {filteredArticles.length > 0 ? (
                <>
                  <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredArticles.slice(0, visibleCount).map((article, index) => (
                        <NewsCard 
                          key={`card-${article.id || article.link || index}`} 
                          article={article} 
                          onClick={setSelectedArticle}
                          isSelected={selectedIds.includes(article.id)}
                          onSelect={toggleSelect}
                          hasSummary={!!articleSummaries[article.id]}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                  
                  {/* Load More Button */}
                  {visibleCount < filteredArticles.length && (
                    <div className="mt-16 flex justify-center pb-20">
                      <button
                        onClick={() => setVisibleCount(prev => prev + pageSize)}
                        className="group flex items-center gap-3 px-10 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-500 text-white font-bold transition-all shadow-xl hover:shadow-indigo-500/20 active:scale-95"
                      >
                        <span>Xem thêm tin tức</span>
                        <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-40 glass rounded-3xl">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-300">Không tìm thấy tin tức</h3>
                  <p className="text-slate-500 mt-2">Thử tìm kiếm với từ khóa khác hoặc chọn nguồn tin khác.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Batch Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-0 right-0 z-[100] px-4 md:px-6 pointer-events-none"
          >
            <div className="max-w-xl mx-auto pointer-events-auto">
              <div className="glass rounded-[2rem] p-3 md:p-4 flex items-center justify-between gap-4 shadow-2xl border border-white/10 ring-1 ring-white/5">
                <div className="flex items-center gap-2 md:gap-4 pl-2">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20 shrink-0 text-sm md:text-base">
                    {selectedIds.length}
                  </div>
                  <div className="hidden xs:block">
                    <p className="text-white font-black text-[10px] md:text-xs uppercase tracking-widest">Đã chọn</p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase truncate max-w-[80px] md:max-w-none">bài viết</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    onClick={() => setIsBatchSummaryOpen(true)}
                    className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl bg-indigo-600 text-white font-black text-[10px] md:text-xs uppercase tracking-wider hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Layout size={16} />
                    <span className="hidden xs:inline">Mở Tạp chí</span>
                    <span className="xs:hidden">Tạp chí</span>
                  </button>
                  
                  <button
                    onClick={handleBatchTTS}
                    disabled={isBatchSummarizing}
                    className={`p-2.5 md:p-3 rounded-xl transition-all border ${
                      isBatchSummarizing 
                      ? 'bg-white/5 border-white/5 text-slate-600' 
                      : batchAudioUrl 
                      ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/20' 
                      : 'bg-white/10 border-white/5 text-white hover:bg-white/20'
                    }`}
                  >
                    {isBatchSummarizing ? <Loader2 className="animate-spin" size={18} /> : isBatchPlaying ? <Pause size={18} /> : <Volume2 size={18} />}
                  </button>

                  <button
                    onClick={() => setSelectedIds([])}
                    className="p-2.5 md:p-3 rounded-xl bg-white/5 text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <ArticleModal 
            key="article-modal"
            article={selectedArticle} 
            onClose={() => setSelectedArticle(null)} 
            initialSummary={articleSummaries[selectedArticle.id]}
            onSummaryGenerated={(id, summary) => {
              setArticleSummaries(prev => ({ ...prev, [id]: summary }));
            }}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            key="settings-modal"
            isOpen={isSettingsOpen} 
            onClose={() => {
              setIsSettingsOpen(false);
              // Refresh config after close
              const savedConfig = localStorage.getItem('ai-news-config-v2');
              if (savedConfig) {
                const config = JSON.parse(savedConfig);
                if (config.pageSize) setPageSize(config.pageSize);
                if (config.elderlyMode !== undefined) setIsElderlyMode(config.elderlyMode);
              }
            }} 
          />
        )}
        
        {isBatchSummarizing && (
          <motion.div
            key="batch-progress-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
          >
            <div className="relative w-full max-w-2xl bg-[#0f0f11] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400">
                    <Sparkles size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white leading-tight">Đang tóm tắt hàng loạt...</h2>
                    <p className="text-slate-500 text-xs mt-1 font-bold">
                      {Object.values(batchProgress).filter(p => p.status === 'done').length} / {selectedIds.length} bài đã hoàn thành
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBatchSummarizing(false)}
                  className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-3 custom-scrollbar">
                {articles.filter(a => selectedIds.includes(a.id)).map((article, index) => {
                  const progress = batchProgress[article.id] || { status: 'pending' };
                  return (
                    <div key={article.id || article.link || `progress-${index}`} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      progress.status === 'loading' ? 'bg-indigo-600/10 border-indigo-500/30 ring-1 ring-indigo-500/20' :
                      progress.status === 'done' ? 'bg-green-500/5 border-green-500/20 opacity-70' :
                      progress.status === 'error' ? 'bg-red-500/10 border-red-500/30' :
                      'bg-white/[0.02] border-white/5 opacity-50'
                    }`}>
                      <div className="flex items-center gap-4 flex-grow min-w-0">
                        <div className="shrink-0">
                          {progress.status === 'loading' ? <Loader2 className="animate-spin text-indigo-400" size={18} /> :
                           progress.status === 'done' ? <CheckCircle className="text-green-500" size={18} /> :
                           progress.status === 'error' ? <AlertCircle className="text-red-500" size={18} /> :
                           <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-700" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate pr-4">{article.title}</p>
                          {progress.status === 'error' && (
                            <p className="text-[11px] text-red-400 mt-0.5 font-medium italic truncate pr-4">{progress.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-[10px] font-black uppercase tracking-widest">
                        {progress.status === 'loading' ? <span className="text-indigo-400 animate-pulse">Đang xử lý</span> :
                         progress.status === 'done' ? <span className="text-green-500">Xong</span> :
                         progress.status === 'error' ? <span className="text-red-500">Lỗi</span> :
                         <span className="text-slate-600">Đang chờ</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                <button
                  onClick={() => setIsBatchSummarizing(false)}
                  className="w-full py-4 rounded-[2rem] bg-indigo-600 text-white font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
                >
                  {Object.values(batchProgress).every(p => p.status === 'done' || p.status === 'error') ? 'Đóng và Xem kết quả' : 'Chạy ẩn và Quay lại sau'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isBatchSummaryOpen && (
          <motion.div
            key="magazine-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-3xl"
          >
            <div className="relative w-full h-full md:max-w-6xl md:h-[90vh] bg-[#0a0a0b] md:rounded-[3rem] border-0 md:border md:border-white/10 shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 md:p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                    <Layout size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white leading-tight uppercase tracking-tight">Tạp chí Tin tức AI</h2>
                    <p className="text-slate-500 text-[10px] md:text-xs mt-1 font-bold uppercase tracking-widest">Tổng hợp toàn bộ nội dung từ các bài báo đã chọn</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBatchTTS}
                    className={`flex-grow md:flex-initial flex items-center justify-center gap-3 px-6 md:px-8 py-3 rounded-xl md:rounded-2xl font-bold transition-all border text-sm md:text-base ${
                      isBatchPlaying ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' : 
                      batchAudioUrl ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/20' : 
                      'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500'
                    }`}
                  >
                    {isBatchPlaying ? <Pause size={18} /> : <Volume2 size={18} />}
                    <span>{isBatchPlaying ? 'Dừng' : batchAudioUrl ? 'Nghe ngay' : 'Tạo âm thanh'}</span>
                  </button>
                  <button 
                    onClick={() => setIsBatchSummaryOpen(false)}
                    className="p-3 rounded-xl md:rounded-2xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all border border-white/10"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Grid Content */}
              <div className="flex-grow overflow-y-auto p-4 md:p-10 custom-scrollbar">
                <div className="grid grid-cols-1 gap-8 md:gap-12 max-w-4xl mx-auto pb-20 md:pb-0">
                  {articles.filter(a => selectedIds.includes(a.id)).map((article, index) => (
                    <div key={article.id || article.link || `magazine-${index}`} className="relative group">
                      <div className="flex flex-col gap-6">
                        {/* Article Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-sm border border-indigo-500/20">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span 
                                  className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border border-white/5"
                                  style={{ backgroundColor: article.sourceColor + '22', color: article.sourceColor }}
                                >
                                  {article.sourceName}
                                </span>
                                <span className="text-[10px] font-bold text-slate-600">
                                  {new Date(article.pubDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight group-hover:text-indigo-400 transition-colors">
                                {article.title}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {/* Summary Content */}
                        <div className="relative pl-8 md:pl-14">
                          <div className="absolute left-4 md:left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-indigo-500/50 via-white/5 to-transparent" />
                          
                          <div className="glass-light rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group-hover:bg-white/[0.04] transition-all border border-white/5">
                            <Sparkles size={20} className="absolute top-8 right-8 text-indigo-500/20 group-hover:text-indigo-500/40 transition-all" />
                            
                            {articleSummaries[article.id] ? (
                              <div className="space-y-4">
                                {articleSummaries[article.id].split(/[\*\-]/).filter(t => t.trim()).map((part, i) => (
                                  <div key={i} className="flex gap-4">
                                    <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                    <p className="text-slate-300 text-lg leading-relaxed font-medium">
                                      {part.trim()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-4 text-slate-500 py-6">
                                <div className="w-5 h-5 rounded-full border-2 border-slate-700 border-t-indigo-500 animate-spin" />
                                <span className="text-sm font-bold tracking-widest uppercase animate-pulse">Đang phân tích tin tức...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 border-t border-white/5 text-center bg-white/[0.01]">
                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
                  Đã tải {selectedIds.length} bài báo • Chế độ Tạp chí AI
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-20 py-12 border-t border-white/5 text-center text-slate-500 text-sm">
        <p>© 2026 Tin Tức Mới • Trình tổng hợp tin tức thông minh AI</p>
      </footer>

      {/* Audio Engine for Batch */}
      {batchAudioUrl && (
        <audio 
          ref={audioRef} 
          src={batchAudioUrl} 
          onEnded={() => setIsBatchPlaying(false)} 
          onPause={() => setIsBatchPlaying(false)} 
          onPlay={() => setIsBatchPlaying(true)} 
          className="hidden" 
        />
      )}
    </main>
  );
}


