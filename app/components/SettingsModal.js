'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Save, ShieldCheck, Cpu, Link2, LayoutGrid, Plus, Trash2 } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [config, setConfig] = useState({
    apiUrl: 'https://platform.beeknoee.com/api/v1/chat/completions',
    apiKeys: [''],
    models: ['qwen-3-235b-a22b-instruct-2507'],
    pageSize: 12,
    elderlyMode: false
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem('ai-news-config-v2');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    } else {
      // Migrate old config if exists
      const oldConfig = localStorage.getItem('ai-news-config');
      if (oldConfig) {
        const parsed = JSON.parse(oldConfig);
        setConfig({
          ...config,
          apiUrl: parsed.apiUrl || config.apiUrl,
          apiKeys: [parsed.apiKey || ''],
          models: [parsed.model || config.models[0]],
          pageSize: parsed.pageSize || 12
        });
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    // Filter out empty values
    const filteredConfig = {
      ...config,
      apiKeys: config.apiKeys.filter(k => k.trim() !== ''),
      models: config.models.filter(m => m.trim() !== '')
    };
    if (filteredConfig.apiKeys.length === 0) filteredConfig.apiKeys = [''];
    if (filteredConfig.models.length === 0) filteredConfig.models = ['qwen-3-235b-a22b-instruct-2507'];
    
    localStorage.setItem('ai-news-config-v2', JSON.stringify(filteredConfig));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  const addField = (type) => {
    setConfig({
      ...config,
      [type]: [...config[type], '']
    });
  };

  const removeField = (type, index) => {
    const newList = [...config[type]];
    newList.splice(index, 1);
    setConfig({
      ...config,
      [type]: newList.length > 0 ? newList : ['']
    });
  };

  const updateField = (type, index, value) => {
    const newList = [...config[type]];
    newList[index] = value;
    setConfig({
      ...config,
      [type]: newList
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0f0f11] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                <Settings size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight leading-none">Cấu hình Nâng cao</h2>
                <p className="text-slate-500 text-xs mt-2 font-medium">Hỗ trợ nhiều Key & Model (Xoay tua tự động)</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-8">
            {/* API Endpoint */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-3 ml-1">
                <Link2 size={16} /> API Endpoint
              </label>
              <input
                type="text"
                value={config.apiUrl}
                onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
            </div>

            {/* API Keys List */}
            <div>
              <div className="flex items-center justify-between mb-3 ml-1">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-400">
                  <ShieldCheck size={16} /> Danh sách API Keys
                </label>
                <button onClick={() => addField('apiKeys')} className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all">
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {config.apiKeys.map((key, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="password"
                      value={key}
                      onChange={(e) => updateField('apiKeys', idx, e.target.value)}
                      placeholder="Nhập API Key..."
                      className="flex-grow bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                    {config.apiKeys.length > 1 && (
                      <button onClick={() => removeField('apiKeys', idx)} className="p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Models List */}
            <div>
              <div className="flex items-center justify-between mb-3 ml-1">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-400">
                  <Cpu size={16} /> Danh sách AI Models
                </label>
                <button onClick={() => addField('models')} className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all">
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {config.models.map((model, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => updateField('models', idx, e.target.value)}
                      placeholder="Tên Model (vd: qwen-2.5)..."
                      className="flex-grow bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-indigo-500/50"
                    />
                    {config.models.length > 1 && (
                      <button onClick={() => removeField('models', idx)} className="p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Page Size */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-3 ml-1">
                <LayoutGrid size={16} /> Số tin mỗi trang
              </label>
              <select
                value={config.pageSize}
                onChange={(e) => setConfig({ ...config, pageSize: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none bg-[#0f0f11]"
              >
                <option value={8}>8 tin bài</option>
                <option value={12}>12 tin bài</option>
                <option value={20}>20 tin bài</option>
                <option value={40}>40 tin bài</option>
              </select>
            </div>

            {/* Elderly Mode Toggle */}
            <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl transition-all ${config.elderlyMode ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                  <LayoutGrid size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">Chế độ Người lớn tuổi</h3>
                  <p className="text-slate-500 text-xs mt-1">Chữ to hơn, tương phản cao, dễ đọc</p>
                </div>
              </div>
              <button
                onClick={() => setConfig({ ...config, elderlyMode: !config.elderlyMode })}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${config.elderlyMode ? 'bg-indigo-600' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 ${config.elderlyMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <button
              onClick={handleSave}
              className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 mt-4 ${
                saved 
                ? 'bg-green-600 text-white' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95'
              }`}
            >
              {saved ? (
                <>Đã lưu cấu hình xoay tua!</>
              ) : (
                <>
                  <Save size={20} /> Lưu & Kích hoạt xoay tua
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
