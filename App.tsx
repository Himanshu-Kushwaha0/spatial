
import React, { useState, useEffect } from 'react';
import { INITIAL_RESUME_DATA } from './constants';
import { ResumeData, ResumeTemplate, ResumeOrientation } from './types';
import ResumeEditor from './components/ResumeEditor';
import ResumePreview from './components/ResumePreview';
import AIAssistant from './components/AIAssistant';

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('resume_ai_data_v7');
    return saved ? JSON.parse(saved) : INITIAL_RESUME_DATA;
  });
  
  const [template, setTemplate] = useState<ResumeTemplate>(ResumeTemplate.CLASSIC);
  const [orientation, setOrientation] = useState<ResumeOrientation>(ResumeOrientation.PORTRAIT);
  const [showAI, setShowAI] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...'>('Saved');

  useEffect(() => {
    setSaveStatus('Saving...');
    const timer = setTimeout(() => {
      localStorage.setItem('resume_ai_data_v7', JSON.stringify(resumeData));
      setSaveStatus('Saved');
    }, 800);
    return () => clearTimeout(timer);
  }, [resumeData]);

  const handlePrint = () => window.print();

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(resumeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume-${resumeData.contact.fullName.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportTEX = () => {
    const blob = new Blob([resumeData.latexCode || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume.tex`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportHTML = () => {
    const previewEl = document.getElementById('resume-document');
    if (!previewEl) return;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${resumeData.contact.fullName} - Resume</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=PT+Serif:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body { background: #f1f5f9; margin: 0; padding: 40px 0; display: flex; justify-content: center; }
    #resume-document { background: white; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); border-radius: 4px; }
    @media print {
      body { background: white; padding: 0; }
      #resume-document { box-shadow: none; border-radius: 0; margin: 0; width: 100% !important; }
    }
    ${resumeData.customCSS}
  </style>
</head>
<body>
  ${previewEl.outerHTML}
  <script>
    // Self-executing print on open
    setTimeout(() => {
      console.log("Ready for printing");
    }, 500);
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume-web.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30 overflow-hidden">
      <nav className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between no-print shrink-0 shadow-2xl z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-[0_0_25px_rgba(37,99,235,0.4)]">R</div>
            <div>
              <h1 className="text-sm font-black tracking-tighter uppercase text-white leading-none">ResumeAI <span className="text-blue-500">Pro</span></h1>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none mt-1 block transition-colors ${saveStatus === 'Saving...' ? 'text-yellow-500' : 'text-slate-600'}`}>
                {saveStatus}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {Object.values(ResumeTemplate).map(t => (
              <button 
                key={t}
                onClick={() => setTemplate(t)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${template === t ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-slate-800 pr-6">
             <button onClick={exportJSON} className="text-[10px] font-black uppercase text-slate-500 hover:text-blue-400 py-2 px-3 hover:bg-slate-900 rounded-lg transition-all">JSON</button>
             <button onClick={exportTEX} className="text-[10px] font-black uppercase text-slate-500 hover:text-blue-400 py-2 px-3 hover:bg-slate-900 rounded-lg transition-all">Export TEX</button>
             <button onClick={exportHTML} className="text-[10px] font-black uppercase text-slate-500 hover:text-emerald-400 py-2 px-3 hover:bg-slate-900 rounded-lg transition-all">Web HTML</button>
          </div>
          
          <button
            onClick={() => setShowAI(!showAI)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showAI ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'}`}
          >
            {showAI ? 'Close AI Engine' : 'AI Assistant'}
          </button>
          
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-white text-slate-950 rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            Download PDF
          </button>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden print:block print:overflow-visible print:h-auto bg-[#0f172a]">
        <div className="w-[450px] shrink-0 border-r border-slate-800 no-print shadow-2xl z-10">
          <ResumeEditor data={resumeData} onChange={setResumeData} />
        </div>

        <div className="flex-1 bg-[#111827]/50 overflow-auto p-12 print:p-0 print:bg-white print:overflow-visible scrollbar-thin scrollbar-thumb-slate-800">
          <div className="print:scale-100 origin-top flex justify-center pb-24">
             <ResumePreview data={resumeData} template={template} orientation={orientation} />
          </div>
        </div>

        {showAI && (
          <div className="w-[380px] shrink-0 border-l border-slate-800 no-print animate-in slide-in-from-right duration-300 shadow-2xl">
            <AIAssistant resumeData={resumeData} onApplyOptimizedData={(u) => setResumeData(p => ({...p, ...u}))} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
