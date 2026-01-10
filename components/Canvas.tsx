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
  LucideFileText,
  LucideZap,
  LucideSparkles,
  LucideGhost,
  LucideSun,
  LucidePieChart,
  LucideGripVertical,
  LucideMaximize,
  LucideSendHorizontal,
  LucideTrash
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

type ToolMode = 'none' | 'drawing' | 'eraser' | 'text' | 'image' | 'voice' | 'file' | 'poll' | 'emoji';

const ERASER_THRESHOLD = 30;
const PALETTE = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ffffff', '#000000'];

const Canvas: React.FC<CanvasProps> = ({ elements, cursors, onAddElement, onUpdateElement, onCursorMove, onDeleteElement, yDoc, isDarkMode }) => {
  const [menuPos, setMenuPos] = useState<{ x: number, y: number } | null>(null);
  const [activeMode, setActiveMode] = useState<ToolMode>('none');
  const [brushSize, setBrushSize] = useState(12);
  const [brushColor, setBrushColor] = useState(PALETTE[0]);
  const [currentPath, setCurrentPath] = useState<number[][]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [isModsOpen, setIsModsOpen] = useState(false);
  const [isRainbowMode, setIsRainbowMode] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isNeonMode, setIsNeonMode] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [pollDraft, setPollDraft] = useState({ question: '', options: ['Yes', 'No'] });
  const modsBubbleRef = useRef<HTMLDivElement>(null);

  const [textInputPos, setTextInputPos] = useState<{ x: number, y: number } | null>(null);
  const [tempText, setTempText] = useState('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (textInputPos && textInputRef.current) textInputRef.current.focus();
  }, [textInputPos]);

  const startRecording = async (x: number, y: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 128;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          onAddElement({ 
            id: 'voice-' + Math.random().toString(36).substring(7), 
            type: 'voice', 
            x, 
            y, 
            content: reader.result as string 
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
        if(audioContextRef.current) audioContextRef.current.close();
        setIsRecording(false);
        if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
      mediaRecorder.start();
      setIsRecording(true);
      drawWaveform();
    } catch (err) { alert("Microphone access is required for Voice P2P."); }
  };

  const drawWaveform = () => {
    if (!analyserRef.current || !waveformCanvasRef.current) return;
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyserRef.current!.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#6366f1';
      const barWidth = (canvas.width / dataArray.length) * 2;
      dataArray.forEach((v, i) => {
        const h = (v / 255) * canvas.height;
        ctx.fillRect(i * (barWidth + 1), canvas.height / 2 - h / 2, barWidth, h);
      });
    };
    render();
  };

  const performErase = useCallback((x: number, y: number) => {
    elements.forEach((el) => {
      if (el.type === 'doodle') {
        try {
          const { points } = JSON.parse(el.content);
          if (points.some((p: number[]) => Math.hypot(p[0] - x, p[1] - y) < ERASER_THRESHOLD)) {
            onDeleteElement(el.id);
          }
        } catch { onDeleteElement(el.id); }
      } else {
        const width = el.metadata?.width || (el.type === 'text' ? 250 : 300);
        const height = el.metadata?.height || (el.type === 'poll' ? 320 : 150);
        const rect = { left: el.x, top: el.y, right: el.x + width, bottom: el.y + height };
        if (x >= rect.left - 10 && x <= rect.right + 10 && y >= rect.top - 10 && y <= rect.bottom + 10) {
          onDeleteElement(el.id);
        }
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
    } else if (activeMode === 'eraser' && e.buttons === 1) {
      performErase(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeMode === 'drawing' && currentPath.length > 1) {
      onAddElement({
        id: 'doodle-' + Math.random().toString(36).substring(7), type: 'doodle', x: 0, y: 0,
        content: JSON.stringify({ points: currentPath, size: brushSize }),
        color: isRainbowMode ? 'rainbow' : brushColor,
        isEphemeral: isGhostMode,
        metadata: { isRainbow: isRainbowMode, isGhost: isGhostMode, isNeon: isNeonMode }
      });
      setCurrentPath([]);
    }
    if (e.pointerId) (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const submitInlineText = () => {
    if (tempText.trim() && textInputPos) {
      onAddElement({
        id: 'text-' + Math.random().toString(36).substring(7), type: 'text',
        x: textInputPos.x, y: textInputPos.y, content: tempText.trim(),
        color: isRainbowMode ? 'rainbow' : brushColor,
        isEphemeral: isGhostMode,
        metadata: { isRainbow: isRainbowMode, isGhost: isGhostMode, isNeon: isNeonMode }
      });
    }
    setTempText(''); setTextInputPos(null); setActiveMode('none');
  };

  const handleAction = (type: ToolMode) => {
    if (type === 'file') {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = (ev: any) => {
        const file = ev.target.files[0];
        if (file && menuPos) {
          const reader = new FileReader();
          reader.onloadend = () => {
            onAddElement({ 
              id: 'file-' + Math.random().toString(36).substring(7), 
              type: 'file', x: menuPos.x, y: menuPos.y, content: reader.result as string, 
              metadata: { fileName: file.name, fileSize: file.size, fileType: file.type } 
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else if (type === 'image') {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = (ev: any) => {
        const file = ev.target.files[0];
        if (file && menuPos) {
          const reader = new FileReader();
          reader.onloadend = () => {
            onAddElement({ 
              id: 'img-' + Math.random().toString(36).substring(7), 
              type: 'image', x: menuPos.x, y: menuPos.y, content: reader.result as string, 
              metadata: { fileName: file.name } 
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else if (type === 'voice') {
      if (menuPos) startRecording(menuPos.x, menuPos.y);
    } else { 
      setActiveMode(type); 
    }
    if (type !== 'poll' && type !== 'emoji') setMenuPos(null);
  };

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 overflow-hidden touch-none select-none ${activeMode === 'eraser' ? 'cursor-cell' : activeMode === 'drawing' ? 'cursor-crosshair' : ''}`} 
      onPointerMove={handlePointerMove} 
      onPointerDown={handlePointerDown} 
      onPointerUp={handlePointerUp} 
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => { 
        e.preventDefault(); 
        if (activeMode === 'none') setMenuPos({ x: e.clientX, y: e.clientY }); 
      }}
      style={{ touchAction: 'none' }}
    >
      <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${!isDarkMode ? 'invert' : ''}`} style={{ backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '60px 60px' }} />

      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
        {elements.filter(e => e.type === 'doodle').map(el => {
          let data; try { data = JSON.parse(el.content); } catch { return null; }
          return <DoodlePath key={el.id} points={data.points || []} size={data.size || 6} color={el.color === 'rainbow' ? `hsl(${Date.now() / 20 % 360}, 70%, 60%)` : (el.color || '#6366f1')} isNeon={el.metadata?.isNeon} />;
        })}
        {activeMode === 'drawing' && currentPath.length > 0 && <DoodlePath points={currentPath} color={isRainbowMode ? `hsl(${Date.now() / 20 % 360}, 70%, 60%)` : brushColor} size={brushSize} isLocal isNeon={isNeonMode} />}
      </svg>

      {elements.filter(e => e.type !== 'doodle').map(el => (
        <DraggableElement key={el.id} element={el} onDelete={onDeleteElement} onResize={(id, width) => {
          const yElements = yDoc.getMap('elements');
          const item = yElements.get(id) as any;
          if (item) yElements.set(id, { ...item, metadata: { ...item.metadata, width } });
        }} yDoc={yDoc} isDarkMode={isDarkMode} isMobile={isMobile} />
      ))}

      {activeMode === 'poll' && (
        <div className="fixed inset-0 bg-black/95 z-[5000] flex items-center justify-center backdrop-blur-2xl p-4">
          <div className="bg-zinc-950 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border-2 border-white/10 w-full max-w-2xl space-y-6 md:space-y-8 animate-pop shadow-3xl overflow-y-auto max-h-[90vh]">
             <div className="flex items-center gap-4 md:gap-6 text-violet-400">
               <LucidePieChart className="w-8 h-8 md:w-12 md:h-12" />
               <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-white">Mesh Poll</h2>
             </div>
             <div className="space-y-4 md:space-y-6">
               <input autoFocus value={pollDraft.question} onChange={e => setPollDraft({...pollDraft, question: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-2xl md:rounded-[28px] p-4 md:p-6 text-lg md:text-2xl font-bold outline-none text-white" placeholder="Broadcast Question..." />
               <div className="space-y-3 md:space-y-4">
                 {pollDraft.options.map((opt, i) => (
                   <div key={i} className="flex gap-2 md:gap-3">
                     <input value={opt} onChange={e => { const n = [...pollDraft.options]; n[i] = e.target.value; setPollDraft({...pollDraft, options: n}); }} className="flex-1 bg-zinc-900 border border-white/5 rounded-xl md:rounded-2xl p-4 font-bold text-white outline-none" placeholder={`Option ${i+1}`} />
                     {pollDraft.options.length > 2 && <button onClick={() => setPollDraft({...pollDraft, options: pollDraft.options.filter((_, idx) => idx !== i)})} className="p-4 bg-rose-500/10 text-rose-500 rounded-xl md:rounded-2xl"><LucideTrash className="w-5 h-5" /></button>}
                   </div>
                 ))}
                 <button onClick={() => setPollDraft({...pollDraft, options: [...pollDraft.options, '']})} className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase text-zinc-500 hover:text-indigo-400 transition-all">+ Add Nexus Choice</button>
               </div>
             </div>
             <div className="flex flex-col md:flex-row gap-3 md:gap-5 pt-6 md:pt-8 border-t border-white/5">
                <button onClick={() => {
                  if(pollDraft.question.trim() && pollDraft.options.filter(o=>o.trim()).length >= 2) {
                     onAddElement({ id: 'poll-' + Math.random().toString(36).substring(7), type: 'poll', x: window.innerWidth / 2 - (isMobile ? 140 : 170), y: window.innerHeight / 2 - 160, content: pollDraft.question.trim(), metadata: { pollOptions: pollDraft.options.filter(o=>o.trim()), votes: {} } });
                     setPollDraft({ question: '', options: ['Yes', 'No'] }); setActiveMode('none');
                  }
                }} className="flex-1 bg-indigo-600 py-5 rounded-2xl md:rounded-[32px] font-black uppercase text-white shadow-2xl transition-all">Deploy to Mesh</button>
                <button onClick={() => setActiveMode('none')} className="px-10 py-5 bg-zinc-800 rounded-2xl md:rounded-[32px] text-[10px] md:text-[11px] font-black uppercase text-zinc-400">Abort</button>
             </div>
          </div>
        </div>
      )}

      {/* MODS BUBBLE: Safety spacing for mobile gesture zones */}
      <Draggable nodeRef={modsBubbleRef} disabled={isMobile}><div ref={modsBubbleRef} className={`absolute ${isMobile ? 'bottom-28 left-6' : 'bottom-10 left-10'} z-[3000] pointer-events-auto`}>
        <button onClick={() => setIsModsOpen(!isModsOpen)} className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-[24px] flex items-center justify-center shadow-2xl border-2 border-white/20 transition-all ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
          <LucideZap className={`w-6 h-6 md:w-7 md:h-7 ${isRainbowMode || isGhostMode || isNeonMode ? 'text-amber-400 animate-pulse' : 'text-indigo-500'}`} />
        </button>
        {isModsOpen && <div className={`absolute bottom-16 md:bottom-20 left-0 p-4 md:p-6 rounded-2xl md:rounded-[32px] ${isDarkMode ? 'bg-zinc-950' : 'bg-white'} border border-white/20 animate-pop w-64 md:w-72 space-y-3 md:space-y-4 shadow-3xl`}>
          <ModToggle active={isRainbowMode} onClick={() => setIsRainbowMode(!isRainbowMode)} icon={<LucideSparkles className="w-4 h-4"/>} label="Rainbow" isMobile={isMobile} />
          <ModToggle active={isGhostMode} onClick={() => setIsGhostMode(!isGhostMode)} icon={<LucideGhost className="w-4 h-4"/>} label="Ghost" isMobile={isMobile} />
          <ModToggle active={isNeonMode} onClick={() => setIsNeonMode(!isNeonMode)} icon={<LucideSun className="w-4 h-4"/>} label="Neon" isMobile={isMobile} />
          
          <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
            {['🔥','🚀','❤️','✨','💎','🌈','🛸','⚡️','💀','👽','👋'].map(em => (
              <button 
                key={em} 
                onClick={() => { 
                  onAddElement({ 
                    id: 'em-'+Math.random().toString(36).substring(7), type:'text', 
                    x: window.innerWidth / 2 + (Math.random() - 0.5) * (isMobile ? 200 : 400), 
                    y: window.innerHeight / 2 + (Math.random() - 0.5) * (isMobile ? 200 : 400), 
                    content: em, isEphemeral: true, metadata: { isNeon: true } 
                  }); 
                  setIsModsOpen(false); 
                }} 
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-xl active:scale-90 transition-all"
              >
                {em}
              </button>
            ))}
          </div>
        </div>}
      </div></Draggable>

      {activeMode !== 'none' && !textInputPos && activeMode !== 'poll' && (
        <div className={`fixed ${isMobile ? 'bottom-44' : 'bottom-10'} left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-auto z-[1000] animate-pop w-full max-w-[90vw] justify-center`}>
          <div className={`${isDarkMode ? 'bg-zinc-950 text-white border-indigo-500/30' : 'bg-white text-zinc-900 border-indigo-200'} rounded-full px-5 md:px-8 py-3 md:py-4 flex items-center gap-4 md:gap-6 shadow-3xl border backdrop-blur-md`}>
             {activeMode === 'drawing' && (
               <div className="flex items-center gap-3 md:gap-4 overflow-x-auto max-w-[150px] md:max-w-none no-scrollbar">
                 {PALETTE.map(c => <button key={c} onClick={() => setBrushColor(c)} className={`w-5 h-5 md:w-6 md:h-6 shrink-0 rounded-full border-2 ${brushColor === c ? 'border-indigo-500 scale-125' : 'border-transparent'}`} style={{ background: c }} />)}
                 <input type="range" min="4" max="100" value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="w-16 md:w-24 accent-indigo-500" />
               </div>
             )}
             <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 whitespace-nowrap">{activeMode} Uplink</span>
             <button onClick={() => { setActiveMode('none'); setCurrentPath([]); }} className="p-2 md:p-2.5 bg-rose-500 rounded-full text-white hover:bg-rose-600 transition-colors"><LucideX className="w-4 h-4"/></button>
          </div>
        </div>
      )}

      {menuPos && activeMode === 'none' && (
        <div className="absolute z-[4000] p-2 md:p-4 bg-zinc-950/98 rounded-[24px] md:rounded-[40px] shadow-2xl flex flex-wrap gap-1 pointer-events-auto max-w-[280px] md:max-w-[400px] animate-pop border border-white/20" style={{ top: Math.min(menuPos.y, window.innerHeight - (isMobile ? 240 : 340)), left: Math.min(menuPos.x, window.innerWidth - (isMobile ? 280 : 400)) }}>
          <MenuButton icon={<LucideType className="w-5 h-5 md:w-6 md:h-6" />} label="Signal" onClick={() => handleAction('text')} isMobile={isMobile} />
          <MenuButton icon={<LucidePencil className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />} label="Draw" onClick={() => handleAction('drawing')} isMobile={isMobile} />
          <MenuButton icon={<LucideSendHorizontal className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />} label="Relay P2P" onClick={() => handleAction('file')} isMobile={isMobile} />
          <MenuButton icon={<LucideEraser className="w-5 h-5 md:w-6 md:h-6 text-rose-500" />} label="Eraser" onClick={() => handleAction('eraser')} isMobile={isMobile} />
          <MenuButton icon={<LucideMic className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />} label="Voice" onClick={() => handleAction('voice')} isMobile={isMobile} />
          <MenuButton icon={<LucideImage className="w-5 h-5 md:w-6 md:h-6 text-sky-400" />} label="Image" onClick={() => handleAction('image')} isMobile={isMobile} />
          <MenuButton icon={<LucidePieChart className="w-5 h-5 md:w-6 md:h-6 text-violet-400" />} label="Poll" onClick={() => handleAction('poll')} isMobile={isMobile} />
        </div>
      )}

      {textInputPos && (
        <div className="absolute z-[4500] p-4" style={{ left: Math.max(20, Math.min(textInputPos.x, window.innerWidth - 340)), top: Math.max(20, Math.min(textInputPos.y, window.innerHeight - 200)) }}>
          <textarea ref={textInputRef} value={tempText} onChange={e => setTempText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitInlineText(); } }} className="bg-zinc-950 text-white p-5 md:p-7 rounded-[24px] md:rounded-[40px] border-2 border-indigo-500 shadow-2xl outline-none text-lg md:text-2xl font-black min-w-[280px] md:min-w-[320px] max-w-[90vw]" placeholder="Type Broadcast..." />
        </div>
      )}

      {isRecording && (
        <div className="fixed inset-0 bg-black/98 z-[5000] flex items-center justify-center p-6">
          <div className="bg-zinc-950 p-8 md:p-16 rounded-[40px] md:rounded-[70px] flex flex-col items-center gap-6 md:gap-10 border border-white/10 w-full max-lg">
            <LucideMic className="w-16 h-16 text-indigo-500 animate-pulse" />
            <canvas ref={waveformCanvasRef} width="400" height="100" className="w-full h-16 opacity-70" />
            <button onClick={() => mediaRecorderRef.current?.stop()} className="w-full py-5 bg-rose-600 rounded-2xl text-[10px] font-black uppercase text-white shadow-2xl hover:bg-rose-500 transition-colors">TERMINATE SIGNAL</button>
          </div>
        </div>
      )}

      {Object.entries(cursors).map(([id, cursorValue]) => {
        const c = cursorValue as CursorState;
        return (
          <div key={id} className="absolute pointer-events-none z-[5000]" style={{ left: c.x, top: c.y }}>
            <LucideMousePointer2 className="w-4 h-4 md:w-6 md:h-6" style={{ color: c.color, fill: c.color }} />
            {!isMobile && <div className="ml-5 px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black text-white bg-black/80 shadow-2xl">{c.name}</div>}
          </div>
        );
      })}
    </div>
  );
};

const DoodlePath: React.FC<{ points: number[][], color: string, size: number, isLocal?: boolean, isNeon?: boolean }> = ({ points, color, size, isLocal, isNeon }) => {
  const stroke = getStroke(points, { size, thinning: 0.5, smoothing: 0.5 });
  if (!stroke.length) return null;
  const pathData = stroke.reduce((acc, [x, y], i, arr) => {
    if (i === 0) acc.push(`M ${x} ${y}`); else acc.push(`L ${x} ${y}`);
    if (i === arr.length - 1) acc.push('Z');
    return acc;
  }, [] as string[]).join(' ');
  return <path d={pathData} fill={color} className={isLocal ? 'opacity-40' : 'opacity-100'} style={{ filter: isNeon ? `drop-shadow(0 0 15px ${color})` : 'none' }} />;
};

const DraggableElement: React.FC<{ element: SpatialElement, onDelete: (id: string) => void, onResize: (id: string, w: number) => void, yDoc: Y.Doc, isDarkMode: boolean, isMobile: boolean }> = ({ element, onDelete, onResize, yDoc, isDarkMode, isMobile }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [resizing, setResizing] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (element.isEphemeral) {
      const remaining = Math.max(0, 5000 - (Date.now() - element.timestamp));
      const fadeStartTime = Math.max(0, remaining - 1200); 
      const timer = setTimeout(() => setIsFading(true), fadeStartTime);
      return () => clearTimeout(timer);
    }
  }, [element.isEphemeral, element.timestamp]);

  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startW = element.metadata?.width || (isMobile ? 180 : 200);
    const move = (ev: MouseEvent) => onResize(element.id, Math.max(120, startW + (ev.clientX - startX)));
    const up = () => { setResizing(false); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  const textStyles = {
    color: element.color === 'rainbow' ? `hsl(${Date.now() / 15 % 360}, 85%, 70%)` : (element.color || (isDarkMode ? '#ffffff' : '#000000')),
    textShadow: element.metadata?.isNeon ? `0 0 30px ${element.color || '#ffffff'}` : 'none'
  };

  return (
    <Draggable nodeRef={nodeRef} position={{ x: element.x, y: element.y }} disabled={resizing} onStop={(e, data) => {
       const yElements = yDoc.getMap('elements');
       const item = yElements.get(element.id) as any;
       if (item) yElements.set(element.id, { ...item, x: data.x, y: data.y });
    }} handle=".drag-handle">
      <div ref={nodeRef} className={`absolute z-20 group transition-all duration-[1200ms] ${isFading ? 'opacity-0 scale-75 blur-lg translate-y-[-40px]' : 'opacity-100 scale-100'}`}>
        <div className={`relative p-5 md:p-8 rounded-[32px] md:rounded-[48px] shadow-3xl border-2 border-white/5 ${isDarkMode ? 'bg-zinc-950/95' : 'bg-white/95'} backdrop-blur-xl`}>
          <div className="absolute -top-10 left-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all bg-black/90 p-1.5 rounded-lg z-50 border border-white/10">
             <div className="drag-handle cursor-grab active:cursor-grabbing p-1.5 text-zinc-500 hover:text-indigo-400 transition-colors"><LucideGripVertical className="w-4 h-4 md:w-5 md:h-5" /></div>
             <button onClick={() => onDelete(element.id)} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"><LucideTrash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
          </div>
          <div onMouseDown={handleResize} className="absolute bottom-5 right-5 md:bottom-8 md:right-8 p-2 md:p-3 cursor-se-resize opacity-0 group-hover:opacity-60 text-zinc-500 transition-opacity"><LucideMaximize className="w-5 h-5 md:w-6 md:h-6 rotate-90" /></div>

          {element.type === 'text' && <div style={{ width: element.metadata?.width || 'auto' }} className="min-w-[80px] md:min-w-[100px]"><p className={`text-2xl md:text-4xl font-black break-words leading-tight`} style={textStyles}>{element.content}</p></div>}
          {element.type === 'image' && <img src={element.content} style={{ width: element.metadata?.width || (isMobile ? 240 : 340) }} className="rounded-2xl md:rounded-[36px] shadow-2xl border border-white/5" alt="Spatial Node" />}
          {element.type === 'file' && <div style={{ width: element.metadata?.width || (isMobile ? 220 : 320) }} className="flex flex-col gap-4 md:gap-6"><div className="flex items-center gap-4 md:gap-6 p-2 bg-emerald-500/5 rounded-2xl"><LucideFileText className="w-10 h-10 md:w-12 md:h-12 text-emerald-500" /><div className="flex flex-col overflow-hidden"><span className="font-black text-base md:text-lg truncate text-white">{element.metadata?.fileName}</span><span className="text-[8px] md:text-[10px] font-black uppercase text-emerald-500/50">Mesh Relay Blob</span></div></div><a href={element.content} download={element.metadata?.fileName} className="w-full py-4 md:py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl md:rounded-[32px] flex items-center justify-center gap-4 text-[10px] md:text-[12px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95">Retrieve P2P Blob</a></div>}
          {element.type === 'voice' && <div className="flex items-center gap-4 md:gap-8 min-w-[240px] md:min-w-[300px] p-2 bg-indigo-500/5 rounded-[24px] md:rounded-3xl"><button onClick={() => { if(audioRef.current){ isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); } }} className="w-14 h-14 md:w-18 md:h-18 shrink-0 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-3xl transition-all active:scale-90"><LucidePlay className="w-6 h-6 md:w-8 md:h-8 ml-1" /></button><audio ref={audioRef} src={element.content} onEnded={() => setIsPlaying(false)} className="hidden" /><div className="flex flex-col overflow-hidden"><span className="text-[8px] md:text-[10px] font-black uppercase opacity-30 tracking-[0.2em]">P2P Signal</span><span className="font-black text-indigo-400 text-base md:text-xl truncate">{element.author}</span></div></div>}
          {element.type === 'poll' && <div style={{ width: element.metadata?.width || (isMobile ? 280 : 360) }} className="space-y-4 md:space-y-6"><h4 className="font-black text-lg md:text-2xl tracking-tight text-white">{element.content}</h4><div className="space-y-3 md:space-y-4">{(element.metadata?.pollOptions || []).map((o, i) => {
            const votes = Object.values(element.metadata?.votes || {});
            const count = votes.filter(v => v === i).length;
            const perc = votes.length > 0 ? (count / votes.length) * 100 : 0;
            return <button key={i} onClick={() => { const m = yDoc.getMap('elements'); const it = m.get(element.id) as any; const v = { ...(it.metadata.votes || {}) }; v[yDoc.clientID.toString()] = i; m.set(element.id, { ...it, metadata: { ...it.metadata, votes: v } }); }} className="w-full p-4 md:p-6 rounded-2xl md:rounded-[32px] bg-zinc-900/50 border-2 border-white/5 hover:border-indigo-500/50 relative overflow-hidden transition-all text-left active:scale-[0.98]"><div className="absolute inset-0 bg-indigo-600/30 transition-all duration-700 ease-out" style={{ width: `${perc}%` }} /><div className="relative flex justify-between items-center z-10"><span className="font-black text-sm md:text-white">{o}</span><div className="flex items-center gap-2 md:gap-3"><span className="text-[8px] md:text-[10px] font-black text-indigo-400">{Math.round(perc)}%</span><span className="text-[7px] md:text-[9px] font-black bg-black/60 px-1.5 py-0.5 rounded-md text-zinc-500">{count}</span></div></div></button>;
          })}</div><div className="text-[7px] md:text-[8px] font-black uppercase text-zinc-600 tracking-[0.3em] text-center pt-1 md:pt-2">Global Mesh Poll</div></div>}
        </div>
      </div>
    </Draggable>
  );
};

const MenuButton: React.FC<{ icon: any, label: string, onClick: () => void, isMobile: boolean }> = ({ icon, label, onClick, isMobile }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center ${isMobile ? 'p-3' : 'p-6'} hover:bg-white/10 rounded-[20px] md:rounded-[48px] ${isMobile ? 'min-w-[80px]' : 'min-w-[110px]'} group transition-all duration-300`}>
    <div className="text-zinc-600 group-hover:text-white group-hover:scale-125 transition-all duration-500">{icon}</div>
    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-3 md:mt-5 text-zinc-700 group-hover:text-zinc-400`}>{label}</span>
  </button>
);

const ModToggle: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string, isMobile: boolean }> = ({ active, onClick, icon, label, isMobile }) => (
  <button onClick={onClick} className={`flex items-center gap-3 md:gap-5 w-full ${isMobile ? 'px-4 py-3' : 'px-7 py-6'} rounded-xl md:rounded-[28px] transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-3xl scale-[1.05]' : 'bg-white/5 text-zinc-600 hover:bg-white/10'}`}>
    {icon} <span className={`text-[10px] md:text-[12px] font-black uppercase tracking-widest`}>{label}</span>
  </button>
);

export default Canvas;