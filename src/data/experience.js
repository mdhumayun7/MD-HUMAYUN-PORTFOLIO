// ===========================================================================
//  EXPERIENCE & EDUCATION — one array, one timeline, newest first.
//
//  type      required  'work' | 'education'
//  role      required  job title, or the degree
//  org       required  company, or institution
//  period    required
//  location  optional
//  guide     optional  supervisor / advisor, shown for research entries
//  bullets   optional  array of strings
//  tech      optional  array of strings, shown as small chips
// ===========================================================================

export const experience = [
  {
    type: 'work',
    role: 'Teaching Assistant',
    org: 'Sardar Vallabhbhai National Institute of Technology (SVNIT Surat)',
    period: 'Sep 2025 - Present',
    location: 'Surat, India',
    bullets: [
      'Teaching assistant for Computer Networks, Algorithms and Data Structures, Programming Fundamentals, Social Network Analysis and Machine Learning.',
    ],
  },
  {
    type: 'work',
    role: 'Research Intern — Hybrid AI-Based Autonomous Drone Swarm Navigation',
    org: 'MeitY (Ministry of Electronics & IT), Govt. of India — sponsored project at SVNIT Surat',
    period: 'May 2026 - Jul 2026',
    location: 'Surat, India',
    guide: 'Prof. Mukesh A. Zaveri',
    bullets: [
      'Built an end-to-end drone swarm command framework generating synthetic urban scenarios in Blender and auto-labelling them through an LLM annotation stage.',
      'Designed BattleWorld, a multi-agent simulator wrapped as a Gymnasium environment with a uniform 12-dimensional state interface shared by every decision module.',
      'Fine-tuned an LLM with LoRA on generated tactical labels, reaching 91.2% mean token accuracy at 0.463 training loss.',
      'Benchmarked seven commander architectures across 28 held-out scenarios; the hybrid LLM+PPO controller reached 67.9% action accuracy against 60.7% for the best classical baseline.',
    ],
    tech: ['Python', 'Blender', 'LoRA', 'PPO', 'Gymnasium'],
  },
  {
    type: 'education',
    role: 'M.Tech in Computer Science — Information Security & Privacy',
    org: 'Sardar Vallabhbhai National Institute of Technology (SVNIT Surat)',
    period: '2025 - Present',
    location: 'Surat, Gujarat',
    bullets: ['CPI 8.70 / 10'],
  },
  {
    type: 'work',
    role: 'Salesforce Developer Intern',
    org: 'DST (Digital Skills Training)',
    period: 'Dec 2023 - Jan 2024',
    location: 'Remote',
    bullets: [
      'Developed Apex triggers and automated workflows in OOP-based backend logic, cutting manual data-entry overhead by 35%.',
      'Customised KPI dashboards for 5+ cross-functional teams, surfacing lead conversion and pipeline stage metrics in place of manually compiled weekly reports.',
    ],
    tech: ['Apex', 'Salesforce CRM'],
  },
  {
    type: 'work',
    role: 'Ethical Hacking Intern',
    org: 'IIIT Allahabad',
    period: 'Jan 2023 - Feb 2023',
    location: 'Remote',
    bullets: [
      'Conducted vulnerability assessment and penetration testing on networked systems, identifying attack vectors across the TCP/IP stack and application layers.',
      'Applied AES and RSA cryptographic techniques to design secure communication workflows, and produced security reports with remediation recommendations.',
    ],
    tech: ['Penetration testing', 'AES', 'RSA'],
  },
  {
    type: 'work',
    role: 'Founder and Educator',
    org: 'NITIAN RAHI',
    period: '2021 - Present',
    location: 'Remote',
    bullets: [
      'Runs an engineering education community of about 52,000 across YouTube (12K+), Facebook (40K+) and Instagram, publishing technical tutorials and career guidance for engineering students.',
    ],
  },
  {
    type: 'education',
    role: 'B.Tech in Computer Science Engineering',
    org: 'Bihar Engineering University',
    period: '2020 - 2024',
    location: 'Patna, Bihar',
    bullets: ['CGPA 8.51 / 10'],
  },
  {
    type: 'education',
    role: 'Intermediate Science (Class XII)',
    org: 'CBSE Board',
    period: '2020',
    bullets: ['68.8%'],
  },
  {
    type: 'education',
    role: 'Matriculation (Class X)',
    org: 'CBSE Board',
    period: '2018',
    bullets: ['89.0%'],
  },
]
