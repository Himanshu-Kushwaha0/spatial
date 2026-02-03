
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { ResumeData, TailoredResumeResponse } from '../types';

interface AIAssistantProps {
  resumeData: ResumeData;
  onApplyOptimizedData: (updates: Partial<ResumeData>) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ resumeData, onApplyOptimizedData }) => {
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
      const result = await geminiService.deepTailorResume(resumeData, jobDescription);
      setScanResult(result);
    } catch (err: any) {
      console.error(err);
      setError("AI Analysis failed. Please check your API key or JD format.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800 overflow-hidden no-print">
      <div className="p-5 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-xs font-black text-white uppercase tracking-widest">Neural ATS Optimizer</h2>
        <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-1">powered by gemini-3-pro</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {!scanResult && !isScanning && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Target Job Description</h3>
               <textarea
                  className="w-full h-48 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 focus:border-blue-500 outline-none leading-relaxed"
                  placeholder="Paste the job requirements here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
               />
            </div>
            {error && <p className="text-[10px] text-red-400 font-bold bg-red-400/10 p-2 rounded">{error}</p>}
            <button
              onClick={handleDeepScan}
              disabled={!jobDescription.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-black uppercase tracking-widest transition-all"
            >
              Start Analysis
            </button>
          </div>
        )}

        {isScanning && (
          <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing Semantics...</p>
          </div>
        )}

        {scanResult && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center">
                <div className="text-4xl font-black text-blue-400">
                   {scanResult.matchScore}%
                </div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">ATS Compatibility Score</p>
             </div>

             <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Missing Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                   {scanResult.missingKeywords.map((kw, i) => (
                      <span key={i} className="px-2 py-1 bg-red-400/10 text-red-400 rounded-md text-[9px] font-bold border border-red-400/20">
                         {kw}
                      </span>
                   ))}
                </div>
             </div>

             <button
               onClick={() => {
                  const updatedExperience = resumeData.experience.map(exp => {
                    const tailored = scanResult.optimizedExperience.find(te => te.id === exp.id);
                    return tailored ? { ...exp, description: tailored.tailoredBullets } : exp;
                  });
                  onApplyOptimizedData({
                    summary: scanResult.optimizedSummary,
                    skillCategories: scanResult.optimizedSkills,
                    experience: updatedExperience
                  });
                }}
               className="w-full py-3 bg-white text-slate-950 hover:bg-blue-500 hover:text-white rounded-xl font-black uppercase tracking-widest transition-all"
             >
                Apply Optimization
             </button>

             <button onClick={() => setScanResult(null)} className="w-full text-[10px] font-black text-slate-500 uppercase hover:text-white transition-colors">
                Back to Input
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
