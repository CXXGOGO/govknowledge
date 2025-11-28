import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, BookOpen, Tag, Calendar, 
  User, LayoutGrid, List as ListIcon, 
  LogOut, Save, ArrowLeft, Trash2, FileText,
  Settings as SettingsIcon, RefreshCw, Cloud, CloudOff
} from 'lucide-react';
import { KnowledgeItem, AppView, QiniuConfig, KnowledgeBaseData } from '../types';
import { INITIAL_DATA } from '../constants';
import { Settings } from './Settings';
import { fetchData, uploadData } from '../utils/qiniu';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [view, setView] = useState<AppView>(AppView.LIST);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  
  // Qiniu & Sync State
  const [qiniuConfig, setQiniuConfig] = useState<QiniuConfig | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'unconfigured'>('unconfigured');
  const [statusMsg, setStatusMsg] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');

  // Form State
  const [formData, setFormData] = useState<Partial<KnowledgeItem>>({});

  // Initialize Config
  useEffect(() => {
    const storedConfig = localStorage.getItem('qiniu_config');
    if (storedConfig) {
      const config = JSON.parse(storedConfig);
      setQiniuConfig(config);
      setSyncStatus('idle');
      loadRemoteData(config);
    } else {
      setShowSettings(true);
      setSyncStatus('unconfigured');
    }
  }, []);

  const loadRemoteData = async (config: QiniuConfig) => {
    setSyncStatus('syncing');
    setStatusMsg('正在从云端拉取数据...');
    try {
      const data: KnowledgeBaseData | null = await fetchData(config);
      if (data && data.items && data.categories) {
        setItems(data.items);
        setCategories(data.categories);
        setStatusMsg('同步成功');
      } else {
        // First time initialization
        setItems(INITIAL_DATA.items);
        setCategories(INITIAL_DATA.categories);
        setStatusMsg('初始化默认数据...');
        await uploadRemoteData(config, INITIAL_DATA.items, INITIAL_DATA.categories);
      }
      setSyncStatus('synced');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setStatusMsg(`同步失败: ${err.message}. 请检查配置或跨域设置。`);
    }
  };

  const uploadRemoteData = async (config: QiniuConfig, currentItems: KnowledgeItem[], currentCategories: string[]) => {
    setSyncStatus('syncing');
    setStatusMsg('正在保存至云端...');
    try {
      const payload: KnowledgeBaseData = {
        categories: currentCategories,
        items: currentItems
      };
      await uploadData(config, payload);
      setItems(currentItems);
      setCategories(currentCategories);
      setSyncStatus('synced');
      setStatusMsg('保存成功');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setStatusMsg(`保存失败: ${err.message}`);
    }
  };

  const handleSaveConfig = (newConfig: QiniuConfig) => {
    localStorage.setItem('qiniu_config', JSON.stringify(newConfig));
    setQiniuConfig(newConfig);
    setShowSettings(false);
    loadRemoteData(newConfig);
  };

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = selectedCategory === '全部' || item.category === selectedCategory;
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, selectedCategory, searchQuery]);

  // Handlers
  const handleViewDetail = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setView(AppView.DETAIL);
  };

  const handleCreateNew = () => {
    setFormData({
      title: '',
      category: categories.length > 0 ? categories[0] : '其他',
      content: '',
      tags: [],
      author: '当前用户'
    });
    setView(AppView.CREATE);
  };

  const handleEdit = (item: KnowledgeItem) => {
    setFormData({ ...item });
    setSelectedItem(item);
    setView(AppView.EDIT);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条记录吗？此操作不可恢复。')) {
      const newItems = items.filter(i => i.id !== id);
      if (qiniuConfig) {
        uploadRemoteData(qiniuConfig, newItems, categories);
      } else {
        setItems(newItems);
      }
      if (selectedItem?.id === id) {
        setView(AppView.LIST);
        setSelectedItem(null);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    if (!qiniuConfig) {
      alert("请先配置七牛云存储信息");
      setShowSettings(true);
      return;
    }

    const now = new Date().toISOString();
    let newItems = [...items];
    
    if (view === AppView.CREATE) {
      const newItem: KnowledgeItem = {
        id: Date.now().toString(),
        title: formData.title!,
        category: formData.category || (categories[0] || '其他'),
        content: formData.content!,
        tags: formData.tags || [],
        author: formData.author || 'User',
        createdAt: now,
        updatedAt: now
      };
      newItems = [newItem, ...items];
    } else if (view === AppView.EDIT && selectedItem) {
      newItems = items.map(item => 
        item.id === selectedItem.id 
          ? { ...item, ...formData, updatedAt: now } as KnowledgeItem
          : item
      );
    }

    uploadRemoteData(qiniuConfig, newItems, categories);
    setView(AppView.LIST);
    setFormData({});
  };

  const handleRefresh = () => {
    if (qiniuConfig) loadRemoteData(qiniuConfig);
  };

  const handleSaveCategories = (newCategories: string[]) => {
      if (!qiniuConfig) return;
      uploadRemoteData(qiniuConfig, items, newCategories);
  };

  // UI Components
  const Sidebar = () => (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-[calc(100vh-64px)] fixed top-16 left-0 overflow-y-auto">
      <div className="p-4">
        <button 
          onClick={handleCreateNew}
          className="w-full flex items-center justify-center space-x-2 bg-blue-900 text-white py-2 px-4 rounded shadow-sm hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          <span>新增知识录入</span>
        </button>
      </div>

      <div className="mt-2 flex-grow">
        <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
          <span>分类导航</span>
        </div>
        <nav className="space-y-1 px-2">
          <button
             onClick={() => { setSelectedCategory('全部'); setView(AppView.LIST); }}
             className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md ${
               selectedCategory === '全部' ? 'bg-blue-100 text-blue-900' : 'text-slate-600 hover:bg-slate-200'
             }`}
          >
            <LayoutGrid size={18} />
            <span>全部知识</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setView(AppView.LIST); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md ${
                selectedCategory === cat ? 'bg-blue-100 text-blue-900' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Tag size={18} />
              <span>{cat}</span>
            </button>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-slate-200">
        <div className={`p-3 rounded-md border ${
            syncStatus === 'error' ? 'bg-red-50 border-red-200' : 
            syncStatus === 'synced' ? 'bg-green-50 border-green-200' : 
            'bg-slate-100 border-slate-200'
          }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold ${
              syncStatus === 'error' ? 'text-red-700' : 
              syncStatus === 'synced' ? 'text-green-700' : 
              'text-slate-700'
            }`}>
              {syncStatus === 'syncing' ? '同步中...' : 
               syncStatus === 'synced' ? '云端已同步' : 
               syncStatus === 'error' ? '同步错误' : '未配置'}
            </span>
            {syncStatus === 'syncing' ? <RefreshCw size={12} className="animate-spin text-blue-600"/> :
             syncStatus === 'synced' ? <Cloud size={12} className="text-green-600"/> : 
             <CloudOff size={12} className="text-slate-400"/>
            }
          </div>
          <p className="text-[10px] text-slate-500 truncate">{statusMsg || '等待操作'}</p>
        </div>
      </div>
    </aside>
  );

  const Header = () => (
    <header className="h-16 bg-blue-900 text-white fixed top-0 w-full z-10 flex items-center justify-between px-6 shadow-md">
      <div className="flex items-center space-x-3">
        <div className="bg-white/10 p-2 rounded-lg">
          <BookOpen className="text-white h-6 w-6" />
        </div>
        <span className="text-lg font-bold tracking-wide">公共知识库管理系统</span>
      </div>
      <div className="flex items-center space-x-6">
        <button 
          onClick={() => setShowSettings(true)}
          className="flex items-center space-x-1 hover:bg-blue-800 px-3 py-1.5 rounded text-xs transition-colors text-blue-100"
          title="系统配置"
        >
          <SettingsIcon size={16} />
          <span>配置</span>
        </button>
        <div className="flex items-center space-x-2 text-blue-200 text-sm">
          <User size={16} />
          <span>管理员</span>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center space-x-1 bg-blue-800 hover:bg-red-700 px-3 py-1.5 rounded text-xs transition-colors"
        >
          <LogOut size={14} />
          <span>退出</span>
        </button>
      </div>
    </header>
  );

  const MainContent = () => (
    <main className="ml-64 mt-16 p-8 min-h-[calc(100vh-64px)] bg-slate-50/50">
      {view === AppView.LIST && (
        <div className="max-w-6xl mx-auto">
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <ListIcon className="mr-2 text-blue-900" size={24}/>
              {selectedCategory}列表
              <span className="ml-2 text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                共 {filteredItems.length} 条
              </span>
            </h2>
            <div className="flex space-x-3">
               <button 
                onClick={handleRefresh}
                className="p-2 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-full transition-colors"
                title="刷新数据"
               >
                 <RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''}/>
               </button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="检索关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-900 focus:border-transparent text-sm"
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-4">
            {syncStatus === 'unconfigured' ? (
                <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-300">
                  <CloudOff className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">尚未配置存储</p>
                  <button onClick={() => setShowSettings(true)} className="mt-2 text-blue-900 underline text-sm">点击配置七牛云</button>
                </div>
            ) : filteredItems.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-300">
                 <p className="text-slate-400">暂无相关数据，请尝试更换关键词或新增记录。</p>
               </div>
            ) : (
                filteredItems.map(item => (
                <div 
                    key={item.id} 
                    onClick={() => handleViewDetail(item)}
                    className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                >
                    <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">
                            {item.category}
                        </span>
                        <span className="text-slate-400 text-xs flex items-center">
                            <Calendar size={12} className="mr-1" />
                            {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-900 mb-2">
                        {item.title}
                        </h3>
                        <p className="text-slate-500 text-sm line-clamp-2">
                        {item.content.slice(0, 150).replace(/[#`*]/g, '')}...
                        </p>
                    </div>
                    <div className="text-slate-300 group-hover:text-blue-500">
                        <FileText size={20} />
                    </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                    {item.tags.map(tag => (
                        <span key={tag} className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        #{tag}
                        </span>
                    ))}
                    </div>
                </div>
                ))
            )}
          </div>
        </div>
      )}

      {(view === AppView.DETAIL && selectedItem) && (
        <div className="max-w-4xl mx-auto bg-white min-h-[80vh] rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {/* Detail Toolbar */}
          <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50">
            <button onClick={() => setView(AppView.LIST)} className="flex items-center text-slate-600 hover:text-blue-900 text-sm font-medium">
              <ArrowLeft size={16} className="mr-1"/> 返回列表
            </button>
            <div className="flex space-x-3">
              <button 
                onClick={() => handleEdit(selectedItem)}
                className="bg-blue-900 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-800 transition-colors"
              >
                编辑
              </button>
              <button 
                onClick={() => handleDelete(selectedItem.id)}
                className="bg-white border border-red-200 text-red-600 px-4 py-1.5 rounded text-sm hover:bg-red-50 transition-colors flex items-center"
              >
                <Trash2 size={14} className="mr-1" /> 删除
              </button>
            </div>
          </div>
          
          <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{selectedItem.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-slate-500 mb-8 border-b border-slate-100 pb-6">
              <span className="flex items-center"><User size={14} className="mr-1"/> {selectedItem.author}</span>
              <span className="flex items-center"><Calendar size={14} className="mr-1"/> {new Date(selectedItem.createdAt).toLocaleString()}</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{selectedItem.category}</span>
            </div>
            
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700 bg-slate-50 p-6 rounded-md border border-slate-100">
                {selectedItem.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {(view === AppView.CREATE || view === AppView.EDIT) && (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800">
              {view === AppView.CREATE ? '新增知识条目' : '编辑知识条目'}
            </h2>
            <button onClick={() => setView(AppView.LIST)} className="text-slate-500 hover:text-slate-800 text-sm">
              取消
            </button>
          </div>
          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">标题</label>
                <input
                  required
                  type="text"
                  value={formData.title || ''}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  placeholder="请输入标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                内容 (支持简单的 Markdown 格式)
              </label>
              <textarea
                required
                rows={15}
                value={formData.content || ''}
                onChange={e => setFormData({...formData, content: e.target.value})}
                className="w-full border border-slate-300 rounded p-2 font-mono text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                placeholder="# 输入内容..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">标签 (逗号分隔)</label>
              <input
                type="text"
                value={formData.tags?.join(', ') || ''}
                onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                placeholder="React, CSS, Performance"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={syncStatus === 'syncing'}
                className="flex items-center space-x-2 bg-blue-900 text-white px-6 py-2 rounded shadow-sm hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {syncStatus === 'syncing' ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18} />}
                <span>{syncStatus === 'syncing' ? '保存中...' : '保存记录'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <Sidebar />
      <MainContent />
      {showSettings && (
        <Settings 
          currentConfig={qiniuConfig} 
          currentCategories={categories}
          onSave={handleSaveConfig} 
          onSaveCategories={handleSaveCategories}
          onCancel={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};