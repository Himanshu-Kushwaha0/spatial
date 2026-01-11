
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_RESUME_DATA } from './constants';
import { ResumeData, ResumeTemplate, ResumeOrientation } from './types';
import ResumeEditor from './components/ResumeEditor';
import ResumePreview from './components/ResumePreview';
import AIAssistant from './components/AIAssistant';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  // Persistence Initialization
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('resume_ai_data');
    return saved ? JSON.parse(saved) : INITIAL_RESUME_DATA;
  });
  
  const [template, setTemplate] = useState<ResumeTemplate>(ResumeTemplate.CLASSIC);
  const [orientation, setOrientation] = useState<ResumeOrientation>(ResumeOrientation.PORTRAIT);
  const [showAI, setShowAI] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Auto-save logic
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      localStorage.setItem('resume_ai_data', JSON.stringify(resumeData));
      setSaveStatus('saved');
    }, 1000);
    return () => clearTimeout(timer);
  }, [resumeData]);

  const handlePrint = () => {
    window.print();
  };

  const handleApplyAI = (updates: Partial<ResumeData>) => {
    setResumeData(prev => ({ ...prev, ...updates }));
  };

  const handleImportResume = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    try {
      const parsedData = await geminiService.parseResume(importText);
      setResumeData(prev => ({
        ...prev,
        ...parsedData,
        contact: parsedData.contact ? { ...prev.contact, ...parsedData.contact } : prev.contact,
        experience: parsedData.experience ? (parsedData.experience as any) : prev.experience,
        education: parsedData.education ? (parsedData.education as any) : prev.education,
        skillCategories: parsedData.skillCategories ? (parsedData.skillCategories as any) : prev.skillCategories,
      }));
      setShowImport(false);
      setImportText('');
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        alert("API Project not found. If you are using a custom key, please ensure it belongs to a paid project with billing enabled.");
      } else {
        alert("Failed to parse resume. Please check your network connection.");
      }
    } finally {
      setIsImporting(false);
    }
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(resumeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-${resumeData.contact.fullName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between no-print sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl shadow-lg shadow-blue-200">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">ResumeAI</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {saveStatus === 'saved' ? 'Cloud Synced' : 'Syncing...'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 mr-4 border-r pr-4 border-slate-200">
             <button onClick={downloadJSON} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Backup Data">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
             </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg gap-1 no-print">
            <select
              className="bg-transparent border-none text-slate-700 text-xs font-bold rounded-md py-1.5 px-2 focus:ring-0 cursor-pointer"
              value={template}
              onChange={(e) => setTemplate(e.target.value as ResumeTemplate)}
            >
              {Object.values(ResumeTemplate).map(t => (
                <option key={t} value={t}>{t} Style</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAI(!showAI)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs transition-all ${showAI ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="hidden md:inline uppercase tracking-wider">AI Optimizer</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-all shadow-md active:scale-95 flex items-center gap-2 uppercase tracking-wider"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Editor (Left) */}
        <div className="w-full md:w-[400px] lg:w-[480px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col no-print z-20">
          <ResumeEditor data={resumeData} onChange={setResumeData} />
        </div>

        {/* Preview (Center) */}
        <div className="flex-1 bg-slate-100 overflow-auto p-4 md:p-12 flex justify-center items-start scroll-smooth print:bg-white print:p-0">
          <div className="max-w-full transform-gpu md:scale-100 scale-[0.6] origin-top transition-transform duration-500">
            <ResumePreview data={resumeData} template={template} orientation={orientation} />
          </div>
        </div>

        {/* AI Assistant (Right - Drawer on Mobile) */}
        <div className={`
          fixed inset-y-0 right-0 w-full sm:w-[380px] z-40 bg-white shadow-2xl transition-transform duration-300 ease-in-out no-print
          ${showAI ? 'translate-x-0' : 'translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex-shrink-0 lg:border-l lg:border-slate-200
          ${!showAI && 'lg:hidden'}
        `}>
           <div className="h-full flex flex-col relative">
              <button 
                onClick={() => setShowAI(false)} 
                className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 z-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <AIAssistant resumeData={resumeData} onApplyOptimizedData={handleApplyAI} />
           </div>
        </div>
      </main>

      {/* Persistence Floating Notify (Mobile Only) */}
      <div className="md:hidden fixed bottom-4 right-4 no-print pointer-events-none">
        <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-lg transition-opacity duration-500 ${saveStatus === 'saved' ? 'bg-green-500 opacity-80' : 'bg-amber-500 opacity-100'}`}>
           {saveStatus === 'saved' ? 'Auto-saved' : 'Saving...'}
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Import Engine</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Experimental v4.2</p>
              </div>
              <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-slate-900 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8">
              <textarea
                className="w-full h-72 p-5 border-2 border-slate-100 rounded-2xl focus:border-blue-500 bg-slate-50 text-sm font-sans text-slate-700 outline-none transition-all placeholder:text-slate-300"
                placeholder="Paste your current resume content here. We will structure everything automatically..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowImport(false)} className="px-6 py-3 text-slate-500 text-sm font-bold hover:bg-slate-50 rounded-xl transition">Discard</button>
                <button
                  disabled={isImporting || !importText.trim()}
                  onClick={handleImportResume}
                  className="px-8 py-3 rounded-xl font-black text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 uppercase tracking-widest"
                >
                  {isImporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Analyzing...
                    </>
                  ) : 'Inject with AI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
