
import React, { useState } from 'react';
import { INITIAL_RESUME_DATA } from './constants';
import { ResumeData, ResumeTemplate, ResumeOrientation } from './types';
import ResumeEditor from './components/ResumeEditor';
import ResumePreview from './components/ResumePreview';
import AIAssistant from './components/AIAssistant';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME_DATA);
  const [template, setTemplate] = useState<ResumeTemplate>(ResumeTemplate.CLASSIC);
  const [orientation, setOrientation] = useState<ResumeOrientation>(ResumeOrientation.PORTRAIT);
  const [showAI, setShowAI] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

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
    } catch (error) {
      alert("Failed to parse resume. Please check your connection or try again.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gray-100 ${orientation === ResumeOrientation.LANDSCAPE ? 'landscape-layout' : ''}`}>
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between no-print sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:inline">ResumeAI</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setShowImport(true)}
            className="text-xs sm:text-sm font-medium text-gray-600 hover:text-blue-600 transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import
          </button>

          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-xs sm:text-sm rounded-lg p-1.5 sm:p-2"
            value={template}
            onChange={(e) => setTemplate(e.target.value as ResumeTemplate)}
          >
            {Object.values(ResumeTemplate).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-xs sm:text-sm rounded-lg p-1.5 sm:p-2"
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as ResumeOrientation)}
          >
            {Object.values(ResumeOrientation).map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowAI(!showAI)}
            className={`hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition ${showAI ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21a9.003 9.003 0 008.367-5.633M12 21a9.003 9.003 0 01-8.367-5.633M12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9c.854 0 1.673.118 2.45.338" />
            </svg>
            <span className="hidden sm:inline">ATS Scan</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar: Editor */}
        <div className="w-[300px] sm:w-[450px] flex-shrink-0 bg-white border-r overflow-hidden flex flex-col no-print">
          <ResumeEditor data={resumeData} onChange={setResumeData} />
        </div>

        {/* Center: Preview */}
        <div className="flex-1 bg-gray-200 overflow-y-auto p-4 sm:p-8 scroll-smooth flex justify-center print:bg-white print:p-0 print:overflow-visible">
          <div className="origin-top transition-all duration-300 print:scale-100">
            <ResumePreview data={resumeData} template={template} orientation={orientation} />
          </div>
        </div>

        {/* Right Sidebar: AI Assistant */}
        {showAI && (
          <div className="w-[300px] sm:w-[350px] flex-shrink-0 no-print">
            <AIAssistant resumeData={resumeData} onApplyOptimizedData={handleApplyAI} />
          </div>
        )}
      </main>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Import Resume Text</h2>
                <p className="text-sm text-gray-500">Our AI will automatically structure your data.</p>
              </div>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <textarea
                className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm font-mono text-gray-900 outline-none"
                placeholder="Paste your existing resume text here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowImport(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                <button
                  disabled={isImporting || !importText.trim()}
                  onClick={handleImportResume}
                  className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 transition flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Parsing...
                    </>
                  ) : 'Structure with AI'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page {
            size: ${orientation === ResumeOrientation.PORTRAIT ? 'A4 portrait' : 'A4 landscape'};
            margin: 0;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
