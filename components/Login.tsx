import React, { useState } from 'react';
import { ACCESS_PASSWORD } from '../constants';
import { ShieldCheck, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ACCESS_PASSWORD) {
      onLogin();
    } else {
      setError('访问密码错误，请重试。');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-lg max-w-md w-full border-t-4 border-blue-900">
        <div className="text-center mb-8">
          <div className="mx-auto bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-900" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">内部知识库管理系统</h1>
          <p className="text-slate-500 mt-2 text-sm">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              访问口令
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                }}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent text-sm"
                placeholder="请输入密码"
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-colors"
          >
            登录系统
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>版权所有 © 2023-2024 知识管理中心</p>
        </div>
      </div>
    </div>
  );
};