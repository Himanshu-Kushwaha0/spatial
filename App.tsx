
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { INITIAL_RESUME_DATA } from './constants';
import { ResumeData, ResumeTemplate, ResumeOrientation, TailoredResumeResponse } from './types';
import ResumeEditor from './components/ResumeEditor';
import ResumePreview from './components/ResumePreview';
import AIAssistant from './components/AIAssistant';

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('resume_ai_data_v10');
    return saved ? JSON.parse(saved) : INITIAL_RESUME_DATA;
  });
  
  const [template, setTemplate] = useState<ResumeTemplate>(ResumeTemplate.CLASSIC);
  const [orientation, setOrientation] = useState<ResumeOrientation>(ResumeOrientation.PORTRAIT);
  const [showAI, setShowAI] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...'>('Saved');
  const [optimizedPreview, setOptimizedPreview] = useState<TailoredResumeResponse | null>(null);

  useEffect(() => {
    setSaveStatus('Saving...');
    const timer = setTimeout(() => {
      localStorage.setItem('resume_ai_data_v10', JSON.stringify(resumeData));
      setSaveStatus('Saved');
    }, 1000);
    return () => clearTimeout(timer);
  }, [resumeData]);

  useEffect(() => {
    if (resumeData.contact.fullName) {
      document.title = `${resumeData.contact.fullName.replace(/\s+/g, '_')}_Resume`;
    }
  }, [resumeData.contact.fullName]);

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Identity & Summary
    const identity = [
      { Field: 'Full Name', Value: resumeData.contact.fullName },
      { Field: 'Professional Title', Value: resumeData.contact.professionalTitle },
      { Field: 'Email', Value: resumeData.contact.email },
      { Field: 'Phone', Value: resumeData.contact.phone },
      { Field: 'Location', Value: resumeData.contact.location },
      { Field: 'Summary', Value: resumeData.summary }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(identity), 'Identity');

    // Sheet 2: Experience
    const experience = resumeData.experience.map(exp => ({
      Company: exp.company,
      Role: exp.role,
      Location: exp.location,
      'Start Date': exp.startDate,
      'End Date': exp.endDate,
      'Current?': exp.isCurrent ? 'Yes' : 'No',
      Description: exp.description.join(' | ')
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(experience), 'Experience');

    // Sheet 3: Education
    const education = resumeData.education.map(edu => ({
      School: edu.school,
      Degree: edu.degree,
      Specialization: edu.specialization,
      'Start Date': edu.startDate,
      'End Date': edu.endDate,
      Result: edu.result
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(education), 'Education');

    // Sheet 4: Skills
    const skills = resumeData.skillCategories.map(cat => ({
      Category: cat.name,
      Skills: cat.skills.join(', ')
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(skills), 'Skills');

    // Sheet 5: Projects
    const projects = resumeData.projects.map(proj => ({
      Name: proj.name,
      Organization: proj.organization,
      Date: proj.date,
      Technologies: proj.technologies.join(', '),
      Description: proj.description.join(' | ')
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projects), 'Projects');

    XLSX.writeFile(wb, `${resumeData.contact.fullName.replace(/\s+/g, '_')}_Resume_Data.xlsx`);
  };

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-slate-300 font-sans overflow-hidden">
      <nav className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between no-print shrink-0 shadow-2xl z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-[0_0_30px_rgba(37,99,235,0.4)]">R</div>
            <div>
              <h1 className="text-sm font-black tracking-tighter uppercase text-white leading-none">ResumeAI <span className="text-blue-500">Pro</span></h1>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 block transition-colors ${saveStatus === 'Saving...' ? 'text-yellow-500' : 'text-slate-600'}`}>
                {saveStatus}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {Object.values(ResumeTemplate).map(t => (
              <button 
                key={t}
                onClick={() => setTemplate(t)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${template === t ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAI(!showAI)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showAI ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'}`}
          >
            {showAI ? 'Close AI Engine' : 'AI Assistant'}
          </button>
          
          <div className="h-8 w-[1px] bg-slate-800 mx-1"></div>

          <button
            onClick={handleExcelExport}
            className="px-4 py-2.5 bg-slate-900 text-slate-400 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] hover:text-white hover:border-slate-700 transition-all shadow-xl"
          >
            Export Excel
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-xl"
          >
            Download PDF
          </button>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden print:block print:overflow-visible print:h-auto bg-[#0f172a]">
        <div className="w-[450px] shrink-0 border-r border-slate-800 no-print">
          <ResumeEditor data={resumeData} onChange={setResumeData} />
        </div>

        <div className="flex-1 bg-[#020617] overflow-auto p-12 print:p-0 print:bg-white print:overflow-visible print:h-auto scrollbar-thin scrollbar-thumb-slate-800">
          <div className="flex justify-center pb-24 print:pb-0 print:block">
             <ResumePreview 
              data={resumeData} 
              template={template} 
              orientation={orientation} 
              optimizedData={optimizedPreview}
             />
          </div>
        </div>

        {showAI && (
          <div className="w-[380px] shrink-0 no-print animate-in slide-in-from-right duration-300">
            <AIAssistant 
              resumeData={resumeData} 
              onApplyOptimizedData={(u) => setResumeData(p => ({...p, ...u}))}
              onPreviewOptimization={(opt) => setOptimizedPreview(opt)}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
