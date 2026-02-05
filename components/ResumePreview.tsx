
import React from 'react';
import { ResumeData, ResumeTemplate, ResumeOrientation, TailoredResumeResponse } from '../types';

interface ResumePreviewProps {
  data: ResumeData;
  template: ResumeTemplate;
  orientation: ResumeOrientation;
  optimizedData?: TailoredResumeResponse | null;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, template, orientation, optimizedData }) => {
  const { contact, summary, experience, education, projects, skillCategories, customSections, sectionOrder, customCSS } = data;

  const isClassic = template === ResumeTemplate.CLASSIC;
  const isModern = template === ResumeTemplate.MODERN;
  const isMinimal = template === ResumeTemplate.MINIMAL;
  const isLandscape = orientation === ResumeOrientation.LANDSCAPE;

  const width = isLandscape ? '297mm' : '210mm';
  const minHeight = isLandscape ? '210mm' : '297mm';

  const fontMain = "'Inter', sans-serif";

  const getFullUrl = (url: string) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const SectionHeader = ({ title }: { title: string }) => {
    if (isClassic) {
      return (
        <div className="bg-[#D1D5DB] px-3 py-0.5 mb-2 mt-4 -mx-1 border-y border-slate-400">
          <h2 className="text-[10pt] font-bold uppercase tracking-wider text-black">{title}</h2>
        </div>
      );
    }
    if (isMinimal) {
      return (
        <div className="flex flex-col items-center mb-5 mt-10">
          <h2 className="text-[10pt] font-light uppercase tracking-[0.5em] text-slate-400">{title}</h2>
          <div className="h-[1px] w-20 bg-slate-200 mt-2" />
        </div>
      );
    }
    return (
      <h2 className="text-[11.5pt] font-black uppercase tracking-[0.1em] text-blue-600 mb-4 mt-8 flex items-center gap-4">
        {title}
        <span className="flex-1 h-[2px] bg-blue-50" />
      </h2>
    );
  };

  const renderSection = (type: string) => {
    switch (type) {
      case 'summary':
        const displaySummary = optimizedData?.optimizedSummary || summary;
        if (!displaySummary) return null;
        return (
          <section key="summary" className="mb-4">
            <SectionHeader title="Professional Summary" />
            <p className={`text-[9.5pt] leading-relaxed text-black whitespace-pre-wrap ${isMinimal ? 'text-center italic px-14' : 'pl-1'}`}>
              {displaySummary}
            </p>
          </section>
        );
      
      case 'education':
        return education.length > 0 ? (
          <section key="education" className="mb-4">
            <SectionHeader title="Education" />
            {isClassic ? (
              <table className="w-full text-[9.5pt] border-collapse mb-2 text-black border-t border-slate-800">
                <thead>
                  <tr className="text-left">
                    <th className="py-1 px-1 font-bold border-b border-slate-800">Degree</th>
                    <th className="py-1 px-1 font-bold border-b border-slate-800">Specialization</th>
                    <th className="py-1 px-1 font-bold border-b border-slate-800">Institute</th>
                    <th className="py-1 px-1 font-bold border-b border-slate-800">Year</th>
                    <th className="py-1 px-1 font-bold border-b border-slate-800 text-right">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {education.map(edu => (
                    <tr key={edu.id}>
                      <td className="py-1 px-1 border-b border-slate-200">{edu.degree}</td>
                      <td className="py-1 px-1 border-b border-slate-200 italic">{edu.specialization}</td>
                      <td className="py-1 px-1 border-b border-slate-200">{edu.school}</td>
                      <td className="py-1 px-1 border-b border-slate-200 whitespace-nowrap">{edu.startDate}{edu.endDate && edu.startDate !== edu.endDate ? `-${edu.endDate}` : ''}</td>
                      <td className="py-1 px-1 border-b border-slate-200 text-right">{edu.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={`space-y-4 ${isMinimal ? 'text-center' : ''}`}>
                {education.map(edu => (
                  <div key={edu.id} className="flex flex-col sm:flex-row justify-between items-baseline gap-1">
                    <div className={isMinimal ? 'w-full' : 'flex-1'}>
                      <p className="font-bold text-[10.5pt] text-black uppercase">{edu.degree} in {edu.specialization}</p>
                      <p className="text-slate-600 italic text-[9.5pt]">{edu.school}</p>
                    </div>
                    <div className={isMinimal ? 'w-full text-center mt-1' : 'text-right'}>
                       <p className="text-slate-500 text-[9pt] font-semibold">{edu.startDate} – {edu.endDate}</p>
                       <p className="font-black text-blue-600 text-[9.5pt]">{edu.result}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null;

      case 'experience':
        return experience.length > 0 ? (
          <section key="experience" className="mb-4">
            <SectionHeader title="Work Experience" />
            <div className="space-y-4">
              {experience.map(exp => (
                <div key={exp.id} className="resume-block">
                  <div className={`flex justify-between items-baseline mb-1 ${isMinimal ? 'flex-col items-center' : ''}`}>
                    <h3 className="text-[10pt] font-bold text-black">
                      • {exp.role} <span className="font-normal text-slate-700 italic">[{exp.company}]</span>
                    </h3>
                    <span className="text-[9.5pt] font-medium text-slate-800 italic whitespace-nowrap">{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}</span>
                  </div>
                  <ul className={`list-none space-y-1 text-[9.5pt] leading-snug text-black ${isMinimal ? 'text-center' : 'pl-4'}`}>
                    {(exp.description || []).filter(d => d.trim()).map((point, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        {!isMinimal && <span className="text-slate-800 font-bold mt-0.5">◦</span>}
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null;

      case 'projects':
        return projects.length > 0 ? (
          <section key="projects" className="mb-4">
            <SectionHeader title="Projects" />
            <div className="space-y-4">
              {projects.map(proj => (
                <div key={proj.id} className="resume-block">
                  <div className={`flex justify-between items-baseline mb-1 ${isMinimal ? 'flex-col items-center' : ''}`}>
                    <h3 className="text-[10pt] font-bold text-black">
                      • {proj.name} <span className="font-normal text-slate-700 italic">[{proj.organization}]</span>
                    </h3>
                    <span className="text-[9.5pt] font-medium text-slate-800 italic whitespace-nowrap">{proj.date}</span>
                  </div>
                  <ul className={`list-none space-y-1 text-[9.5pt] leading-snug text-black ${isMinimal ? 'text-center' : 'pl-4'}`}>
                    {(proj.description || []).filter(d => d.trim()).map((d, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        {!isMinimal && <span className="text-slate-800 font-bold mt-0.5">◦</span>}
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null;

      case 'skills':
        const displaySkills = optimizedData?.optimizedSkills || skillCategories;
        return displaySkills.length > 0 ? (
          <section key="skills" className="mb-4">
            <SectionHeader title="Technical Skills" />
            <div className={`space-y-1 pl-1 text-black ${isMinimal ? 'text-center' : ''}`}>
              {displaySkills.map(cat => (
                <p key={cat.id} className="text-[9.5pt] leading-relaxed">
                  <span className="font-bold">• {cat.name}:</span>{' '}
                  <span className="font-normal">{(cat.skills || []).join(', ')}</span>
                </p>
              ))}
            </div>
          </section>
        ) : null;

      case 'custom':
        return customSections.length > 0 ? (
          <div key="custom-wrapper">
            {customSections.map(sec => (
              <section key={sec.id} className="mb-4">
                <SectionHeader title={sec.title} />
                <ul className={`list-none space-y-1 text-[9.5pt] leading-snug text-black ${isMinimal ? 'text-center' : 'pl-4'}`}>
                  {(sec.content || []).filter(line => line.trim()).map((line, idx) => (
                    <li key={idx} className="flex gap-2 items-start">
                      {!isMinimal && <span className="text-slate-800 font-bold mt-0.5">•</span>}
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div 
      style={{ 
        width, 
        minHeight,
        fontFamily: fontMain,
        padding: isClassic ? '10mm 15mm' : '18mm',
        backgroundColor: 'white',
        color: 'black'
      }} 
      className={`shadow-[0_0_100px_rgba(0,0,0,0.25)] print:shadow-none mx-auto transition-all relative ${isModern ? 'border-t-[14px] border-blue-600' : ''}`}
      id="resume-document"
    >
      <style dangerouslySetInnerHTML={{ __html: customCSS }} />
      
      {isClassic ? (
        <header className="mb-4 flex justify-between items-start border-b border-slate-300 pb-2">
          <div className="flex flex-col">
            <h1 className="text-[14pt] font-bold text-black tracking-wide leading-tight">{contact.fullName}</h1>
            <p className="text-[10pt] font-bold text-black leading-tight">{contact.professionalTitle}</p>
            <p className="text-[10pt] text-black leading-tight">{contact.location}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-[10pt] font-bold text-black leading-tight">{contact.email}</p>
            <p className="text-[10pt] font-bold text-black leading-tight">{contact.phone}</p>
            {(contact.portfolios || []).map(p => (
               <p key={p.id} className="text-[10pt] text-black leading-tight">
                 {data.contact.showFullLinks ? (
                    <a href={getFullUrl(p.url)} target="_blank" className="underline hover:text-blue-700">
                      {p.label}
                    </a>
                 ) : (
                    <span className="font-mono text-[9pt]">{p.url}</span>
                 )}
               </p>
            ))}
          </div>
        </header>
      ) : (
        <header className={`mb-10 resume-block break-inside-avoid ${isMinimal ? 'text-center border-b pb-10' : 'border-b pb-8'}`}>
          <div className={`flex ${isMinimal ? 'flex-col items-center' : 'justify-between items-start'}`}>
            <div className="flex-1">
              <h1 className={`font-black uppercase text-black leading-tight tracking-tighter ${isModern ? 'text-[36pt]' : isMinimal ? 'text-[30pt]' : 'text-[28pt]'}`}>
                {contact.fullName}
              </h1>
              <p className="text-[14pt] font-black text-blue-600 uppercase tracking-[0.25em] mt-2">{contact.professionalTitle}</p>
            </div>
            <div className={`text-[10pt] font-medium text-slate-700 flex flex-col ${isMinimal ? 'items-center mt-8' : 'items-end'}`}>
              <p className="font-black text-black text-[11pt] border-b-2 border-slate-100">{contact.email}</p>
              <p className="font-bold text-slate-600 mt-0.5">{contact.phone}</p>
              <div className={`flex gap-4 flex-wrap mt-3 ${isMinimal ? 'justify-center' : 'justify-end'}`}>
                {(contact.portfolios || []).map((p, i) => (
                  <React.Fragment key={p.id}>
                    {i > 0 && <span className="text-slate-300 font-light">|</span>}
                    <a 
                      href={getFullUrl(p.url)} 
                      target="_blank" 
                      className="text-blue-700 underline font-black hover:text-blue-900 transition-colors"
                    >
                      {data.contact.showFullLinks ? p.label : p.url}
                    </a>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </header>
      )}

      {sectionOrder.map(sectionId => renderSection(sectionId))}
      
    </div>
  );
};

export default ResumePreview;
