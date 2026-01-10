import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import Draggable from 'react-draggable';
import { getRoomInfoFromHash, generateRoomInfo, updateHash } from './utils/crypto';
import { SpatialElement, CursorState, RoomInfo, OnlineUser } from './types';
import Canvas from './components/Canvas';
import ChatOverlay from './components/ChatOverlay';
import { 
  LucideTimer, 
  LucideShare2, 
  LucideLock, 
  LucideArrowRight, 
  LucideUsers, 
  LucideHourglass, 
  LucideSun, 
  LucideMoon, 
  LucideMaximize2, 
  LucideGripHorizontal,
  LucideAppWindow,
  LucideMinimize2,
  LucideZap,
  LucideRadio,
  LucideGlobe
} from 'lucide-react';

const SESSION_TTL = 25 * 60 * 1000; 
const EPHEMERAL_LIFESPAN = 5000; // 5 Seconds limit for Anywhere Chat

const App: React.FC = () => {
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('ephemeral-username'));
  const [tempName, setTempName] = useState('');
  const [yDoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [elements, setElements] = useState<SpatialElement[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorState>>({});
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(SESSION_TTL);
  const [roomCreatedAt, setRoomCreatedAt] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isOverlayMode, setIsOverlayMode] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const systemClusterRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastCursorUpdate = useRef<number>(0);
  const trackedEphemeralIds = useRef<Set<string>>(new Set());

  // Logic for the 5-second disappearance (Anywhere Chat)
  useEffect(() => {
    const yElements = yDoc.getMap('elements');
    
    const checkEphemeral = () => {
      const now = Date.now();
      elements.forEach(el => {
        if (el.isEphemeral && !trackedEphemeralIds.current.has(el.id)) {
          trackedEphemeralIds.current.add(el.id);
          const age = now - el.timestamp;
          const remaining = Math.max(0, EPHEMERAL_LIFESPAN - age);
          
          setTimeout(() => {
            if (yElements.has(el.id)) {
              yElements.delete(el.id);
            }
            trackedEphemeralIds.current.delete(el.id);
          }, remaining);
        }
      });
    };

    checkEphemeral();
  }, [elements, yDoc]);

  useEffect(() => {
    if (!userName) return;

    let info = getRoomInfoFromHash();
    if (!info) {
      info = generateRoomInfo();
    }
    setRoomInfo(info);
    updateHash(info);

    const webrtcProvider = new WebrtcProvider(
      `ephemeral-relay-${info.roomId}`,
      yDoc,
      {
        signaling: ['wss://signaling.yjs.dev'],
      }
    );

    const yElements = yDoc.getMap('elements');
    const yMetadata = yDoc.getMap('metadata');

    const updateElements = () => {
      const allElements = Array.from(yElements.values()) as unknown as SpatialElement[];
      const myId = yDoc.clientID.toString();
      const filtered = allElements.filter(el => {
        if (!el || typeof el !== 'object') return false;
        if (!el.recipientId) return true;
        return el.recipientId === myId || el.authorId === myId;
      });
      setElements(filtered);
    };

    const updateMetadata = () => {
      const created = yMetadata.get('createdAt');
      if (created) setRoomCreatedAt(created as number);
      else {
        setTimeout(() => {
          if (!yMetadata.get('createdAt')) {
            const now = Date.now();
            yMetadata.set('createdAt', now);
            setRoomCreatedAt(now);
          }
        }, 500);
      }
    };

    yElements.observe(updateElements);
    yMetadata.observe(updateMetadata);
    updateElements();
    updateMetadata();

    const myColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
    webrtcProvider.awareness.setLocalStateField('user', {
      name: userName,
      color: myColor,
      clientId: yDoc.clientID.toString()
    });

    let awarenessUpdateScheduled = false;
    webrtcProvider.awareness.on('change', () => {
      if (awarenessUpdateScheduled) return;
      awarenessUpdateScheduled = true;
      requestAnimationFrame(() => {
        const states = webrtcProvider.awareness.getStates();
        const newCursors: Record<string, CursorState> = {};
        const users: OnlineUser[] = [];

        states.forEach((state: any, clientId: number) => {
          if (state.user) {
            users.push({
              clientId: clientId.toString(),
              name: state.user.name,
              color: state.user.color
            });

            if (clientId !== yDoc.clientID && state.cursor) {
              newCursors[clientId] = {
                ...state.cursor,
                name: state.user.name,
                color: state.user.color,
              };
            }
          }
        });
        setCursors(newCursors);
        setOnlineUsers(users);
        awarenessUpdateScheduled = false;
      });
    });

    setProvider(webrtcProvider);

    return () => {
      webrtcProvider.destroy();
      yDoc.destroy();
    };
  }, [yDoc, userName]);

  useEffect(() => {
    if (!roomCreatedAt) return;
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - roomCreatedAt;
      const remaining = Math.max(0, SESSION_TTL - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        const yMetadata = yDoc.getMap('metadata');
        yMetadata.set('createdAt', Date.now());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [roomCreatedAt, yDoc]);

  const toggleOverlay = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsOverlayMode(true);
    } else {
      document.exitFullscreen();
      setIsOverlayMode(false);
    }
  };

  const handleFloatingToggle = async () => {
    if (window.self !== window.top) {
      if (confirm("Floating Window is blocked inside iframes. Open this Hub in a standalone tab?")) {
        window.open(window.location.href, '_blank');
      }
      return;
    }

    if (!('documentPictureInPicture' in window)) {
      alert("Floating System Windows require a Chromium-based browser (Chrome, Edge, Brave).");
      return;
    }

    try {
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: 420,
        height: 700,
      });

      setIsFloating(true);

      [...document.styleSheets].forEach((styleSheet) => {
        try {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet'; link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          } else {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          }
        } catch (e) {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet'; link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        }
      });

      const baseStyle = pipWindow.document.createElement('style');
      baseStyle.textContent = `
        body { background: #000 !important; margin: 0; padding: 0; overflow: hidden; height: 100vh; width: 100vw; font-family: system-ui, sans-serif; color: white; }
        * { box-sizing: border-box; }
      `;
      pipWindow.document.head.appendChild(baseStyle);

      if (chatContainerRef.current) {
        pipWindow.document.body.appendChild(chatContainerRef.current);
      }

      pipWindow.addEventListener('pagehide', () => {
        setIsFloating(false);
        if (chatContainerRef.current) {
          document.body.appendChild(chatContainerRef.current);
        }
      });

    } catch (err) {
      console.error(err);
    }
  };

  const extendSession = () => {
    if (!roomCreatedAt) return;
    const yMetadata = yDoc.getMap('metadata');
    yMetadata.set('createdAt', roomCreatedAt + (10 * 60 * 1000));
    
    const note = document.createElement('div');
    note.className = 'fixed top-32 left-1/2 -translate-x-1/2 px-8 py-4 bg-indigo-600 rounded-full font-black text-[10px] uppercase tracking-widest text-white shadow-2xl z-[9000] animate-pop';
    note.innerText = 'Global Pulse Extended +10m';
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 2500);
  };

  const addElement = useCallback((element: Omit<SpatialElement, 'author' | 'timestamp' | 'authorId'>) => {
    const yElements = yDoc.getMap('elements');
    const fullElement: SpatialElement = {
      ...element,
      timestamp: Date.now(),
      author: userName || 'Anonymous',
      authorId: yDoc.clientID.toString()
    };
    yElements.set(fullElement.id, fullElement as any);
  }, [yDoc, userName]);

  const updateCursor = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastCursorUpdate.current < 20) return; 
    lastCursorUpdate.current = now;
    provider?.awareness.setLocalStateField('cursor', { x, y });
  }, [provider]);

  const deleteElement = useCallback((id: string) => {
    const yElements = yDoc.getMap('elements');
    yElements.delete(id);
  }, [yDoc]);

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!userName) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-[#050505]">
        <div className="w-full max-w-md p-12 glass rounded-[48px] shadow-2xl animate-pop text-center">
          <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center shadow-2xl mx-auto mb-8">
            <LucideGlobe className="w-12 h-12 text-white animate-spin-slow" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Spatial Hub</h1>
          <p className="text-zinc-500 mb-10 font-medium tracking-widest uppercase text-[10px]">Open World Mesh Relay</p>
          <form onSubmit={(e) => { e.preventDefault(); if(tempName.trim()){ localStorage.setItem('ephemeral-username', tempName.trim()); setUserName(tempName.trim()); } }} className="space-y-6">
            <input autoFocus type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="Identity" className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-white text-xl text-center" />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 text-lg">
              Enter World <LucideArrowRight className="w-6 h-6" />
            </button>
          </form>
          <p className="mt-8 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700">No Passwords • Pure P2P Connectivity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-[100dvh] w-full overflow-hidden transition-all duration-700 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'} ${isMiniMode ? 'canvas-minimized' : ''}`}>
      
      <Draggable nodeRef={headerRef} handle=".drag-handle">
        <div ref={headerRef} className="absolute top-6 left-8 z-[2000] flex items-center gap-3 pointer-events-auto">
          <div className={`flex items-center gap-4 px-6 py-3 ${isDarkMode ? 'bg-zinc-950/95' : 'bg-white/95'} rounded-full shadow-2xl border border-white/10`}>
            <div className="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded-md">
              <LucideGripHorizontal className="w-4 h-4 text-zinc-600" />
            </div>
            <div className="flex items-center gap-2 text-emerald-500">
              <LucideGlobe className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Open World Mesh</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-rose-500 font-black tabular-nums tracking-tighter text-sm">
              <LucideTimer className="w-4 h-4" /> {formatTime(timeLeft)}
            </div>
            <button onClick={extendSession} className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-all">
              <LucideHourglass className="w-3.5 h-3.5" />
            </button>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('World Link Copied'); }} className={`p-3.5 ${isDarkMode ? 'bg-zinc-950' : 'bg-white'} rounded-full shadow-2xl border border-white/10`}>
            <LucideShare2 className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </Draggable>

      <Draggable nodeRef={statusRef} handle=".drag-handle">
        <div ref={statusRef} className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] pointer-events-auto">
          <div className={`flex items-center gap-6 px-8 py-3 ${isDarkMode ? 'bg-zinc-950/95' : 'bg-white/95'} rounded-full shadow-2xl border border-white/10 group`}>
            <div className="drag-handle cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-indigo-400"><LucideGripHorizontal className="w-4 h-4" /></div>
            <div className="flex items-center gap-3 text-indigo-400">
               <LucideRadio className="w-4 h-4 animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-[0.3em]">Grid Active</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
               <LucideUsers className="w-4 h-4 text-zinc-600" />
               <span className="text-[10px] font-bold text-white">{onlineUsers.length} Nodes</span>
            </div>
          </div>
        </div>
      </Draggable>

      <Draggable nodeRef={systemClusterRef} handle=".drag-handle">
        <div ref={systemClusterRef} className="absolute top-6 right-8 z-[2000] flex items-center gap-3 pointer-events-auto">
          <div className={`flex items-center gap-4 px-6 py-3 ${isDarkMode ? 'bg-zinc-950/95' : 'bg-white/95'} rounded-full shadow-2xl border border-white/10`}>
            <button onClick={() => setIsMiniMode(!isMiniMode)} title="Stealth Mode" className={`p-2 rounded-xl transition-all ${isMiniMode ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-indigo-400'}`}><LucideMinimize2 className="w-5 h-5" /></button>
            <div className="w-px h-4 bg-white/10" />
            <button onClick={handleFloatingToggle} title="Pop-out Signal Hub" className={`p-2 rounded-xl transition-all ${isFloating ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-indigo-400'}`}><LucideAppWindow className="w-5 h-5" /></button>
            <div className="w-px h-4 bg-white/10" />
            <button onClick={toggleOverlay} className="p-2 text-zinc-400 hover:text-white"><LucideMaximize2 className="w-5 h-5" /></button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 transition-all">
              {isDarkMode ? <LucideSun className="w-5 h-5 text-amber-500" /> : <LucideMoon className="w-5 h-5 text-indigo-500" />}
            </button>
            <div className="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded-md">
              <LucideGripHorizontal className="w-4 h-4 text-zinc-600" />
            </div>
          </div>
        </div>
      </Draggable>

      {!isMiniMode && <Canvas elements={elements} cursors={cursors} onAddElement={addElement} onUpdateElement={() => {}} onCursorMove={updateCursor} onDeleteElement={deleteElement} yDoc={yDoc} isDarkMode={isDarkMode} />}
      {isMiniMode && <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10"><LucideZap className="w-64 h-64 text-indigo-500 mb-8 animate-pulse" /><span className="text-[14px] font-black uppercase tracking-[1.5em]">Relay Online</span></div>}

      <div ref={chatContainerRef} className={isFloating ? "h-full w-full" : ""}>
        <ChatOverlay elements={elements} onAddElement={addElement} onlineUsers={onlineUsers} myId={yDoc.clientID.toString()} isDarkMode={isDarkMode} isFloating={isFloating} isMiniMode={isMiniMode} />
      </div>
    </div>
  );
};

export default App;