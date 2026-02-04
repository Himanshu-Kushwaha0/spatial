
export interface Portfolio {
  id: string;
  label: string;
  url: string;
}

export interface ContactInfo {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  portfolios: Portfolio[];
  showFullLinks: boolean;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  specialization: string;
  result: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  organization: string; // e.g., "Prof. Anirban Dasgupta" or "Finlatics"
  date: string;         // e.g., "Mar-Apr 2022"
  technologies: string[];
  link: string;
  description: string[];
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string[];
}

export type SectionType = 'education' | 'experience' | 'projects' | 'skills' | 'certifications' | 'summary' | 'custom';

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skillCategories: SkillCategory[];
  certifications: Certification[];
  customSections: CustomSection[];
  sectionOrder: SectionType[];
  customCSS: string;
  latexCode: string;
  languages: string[];
  softSkills: string[];
  interests: string[];
}

export enum ResumeTemplate {
  MODERN = 'Modern',
  MINIMAL = 'Minimal',
  CLASSIC = 'Classic'
}

export enum ResumeOrientation {
  PORTRAIT = 'Portrait',
  LANDSCAPE = 'Landscape'
}

export interface TailoredResumeResponse {
  optimizedSummary: string;
  optimizedSkills: SkillCategory[];
  optimizedExperience: { id: string, tailoredBullets: string[] }[];
  matchScore: number;
  missingKeywords: string[];
}
