import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, AlertTriangle, List, Plus, X, Trash2 } from 'lucide-react';
import { QiniuConfig } from '../types';

interface SettingsProps {
  currentConfig: QiniuConfig | null;
  currentCategories: string[];
  onSave: (config: QiniuConfig) => void;
  onSaveCategories: (categories: string[]) => void;
  onCancel: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
    currentConfig, 
    currentCategories,
    onSave, 
    onSaveCategories,
    onCancel 
}) => {
  const [activeTab, setActiveTab] = useState<'storage' | 'categories'>('storage');
  
  // Storage Config State
  const [config, setConfig] = useState<QiniuConfig>({
    accessKey: '',
    secretKey: '',
    bucket: '',
    domain: '',
    region: 'z0',
    filename: 'knowledge.json'
  });

  // Category State
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
    setCategories(currentCategories || []);
  }, [currentConfig, currentCategories]);

  const handleSubmitConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  const handleAddCategory = () => {
      if(newCat.trim() && !categories.includes(newCat.trim())) {
          const updated = [...categories, newCat.trim()];
          setCategories(updated);
          onSaveCategories(updated); // Immediate save/sync for categories
          setNewCat('');
      }
  };

  const handleRemoveCategory = (cat: string) => {
      if(window.confirm(`确定删除分类 "${cat}" 吗? 关联的文档将保留分类名但不再显示在导航中。`)) {
          const updated = categories.filter(c => c !== cat);
          setCategories(updated);
          onSaveCategories(updated); // Immediate save/sync for categories
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-blue-900 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-bold text-lg flex items-center">
            <SettingsIcon className="mr-2" size={20} />
            系统设置
          </h2>
          <button onClick={onCancel} className="text-blue-200 hover:text-white"><X size={24}/></button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
            <button 
                onClick={() => setActiveTab('storage')}
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'storage' ? 'bg-white text-blue-900 border-t-2 border-blue-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
                存储配置
            </button>
            <button 
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'categories' ? 'bg-white text-blue-900 border-t-2 border-blue-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
                分类管理
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
          
          {/* STORAGE TAB */}
          {activeTab === 'storage' && (
            <div>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                    <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-amber-700">
                        本系统为纯前端应用。数据需通过七牛云对象存储(Kodo)同步。
                        请确保 Bucket 已开启 <strong>CORS</strong>，允许 Origin 为 <code>*</code>。
                        </p>
                    </div>
                    </div>
                </div>

                <form onSubmit={handleSubmitConfig} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Access Key (AK)</label>
                        <input
                        required
                        type="password"
                        value={config.accessKey}
                        onChange={e => setConfig({...config, accessKey: e.target.value})}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Secret Key (SK)</label>
                        <input
                        required
                        type="password"
                        value={config.secretKey}
                        onChange={e => setConfig({...config, secretKey: e.target.value})}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                        />
                    </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bucket 名称</label>
                        <input
                        required
                        type="text"
                        value={config.bucket}
                        onChange={e => setConfig({...config, bucket: e.target.value})}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">区域 (Region)</label>
                        <select
                        value={config.region}
                        onChange={e => setConfig({...config, region: e.target.value})}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                        >
                        <option value="z0">华东 (z0)</option>
                        <option value="z1">华北 (z1)</option>
                        <option value="z2">华南 (z2)</option>
                        <option value="na0">北美 (na0)</option>
                        <option value="as0">东南亚 (as0)</option>
                        </select>
                    </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">访问域名 (Domain)</label>
                        <input
                        required
                        type="text"
                        value={config.domain}
                        onChange={e => setConfig({...config, domain: e.target.value})}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                        placeholder="例如: http://cdn.example.com"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">文件名 (Key)</label>
                        <input
                        required
                        type="text"
                        value={config.filename}
                        onChange={e => setConfig({...config, filename: e.target.value})}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                        />
                    </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        className="flex items-center space-x-2 bg-blue-900 text-white px-6 py-2 rounded shadow-sm hover:bg-blue-800 transition-colors text-sm"
                    >
                        <Save size={16} />
                        <span>保存存储配置</span>
                    </button>
                    </div>
                </form>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
              <div className="space-y-6">
                   <div className="flex space-x-2">
                       <input 
                         type="text" 
                         value={newCat}
                         onChange={(e) => setNewCat(e.target.value)}
                         placeholder="输入新分类名称..."
                         className="flex-grow border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                        />
                        <button 
                            onClick={handleAddCategory}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center"
                        >
                            <Plus size={16} className="mr-1"/> 添加
                        </button>
                   </div>

                   <div className="bg-slate-50 border border-slate-200 rounded-md">
                       <ul className="divide-y divide-slate-200">
                           {categories.map((cat, idx) => (
                               <li key={idx} className="px-4 py-3 flex justify-between items-center text-sm">
                                   <span className="text-slate-700 font-medium flex items-center">
                                       <List size={14} className="mr-3 text-slate-400"/>
                                       {cat}
                                   </span>
                                   <button 
                                     onClick={() => handleRemoveCategory(cat)}
                                     className="text-red-500 hover:text-red-700 p-1"
                                     title="删除分类"
                                   >
                                       <Trash2 size={16} />
                                   </button>
                               </li>
                           ))}
                           {categories.length === 0 && (
                               <li className="px-4 py-8 text-center text-slate-400 text-sm">
                                   暂无分类，请添加。
                               </li>
                           )}
                       </ul>
                   </div>
                   <p className="text-xs text-slate-400">
                       注：修改分类会立即触发数据同步。
                   </p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};