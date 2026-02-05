
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { ResumeData, TailoredResumeResponse } from '../types';

interface AIAssistantProps {
  resumeData: ResumeData;
  onApplyOptimizedData: (updates: Partial<ResumeData>) => void;
  onPreviewOptimization: (optimized: TailoredResumeResponse | null) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ resumeData, onApplyOptimizedData, onPreviewOptimization }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<TailoredResumeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeepScan = async () => {
    if (!jobDescription.trim()) return;
    setIsScanning(true);
    setScanResult(null);
    setError(null);
    
    try {
      // Consistently using Gemini Pro for high-quality tailoring
      const result = await geminiService.deepTailorResume(resumeData, jobDescription);
      setScanResult(result);
      onPreviewOptimization(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "AI Engine encountered an issue. Please verify your connection.");
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

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800 overflow-hidden no-print">
      <div className="p-5 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          Gemini Pro Tailoring
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {!scanResult && !isScanning && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-xl">
               <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                 Paste the target job description below. Our Gemini Pro engine will analyze it to optimize your keywords, summary, and experience for maximum ATS compatibility.
               </p>
            </div>
            
            <label className={labelClasses}>Job Description</label>
            <textarea
              className="w-full h-64 bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 focus:border-blue-500 outline-none resize-none transition-all placeholder:text-slate-700 shadow-inner"
              placeholder="E.g. We are looking for a DevOps Engineer with 3+ years experience in AWS, Kubernetes, and Terraform..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-[10px] font-bold leading-relaxed">
                {error}
              </div>
            )}
            <button
              onClick={handleDeepScan}
              disabled={!jobDescription.trim()}
              className="w-full py-4 bg-blue-600 text-white hover:bg-blue-500 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <span className="relative z-10 font-black">Analyze & Tailor</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        )}

        {isScanning && (
          <div className="py-20 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-600/20 rounded-full animate-ping"></div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-1">Processing Analysis</p>
              <p className="text-[9px] text-slate-500 font-medium">Gemini Pro is rewriting experience bullets...</p>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
               <div className="text-6xl font-black text-white tracking-tighter mb-2">{scanResult.matchScore}%</div>
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">ATS Match Score</p>
            </div>

            <div className="space-y-4">
              <h3 className={labelClasses}>Missing Keywords Detected</h3>
              <div className="flex flex-wrap gap-2">
                {scanResult.missingKeywords.map((word, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-800 border border-slate-700 text-[9px] text-slate-300 font-bold rounded uppercase">
                    {word}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-900">
              <button
                onClick={() => { setScanResult(null); onPreviewOptimization(null); }}
                className="py-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
              >
                Discard
              </button>
              <button
                onClick={applyChanges}
                className="py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl"
              >
                Apply Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
