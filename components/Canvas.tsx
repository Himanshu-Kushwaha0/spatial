import { 
  LucideEraser, 
  LucideImage, 
  LucideMic, 
  LucideMousePointer2, 
  LucidePencil, 
  LucidePlay, 
  LucideTrash2, 
  LucideType, 
  LucideX,
  LucideZap,
  LucideSparkles,
  LucideGhost,
  LucideSun,
  LucidePieChart,
  LucideGripVertical,
  LucideMaximize,
  LucideCommand,
  LucideActivity,
  LucideShieldAlert,
  LucideHash
} from 'lucide-react';
import { getStroke } from 'perfect-freehand';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import Draggable from 'react-draggable';
import { CursorState, SpatialElement } from '../types';
import * as Y from 'yjs';

interface CanvasProps {
  elements: SpatialElement[];
  cursors: Record<string, CursorState>;
  onAddElement: (element: Omit<SpatialElement, 'author' | 'timestamp' | 'authorId'>) => void;
  onUpdateElement: (id: string, content: string) => void;
  onCursorMove: (x: number, y: number) => void;
  onDeleteElement: (id: string) => void;
  yDoc: Y.Doc;
  isDarkMode: boolean;
}

type ToolMode = 'none' | 'drawing' | 'eraser' | 'text' | 'image' | 'voice' | 'poll' | 'emoji';

const ERASER_THRESHOLD = 40;
const PALETTE = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ffffff', '#111111'];

const Canvas: React.FC<CanvasProps> = ({ elements, cursors, onAddElement, onUpdateElement, onCursorMove, onDeleteElement, yDoc, isDarkMode }) => {
  const [menuPos, setMenuPos] = useState<{ x: number, y: number } | null>(null);
  const [activeMode, setActiveMode] = useState<ToolMode>('none');
  const [brushSize, setBrushSize] = useState(8);
  const [brushColor, setBrushColor] = useState(PALETTE[0]);
  const [currentPath, setCurrentPath] = useState<number[][]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isModsOpen, setIsModsOpen] = useState(false);
  const [isRainbowMode, setIsRainbowMode] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isNeonMode, setIsNeonMode] = useState(false);
  const [pollDraft, setPollDraft] = useState({ question: '', options: ['Yes', 'No'] });
  const [textInputPos, setTextInputPos] = useState<{ x: number, y: number } | null>(null);
  const [tempText, setTempText] = useState('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMode('none');
        setTextInputPos(null);
        setMenuPos(null);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const compressAsset = (file: File, x: number, y: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const TARGET_DIM = 1000; 
        if (width > TARGET_DIM || height > TARGET_DIM) {
          const ratio = width > height ? TARGET_DIM / width : TARGET_DIM / height;
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const cacheData = canvas.toDataURL('image/jpeg', 0.65);
          onAddElement({ id: 'asset-' + Math.random().toString(36).substring(7), type: 'image', x, y, content: cacheData });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startVoiceSignal = async (x: number, y: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          onAddElement({ id: 'v-' + Math.random().toString(36).substring(7), type: 'voice', x, y, content: reader.result as string });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { alert("Mic auth required."); }
  };

  const performErase = useCallback((x: number, y: number) => {
    elements.forEach((el) => {
      if (el.type === 'doodle') {
        try {
          const { points } = JSON.parse(el.content);
          if (points.some((p: number[]) => Math.hypot(p[0] - x, p[1] - y) < ERASER_THRESHOLD)) onDeleteElement(el.id);
        } catch { onDeleteElement(el.id); }
      } else {
        const w = el.metadata?.width || 300;
        const h = el.metadata?.height || 200;
        const rect = { left: el.x - 10, top: el.y - 10, right: el.x + w + 10, bottom: el.y + h + 10 };
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) onDeleteElement(el.id);
      }
    });
  }, [elements, onDeleteElement]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.pointer-events-auto')) return;
    
    if (activeMode === 'text') { 
      setTextInputPos({ x: e.clientX, y: e.clientY }); 
      return; 
    }

    if (activeMode === 'drawing') {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setCurrentPath([[e.clientX, e.clientY, e.pressure || 0.5]]);
    } else if (activeMode === 'eraser') {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      performErase(e.clientX, e.clientY);
    }
    if (menuPos) setMenuPos(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    onCursorMove(e.clientX, e.clientY);
    if (activeMode === 'drawing' && e.buttons === 1) {
      setCurrentPath(prev => [...prev, [e.clientX, e.clientY, e.pressure || 0.5]]);
    } else if (activeMode === 'eraser' && e.buttons === 1) performErase(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeMode === 'drawing' && currentPath.length > 1) {
      onAddElement({
        id: 'd-' + Math.random().toString(36).substring(7), type: 'doodle', x: 0, y: 0,
        content: JSON.stringify({ points: currentPath, size: brushSize }),
        color: isRainbowMode ? 'rainbow' : brushColor,
        isEphemeral: isGhostMode,
        metadata: { isNeon: isNeonMode }
      });
      setCurrentPath([]);
    }
    if (e.pointerId) (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleAction = (type: ToolMode) => {
    if (type === 'image') {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = (ev: any) => {
        const file = ev.target.files[0];
        if (file && menuPos) compressAsset(file, menuPos.x, menuPos.y);
      };
      input.click();
    } else if (type === 'voice') {
      if (menuPos) startVoiceSignal(menuPos.x, menuPos.y);
    } else setActiveMode(type);
    setMenuPos(null);
  };

  const getInputStyles = () => {
    if (!textInputPos) return {};
    if (isMobile) {
      return {
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        position: 'fixed' as const,
      };
    }
    const left = Math.min(textInputPos.x, window.innerWidth - 360);
    const top = Math.min(textInputPos.y, window.innerHeight - 240);
    return {
      left: `${left}px`,
      top: `${top}px`,
      position: 'absolute' as const,
    };
  };

  const getMenuStyles = () => {
    if (!menuPos) return {};
    const menuWidth = 360;
    const menuHeight = 320; 
    const x = Math.min(menuPos.x, window.innerWidth - menuWidth - 20);
    const y = Math.min(menuPos.y, window.innerHeight - menuHeight - 20);
    return {
      left: `${Math.max(20, x)}px`,
      top: `${Math.max(20, y)}px`,
    };
  };

  return (
    <div 
      className={`absolute inset-0 overflow-hidden touch-none select-none ${activeMode === 'eraser' ? 'cursor-cell' : activeMode === 'drawing' ? 'cursor-crosshair' : ''}`} 
      onPointerMove={handlePointerMove} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}
      onContextMenu={(e) => { e.preventDefault(); setMenuPos({ x: e.clientX, y: e.clientY }); }}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
        {elements.filter(e => e.type === 'doodle').map(el => {
          let d; try { d = JSON.parse(el.content); } catch { return null; }
          return <DoodlePath key={el.id} points={d.points || []} size={d.size || 6} color={el.color === 'rainbow' ? `hsl(${Date.now() / 25 % 360}, 80%, 70%)` : (el.color || '#6366f1')} isNeon={el.metadata?.isNeon} />;
        })}
        {activeMode === 'drawing' && currentPath.length > 0 && <DoodlePath points={currentPath} color={isRainbowMode ? `hsl(${Date.now() / 25 % 360}, 80%, 70%)` : brushColor} size={brushSize} isLocal isNeon={isNeonMode} />}
      </svg>

      {elements.filter(e => e.type !== 'doodle').map(el => (
        <DraggableElement key={el.id} element={el} onDelete={onDeleteElement} yDoc={yDoc} isMobile={isMobile} isDarkMode={isDarkMode} />
      ))}

      {activeMode !== 'none' && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[4000] animate-pop">
          <div className="flex items-center gap-3 px-6 py-2 bg-indigo-600 text-white rounded-md shadow-2xl border border-white/20 font-mono text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">
            <span>NODE_MODE::{activeMode}</span>
            <button onClick={() => setActiveMode('none')} className="p-1 hover:bg-white/20 rounded-sm transition-colors ml-2">
              <LucideX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {activeMode === 'poll' && (
        <div className="fixed inset-0 bg-black/95 z-[5000] flex items-center justify-center backdrop-blur-3xl p-4 font-mono">
          <div className="bg-[var(--surface-color)] p-12 rounded-lg border-2 border-indigo-500/20 w-full max-w-xl space-y-10 animate-pop secure-border">
             <div className="flex items-center gap-4 text-indigo-500">
               <LucidePieChart className="w-10 h-10" />
               <h2 className="text-3xl font-black text-[var(--text-color)] uppercase tracking-tighter">NODE_POLL_INIT</h2>
             </div>
             <input autoFocus value={pollDraft.question} onChange={e => setPollDraft({...pollDraft, question: e.target.value})} className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-md p-6 text-xl font-bold outline-none text-[var(--text-color)] placeholder:text-zinc-800" placeholder="POLL_QUERY_STRING" />
             <div className="space-y-3">
               {pollDraft.options.map((opt, i) => (
                 <input key={i} value={opt} onChange={e => { const n = [...pollDraft.options]; n[i] = e.target.value; setPollDraft({...pollDraft, options: n}); }} className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-md p-4 text-[var(--text-color)] outline-none" placeholder={`OPTION_0${i+1}`} />
               ))}
               <button onClick={() => setPollDraft({...pollDraft, options: [...pollDraft.options, '']})} className="w-full py-4 border border-dashed border-[var(--border-color)] rounded-md text-[10px] font-bold uppercase text-zinc-600 hover:text-indigo-400">+ APPEND_OPTION</button>
             </div>
             <div className="flex gap-4 pt-8 border-t border-[var(--border-color)]">
                <button onClick={() => {
                  if(pollDraft.question.trim()) {
                     onAddElement({ id: 'p-' + Math.random().toString(36).substring(7), type: 'poll', x: window.innerWidth / 2 - 160, y: window.innerHeight / 2 - 150, content: pollDraft.question.trim(), metadata: { pollOptions: pollDraft.options.filter(o=>o.trim()), votes: {} } });
                     setActiveMode('none');
                  }
                }} className="flex-1 bg-indigo-600 py-6 rounded-md font-black uppercase text-white shadow-2xl tracking-widest">COMMIT_POLL</button>
                <button onClick={() => setActiveMode('none')} className="px-12 py-6 bg-zinc-900 rounded-md text-[10px] font-black uppercase text-zinc-500">ABORT_TASK</button>
             </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-10 left-10 z-[3000] pointer-events-auto font-mono">
        <button onClick={() => setIsModsOpen(!isModsOpen)} className={`w-18 h-18 rounded-lg flex items-center justify-center border transition-all ${isModsOpen ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.5)]' : 'bg-[var(--surface-color)]/80 border-[var(--border-color)] text-zinc-600 hover:text-indigo-500'}`}>
          <LucideZap className={`w-8 h-8 ${isRainbowMode || isGhostMode || isNeonMode ? 'animate-pulse' : ''}`} />
        </button>
        {isModsOpen && (
          <div className="absolute bottom-22 left-0 p-8 rounded-lg bg-[var(--surface-color)] border border-[var(--border-color)] animate-pop w-80 space-y-5 shadow-[0_0_50px_rgba(0,0,0,1)] secure-border overflow-hidden" style={{ bottom: 'calc(100% + 20px)' }}>
            <ModToggle active={isRainbowMode} onClick={() => setIsRainbowMode(!isRainbowMode)} icon={<LucideSparkles className="w-4 h-4"/>} label="Prism_FX" />
            <ModToggle active={isGhostMode} onClick={() => setIsGhostMode(!isGhostMode)} icon={<LucideGhost className="w-4 h-4"/>} label="Void_FX" />
            <ModToggle active={isNeonMode} onClick={() => setIsNeonMode(!isNeonMode)} icon={<LucideSun className="w-4 h-4"/>} label="Glow_FX" />
            <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border-color)] max-h-[200px] overflow-y-auto pr-2 scrollbar-none">
              {[
                '⚡', '💥', '💎', '🛰️', '💀', '👽', '🌐', 
                '🔥', '✨', '🌈', '🍕', '🍦', '☕', '🎮', 
                '🤖', '💻', '🧠', '⛓️', '🔑', '🛡️', '📡',
                '💖', '🎨', '🚀', '🛸', '🎃', '👾', '🎲',
                '✅', '❌', '⚠️', '🚩', '🎯', '📍', '💡'
              ].map(em => (
                <button key={em} onClick={() => { onAddElement({ id: 'em-'+Math.random().toString(36).substring(7), type:'text', x: window.innerWidth / 2 + (Math.random()-0.5)*400, y: window.innerHeight / 2 + (Math.random()-0.5)*400, content: em, isEphemeral: true, metadata: { isNeon: true } }); setIsModsOpen(false); }} className="w-11 h-11 rounded-md bg-[var(--text-muted)]/10 hover:bg-[var(--text-muted)]/20 flex items-center justify-center text-2xl transition-all active:scale-90">{em}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {menuPos && (
        <div 
          className="fixed z-[4000] p-4 bg-[var(--surface-color)] rounded-xl shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex flex-wrap gap-2 pointer-events-auto max-w-[360px] animate-pop border-2 border-[var(--border-color)] secure-border font-mono" 
          style={getMenuStyles()}
        >
          <MenuButton icon={<LucideMousePointer2 className="w-5 h-5" />} label="Pointer" onClick={() => handleAction('none')} />
          <MenuButton icon={<LucideType className="w-5 h-5 text-indigo-400" />} label="Signal" onClick={() => handleAction('text')} />
          <MenuButton icon={<LucidePencil className="w-5 h-5 text-emerald-400" />} label="Scribe" onClick={() => handleAction('drawing')} />
          <MenuButton icon={<LucideEraser className="w-5 h-5 text-rose-500" />} label="Delete" onClick={() => handleAction('eraser')} />
          <MenuButton icon={<LucideActivity className="w-5 h-5 text-amber-500" />} label="Vocal" onClick={() => handleAction('voice')} />
          <MenuButton icon={<LucideImage className="w-5 h-5 text-sky-500" />} label="Asset" onClick={() => handleAction('image')} />
          <MenuButton icon={<LucidePieChart className="w-5 h-5 text-violet-500" />} label="Poll" onClick={() => handleAction('poll')} />
        </div>
      )}

      {textInputPos && (
        <div className="z-[4500] p-4 font-mono animate-pop" style={getInputStyles()}>
          <div className="bg-[var(--surface-color)] border-2 border-indigo-600 shadow-[0_0_50px_rgba(79,70,229,0.3)] rounded-md overflow-hidden min-w-[340px] max-w-[90vw]">
            <div className="bg-indigo-600/10 px-5 py-2 border-b border-indigo-600/30 flex justify-between items-center">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">SIGNAL_ENTRY_PORTAL</span>
              <LucideX className="w-4 h-4 text-indigo-400 cursor-pointer" onClick={() => setTextInputPos(null)} />
            </div>
            <textarea 
              ref={textInputRef} 
              autoFocus
              value={tempText} 
              onChange={e => setTempText(e.target.value)} 
              onKeyDown={e => { 
                if(e.key === 'Enter' && !e.shiftKey) { 
                  e.preventDefault(); 
                  if (tempText.trim()) onAddElement({ 
                    id: 't-'+Math.random().toString(36).substring(7), 
                    type: 'text', 
                    x: textInputPos.x, 
                    y: textInputPos.y, 
                    content: tempText.trim(), 
                    color: isRainbowMode ? 'rainbow' : brushColor,
                    isEphemeral: isGhostMode,
                    metadata: { isNeon: isNeonMode }
                  }); 
                  setTempText(''); setTextInputPos(null); setActiveMode('none'); 
                } 
              }} 
              className="w-full bg-transparent text-[var(--text-color)] p-8 outline-none text-xl resize-none font-mono placeholder:text-zinc-500" 
              placeholder="IDENT_RELAY_DATA..." 
            />
            <div className="px-5 py-2 bg-indigo-600/5 text-[8px] font-bold text-indigo-400/50 uppercase tracking-widest border-t border-indigo-600/10">
              PRESS_ENTER_TO_COMMIT
            </div>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="fixed inset-0 bg-black/98 z-[5000] flex items-center justify-center p-6 backdrop-blur-3xl font-mono">
          <div className="bg-[#080808] p-20 rounded-lg flex flex-col items-center gap-12 border border-white/10 max-w-xl w-full shadow-[0_0_120px_rgba(245,158,11,0.1)] secure-border">
            <LucideActivity className="w-24 h-24 text-amber-500 animate-pulse" />
            <div className="text-center space-y-3">
              <p className="text-zinc-600 text-xs uppercase tracking-[0.5em] font-bold">Encrypted Audio Tunnel</p>
              <h2 className="text-white text-3xl font-black tracking-widest uppercase">NODE_RELAY_LIVE</h2>
            </div>
            <button onClick={() => mediaRecorderRef.current?.stop()} className="w-full py-8 bg-rose-700 hover:bg-rose-600 rounded-md text-[12px] font-black uppercase text-white shadow-2xl tracking-[0.4em] transition-colors">TERMINATE_UPLINK</button>
          </div>
        </div>
      )}

      {Object.entries(cursors).map(([id, c]) => {
        const cursor = c as CursorState;
        return (
          <div key={id} className="absolute pointer-events-none z-[5000]" style={{ left: cursor.x, top: cursor.y }}>
            <LucideMousePointer2 className="w-5 h-5 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" style={{ color: cursor.color, fill: cursor.color }} />
            {!isMobile && <div className="ml-6 px-4 py-1.5 rounded-sm text-[10px] font-bold text-white bg-black/90 shadow-2xl border border-white/5 font-mono uppercase tracking-widest">{cursor.name}</div>}
          </div>
        );
      })}
    </div>
  );
};

const DoodlePath: React.FC<{ points: number[][], color: string, size: number, isLocal?: boolean, isNeon?: boolean }> = ({ points, color, size, isLocal, isNeon }) => {
  const stroke = getStroke(points, { size, thinning: 0.5 });
  const pathData = stroke.reduce((acc, [x, y], i, arr) => {
    if (i === 0) acc.push(`M ${x} ${y}`); else acc.push(`L ${x} ${y}`);
    if (i === arr.length - 1) acc.push('Z');
    return acc;
  }, [] as string[]).join(' ');
  return <path d={pathData} fill={color} className={isLocal ? 'opacity-40' : 'opacity-100'} style={{ filter: isNeon ? `drop-shadow(0 0 8px ${color})` : 'none' }} />;
};

const DraggableElement: React.FC<{ element: SpatialElement, onDelete: (id: string) => void, yDoc: Y.Doc, isMobile: boolean, isDarkMode: boolean }> = ({ element, onDelete, yDoc, isMobile, isDarkMode }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isGhost = element.isEphemeral;
  const isNeon = element.metadata?.isNeon;

  return (
    <Draggable nodeRef={nodeRef} position={{ x: element.x, y: element.y }} onStop={(e, data) => {
       const m = yDoc.getMap('elements'); const it = m.get(element.id) as any;
       if (it) m.set(element.id, { ...it, x: data.x, y: data.y });
    }} handle=".drag-handle">
      <div ref={nodeRef} className={`absolute z-20 group transition-opacity duration-1000 ${isGhost ? 'animate-pulse opacity-60' : 'opacity-100'}`}>
        <div className={`relative p-8 bg-[var(--surface-color)]/95 rounded-[2.5rem] border border-[var(--border-color)] backdrop-blur-3xl shadow-[0_30px_90px_rgba(0,0,0,0.4)] secure-border ${isGhost ? 'border-dashed border-indigo-400/40' : ''}`}>
          <div className="absolute -top-12 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all bg-[var(--surface-color)] p-2 rounded-md z-50 border border-[var(--border-color)] shadow-2xl">
             <div className="drag-handle cursor-grab active:cursor-grabbing p-2 text-zinc-600 hover:text-indigo-500 transition-colors"><LucideGripVertical className="w-5 h-5" /></div>
             <button onClick={() => onDelete(element.id)} className="p-2 text-rose-600 hover:bg-rose-950/20 rounded-md transition-all"><LucideTrash2 className="w-5 h-5" /></button>
          </div>
          
          {element.type === 'text' && (
            <div className="min-w-[140px] max-w-[380px] font-mono flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-4 opacity-40">
                <LucideHash className="w-2.5 h-2.5 text-indigo-500" />
                <span className="text-[8px] font-black uppercase tracking-[0.4em]">SIGNAL::{element.id.slice(-5)}</span>
              </div>
              <p className="text-2xl font-black break-words leading-snug text-[var(--text-color)]" style={{ 
                color: element.color === 'rainbow' ? 'inherit' : (element.color || 'inherit'), 
                textShadow: isNeon ? `0 0 20px ${element.color || '#6366f1'}` : 'none' 
              }}>
                {element.content}
              </p>
              <span className="mt-4 text-[8px] font-bold text-zinc-500 uppercase tracking-widest bg-[var(--bg-color)] px-3 py-1 rounded-full">{element.author}</span>
            </div>
          )}
          
          {element.type === 'image' && <img src={element.content} className="rounded-2xl shadow-2xl max-w-[300px] md:max-w-[480px] border border-[var(--border-color)] opacity-90 hover:opacity-100 transition-opacity" alt="NEXUS_ASSET" />}
          
          {element.type === 'voice' && <div className="flex items-center gap-8 p-3 min-w-[280px] font-mono"><button onClick={() => { if(audioRef.current){ isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); } }} className="w-16 h-16 bg-indigo-700 hover:bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-all"><LucidePlay className="w-8 h-8 ml-1" /></button><audio ref={audioRef} src={element.content} onEnded={() => setIsPlaying(false)} className="hidden" /><div className="flex flex-col min-w-0"><span className="text-[8px] font-black uppercase opacity-20 tracking-[0.4em]">NODE_SIGNAL_IN</span><span className="font-bold text-indigo-400 text-sm truncate uppercase tracking-widest">{element.author}</span></div></div>}
          
          {element.type === 'poll' && <div className="w-[300px] md:w-[350px] space-y-6 font-mono"><h4 className="font-black text-xl text-[var(--text-color)] tracking-tighter uppercase">{element.content}</h4><div className="space-y-2.5">{(element.metadata?.pollOptions || []).map((o, i) => {
            const votes = Object.values(element.metadata?.votes || {});
            const count = votes.filter(v => v === i).length;
            const perc = votes.length > 0 ? (count / votes.length) * 100 : 0;
            return <button key={i} onClick={() => { const m = yDoc.getMap('elements'); const it = m.get(element.id) as any; const v = { ...(it.metadata.votes || {}) }; v[yDoc.clientID.toString()] = i; m.set(element.id, { ...it, metadata: { ...it.metadata, votes: v } }); }} className="w-full p-5 rounded-md bg-[var(--bg-color)] border border-[var(--border-color)] relative overflow-hidden text-left hover:border-indigo-500/20 transition-all active:scale-[0.99]"><div className="absolute inset-0 bg-indigo-900/10 transition-all duration-1000 ease-out" style={{ width: `${perc}%` }} /><div className="relative flex justify-between items-center z-10"><span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{o}</span><span className="text-[10px] font-black text-indigo-500">{count}</span></div></button>;
          })}</div></div>}
        </div>
      </div>
    </Draggable>
  );
};

const MenuButton: React.FC<{ icon: any, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center p-6 hover:bg-indigo-600/5 rounded-lg min-w-[110px] group transition-all">
    <div className="text-zinc-400 group-hover:text-indigo-400 group-hover:scale-110 transition-all">{icon}</div>
    <span className="text-[9px] font-black uppercase tracking-[0.3em] mt-4 text-zinc-500 group-hover:text-zinc-600">{label}</span>
  </button>
);

const ModToggle: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-5 w-full px-7 py-5 rounded-md transition-all font-mono ${active ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'bg-[var(--bg-color)] text-zinc-500 hover:bg-[var(--bg-color)]/80'}`}>
    {icon} <span className="text-[11px] font-black uppercase tracking-[0.4em]">{label}</span>
  </button>
);

export default Canvas;