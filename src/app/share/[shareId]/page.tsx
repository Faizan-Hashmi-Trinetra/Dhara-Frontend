/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MessageSquare, Plus, LogOut, FileText, Trash,
  Send, Bot, User, Loader2, ShieldCheck, BarChart2,
  ChevronRight, ChevronLeft, Search, FileUp, Database, Sparkles,
  Clock, RefreshCw, ChevronDown, ExternalLink, Copy, Check,
  MoreVertical, Activity, Download, Shield, Zap, PanelLeftOpen, PanelLeftClose,
  Paperclip, ArrowUp, Cpu, Settings, Moon, Sun, Monitor, Sliders, Key, Cloud, Star, Pencil, Ghost, X, ChevronsUpDown,
  Maximize2, Minimize2, Brain, Sparkle, ThumbsUp, ThumbsDown, UserCircle, CreditCard, Bell, ShieldEllipsis,
  HelpCircle, Sparkles as SparklesIcon, RotateCcw, Clipboard, MoreHorizontal, Folder, Info,
  Globe, ArrowUpCircle, Gift
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Tooltip } from '@/components/ui/Tooltip';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SparkIcon = ({ className, size = 16 }: { className?: string, size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4L18.4 5.6" />
  </svg>
);

const Dhara = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3c-4.42 0-8 3.58-8 8v2c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-2c0-4.42-3.58-8-8-8z" />
    <path d="M7 15c0 2 1.5 2 1.5 4s-1.5 2-1.5 4" />
    <path d="M10.5 15c0 2 1.5 2 1.5 4s-1.5 2-1.5 4" />
    <path d="M13.5 15c0 2 1.5 2 1.5 4s-1.5 2-1.5 4" />
    <path d="M17 15c0 2-1.5 2-1.5 4s 1.5 2 1.5 4" />
  </svg>
);

export default function SharedChatPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [sharedSession, setSharedSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState('');
  const [llmThought, setLlmThought] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedSources, setExpandedSources] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState<string | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  const [sidebarEditingId, setSidebarEditingId] = useState<string | null>(null);
  const [headerRenaming, setHeaderRenaming] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [renamingLoading, setRenamingLoading] = useState(false);

  const [collapsedThoughts, setCollapsedThoughts] = useState<Set<number>>(new Set());

  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('appearance');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<number, string | null>>({});
  // Branching: key = index of the user message that was edited
  // value = { branches: Array of {messages: [{role, content}...]}, activeBranch: number }
  const [messageBranches, setMessageBranches] = useState<Record<string, { branches: any[][], activeBranch: number }>>({});



  
  
  
  

  useEffect(() => {
    const savedTheme = localStorage.getItem('dhara_theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('dhara_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 500) newWidth = 500;
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const formatHoverTimestamp = (ts: any) => {
    const d = new Date(ts || Date.now());
    const dateStr = d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
    return `${dateStr}, ${timeStr}`;
  };

  const formatDisplayTimestamp = (ts: any) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.getDate() === now.getDate() &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
    }
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short' });
  };

  const scrollToBottom = () => scrollRef.current?.scrollIntoView({ behavior: 'smooth' });

  const filteredSearchSessions = React.useMemo(() => {
    return sessions.filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [sessions, searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(true); setSelectedSearchIndex(0); }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        setSidebarEditingId(null);
        setHeaderRenaming(false);
        setIsHeaderMenuOpen(false);
        setEditingMessageIndex(null);
        setSessionMenuOpen(null);
      }
      if (isSearchOpen) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedSearchIndex(prev => (prev + 1) % Math.max(filteredSearchSessions.length, 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedSearchIndex(prev => (prev - 1 + filteredSearchSessions.length) % Math.max(filteredSearchSessions.length, 1)); }
        else if (e.key === 'Enter') { e.preventDefault(); if (filteredSearchSessions[selectedSearchIndex]) { loadSession(filteredSearchSessions[selectedSearchIndex].id); setIsSearchOpen(false); } }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearchOpen, filteredSearchSessions, selectedSearchIndex]);

  useEffect(() => { setSelectedSearchIndex(0); }, [searchQuery]);

  const sidebarFileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch shared session data using shareId
        const res = await api.get(`/sessions/${shareId}/public`);
        setSharedSession({ title: res.data.title });
        
        // Filter trunk messages exactly like main view
        const allMsgs = res.data.messages || [];
        const trunk = allMsgs.filter((m: any) => m.branch_index === 0 || m.branch_index == null).sort((a: any, b: any) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setMessages(trunk);
      } catch (err) {
        console.error("Failed to fetch shared session", err);
      } finally {
        setLoading(false);
      }

      // Optional: fetch user info if logged in (for sidebar/UI)
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const uRes = await api.get('/auth/me');
          setUser(uRes.data);
          fetchSessions();
          fetchDocuments();
        } catch (e) {
          // Not logged in or token expired, just show public share
        }
      }
    };
    init();
  }, [shareId, router]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingStatus, llmThought, isThinking]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isProfileOpen && !target.closest('.profile-dropdown-container')) setIsProfileOpen(false);
      if (sessionMenuOpen && !target.closest('.session-menu-container')) setSessionMenuOpen(null);
      if (isHeaderMenuOpen && !target.closest('.header-menu-container')) setIsHeaderMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, sessionMenuOpen, isHeaderMenuOpen]);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data.filter((s: any) => s.title));
    } catch (e) { }
  };

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (e) { }
  };

  
  const loadSession = async (id: string) => {
    router.push(`/chat?session=${id}`);
  };
const renameSession = async (id: string | null, newTitle: string) => {
    if (!id || renamingLoading) return;
    try {
      setRenamingLoading(true);
      if (newTitle.trim()) {
        await api.put(`/sessions/${id}`, { title: newTitle.trim() });
        setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle.trim() } : s));
      }
      setSidebarEditingId(null);
      setHeaderRenaming(false);
    } catch (e) {
    } finally {
      setRenamingLoading(false);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await api.delete(`/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) startNewChat();
    } catch (e) { }
  };

  const toggleStarSession = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    try {
      const newStarredStatus = !session.isStarred;
      await api.put(`/sessions/${id}`, { is_starred: newStarredStatus });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, isStarred: newStarredStatus } : s));
      setSessionMenuOpen(null);
    } catch (e) { }
  };

  
  const startNewChat = () => {
    router.push('/chat');
  };
const logout = () => {
    localStorage.removeItem('access_token');
    router.push('/auth');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsUploading(true);
    const files = Array.from(e.target.files);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try { await api.post('/ingest', formData); } catch (err) { }
    }
    setIsUploading(false);
    await fetchDocuments();
  };

  const deleteDocument = async (name: string) => {
    try { await api.delete(`/documents/${name}`); await fetchDocuments(); } catch (e) { }
  };

  const downloadDocument = async (filename: string) => {
    try {
      const res = await api.get(`/documents/${filename}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', filename);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (e) { }
  };

  const copyToClipboard = (text: string, index: number) => {
    const cleanText = text.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();
    navigator.clipboard.writeText(cleanText);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleThought = (index: number) => {
    setCollapsedThoughts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index); else newSet.add(index);
      return newSet;
    });
  };

  const renderCleanContent = (content: string) => {
    if (typeof content !== 'string') return '';
    return content
      .replace(/<thought>[\s\S]*?<\/thought>/g, '')  // strip complete thought blocks
      .replace(/<thought>[\s\S]*/g, '')               // strip partial/unclosed thought tags during streaming
      .trim();
  };

  const getThoughtFromMsg = (content: string) => {
    if (typeof content !== 'string') return null;
    const match = content.match(/<thought>([\s\S]*?)<\/thought>/);
    if (match) return match[1];
    const partialMatch = content.match(/<thought>([\s\S]*?)$/);
    return partialMatch ? partialMatch[1] : null;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5 || hour >= 21) return "Hello, night owl";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const currentSessionTitle = sessions.find(s => s.id === currentSessionId)?.title;

  const markdownComponents = {
    p: ({ children }: any) => <p className={cn("mb-4 last:mb-0 leading-[1.6] text-[16px] font-normal", theme === 'dark' ? "text-[#e8e6e1]" : "text-[#1a1a18]")}>{children}</p>,
    h1: ({ children }: any) => <h1 className={cn("text-[22px] font-semibold mb-4 mt-6 tracking-tight", theme === 'dark' ? "text-white" : "text-[#1a1a18]")}>{children}</h1>,
    h2: ({ children }: any) => <h2 className={cn("text-[18px] font-semibold mb-3 mt-5 tracking-tight", theme === 'dark' ? "text-white" : "text-[#1a1a18]")}>{children}</h2>,
    h3: ({ children }: any) => <h3 className={cn("text-[16px] font-semibold mb-2 mt-4 tracking-tight", theme === 'dark' ? "text-white" : "text-[#1a1a18]")}>{children}</h3>,
    ul: ({ children }: any) => <ul className="list-disc pl-6 mb-4 space-y-1.5">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-4 space-y-1.5">{children}</ol>,
    li: ({ children }: any) => <li className={cn("mb-1 leading-[1.6] text-[16px]", theme === 'dark' ? "text-[#e8e6e1]" : "text-[#1a1a18]")}>{children}</li>,
    code: ({ inline, children, className }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <pre className={cn("rounded-xl p-4 my-4 overflow-x-auto", theme === 'dark' ? "bg-[#1e1e1e]" : "bg-black/5")}>
          <code className={cn(className, "text-[14px]")}>{children}</code>
        </pre>
      ) : (
        <code className={cn("px-1.5 py-0.5 rounded-md text-[14px]", theme === 'dark' ? "bg-white/10 text-white" : "bg-black/5 text-[#d16a50]")}>
          {children}
        </code>
      );
    },
    blockquote: ({ children }: any) => <blockquote className={cn("border-l-2 pl-5 italic my-6 transition-colors duration-300 py-1", theme === 'dark' ? "border-[#4a4a47] text-[#9a9994]" : "border-black/5 text-gray-500")}>{children}</blockquote>,
    table: ({ children }: any) => <div className={cn("overflow-x-auto my-6 border rounded-xl transition-colors duration-300 shadow-sm", theme === 'dark' ? "border-white/10" : "border-gray-200")}><table className="w-full text-sm text-left">{children}</table></div>,
    th: ({ children }: any) => <th className={cn("px-4 py-3 font-bold border-b transition-colors duration-300", theme === 'dark' ? "bg-[#262624] border-[#3d3d3a] text-[#d7d5d0]" : "bg-gray-50 border-gray-200 text-gray-900")}>{children}</th>,
    td: ({ children }: any) => <td className={cn("px-4 py-3 border-b transition-colors duration-300", theme === 'dark' ? "border-white/10 text-[#d1d1d1]" : "border-gray-200 text-gray-700")}>{children}</td>,
  };

  
  if (loading) return <div className={cn("min-h-screen flex items-center justify-center", theme === 'dark' ? "bg-[#2b2b2a]" : "bg-[#fdfcfb]")}><p className="text-[#8e8e8e] animate-pulse">Loading...</p></div>;

  return (
    <div className={cn("flex h-screen font-sans selection:bg-blue-500/30 overflow-hidden text-left relative transition-all duration-500", theme === 'dark' ? "bg-[#2b2b2a] text-[#d7d5d0]" : "bg-[#ffffff] text-[#1a1a18]")}>

      {user && (
        <aside
          style={{ width: isSidebarOpen ? sidebarWidth : 56 }}
          className={cn(
            "flex flex-col shrink-0 z-20 relative transition-all ease-in-out border-r",
            isResizing ? "duration-0" : "duration-500",
            theme === 'dark' ? "bg-[#2f2f2e] border-[#3d3d3a]" : "bg-[#f9f9f8] border-[#e5e5e5]"
          )}>
          <div onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }} className={cn("absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 z-50 transition-colors", !isSidebarOpen && "hidden")} />

          <div className="flex flex-col h-full w-full">
            {/* Sidebar Top */}
            <div className="flex h-[64px] transition-all duration-300 w-full relative shrink-0">
              <div className={cn("flex-1 px-0 flex items-center transition-all duration-500 overflow-hidden", isSidebarOpen ? "opacity-100" : "opacity-0 w-0 h-0 invisible")}>
                <div className="w-12 flex items-center justify-start pl-4 shrink-0">
                  <Dhara size={20} className={theme === 'dark' ? "text-[#da765e]" : "text-[#d16a50]"} />
                </div>
                <span className={cn("font-serif text-[20px] font-medium tracking-tight whitespace-nowrap", theme === 'dark' ? "text-white" : "text-[#1a1a18]")}>Dhara</span>
              </div>
              <div className={cn("w-12 flex items-center justify-center shrink-0 transition-all duration-300", isSidebarOpen ? "relative" : "absolute inset-0 mx-auto")}>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={cn("w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300", theme === 'dark' ? "text-gray-400 hover:bg-white/5 hover:text-white" : "text-[#666666] hover:bg-black/5 hover:text-[#1a1a18]")}>
                  {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col pt-2 min-h-0">
              <div className="flex flex-col w-full px-0">
                <Tooltip content="New chat" side="right" hidden={isSidebarOpen} className="w-full">
                  <button onClick={startNewChat} className={cn("flex items-center transition-all duration-300 text-[14px] font-medium min-h-[40px] relative group/btn w-full rounded-xl", theme === 'dark' ? "text-white" : "text-[#1a1a18]")}>
                    <div className={cn("absolute inset-y-0.5 left-2 right-2 rounded-xl transition-colors", theme === 'dark' ? "group-hover/btn:bg-[#3d3d3a]" : "group-hover/btn:bg-black/5")} />
                    <div className="relative z-10 flex items-center w-full">
                      <div className="w-12 h-10 flex items-center justify-start pl-4 shrink-0">
                        <Plus size={18} />
                      </div>
                      <div className={cn("transition-all duration-500 overflow-hidden", isSidebarOpen ? "opacity-100 w-auto visible" : "opacity-0 w-0 invisible")}>
                        <span className="whitespace-nowrap font-medium pr-4">New chat</span>
                      </div>
                    </div>
                  </button>
                </Tooltip>
                <Tooltip content="Search" side="right" hidden={isSidebarOpen} className="w-full">
                  <button onClick={() => setIsSearchOpen(true)} className={cn("flex items-center transition-all duration-200 text-left min-h-[40px] relative group/btn w-full rounded-xl", theme === 'dark' ? "text-gray-300 hover:text-white" : "text-[#1a1a18]")}>
                    <div className={cn("absolute inset-y-0.5 left-2 right-2 rounded-xl transition-colors", theme === 'dark' ? "group-hover/btn:bg-[#3d3d3a]" : "group-hover/btn:bg-black/5")} />
                    <div className="relative z-10 flex items-center w-full">
                      <div className="w-12 h-10 flex items-center justify-start pl-4 shrink-0">
                        <Search size={18} />
                      </div>
                      <div className={cn("transition-all duration-500 overflow-hidden", isSidebarOpen ? "opacity-100 w-auto visible" : "opacity-0 w-0 invisible")}>
                        <span className="whitespace-nowrap font-medium pr-4">Search</span>
                      </div>
                    </div>
                  </button>
                </Tooltip>
                <Tooltip content="Observatory" side="right" hidden={isSidebarOpen} className="w-full">
                  <button onClick={() => router.push('/dashboard')} className={cn("flex items-center transition-all duration-300 text-[14px] font-medium min-h-[40px] relative group/btn w-full rounded-xl", theme === 'dark' ? "text-[#d7d5d0]" : "text-[#1a1a18]")}>
                    <div className={cn("absolute inset-y-0.5 left-2 right-2 rounded-xl transition-colors", theme === 'dark' ? "group-hover/btn:bg-[#3d3d3a]" : "group-hover/btn:bg-black/5")} />
                    <div className="relative z-10 flex items-center w-full">
                      <div className="w-12 h-10 flex items-center justify-start pl-4 shrink-0">
                        <BarChart2 size={18} />
                      </div>
                      <div className={cn("transition-all duration-500 overflow-hidden", isSidebarOpen ? "opacity-100 w-auto visible" : "opacity-0 w-0 invisible")}>
                        <span className="whitespace-nowrap font-medium pr-4">Observatory</span>
                      </div>
                    </div>
                  </button>
                </Tooltip>
              </div>

              {isSidebarOpen && (
                <div className="flex-1 flex flex-col min-h-0 pt-6 overflow-y-auto scrollbar-hide">
                  {/* Knowledge Section */}
                  <div className="mb-8 shrink-0">
                    <h3 className="text-[11px] font-semibold tracking-wider text-[#8e8e8e] px-4 mb-3 flex items-center justify-between">
                      <span>Knowledge</span>
                      {isUploading && <Loader2 size={12} className="animate-spin text-blue-500" />}
                    </h3>
                    <div className="px-0 space-y-1">
                      <button type="button" onClick={() => sidebarFileInputRef.current?.click()} className={cn("w-full flex items-center transition-all duration-200 group px-0 py-2 rounded-xl relative", theme === 'dark' ? "text-[#8e8e8e] hover:text-white" : "text-[#666666] hover:text-[#1a1a18]")}>
                        <div className={cn("absolute inset-y-0.5 left-2 right-2 rounded-xl transition-colors", theme === 'dark' ? "group-hover:bg-[#3d3d3a]" : "group-hover:bg-black/5")} />
                        <div className="relative z-10 flex items-center w-full">
                          <div className="w-12 flex items-center justify-start pl-4 shrink-0">
                            <Plus size={14} />
                          </div>
                          <input type="file" ref={sidebarFileInputRef} className="hidden" multiple onChange={handleUpload} />
                          <span className="text-[12px] font-semibold tracking-wider">Upload</span>
                        </div>
                      </button>
                      <div className="space-y-0.5 mt-2">
                        {documents.map(d => (
                          <div key={d} className={cn("flex items-center justify-between group px-0 py-1.5 rounded-xl transition-all duration-300 relative", theme === 'dark' ? "hover:bg-transparent" : "hover:bg-transparent")}>
                            <div className={cn("absolute inset-y-0.5 left-2 right-2 rounded-xl transition-colors", theme === 'dark' ? "group-hover:bg-[#3d3d3a]" : "group-hover:bg-black/5")} />
                            <div className="flex items-center w-full cursor-pointer relative z-10" onClick={() => downloadDocument(d)}>
                              <div className="w-12 flex items-center justify-start pl-4 shrink-0">
                                <FileText size={14} className="text-gray-500" />
                              </div>
                              <span className={cn("text-[14px] truncate transition-colors duration-500 flex-1 min-w-0 font-medium", theme === 'dark' ? "text-[#8e8e8e] group-hover:text-white" : "text-[#1a1a18] group-hover:text-[#1a1a18]")}>{d}</span>
                            </div>
                            <button onClick={() => deleteDocument(d)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all duration-300 relative z-20 pr-3"><Trash size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Chat History Section */}
                  <div className="mb-6">
                    {sessions.filter(s => s.isStarred).length > 0 && (
                      <div className="mb-6 shrink-0">
                        <h3 className="text-[11px] font-semibold tracking-wider text-[#8e8e8e] px-4 mb-2">Starred</h3>
                        <div className="px-0 space-y-0.5">
                          {sessions.filter(s => s.isStarred).map(s => (
                            <div key={s.id} className="relative group/item session-menu-container">
                              {sidebarEditingId === s.id ? (
                                <div className={cn("flex items-center relative z-10 h-[40px] pl-4 pr-4 rounded-xl", theme === 'dark' ? "bg-white/5" : "bg-black/5")}>
                                  <input autoFocus className={cn("flex-1 bg-transparent border-none focus:outline-none text-[14px] w-full", theme === 'dark' ? "text-white" : "text-[#1a1a18]")} value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') renameSession(s.id, editingTitle); if (e.key === 'Escape') setSidebarEditingId(null); }} onBlur={() => renameSession(s.id, editingTitle)} />
                                </div>
                              ) : (
                                <>
                                  <div className={cn("absolute inset-y-0.5 left-2 right-2 rounded-xl transition-colors", currentSessionId === s.id ? (theme === 'dark' ? "bg-[#3d3d3a]" : "bg-black/5") : (theme === 'dark' ? "group-hover/item:bg-white/5" : "group-hover/item:bg-black/5"))} />
                                  <button onClick={() => loadSession(s.id)} className={cn("w-full text-left rounded-xl text-[14px] transition-all duration-200 truncate px-4 py-2 pr-10 relative z-10", currentSessionId === s.id ? (theme === 'dark' ? "text-[#e8e6e1] font-medium" : "text-[#1a1a18] font-medium") : (theme === 'dark' ? "text-[#9a9994] hover:text-[#e8e6e1]" : "text-[#666666] hover:text-[#1a1a18]"))}>
                                    <div className="truncate w-full">{s.title}</div>
                                  </button>
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity z-20">
                                    <button onClick={(e) => { e.stopPropagation(); setSessionMenuOpen(s.id === sessionMenuOpen ? null : s.id); }} className={cn("p-1 rounded-md transition-colors", theme === 'dark' ? "text-gray-400 hover:bg-white/10" : "text-[#666666] hover:bg-black/5")}><MoreHorizontal size={14} /></button>
                                  </div>
                                  {sessionMenuOpen === s.id && (
                                    <div className={cn("absolute top-full right-0 mt-1 w-48 rounded-xl shadow-2xl border p-1 z-50 animate-fade-in", theme === 'dark' ? "bg-[#353534] border-[#4a4a47]" : "bg-white border-black/5")}>
                                      <button onClick={(e) => { e.stopPropagation(); toggleStarSession(s.id); setSessionMenuOpen(null); }} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", theme === 'dark' ? "text-[#d1d1d1] hover:bg-white/5 hover:text-white" : "text-[#1a1a18] hover:bg-black/5")}><Star size={16} fill="currentColor" className="text-yellow-500" /> Unstar</button>
                                      <button onClick={(e) => { e.stopPropagation(); setSidebarEditingId(s.id); setEditingTitle(s.title); setSessionMenuOpen(null); }} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", theme === 'dark' ? "text-[#d1d1d1] hover:bg-white/5 hover:text-white" : "text-[#1a1a18] hover:bg-black/5")}><Pencil size={16} /> Rename</button>
                                      <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); setSessionMenuOpen(null); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 text-sm font-medium transition-colors"><Trash size={16} /> Delete</button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <h3 className="text-[11px] font-semibold tracking-wider text-[#8e8e8e] px-4 mb-2">Recents</h3>
                    <div className="px-0 space-y-0.5">
                      {sessions.filter(s => !s.isStarred).slice(0, 15).map(s => (
                        <div key={s.id} className="relative group/item session-menu-container">
                          {sidebarEditingId === s.id ? (
                            <div className={cn("flex items-center relative z-10 h-[40px] pl-4 pr-4 rounded-xl", theme === 'dark' ? "bg-white/5" : "bg-black/5")}>
                              <input autoFocus className={cn("flex-1 bg-transparent border-none focus:outline-none text-[14px] py-1 w-full", theme === 'dark' ? "text-white" : "text-[#1a1a18]")} value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') renameSession(s.id, editingTitle); if (e.key === 'Escape') setSidebarEditingId(null); }} onBlur={() => renameSession(s.id, editingTitle)} />
                            </div>
                          ) : (
                            <>
                              <div className={cn("absolute inset-y-0.5 left-2 right-2 rounded-xl transition-colors", currentSessionId === s.id ? (theme === 'dark' ? "bg-[#3d3d3a]" : "bg-black/5") : (theme === 'dark' ? "group-hover/item:bg-white/5" : "group-hover/item:bg-black/5"))} />
                              <button onClick={() => loadSession(s.id)} className={cn("w-full text-left rounded-xl text-[14px] transition-all duration-200 truncate px-4 py-2 pr-10 relative z-10", currentSessionId === s.id ? (theme === 'dark' ? "text-[#e8e6e1] font-medium" : "text-[#1a1a18] font-medium") : (theme === 'dark' ? "text-[#9a9994] hover:text-[#e8e6e1]" : "text-[#666666] hover:text-[#1a1a18]"))}>
                                <span className="truncate w-full">{s.title}</span>
                              </button>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity z-20">
                                <button onClick={(e) => { e.stopPropagation(); setSessionMenuOpen(s.id === sessionMenuOpen ? null : s.id); }} className={cn("p-1 rounded-md transition-colors", theme === 'dark' ? "text-gray-400 hover:bg-white/10" : "text-[#666666] hover:bg-black/5")}><MoreHorizontal size={14} /></button>
                              </div>
                              {sessionMenuOpen === s.id && (
                                <div className={cn("absolute top-full right-0 mt-1 w-48 rounded-xl shadow-2xl border p-1 z-50 animate-fade-in", theme === 'dark' ? "bg-[#353534] border-[#4a4a47]" : "bg-white border-black/5")}>
                                  <button onClick={(e) => { e.stopPropagation(); toggleStarSession(s.id); setSessionMenuOpen(null); }} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", theme === 'dark' ? "text-[#d1d1d1] hover:bg-white/5 hover:text-white" : "text-[#1a1a18] hover:bg-black/5")}><Star size={16} /> Star</button>
                                  <button onClick={(e) => { e.stopPropagation(); setSidebarEditingId(s.id); setEditingTitle(s.title); setSessionMenuOpen(null); }} className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", theme === 'dark' ? "text-[#d1d1d1] hover:bg-white/5 hover:text-white" : "text-[#1a1a18] hover:bg-black/5")}><Pencil size={16} /> Rename</button>
                                  <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); setSessionMenuOpen(null); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 text-sm font-medium transition-colors"><Trash size={16} /> Delete</button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={cn("mt-auto relative profile-dropdown-container transition-colors duration-500", isSidebarOpen && "border-t", isSidebarOpen && (theme === 'dark' ? "border-[#3d3d3a]" : "border-[#e5e5e5]"))}>
              <Tooltip content={user?.username} side="right" hidden={isSidebarOpen} className="w-full">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={cn(
                    "w-full flex items-center transition-all duration-300 relative z-[200] opacity-100 outline-none group/profile h-16 px-0",
                    theme === 'dark' ? "bg-transparent text-white" : "bg-transparent text-[#1a1a18]"
                  )}
                >
                  <div className={cn("absolute inset-y-2 inset-x-2 rounded-xl transition-colors", theme === 'dark' ? "group-hover/profile:bg-[#3d3d3a]" : "group-hover/profile:bg-black/5")} />
                  <div className="relative z-10 flex items-center w-full">
                    <div className="w-12 h-16 flex items-center justify-start pl-4 shrink-0">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300 group-hover/profile:scale-110",
                        isProfileOpen && !isSidebarOpen ? "ring-2 ring-[#d4a574]/50 scale-110" : "scale-100",
                        theme === 'dark' ? "bg-[#d4a574] text-[#1a1a18]" : "bg-[#d4a574] text-white"
                      )}>
                        {user?.username?.[0]?.toUpperCase()}
                      </div>
                    </div>
                    <div className={cn("flex-1 text-left min-w-0 flex items-center gap-2 overflow-hidden transition-all duration-500", isSidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0")}>
                      <div className="flex-1 min-w-0 ml-3">
                        <p className={cn("text-[14px] font-medium leading-tight truncate", theme === 'dark' ? "text-white" : "text-[#1a1a18]")}>{user?.username}</p>
                        <p className="text-[12px] text-[#8e8e8e] mt-1 leading-tight">Free plan</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 mr-4">
                        <div className={cn("p-1.5 rounded-lg transition-colors border", theme === 'dark' ? "border-[#4a4a47] text-[#8e8e8e] hover:bg-white/5" : "border-black/5 text-[#666666] hover:bg-black/5")}>
                          <Dhara size={14}
 />
                        </div>
                        <ChevronsUpDown size={14} className="text-[#8e8e8e]" />
                      </div>
                    </div>
                  </div>
                </button>
              </Tooltip>
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-row relative overflow-hidden h-full">
        {/* Messages Scrollable Area */}
        <div className="flex-1 relative flex flex-col overflow-y-auto scrollbar-hide">
          {/* Top header strip */}
          <div className={cn("sticky top-0 z-30 shrink-0 backdrop-blur-md border-b", theme === 'dark' ? "bg-[#2b2b2a] border-[#3d3d3a]" : "bg-[#ffffff] border-black/5")}>
            <div className="h-[64px] flex items-center justify-between px-6 transition-colors duration-500">
              <div className="flex items-center gap-4">
                {sharedSession && (
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-colors duration-500", theme === 'dark' ? "bg-[#3d3d3a] text-white" : "bg-black/5 text-[#1a1a18]")}>
                      <MessageSquare size={20} className="opacity-70" />
                    </div>
                    <div className="flex flex-col">
                      <h1 className={cn("text-[15px] font-bold tracking-tight truncate max-w-[200px] sm:max-w-[400px]", theme === 'dark' ? "text-[#e8e6e1]" : "text-[#1a1a18]")}>
                        {sharedSession.title || 'Shared Chat'}
                      </h1>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className={cn("text-[11px] font-medium opacity-50 uppercase tracking-widest")}>Shared conversation</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className={cn("p-2 rounded-xl transition-all hover:scale-105 active:scale-95", theme === 'dark' ? "bg-white/5 text-gray-400 hover:text-white" : "bg-black/5 text-[#666666] hover:text-[#1a1a18]")}
                >
                  <Settings size={20} />
                </button>
                <button
                  className={cn("flex items-center gap-2 px-4 py-2 rounded-[14px] text-[13.5px] font-bold transition-all shadow-lg hover:shadow-xl active:scale-95", theme === 'dark' ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/30" : "bg-[#1a1a18] text-white hover:opacity-90")}
                >
                  <Copy size={16} /> Share
                </button>
              </div>
            </div>
          </div>

            <div className="flex-1 mt-8">
              {messages.length === 0 && !isLoadingHistory && (
                <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
                  <div className="mb-8">
                    <Dhara size={44}
 className={theme === 'dark' ? "text-[#da765e]" : "text-[#d16a50]"} />
                  </div>
                  <h2 className={cn("text-[32px] font-bold mb-8 tracking-tight", theme === 'dark' ? "text-white" : "text-[#1a1a18]")}>Shared Conversation</h2>
                  <button onClick={() => router.push('/chat')} className={cn("px-6 py-3 rounded-xl text-[15px] font-semibold transition-all shadow-xl", theme === 'dark' ? "bg-[#e8e6e1] text-[#1a1a18] hover:bg-white" : "bg-[#1a1a18] text-white hover:opacity-90")}>
                    Start your own conversation
                  </button>
                </div>
              )}

              {isLoadingHistory && (
                <div className="flex flex-col items-center justify-center py-20 animate-fade-in"><Loader2 size={32} className="animate-spin text-blue-500 mb-4 opacity-50" /><p className="text-sm text-[#8e8e8e]">Loading conversation...</p></div>
              )}

              {messages.length > 0 && (
                <div className={cn("mb-12 p-5 rounded-[16px] border flex items-start justify-between gap-4 text-[13px] leading-[1.6] shadow-sm", theme === 'dark' ? "bg-[#2b2b2a] border-[#3d3d3a] text-[#8e8e8e]" : "bg-[#f4f4f1] border-black/5 text-[#666666]")}>
                  <div className="flex items-start gap-3">
                    <Info size={16} className="shrink-0 mt-0.5 opacity-50" />
                    <p>This is a copy of a shared chat. Content may include unverified or unsafe content that do not represent the views of Dhara. Shared snapshot may contain attachments and data not displayed here.</p>
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "w-full mb-8 group flex flex-col",
                  m.role === 'user' ? "items-end" : "items-start",
                  i === messages.length - 1 && m.role === 'user' ? "animate-slide-up" : "animate-fade-in"
                )}>
                  {m.role === 'user' ? (
                    <div className="max-w-[85%] flex flex-col items-end group relative transition-all duration-300">
                      <div className={cn("rounded-[16px] px-6 py-3 shadow-sm", theme === 'dark' ? "bg-[#1a1a18] text-white" : "bg-[#f4f4f1] text-[#1a1a18]")}>
                        <p className="text-[16px] leading-[1.6] whitespace-pre-wrap font-normal">{m.content}</p>
                      </div>
                      <div className={cn("flex items-center gap-4 mt-2.5 px-3 transition-opacity duration-200 shrink-0", i === messages.length - 1 ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                        <Tooltip content={m.timestamp ? formatHoverTimestamp(m.timestamp) : ''} side="bottom">
                          <span className={cn("text-[13.5px] font-medium cursor-default flex items-center h-6 leading-none", "text-[#6b6b67]")}>
                            {m.timestamp ? formatDisplayTimestamp(m.timestamp) : ''}
                          </span>
                        </Tooltip>
                        <button onClick={() => { navigator.clipboard.writeText(m.content); setCopiedId(i); setTimeout(() => setCopiedId(null), 2000); }} className={cn("p-1 rounded-lg transition-colors h-6 flex items-center", theme === 'dark' ? "text-[#8e8e8e] hover:bg-white/5" : "text-[#666666] hover:bg-black/5")}>
                          {copiedId === i ? <Check size={16} strokeWidth={1.2} /> : <Clipboard size={16} strokeWidth={1.2} />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col group relative">
                      <>
                        {(thinkingStatus || getThoughtFromMsg(m.content)) && (
                          <div className="mb-4">
                            <button
                              onClick={() => toggleThought(i)}
                              className={cn(
                                "flex items-center gap-2 text-[13px] font-medium transition-all group/thought px-3 py-1.5 rounded-full border",
                                theme === 'dark'
                                  ? "bg-[#2b2b2a] border-[#4a4a47] text-[#9a9994] hover:text-[#d7d5d0] hover:border-[#5a5a55]"
                                  : "bg-[#f4f4f1] border-black/5 text-[#888888] hover:text-[#1a1a18] hover:border-black/10"
                                )}
                              >
                              <div className="flex items-center gap-2">
                                {(thinkingStatus && !getThoughtFromMsg(m.content)) ? (
                                  <Dhara size={14}
 className="animate-pulse-subtle text-orange-500/70" />
                                ) : (
                                  <Dhara size={14}
 className={cn("opacity-40", theme === 'dark' ? "text-orange-500" : "text-orange-400")} />
                                )}
                                <span className={cn("text-[13px] tracking-tight", theme === 'dark' ? "text-[#a2a19d]" : "text-[#6b6b6b]")}>
                                  {thinkingStatus || (collapsedThoughts.has(i) ? 'Show Thought' : 'Thought')}
                                </span>
                              </div>
                              <ChevronRight size={12} className={cn("transition-transform duration-300 opacity-60", !collapsedThoughts.has(i) && "rotate-90")} />
                            </button>
                            {!collapsedThoughts.has(i) && getThoughtFromMsg(m.content) && (
                              <div className={cn(
                                "mt-3 pl-4 border-l-2 leading-relaxed text-[14px] py-1 transition-all animate-in fade-in slide-in-from-left-2",
                                theme === 'dark' ? "border-[#4a4a47] text-[#9a9994]" : "border-black/10 text-[#6b6b6b]"
                              )}>
                                {getThoughtFromMsg(m.content)}
                              </div>
                            )}
                          </div>
                        )}
                        <div className={cn("text-[16px] leading-[1.6] assistant-msg w-full [&>p:first-child]:mt-0 font-normal", theme === 'dark' ? "text-[#e8e6e1]" : "text-[#1a1a18]")}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents as any}>
                            {renderCleanContent(m.content)}
                          </ReactMarkdown>
                        </div>
                        <div className="mt-2.5 flex flex-col items-start w-full gap-4">
                          <div className={cn("flex items-center gap-4 transition-opacity duration-200 h-6", i === messages.length - 1 ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                            <Tooltip content={copiedId === i ? 'Copied!' : 'Copy'} side="bottom">
                              <button onClick={() => { navigator.clipboard.writeText(renderCleanContent(m.content)); setCopiedId(i); setTimeout(() => setCopiedId(null), 2000); }} className={cn("p-1 rounded-lg transition-colors flex items-center h-6", theme === 'dark' ? "text-[#8e8e8e] hover:bg-white/5" : "text-[#666666] hover:bg-black/5")}>
                                {copiedId === i ? <Check size={16} strokeWidth={1.2} /> : <Clipboard size={16} strokeWidth={1.2} />}
                               </button>
                            </Tooltip>
                          </div>
                          {m.role === 'assistant' && i === messages.length - 1 && (
                            <div className="mt-4 flex items-center gap-2 group/logo cursor-default relative">
                              <Dhara size={24} className={cn("transition-all duration-300", theme === 'dark' ? "text-[#da765e]" : "text-[#d16a50]")} />
                              <div className={cn("px-4 py-1.5 rounded-full transition-all duration-300 opacity-0 scale-[0.98] origin-left group-hover/logo:opacity-100 group-hover/logo:scale-100 shadow-2xl z-50 bg-[#0a0a0a]")}>
                                <span className="text-[12px] text-white font-normal whitespace-nowrap italic leading-tight tracking-tight">Hi, I&apos;m Dhara. How can I help you today?</span>                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    </div>
                  )}
                </div>
              ))}
              <div ref={scrollRef} className="h-32 shrink-0" />
            </div>
        </div>
        <div className="flex items-center justify-center pb-8 shrink-0">
          <p className="text-[12px] text-[#8e8e8e]">Dhara is AI and can make mistakes. Please double-check responses.</p>
        </div>
      </main>

      {/* Reply Area - CTA for share page */}
      {messages.length > 0 && (
        <div className={cn("fixed bottom-0 left-0 right-0 p-6 z-20 flex items-center justify-center transition-all duration-500 pointer-events-none", isSidebarOpen && "md:left-[260px]")}>
          <div className="max-w-[800px] w-full flex items-center justify-center pointer-events-auto">
            <div className={cn("flex items-center gap-3 p-1.5 px-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-4 duration-500", theme === 'dark' ? "bg-[#2b2b2a] border-[#3d3d3a]" : "bg-white border-[#e5e5e5]")}>
              <span className={cn("text-[14px] font-medium mr-2", theme === 'dark' ? "text-[#8e8e8e]" : "text-[#666666]")}>Want to continue this chat?</span>
              <button onClick={() => router.push('/chat')} className={cn("px-5 py-2.5 rounded-xl text-[14px] font-semibold transition-all", theme === 'dark' ? "bg-[#e8e6e1] text-[#1a1a18] hover:bg-white" : "bg-[#1a1a18] text-white hover:opacity-90")}>
                Start your own conversation
              </button>
            </div>
          </div>
        </div>
      )}

      
      {user && isSettingsOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-black/40 animate-fade-in backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}>
          <div className={cn("w-full max-w-[900px] h-[580px] rounded-3xl shadow-2xl overflow-hidden flex", theme === 'dark' ? "bg-[#2b2b2a] border border-[#3d3d3a]" : "bg-white border border-[#e5e5e5]")} onClick={e => e.stopPropagation()}>

            {/* Left Sidebar */}
            <div className={cn("w-[240px] shrink-0 border-r flex flex-col hidden sm:flex", theme === 'dark' ? "bg-[#2b2b2a] border-[#3d3d3a]" : "bg-[#f9f9f8] border-[#e5e5e5]")}>
              <div className="p-6 pb-2">
                <h2 className={cn("text-[16px] font-semibold tracking-tight", theme === 'dark' ? "text-[#e8e6e1]" : "text-[#1a1a18]")}>Settings</h2>
              </div>
              <div className="flex-1 p-3 space-y-1">
                {[
                  { id: 'profile', label: 'Profile', icon: <UserCircle size={16} /> },
                  { id: 'appearance', label: 'Appearance', icon: <Monitor size={16} /> },
                  { id: 'account', label: 'Account', icon: <User size={16} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSettingsTab(tab.id)}
                    className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-colors",
                      activeSettingsTab === tab.id
                        ? (theme === 'dark' ? "bg-[#3d3d3a] text-[#e8e6e1]" : "bg-white shadow-sm border border-[#e5e5e5] text-[#1a1a18]")
                        : (theme === 'dark' ? "text-[#8e8e8e] hover:bg-white/5 hover:text-[#d7d5d0]" : "text-[#666666] hover:bg-black/5 hover:text-[#1a1a18]")
                    )}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content Area */}
            <div className={cn("flex-1 overflow-y-auto", theme === 'dark' ? "bg-[#2f2f2e]" : "bg-white")}>
              <div className="max-w-[480px] relative px-10 py-8">
                {activeSettingsTab === 'profile' && (
                  <div className="animate-fade-in">
                    <h3 className={cn("text-[18px] font-semibold mb-6 flex justify-between items-center", theme === 'dark' ? "text-[#e8e6e1]" : "text-[#1a1a18]")}>
                      Profile
                      <button onClick={() => setIsSettingsOpen(false)} className={cn("p-1.5 rounded-lg transition-colors md:hidden", theme === 'dark' ? "text-[#8e8e8e] hover:bg-white/5" : "text-[#666666] hover:bg-black/5")}><X size={18} /></button>
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className={cn("block text-[13px] font-medium mb-3", theme === 'dark' ? "text-[#b4b3af]" : "text-[#666666]")}>Avatar</label>
                        <div className="flex items-center gap-5">
                          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium", theme === 'dark' ? "bg-[#c4a882] text-[#2f2f2e]" : "bg-[#d4a574] text-white")}>
                            {user?.username?.[0]?.toUpperCase()}
                          </div>
                          <button className={cn("px-4 py-2 rounded-lg text-[13px] font-medium transition-colors border", theme === 'dark' ? "border-[#4a4a47] text-[#d7d5d0] hover:bg-white/5" : "border-[#e5e5e5] text-[#1a1a18] hover:bg-black/5")}>Upload image</button>
                        </div>
                      </div>
                      <div className={cn("w-full h-px", theme === 'dark' ? "bg-[#3d3d3a]" : "bg-[#e5e5e5]")} />
                      <div>
                        <label className={cn("block text-[13px] font-medium mb-2", theme === 'dark' ? "text-[#b4b3af]" : "text-[#666666]")}>Display name</label>
                        <input type="text" defaultValue={user?.username} className={cn("w-full px-3 py-2 text-[14px] rounded-lg border focus:outline-none focus:ring-1 transition-all", theme === 'dark' ? "bg-transparent border-[#4a4a47] text-[#e8e6e1] focus:border-[#c4a882] focus:ring-[#c4a882]/20" : "bg-transparent border-[#d5d5d5] text-[#1a1a18] focus:border-[#d4a574] focus:ring-[#d4a574]/20")} />
                        <p className={cn("text-[12px] mt-2", theme === 'dark' ? "text-[#8e8e8e]" : "text-[#888888]")}>This is the name that will be displayed in your profile.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'appearance' && (
                  <div className="animate-fade-in">
                    <h3 className={cn("text-[18px] font-semibold mb-6 flex justify-between items-center", theme === 'dark' ? "text-[#e8e6e1]" : "text-[#1a1a18]")}>
                      Appearance
                      <button onClick={() => setIsSettingsOpen(false)} className={cn("p-1.5 rounded-lg transition-colors md:hidden", theme === 'dark' ? "text-[#8e8e8e] hover:bg-white/5" : "text-[#666666] hover:bg-black/5")}><X size={18} /></button>
                    </h3>
                    <div>
                      <label className={cn("block text-[13px] font-medium mb-3", theme === 'dark' ? "text-[#b4b3af]" : "text-[#666666]")}>Theme</label>
                      <div className="flex flex-col gap-3">
                        {['light', 'dark', 'system'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setTheme(t)}
                            className={cn("flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all text-left",
                              theme === t
                                ? (theme === 'dark' ? "bg-[#3d3d3a] border-[#5a5a55]" : "bg-[#f4f4f1] border-[#d5d5d5]")
                                : (theme === 'dark' ? "border-[#3d3d3a] bg-transparent hover:bg-white/5" : "border-[#e5e5e5] bg-transparent hover:bg-black/5")
                            )}
                          >
                            <span className={cn("text-[14px] font-medium capitalize", theme === 'dark' ? "text-[#e8e6e1]" : "text-[#1a1a18]")}>{t}</span>
                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", theme === t ? (theme === 'dark' ? "border-[#c4a882]" : "border-[#d4a574]") : (theme === 'dark' ? "border-[#5a5a55]" : "border-[#d5d5d5]"))}>
                              {theme === t && <div className={cn("w-2 h-2 rounded-full", theme === 'dark' ? "bg-[#c4a882]" : "bg-[#d4a574]")} />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'account' && (
                  <div className="animate-fade-in">
                    <h3 className={cn("text-[18px] font-semibold mb-6 flex justify-between items-center", theme === 'dark' ? "text-[#e8e6e1]" : "text-[#1a1a18]")}>
                      Account
                      <button onClick={() => setIsSettingsOpen(false)} className={cn("p-1.5 rounded-lg transition-colors md:hidden", theme === 'dark' ? "text-[#8e8e8e] hover:bg-white/5" : "text-[#666666] hover:bg-black/5")}><X size={18} /></button>
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className={cn("block text-[13px] font-medium mb-2", theme === 'dark' ? "text-[#b4b3af]" : "text-[#666666]")}>Email address</label>
                        <input type="email" value={user?.email || "user@example.com"} disabled className={cn("w-full px-3 py-2 text-[14px] rounded-lg border opacity-70 cursor-not-allowed", theme === 'dark' ? "bg-[#1e1e1c] border-[#3d3d3a] text-[#8e8e8e]" : "bg-black/5 border-[#e5e5e5] text-[#666666]")} />
                      </div>
                      <div className={cn("w-full h-px", theme === 'dark' ? "bg-[#3d3d3a]" : "bg-[#e5e5e5]")} />
                      <div>
                        <h4 className="text-[14px] font-medium text-red-500 mb-2">Delete Account</h4>
                        <p className={cn("text-[13px] mb-4", theme === 'dark' ? "text-[#8e8e8e]" : "text-[#888888]")}>Permanently delete your account and all of your content.</p>
                        <button className={cn("px-4 py-2 rounded-lg text-[13px] font-medium transition-colors border border-red-500/30 text-red-500 hover:bg-red-500/10")}>Delete Account</button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
            {/* Absolute close button for desktop */}
            <button onClick={() => setIsSettingsOpen(false)} className={cn("absolute top-6 right-6 p-2 rounded-lg transition-colors hidden sm:block z-50", theme === 'dark' ? "text-[#8e8e8e] hover:text-white hover:bg-white/10" : "text-[#666666] hover:text-black hover:bg-black/10")}><X size={20} /></button>
          </div>
        </div>
      )}



      
      {user && isSearchOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/40 animate-fade-in transition-all duration-500" onClick={() => setIsSearchOpen(false)}>
          <div className={cn("w-full max-w-xl rounded-[24px] shadow-3xl border overflow-hidden animate-slide-up", theme === 'dark' ? "bg-[#1e1e1e] border-white/10 text-white" : "bg-white border-black/10 text-[#1a1a18]")} onClick={e => e.stopPropagation()}>
            <div className={cn("p-5 flex items-center gap-4 border-b", theme === 'dark' ? "border-white/5" : "border-black/5")}><Search size={22} className="text-[#8e8e8e]" /><input autoFocus type="text" placeholder="Search your history..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={cn("w-full bg-transparent focus:outline-none text-[16px] font-medium", theme === 'dark' ? "text-white" : "text-[#1a1a18]")} /></div>
            <div className="max-h-[450px] overflow-y-auto p-2 scrollbar-hide">
              {filteredSearchSessions.map((s, idx) => (
                <button key={s.id} onClick={() => { loadSession(s.id); setIsSearchOpen(false); }} className={cn("w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center gap-4 group", idx === selectedSearchIndex ? (theme === 'dark' ? "bg-white/5 text-white shadow-inner" : "bg-black/5 text-[#1a1a18] shadow-sm") : (theme === 'dark' ? "text-[#8e8e8e] hover:bg-white/5 hover:text-white" : "text-[#666666] hover:bg-black/5 hover:text-[#1a1a18]"))}><MessageSquare size={20} className="opacity-40 group-hover:opacity-100 transition-opacity" /><span className="font-bold text-[15px] truncate">{s.title}</span></button>
              ))}
              {filteredSearchSessions.length === 0 && <div className="py-16 text-center text-[14px] text-[#8e8e8e] font-medium">No conversations found matching your search</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
