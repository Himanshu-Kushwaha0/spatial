
import React, { useState } from 'react';
import { ResumeData, ContactInfo, Experience, Education, Project, SkillCategory, Certification, CustomSection, SectionType, Portfolio } from '../types';
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
  LATEX = 'TeX Editor',
  SYSTEM = 'JSON Code'
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
    const newPortfolios = data.contact.portfolios.map(p => p.id === id ? { ...p, ...updates } : p);
    updateContact({ portfolios: newPortfolios });
  };

  const removePortfolioLink = (id: string) => {
    const newPortfolios = data.contact.portfolios.filter(p => p.id !== id);
    updateContact({ portfolios: newPortfolios });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...data.sectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      onChange({ ...data, sectionOrder: newOrder });
    }
  };

  const escapeLatex = (str: string) => {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\textbackslash ')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/\$/g, '\\$')
      .replace(/#/g, '\\#')
      .replace(/_/g, '\\_')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/~/g, '\\textasciitilde ')
      .replace(/\^/g, '\\textasciicircum ');
  };

  const generateLatex = () => {
    const { contact, education, experience, projects, skillCategories, customSections, sectionOrder } = data;
    
    let tex = `\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{tabularx}
\\usepackage{xcolor}
\\usepackage{hyperref}

\\pagestyle{empty}
\\setlist[itemize]{noitemsep, topsep=0pt}

\\begin{document}

% --- HEADER ---
\\begin{center}
    {\\huge \\textbf{${escapeLatex(contact.fullName)}}} \\\\
    ${escapeLatex(contact.professionalTitle)} \\\\
    ${escapeLatex(contact.location)} $|$ ${escapeLatex(contact.phone)} $|$ \\href{mailto:${contact.email}}{${escapeLatex(contact.email)}} \\\\
    ${(contact.portfolios || []).map(p => `\\href{https://${p.url}}{${escapeLatex(contact.showFullLinks ? p.url : p.label)}}`).join(' $|$ ')}
\\end{center}

`;

    sectionOrder.forEach(sectionId => {
      if (sectionId === 'education' && education.length > 0) {
        tex += `\\section*{EDUCATION}
\\noindent\\begin{tabularx}{\\textwidth}{|l|X|l|l|r|}
\\hline
\\textbf{Degree} & \\textbf{Specialization} & \\textbf{Institute} & \\textbf{Year} & \\textbf{Result} \\\\ \\hline
${education.map(edu => `${escapeLatex(edu.degree)} & ${escapeLatex(edu.specialization)} & ${escapeLatex(edu.school)} & ${escapeLatex(edu.startDate)}--${escapeLatex(edu.endDate)} & ${escapeLatex(edu.result)} \\\\ \\hline`).join('\n')}
\\end{tabularx}

`;
      } else if (sectionId === 'experience' && experience.length > 0) {
        tex += `\\section*{WORK EXPERIENCE}
${experience.map(exp => `\\noindent \\textbf{${escapeLatex(exp.role)}} \\hfill \\textit{${escapeLatex(exp.startDate)}--${escapeLatex(exp.endDate)}} \\\\
\\textit{${escapeLatex(exp.company)}}
\\begin{itemize}
${exp.description.map(d => `    \\item ${escapeLatex(d)}`).join('\n')}
\\end{itemize}
\\vspace{0.2cm}`).join('\n\n')}

`;
      } else if (sectionId === 'projects' && projects.length > 0) {
        tex += `\\section*{PROJECTS}
${projects.map(proj => `\\noindent \\textbf{${escapeLatex(proj.name)}} \\hfill \\textit{${escapeLatex(proj.date)}} \\\\
\\textit{${escapeLatex(proj.organization)}}
\\begin{itemize}
${proj.description.map(d => `    \\item ${escapeLatex(d)}`).join('\n')}
\\end{itemize}
\\vspace{0.2cm}`).join('\n\n')}

`;
      } else if (sectionId === 'skills' && skillCategories.length > 0) {
        tex += `\\section*{TECHNICAL SKILLS}
\\begin{itemize}
${skillCategories.map(cat => `    \\item \\textbf{${escapeLatex(cat.name)}:} ${escapeLatex(cat.skills.join(', '))}`).join('\n')}
\\end{itemize}

`;
      } else if (sectionId === 'custom' && customSections.length > 0) {
        customSections.forEach(sec => {
          tex += `\\section*{${escapeLatex(sec.title)}}
\\begin{itemize}
${sec.content.map(c => `    \\item ${escapeLatex(c)}`).join('\n')}
\\end{itemize}

`;
        });
      }
    });

    tex += `\\end{document}`;
    onChange({ ...data, latexCode: tex });
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
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="text-xs font-black uppercase text-slate-500">Show Full Links?</span>
              <button 
                onClick={() => updateContact({ showFullLinks: !data.contact.showFullLinks })}
                className={`w-10 h-5 rounded-full transition-all relative ${data.contact.showFullLinks ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${data.contact.showFullLinks ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
            <div>
              <label className={labelClasses}>Full Name</label>
              <input type="text" className={inputClasses} value={data.contact.fullName} onChange={(e) => updateContact({ fullName: e.target.value })} />
            </div>
            <div>
              <label className={labelClasses}>Professional Title</label>
              <input type="text" className={inputClasses} value={data.contact.professionalTitle} onChange={(e) => updateContact({ professionalTitle: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Email</label>
                <input type="email" className={inputClasses} value={data.contact.email} onChange={(e) => updateContact({ email: e.target.value })} />
              </div>
              <div>
                <label className={labelClasses}>Phone</label>
                <input type="text" className={inputClasses} value={data.contact.phone} onChange={(e) => updateContact({ phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Location</label>
              <input type="text" className={inputClasses} value={data.contact.location} onChange={(e) => updateContact({ location: e.target.value })} />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className={labelClasses}>Hyperlinks</label>
                <button onClick={addPortfolioLink} className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-400">+ Add Link</button>
              </div>
              {data.contact.portfolios?.map((link) => (
                <div key={link.id} className="grid grid-cols-12 gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 group">
                  <div className="col-span-4">
                    <input 
                      type="text" 
                      placeholder="Label" 
                      className={`${inputClasses} py-2 text-xs`} 
                      value={link.label} 
                      onChange={(e) => updatePortfolioLink(link.id, { label: e.target.value })} 
                    />
                  </div>
                  <div className="col-span-7">
                    <input 
                      type="text" 
                      placeholder="URL" 
                      className={`${inputClasses} py-2 text-xs`} 
                      value={link.url} 
                      onChange={(e) => updatePortfolioLink(link.id, { url: e.target.value })} 
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button onClick={() => removePortfolioLink(link.id)} className="text-slate-600 hover:text-red-500">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === EditorTab.ORDER && (
          <div className="space-y-4">
            <label className={labelClasses}>Move Sections Up/Down</label>
            <div className="space-y-2">
              {data.sectionOrder.map((section, idx) => (
                <div key={section} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg group">
                  <span className="text-xs font-black uppercase text-slate-300 tracking-widest">{section}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => moveSection(idx, 'up')} 
                      disabled={idx === 0}
                      className="p-2 bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30"
                    >↑</button>
                    <button 
                      onClick={() => moveSection(idx, 'down')} 
                      disabled={idx === data.sectionOrder.length - 1}
                      className="p-2 bg-slate-800 rounded text-slate-400 hover:text-white disabled:opacity-30"
                    >↓</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === EditorTab.SUMMARY && (
           <div className="space-y-2">
             <label className={labelClasses}>Objective / Professional Summary</label>
             <textarea rows={12} className={inputClasses} value={data.summary} onChange={(e) => onChange({...data, summary: e.target.value})} placeholder="Write a brief professional summary or objective..." />
             <p className="text-[10px] text-slate-500 italic">This will appear in the 'Objective' section of the resume.</p>
           </div>
        )}

        {activeTab === EditorTab.EDUCATION && (
          <div className="space-y-6">
            <button onClick={() => addItem('education', { school: '', degree: '', specialization: '', result: '', startDate: '', endDate: '', description: '' })} className="w-full py-2 bg-slate-800 text-[10px] font-black uppercase text-slate-400 rounded-lg hover:bg-slate-700 transition-colors">+ Add Education</button>
            {data.education.map(edu => (
              <div key={edu.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 relative group">
                <button onClick={() => removeItem('education', edu.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-500">×</button>
                <input type="text" placeholder="Degree (e.g. B.Tech)" className={inputClasses} value={edu.degree} onChange={(e) => updateItem<Education>('education', edu.id, { degree: e.target.value })} />
                <input type="text" placeholder="Institute" className={inputClasses} value={edu.school} onChange={(e) => updateItem<Education>('education', edu.id, { school: e.target.value })} />
                <input type="text" placeholder="Specialization" className={inputClasses} value={edu.specialization} onChange={(e) => updateItem<Education>('education', edu.id, { specialization: e.target.value })} />
                <input type="text" placeholder="Result (CPI/%)" className={inputClasses} value={edu.result} onChange={(e) => updateItem<Education>('education', edu.id, { result: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Start" className={inputClasses} value={edu.startDate} onChange={(e) => updateItem<Education>('education', edu.id, { startDate: e.target.value })} />
                  <input type="text" placeholder="End" className={inputClasses} value={edu.endDate} onChange={(e) => updateItem<Education>('education', edu.id, { endDate: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === EditorTab.WORK && (
          <div className="space-y-6">
            <button onClick={() => addItem('experience', { company: '', role: '', startDate: '', endDate: '', description: [''] })} className="w-full py-2 bg-slate-800 text-[10px] font-black uppercase text-slate-400 rounded-lg hover:bg-slate-700 transition-colors">+ Add Experience</button>
            {data.experience.map(exp => (
              <div key={exp.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 relative group">
                <button onClick={() => removeItem('experience', exp.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-500">×</button>
                <input type="text" placeholder="Role" className={inputClasses} value={exp.role} onChange={(e) => updateItem<Experience>('experience', exp.id, { role: e.target.value })} />
                <input type="text" placeholder="Company" className={inputClasses} value={exp.company} onChange={(e) => updateItem<Experience>('experience', exp.id, { company: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Start Date" className={inputClasses} value={exp.startDate} onChange={(e) => updateItem<Experience>('experience', exp.id, { startDate: e.target.value })} />
                  <input type="text" placeholder="End Date" className={inputClasses} value={exp.endDate} onChange={(e) => updateItem<Experience>('experience', exp.id, { endDate: e.target.value })} />
                </div>
                <textarea className={inputClasses} rows={4} placeholder="Description Bullets (one per line)" value={exp.description.join('\n')} onChange={(e) => updateItem<Experience>('experience', exp.id, { description: e.target.value.split('\n') })} />
              </div>
            ))}
          </div>
        )}

        {activeTab === EditorTab.PROJECTS && (
          <div className="space-y-6">
            <button onClick={() => addItem('projects', { name: '', organization: '', date: '', description: [''], technologies: [] })} className="w-full py-2 bg-slate-800 text-[10px] font-black uppercase text-slate-400 rounded-lg hover:bg-slate-700 transition-colors">+ Add Project</button>
            {data.projects.map(proj => (
              <div key={proj.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 relative group">
                <button onClick={() => removeItem('projects', proj.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-500">×</button>
                <input type="text" placeholder="Project Title" className={inputClasses} value={proj.name} onChange={(e) => updateItem<Project>('projects', proj.id, { name: e.target.value })} />
                <input type="text" placeholder="Supervisor / Organization" className={inputClasses} value={proj.organization} onChange={(e) => updateItem<Project>('projects', proj.id, { organization: e.target.value })} />
                <input type="text" placeholder="Date" className={inputClasses} value={proj.date} onChange={(e) => updateItem<Project>('projects', proj.id, { date: e.target.value })} />
                <textarea className={inputClasses} rows={4} placeholder="Project Bullets (one per line)" value={proj.description.join('\n')} onChange={(e) => updateItem<Project>('projects', proj.id, { description: e.target.value.split('\n') })} />
              </div>
            ))}
          </div>
        )}

        {activeTab === EditorTab.CUSTOM && (
          <div className="space-y-6">
            <button onClick={() => addItem('customSections', { title: 'New Section', content: [''] })} className="w-full py-2 bg-slate-800 text-[10px] font-black uppercase text-slate-400 rounded-lg hover:bg-slate-700 transition-colors">+ Add Custom Section</button>
            {data.customSections.map(sec => (
              <div key={sec.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 relative group">
                <button onClick={() => removeItem('customSections', sec.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-500">×</button>
                <input type="text" placeholder="Section Title" className={inputClasses} value={sec.title} onChange={(e) => updateItem<CustomSection>('customSections', sec.id, { title: e.target.value })} />
                <textarea className={inputClasses} rows={4} placeholder="Content Bullets (one per line)" value={sec.content.join('\n')} onChange={(e) => updateItem<CustomSection>('customSections', sec.id, { content: e.target.value.split('\n') })} />
              </div>
            ))}
          </div>
        )}

        {activeTab === EditorTab.SKILLS && (
           <div className="space-y-6">
              <button onClick={() => addItem('skillCategories', { name: '', skills: [] })} className="w-full py-2 bg-slate-800 text-[10px] font-black uppercase text-slate-400 rounded-lg hover:bg-slate-700 transition-colors">+ Add Skills Category</button>
              {data.skillCategories.map(cat => (
                <div key={cat.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 relative group">
                  <button onClick={() => removeItem('skillCategories', cat.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-500">×</button>
                  <input type="text" placeholder="Category Name" className={inputClasses} value={cat.name} onChange={(e) => updateItem<SkillCategory>('skillCategories', cat.id, { name: e.target.value })} />
                  <textarea placeholder="Skills (comma separated)" className={inputClasses} value={cat.skills.join(', ')} onChange={(e) => updateItem<SkillCategory>('skillCategories', cat.id, { skills: e.target.value.split(',').map(s => s.trim()) })} />
                </div>
              ))}
           </div>
        )}

        {activeTab === EditorTab.DESIGN && (
          <div className="space-y-4">
             <label className={labelClasses}>Inject Custom CSS</label>
             <textarea 
               className="w-full h-96 bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-xs text-blue-300 outline-none focus:border-blue-500" 
               value={data.customCSS} 
               onChange={(e) => onChange({ ...data, customCSS: e.target.value })} 
               placeholder="Example: #resume-document { color: darkblue; }" 
             />
          </div>
        )}

        {activeTab === EditorTab.LATEX && (
          <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between">
               <label className={labelClasses}>LaTeX Source (Overleaf-style)</label>
               <button 
                onClick={generateLatex}
                className="text-[9px] font-black bg-blue-600 px-3 py-1 rounded text-white uppercase tracking-widest hover:bg-blue-500 transition-all"
               >
                Regenerate from Data
               </button>
            </div>
            <textarea 
              className="flex-1 min-h-[500px] bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-xs text-green-400 outline-none focus:border-green-500 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800"
              value={data.latexCode}
              onChange={(e) => onChange({ ...data, latexCode: e.target.value })}
              spellCheck={false}
              placeholder="LaTeX code will appear here..."
            />
            <p className="text-[9px] text-slate-500 italic">Note: Use 'Regenerate' to convert your visual data into TeX. Manual edits are saved.</p>
          </div>
        )}

        {activeTab === EditorTab.SYSTEM && (
          <CodeEditor data={data} onChange={onChange} />
        )}
      </div>
    </div>
  );
};

export default ResumeEditor;
