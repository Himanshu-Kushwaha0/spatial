import {
  LucideMessageSquare,
  LucideSend,
  LucideUsers,
  LucideX,
  LucideGripVertical,
  LucideTerminal,
  LucideLock,
  LucideChevronDown,
  LucideInfo,
  LucideActivity
} from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Draggable from 'react-draggable';
import { OnlineUser } from '../types';

interface ChatOverlayProps {
  chatHistory: any[];
  onSendChatMessage: (text: string, whisperTargetId?: string) => void;
  onTyping: (isTyping: boolean) => void;
  typingUsers: string[];
  onlineUsers: OnlineUser[];
  myId: string;
  isDarkMode: boolean;
  isFloating?: boolean;
  isMiniMode?: boolean;
  signalConnected?: boolean;
  peerCount?: number;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ 
  chatHistory, 
  onSendChatMessage, 
  onTyping,
  typingUsers,
  onlineUsers, 
  myId, 
  isFloating, 
  isMiniMode,
  signalConnected,
  peerCount
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
  const [message, setMessage] = useState('');
  const [whisperTarget, setWhisperTarget] = useState<OnlineUser | null>(null);
  const [isMobile] = useState(window.innerWidth < 768);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ 
        top: scrollRef.current.scrollHeight, 
        behavior 
      });
      setShowScrollDown(false);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 100;
    if (isAtBottom) {
      scrollToBottom('smooth');
    } else if (chatHistory.length > 0) {
      setShowScrollDown(true);
    }
  }, [chatHistory.length, isOpen, activeTab, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    if (isAtBottom && showScrollDown) setShowScrollDown(false);
  };

  const handleTyping = (val: string) => {
    setMessage(val);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;
    onSendChatMessage(message, whisperTarget?.clientId);
    setMessage('');
    setWhisperTarget(null);
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTimeout(() => scrollToBottom('smooth'), 50);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const visibleMessages = chatHistory.filter(msg => 
    !msg.recipientId || msg.recipientId === myId || msg.authorId === myId
  );

  const content = (
    <div 
      style={isFloating ? { width: '100%', height: '100%' } : { width: isMobile ? 'calc(100vw - 32px)' : 420, height: isOpen ? 560 : (isMobile ? 70 : 86) }}
      className="bg-[var(--surface-color)] rounded-xl shadow-[0_50px_120px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-[var(--border-color)] transition-all duration-400 relative secure-border font-mono"
    >
      <div className="flex items-center p-5 bg-[var(--surface-color)] border-b border-[var(--border-color)] justify-between z-50">
        <div className="flex items-center gap-4 overflow-hidden">
          {!isFloating && !isMobile && <div className="chat-handle p-2 text-zinc-500 cursor-grab active:cursor-grabbing hover:text-indigo-600 transition-colors"><LucideGripVertical className="w-4 h-4" /></div>}
          <button onClick={() => !isFloating && setIsOpen(!isOpen)} className="w-11 h-11 rounded-lg shrink-0 flex items-center justify-center bg-indigo-700 shadow-2xl active:scale-90 transition-all"><LucideMessageSquare className="w-5 h-5 text-white" /></button>
          {(isOpen || isFloating) && (
            <div className="flex flex-col min-w-0">
              <span className="font-black text-[var(--text-color)] text-xs tracking-tighter uppercase">MESH_RELAY</span>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${signalConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className={`text-[8px] font-bold uppercase tracking-widest ${signalConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {signalConnected ? `${(peerCount || 0)} PEERS_FOUND` : 'SIGNAL_LOST'}
                </span>
              </div>
            </div>
          )}
        </div>
        {(isOpen || isFloating) && <div className="flex gap-2">
          <button onClick={() => setActiveTab('chat')} className={`p-2.5 rounded-md transition-colors ${activeTab === 'chat' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-indigo-400'}`}><LucideTerminal className="w-4 h-4" /></button>
          <button onClick={() => setActiveTab('users')} className={`p-2.5 rounded-md transition-colors ${activeTab === 'users' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-indigo-400'}`}><LucideUsers className="w-4 h-4" /></button>
        </div>}
      </div>

      {(isOpen || isFloating) && (
        <>
          <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-none bg-[var(--bg-color)]/20 relative">
            {activeTab === 'chat' ? (
              visibleMessages.map((item) => {
                if (item.isSystem) {
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2 border border-[var(--border-color)] bg-[var(--surface-color)]/40 rounded-md animate-pop">
                      <LucideInfo className="w-3 h-3 text-indigo-500/50" />
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{item.text}</span>
                    </div>
                  );
                }
                const isMe = item.authorId === myId;
                return (
                  <div key={item.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-pop w-full group`}>
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      {!isMe && <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.authorColor || '#6366f1' }} />}
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isMe ? 'text-indigo-400' : 'text-zinc-500'}`}>
                        {isMe ? 'LOCAL_NODE' : item.author.toUpperCase()}
                      </span>
                      {item.recipientId && <span className="text-[8px] font-black text-amber-600 uppercase tracking-[0.2em]">» WHISPER_TUNNEL</span>}
                      <span className="text-[7px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1">{formatTime(item.timestamp)}</span>
                    </div>
                    <div className={`px-5 py-4 rounded-xl text-[11px] leading-relaxed break-words shadow-2xl max-w-[85%] border transition-all ${
                      item.recipientId 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                        : isMe 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_10px_30px_rgba(99,102,241,0.2)]' 
                        : 'bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-color)]'
                    }`}>
                      {item.text}
                    </div>
                  </div>
                );
              })
            ) : onlineUsers.map((u) => (
              <button key={u.clientId} onClick={() => { setWhisperTarget(u); setActiveTab('chat'); }} className={`w-full flex items-center justify-between p-5 rounded-md border transition-all ${u.clientId === myId ? 'opacity-10 grayscale cursor-default' : 'bg-[var(--bg-color)] border-[var(--border-color)] hover:border-indigo-500/20 hover:bg-[var(--surface-color)]/50'}`}>
                <div className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full border border-black shadow-inner" style={{ background: u.color }} /><span className="text-[11px] font-bold text-[var(--text-color)]/70 truncate uppercase tracking-widest">{u.name}</span></div>
                {u.clientId !== myId && <span className="text-[7px] font-black text-indigo-500 tracking-[0.2em] uppercase border border-indigo-500/30 px-2 py-1 rounded-sm">OPEN_X_LINK</span>}
              </button>
            ))}
            
            {showScrollDown && (
              <button onClick={() => scrollToBottom('smooth')} className="sticky bottom-2 left-1/2 -translate-x-1/2 p-2 bg-indigo-600 rounded-full shadow-2xl animate-bounce text-white border border-indigo-400/50">
                <LucideChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-6 bg-[var(--surface-color)] border-t border-[var(--border-color)] backdrop-blur-3xl relative">
            {typingUsers.length > 0 && (
              <div className="absolute -top-6 left-6 flex items-center gap-2 animate-pop">
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                  {typingUsers[0].toUpperCase()} {typingUsers.length > 1 ? `& ${typingUsers.length - 1} OTHERS` : ''} RELAYING...
                </span>
              </div>
            )}
            
            {whisperTarget && (
              <div className="flex items-center justify-between px-4 py-2 mb-3 bg-amber-500/5 border border-amber-500/20 rounded-md text-[9px] font-bold text-amber-600 uppercase tracking-[0.3em] animate-pop">
                SECURE_TUNNEL::{whisperTarget.name.toUpperCase()}
                <LucideX onClick={() => setWhisperTarget(null)} className="w-3.5 h-3.5 cursor-pointer hover:text-rose-500 transition-colors" />
              </div>
            )}
            
            <div className="relative flex items-center group">
              <textarea 
                rows={1} 
                value={message} 
                onChange={e => handleTyping(e.target.value)} 
                onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} 
                placeholder="ENCRYPT_PAYLOAD_DATA..." 
                className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-6 py-5 pr-14 text-[11px] focus:outline-none focus:border-indigo-500/40 text-[var(--text-color)] placeholder:text-zinc-500 resize-none min-h-[64px] transition-all shadow-inner font-mono" 
              />
              <button onClick={() => handleSubmit()} className="absolute right-3 bottom-3 p-3.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-white active:scale-95 transition-all shadow-xl group-hover:shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                <LucideSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (isFloating) return content;
  return (
    <Draggable nodeRef={draggableRef} handle=".chat-handle" disabled={isMobile}>
      <div ref={draggableRef} className={`fixed bottom-10 right-10 z-[2000] transition-opacity duration-600 ${isMiniMode ? 'opacity-5 pointer-events-none' : 'opacity-100'}`}>
        {content}
      </div>
    </Draggable>
  );
};

export default ChatOverlay;