
import { ResumeData } from './types';

export const INITIAL_RESUME_DATA: ResumeData = {
  contact: {
    fullName: 'Himanshu Kushwaha',
    professionalTitle: 'Devops Engineer',
    email: 'example@gmail.com',
    phone: '+91-9XXXXXXXXX',
    location: 'abc university',
    linkedin: 'linkedin.com',
    github: '',
    portfolio: '',
    portfolios: [
      { id: 'p1', label: 'Linkedin', url: 'linkedin.com/in/g-b-linked' }
    ],
    showFullLinks: false
  },
  summary: 'A dedicated Computer Science student with experience in micro-services, full-stack development, and technical problem solving. Proven track record of successful project integration and academic excellence.',
  experience: [
    {
      id: 'exp1',
      company: 'Truminds Software Systems',
      role: 'Software Intern',
      location: '',
      startDate: 'May',
      endDate: 'Jul 2022',
      isCurrent: false,
      description: [
        'Coordinated in a team of four to program micro-services including NETCONF client, Configuration, and Performance Management Application as a part of the 5G Network Management Station.',
        'Developed a REST API and used NATS messaging to enable communication between various micro-services and using protocol buffers to serialize the data between different microservices.',
        'Integrated the distinct micro-services and deployed the project on cloud server by building Docker containers for all the applications along with working on technologies like InfluxDB and Kubernetes.'
      ]
    },
    {
      id: 'exp2',
      company: 'Toppr',
      role: 'Freelancer (Solution Writing Project)',
      location: '',
      startDate: 'Feb',
      endDate: 'Mar 2022',
      isCurrent: false,
      description: [
        'Successfully cleared the freelancer screening test conducted by Toppr for 100+ applicants from various colleges responsible for clarifying the doubts of school students of classes 11th and 12th.',
        'Solved 80+ chemistry problems from the study material of the grade of competitive exams consisting of multiple choice questions, and brief & long answer questions within 20 days.'
      ]
    }
  ],
  education: [
    {
      id: 'edu1',
      school: 'IIT Gandhinagar',
      degree: 'B.Tech',
      specialization: 'Computer Science & Engineering',
      result: '8.03',
      startDate: '2019',
      endDate: 'Present',
      description: ''
    },
    {
      id: 'edu2',
      school: 'ABC College',
      degree: 'B.tech',
      specialization: 'Physics, Chemistry, & Mathematics',
      result: '9.88',
      startDate: '2019',
      endDate: '2019',
      description: ''
    },
    {
      id: 'edu3',
      school: 'Abc College',
      degree: 'SSC CBSE',
      specialization: '-',
      result: '10.0',
      startDate: '2017',
      endDate: '2017',
      description: ''
    }
  ],
  projects: [
    {
      id: 'proj1',
      name: 'Data Analysis of World Inequality and the Pandemic',
      organization: 'Prof. Anirban Dasgupta',
      date: 'Mar-Apr 2022',
      technologies: [],
      link: '',
      description: [
        'Documented a comprehensive report on income, economic, and carbon inequalities interpreting raw datasets visually followed by drawing qualitative insights from the generated plots.',
        'Built a Computational Neural Network (CNN) model for Covid-19 detection through chest X-rays attaining 90% accuracy and analyzed correlations between registered deaths and health care centres.'
      ]
    },
    {
      id: 'proj2',
      name: 'MNIST Digit Detection using Verilog',
      organization: 'Prof. Joycee Mekie',
      date: 'Sept-Dec 2020',
      technologies: [],
      link: '',
      description: [
        'Programmed a CNN model in Vivado and Python to detect numbers in the MNIST data set based on the pixel values of the datapoints available as images through machine learning techniques.',
        'Developed the Adder, Multiplier, Neuron, Neural Layer, and Activation Function sub-models from scratch by taking input as floating point numbers and eventually integrated them to run the model.'
      ]
    }
  ],
  skillCategories: [
    {
      id: 's1',
      name: 'Languages',
      skills: ['Python', 'C', 'C++', 'Verilog (Beginner)', 'Go', 'MySQL', 'PostgreSQL']
    },
    {
      id: 's2',
      name: 'Tools',
      skills: ['Autodesk Inventor', 'Jupiter Notebook', 'LaTeX', 'VS Code', 'GitHub', 'Docker', 'VMware', 'Postman']
    }
  ],
  certifications: [],
  customSections: [
    {
      id: 'por1',
      title: 'POSITIONS OF RESPONSIBILITY',
      content: [
        'Organized Gully Cricket under Hallabol, the intra-college sports festival of IIT Gandhinagar, witnessing an overall footfall of 800+ participants.',
        'Led a team of four responsible for looking after scheduling of matches between 60+ registered teams, addressing logistical concerns, crowd management, and seamless execution of the event.'
      ]
    },
    {
      id: 'extra1',
      title: 'EXTRA-CURRICULAR ACHIEVEMENTS/ACTIVITIES',
      content: [
        'Secured first position in Gully Cricket and Dodgeball games out of 50+ teams as a part of Hallabol 2021.',
        'Secured a position in the Inter IIT Cricket Squad 2019 out of 50+ competing players from the institute.',
        'Captained a team in the Cricket Combat League 2022 and bagged runners-up position out of eight teams.'
      ]
    }
  ],
  sectionOrder: ['education', 'experience', 'projects', 'custom', 'skills'],
  customCSS: '',
  latexCode: '',
  languages: [],
  softSkills: [],
  interests: []
};
