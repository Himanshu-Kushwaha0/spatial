
import { ResumeData } from './types';

export const INITIAL_RESUME_DATA: ResumeData = {
  contact: {
    fullName: 'Himanshu Kushwaha',
    email: 'kushwahahimanshu57@gmail.com',
    phone: '+91 7999916500',
    location: 'Gandhinagar, Gujarat',
    linkedin: 'linkedin.com/in/himanshu-kushwaha0',
    github: 'github.com/Himanshu-Kushwaha0',
    portfolio: 'portfolio-repo',
    portfolios: [
      { id: 'p1', label: 'Portfolio', url: 'portfolio-repo' }
    ]
  },
  summary: 'Highly motivated DevOps Engineer with proven hands-on experience from a 6-month internship at BISAG-N. Demonstrated expertise in CI/CD pipelines, containerization, and infrastructure automation.',
  experience: [
    {
      id: '1',
      company: 'BISAG-N (Government of India institute)',
      role: 'DevOps Intern',
      location: 'Gandhinagar, Gujarat',
      startDate: 'Jan 2025',
      endDate: 'Jun 2025',
      isCurrent: true,
      description: [
        'Designed and implemented production-grade CI/CD pipelines using Jenkins.',
        'Containerized multi-component applications using Docker and Kubernetes.',
        'Automated deployment workflows leveraging ArgoCD with GitOps principles.',
        'Established comprehensive monitoring dashboards utilizing Prometheus and Grafana.'
      ]
    },
    {
      id: '2',
      company: 'Rostris Verse Pvt. Ltd.',
      role: 'DevOps Intern',
      location: 'Remote',
      startDate: 'Dec 2024',
      endDate: 'Jun 2025',
      isCurrent: false,
      description: [
        'Supported CI/CD automation initiatives using Jenkins and Docker.',
        'Deployed and validated workloads on Kubernetes (Minikube).',
        'Implemented service monitoring using Prometheus and Grafana.'
      ]
    }
  ],
  education: [
    {
      id: 'e1',
      school: 'JNCT (RGPV Bhopal)',
      degree: 'M.Tech in Computer Science & Engineering',
      location: 'Bhopal',
      startDate: 'Jul 2025',
      endDate: 'Jun 2027',
      description: ''
    },
    {
      id: 'e2',
      school: 'Aks University',
      degree: 'B.Tech in Computer Science & Engineering',
      location: 'Satna',
      startDate: 'Jul 2021',
      endDate: 'Jun 2025',
      description: ''
    }
  ],
  projects: [
    {
      id: 'p1',
      name: 'Webmaster',
      technologies: ['Vite', 'React', 'Node.js', 'AWS EC2', 'Docker', 'Kubernetes'],
      link: 'github.com/Himanshu-Kushwaha0/Webmaster',
      description: [
        'Provisioned and managed AWS EC2 infrastructure using AWS CLI.',
        'Built comprehensive CI/CD automation pipeline using Jenkins and GitHub Actions.',
        'Dockerized application and deployed on EC2 with NGINX reverse proxy.'
      ]
    }
  ],
  skillCategories: [
    {
      id: 's1',
      name: 'CI/CD & Automation',
      skills: ['Jenkins', 'GitHub Actions', 'ArgoCD', 'Git/GitHub']
    },
    {
      id: 's2',
      name: 'Orchestration',
      skills: ['Docker', 'Kubernetes', 'Istio', 'Kiali']
    },
    {
      id: 's3',
      name: 'Cloud & Infrastructure',
      skills: ['AWS EC2', 'AWS IAM', 'Terraform', 'Ansible']
    }
  ],
  certifications: [
    {
      id: 'c1',
      name: 'Java Programming Certification',
      issuer: 'Accenture (Anudip Foundation)',
      date: '2024'
    },
    {
      id: 'c2',
      name: 'Red Hat System Administration',
      issuer: 'Red Hat',
      date: '2024'
    }
  ],
  languages: ['Hindi', 'English', 'Odia (Proficient)']
};
