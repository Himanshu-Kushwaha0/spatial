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
  LucideDownload,
  LucideZap,
  LucideSparkles,
  LucideGhost,
  LucideSun,
  LucidePieChart,
  LucideGripVertical,
  LucideMaximize,
  LucideSendHorizontal,
  LucidePlus,
  LucideTrash,
  LucideSmile,
  LucideCopy,
  LucideCheck,
  LucideMessageSquare
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

const ERASER_THRESHOLD = 35;
const PALETTE = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ffffff', '#000000'];

const Canvas: React.FC<CanvasProps> = ({ elements, cursors, onAddElement, onUpdateElement, onCursorMove, onDeleteElement, yDoc, isDarkMode }) => {
  const [menuPos, setMenuPos] = useState<{ x: number, y: number } | null>(null);
  const [activeMode, setActiveMode] = useState<ToolMode>('none');
  const [brushSize, setBrushSize] = useState(12);
  const [brushColor, setBrushColor] = useState(PALETTE[0]);
  const [currentPath, setCurrentPath] = useState<number[][]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
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
        reader.onloadend = () => onAddElement({ id: 'voice-' + Math.random().toString(36).substring(7), type: 'voice', x, y, content: reader.result as string });
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
        if(audioContextRef.current) audioContextRef.current.close();
        setIsRecording(false);
        if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
      mediaRecorder.start();
      setIsRecording(true);
      drawWaveform();
    } catch (err) { alert("Mic required for P2P voice."); }
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
        const rect = {
          left: el.x,
          top: el.y,
          right: el.x + width,
          bottom: el.y + height
        };
        if (x >= rect.left - 10 && x <= rect.right + 10 && y >= rect.top - 10 && y <= rect.bottom + 10) {
          onDeleteElement(el.id);
        }
      }
    });
  }, [elements, onDeleteElement]);

  const handleMouseMove = (e: React.MouseEvent) => {
    onCursorMove(e.clientX, e.clientY);
    if (activeMode === 'drawing' && e.buttons === 1) {
      setCurrentPath(prev => [...prev, [e.clientX, e.clientY, 0.5]]);
    } else if (activeMode === 'eraser' && e.buttons === 1) {
      performErase(e.clientX, e.clientY);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.pointer-events-auto')) return;

    if (activeMode === 'text') { setTextInputPos({ x: e.clientX, y: e.clientY }); return; }
    if (activeMode === 'drawing') setCurrentPath([[e.clientX, e.clientY, 0.5]]);
    else if (activeMode === 'eraser') performErase(e.clientX, e.clientY);
    
    if (menuPos) setMenuPos(null);
    if (textInputPos) submitInlineText();
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

  const handleMouseUp = () => {
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
  };

  const handleAction = (type: ToolMode) => {
    if (type === 'file') {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = (ev: any) => {
        const file = ev.target.files[0];
        if (file && menuPos) {
          const reader = new FileReader();
          reader.onloadend = () => onAddElement({ 
            id: 'file-' + Math.random().toString(36).substring(7), 
            type: 'file', 
            x: menuPos.x, y: menuPos.y, 
            content: reader.result as string, 
            metadata: { fileName: file.name, fileSize: file.size, fileType: file.type } 
          });
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else if (type === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (ev: any) => {
        const file = ev.target.files[0];
        if (file && menuPos) {
          const reader = new FileReader();
          reader.onloadend = () => onAddElement({ 
            id: 'img-' + Math.random().toString(36).substring(7), 
            type: 'image', 
            x: menuPos.x, y: menuPos.y, 
            content: reader.result as string, 
            metadata: { fileName: file.name } 
          });
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else if (type === 'voice') {
      if (menuPos) startRecording(menuPos.x, menuPos.y);
    } else { setActiveMode(type); }
    if (type !== 'poll' && type !== 'emoji') setMenuPos(null);
  };

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${activeMode === 'eraser' ? 'cursor-cell' : activeMode === 'drawing' ? 'cursor-crosshair' : ''}`} onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onContextMenu={(e) => { e.preventDefault(); setMenuPos({ x: e.clientX, y: e.clientY }); }}>
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
        }} yDoc={yDoc} isDarkMode={isDarkMode} />
      ))}

      {activeMode === 'poll' && (
        <div className="fixed inset-0 bg-black/95 z-[5000] flex items-center justify-center backdrop-blur-2xl">
          <div className="bg-zinc-950 p-10 rounded-[48px] border-2 border-white/10 w-full max-w-2xl space-y-8 animate-pop shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[95vh]">
             <div className="flex items-center gap-6 text-violet-400">
               <LucidePieChart className="w-12 h-12" />
               <h2 className="text-4xl font-black tracking-tighter">Poll Configurator</h2>
             </div>
             
             <div className="space-y-6">
               <div>
                 <span className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-3 block">Signal Question</span>
                 <input 
                   autoFocus
                   value={pollDraft.question} 
                   onChange={e => setPollDraft({...pollDraft, question: e.target.value})}
                   className="w-full bg-zinc-900 border border-white/10 rounded-[28px] p-6 text-2xl font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-white"
                   placeholder="Type your question..."
                 />
               </div>

               <div>
                 <span className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-3 block">Nexus Options</span>
                 <div className="space-y-4">
                   {pollDraft.options.map((opt, i) => (
                     <div key={i} className="flex gap-3">
                       <input 
                         value={opt} 
                         onChange={e => {
                           const newOpts = [...pollDraft.options];
                           newOpts[i] = e.target.value;
                           setPollDraft({...pollDraft, options: newOpts});
                         }}
                         className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl p-5 font-bold text-base outline-none focus:border-indigo-500 transition-all text-white"
                         placeholder={`Choice ${i+1}`}
                       />
                       {pollDraft.options.length > 2 && (
                         <button onClick={() => {
                           const newOpts = pollDraft.options.filter((_, idx) => idx !== i);
                           setPollDraft({...pollDraft, options: newOpts});
                         }} className="p-5 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500/20 active:scale-90 transition-all"><LucideTrash className="w-5 h-5" /></button>
                       )}
                     </div>
                   ))}
                   {pollDraft.options.length < 5 && (
                     <button onClick={() => setPollDraft({...pollDraft, options: [...pollDraft.options, '']})} className="w-full py-5 border-2 border-dashed border-white/10 rounded-2xl text-[11px] font-black uppercase text-zinc-500 hover:border-indigo-500/40 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-3"><LucidePlus className="w-4 h-4" /> Expand Options</button>
                   )}
                 </div>
               </div>
             </div>

             <div className="flex gap-5 pt-8 border-t border-white/5">
                <button onClick={() => {
                  const finalOptions = pollDraft.options.filter(o => o.trim());
                  if(pollDraft.question.trim() && finalOptions.length >= 2) {
                     onAddElement({
                       id: 'poll-' + Math.random().toString(36).substring(7),
                       type: 'poll',
                       x: window.innerWidth / 2 - 170,
                       y: window.innerHeight / 2 - 160,
                       content: pollDraft.question.trim(),
                       metadata: { pollOptions: finalOptions, votes: {} }
                     });
                     setPollDraft({ question: '', options: ['Yes', 'No'] });
                     setActiveMode('none');
                  } else {
                    alert("Nexus Error: Provide a question and at least 2 distinct options.");
                  }
                }} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-6 rounded-[32px] font-black uppercase tracking-[0.3em] text-white shadow-2xl active:scale-95 transition-all text-sm">Deploy Signal Poll</button>
                <button onClick={() => setActiveMode('none')} className="px-12 bg-zinc-800 hover:bg-zinc-700 rounded-[32px] text-[11px] font-black uppercase text-zinc-400 active:scale-95 transition-all">Abort</button>
             </div>
          </div>
        </div>
      )}

      <Draggable nodeRef={modsBubbleRef}><div ref={modsBubbleRef} className="absolute bottom-10 left-10 z-[3000] pointer-events-auto">
        <button onClick={() => setIsModsOpen(!isModsOpen)} className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl border-2 border-white/20 active:scale-90 transition-all ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
          <LucideZap className={`w-7 h-7 ${isRainbowMode || isGhostMode || isNeonMode ? 'text-amber-400 animate-pulse' : 'text-indigo-500'}`} />
        </button>
        {isModsOpen && <div className={`absolute bottom-20 left-0 p-6 rounded-[32px] ${isDarkMode ? 'bg-zinc-950 shadow-2xl' : 'bg-white shadow-2xl'} border border-white/20 animate-pop w-64 space-y-4`}>
          <ModToggle active={isRainbowMode} onClick={() => setIsRainbowMode(!isRainbowMode)} icon={<LucideSparkles className="w-4 h-4"/>} label="Rainbow" />
          <ModToggle active={isGhostMode} onClick={() => setIsGhostMode(!isGhostMode)} icon={<LucideGhost className="w-4 h-4"/>} label="Ghost" />
          <ModToggle active={isNeonMode} onClick={() => setIsNeonMode(!isNeonMode)} icon={<LucideSun className="w-4 h-4"/>} label="Neon" />
          
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
            {['🔥','🚀','❤️','✨','💎','🌈','🛸','⚡️'].map(em => (
              <button 
                key={em} 
                onClick={() => { 
                  onAddElement({ 
                    id: 'em-'+Math.random().toString(36).substring(7), 
                    type:'text', 
                    x: window.innerWidth / 2 + (Math.random() - 0.5) * 500, 
                    y: window.innerHeight / 2 + (Math.random() - 0.5) * 500, 
                    content: em, 
                    isEphemeral: true,
                    metadata: { isNeon: true } 
                  }); 
                  setIsModsOpen(false); 
                }} 
                className="w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-2xl active:scale-90 transition-all shadow-sm"
              >
                {em}
              </button>
            ))}
          </div>
        </div>}
      </div></Draggable>

      {activeMode !== 'none' && !textInputPos && activeMode !== 'poll' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-auto z-[1000] animate-pop">
          <div className={`${isDarkMode ? 'bg-zinc-950 text-white border-indigo-500/30' : 'bg-white text-zinc-900 border-indigo-200'} rounded-full px-8 py-4 flex items-center gap-6 shadow-3xl border`}>
             {activeMode === 'drawing' && <div className="flex items-center gap-4">
               {PALETTE.map(c => <button key={c} onClick={() => setBrushColor(c)} className={`w-6 h-6 rounded-full border-2 ${brushColor === c ? 'border-indigo-500 scale-125' : 'border-transparent'}`} style={{ background: c }} />)}
               <input type="range" min="4" max="100" value={brushSize} onChange={e => setBrushSize(+e.target.value)} className="w-24 accent-indigo-500" />
             </div>}
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">{activeMode} Uplink</span>
             <button onClick={() => setActiveMode('none')} className="p-2.5 bg-rose-500 rounded-full text-white shadow-lg active:scale-90 transition-transform"><LucideX className="w-4 h-4"/></button>
          </div>
        </div>
      )}

      {menuPos && activeMode === 'none' && (
        <div className="absolute z-[4000] p-4 bg-zinc-950/98 rounded-[40px] shadow-2xl flex flex-wrap gap-1 pointer-events-auto max-w-[360px] animate-pop border border-white/20" style={{ top: menuPos.y, left: menuPos.x }}>
          <MenuButton icon={<LucideType className="w-6 h-6" />} label="Signal" onClick={() => handleAction('text')} />
          <MenuButton icon={<LucidePencil className="w-6 h-6 text-indigo-400" />} label="Draw" onClick={() => handleAction('drawing')} />
          <MenuButton icon={<LucideSendHorizontal className="w-6 h-6 text-emerald-400" />} label="Relay P2P" onClick={() => handleAction('file')} />
          <MenuButton icon={<LucideEraser className="w-6 h-6 text-rose-500" />} label="Eraser" onClick={() => handleAction('eraser')} />
          <MenuButton icon={<LucideMic className="w-6 h-6 text-amber-400" />} label="Voice" onClick={() => handleAction('voice')} />
          <MenuButton icon={<LucideImage className="w-6 h-6 text-sky-400" />} label="Image" onClick={() => handleAction('image')} />
          <MenuButton icon={<LucidePieChart className="w-6 h-6 text-violet-400" />} label="Nexus" onClick={() => handleAction('poll')} />
        </div>
      )}

      {textInputPos && (
        <div className="absolute z-[4500]" style={{ left: textInputPos.x, top: textInputPos.y }}>
          <textarea ref={textInputRef} value={tempText} onChange={e => setTempText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitInlineText(); } }} className="bg-zinc-950 text-white p-7 rounded-[40px] border-2 border-indigo-500 shadow-2xl outline-none text-2xl font-black min-w-[320px] placeholder:text-zinc-900" placeholder="Type Signal..." />
        </div>
      )}

      {isRecording && <div className="fixed inset-0 bg-black/98 z-[5000] flex items-center justify-center animate-fade"><div className="bg-zinc-950 p-16 rounded-[70px] flex flex-col items-center gap-10 border border-white/10 shadow-3xl"><LucideMic className="w-20 h-20 text-indigo-500 animate-pulse" /><canvas ref={waveformCanvasRef} width="400" height="100" className="w-full h-24 opacity-70" /><button onClick={() => mediaRecorderRef.current?.stop()} className="px-14 py-6 bg-rose-600 rounded-[30px] text-[12px] font-black uppercase tracking-[0.3em] text-white active:scale-95 shadow-2xl transition-all">TERMINATE UPLINK</button></div></div>}

      {Object.entries(cursors).map(([id, cursorValue]) => {
        const c = cursorValue as CursorState;
        return (
          <div key={id} className="absolute pointer-events-none z-[5000]" style={{ left: c.x, top: c.y }}>
            <LucideMousePointer2 className="w-6 h-6" style={{ color: c.color, fill: c.color }} />
            <div className="ml-5 px-4 py-1.5 rounded-full text-[10px] font-black text-white whitespace-nowrap shadow-2xl" style={{ background: c.color }}>{c.name}</div>
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

const DraggableElement: React.FC<{ element: SpatialElement, onDelete: (id: string) => void, onResize: (id: string, w: number) => void, yDoc: Y.Doc, isDarkMode: boolean }> = ({ element, onDelete, onResize, yDoc, isDarkMode }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [resizing, setResizing] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (element.isEphemeral) {
      // Trigger visual fade-out slightly before deletion
      const timer = setTimeout(() => setIsFading(true), 4200);
      return () => clearTimeout(timer);
    }
  }, [element.isEphemeral]);

  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startW = element.metadata?.width || 200;
    const move = (ev: MouseEvent) => onResize(element.id, Math.max(140, startW + (ev.clientX - startX)));
    const up = () => { setResizing(false); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(element.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy signal:', err);
    }
  };

  const textStyles = {
    color: element.color === 'rainbow' 
      ? `hsl(${Date.now() / 15 % 360}, 85%, 70%)` 
      : (element.color || (isDarkMode ? '#ffffff' : '#000000')),
    textShadow: element.metadata?.isNeon 
      ? `0 0 30px ${element.color || '#ffffff'}` 
      : (isDarkMode ? '0 2px 10px rgba(0,0,0,0.5)' : 'none')
  };

  const containerBgClass = element.type === 'text' 
    ? (isDarkMode ? 'bg-zinc-950/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl')
    : (isDarkMode ? 'bg-zinc-950' : 'bg-white');

  return (
    <Draggable nodeRef={nodeRef} position={{ x: element.x, y: element.y }} disabled={resizing} onStop={(e, data) => {
       const yElements = yDoc.getMap('elements');
       const item = yElements.get(element.id) as any;
       if (item) yElements.set(element.id, { ...item, x: data.x, y: data.y });
    }} handle=".drag-handle">
      <div ref={nodeRef} className={`absolute z-20 group transition-all duration-[5000ms] ease-out ${isFading ? 'opacity-0 scale-90 translate-y-[-20px]' : 'opacity-100 scale-100'}`}>
        <div className={`relative p-8 rounded-[48px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border-2 border-white/5 transition-all ${containerBgClass}`}>
          <div className="absolute -top-12 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all bg-black/98 p-3 rounded-2xl shadow-3xl z-50 border border-white/10 scale-90 group-hover:scale-100">
             <div className="drag-handle cursor-grab active:cursor-grabbing p-2 text-zinc-500 hover:text-indigo-400"><LucideGripVertical className="w-5 h-5" /></div>
             {element.type === 'text' && (
               <button onClick={copyToClipboard} className={`p-2 transition-all rounded-xl ${copied ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-indigo-400 hover:bg-white/10'}`}>
                 {copied ? <LucideCheck className="w-5 h-5" /> : <LucideCopy className="w-5 h-5" />}
               </button>
             )}
             <button onClick={() => onDelete(element.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><LucideTrash2 className="w-5 h-5" /></button>
          </div>
          <div onMouseDown={handleResize} className="absolute bottom-8 right-8 p-3 cursor-se-resize opacity-0 group-hover:opacity-60 text-zinc-500 transition-opacity"><LucideMaximize className="w-6 h-6 rotate-90" /></div>

          {element.type === 'text' && <div style={{ width: element.metadata?.width || 'auto' }} className="min-w-[100px]">
            <p className="text-4xl font-black break-words leading-tight" style={textStyles}>{element.content}</p>
            {element.isEphemeral && (
               <div className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 opacity-60 flex items-center gap-2">
                 <LucideMessageSquare className="w-3 h-3" /> Pop Node • {element.author}
               </div>
            )}
          </div>}

          {element.type === 'image' && <img src={element.content} style={{ width: element.metadata?.width || 340 }} className="rounded-[36px] max-h-[750px] object-contain shadow-2xl" alt="Spatial Node" />}

          {element.type === 'file' && <div style={{ width: element.metadata?.width || 320 }} className="flex flex-col gap-8 p-2">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 shadow-inner"><LucideFileText className="w-8 h-8" /></div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-black text-lg truncate pr-8">{element.metadata?.fileName}</span>
                <span className="text-[11px] font-black opacity-40 uppercase tracking-[0.3em]">{(element.metadata?.fileSize! / 1024 / 1024).toFixed(2)} MB Relay</span>
              </div>
            </div>
            <a href={element.content} download={element.metadata?.fileName} className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[32px] flex items-center justify-center gap-4 text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95"><LucideDownload className="w-5 h-5" /> Mesh Download</a>
          </div>}

          {element.type === 'voice' && <div className="flex items-center gap-8 min-w-[300px] p-2">
            <button onClick={() => { if(audioRef.current){ isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); } }} className="w-18 h-18 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-90"><LucidePlay className="w-8 h-8 ml-2" /></button>
            <audio ref={audioRef} src={element.content} onEnded={() => setIsPlaying(false)} className="hidden" />
            <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">P2P Signal</span><span className="font-black text-indigo-400 text-xl">{element.author}</span></div>
          </div>}

          {element.type === 'poll' && <div style={{ width: element.metadata?.width || 360 }} className="p-4 space-y-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-5">
               <LucidePieChart className="w-7 h-7 text-violet-500" />
               <h4 className={`font-black text-2xl leading-tight tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{element.content}</h4>
            </div>
            <div className="space-y-4">
              {(element.metadata?.pollOptions || ['Yes', 'No']).map((o, i) => {
                const totalVotes = Object.keys(element.metadata?.votes || {}).length;
                const optionVotes = Object.values(element.metadata?.votes || {}).filter(v => v === i).length;
                const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                
                return (
                  <button key={i} onClick={() => {
                    const yElements = yDoc.getMap('elements');
                    const item = yElements.get(element.id) as any;
                    const votes = { ...(item.metadata.votes || {}) };
                    votes[yDoc.clientID.toString()] = i;
                    yElements.set(element.id, { ...item, metadata: { ...item.metadata, votes } });
                  }} className="w-full p-6 rounded-[32px] bg-zinc-900 border-2 border-white/5 hover:border-indigo-500/50 hover:bg-zinc-800 text-left relative overflow-hidden transition-all group/opt active:scale-[0.97]">
                    <div className="absolute inset-0 bg-indigo-600/30 transition-all duration-1000 ease-out shadow-inner" style={{ width: `${percentage}%` }} />
                    <div className="relative flex justify-between items-center z-10">
                      <span className={`font-black text-base tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-100'}`}>{o}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black bg-black/80 text-white px-3 py-1.5 rounded-xl border border-white/10">{optionVotes}</span>
                        <span className="text-[10px] font-black text-indigo-400 tracking-widest">{Math.round(percentage)}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-4 opacity-40">
              <span className="text-[9px] font-black uppercase tracking-[0.4em]">{Object.keys(element.metadata?.votes || {}).length} Voted Nodes</span>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400">P2P Nexus</span>
            </div>
          </div>}
        </div>
      </div>
    </Draggable>
  );
};

const MenuButton: React.FC<{ icon: any, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center p-6 hover:bg-white/10 rounded-[48px] min-w-[110px] group transition-all duration-300">
    <div className="text-zinc-600 group-hover:text-white group-hover:scale-125 transition-all duration-500 ease-spring">{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-5 text-zinc-700 group-hover:text-zinc-400 transition-colors">{label}</span>
  </button>
);

const ModToggle: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-5 w-full px-7 py-6 rounded-[28px] transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-3xl scale-[1.05]' : 'bg-white/5 text-zinc-600 hover:bg-white/10'}`}>
    {icon} <span className="text-[12px] font-black uppercase tracking-[0.3em]">{label}</span>
  </button>
);

export default Canvas;