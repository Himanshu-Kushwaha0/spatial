
import React from 'react';
import { ResumeData, ResumeTemplate, ResumeOrientation } from '../types';

interface ResumePreviewProps {
  data: ResumeData;
  template: ResumeTemplate;
  orientation: ResumeOrientation;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, template, orientation }) => {
  const { contact, summary, experience, education, skillCategories, certifications, languages } = data;

  const isModern = template === ResumeTemplate.MODERN;
  const isMinimal = template === ResumeTemplate.MINIMAL;
  const isClassic = template === ResumeTemplate.CLASSIC;
  const isLandscape = orientation === ResumeOrientation.LANDSCAPE;

  const width = isLandscape ? '1056px' : '816px';
  const minHeight = isLandscape ? '816px' : '1056px';

  // ATS-Safe Font Stacks
  const sansFont = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const serifFont = 'Georgia, "Times New Roman", Times, serif';
  const currentFont = isClassic ? serifFont : sansFont;

  // Template-based Styles
  const containerClasses = `bg-white relative mx-auto print:shadow-none no-print:shadow-xl p-12 flex flex-col transition-all duration-300 print:p-12 print:m-0 print:w-full ${
    isModern ? "border-t-[12px] border-blue-600" : ""
  }`;

  const nameClasses = `font-bold tracking-tight text-black ${
    isMinimal ? "text-3xl text-center uppercase tracking-[0.2em] font-light mb-2" : 
    isModern ? "text-4xl font-black mb-1 text-blue-900" : 
    "text-3xl border-b-2 border-black pb-1 mb-2"
  }`;

  const contactBarClasses = `flex flex-wrap gap-x-4 gap-y-1 text-[10pt] text-gray-700 font-medium mb-6 ${
    isMinimal ? "justify-center border-b pb-4" : ""
  }`;

  const sectionHeaderClasses = `text-[11pt] font-bold uppercase tracking-wider mb-3 mt-6 pb-1 ${
    isModern ? "text-blue-700 border-l-4 border-blue-600 pl-3 bg-blue-50/50" : 
    isMinimal ? "text-center text-gray-400 border-b border-gray-100 py-1" : 
    "border-b border-black text-black"
  }`;

  return (
    <div style={{ width, minHeight, fontFamily: currentFont }} className={containerClasses}>
      {/* Header Section */}
      <header className={isMinimal ? "mb-8" : "mb-4"}>
        <h1 className={nameClasses}>{contact.fullName}</h1>
        <div className={contactBarClasses}>
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>{contact.phone}</span>}
          {contact.location && <span>{contact.location}</span>}
          {contact.linkedin && <span className="text-blue-700 underline">LinkedIn</span>}
          {contact.github && <span className="text-blue-700 underline">GitHub</span>}
        </div>
      </header>

      <div className="flex-1">
        {/* Summary */}
        {summary && (
          <section className="mb-6">
            <h2 className={sectionHeaderClasses}>Professional Summary</h2>
            <p className={`text-[10.5pt] leading-relaxed text-gray-800 ${isMinimal ? 'text-center italic' : ''}`}>
              {summary}
            </p>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className="mb-6">
            <h2 className={sectionHeaderClasses}>Experience</h2>
            <div className="space-y-6">
              {experience.map((exp) => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`font-bold text-[11pt] ${isModern ? 'text-blue-900' : 'text-black'}`}>
                      {exp.role} <span className="font-normal text-gray-500">at</span> {exp.company}
                    </h3>
                    <span className="text-[9.5pt] font-bold text-gray-600">{exp.startDate} – {exp.endDate}</span>
                  </div>
                  <div className="text-[9pt] text-gray-500 font-bold uppercase tracking-wide mb-2">{exp.location}</div>
                  <ul className="list-disc ml-5 space-y-1.5 text-gray-800 text-[10pt]">
                    {exp.description.filter(d => d.trim()).map((point, idx) => (
                      <li key={idx} className="leading-snug">{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skillCategories.length > 0 && (
          <section className="mb-6">
            <h2 className={sectionHeaderClasses}>Skills & Competencies</h2>
            <div className={`grid gap-2 ${isLandscape ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {skillCategories.map((cat) => (
                <div key={cat.id} className="text-[10pt]">
                  <strong className={`${isModern ? 'text-blue-800' : 'text-black'}`}>{cat.name}:</strong> 
                  <span className="text-gray-800 ml-1">{cat.skills.join(', ')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="mb-6">
            <h2 className={sectionHeaderClasses}>Education</h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="break-inside-avoid flex justify-between">
                  <div>
                    <h3 className={`font-bold text-[10.5pt] ${isModern ? 'text-blue-900' : 'text-black'}`}>{edu.degree}</h3>
                    <div className="text-[10pt] text-gray-700 italic">{edu.school}, {edu.location}</div>
                  </div>
                  <div className="text-[9.5pt] font-bold text-gray-600">{edu.startDate} – {edu.endDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certs & Languages Grid */}
        <div className={`grid ${isLandscape ? 'grid-cols-2 gap-x-12' : 'grid-cols-1 gap-y-6'}`}>
          {certifications.length > 0 && (
            <section>
              <h2 className={sectionHeaderClasses}>Certifications</h2>
              <ul className="list-disc ml-5 text-[10pt] text-gray-800 space-y-1">
                {certifications.map((cert) => (
                  <li key={cert.id}><span className="font-bold">{cert.name}</span> — {cert.issuer}</li>
                ))}
              </ul>
            </section>
          )}

          {languages.length > 0 && (
            <section>
              <h2 className={sectionHeaderClasses}>Languages</h2>
              <p className="text-[10pt] text-gray-800 font-medium">{languages.join(', ')}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
