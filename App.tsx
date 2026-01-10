import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import Draggable from 'react-draggable';
import { getRoomInfoFromHash, updateHash } from './utils/crypto';
import { SpatialElement, CursorState, OnlineUser } from './types';
import Canvas from './components/Canvas';
import ChatOverlay from './components/ChatOverlay';
import { 
  LucideArrowRight, 
  LucideUsers, 
  LucideSun, 
  LucideMoon, 
  LucideGripHorizontal,
  LucideAppWindow,
  LucideMinimize2,
  LucideWifi,
  LucideWifiOff,
  LucideShieldCheck,
  LucideTerminal,
  LucideCommand
} from 'lucide-react';

const EPHEMERAL_TTL = 5000; 

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem('nexus-username'));
  const [tempName, setTempName] = useState('');
  const [yDoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [elements, setElements] = useState<SpatialElement[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorState>>({});
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFloating, setIsFloating] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const refs = {
    header: useRef<HTMLDivElement>(null),
    cluster: useRef<HTMLDivElement>(null),
    status: useRef<HTMLDivElement>(null),
    chat: useRef<HTMLDivElement>(null),
    lastCursor: useRef<number>(0),
    lastUserCount: useRef<number>(0)
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }, [isDarkMode]);

  const ephemeralGc = useCallback(() => {
    const yMap = yDoc.getMap('elements');
    const now = Date.now();
    yDoc.transact(() => {
      yMap.forEach((val: any, key: string) => {
        if (val.isEphemeral && (now - val.timestamp >= EPHEMERAL_TTL)) {
          yMap.delete(key);
        }
      });
    });
  }, [yDoc]);

  useEffect(() => {
    const interval = setInterval(ephemeralGc, 3000);
    return () => clearInterval(interval);
  }, [ephemeralGc]);

  const addSystemMessage = useCallback((text: string) => {
    const yChat = yDoc.getArray('chatHistory');
    yChat.push([{
      id: 'sys-' + Math.random().toString(36).substring(7),
      author: 'SYSTEM',
      authorId: 'system',
      text,
      isSystem: true,
      timestamp: Date.now()
    }]);
  }, [yDoc]);

  useEffect(() => {
    if (!userName) return;

    const info = getRoomInfoFromHash();
    updateHash(info);

    const webrtcProvider = new WebrtcProvider(
      info.roomId,
      yDoc,
      {
        signaling: [
          'wss://y-webrtc-signaling-us.herokuapp.com',
          'wss://signaling.yjs.dev',
          'wss://y-webrtc-ck.herokuapp.com'
        ],
        peerOpts: {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
          }
        }
      }
    );

    const yElements = yDoc.getMap('elements');
    const yChat = yDoc.getArray('chatHistory');

    const syncElements = () => {
      const myId = yDoc.clientID.toString();
      const all = Array.from(yElements.values() as any);
      setElements(all.filter((el: any) => 
        !el.recipientId || el.recipientId === myId || el.authorId === myId
      ) as SpatialElement[]);
    };

    const syncChat = () => {
      setChatHistory(yChat.toArray().slice(-100)); 
    };

    yElements.observe(syncElements);
    yChat.observe(syncChat);
    
    syncElements();
    syncChat();

    const myColor = `hsl(${Math.random() * 360}, 80%, 65%)`;
    webrtcProvider.awareness.setLocalStateField('user', {
      name: userName,
      color: myColor,
      clientId: yDoc.clientID.toString()
    });

    webrtcProvider.on('status', (e: { connected: boolean }) => {
      setIsConnected(e.connected);
      if (e.connected) addSystemMessage(`NODE_${userName.toUpperCase()}::CONNECTED_TO_MESH`);
    });

    const peerCheck = setInterval(() => {
      setPeerCount(webrtcProvider.room?.webrtcConns.size || 0);
    }, 5000);

    webrtcProvider.awareness.on('change', () => {
      const states = webrtcProvider.awareness.getStates();
      const nextCursors: Record<string, CursorState> = {};
      const nextUsers: OnlineUser[] = [];
      const typing: string[] = [];

      states.forEach((s: any, id: number) => {
        if (s.user) {
          nextUsers.push({ clientId: id.toString(), name: s.user.name, color: s.user.color });
          if (id !== yDoc.clientID) {
            if (s.cursor) nextCursors[id] = { ...s.cursor, name: s.user.name, color: s.user.color };
            if (s.typing) typing.push(s.user.name);
          }
        }
      });

      refs.lastUserCount.current = nextUsers.length;
      setCursors(nextCursors);
      setOnlineUsers(nextUsers);
      setTypingUsers(typing);
    });

    setProvider(webrtcProvider);
    return () => { 
      clearInterval(peerCheck);
      webrtcProvider.destroy(); 
      yDoc.destroy(); 
    };
  }, [yDoc, userName, addSystemMessage]);

  const addElement = useCallback((el: Omit<SpatialElement, 'author' | 'timestamp' | 'authorId'>) => {
    yDoc.transact(() => {
      const yMap = yDoc.getMap('elements');
      const payload: SpatialElement = {
        ...el,
        timestamp: Date.now(),
        author: userName || 'Anonymous',
        authorId: yDoc.clientID.toString()
      };
      yMap.set(payload.id, payload as any);
    });
  }, [yDoc, userName]);

  const addChatMessage = useCallback((text: string, whisperTargetId?: string) => {
    const user = provider?.awareness.getLocalState()?.user;
    yDoc.transact(() => {
      const yChat = yDoc.getArray('chatHistory');
      yChat.push([{
        id: Math.random().toString(36).substring(7),
        author: userName || 'Anonymous',
        authorId: yDoc.clientID.toString(),
        authorColor: user?.color || '#6366f1',
        text,
        recipientId: whisperTargetId,
        recipientName: onlineUsers.find(u => u.clientId === whisperTargetId)?.name,
        timestamp: Date.now()
      }]);
    });
  }, [yDoc, userName, provider, onlineUsers]);

  const setTyping = useCallback((isTyping: boolean) => {
    provider?.awareness.setLocalStateField('typing', isTyping);
  }, [provider]);

  const updateCursor = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - refs.lastCursor.current < 45) return; 
    refs.lastCursor.current = now;
    provider?.awareness.setLocalStateField('cursor', { x, y });
  }, [provider]);

  const deleteElement = useCallback((id: string) => {
    yDoc.transact(() => {
      yDoc.getMap('elements').delete(id);
    });
  }, [yDoc]);

  const handleFloating = async () => {
    if (!('documentPictureInPicture' in window)) {
      return alert("Nexus PiP requires a modern Chrome-based browser.");
    }
    if (window.self !== window.top) {
      return alert("SECURITY_INFO: PiP is disabled in embedded contexts.");
    }
    try {
      const pip = await (window as any).documentPictureInPicture.requestWindow({ width: 420, height: 720 });
      setIsFloating(true);
      [...document.styleSheets].forEach(s => {
        try {
          const el = document.createElement('style');
          el.textContent = Array.from(s.cssRules).map(r => r.cssText).join('');
          pip.document.head.appendChild(el);
        } catch { if (s.href) { 
          const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = s.href; pip.document.head.appendChild(l); 
        }}
      });
      if (refs.chat.current) pip.document.body.appendChild(refs.chat.current);
      pip.addEventListener('pagehide', () => {
        setIsFloating(false);
        if (refs.chat.current) document.body.appendChild(refs.chat.current);
      });
    } catch (e) { 
      console.error("PiP_INIT_FAILED:", e);
    }
  };

  if (!userName) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[var(--bg-color)] overflow-hidden p-6 relative">
        <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
        <div className="w-full max-w-lg p-12 glass rounded-2xl border-2 border-indigo-500/20 shadow-[0_0_80px_rgba(99,102,241,0.15)] text-center animate-pop font-mono">
          <LucideCommand className="w-16 h-16 text-indigo-500 mx-auto mb-8 animate-pulse" />
          <h1 className="text-4xl font-black text-[var(--text-color)] tracking-tighter mb-2 uppercase">NEXUS_ACCESS</h1>
          <p className="text-indigo-400/40 mb-10 uppercase tracking-[0.6em] text-[10px] font-bold">P2P Encrypted Playground</p>
          <form onSubmit={e => { e.preventDefault(); if (tempName.trim()) { localStorage.setItem('nexus-username', tempName.trim()); setUserName(tempName.trim()); } }} className="space-y-6">
            <input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} placeholder="ENTER_IDENTIFIER" className="w-full bg-[var(--surface-color)] border-2 border-white/5 rounded-xl p-6 text-[var(--text-color)] text-xl text-center outline-none focus:border-indigo-500 transition-all font-mono placeholder:text-zinc-800" />
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-xl text-white font-black text-lg flex items-center justify-center gap-4 active:scale-[0.98] transition-all uppercase tracking-[0.2em] shadow-2xl">
              Initialize Node <LucideArrowRight className="w-6 h-6" />
            </button>
          </form>
          <div className="mt-8 flex items-center justify-center gap-3 text-[10px] font-bold text-zinc-600 tracking-widest uppercase">
            <LucideShieldCheck className="w-4 h-4 text-emerald-500" /> Secure_Session_Active
          </div>
        </div>
      </div>
    );
  }

  const actuallyConnected = isConnected && (peerCount > 0 || onlineUsers.length > 1);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--bg-color)] font-sans selection:bg-indigo-500/40">
      <div className="absolute inset-0 grid-bg opacity-[0.05] pointer-events-none" />
      
      {isMobile ? (
        <div className="absolute top-4 left-4 right-4 z-[3000] flex flex-col gap-2 pointer-events-none font-mono">
          <div className="pointer-events-auto flex items-center justify-between px-6 py-4 bg-[var(--surface-color)]/90 rounded-2xl border border-[var(--border-color)] backdrop-blur-3xl shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${actuallyConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${actuallyConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-color)]/50">{onlineUsers.length} NODES</span>
            </div>
            <button onClick={() => setIsMiniMode(!isMiniMode)} className={`p-2 rounded-lg ${isMiniMode ? 'text-indigo-400' : 'text-zinc-600'}`}><LucideMinimize2 className="w-5 h-5" /></button>
          </div>
        </div>
      ) : (
        <>
          <Draggable nodeRef={refs.header} handle=".drag">
            <div ref={refs.header} className="absolute top-8 left-10 z-[3000] pointer-events-auto font-mono">
              <div className="flex items-center gap-5 px-8 py-5 bg-[var(--surface-color)]/95 rounded-xl shadow-2xl border border-[var(--border-color)] backdrop-blur-3xl">
                <div className="drag cursor-grab active:cursor-grabbing p-1 text-zinc-800 hover:text-indigo-400 transition-colors"><LucideGripHorizontal className="w-5 h-5" /></div>
                <div className={`flex items-center gap-4 ${actuallyConnected ? 'text-emerald-500' : 'text-rose-500'}`}>
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${actuallyConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${actuallyConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">{actuallyConnected ? 'GRID_SYNC::ESTABLISHED' : 'MESH_TUNNELING::OFFLINE'}</span>
                </div>
              </div>
            </div>
          </Draggable>

          <Draggable nodeRef={refs.status} handle=".drag">
            <div ref={refs.status} className="absolute top-8 left-1/2 -translate-x-1/2 z-[3000] pointer-events-auto font-mono">
              <div className="flex items-center gap-6 px-12 py-5 bg-[var(--surface-color)]/95 rounded-xl shadow-2xl border border-[var(--border-color)] backdrop-blur-3xl">
                <div className="drag cursor-grab active:cursor-grabbing text-zinc-800"><LucideGripHorizontal className="w-4 h-4" /></div>
                <div className="flex items-center gap-3 text-indigo-400">
                  <LucideTerminal className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em]">{userName.toUpperCase().slice(0, 10)}</span>
                </div>
                <div className="w-px h-5 bg-white/10" />
                <div className="flex items-center gap-4 text-zinc-500">
                  <LucideUsers className="w-4 h-4 text-zinc-800" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{onlineUsers.length} NODES</span>
                </div>
              </div>
            </div>
          </Draggable>

          <Draggable nodeRef={refs.cluster} handle=".drag">
            <div ref={refs.cluster} className="absolute top-8 right-10 z-[3000] pointer-events-auto">
              <div className="flex items-center gap-4 px-8 py-5 bg-[var(--surface-color)]/95 rounded-xl shadow-2xl border border-[var(--border-color)] backdrop-blur-3xl">
                <button onClick={() => setIsMiniMode(!isMiniMode)} className={`p-2 transition-all ${isMiniMode ? 'text-indigo-400' : 'text-zinc-600 hover:text-indigo-400'}`}><LucideMinimize2 className="w-6 h-6" /></button>
                <button onClick={handleFloating} className="p-2 text-zinc-600 hover:text-white transition-all"><LucideAppWindow className="w-6 h-6" /></button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 transition-colors ${!isDarkMode ? 'text-indigo-500' : 'text-zinc-600'}`}>{isDarkMode ? <LucideSun className="w-6 h-6" /> : <LucideMoon className="w-6 h-6" />}</button>
                <div className="drag cursor-grab active:cursor-grabbing text-zinc-800 ml-2"><LucideGripHorizontal className="w-4 h-4" /></div>
              </div>
            </div>
          </Draggable>
        </>
      )}

      {!isMiniMode && (
        <Canvas 
          elements={elements} 
          cursors={cursors} 
          onAddElement={addElement} 
          onUpdateElement={() => {}} 
          onCursorMove={updateCursor} 
          onDeleteElement={deleteElement} 
          yDoc={yDoc} 
          isDarkMode={isDarkMode} 
        />
      )}
      
      <div ref={refs.chat} className={isFloating ? "h-full w-full" : ""}>
        <ChatOverlay 
          chatHistory={chatHistory}
          onSendChatMessage={addChatMessage} 
          onTyping={setTyping}
          typingUsers={typingUsers}
          onlineUsers={onlineUsers} 
          myId={yDoc.clientID.toString()} 
          isDarkMode={isDarkMode} 
          isFloating={isFloating} 
          isMiniMode={isMiniMode} 
        />
      </div>
    </div>
  );
};

export default App;