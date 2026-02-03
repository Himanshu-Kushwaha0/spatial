
import React from 'react';
import { ResumeData, ResumeTemplate, ResumeOrientation } from '../types';

interface ResumePreviewProps {
  data: ResumeData;
  template: ResumeTemplate;
  orientation: ResumeOrientation;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, template, orientation }) => {
  const { contact, summary, experience, education, projects, skillCategories, certifications, customSections, sectionOrder, customCSS } = data;

  const isClassic = template === ResumeTemplate.CLASSIC;
  const isModern = template === ResumeTemplate.MODERN;
  const isMinimal = template === ResumeTemplate.MINIMAL;
  const isLandscape = orientation === ResumeOrientation.LANDSCAPE;

  const width = isLandscape ? '297mm' : '210mm';
  const minHeight = isLandscape ? '210mm' : '297mm';

  // Specific font-family for Classic (Academic) feel
  const fontMain = isClassic ? "'Inter', sans-serif" : (isMinimal ? "'Inter', sans-serif" : "'Inter', sans-serif");

  const SectionHeader = ({ title }: { title: string }) => {
    if (isClassic) {
      return (
        <div className="bg-[#bdbdbd] px-2 py-0.5 mb-2 mt-4 print:bg-[#bdbdbd] -mx-0">
          <h2 className="text-[10pt] font-bold uppercase tracking-wider text-black">
            {title}
          </h2>
        </div>
      );
    }
    if (isMinimal) {
      return (
        <div className="flex flex-col items-center mb-4 mt-8">
           <h2 className="text-[10pt] font-light uppercase tracking-[0.4em] text-slate-500">{title}</h2>
           <div className="h-[1px] w-12 bg-slate-300 mt-1" />
        </div>
      );
    }
    // Modern
    return (
      <h2 className="text-[11pt] font-black uppercase tracking-widest text-blue-600 mb-3 mt-6 flex items-center gap-4">
        {title}
        <span className="flex-1 h-[2px] bg-blue-50" />
      </h2>
    );
  };

  const renderLink = (label: string, url: string) => {
    if (!url) return null;
    const displayValue = data.contact.showFullLinks ? url : label;
    const href = url.startsWith('http') ? url : `https://${url}`;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-800 underline print:no-underline print:text-black">
        {displayValue}
      </a>
    );
  };

  const renderSection = (type: string) => {
    switch (type) {
      case 'summary':
        return summary ? (
          <section key="summary" className="mb-3 break-inside-avoid">
            <SectionHeader title="Objective" />
            <p className={`text-[9.5pt] leading-relaxed text-black pl-1 whitespace-pre-wrap ${isMinimal ? 'text-center italic' : ''}`}>
              {summary}
            </p>
          </section>
        ) : null;
      
      case 'education':
        return education.length > 0 ? (
          <section key="education" className="mb-3 break-inside-avoid">
            <SectionHeader title="Education" />
            {isClassic ? (
              <table className="w-full text-[9.5pt] border-collapse mb-1 text-black">
                <thead>
                  <tr className="border-b-[1.5px] border-black text-left">
                    <th className="py-0.5 font-bold">Degree</th>
                    <th className="py-0.5 font-bold">Specialization</th>
                    <th className="py-0.5 font-bold">Institute</th>
                    <th className="py-0.5 font-bold">Year</th>
                    <th className="py-0.5 font-bold text-right">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {education.map(edu => (
                    <tr key={edu.id} className="border-b-[0.5px] border-slate-200">
                      <td className="py-1 pr-2 font-medium">{edu.degree}</td>
                      <td className="py-1 pr-2 italic font-serif text-[9pt]">{edu.specialization}</td>
                      <td className="py-1 pr-2">{edu.school}</td>
                      <td className="py-1 pr-2">{edu.startDate}-{edu.endDate}</td>
                      <td className="py-1 text-right font-medium">{edu.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={`space-y-3 ${isMinimal ? 'text-center' : ''}`}>
                {education.map(edu => (
                  <div key={edu.id} className="flex justify-between items-baseline">
                    <div className="text-left">
                      <span className="font-bold text-[10pt] uppercase">{edu.degree}</span>
                      <p className="text-slate-600 italic text-[9pt]">{edu.school} | {edu.specialization}</p>
                    </div>
                    <div className="text-right">
                       <span className="text-slate-500 text-[9pt]">{edu.startDate}-{edu.endDate}</span>
                       <p className="font-bold text-blue-600 text-[9pt]">{edu.result}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null;

      case 'experience':
        return experience.length > 0 ? (
          <section key="experience" className="mb-3">
            <SectionHeader title="Work Experience" />
            <div className="space-y-3">
              {experience.map(exp => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className={`flex justify-between items-baseline mb-0.5 ${isMinimal ? 'flex-col items-center' : ''}`}>
                    <h3 className="text-[10pt] font-bold text-black">
                      • {exp.role} <span className="font-normal text-slate-600">[{exp.company}]</span>
                    </h3>
                    <span className="text-[9pt] font-medium text-slate-700 italic">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <ul className={`list-none space-y-0.5 text-[9.5pt] leading-snug text-black mt-1 ${isMinimal ? 'text-center pl-0' : 'pl-4'}`}>
                    {exp.description.filter(d => d.trim()).map((point, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        {!isMinimal && <span className="text-[12pt] leading-[14pt]">◦</span>}
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
          <section key="projects" className="mb-3">
            <SectionHeader title="Projects" />
            <div className="space-y-3">
              {projects.map(proj => (
                <div key={proj.id} className="break-inside-avoid">
                  <div className={`flex justify-between items-baseline mb-0.5 ${isMinimal ? 'flex-col items-center' : ''}`}>
                    <h3 className="text-[10pt] font-bold text-black">
                      • {proj.name} <span className="font-normal text-slate-600">[{proj.organization}]</span>
                    </h3>
                    <span className="text-[9pt] font-medium text-slate-700 italic">{proj.date}</span>
                  </div>
                  <ul className={`list-none space-y-0.5 text-[9.5pt] leading-snug text-black mt-1 ${isMinimal ? 'text-center pl-0' : 'pl-4'}`}>
                    {proj.description.filter(d => d.trim()).map((d, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        {!isMinimal && <span className="text-[12pt] leading-[14pt]">◦</span>}
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
        return skillCategories.length > 0 ? (
          <section key="skills" className="mb-3 break-inside-avoid">
            <SectionHeader title="Technical Skills" />
            <div className={`space-y-0.5 pl-1 text-black ${isMinimal ? 'text-center' : ''}`}>
              {skillCategories.map(cat => (
                <p key={cat.id} className="text-[9.5pt]">
                  <span className="font-bold uppercase tracking-tighter">• {cat.name}:</span>{' '}
                  {cat.skills.join(', ')}
                </p>
              ))}
            </div>
          </section>
        ) : null;

      case 'certifications':
        return certifications.length > 0 ? (
          <section key="certifications" className="mb-3 break-inside-avoid">
            <SectionHeader title="Certifications" />
            <div className={`space-y-1 pl-1 text-black ${isMinimal ? 'text-center' : ''}`}>
              {certifications.map(cert => (
                <div key={cert.id} className="flex justify-between items-baseline">
                   <p className="text-[9.5pt] font-medium">
                     • {cert.name} <span className="text-slate-500">({cert.issuer})</span>
                   </p>
                   <span className="text-[9pt] text-slate-500">{cert.date}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null;

      case 'custom':
        return customSections.length > 0 ? (
          <div key="custom-wrapper">
            {customSections.map(sec => (
              <section key={sec.id} className="mb-3 break-inside-avoid">
                <SectionHeader title={sec.title} />
                <ul className={`list-none space-y-1 text-[9.5pt] leading-snug text-black ${isMinimal ? 'text-center pl-0' : 'pl-4'}`}>
                  {sec.content.filter(line => line.trim()).map((line, idx) => (
                    <li key={idx} className="flex gap-2 items-start">
                      {!isMinimal && <span className="text-black font-bold">•</span>}
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
        padding: '12mm 15mm',
        backgroundColor: 'white',
        color: 'black'
      }} 
      className={`shadow-[0_0_80px_rgba(0,0,0,0.1)] print:shadow-none mx-auto transition-all overflow-visible print:m-0 relative ${isModern ? 'border-t-[10px] border-blue-600' : ''}`}
      id="resume-document"
    >
      <style dangerouslySetInnerHTML={{ __html: customCSS }} />
      
      {/* HEADER */}
      <header className={`mb-4 ${isMinimal ? 'text-center border-b pb-6' : ''}`}>
        <div className={`flex ${isMinimal ? 'flex-col items-center' : 'justify-between items-start'}`}>
          <div className="flex-1">
            <h1 className={`font-black uppercase text-black leading-tight ${isModern ? 'text-[24pt] tracking-tighter' : 'text-[18pt]'}`}>
              {contact.fullName}
            </h1>
            <p className="text-[11pt] font-bold text-slate-800">{contact.professionalTitle}</p>
            <p className="text-[10pt] font-medium text-slate-700">{contact.location}</p>
          </div>
          <div className={`${isMinimal ? 'mt-4' : 'text-right'} text-[10pt] font-medium text-slate-800 flex flex-col items-end`}>
            {contact.email && <p className="font-bold">{contact.email}</p>}
            {contact.phone && <p>{contact.phone}</p>}
            <div className="flex gap-2 flex-wrap justify-end">
              {contact.portfolios?.map((p, i) => (
                <React.Fragment key={p.id}>
                  {i > 0 && <span>|</span>}
                  {renderLink(p.label, p.url)}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* RENDER BY ORDER */}
      {sectionOrder.map(sectionId => renderSection(sectionId))}
      
    </div>
  );
};

export default ResumePreview;
