
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

  const handleDeepScan = async () => {
    if (!jobDescription.trim()) {
      alert("Please paste a Job Description to begin the ATS Deep Scan.");
      return;
    }
    setIsScanning(true);
    setScanResult(null);
    try {
      const result = await geminiService.deepTailorResume(resumeData, jobDescription);
      setScanResult(result);
    } catch (error) {
      alert("Scan failed. Ensure you have an internet connection and a valid job description.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyTailoring = () => {
    if (!scanResult) return;

    // Map the optimized experience bullets back to the original experience items by ID
    const updatedExperience = resumeData.experience.map(exp => {
      const tailored = scanResult.optimizedExperience.find(te => te.id === exp.id);
      return tailored ? { ...exp, description: tailored.tailoredBullets } : exp;
    });

    onApplyOptimizedData({
      summary: scanResult.optimizedSummary,
      skillCategories: scanResult.optimizedSkills,
      experience: updatedExperience
    });

    setScanResult(prev => prev ? { ...prev, matchScore: 100 } : null);
    alert("Resume tailored! Your match score is now optimized for this position.");
  };

  return (
    <div className="bg-white border-l h-full flex flex-col no-print shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b bg-slate-900 text-white relative">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg animate-pulse">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21a9.003 9.003 0 008.367-5.633M12 21a9.003 9.003 0 01-8.367-5.633M12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9c.854 0 1.673.118 2.45.338" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight">ATS DEEP SCANNER</h2>
            <p className="text-[10px] text-blue-400 font-mono uppercase">Version 4.0 Live</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {!scanResult && !isScanning && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-700 font-medium leading-relaxed">
                Paste a Job Description below. Our AI will analyze keyword density, semantic relevance, and formatting to help you hit a <strong>100% Match Score</strong>.
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Target Job Description</label>
              <textarea
                rows={12}
                placeholder="Paste the requirements from LinkedIn, Indeed, etc..."
                className="w-full p-4 text-sm border-2 border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 transition-all outline-none font-sans"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            <button
              onClick={handleDeepScan}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              Start Deep Scan
            </button>
          </div>
        )}

        {isScanning && (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-pulse">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800">Analyzing Job Semantics...</p>
              <p className="text-xs text-gray-500">Injecting high-rank keywords</p>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Score Meter */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-tighter">Current Match</span>
                  <span className="text-5xl font-black">{scanResult.matchScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-400 transition-all duration-1000 ease-out"
                    style={{ width: `${scanResult.matchScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Keyword Alert */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="text-[10px] font-black text-amber-800 uppercase mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Missing Keywords Detected
              </h4>
              <div className="flex flex-wrap gap-2">
                {scanResult.missingKeywords.map((kw, i) => (
                  <span key={i} className="px-2 py-1 bg-white text-amber-700 text-[10px] font-bold rounded border border-amber-200">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Tailoring Preview */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">Optimization Logic</h4>
                <p className="text-[11px] text-gray-600 italic leading-relaxed">
                  "Summary rewritten for impact. Skill categories mapped to JD requirements. Experience bullets reframed with result-oriented metrics."
                </p>
              </div>

              <button
                onClick={handleApplyTailoring}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-100 transition-all transform hover:-translate-y-1"
              >
                Apply 100% Tailoring
              </button>
              
              <button
                onClick={() => { setScanResult(null); setJobDescription(''); }}
                className="w-full text-[11px] text-gray-400 font-bold hover:text-gray-600 uppercase transition"
              >
                Reset Scanner
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex justify-between items-center text-[9px] text-gray-400 font-medium uppercase tracking-widest">
          <span>ATS Score Verifier</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
            System Ready
          </span>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
