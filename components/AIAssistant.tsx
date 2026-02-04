
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { ResumeData, TailoredResumeResponse } from '../types';

interface AIAssistantProps {
  resumeData: ResumeData;
  onApplyOptimizedData: (updates: Partial<ResumeData>) => void;
  onPreviewOptimization: (optimized: TailoredResumeResponse | null) => void;
}

type AIProvider = 'gemini' | 'openai' | 'claude' | 'perplexity' | 'copilot';

const AIAssistant: React.FC<AIAssistantProps> = ({ resumeData, onApplyOptimizedData, onPreviewOptimization }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<TailoredResumeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<AIProvider>('gemini');
  const [manualKeys, setManualKeys] = useState<Record<string, string>>({});
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      const win = window as any;
      if (win.aistudio) {
        const has = await win.aistudio.hasSelectedApiKey();
        setHasGeminiKey(has);
      }
    };
    checkKey();
  }, []);

  const handleGeminiKey = async () => {
    const win = window as any;
    if (win.aistudio) {
      await win.aistudio.openSelectKey();
      setHasGeminiKey(true);
    }
  };

  const handleManualKeyChange = (provider: string, val: string) => {
    setManualKeys(prev => ({ ...prev, [provider]: val }));
  };

  const handleDeepScan = async () => {
    if (!jobDescription.trim()) return;
    setIsScanning(true);
    setScanResult(null);
    setError(null);
    
    try {
      const result = await geminiService.deepTailorResume(resumeData, jobDescription);
      setScanResult(result);
      onPreviewOptimization(result);
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("Requested entity was not found")) {
        setHasGeminiKey(false);
        setError("Gemini session invalid. Please reconnect your key.");
      } else {
        setError("Tailoring engine failed. Ensure your API connection is valid.");
      }
    } finally {
      setIsScanning(false);
    }
  }

  const applyChanges = () => {
    if (!scanResult) return;
    const updatedExperience = resumeData.experience.map(exp => {
      const tailored = scanResult.optimizedExperience.find(te => te.id === exp.id);
      return tailored ? { ...exp, description: tailored.tailoredBullets } : exp;
    });
    onApplyOptimizedData({
      summary: scanResult.optimizedSummary,
      skillCategories: scanResult.optimizedSkills,
      experience: updatedExperience
    });
    setScanResult(null);
    onPreviewOptimization(null);
  };

  const labelClasses = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2";
  const providers: { id: AIProvider; name: string }[] = [
    { id: 'gemini', name: 'Gemini' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'claude', name: 'Claude' },
    { id: 'perplexity', name: 'Perplexity' },
    { id: 'copilot', name: 'Copilot' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800 overflow-hidden no-print">
      <div className="p-5 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-xs font-black text-white uppercase tracking-widest">Intelligence Hub</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="space-y-4">
          <label className={labelClasses}>Select Engine</label>
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveProvider(p.id)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-md border transition-all ${
                  activeProvider === p.id 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
            {activeProvider === 'gemini' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-slate-400">Google Cloud API</p>
                  <div className={`w-2 h-2 rounded-full ${hasGeminiKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                </div>
                <button
                  onClick={handleGeminiKey}
                  className="w-full py-2 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase rounded-lg"
                >
                  {hasGeminiKey ? 'Update Key' : 'Connect Account'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase">Paste {activeProvider} API Key</label>
                <input 
                  type="password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:border-blue-500 outline-none"
                  placeholder={`Paste ${activeProvider} key...`}
                  value={manualKeys[activeProvider] || ''}
                  onChange={(e) => handleManualKeyChange(activeProvider, e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {!scanResult && !isScanning && (
          <div className="space-y-4 pt-6 border-t border-slate-900">
            <label className={labelClasses}>Target Job Description</label>
            <textarea
              className="w-full h-40 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:border-blue-500 outline-none resize-none transition-all"
              placeholder="Paste job details here to analyze compatibility..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            {error && <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold">{error}</div>}
            <button
              onClick={handleDeepScan}
              disabled={!jobDescription.trim() || (activeProvider === 'gemini' && !hasGeminiKey)}
              className="w-full py-4 bg-white text-slate-950 hover:bg-blue-600 hover:text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-xl"
            >
              Analyze & Tailor
            </button>
          </div>
        )}

        {isScanning && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Running {activeProvider} Engine...</p>
          </div>
        )}

        {scanResult && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center">
               <div className="text-5xl font-black text-blue-400">{scanResult.matchScore}%</div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">ATS Match Score</p>
            </div>
            
            <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Overlay Mode Active</p>
              <p className="text-[9px] text-blue-300 leading-relaxed italic">Suggestions are highlighted in blue on the resume. Apply to finalize or discard to reset.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setScanResult(null); onPreviewOptimization(null); }}
                className="py-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white"
              >
                Discard
              </button>
              <button
                onClick={applyChanges}
                className="py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl"
              >
                Apply All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
