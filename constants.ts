
import { ResumeData } from './types';

export const INITIAL_RESUME_DATA: ResumeData = {
  contact: {
    fullName: 'Himanshu Kushwaha',
    professionalTitle: 'DevOps Engineer',
    email: 'himanshu@example.com',
    phone: '+91-XXXXXXXXXX',
    location: 'India',
    linkedin: 'linkedin.com/in/himanshu-kushwaha',
    github: 'github.com/himanshu-kushwaha',
    portfolio: '',
    portfolios: [
      { id: 'l1', label: 'LinkedIn', url: 'linkedin.com/in/himanshu-kushwaha' },
      { id: 'l2', label: 'GitHub', url: 'github.com/himanshu-kushwaha' }
    ],
    showFullLinks: false
  },
  summary: 'Detail-oriented DevOps Engineer with a strong foundation in cloud infrastructure and automation. Experienced in micro-services, CI/CD pipelines, and containerization using Docker and Kubernetes. Passionate about optimizing system performance and reliability.',
  experience: [
    {
      id: 'exp1',
      company: 'Tech Solutions Corp',
      role: 'DevOps Intern',
      location: '',
      startDate: 'May',
      endDate: 'Jul 2024',
      isCurrent: false,
      description: [
        'Automated deployment processes using Jenkins and GitHub Actions, reducing deployment time by 40%.',
        'Managed cloud infrastructure on AWS, including EC2, S3, and RDS instances using Terraform.',
        'Implemented monitoring and alerting systems using Prometheus and Grafana for critical services.'
      ]
    }
  ],
  education: [
    {
      id: 'edu1',
      school: 'AKS University',
      degree: 'B.Tech',
      specialization: 'Computer Science & Engineering',
      result: '8.5 CGPA',
      startDate: '2021',
      endDate: 'Present',
      description: ''
    }
  ],
  projects: [
    {
      id: 'proj1',
      name: 'Kubernetes Cluster Automation',
      organization: 'Self-Project',
      date: 'Jan-Mar 2024',
      technologies: ['Kubernetes', 'Ansible', 'Terraform'],
      link: '',
      description: [
        'Developed Ansible playbooks to provision a high-availability Kubernetes cluster on bare-metal servers.',
        'Configured MetalLB and Ingress-NGINX for load balancing and external traffic management.'
      ]
    }
  ],
  skillCategories: [
    {
      id: 's1',
      name: 'DevOps & Tools',
      skills: ['Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'AWS', 'Linux']
    },
    {
      id: 's2',
      name: 'Languages',
      skills: ['Python', 'Bash', 'YAML', 'SQL']
    }
  ],
  certifications: [],
  customSections: [
    {
      id: 'pos1',
      title: 'POSITIONS OF RESPONSIBILITY',
      content: [
        'Lead Coordinator for University Tech Fest, managing a team of 15 members and overseeing technical workshops.',
        'Active member of the open-source community, contributing to various DevOps tools and documentation.'
      ]
    }
  ],
  sectionOrder: ['summary', 'education', 'experience', 'projects', 'custom', 'skills'],
  customCSS: '',
  latexCode: '',
  languages: [],
  softSkills: [],
  interests: []
};
