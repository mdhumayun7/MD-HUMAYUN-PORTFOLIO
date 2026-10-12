// ===========================================================================
//  PROFILE — who you are. Edit the strings, nothing else needs to change.
// ===========================================================================

export const profile = {
  name: 'MD Humayun',

  // Shown under your name in the hero. Keep it to a role, not a slogan.
  title: 'ML Engineer & Software Development Engineer',

  // One sentence. This is the single most-read line on the site.
  pitch:
    'I build machine learning systems that survive contact with real infrastructure — an inline intrusion prevention engine evaluated on 2.5 million flows, a multi-agent drone swarm simulator, an SDN detector measured under live attack traffic.',

  // Two or three short paragraphs for the About section.
  bio: [
    "I'm an M.Tech student in Computer Science at SVNIT Surat, specialising in Information Security and Privacy, with a GATE CS percentile of 93.8. My work sits where machine learning meets systems engineering: models are the easy half, and the interesting problems live in the pipeline around them.",
    'IPS-ML, an M.Tech project, is an intrusion prevention system built on the premise that an inline device executes its own predictions: a false positive there does not raise an alert, it drops a legitimate connection. So it is evaluated as a control system rather than a classifier, with recall and false alarm rate as the headline metrics and SHAP explanations written into the enforcement path.',
    'Alongside that I was a research intern on a MeitY-sponsored project on autonomous drone swarm navigation, where I built BattleWorld — a multi-agent simulator wrapped as a Gymnasium environment — and benchmarked seven commander architectures against it. The resulting paper is under review at IEEE GSCON 2027.',
    'Before those I built an SDN intrusion detector I could measure under load, reproduced the original Variational Autoencoder paper and diagnosed why it collapsed on face data, and shipped a retrieval-augmented medical assistant running entirely on local inference.',
  ],

  // Photo: 800x800 WebP recommended, with a JPG fallback of the same name.
  // See CONTENT_GUIDE.md -> "Swapping the photo" for the exact export steps.
  photo: {
    src: 'humayun.webp',
    fallback: 'humayun.jpg',
    alt: 'MD Humayun, photographed against a plain background',
  },

  location: 'Surat, Gujarat, India',

  // Shown as a strip directly under the hero buttons. Keep this to the
  // numbers a recruiter actually screens on -- the full academic record,
  // including Class X and XII, lives in the Experience & education timeline.
  credentials: [
    { value: '93.8', label: 'GATE CS 2025 percentile' },
    { value: 'AIR 33', label: 'NPTEL, national rank' },
    { value: '8.70', label: 'M.Tech CPI, SVNIT' },
    { value: '8.51', label: 'B.Tech CGPA' },
  ],

  // The strip under the bio. Keep to four -- more and none of them register.
  quickFacts: [
    { label: 'Studying', value: 'M.Tech CS, SVNIT Surat' },
    { label: 'Dissertation', value: 'Spatial Mental Modeling from Limited Views' },
    { label: 'GATE CS 2025', value: '93.8 percentile' },
    { label: 'Based in', value: 'Surat, India' },
  ],

  // One line, not a section. Teaching is evidence of communication skill,
  // which matters for both ML and SDE interviews -- but it is not the pitch.
  community: {
    text: 'Outside of coursework I run NITIAN RAHI, an engineering education channel with a community of around 52,000 across YouTube, Facebook and Instagram, where I explain ML and systems topics to students.',
    links: [
      { label: 'YouTube', href: 'https://youtube.com/@nitianrahi' },
      { label: 'Instagram', href: 'https://www.instagram.com/learnwithnitianrahi07' },
    ],
  },

  contact: {
    email: 'md.humayun7777777@gmail.com',
    phone: '+91 72949 63049',
    github: 'https://github.com/mdhumayun7',
    linkedin: 'https://www.linkedin.com/in/md-humayun-82051521a/',
    leetcode: 'https://leetcode.com/u/mdhumayun7/',
    // Put your PDF at public/resume.pdf and this link works as-is.
    resume: 'resume.pdf',
  },

  // Shown in the contact section. Change or remove freely.
  availability: 'Open to ML engineering and SDE roles, and to research collaboration.',
}
