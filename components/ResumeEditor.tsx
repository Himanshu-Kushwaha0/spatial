
import React, { useState } from 'react';
import { ResumeData, ContactInfo, Experience, Education, Project, SkillCategory, Certification, Portfolio } from '../types';
import CodeEditor from './CodeEditor';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

enum EditorTab {
  CONTACT = 'Contact',
  SUMMARY = 'Summary',
  EXPERIENCE = 'Work',
  EDUCATION = 'Education',
  EXTRAS = 'Extras',
  CODE = 'Developer'
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<EditorTab>(EditorTab.CONTACT);

  const updateContact = (updates: Partial<ContactInfo>) => {
    onChange({ ...data, contact: { ...data.contact, ...updates } });
  };

  const updateSummary = (summary: string) => {
    onChange({ ...data, summary });
  };

  const updateItem = <T extends { id: string }>(key: keyof ResumeData, id: string, updates: Partial<T>) => {
    const list = data[key] as T[];
    onChange({
      ...data,
      [key]: list.map(item => item.id === id ? { ...item, ...updates } : item)
    });
  };

  const removeItem = (key: keyof ResumeData, id: string) => {
    const list = data[key] as { id: string }[];
    onChange({ ...data, [key]: list.filter(item => item.id !== id) });
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Math.random().toString(36).substr(2, 9),
      company: '', role: '', location: '', startDate: '', endDate: '', isCurrent: false, description: ['']
    };
    onChange({ ...data, experience: [...data.experience, newExp] });
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Math.random().toString(36).substr(2, 9),
      school: '', degree: '', location: '', startDate: '', endDate: '', description: ''
    };
    onChange({ ...data, education: [...data.education, newEdu] });
  };

  const addCertification = () => {
    const newCert: Certification = {
      id: Math.random().toString(36).substr(2, 9),
      name: '', issuer: '', date: ''
    };
    onChange({ ...data, certifications: [...data.certifications, newCert] });
  };

  const tabs = Object.values(EditorTab);
  const inputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white p-2 border text-sm text-gray-900 outline-none transition-shadow hover:shadow-md";

  if (activeTab === EditorTab.CODE) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex border-b overflow-x-auto bg-white sticky top-0 z-10 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === EditorTab.CODE ? '{ } Code' : tab}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden">
          <CodeEditor data={data} onChange={onChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex border-b overflow-x-auto bg-white sticky top-0 z-10 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab === EditorTab.CODE ? '{ } Code' : tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === EditorTab.CONTACT && (
          <section className="animate-in fade-in slide-in-from-left-2 duration-200">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                <input type="text" className={inputClasses} value={data.contact.fullName} onChange={(e) => updateContact({ fullName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Email</label>
                  <input type="email" className={inputClasses} value={data.contact.email} onChange={(e) => updateContact({ email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Phone</label>
                  <input type="text" className={inputClasses} value={data.contact.phone} onChange={(e) => updateContact({ phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Location</label>
                <input type="text" className={inputClasses} value={data.contact.location} onChange={(e) => updateContact({ location: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">LinkedIn</label>
                  <input type="text" className={inputClasses} value={data.contact.linkedin} onChange={(e) => updateContact({ linkedin: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">GitHub</label>
                  <input type="text" className={inputClasses} value={data.contact.github} onChange={(e) => updateContact({ github: e.target.value })} />
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === EditorTab.SUMMARY && (
          <section className="animate-in fade-in slide-in-from-left-2 duration-200">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Professional Summary</h2>
            <textarea rows={12} className={inputClasses} value={data.summary} onChange={(e) => updateSummary(e.target.value)} placeholder="Summary..." />
          </section>
        )}

        {activeTab === EditorTab.EXPERIENCE && (
          <section className="animate-in fade-in slide-in-from-left-2 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Work Experience</h2>
              <button onClick={addExperience} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md font-semibold hover:bg-blue-700">+ Add Role</button>
            </div>
            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id} className="p-4 bg-white rounded-lg border relative shadow-sm hover:shadow-md transition-shadow">
                  <button onClick={() => removeItem('experience', exp.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Company</label>
                      <input type="text" className={inputClasses} value={exp.company} onChange={(e) => updateItem<Experience>('experience', exp.id, { company: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Role</label>
                      <input type="text" className={inputClasses} value={exp.role} onChange={(e) => updateItem<Experience>('experience', exp.id, { role: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Location</label>
                      <input type="text" className={inputClasses} value={exp.location} onChange={(e) => updateItem<Experience>('experience', exp.id, { location: e.target.value })} />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <input type="checkbox" id={`curr-${exp.id}`} checked={exp.isCurrent} onChange={(e) => updateItem<Experience>('experience', exp.id, { isCurrent: e.target.checked, endDate: e.target.checked ? 'Present' : exp.endDate })} />
                      <label htmlFor={`curr-${exp.id}`} className="text-xs font-medium text-gray-600">Currently work here</label>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Start Date</label>
                      <input type="text" className={inputClasses} value={exp.startDate} onChange={(e) => updateItem<Experience>('experience', exp.id, { startDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">End Date</label>
                      <input type="text" className={inputClasses} value={exp.endDate} onChange={(e) => updateItem<Experience>('experience', exp.id, { endDate: e.target.value })} placeholder="Present" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Tasks (Line per point)</label>
                      <textarea rows={4} className={inputClasses} value={exp.description.join('\n')} onChange={(e) => updateItem<Experience>('experience', exp.id, { description: e.target.value.split('\n') })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === EditorTab.EDUCATION && (
          <section className="animate-in fade-in slide-in-from-left-2 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Education</h2>
              <button onClick={addEducation} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md font-semibold hover:bg-blue-700">+ Add Education</button>
            </div>
            {data.education.map((edu) => (
              <div key={edu.id} className="p-4 bg-white rounded-lg border mb-4 relative shadow-sm">
                <button onClick={() => removeItem('education', edu.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">School</label><input type="text" className={inputClasses} value={edu.school} onChange={(e) => updateItem<Education>('education', edu.id, { school: e.target.value })} /></div>
                  <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Degree</label><input type="text" className={inputClasses} value={edu.degree} onChange={(e) => updateItem<Education>('education', edu.id, { degree: e.target.value })} /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase">Start Date</label><input type="text" className={inputClasses} value={edu.startDate} onChange={(e) => updateItem<Education>('education', edu.id, { startDate: e.target.value })} /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase">End Date</label><input type="text" className={inputClasses} value={edu.endDate} onChange={(e) => updateItem<Education>('education', edu.id, { endDate: e.target.value })} /></div>
                </div>
              </div>
            ))}
          </section>
        )}

        {activeTab === EditorTab.EXTRAS && (
          <section className="animate-in fade-in slide-in-from-left-2 duration-200 space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Certifications</h2>
                <button onClick={addCertification} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md font-semibold hover:bg-blue-700">+ Add</button>
              </div>
              {data.certifications.map((cert) => (
                <div key={cert.id} className="p-4 bg-white rounded-lg border mb-3 relative shadow-sm">
                  <button onClick={() => removeItem('certifications', cert.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Name</label><input type="text" className={inputClasses} value={cert.name} onChange={(e) => updateItem<Certification>('certifications', cert.id, { name: e.target.value })} /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Issuer</label><input type="text" className={inputClasses} value={cert.issuer} onChange={(e) => updateItem<Certification>('certifications', cert.id, { issuer: e.target.value })} /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Year</label><input type="text" className={inputClasses} value={cert.date} onChange={(e) => updateItem<Certification>('certifications', cert.id, { date: e.target.value })} /></div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Languages</h2>
              <input type="text" className={inputClasses} placeholder="English, French, Hindi..." value={data.languages.join(', ')} onChange={(e) => onChange({ ...data, languages: e.target.value.split(',').map(l => l.trim()) })} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ResumeEditor;
