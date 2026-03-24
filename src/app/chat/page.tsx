'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Send, User, Loader2, 
  PanelLeftOpen, PanelLeftClose, Sparkles,
  Search, History, Trash2, LogOut,
  MapPin, FileText, ChevronRight, MessageSquare,
  Settings, Bell, Copy, Share2, Check, Paperclip, 
  MoreHorizontal, Maximize2
} from 'lucide-react';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleThought = (id: string) => {
    setExpandedThoughts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const uRes = await api.get('/auth/me', { params: { token: token || 'mock' } });
        setUser(uRes.data);
        fetchSessions();
      } catch (err) {
        // Mock user for bypass
        setUser({ username: 'Rahul', role: 'admin' });
        fetchSessions();
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data);
    } catch (err) {}
  };

  const loadSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsThinking(true);
    try {
      const res = await api.get(`/sessions/${sessionId}/history`);
      setMessages(res.data);
    } catch (err) {
    } finally {
      setIsThinking(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/auth');
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/sessions/${id}`);
      fetchSessions();
      if (currentSessionId === id) startNewChat();
    } catch (err) {}
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareContent = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Dhara PMC', text: text, url: window.location.href });
      } catch (err) {}
    } else {
      copyToClipboard(text, 'share');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsThinking(true);

    try {
      let activeId = currentSessionId;
      if (!activeId) {
        const res = await api.post('/sessions', null, { params: { title: currentInput.slice(0, 40) } });
        activeId = res.data.session_id;
        setCurrentSessionId(activeId);
        fetchSessions();
      }

      const res = await api.post('/chat', { message: currentInput, session_id: activeId });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: res.data.answer,
        timestamp: new Date().toISOString(),
        metadata: res.data
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Unable to connect to the Dhara engine." }]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#d97757]" /></div>;

  return (
    <div className="flex h-screen bg-[#fcfcfb] text-[#343433] font-sans overflow-hidden">
      {/* Sidebar - Minimalist Claude Style */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0'} bg-[#f5f5f2] border-r border-[#e5e5e0] transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="p-5 flex items-center justify-between">
          <button onClick={startNewChat} className="flex items-center gap-2 font-semibold text-sm hover:opacity-70 transition-opacity">
            <div className="w-7 h-7 bg-[#d97757] rounded-md flex items-center justify-center text-white">
              <Sparkles size={14} fill="currentColor" />
            </div>
            Dhara
          </button>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-gray-600"><PanelLeftClose size={18} /></button>
        </div>

        <button onClick={startNewChat} className="mx-4 mb-4 p-2.5 bg-white border border-[#e5e5e0] rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors">
          <Plus size={14} /> New Chat
        </button>

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          <div className="px-3 mb-2 mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent</div>
          {sessions.map(s => (
            <div key={s.id} onClick={() => loadSession(s.id)} className={`group px-3 py-2 rounded-lg text-sm cursor-pointer flex items-center justify-between transition-colors ${currentSessionId === s.id ? 'bg-[#ebebe8]' : 'hover:bg-[#ebebe8]/50'}`}>
              <span className="truncate flex-1 font-medium">{s.title || "New Inquiry"}</span>
              <button onClick={(e) => deleteSession(e, s.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#e5e5e0]">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 bg-white border border-[#e5e5e0] rounded-full flex items-center justify-center text-[10px] font-bold uppercase">{user.username?.[0]}</div>
            <span className="text-xs font-bold flex-1 truncate">{user.username}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500"><LogOut size={14} /></button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-white">
        {!isSidebarOpen && (
          <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-20 p-2 text-gray-400 hover:text-gray-600 bg-white/50 backdrop-blur rounded-lg">
            <PanelLeftOpen size={20} />
          </button>
        )}

        <div className="flex-1 overflow-y-auto scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-serif font-medium mb-8">How can Dhara help you?</h1>
              <div className="grid grid-cols-2 gap-3 w-full">
                {[
                  "Plot Feasibility for Kothrud",
                  "FSI for Residential Zones",
                  "DCPR 2017 side margins",
                  "Society Registration process"
                ].map((q, i) => (
                  <button key={i} onClick={() => setInput(q)} className="p-4 border border-[#e5e5e0] rounded-xl text-sm font-medium hover:border-[#d97757] hover:bg-[#fffcfb] transition-all text-left">
                    {q} <ChevronRight size={14} className="inline float-right mt-1 opacity-30" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-6 py-12 space-y-12">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-6 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-md bg-[#d97757]/10 flex items-center justify-center text-[#d97757] shrink-0 mt-1">
                      <Sparkles size={16} fill="currentColor" />
                    </div>
                  )}
                  <div className={`flex flex-col ${m.role === 'user' ? 'max-w-[75%]' : 'max-w-[85%]'}`}>
                    
                    {/* Assistant Thinking Block */}
                    {m.role === 'assistant' && m.metadata?.thought_process && (
                      <div className="mb-4 border-l-2 border-gray-100 pl-4">
                        <button 
                          onClick={() => toggleThought(`t-${i}`)}
                          className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#d97757] transition-colors"
                        >
                          <ChevronRight size={14} className={`transition-transform duration-200 ${expandedThoughts[`t-${i}`] ? 'rotate-90' : ''}`} />
                          {expandedThoughts[`t-${i}`] ? 'Hide Thinking Process' : 'Show Thinking Process'}
                        </button>
                        
                        {expandedThoughts[`t-${i}`] && (
                          <div className="mt-3 space-y-2 animate-fade-in">
                            {m.metadata.thought_process.map((step: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-gray-500 font-medium italic">
                                <div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                                {step}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`text-[15px] leading-relaxed ${m.role === 'user' ? 'bg-[#f4f4f2] px-4 py-3 rounded-2xl' : ''}`}>
                      <div className="prose prose-slate prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Metadata Metadata Block */}
                    {m.role === 'assistant' && m.metadata && (
                      <div className="mt-6 space-y-4 animate-fade-in border-t border-gray-50 pt-4">
                        {/* Confidence Score */}
                        {m.metadata.confidence !== undefined && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span>Confidence:</span>
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${m.metadata.confidence > 0.7 ? 'bg-emerald-500' : m.metadata.confidence > 0.4 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${m.metadata.confidence * 100}%` }}
                              />
                            </div>
                            <span className={m.metadata.confidence > 0.7 ? 'text-emerald-600' : m.metadata.confidence > 0.4 ? 'text-amber-600' : 'text-rose-600'}>
                              {Math.round(m.metadata.confidence * 100)}%
                            </span>
                          </div>
                        )}

                        {/* Clauses & Tables */}
                        {(m.metadata.clauses_found?.length > 0 || m.metadata.tables_found?.length > 0) && (
                          <div className="flex flex-wrap gap-2">
                            {m.metadata.clauses_found?.map((c: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-100 uppercase tracking-tight">
                                {c}
                              </span>
                            ))}
                            {m.metadata.tables_found?.map((t: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-md border border-purple-100 uppercase tracking-tight">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Suggestions */}
                        {m.metadata.suggestions?.length > 0 && i === messages.length - 1 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suggested follow-ups</p>
                            <div className="flex flex-wrap gap-2">
                              {m.metadata.suggestions.map((s: string, idx: number) => (
                                <button 
                                  key={idx} 
                                  onClick={() => setInput(s)}
                                  className="text-left px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-[#d97757] hover:text-[#d97757] hover:bg-[#fffcfb] transition-all"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {m.role === 'assistant' && (
                      <div className="flex items-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => copyToClipboard(m.content, `c-${i}`)} className="text-gray-400 hover:text-[#d97757] flex items-center gap-1 text-[10px] font-bold uppercase">
                           {copiedId === `c-${i}` ? <Check size={12} /> : <Copy size={12} />} {copiedId === `c-${i}` ? 'Copied' : 'Copy'}
                         </button>
                         <button onClick={() => shareContent(m.content)} className="text-gray-400 hover:text-[#d97757] flex items-center gap-1 text-[10px] font-bold uppercase"><Share2 size={12} /> Share</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex gap-6 animate-pulse">
                  <div className="w-8 h-8 rounded-md bg-[#d97757]/10 flex items-center justify-center text-[#d97757] shrink-0"><Sparkles size={16} /></div>
                  <div className="text-gray-400 text-sm italic font-serif py-1">Thinking...</div>
                </div>
              )}
              <div ref={scrollRef} className="h-32" />
            </div>
          )}
        </div>

        {/* Floating Input Area - Claude Style */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <div className="relative bg-[#f4f4f2] rounded-2xl border border-[#e5e5e0] focus-within:border-gray-400 transition-all p-2 shadow-sm">
              <textarea 
                rows={1}
                className="w-full bg-transparent resize-none py-3 px-4 focus:outline-none text-[15px] placeholder-gray-500"
                placeholder="Message Dhara..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-gray-400 hover:bg-gray-200 rounded-md transition-colors"><Paperclip size={16} /></button>
                  <button className="p-1.5 text-gray-400 hover:bg-gray-200 rounded-md transition-colors"><Maximize2 size={16} /></button>
                </div>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isThinking}
                  className={`p-1.5 rounded-lg transition-all ${input.trim() && !isThinking ? 'bg-[#d97757] text-white' : 'bg-gray-300 text-gray-50'}`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">Dhara can provide regulatory guidance but always verify with PMC officers.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
