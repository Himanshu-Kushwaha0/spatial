
export interface Portfolio {
  id: string;
  label: string;
  url: string;
}

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  portfolios: Portfolio[];
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
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
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

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skillCategories: SkillCategory[];
  certifications: Certification[];
  languages: string[];
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

export interface AIAnalysisRequest {
  resumeData: ResumeData;
  jobDescription?: string;
  targetRole?: string;
  targetCompany?: string;
  focusTransferable?: boolean;
}

export interface TailoredResumeResponse {
  optimizedSummary: string;
  optimizedSkills: SkillCategory[];
  optimizedExperience: { id: string, tailoredBullets: string[] }[];
  matchScore: number;
  missingKeywords: string[];
}
