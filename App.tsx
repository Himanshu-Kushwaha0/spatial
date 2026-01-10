import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  LucideMaximize2, 
  LucideGripHorizontal,
  LucideAppWindow,
  LucideMinimize2,
  LucideZap,
  LucideRadio,
  LucideGlobe,
  LucideWifi,
  LucideWifiOff
} from 'lucide-react';

const EPHEMERAL_TTL = 5000; 

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem('ephemeral-username'));
  const [tempName, setTempName] = useState('');
  const [yDoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebrtcProvider | null>(null);
  const [elements, setElements] = useState<SpatialElement[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorState>>({});
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFloating, setIsFloating] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const refs = {
    header: useRef<HTMLDivElement>(null),
    cluster: useRef<HTMLDivElement>(null),
    status: useRef<HTMLDivElement>(null),
    chat: useRef<HTMLDivElement>(null),
    lastCursor: useRef<number>(0)
  };

  const ephemeralGc = useCallback(() => {
    const yMap = yDoc.getMap('elements');
    const now = Date.now();
    let mutation = false;
    
    yMap.forEach((val: any, key: string) => {
      if (val.isEphemeral && (now - val.timestamp >= EPHEMERAL_TTL)) {
        yMap.delete(key);
        mutation = true;
      }
    });
    return mutation;
  }, [yDoc]);

  useEffect(() => {
    const interval = setInterval(ephemeralGc, 500);
    return () => clearInterval(interval);
  }, [ephemeralGc]);

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
          'wss://y-webrtc-signaling-eu.herokuapp.com',
          'wss://signaling.yjs.dev',
          'wss://y-webrtc-ck.herokuapp.com'
        ],
        peerOpts: {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        }
      }
    );

    const yElements = yDoc.getMap('elements');
    const syncElements = () => {
      const myId = yDoc.clientID.toString();
      setElements(Array.from(yElements.values() as any).filter((el: any) => 
        !el.recipientId || el.recipientId === myId || el.authorId === myId
      ) as SpatialElement[]);
    };

    yElements.observe(syncElements);
    syncElements();

    const myColor = `hsl(${Math.random() * 360}, 85%, 65%)`;
    webrtcProvider.awareness.setLocalStateField('user', {
      name: userName,
      color: myColor,
      clientId: yDoc.clientID.toString()
    });

    webrtcProvider.on('status', (e: { connected: boolean }) => setIsConnected(e.connected));
    webrtcProvider.awareness.on('change', () => {
      const states = webrtcProvider.awareness.getStates();
      const nextCursors: Record<string, CursorState> = {};
      const nextUsers: OnlineUser[] = [];

      states.forEach((s: any, id: number) => {
        if (s.user) {
          nextUsers.push({ clientId: id.toString(), name: s.user.name, color: s.user.color });
          if (id !== yDoc.clientID && s.cursor) {
            nextCursors[id] = { ...s.cursor, name: s.user.name, color: s.user.color };
          }
        }
      });
      setCursors(nextCursors);
      setOnlineUsers(nextUsers);
    });

    setProvider(webrtcProvider);
    return () => { webrtcProvider.destroy(); yDoc.destroy(); };
  }, [yDoc, userName]);

  const addElement = useCallback((el: Omit<SpatialElement, 'author' | 'timestamp' | 'authorId'>) => {
    const yMap = yDoc.getMap('elements');
    const payload: SpatialElement = {
      ...el,
      timestamp: Date.now(),
      author: userName || 'Anonymous',
      authorId: yDoc.clientID.toString()
    };
    yMap.set(payload.id, payload as any);
  }, [yDoc, userName]);

  const updateCursor = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - refs.lastCursor.current < 16) return; // 60fps cap
    refs.lastCursor.current = now;
    provider?.awareness.setLocalStateField('cursor', { x, y });
  }, [provider]);

  const deleteElement = useCallback((id: string) => yDoc.getMap('elements').delete(id), [yDoc]);

  const handleFloating = async () => {
    if (!('documentPictureInPicture' in window)) return alert("Nexus requirement: Chromium-based browser.");
    try {
      const pip = await (window as any).documentPictureInPicture.requestWindow({ width: 420, height: 720 });
      setIsFloating(true);
      [...document.styleSheets].forEach(s => {
        try {
          const el = document.createElement('style');
          el.textContent = Array.from(s.cssRules).map(r => r.cssText).join('');
          pip.document.head.appendChild(el);
        } catch { if (s.href) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = s.href; pip.document.head.appendChild(l); } }
      });
      if (refs.chat.current) pip.document.body.appendChild(refs.chat.current);
      pip.addEventListener('pagehide', () => {
        setIsFloating(false);
        if (refs.chat.current) document.body.appendChild(refs.chat.current);
      });
    } catch (e) { console.error(e); }
  };

  if (!userName) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black overflow-hidden">
        <div className="w-full max-w-lg p-16 glass rounded-[60px] shadow-3xl animate-pop text-center border-indigo-500/20">
          <LucideGlobe className="w-24 h-24 text-indigo-500 mx-auto mb-10 animate-spin-slow" />
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Spatial Hub</h1>
          <p className="text-zinc-500 mb-12 uppercase tracking-[0.4em] text-[10px] font-bold">Global Mesh Relay</p>
          <form onSubmit={e => { e.preventDefault(); if (tempName.trim()) { localStorage.setItem('ephemeral-username', tempName.trim()); setUserName(tempName.trim()); } }} className="space-y-8">
            <input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} placeholder="Node ID" className="w-full bg-white/5 border border-white/10 rounded-3xl p-7 text-white text-2xl text-center outline-none focus:border-indigo-500 transition-all" />
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-7 rounded-3xl text-white font-black text-xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
              Join Nexus <LucideArrowRight className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen overflow-hidden transition-colors duration-1000 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
      <Draggable nodeRef={refs.header} handle=".drag">
        <div ref={refs.header} className="absolute top-8 left-10 z-[3000] pointer-events-auto">
          <div className={`flex items-center gap-5 px-8 py-4 ${isDarkMode ? 'bg-zinc-950/90' : 'bg-white/90'} rounded-full shadow-2xl border border-white/10`}>
            <div className="drag cursor-grab active:cursor-grabbing p-1 text-zinc-700 hover:text-indigo-400"><LucideGripHorizontal className="w-5 h-5" /></div>
            <div className={`flex items-center gap-3 ${isConnected ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isConnected ? <LucideWifi className="w-5 h-5" /> : <LucideWifiOff className="w-5 h-5 animate-pulse" />}
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isConnected ? 'Mesh Online' : 'Finding Signal...'}</span>
            </div>
          </div>
        </div>
      </Draggable>

      <Draggable nodeRef={refs.status} handle=".drag">
        <div ref={refs.status} className="absolute top-8 left-1/2 -translate-x-1/2 z-[3000] pointer-events-auto">
          <div className={`flex items-center gap-6 px-10 py-4 ${isDarkMode ? 'bg-zinc-950/90' : 'bg-white/90'} rounded-full shadow-2xl border border-white/10`}>
            <div className="drag cursor-grab active:cursor-grabbing text-zinc-800"><LucideGripHorizontal className="w-4 h-4" /></div>
            <div className="flex items-center gap-3 text-indigo-400">
              <LucideRadio className="w-5 h-5 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Global Grid</span>
            </div>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-3 text-white">
              <LucideUsers className="w-4 h-4 text-zinc-600" />
              <span className="text-xs font-black">{onlineUsers.length} Nodes</span>
            </div>
          </div>
        </div>
      </Draggable>

      <Draggable nodeRef={refs.cluster} handle=".drag">
        <div ref={refs.cluster} className="absolute top-8 right-10 z-[3000] pointer-events-auto">
          <div className={`flex items-center gap-4 px-8 py-4 ${isDarkMode ? 'bg-zinc-950/90' : 'bg-white/90'} rounded-full shadow-2xl border border-white/10`}>
            <button onClick={() => setIsMiniMode(!isMiniMode)} className={`p-2.5 rounded-xl transition-all ${isMiniMode ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-indigo-400'}`}><LucideMinimize2 className="w-6 h-6" /></button>
            <button onClick={handleFloating} className="p-2.5 text-zinc-500 hover:text-white transition-all"><LucideAppWindow className="w-6 h-6" /></button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 transition-all">{isDarkMode ? <LucideSun className="w-6 h-6 text-amber-500" /> : <LucideMoon className="w-6 h-6 text-indigo-500" />}</button>
            <div className="drag cursor-grab active:cursor-grabbing text-zinc-800"><LucideGripHorizontal className="w-4 h-4" /></div>
          </div>
        </div>
      </Draggable>

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
      
      {isMiniMode && (
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <LucideZap className="w-96 h-96 text-indigo-500 animate-pulse" />
        </div>
      )}

      <div ref={refs.chat} className={isFloating ? "h-full w-full" : ""}>
        <ChatOverlay 
          elements={elements} 
          onAddElement={addElement} 
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
