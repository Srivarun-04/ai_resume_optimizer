export const AI_MODEL = "claude-3-5-sonnet";

export const defaultMockFeedback: Feedback = {
    atsScore: {
        overallScore: 85,
        ats: 90,
        skills: 90,
        content: 90,
        structure: 90,
        toneAndStyle: 90
    },
    strengths: [
        { tip: "Strong Technical Baseline", explanation: "Solid experience in core web technologies.", category: "Skills" }
    ],
    weaknesses: [
        { tip: "Missing Testing Experience", explanation: "No unit testing frameworks mentioned.", category: "Structure" }
    ],
    suggestions: [
        { tip: "Add Testing Frameworks", explanation: "Add Jest/Cypress to list of skills.", category: "Content" }
    ],
    careerAnalysis: {
        recommendedRoles: ["Frontend Architect", "React Developer", "UI Engineer"],
        matchingSkills: ["React", "HTML5", "CSS3", "JavaScript"],
        missingSkills: ["TypeScript", "Next.js", "Jest"],
        roleDescriptions: [
            "Designs frontend system architecture and guidelines.",
            "Specializes in building components and state workflows using React.",
            "Implements pixel-perfect styles and layout systems."
        ]
    },
    interviewPrep: {
        technicalQuestions: [
            { question: "What is Virtual DOM?", answer: "React representation of real DOM elements." }
        ],
        behavioralQuestions: [
            { question: "Tell me about a conflict.", answer: "Describe situation, task, action, and results." }
        ],
        resumeBasedQuestions: [
            { question: "Explain project X scaling.", answer: "Detail caching and request management." }
        ]
    },
    roadmap: {
        day30: [
            { task: "Learn TypeScript basics", details: "Review compiler options and strict typing." }
        ],
        day60: [
            { task: "Build Next.js dashboard", details: "Implement Server Components and actions." }
        ]
    }
};

export const resumes: Resume[] = [
    {
        id: "1",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: defaultMockFeedback,
    },
    {
        id: "2",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: defaultMockFeedback,
    },
    {
        id: "3",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: defaultMockFeedback,
    },
    {
        id: "4",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: defaultMockFeedback,
    },
    {
        id: "5",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: defaultMockFeedback,
    },
    {
        id: "6",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: defaultMockFeedback,
    },
];

export const AIResponseFormat = `
      interface Feedback {
        atsScore: {
          overallScore: number; // Overall resume score (max 100)
          ats: number;          // ATS readability score (max 100)
          skills: number;       // Skills match rating (max 100)
          content: number;      // Content quality rating (max 100)
          structure: number;    // Document structure rating (max 100)
          toneAndStyle: number; // Tone & writing style rating (max 100)
        };
        strengths: {
          tip: string;          // Concise description of the strength
          explanation?: string; // Detailed context/why it's good
          category: string;     // e.g. "ATS", "Skills", "Content", "Structure", "Tone & Style"
        }[];                    // List 3-4 strengths
        weaknesses: {
          tip: string;
          explanation?: string;
          category: string;
        }[];                    // List 3-4 weaknesses / areas of improvement
        suggestions: {
          tip: string;
          explanation?: string;
          category: string;
        }[];                    // List 3-4 actionable tips to fix weaknesses
        
        extractedSkills: string[];   // All technical skills explicitly mentioned in the candidate's resume
        
        careerAnalysis: {
          recommendedRoles: string[]; // List exactly 3 recommended job roles (strings)
          matchingSkills: string[];   // Technical skills from the resume that match the job description or target roles
          missingSkills: string[];    // Target skills required by the job description or target roles that are NOT in the resume
          roleDescriptions: string[]; // Descriptions matching recommendedRoles array indexes respectively
        };

        interviewPrep: {
          technicalQuestions: { question: string; answer: string }[];  // 3 technical Q&As relevant to their skills
          behavioralQuestions: { question: string; answer: string }[];  // 2 behavioral Q&As mapped to their profile
          resumeBasedQuestions: { question: string; answer: string }[]; // 2 deep dive questions targeting achievements in their resume
        };

        roadmap: {
          day30: { task: string; details: string }[]; // 3 actionable milestones for the first 30 days
          day60: { task: string; details: string }[]; // 3 actionable milestones for day 31-60
        };
      }
`;

export const prepareInstructions = ({jobTitle, jobDescription}: { jobTitle: string; jobDescription: string; }) =>
    `You are an expert in ATS (Applicant Tracking System), resume analysis, technical recruitment, and career coaching.
      Please analyze and rate this resume and suggest how to improve it.
      The rating can be low if the resume is bad.
      Be thorough and detailed. Point out errors, structural mistakes, or weak bullets.
      If available, use the job description for the job the user is applying to to give more detailed feedback.
      The target job title is: ${jobTitle}
      The target job description is: ${jobDescription}
      
      CRITICAL SKILL EXTRACTION & MATCHING RULES:
      1. Under 'extractedSkills', list ALL technical skills explicitly mentioned or clearly present in the candidate's resume. Be sure to scan and extract skills from the 'Technical Skills' section, 'Projects' section, and 'Core Competencies' section. Include Programming Languages (e.g. Java, Python, JavaScript, TypeScript, C++, C#), Frontend (e.g. React, HTML, CSS, Tailwind, Next.js, Redux, Responsive Web Design), Backend (e.g. Node.js, Express.js, REST APIs, Socket.io, Real-Time Applications), Databases (e.g. MongoDB, MySQL, PostgreSQL, SQL), Tools (e.g. Git, GitHub, Docker, AWS, CI/CD), and Concepts (e.g. Data Structures & Algorithms, Authentication & Authorization, NLP, API Design). Never include skills here if they are not in the resume.
      2. Under 'careerAnalysis.matchingSkills', list ONLY skills from the resume ('extractedSkills') that match the requirements of the job description or target roles. Never include skills here if they are not in the resume.
      3. Under 'careerAnalysis.missingSkills', list target skills required by the job description or target roles that are NOT present in the candidate's resume.
      4. The intersection between 'careerAnalysis.matchingSkills' and 'careerAnalysis.missingSkills' MUST be empty (i.e., Matching Skills ∩ Missing Skills = Empty Set). Do not classify missing skills (e.g., TypeScript, Docker, AWS, Testing Frameworks, CI/CD) as matching skills.
      5. Normalize skills to standard names (e.g. 'Express.js', 'REST APIs', 'Testing Frameworks' instead of Jest/Cypress/Testing).
      
      You MUST generate all analytical profiles, career analysis roles, interview prep questions, and the learning roadmap at once.
      Provide the feedback exactly matching the following JSON schema:
      ${AIResponseFormat}
      
      Return ONLY the raw JSON object, without markdown code block syntax (like \`\`\`json), and do not output any other introduction, remarks, or conversational text.`;
