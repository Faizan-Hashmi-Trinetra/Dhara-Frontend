/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, Activity, DollarSign, Target, 
  AlertCircle, CheckCircle2, Clock, Zap,
  ArrowLeft, RefreshCw, Layers, ChevronRight, X, Info, FileText, Cpu,
  User, Bot, Search, Database, Orbit, Copy, Check, PanelLeftClose, Trash2, Download
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import api from '@/lib/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Tooltip as CustomTooltip } from '@/components/ui/Tooltip';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Dhara = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3c-4.42 0-8 3.58-8 8v2c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-2c0-4.42-3.58-8-8-8z" />
    <path d="M7 15c0 2 1.5 2 1.5 4s-1.5 2-1.5 4" />
    <path d="M10.5 15c0 2 1.5 2 1.5 4s-1.5 2-1.5 4" />
    <path d="M13.5 15c0 2 1.5 2 1.5 4s-1.5 2-1.5 4" />
    <path d="M17 15c0 2-1.5 2-1.5 4s 1.5 2 1.5 4" />
  </svg>
);

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<'observatory' | 'knowledge'>('observatory');
  const [metrics, setMetrics] = useState<any>(null);
  const [traces, setTraces] = useState<any[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTrace, setSelectedTrace] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [collapsedThoughts, setCollapsedThoughts] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const renderCleanContent = (content: string) => {
    if (typeof content !== 'string') return '';
    return content
      .replace(/<thought>[\s\S]*?<\/thought>/g, '')  // strip complete thought blocks
      .replace(/<thought>[\s\S]*/g, '')               // strip partial/unclosed thought tags
      .trim();
  };

  const getThoughtFromMsg = (content: string) => {
    if (typeof content !== 'string') return null;
    const match = content.match(/<thought>([\s\S]*?)<\/thought>/);
    return match ? match[1] : null;
  };

  const toggleThought = (index: number) => {
    const newCollapsed = new Set(collapsedThoughts);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedThoughts(newCollapsed);
  };
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('dhara_theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const [mRes, tRes, dRes] = await Promise.all([
        api.get('/metrics?last_n=200'),
        api.get('/traces?limit=50'),
        api.get('/documents')
      ]);
      setMetrics(mRes.data);
      setTraces(tRes.data);
      setDocuments(dRes.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(fetchData, 5000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteSub = async (filename: string) => {
    setIsDeleting(filename);
    try {
      await api.delete(`/documents/${filename}`);
      setDocuments(prev => prev.filter(d => d !== filename));
    } catch (error) {
      console.error("Error deleting document", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const downloadDocument = async (filename: string) => {
    try {
      // Create a direct anchor link for the download since we use JWT cookies or headers?
      // With axios we can generate a blob
      const response = await api.get(`/documents/${filename}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download", err);
    }
  };

  if (loading && !metrics) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center transition-colors duration-500", theme === 'dark' ? "bg-[#0d1117]" : "bg-white")}>
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
          <p className="text-gray-500 font-semibold text-sm tracking-widest uppercase">Connecting to Dhara AI...</p>
        </div>
      </div>
    );
  }

  const chartData = traces.slice().reverse().map(t => ({
    time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    total: t.latency_ms,
    retrieval: t.retrieval_ms,
    generation: t.generation_ms
  }));

  const providerData = metrics?.providers ? Object.entries(metrics.providers).map(([name, value]) => ({
    name: name.split(' ')[0], value: Number(value)
  })) : [];

  const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#8b5cf6'];

  return (
    <div className={cn("h-screen font-sans flex flex-col overflow-hidden selection:bg-blue-500/30 transition-all duration-500", theme === 'dark' ? "bg-[#0d1117] text-[#e6edf3]" : "bg-[#f9f9f8] text-[#1a1a18]")}>
      
      {/* ── Header ── */}
      <header className={cn("border-b px-6 py-4 shrink-0 z-20 flex items-center justify-between transition-colors duration-500", theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-black/5")}>
        <div className="flex items-center gap-4">
          <CustomTooltip content="Back to Chat">
            <button 
              onClick={() => router.push('/chat')}
              className={cn("p-2 rounded-lg transition-all duration-300", theme === 'dark' ? "text-gray-400 hover:text-white hover:bg-[#21262d]" : "text-gray-500 hover:text-gray-900 hover:bg-black/5")}
            >
              <PanelLeftClose size={20} className="rotate-180" />
            </button>
          </CustomTooltip>
          <div className={cn("h-6 w-px mx-2 transition-colors duration-500", theme === 'dark' ? "bg-[#30363d]" : "bg-black/10")} />
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border transition-colors duration-500", theme === 'dark' ? "bg-black border-[#30363d]" : "bg-white border-black/5 shadow-sm")}>
              {viewMode === 'observatory' ? (
                <BarChart3 size={20} className={theme === 'dark' ? "text-white" : "text-blue-600"} />
              ) : (
                <Database size={20} className={theme === 'dark' ? "text-white" : "text-blue-600"} />
              )}
            </div>
            <div>
              <h1 className={cn("text-lg font-bold tracking-tight leading-none mb-1 transition-colors duration-500", theme === 'dark' ? "text-white" : "text-[#1a1a18]")}>
                {viewMode === 'observatory' ? 'Observatory' : 'Knowledge Base'}
              </h1>
              <p className="text-gray-500 text-xs font-medium">
                {viewMode === 'observatory' ? 'System telemetry and performance' : 'Manage your indexed intelligence'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className={cn("flex p-1 rounded-xl border transition-colors duration-500", theme === 'dark' ? "bg-[#0d1117] border-[#30363d]" : "bg-gray-100 border-black/5 shadow-inner")}>
            <button
              onClick={() => setViewMode('observatory')}
              className={cn("flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300", 
                viewMode === 'observatory' 
                  ? (theme === 'dark' ? "bg-[#21262d] text-white shadow-sm" : "bg-white text-gray-900 shadow-sm")
                  : (theme === 'dark' ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700")
              )}
            >
              <Activity size={16} /> Metrics
            </button>
            <button
              onClick={() => setViewMode('knowledge')}
              className={cn("flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300", 
                viewMode === 'knowledge' 
                  ? (theme === 'dark' ? "bg-[#21262d] text-white shadow-sm" : "bg-white text-gray-900 shadow-sm")
                  : (theme === 'dark' ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700")
              )}
            >
              <FileText size={16} /> Sources
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors duration-500", theme === 'dark' ? "bg-[#0d1117] border-[#30363d]" : "bg-white border-black/5 shadow-sm")}>
            <div className={cn("w-2 h-2 rounded-full", autoRefresh ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" : "bg-gray-600")} />
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>Live</span>
          </div>
          <CustomTooltip content={autoRefresh ? "Pause live updates" : "Resume live updates"}>
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 border",
                autoRefresh 
                  ? (theme === 'dark' ? "bg-white text-black border-white hover:bg-gray-200" : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20") 
                  : (theme === 'dark' ? "bg-[#21262d] text-gray-300 border-[#30363d] hover:text-white" : "bg-white text-gray-600 border-black/5 hover:text-gray-900 hover:bg-gray-50 shadow-sm")
              )}
            >
              {autoRefresh ? 'Pause' : 'Resume'}
            </button>
          </CustomTooltip>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className={cn("flex-1 overflow-y-auto scrollbar-hide transition-colors duration-500", theme === 'dark' ? "bg-[#0d1117]" : "bg-[#f9f9f8]")}>
        <div className="max-w-6xl mx-auto w-full p-6 md:p-10 space-y-8 pb-32">
          
          {viewMode === 'observatory' ? (
            <>
              {/* ── KPI Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label="Median Latency" 
              value={`${metrics?.latency?.p50_ms?.toFixed(0) || 0}ms`} 
              icon={<Clock size={16} />} 
              trend={metrics?.latency?.p50_ms > 3000 ? 'bad' : 'good'}
              theme={theme}
            />
            <StatCard 
              label="Citation Rate" 
              value={`${((metrics?.quality?.citation_rate || 0) * 100).toFixed(0)}%`} 
              icon={<Target size={16} />} 
              trend={metrics?.quality?.citation_rate < 0.7 ? 'bad' : 'good'}
              theme={theme}
            />
            <StatCard 
              label="Cost per Request" 
              value={`$${metrics?.cost?.avg_per_request?.toFixed(4) || 0}`} 
              icon={<DollarSign size={16} />} 
              theme={theme}
            />
            <StatCard 
              label="Success Rate" 
              value={`${((1 - (metrics?.volume?.error_rate || 0)) * 100).toFixed(1)}%`} 
              icon={<Activity size={16} />} 
              trend={metrics?.volume?.error_rate > 0.05 ? 'bad' : 'good'}
              theme={theme}
            />
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Latency Timeline */}
            <div className={cn("lg:col-span-2 border rounded-[32px] p-8 relative overflow-hidden text-left flex flex-col transition-colors duration-500", theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-black/5 shadow-sm")}>
              <h3 className={cn("text-[11px] font-bold uppercase tracking-widest mb-8 transition-colors duration-500", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                Latency Over Time
              </h3>
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#30363d" : "#f0f0f0"} vertical={false} />
                    <XAxis dataKey="time" stroke="#6e7681" fontSize={10} tickLine={false} axisLine={false} tickMargin={12} />
                    <YAxis stroke="#6e7681" fontSize={10} tickLine={false} axisLine={false} tickMargin={12} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: theme === 'dark' ? '#0d1117' : '#fff', border: theme === 'dark' ? '1px solid #30363d' : '1px solid #f0f0f0', borderRadius: '16px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: theme === 'dark' ? '#fff' : '#1a1a18', fontWeight: 600 }}
                    />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }} name="Total" />
                    <Line type="monotone" dataKey="retrieval" stroke="#10b981" strokeWidth={3} dot={false} name="Retrieval" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Infrastructure Mix */}
            <div className={cn("border rounded-[32px] p-8 relative overflow-hidden text-left flex flex-col transition-colors duration-500", theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-black/5 shadow-sm")}>
              <div className="flex items-center justify-between mb-8">
                <h3 className={cn("text-[11px] font-bold uppercase tracking-widest transition-colors duration-500", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                  Model Mix
                </h3>
                <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-tight", theme === 'dark' ? "bg-[#0d1117] border-[#30363d] text-gray-500" : "bg-gray-50 border-black/5 text-gray-400")}>n={metrics?.total_traces || 0}</span>
              </div>
              
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={providerData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#30363d" : "#f0f0f0"} vertical={false} />
                    <XAxis dataKey="name" stroke="#6e7681" fontSize={10} tickLine={false} axisLine={false} tickMargin={12} />
                    <YAxis stroke="#6e7681" fontSize={10} tickLine={false} axisLine={false} tickMargin={12} />
                    <RechartsTooltip 
                      cursor={{ fill: theme === 'dark' ? '#21262d' : '#f9f9f8', opacity: 0.5 }}
                      contentStyle={{ backgroundColor: theme === 'dark' ? '#0d1117' : '#fff', border: theme === 'dark' ? '1px solid #30363d' : '1px solid #f0f0f0', borderRadius: '16px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: theme === 'dark' ? '#fff' : '#1a1a18', fontWeight: 600 }}
                    />
                    <Bar dataKey="value" name="Calls" radius={[8, 8, 0, 0]} maxBarSize={40}>
                      {providerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Recent Executions Table ── */}
          <div className={cn("border rounded-[32px] overflow-hidden text-left shadow-sm transition-colors duration-500", theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-black/5")}>
            <div className={cn("p-6 border-b flex items-center justify-between transition-colors duration-500", theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-black/5")}>
              <h3 className={cn("text-[11px] font-bold uppercase tracking-widest transition-colors duration-500", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                Recent Intelligence
              </h3>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className={cn("text-[10px] font-bold uppercase tracking-widest border-b transition-colors duration-500", theme === 'dark' ? "bg-[#0d1117] text-gray-500 border-[#30363d]" : "bg-[#f9f9f8] text-gray-400 border-black/5")}>
                    <th className="px-8 py-5 font-bold">Time</th>
                    <th className="px-8 py-5 font-bold w-1/3">Query</th>
                    <th className="px-8 py-5 font-bold">Model</th>
                    <th className="px-8 py-5 font-bold">Latency</th>
                    <th className="px-8 py-5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y transition-colors duration-500", theme === 'dark' ? "divide-[#30363d]" : "divide-black/5")}>
                  {traces.map((t) => (
                    <tr key={t.trace_id} className={cn("transition-all duration-300 cursor-pointer group", theme === 'dark' ? "hover:bg-[#21262d]" : "hover:bg-gray-50")} onClick={() => setSelectedTrace(t)}>
                      <td className="px-8 py-5 text-gray-500 font-mono text-xs">{new Date(t.timestamp).toLocaleTimeString([], { hour12: false })}</td>
                      <td className="px-8 py-5">
                        <p className={cn("text-[14px] font-medium truncate max-w-sm transition-colors", theme === 'dark' ? "text-gray-300 group-hover:text-white" : "text-[#1a1a18] group-hover:text-blue-600")}>{t.question}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className={cn("inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-colors duration-500", theme === 'dark' ? "bg-[#0d1117] border-[#30363d] text-gray-400" : "bg-white border-black/5 text-gray-600 shadow-sm")}>
                          <Cpu size={12} className="text-blue-500" />
                          <span className="text-[11px] font-bold tracking-tight">{t.provider?.split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={cn("text-[14px] font-bold tracking-tight", theme === 'dark' ? "text-gray-300" : "text-gray-700")}>{t.latency_ms.toFixed(0)}ms</span>
                      </td>
                      <td className="px-8 py-5">
                        {t.error ? (
                          <div className="inline-flex items-center gap-1.5 text-red-500 text-[11px] font-bold uppercase tracking-tight">
                            <AlertCircle size={14} /> Failed
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-emerald-500 text-[11px] font-bold uppercase tracking-tight">
                            <CheckCircle2 size={14} /> Success
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
          ) : (
            /* ── Knowledge Base View ── */
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className={cn("text-2xl font-bold tracking-tight mb-2", theme === 'dark' ? "text-white" : "text-gray-900")}>Active Documents</h2>
                  <p className={cn("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>Files currently indexed in the semantic vector store and available to the AI.</p>
                </div>
                <div className={cn("px-4 py-2 rounded-full border text-sm font-semibold", theme === 'dark' ? "bg-[#161b22] border-[#30363d] text-gray-300" : "bg-white border-gray-200 text-gray-700 shadow-sm")}>
                  {documents.length} File{documents.length !== 1 && 's'}
                </div>
              </div>

              {documents.length === 0 ? (
                <div className={cn("flex flex-col items-center justify-center p-16 rounded-[32px] border text-center border-dashed", theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-300")}>
                  <Database size={48} className={theme === 'dark' ? "text-gray-600 mb-6" : "text-gray-300 mb-6"} />
                  <h3 className={cn("text-xl font-bold mb-2", theme === 'dark' ? "text-gray-300" : "text-gray-700")}>Source empty</h3>
                  <p className={cn("max-w-md", theme === 'dark' ? "text-gray-500" : "text-gray-500")}>You haven't uploaded any documents yet. Return to the Chat interface to upload files and they will appear here once processed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc, idx) => (
                    <div key={idx} className={cn("group flex flex-col p-6 rounded-[28px] border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden", theme === 'dark' ? "bg-[#161b22] border-[#30363d] hover:border-blue-500/50" : "bg-white border-black/5 hover:border-blue-200")}>
                      <div className="flex items-start justify-between mb-8 relative z-10">
                        <div className={cn("w-12 h-12 flex items-center justify-center rounded-2xl shadow-sm transition-colors", theme === 'dark' ? "bg-[#0d1117] text-blue-400" : "bg-blue-50 text-blue-600")}>
                          <FileText size={24} />
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <CustomTooltip content="Download File">
                            <button 
                              onClick={() => downloadDocument(doc)}
                              className={cn("p-2 rounded-full transition-colors", theme === 'dark' ? "bg-[#0d1117] text-gray-400 hover:text-white hover:bg-black" : "bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200")}
                            >
                              <Download size={16} />
                            </button>
                          </CustomTooltip>
                          <CustomTooltip content="Remove from AI Context">
                            <button 
                              onClick={() => handleDeleteSub(doc)}
                              disabled={isDeleting === doc}
                              className={cn("p-2 rounded-full transition-colors", 
                                isDeleting === doc 
                                  ? "opacity-50 cursor-not-allowed" 
                                  : (theme === 'dark' ? "bg-[#0d1117] text-red-500 hover:bg-red-500 hover:text-white" : "bg-red-50 text-red-600 hover:bg-red-500 hover:text-white")
                              )}
                            >
                              {isDeleting === doc ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                          </CustomTooltip>
                        </div>
                      </div>
                      <div className="mt-auto relative z-10">
                        <h3 className={cn("text-base font-bold truncate mb-1", theme === 'dark' ? "text-white" : "text-gray-900")} title={doc}>
                          {doc}
                        </h3>
                        <div className="flex items-center gap-2 mt-3">
                          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border", theme === 'dark' ? "bg-[#0d1117] border-emerald-500/30 text-emerald-500" : "bg-emerald-50 border-emerald-200 text-emerald-700")}>
                            Indexed
                          </span>
                        </div>
                      </div>
                      
                      {/* Subtle background decoration */}
                      <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity -mr-6 -mb-6 pointer-events-none">
                        <FileText size={120} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Trace Inspector ── */}
      {selectedTrace && (
        <div className="fixed inset-0 z-50 flex animate-fade-in transition-all">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTrace(null)} />
          
          <div className={cn("absolute right-0 top-0 bottom-0 w-full max-w-3xl border-l shadow-2xl flex flex-col animate-slide-left transition-all duration-500 ease-in-out", theme === 'dark' ? "bg-[#0d1117] border-[#30363d]" : "bg-white border-black/5")}>
            
            {/* Inspector Header */}
            <div className={cn("p-6 border-b flex items-center justify-between shrink-0 transition-colors duration-500", theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-[#f9f9f8] border-black/5")}>
              <div className="flex items-center gap-4">
                <CustomTooltip content="Close Inspector">
                  <button onClick={() => setSelectedTrace(null)} className={cn("p-2 rounded-xl transition-all duration-300", theme === 'dark' ? "text-gray-400 hover:text-white hover:bg-[#21262d]" : "text-gray-500 hover:text-gray-900 hover:bg-black/5")}><X size={20} /></button>
                </CustomTooltip>
                <div className={cn("h-6 w-px transition-colors duration-500", theme === 'dark' ? "bg-[#30363d]" : "bg-black/10")} />
                <div>
                  <h2 className={cn("text-base font-bold leading-tight transition-colors duration-500", theme === 'dark' ? "text-white" : "text-[#1a1a18]")}>Intelligence Trace</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1.5 opacity-60">{selectedTrace.trace_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedTrace.error ? (
                  <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest border border-red-500/20 shadow-sm">Failed</span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 shadow-sm">Verified</span>
                )}
              </div>
            </div>

            {/* Inspector Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide text-left transition-colors duration-500">
              
              {/* Telemetry Strip */}
              <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-[24px] border transition-all duration-500", theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-[#f9f9f8] border-black/5 shadow-inner")}>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">Model</span>
                  <span className={cn("text-sm font-bold tracking-tight transition-colors", theme === 'dark' ? "text-gray-200" : "text-[#1a1a18]")}>{selectedTrace.provider?.split(' ')[0]}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">Latency</span>
                  <span className={cn("text-sm font-bold tracking-tight transition-colors", theme === 'dark' ? "text-gray-200" : "text-[#1a1a18]")}>{selectedTrace.latency_ms.toFixed(0)}ms</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">Tokens</span>
                  <span className={cn("text-sm font-bold tracking-tight transition-colors", theme === 'dark' ? "text-gray-200" : "text-[#1a1a18]")}>{selectedTrace.input_tokens + selectedTrace.output_tokens}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">Cost</span>
                  <span className={cn("text-sm font-bold tracking-tight transition-colors", theme === 'dark' ? "text-gray-200" : "text-[#1a1a18]")}>${selectedTrace.cost_usd?.toFixed(5) || '0.00'}</span>
                </div>
              </div>

              {/* Conversation Preview */}
              <div className="space-y-6">
                <h3 className={cn("text-[11px] font-bold uppercase tracking-widest px-2 transition-colors", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>Protocol Insight</h3>
                
                <div className={cn("space-y-10 p-8 rounded-[32px] border transition-all duration-500", theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-black/5 shadow-sm")}>
                  
                  {/* User Message */}
                  <div className="flex gap-6 group">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors duration-500", theme === 'dark' ? "bg-[#0d1117] border-[#30363d]" : "bg-[#f9f9f8] border-black/5")}>
                      <User size={18} className={theme === 'dark' ? "text-gray-400" : "text-gray-600"} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <span className={cn("text-[11px] font-bold uppercase tracking-widest opacity-60 transition-colors", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>User</span>
                      <p className={cn("text-[16px] leading-[1.7] font-medium transition-colors duration-500", theme === 'dark' ? "text-[#e6edf3]" : "text-[#1a1a18]")}>{selectedTrace.question}</p>
                    </div>
                  </div>

                  {/* AI Message */}
                  <div className="flex gap-6 group">
                    <div className={cn("w-10 h-10 rounded-xl shadow-lg flex items-center justify-center shrink-0 transition-colors duration-500", theme === 'dark' ? "bg-black border border-[#30363d]" : "bg-white border border-black/5")}>
                      <Dhara size={24}
 className={theme === 'dark' ? "text-blue-400" : "text-blue-600"} />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                         <span className={cn("text-[11px] font-bold uppercase tracking-widest transition-colors", theme === 'dark' ? "text-gray-400" : "text-blue-600")}>Dhara AI</span>
                         <CustomTooltip content="Copy Answer">
                           <button onClick={() => copyToClipboard(renderCleanContent(selectedTrace.answer))} className={cn("p-2 rounded-xl transition-all duration-300 border", theme === 'dark' ? "text-gray-500 hover:text-white bg-[#0d1117] border-[#30363d]" : "text-gray-400 hover:text-gray-900 bg-[#f9f9f8] border-black/5 shadow-inner")}>
                              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                           </button>
                         </CustomTooltip>
                      </div>
                      <div className={cn("text-[16px] leading-[1.8] markdown-content overflow-x-auto transition-colors duration-500", theme === 'dark' ? "text-[#e6edf3]" : "text-[#1a1a18]")}>
                        {getThoughtFromMsg(selectedTrace.answer) && (
                          <div className="mb-6">
                            <button 
                              onClick={() => toggleThought(0)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border mb-3",
                                theme === 'dark' 
                                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20" 
                                  : "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100"
                              )}
                            >
                              <Cpu size={14} className={!collapsedThoughts.has(0) ? "animate-pulse" : ""} />
                              {collapsedThoughts.has(0) ? "Show Reasoning Protocol" : "Hide Reasoning Protocol"}
                            </button>
                            
                            {!collapsedThoughts.has(0) && (
                              <div className={cn(
                                "p-5 rounded-2xl border text-[14px] leading-relaxed italic transition-all duration-500",
                                theme === 'dark' 
                                  ? "bg-[#0d1117] border-[#30363d] text-gray-400" 
                                  : "bg-gray-50 border-black/5 text-gray-500"
                              )}>
                                {getThoughtFromMsg(selectedTrace.answer)}
                              </div>
                            )}
                          </div>
                        )}
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                          {renderCleanContent(selectedTrace.answer) || "No response generated."}
                        </ReactMarkdown>
                      </div>
                      
                      {selectedTrace.num_sources > 0 && (
                        <div className="pt-4">
                          <span className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-500 shadow-sm", theme === 'dark' ? "bg-[#0d1117] border-[#30363d] text-gray-400" : "bg-blue-50 border-blue-100 text-blue-600")}>
                            <Database size={12} /> {selectedTrace.num_sources} Knowledge Nodes
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, trend, theme }: { label: string, value: string, icon: React.ReactNode, trend?: 'good' | 'bad', theme: string }) {
  return (
    <div className={cn("rounded-[28px] p-6 transition-all duration-500 text-left flex flex-col gap-4 relative overflow-hidden border", theme === 'dark' ? "bg-[#161b22] border-[#30363d] hover:border-blue-500/30" : "bg-white border-black/5 hover:border-blue-200 shadow-sm")}>
      <div className={cn("flex items-center gap-3 transition-colors duration-500", theme === 'dark' ? "text-gray-500" : "text-gray-400")}>
        <div className={cn("p-2 rounded-lg transition-colors duration-500", theme === 'dark' ? "bg-[#0d1117]" : "bg-[#f9f9f8]")}>{icon}</div>
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className={cn("text-3xl font-bold tracking-tight leading-none transition-colors duration-500", theme === 'dark' ? "text-white" : "text-[#1a1a18]")}>{value}</p>
      {trend && (
        <div className={cn("absolute right-6 top-7 w-2 h-2 rounded-full", trend === 'good' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]")} />
      )}
    </div>
  );
}
