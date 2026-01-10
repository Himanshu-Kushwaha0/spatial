import {
  LucideMessageSquare,
  LucideSend,
  LucideUsers,
  LucideShieldAlert,
  LucideX,
  LucideGripVertical,
  LucideMaximize2,
  LucideCopy,
  LucideCheck
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { SpatialElement, OnlineUser } from '../types';

interface ChatOverlayProps {
  elements: SpatialElement[];
  onAddElement: (element: Omit<SpatialElement, 'author' | 'timestamp' | 'authorId'>) => void;
  onlineUsers: OnlineUser[];
  myId: string;
  isDarkMode: boolean;
  isFloating?: boolean;
  isMiniMode?: boolean;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ elements, onAddElement, onlineUsers, myId, isDarkMode, isFloating, isMiniMode }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
  const [message, setMessage] = useState('');
  const [whisperTarget, setWhisperTarget] = useState<OnlineUser | null>(null);
  const [history, setHistory] = useState<Array<{ id: string, author: string, text: string, isPrivate: boolean }>>([]);
  const [dimensions, setDimensions] = useState({ width: 380, height: 480 });
  const [isResizing, setIsResizing] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history.length, isOpen, activeTab, isFloating, dimensions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const id = (whisperTarget ? 'whisper-' : 'pop-') + Math.random().toString(36).substring(7);
    onAddElement({
      id, type: 'text',
      x: 300 + Math.random() * (window.innerWidth - 700),
      y: 300 + Math.random() * (window.innerHeight - 600),
      content: whisperTarget ? `[MESH-TUNNEL] ${message}` : message,
      isEphemeral: true,
      recipientId: whisperTarget?.clientId,
      color: whisperTarget ? '#fbbf24' : undefined 
    });
    
    setHistory(prev => [...prev, { 
      id: Math.random().toString(36).substring(7),
      author: whisperTarget ? `To ${whisperTarget.name}` : 'Me', 
      text: message, 
      isPrivate: !!whisperTarget 
    }]);
    setMessage('');
    setWhisperTarget(null);
  };

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyingId(id);
      setTimeout(() => setCopyingId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX, startY = e.clientY;
    const startW = dimensions.width, startH = dimensions.height;
    const move = (ev: MouseEvent) => setDimensions({
      width: Math.max(320, startW + (startX - ev.clientX)),
      height: Math.max(280, startH + (startY - ev.clientY))
    });
    const up = () => { setIsResizing(false); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  const content = (
    <div 
      style={isFloating ? { width: '100%', height: '100%' } : { width: dimensions.width, height: isOpen ? dimensions.height : 90 }}
      className={`bg-black rounded-[40px] shadow-[0_0_120px_rgba(0,0,0,1)] flex flex-col overflow-hidden border-2 border-indigo-500/10 transition-all duration-300 relative`}
    >
      {!isFloating && isOpen && (
        <div onMouseDown={handleResizeStart} className="absolute top-0 left-0 w-12 h-12 cursor-nw-resize flex items-center justify-center z-[50] hover:bg-white/5 rounded-br-3xl transition-colors group" title="Hub Dimension Control">
          <LucideMaximize2 className="w-5 h-5 text-zinc-800 group-hover:text-indigo-500 -rotate-90" />
        </div>
      )}

      <div className={`flex items-center p-5 bg-zinc-950/80 border-b border-white/5 ${isOpen || isFloating ? 'justify-between' : 'justify-center h-full'}`}>
        <div className="flex items-center gap-4">
          {!isFloating && <div className={`chat-handle p-2 text-zinc-700 cursor-grab active:cursor-grabbing hover:text-indigo-400 transition-colors ${isOpen ? '' : 'hidden'}`}><LucideGripVertical className="w-4 h-4" /></div>}
          <button onClick={() => !isFloating && setIsOpen(!isOpen)} className="w-12 h-12 rounded-[20px] flex items-center justify-center bg-indigo-600 shadow-2xl active:scale-90 transition-transform"><LucideMessageSquare className="w-5 h-5 text-white" /></button>
          {(isOpen || isFloating) && <div className="flex flex-col"><span className="font-black text-white text-sm tracking-tight">Signal Hub</span><span className="text-[8px] text-indigo-500/60 font-black uppercase tracking-[0.2em]">{onlineUsers.length} Nodes Tuned In</span></div>}
        </div>
        {(isOpen || isFloating) && <div className="flex gap-1.5">
          <button onClick={() => setActiveTab('chat')} className={`p-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-indigo-600/20 text-indigo-400' : 'text-zinc-600 hover:text-white'}`}><LucideMessageSquare className="w-4 h-4" /></button>
          <button onClick={() => setActiveTab('users')} className={`p-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-indigo-600/20 text-indigo-400' : 'text-zinc-600 hover:text-white'}`}><LucideUsers className="w-4 h-4" /></button>
        </div>}
      </div>

      {(isOpen || isFloating) && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-none bg-black/60">
            {activeTab === 'chat' ? (
              history.length > 0 ? history.map((item, idx) => (
                <div key={item.id} className="flex flex-col items-end animate-pop w-full group">
                  <div className="flex items-center gap-2 max-w-[95%]">
                    <button 
                      onClick={() => copyText(item.text, item.id)}
                      className={`p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${copyingId === item.id ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-600 hover:bg-white/5 hover:text-indigo-400'}`}
                    >
                      {copyingId === item.id ? <LucideCheck className="w-4 h-4" /> : <LucideCopy className="w-4 h-4" />}
                    </button>
                    <div className={`px-6 py-4 rounded-[28px] text-sm break-words shadow-2xl leading-relaxed ${item.isPrivate ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200' : 'bg-indigo-600 text-white'}`}>{item.text}</div>
                  </div>
                  <span className="text-[8px] mt-2 font-black text-zinc-800 uppercase tracking-widest px-2 group-hover:text-zinc-600 transition-colors">{item.author} {item.isPrivate && '• MESH-TUNNEL'}</span>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-900 space-y-4 opacity-40">
                  <LucideMessageSquare className="w-16 h-16" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Listening for signals...</p>
                </div>
              )
            ) : onlineUsers.map((u) => (
              <button key={u.clientId} onClick={() => { setWhisperTarget(u); setActiveTab('chat'); }} className={`w-full flex items-center justify-between p-5 rounded-[28px] border transition-all ${u.clientId === myId ? 'bg-white/5 border-transparent opacity-40 grayscale cursor-default' : 'bg-white/2 border-white/5 hover:border-indigo-500/40 hover:bg-white/5 hover:scale-[1.02]'}`}>
                <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full border-2 border-black shadow-lg" style={{ background: u.color }} /><span className="text-sm font-black text-zinc-300">{u.name} {u.clientId === myId && '(Host)'}</span></div>
                {u.clientId !== myId && <span className="text-[8px] font-black text-indigo-400 tracking-widest uppercase">Signal</span>}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 bg-zinc-950/90 border-t border-white/5 backdrop-blur-md">
            {whisperTarget && <div className="flex items-center justify-between px-5 py-3 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[9px] font-black text-amber-500 uppercase tracking-widest animate-pop"><span>Private Tunnel: {whisperTarget.name}</span><LucideX onClick={() => setWhisperTarget(null)} className="w-4 h-4 cursor-pointer hover:text-white" /></div>}
            <div className="relative">
              <textarea rows={1} value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }} placeholder="Transmit to mesh..." className="w-full bg-black border border-white/10 rounded-[28px] px-6 py-5 pr-16 text-sm focus:outline-none focus:border-indigo-500/40 text-white placeholder:text-zinc-800 resize-none min-h-[64px] max-h-[160px] leading-relaxed transition-all" />
              <button type="submit" className="absolute right-2 bottom-2 p-4 bg-indigo-600 rounded-[22px] text-white shadow-3xl active:scale-90 hover:bg-indigo-500 transition-all"><LucideSend className="w-5 h-5" /></button>
            </div>
          </form>
        </>
      )}
    </div>
  );

  if (isFloating) return <div className="h-full w-full">{content}</div>;

  return (
    <Draggable nodeRef={draggableRef} handle=".chat-handle" disabled={isResizing}>
      <div ref={draggableRef} className={`fixed bottom-8 right-8 z-[2000] transition-opacity duration-500 ${isMiniMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>{content}</div>
    </Draggable>
  );
};

export default ChatOverlay;