
import { ResumeData } from './types';

export const INITIAL_RESUME_DATA: ResumeData = {
  contact: {
    fullName: 'Himanshu Kushwaha',
    professionalTitle: 'DevOps Engineer',
    email: 'himanshukushwaha@example.com',
    phone: '+91-9XXXXXXXXX',
    location: 'ABC University, India',
    linkedin: 'linkedin.com/in/himanshu-kushwaha',
    github: 'github.com/himanshu',
    portfolio: '',
    portfolios: [
      { id: 'p1', label: 'LinkedIn', url: 'linkedin.com/in/himanshu-kushwaha' },
      { id: 'p2', label: 'GitHub', url: 'github.com/himanshu' }
    ],
    showFullLinks: true
  },
  summary: 'Detail-oriented DevOps Engineer with a focus on automating cloud infrastructure and streamlining CI/CD pipelines. Experienced in Kubernetes, Docker, and cloud-native solutions to optimize software delivery and reliability.',
  experience: [
    {
      id: 'exp1',
      company: 'Tech Solutions Corp',
      role: 'DevOps Intern',
      location: 'Remote',
      startDate: 'May 2023',
      endDate: 'Aug 2023',
      isCurrent: false,
      description: [
        'Automated deployment processes using Jenkins and GitLab CI, reducing manual intervention by 40%.',
        'Managed containerized applications across multiple clusters using Kubernetes and Helm.',
        'Implemented monitoring and alerting systems using Prometheus and Grafana for high-availability services.'
      ]
    }
  ],
  education: [
    {
      id: 'edu1',
      school: 'ABC University',
      degree: 'B.Tech',
      specialization: 'Computer Science & Engineering',
      result: '8.5 CGPA',
      startDate: '2020',
      endDate: '2024',
      description: ''
    }
  ],
  projects: [
    {
      id: 'proj1',
      name: 'Cloud Infrastructure Automation',
      organization: 'Academic Project',
      date: 'Jan-May 2023',
      technologies: ['Terraform', 'AWS', 'Ansible'],
      link: '',
      description: [
        'Designed and deployed scalable AWS infrastructure using Terraform modules for consistent environment provisioning.',
        'Configured automated security patching and configuration management via Ansible playbooks.'
      ]
    }
  ],
  skillCategories: [
    {
      id: 's1',
      name: 'Cloud & DevOps',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Ansible', 'Git']
    },
    {
      id: 's2',
      name: 'Languages',
      skills: ['Python', 'Bash', 'Go', 'SQL']
    }
  ],
  certifications: [],
  customSections: [
    {
      id: 'ach1',
      title: 'ACHIEVEMENTS',
      content: [
        'Winner of University Hackathon 2023 for Cloud Optimization category.',
        'Certified AWS Solutions Architect - Associate.'
      ]
    }
  ],
  sectionOrder: ['summary', 'education', 'experience', 'projects', 'skills', 'custom'],
  customCSS: '',
  latexCode: '',
  languages: [],
  softSkills: [],
  interests: []
};
