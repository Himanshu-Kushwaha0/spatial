import {
  LucideMessageSquare,
  LucideSend,
  LucideUsers,
  LucideX,
  LucideGripVertical,
  LucideMaximize2,
  LucideCopy,
  LucideCheck
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { OnlineUser } from '../types';

interface ChatOverlayProps {
  chatHistory: any[];
  onSendChatMessage: (text: string, whisperTargetId?: string) => void;
  onlineUsers: OnlineUser[];
  myId: string;
  isDarkMode: boolean;
  isFloating?: boolean;
  isMiniMode?: boolean;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ chatHistory, onSendChatMessage, onlineUsers, myId, isDarkMode, isFloating, isMiniMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
  const [message, setMessage] = useState('');
  const [whisperTarget, setWhisperTarget] = useState<OnlineUser | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth < 768 ? 320 : 380, 
    height: window.innerWidth < 768 ? 400 : 480 
  });
  const [isResizing, setIsResizing] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setDimensions({ width: 320, height: 400 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatHistory.length, isOpen, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSendChatMessage(message, whisperTarget?.clientId);
    setMessage('');
    setWhisperTarget(null);
  };

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyingId(id);
      setTimeout(() => setCopyingId(null), 2000);
    } catch (err) { console.error('Copy failed:', err); }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX, startY = e.clientY;
    const startW = dimensions.width, startH = dimensions.height;
    const move = (ev: MouseEvent) => setDimensions({
      width: Math.max(280, startW + (startX - ev.clientX)),
      height: Math.max(200, startH + (startY - ev.clientY))
    });
    const up = () => { setIsResizing(false); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  // Filter messages based on private/public status
  const visibleMessages = chatHistory.filter(msg => 
    !msg.recipientId || msg.recipientId === myId || msg.authorId === myId
  );

  const content = (
    <div 
      style={isFloating ? { width: '100%', height: '100%' } : { width: dimensions.width, height: isOpen ? dimensions.height : (isMobile ? 64 : 90) }}
      className={`bg-black rounded-[24px] md:rounded-[40px] shadow-[0_0_120px_rgba(0,0,0,1)] flex flex-col overflow-hidden border-2 border-indigo-500/10 transition-all duration-300 relative max-w-[90vw]`}
    >
      {!isFloating && isOpen && !isMobile && (
        <div onMouseDown={handleResizeStart} className="absolute top-0 left-0 w-12 h-12 cursor-nw-resize flex items-center justify-center z-[50] hover:bg-white/5 rounded-br-3xl transition-colors group">
          <LucideMaximize2 className="w-5 h-5 text-zinc-800 group-hover:text-indigo-500 -rotate-90" />
        </div>
      )}

      <div className={`flex items-center ${isMobile ? 'p-3' : 'p-5'} bg-zinc-950/80 border-b border-white/5 ${isOpen || isFloating ? 'justify-between' : 'justify-center h-full'}`}>
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          {!isFloating && !isMobile && <div className={`chat-handle p-2 text-zinc-700 cursor-grab active:cursor-grabbing hover:text-indigo-400 transition-colors ${isOpen ? '' : 'hidden'}`}><LucideGripVertical className="w-4 h-4" /></div>}
          <button onClick={() => !isFloating && setIsOpen(!isOpen)} className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl md:rounded-[20px] shrink-0 flex items-center justify-center bg-indigo-600 shadow-2xl active:scale-90 transition-transform`}><LucideMessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white" /></button>
          {(isOpen || isFloating) && <div className="flex flex-col min-w-0"><span className="font-black text-white text-xs md:text-sm tracking-tight truncate">Signal Hub</span><span className="text-[7px] md:text-[8px] text-indigo-500/60 font-black uppercase tracking-[0.2em]">{onlineUsers.length} Nodes Tuned</span></div>}
        </div>
        {(isOpen || isFloating) && <div className="flex gap-1">
          <button onClick={() => setActiveTab('chat')} className={`p-2 md:p-3 rounded-lg transition-all ${activeTab === 'chat' ? 'bg-indigo-600/20 text-indigo-400' : 'text-zinc-600 hover:text-white'}`}><LucideMessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
          <button onClick={() => setActiveTab('users')} className={`p-2 md:p-3 rounded-lg transition-all ${activeTab === 'users' ? 'bg-indigo-600/20 text-indigo-400' : 'text-zinc-600 hover:text-white'}`}><LucideUsers className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
        </div>}
      </div>

      {(isOpen || isFloating) && (
        <>
          <div ref={scrollRef} className={`flex-1 overflow-y-auto ${isMobile ? 'px-4 py-4' : 'px-6 py-8'} space-y-4 md:space-y-6 scrollbar-none bg-black/60`}>
            {activeTab === 'chat' ? (
              visibleMessages.length > 0 ? visibleMessages.map((item) => {
                const isMe = item.authorId === myId;
                return (
                  <div key={item.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-pop w-full group`}>
                    <div className="flex items-center gap-2 max-w-[95%]">
                      {isMe && !isMobile && (
                        <button onClick={() => copyText(item.text, item.id)} className={`p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${copyingId === item.id ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-600 hover:bg-white/5 hover:text-indigo-400'}`}>
                          {copyingId === item.id ? <LucideCheck className="w-4 h-4" /> : <LucideCopy className="w-4 h-4" />}
                        </button>
                      )}
                      <div className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'} rounded-2xl md:rounded-[28px] text-xs md:text-sm break-words shadow-2xl leading-relaxed ${item.recipientId ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200' : isMe ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-300'}`}>{item.text}</div>
                    </div>
                    <span className="text-[7px] md:text-[8px] mt-1 md:mt-2 font-black text-zinc-800 uppercase tracking-widest px-2 group-hover:text-zinc-600 transition-colors">
                      {isMe ? 'Me' : item.author} {item.recipientId && '• TUNNEL'}
                    </span>
                  </div>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-900 space-y-4 opacity-40">
                  <LucideMessageSquare className="w-12 h-12 md:w-16 md:h-16" />
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Mesh Silenced...</p>
                </div>
              )
            ) : onlineUsers.map((u) => (
              <button key={u.clientId} onClick={() => { setWhisperTarget(u); setActiveTab('chat'); }} className={`w-full flex items-center justify-between p-3 md:p-5 rounded-2xl md:rounded-[28px] border transition-all ${u.clientId === myId ? 'bg-white/5 border-transparent opacity-40 grayscale cursor-default' : 'bg-white/2 border-white/5 hover:border-indigo-500/40 hover:bg-white/5 hover:scale-[1.02]'}`}>
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden"><div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full border-2 border-black shadow-lg" style={{ background: u.color }} /><span className="text-xs md:text-sm font-black text-zinc-300 truncate">{u.name} {u.clientId === myId && '(You)'}</span></div>
                {u.clientId !== myId && <span className="text-[7px] md:text-[8px] font-black text-indigo-400 tracking-widest uppercase shrink-0">Tunnel Point</span>}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className={`${isMobile ? 'p-4' : 'p-6'} bg-zinc-950/90 border-t border-white/5 backdrop-blur-md`}>
            {whisperTarget && <div className="flex items-center justify-between px-4 py-2 mb-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[8px] font-black text-amber-500 uppercase tracking-widest animate-pop"><span>Tunnel Target: {whisperTarget.name}</span><LucideX onClick={() => setWhisperTarget(null)} className="w-3 h-3 cursor-pointer hover:text-white" /></div>}
            <div className="relative">
              <textarea rows={1} value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }} placeholder="Signal to mesh..." className={`w-full bg-black border border-white/10 rounded-2xl md:rounded-[28px] ${isMobile ? 'px-4 py-3 pr-12' : 'px-6 py-5 pr-16'} text-xs md:text-sm focus:outline-none focus:border-indigo-500/40 text-white placeholder:text-zinc-800 resize-none min-h-[48px] md:min-h-[64px] max-h-[120px] leading-relaxed transition-all`} />
              <button type="submit" className={`absolute ${isMobile ? 'right-1.5 bottom-1.5 p-2.5' : 'right-2 bottom-2 p-4'} bg-indigo-600 rounded-xl md:rounded-[22px] text-white shadow-3xl active:scale-90 hover:bg-indigo-500 transition-all`}><LucideSend className="w-4 h-4 md:w-5 md:h-5" /></button>
            </div>
          </form>
        </>
      )}
    </div>
  );

  if (isFloating) return <div className="h-full w-full">{content}</div>;

  return (
    <Draggable nodeRef={draggableRef} handle=".chat-handle" disabled={isResizing || isMobile}>
      <div ref={draggableRef} className={`fixed ${isMobile ? 'bottom-6 right-6' : 'bottom-8 right-8'} z-[2000] transition-opacity duration-500 ${isMiniMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>{content}</div>
    </Draggable>
  );
};

export default ChatOverlay;