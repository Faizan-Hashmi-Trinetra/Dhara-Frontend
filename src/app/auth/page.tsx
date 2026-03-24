'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Sparkles, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      if (isLogin) {
        const res = await api.post('/auth/login', formData);
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('username', res.data.username);
        router.push('/chat');
      } else {
        formData.append('email', email);
        await api.post('/auth/signup', formData);
        setMessage('Account created! You can now sign in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-[#d97757] to-[#e68a6d] flex items-center justify-center text-white shadow-xl shadow-[#d97757]/20 mb-4 rotate-3">
            <Sparkles size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#1d1d1b]">Dhara</h1>
          <p className="text-[10px] font-bold text-[#d97757] uppercase tracking-[0.3em] mt-1">PMC Intelligence</p>
        </div>

        <p className="text-center mb-8 text-gray-500 font-medium">
          {isLogin ? 'Sign in to access PMC records' : 'Create an officer account'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl text-center font-medium animate-pulse">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 text-sm rounded-2xl text-center font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label className="block mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
            <input 
              type="text" 
              placeholder="e.g. officer_pune" 
              className="input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label className="block mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
              <input 
                type="email" 
                placeholder="officer@pmc.gov.in" 
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
            <label className="block mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="button !mt-8 shadow-lg shadow-black/10" disabled={loading}>
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                <span>Verifying...</span>
              </div>
            ) : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm font-bold text-[#d97757] hover:underline underline-offset-4"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        Secure Access • Pune Municipal Corporation
      </p>
    </div>
  );
}
