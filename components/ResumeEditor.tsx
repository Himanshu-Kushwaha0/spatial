
import React, { useState } from 'react';
import { ResumeData, ContactInfo, Experience, Education, Project, SkillCategory, CustomSection, Portfolio } from '../types';
import CodeEditor from './CodeEditor';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

enum EditorTab {
  CONTACT = 'Identity',
  ORDER = 'Reorder',
  SUMMARY = 'Summary',
  SKILLS = 'Skills',
  WORK = 'Experience',
  PROJECTS = 'Projects',
  EDUCATION = 'Education',
  CUSTOM = 'Add Blocks',
  DESIGN = 'Custom CSS',
  LATEX = 'Export TeX',
  SYSTEM = 'System Code'
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<EditorTab>(EditorTab.CONTACT);

  const updateContact = (updates: Partial<ContactInfo>) => onChange({ ...data, contact: { ...data.contact, ...updates } });
  
  const updateItem = <T extends { id: string }>(key: keyof ResumeData, id: string, updates: Partial<T>) => {
    const list = data[key] as T[];
    onChange({ ...data, [key]: list.map(item => item.id === id ? { ...item, ...updates } : item) });
  };

  const removeItem = (key: keyof ResumeData, id: string) => {
    const list = data[key] as { id: string }[];
    onChange({ ...data, [key]: list.filter(item => item.id !== id) });
  };

  const addItem = (key: keyof ResumeData, defaultItem: any) => {
    onChange({ ...data, [key]: [...(data[key] as any[]), { ...defaultItem, id: Math.random().toString(36).substr(2, 9) }] });
  };

  const addPortfolioLink = () => {
    const newPortfolios = [...(data.contact.portfolios || []), { id: Math.random().toString(36).substr(2, 9), label: 'New Link', url: '' }];
    updateContact({ portfolios: newPortfolios });
  };

  const updatePortfolioLink = (id: string, updates: Partial<Portfolio>) => {
    const newPortfolios = (data.contact.portfolios || []).map(p => p.id === id ? { ...p, ...updates } : p);
    updateContact({ portfolios: newPortfolios });
  };

  const removePortfolioLink = (id: string) => {
    const newPortfolios = (data.contact.portfolios || []).filter(p => p.id !== id);
    updateContact({ portfolios: newPortfolios });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...data.sectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      onChange({ ...data, sectionOrder: [...newOrder] });
    }
  };

  const generateLatex = () => {
    const { contact, summary, experience, education, projects, skillCategories } = data;
    return `
\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=0.75in}
\\usepackage{titlesec}
\\usepackage{enumitem}

\\titleformat{\\section}{\\bfseries\\large\\uppercase}{}{0pt}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{8pt}

\\begin{document}

\\begin{center}
    {\\huge \\bfseries ${contact.fullName}} \\\\
    ${contact.professionalTitle} | ${contact.location} \\\\
    ${contact.email} | ${contact.phone}
\\end{center}

\\section{Professional Summary}
${summary}

\\section{Education}
${education.map(edu => `\\textbf{${edu.degree} in ${edu.specialization}} \\hfill ${edu.startDate} -- ${edu.endDate} \\\\
\\textit{${edu.school}} \\hfill ${edu.result}`).join('\n\n')}

\\section{Experience}
${experience.map(exp => `\\textbf{${exp.role}} \\hfill ${exp.startDate} -- ${exp.endDate} \\\\
\\textit{${exp.company}}
\\begin{itemize}[noitemsep,topsep=0pt]
${exp.description.map(d => `    \\item ${d}`).join('\n')}
\\end{itemize}`).join('\n\n')}

\\section{Skills}
${skillCategories.map(cat => `\\textbf{${cat.name}:} ${cat.skills.join(', ')}`).join('\\\\ \n')}

\\end{document}
    `.trim();
  };

  const inputClasses = "w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600";
  const labelClasses = "block text-xs font-black text-slate-500 uppercase tracking-widest mb-2";

  return (
    <div className="flex flex-col h-full bg-[#0f172a] overflow-hidden">
      <div className="flex border-b border-slate-800 overflow-x-auto bg-slate-950 scrollbar-hide no-print">
        {Object.values(EditorTab).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab ? 'text-blue-400 bg-slate-900 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-slate-700">
        {activeTab === EditorTab.CONTACT && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="text-xs font-black uppercase text-slate-500">
                Link Mode: {data.contact.showFullLinks ? 'Minimal Label (Link)' : 'Full URL Text'}
              </span>
              <button 
                onClick={() => updateContact({ showFullLinks: !data.contact.showFullLinks })}
                className={`w-10 h-5 rounded-full transition-all relative ${data.contact.showFullLinks ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${data.contact.showFullLinks ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
            <div>
              <label className={labelClasses}>Full Name</label>
              <input type="text" className={inputClasses} value={data.contact.fullName || ''} onChange={(e) => updateContact({ fullName: e.target.value })} />
            </div>
            <div>
              <label className={labelClasses}>Professional Title</label>
              <input type="text" className={inputClasses} value={data.contact.professionalTitle || ''} onChange={(e) => updateContact({ professionalTitle: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Email</label>
                <input type="email" className={inputClasses} value={data.contact.email || ''} onChange={(e) => updateContact({ email: e.target.value })} />
              </div>
              <div>
                <label className={labelClasses}>Phone</label>
                <input type="text" className={inputClasses} value={data.contact.phone || ''} onChange={(e) => updateContact({ phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Location</label>
              <input type="text" className={inputClasses} value={data.contact.location || ''} onChange={(e) => updateContact({ location: e.target.value })} />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <label className={labelClasses}>Social Links</label>
                <button onClick={addPortfolioLink} className="text-[10px] font-black uppercase text-blue-500">+ Add Link</button>
              </div>
              {(data.contact.portfolios || []).map((link) => (
                <div key={link.id} className="grid grid-cols-12 gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 group">
                  <div className="col-span-4">
                    <input type="text" placeholder="Label (e.g. LinkedIn)" className={`${inputClasses} py-2 text-xs`} value={link.label || ''} onChange={(e) => updatePortfolioLink(link.id, { label: e.target.value })} />
                  </div>
                  <div className="col-span-7">
                    <input type="text" placeholder="URL (e.g. linkedin.com/in/...)" className={`${inputClasses} py-2 text-xs`} value={link.url || ''} onChange={(e) => updatePortfolioLink(link.id, { url: e.target.value })} />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button onClick={() => removePortfolioLink(link.id)} className="text-slate-600 hover:text-red-500 transition-colors text-xl">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === EditorTab.ORDER && (
          <div className="space-y-4">
            <label className={labelClasses}>Visual Hierarchy Reordering</label>
            <div className="space-y-2">
              {data.sectionOrder.map((section, idx) => (
                <div key={section} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg group">
                  <span className="text-xs font-black uppercase text-slate-300 tracking-widest">{section}</span>
                  <div className="flex gap-2">
                    <button onClick={() => moveSection(idx, 'up')} disabled={idx === 0} className="p-2 bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30">↑</button>
                    <button onClick={() => moveSection(idx, 'down')} disabled={idx === data.sectionOrder.length - 1} className="p-2 bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30">↓</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === EditorTab.SUMMARY && (
           <div className="space-y-4">
             <label className={labelClasses}>Professional Summary</label>
             <textarea rows={12} className={inputClasses} value={data.summary || ''} onChange={(e) => onChange({...data, summary: e.target.value})} placeholder="Write an objective or summary..." />
           </div>
        )}

        {activeTab === EditorTab.SKILLS && (
          <div className="space-y-6">
            <button onClick={() => addItem('skillCategories', { name: '', skills: [] })} className="w-full py-2 bg-blue-600/10 border border-blue-500/20 text-[10px] font-black uppercase text-blue-400 rounded-lg">+ Add Skill Category</button>
            {data.skillCategories.map(cat => (
              <div key={cat.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 relative">
                <button onClick={() => removeItem('skillCategories', cat.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-500">×</button>
                <input type="text" placeholder="Category (e.g. Tools)" className={inputClasses} value={cat.name || ''} onChange={(e) => updateItem<SkillCategory>('skillCategories', cat.id, { name: e.target.value })} />
                <textarea className={inputClasses} rows={3} placeholder="Skills (comma separated)" value={(cat.skills || []).join(', ')} onChange={(e) => updateItem<SkillCategory>('skillCategories', cat.id, { skills: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })} />
              </div>
            ))}
          </div>
        )}

        {activeTab === EditorTab.WORK && (
          <div className="space-y-6">
            <button onClick={() => addItem('experience', { company: '', role: '', startDate: '', endDate: '', description: [''] })} className="w-full py-2 bg-blue-600/10 border border-blue-500/20 text-[10px] font-black uppercase text-blue-400 rounded-lg">+ Add Work Entry</button>
            {data.experience.map(exp => (
              <div key={exp.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 relative">
                <button onClick={() => removeItem('experience', exp.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-500">×</button>
                <input type="text" placeholder="Job Title" className={inputClasses} value={exp.role || ''} onChange={(e) => updateItem<Experience>('experience', exp.id, { role: e.target.value })} />
                <input type="text" placeholder="Organization" className={inputClasses} value={exp.company || ''} onChange={(e) => updateItem<Experience>('experience', exp.id, { company: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Start (e.g. Jan 2022)" className={inputClasses} value={exp.startDate || ''} onChange={(e) => updateItem<Experience>('experience', exp.id, { startDate: e.target.value })} />
                  <input type="text" placeholder="End (e.g. Present)" className={inputClasses} value={exp.endDate || ''} onChange={(e) => updateItem<Experience>('experience', exp.id, { endDate: e.target.value })} />
                </div>
                <textarea className={inputClasses} rows={5} placeholder="Bullet points (one per line)" value={(exp.description || []).join('\n')} onChange={(e) => updateItem<Experience>('experience', exp.id, { description: e.target.value.split('\n') })} />
              </div>
            ))}
          </div>
        )}

        {activeTab === EditorTab.PROJECTS && (
          <div className="space-y-6">
            <button onClick={() => addItem('projects', { name: '', organization: '', date: '', description: [''] })} className="w-full py-2 bg-blue-600/10 border border-blue-500/20 text-[10px] font-black uppercase text-blue-400 rounded-lg">+ Add Project Block</button>
            {data.projects.map(proj => (
              <div key={proj.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 relative">
                <button onClick={() => removeItem('projects', proj.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-500">×</button>
                <input type="text" placeholder="Project Name" className={inputClasses} value={proj.name || ''} onChange={(e) => updateItem<Project>('projects', proj.id, { name: e.target.value })} />
                <input type="text" placeholder="Organization / Context" className={inputClasses} value={proj.organization || ''} onChange={(e) => updateItem<Project>('projects', proj.id, { organization: e.target.value })} />
                <input type="text" placeholder="Duration" className={inputClasses} value={proj.date || ''} onChange={(e) => updateItem<Project>('projects', proj.id, { date: e.target.value })} />
                <textarea className={inputClasses} rows={4} placeholder="Project details (one per line)" value={(proj.description || []).join('\n')} onChange={(e) => updateItem<Project>('projects', proj.id, { description: e.target.value.split('\n') })} />
              </div>
            ))}
          </div>
        )}

        {activeTab === EditorTab.EDUCATION && (
          <div className="space-y-6">
            <button onClick={() => addItem('education', { school: '', degree: '', specialization: '', result: '', startDate: '', endDate: '' })} className="w-full py-2 bg-blue-600/10 border border-blue-500/20 text-[10px] font-black uppercase text-blue-400 rounded-lg">+ Add Academic Entry</button>
            {data.education.map(edu => (
              <div key={edu.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 relative">
                <button onClick={() => removeItem('education', edu.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-500">×</button>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Degree (B.Tech)" className={inputClasses} value={edu.degree || ''} onChange={(e) => updateItem<Education>('education', edu.id, { degree: e.target.value })} />
                  <input type="text" placeholder="Subject" className={inputClasses} value={edu.specialization || ''} onChange={(e) => updateItem<Education>('education', edu.id, { specialization: e.target.value })} />
                </div>
                <input type="text" placeholder="University / School" className={inputClasses} value={edu.school || ''} onChange={(e) => updateItem<Education>('education', edu.id, { school: e.target.value })} />
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="From" className={inputClasses} value={edu.startDate || ''} onChange={(e) => updateItem<Education>('education', edu.id, { startDate: e.target.value })} />
                  <input type="text" placeholder="To" className={inputClasses} value={edu.endDate || ''} onChange={(e) => updateItem<Education>('education', edu.id, { endDate: e.target.value })} />
                  <input type="text" placeholder="GPA / %" className={inputClasses} value={edu.result || ''} onChange={(e) => updateItem<Education>('education', edu.id, { result: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === EditorTab.CUSTOM && (
          <div className="space-y-6">
            <button onClick={() => addItem('customSections', { title: '', content: [] })} className="w-full py-2 bg-blue-600/10 border border-blue-500/20 text-[10px] font-black uppercase text-blue-400 rounded-lg">+ Add Custom Block</button>
            {data.customSections.map(sec => (
              <div key={sec.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 relative">
                <button onClick={() => removeItem('customSections', sec.id)} className="absolute top-2 right-2 text-slate-600 hover:text-red-500">×</button>
                <input type="text" placeholder="Block Title (e.g. Languages)" className={inputClasses} value={sec.title || ''} onChange={(e) => updateItem<CustomSection>('customSections', sec.id, { title: e.target.value })} />
                <textarea className={inputClasses} rows={5} placeholder="Bullet points (one per line)" value={(sec.content || []).join('\n')} onChange={(e) => updateItem<CustomSection>('customSections', sec.id, { content: e.target.value.split('\n') })} />
              </div>
            ))}
          </div>
        )}

        {activeTab === EditorTab.DESIGN && (
          <div className="space-y-4">
            <label className={labelClasses}>Custom CSS (Injected Styles)</label>
            <p className="text-[10px] text-slate-500 italic">Target classes like .resume-block, .section-header, or tag names.</p>
            <textarea 
              rows={15} 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-xs text-blue-400 focus:border-blue-500 outline-none" 
              value={data.customCSS || ''} 
              onChange={(e) => onChange({...data, customCSS: e.target.value})}
              placeholder=".section-header { color: #2563eb; }"
            />
          </div>
        )}

        {activeTab === EditorTab.LATEX && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className={labelClasses}>Generated LaTeX Source</label>
              <button 
                onClick={() => {
                  const blob = new Blob([generateLatex()], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'resume.tex';
                  a.click();
                }}
                className="text-[10px] font-black uppercase text-blue-500 hover:underline"
              >
                Download .tex
              </button>
            </div>
            <textarea 
              readOnly
              rows={20} 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-[10px] text-slate-400 outline-none select-all" 
              value={generateLatex()}
            />
          </div>
        )}

        {activeTab === EditorTab.SYSTEM && (
          <div className="h-[600px] border border-slate-800 rounded-xl overflow-hidden">
            <CodeEditor data={data} onChange={onChange} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeEditor;
