import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  // Determine the appropriate unit by calculating the log
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Format with 2 decimal places and round
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const generateUUID = () => crypto.randomUUID();

export const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const knownSkillsList = [
    "React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind", "Node.js", 
    "Python", "Java", "Go", "Ruby", "SQL", "MySQL", "PostgreSQL", "MongoDB", 
    "Docker", "Kubernetes", "AWS", "Git", "Spring Boot", "Next.js", "Angular", 
    "Vue", "Express.js", "Express", "Django", "Flask", "C#", "C++", "Swift", "Kotlin", 
    "CI/CD", "Jest", "Cypress", "GraphQL", "REST APIs", "REST API", "REST", "Redux", "Linux", 
    "TensorFlow", "PyTorch", "Pandas", "NumPy", "Testing Frameworks", "Testing",
    "Socket.io", "GitHub", "Data Structures & Algorithms", "Authentication & Authorization",
    "Responsive Web Design", "Real-Time Applications", "NLP"
];

export const normalizeSkillName = (name: string): string => {
    const clean = name.trim().toLowerCase();
    if (clean === "express" || clean === "express.js") return "Express.js";
    if (clean === "rest" || clean === "rest api" || clean === "rest apis" || clean === "apis" || clean === "api") return "REST APIs";
    if (clean === "testing" || clean === "testing frameworks" || clean === "jest" || clean === "cypress") return "Testing Frameworks";
    if (clean === "ds" || clean === "algo" || clean === "dsa" || clean === "data structures & algorithms" || clean === "data structures and algorithms" || clean === "data structures" || clean === "algorithms") return "Data Structures & Algorithms";
    if (clean === "auth" || clean === "authentication" || clean === "authorization" || clean === "authentication & authorization") return "Authentication & Authorization";
    
    const matched = knownSkillsList.find(s => s.toLowerCase() === clean);
    return matched || name.trim();
};

export const getSkillCategory = (skill: string): string => {
    const s = skill.toLowerCase();
    
    // Programming Languages
    if (["javascript", "typescript", "python", "java", "go", "ruby", "c#", "c++", "swift", "kotlin"].includes(s)) {
        return "Programming Languages";
    }
    // Frontend
    if (["react", "html", "css", "tailwind", "next.js", "angular", "vue", "redux", "responsive web design"].includes(s)) {
        return "Frontend";
    }
    // Backend
    if (["node.js", "express.js", "spring boot", "django", "flask", "graphql", "rest apis", "socket.io", "real-time applications"].includes(s)) {
        return "Backend";
    }
    // Databases
    if (["sql", "mysql", "postgresql", "mongodb"].includes(s)) {
        return "Databases";
    }
    // Tools
    if (["docker", "kubernetes", "aws", "git", "github", "ci/cd", "linux"].includes(s)) {
        return "Tools";
    }
    // Concepts (Concepts / Core Competencies)
    return "Concepts";
};

export interface EvaluatedRole {
    role: string;
    score: number;
    description: string;
}

export const evaluateRoles = (resumeSkills: string[]): EvaluatedRole[] => {
    const candidateSkillsLower = resumeSkills.map(s => s.toLowerCase());
    
    const rolesList = [
        {
            role: "Full Stack Developer",
            skills: ["react", "node.js", "express.js", "mongodb", "javascript", "typescript", "mysql", "sql", "git", "rest apis", "css", "html"],
            description: "Designs, develops, and maintains end-to-end web applications, working on both frontend interfaces and backend APIs/databases."
        },
        {
            role: "Frontend Developer",
            skills: ["react", "javascript", "html", "css", "tailwind", "typescript", "next.js", "redux"],
            description: "Specializes in building responsive, pixel-perfect user interfaces, client-side application logic, and engaging user experiences."
        },
        {
            role: "Backend Developer",
            skills: ["node.js", "express.js", "java", "python", "go", "sql", "mysql", "postgresql", "mongodb", "rest apis", "spring boot", "git", "docker"],
            description: "Focuses on server-side logic, database management, API development, integration, and performance optimization of systems."
        },
        {
            role: "DevOps Engineer",
            skills: ["docker", "kubernetes", "aws", "ci/cd", "linux", "git", "python"],
            description: "Bridges the gap between development and operations by automating deployment pipelines, managing cloud infrastructure, and ensuring system reliability."
        },
        {
            role: "Data Scientist / AI Engineer",
            skills: ["python", "sql", "tensorflow", "pytorch", "pandas", "numpy", "git"],
            description: "Analyzes complex datasets, builds predictive machine learning models, and designs intelligent algorithms to solve business problems."
        },
        {
            role: "Mobile Developer",
            skills: ["swift", "kotlin", "java", "git", "react native", "flutter"],
            description: "Develops high-performance native or cross-platform mobile applications for iOS and Android platforms."
        }
    ];

    const results = rolesList.map(r => {
        const matching = r.skills.filter(s => candidateSkillsLower.includes(s));
        const score = r.skills.length > 0 ? (matching.length / r.skills.length) * 100 : 0;
        return {
            role: r.role,
            score: Math.round(score),
            description: r.description
        };
    });

    results.sort((a, b) => b.score - a.score);
    return results;
};

export function normalizeFeedback(feedback: any, jobTitle?: string, jobDescription?: string): Feedback {
    if (!feedback || typeof feedback !== "object") {
        try {
            if (typeof feedback === "string" && feedback.trim() !== "") {
                const parsed = JSON.parse(feedback);
                if (parsed && typeof parsed === "object") {
                    return normalizeFeedback(parsed, jobTitle, jobDescription);
                }
            }
        } catch (e) {
            console.error("normalizeFeedback: Failed to parse string feedback", e);
        }
        return createDefaultFeedback();
    }

    const extractTips = (fb: any, typeFilter: "good" | "improve"): { tip: string; explanation?: string; category: string }[] => {
        const list: { tip: string; explanation?: string; category: string }[] = [];
        const categories = [
            { key: "toneAndStyle", label: "Tone & Style" },
            { key: "content", label: "Content" },
            { key: "structure", label: "Structure" },
            { key: "skills", label: "Skills" },
        ];
        categories.forEach(({ key, label }) => {
            fb[key]?.tips?.forEach((t: any) => {
                if (t && t.type === typeFilter) {
                    list.push({ tip: t.tip || "", explanation: t.explanation || "", category: label });
                }
            });
        });
        fb.ATS?.tips?.forEach((t: any) => {
            if (t && t.type === typeFilter) {
                list.push({ tip: t.tip || "", explanation: "", category: "ATS" });
            }
        });
        return list;
    };

    let strengths = Array.isArray(feedback.strengths) ? feedback.strengths : [];
    let weaknesses = Array.isArray(feedback.weaknesses) ? feedback.weaknesses : [];
    let suggestions = Array.isArray(feedback.suggestions) ? feedback.suggestions : [];

    if (strengths.length === 0) {
        strengths = extractTips(feedback, "good");
        if (strengths.length === 0) {
            strengths = [
                { tip: "Professional Tone", explanation: "The tone used in the experience description is professional.", category: "Tone & Style" },
                { tip: "Standard sections", explanation: "The resume contains typical sections such as Experience and Education.", category: "Structure" }
            ];
        }
    }
    if (weaknesses.length === 0) {
        weaknesses = extractTips(feedback, "improve");
        if (weaknesses.length === 0) {
            weaknesses = [
                { tip: "Keyword Match Gap", explanation: "Ensure your resume lists exact keywords matching the target role.", category: "ATS" },
                { tip: "Lack of Quantifiable Results", explanation: "Add metrics, numbers, and percentages to showcase your achievements.", category: "Content" }
            ];
        }
    }
    if (suggestions.length === 0) {
        suggestions = extractTips(feedback, "improve");
        if (suggestions.length === 0) {
            suggestions = [
                { tip: "Add Testing Frameworks", explanation: "Review job description for libraries like Jest or Cypress.", category: "Skills" }
            ];
        }
    }

    // Programmatically extract all resume skills
    let rawExtracted: string[] = [];
    if (Array.isArray(feedback.extractedSkills) && feedback.extractedSkills.length > 0) {
        rawExtracted = feedback.extractedSkills;
    } else {
        // Fallback for legacy resumes: scan strengths, weaknesses, and matchingSkills
        const textSources: string[] = [];
        if (Array.isArray(feedback.strengths)) {
            feedback.strengths.forEach((item: any) => {
                textSources.push(item.tip || "");
                textSources.push(item.explanation || "");
            });
        }
        if (Array.isArray(feedback.careerAnalysis?.matchingSkills)) {
            feedback.careerAnalysis.matchingSkills.forEach((s: string) => {
                if (s && s.toLowerCase() !== "none found") rawExtracted.push(s);
            });
        }
        const combinedText = textSources.join(" ").toLowerCase();
        knownSkillsList.forEach(skill => {
            const escapedSkill = escapeRegex(skill.toLowerCase());
            const startBoundary = /^\w/.test(skill) ? "\\b" : "";
            const endBoundary = /\w$/.test(skill) ? "\\b" : "";
            const regex = new RegExp(`${startBoundary}${escapedSkill}${endBoundary}`, "i");
            if (regex.test(combinedText)) {
                rawExtracted.push(skill);
            }
        });
    }

    const resumeSkills = Array.from(new Set(rawExtracted.map(s => normalizeSkillName(s))))
        .filter(s => s && s.toLowerCase() !== "none found");

    // Reconstruct Job Description requirements programmatically
    const jdSkillsSet = new Set<string>();
    
    if (jobDescription || jobTitle) {
        const jdText = `${jobTitle || ""} ${jobDescription || ""}`.toLowerCase();
        knownSkillsList.forEach(skill => {
            const escapedSkill = escapeRegex(skill.toLowerCase());
            const startBoundary = /^\w/.test(skill) ? "\\b" : "";
            const endBoundary = /\w$/.test(skill) ? "\\b" : "";
            const regex = new RegExp(`${startBoundary}${escapedSkill}${endBoundary}`, "i");
            if (regex.test(jdText)) {
                jdSkillsSet.add(normalizeSkillName(skill));
            }
        });
    }
    
    if (feedback.careerAnalysis) {
        if (Array.isArray(feedback.careerAnalysis.missingSkills)) {
            feedback.careerAnalysis.missingSkills.forEach((s: any) => {
                if (s && s.toLowerCase() !== "none found") jdSkillsSet.add(normalizeSkillName(s));
            });
        }
        if (Array.isArray(feedback.careerAnalysis.matchingSkills)) {
            feedback.careerAnalysis.matchingSkills.forEach((s: any) => {
                if (s && s.toLowerCase() !== "none found") jdSkillsSet.add(normalizeSkillName(s));
            });
        }
    }

    const jobDescriptionSkills = Array.from(jdSkillsSet);

    // Calculate: Matching = Resume ∩ JD, Missing = JD - Resume (strictly disjoint)
    const matchingSkillsList = resumeSkills.filter(s => jobDescriptionSkills.includes(s));
    const missingSkillsList = jobDescriptionSkills.filter(s => !resumeSkills.includes(s));
    const extractedSkills = resumeSkills;

    console.log("ATS Score Engine Inputs:", {
        matchingSkillsCount: matchingSkillsList.length,
        missingSkillsCount: missingSkillsList.length,
        strengthsCount: strengths.length,
        weaknessesCount: weaknesses.length
    });

    const countCategory = (list: any[], categoryName: string) => {
        return list.filter(item => {
            const cat = (item.category || "").toLowerCase();
            return cat === categoryName.toLowerCase() || cat.includes(categoryName.toLowerCase());
        }).length;
    };

    // Calculate Skills Score (45 to 98) based on ratio + absolute matches
    const totalSkills = matchingSkillsList.length + missingSkillsList.length;
    const skillsRatio = totalSkills > 0 ? matchingSkillsList.length / totalSkills : 0.5;
    let skillsScoreVal = Math.round(50 + skillsRatio * 45);
    skillsScoreVal += Math.min(5, matchingSkillsList.length);
    skillsScoreVal = Math.max(30, Math.min(98, skillsScoreVal));

    // Calculate ATS Score (based on ATS category strengths vs weaknesses)
    const atsStrengths = countCategory(strengths, "ats");
    const atsWeaknesses = countCategory(weaknesses, "ats");
    let atsScoreVal = Math.round(72 + (atsStrengths * 6) - (atsWeaknesses * 9));
    atsScoreVal = Math.max(35, Math.min(97, atsScoreVal));

    // Calculate Content Score (based on Content category strengths vs weaknesses)
    const contentStrengths = countCategory(strengths, "content");
    const contentWeaknesses = countCategory(weaknesses, "content");
    let contentScoreVal = Math.round(68 + (contentStrengths * 7) - (contentWeaknesses * 8));
    contentScoreVal = Math.max(30, Math.min(97, contentScoreVal));

    // Calculate Structure Score (based on Structure category strengths vs weaknesses)
    const structureStrengths = countCategory(strengths, "structure");
    const structureWeaknesses = countCategory(weaknesses, "structure");
    let structureScoreVal = Math.round(75 + (structureStrengths * 5) - (structureWeaknesses * 9));
    structureScoreVal = Math.max(30, Math.min(98, structureScoreVal));

    // Calculate Tone & Style Score (based on Tone & Style category strengths vs weaknesses)
    const toneStrengths = countCategory(strengths, "tone");
    const toneWeaknesses = countCategory(weaknesses, "tone");
    let toneAndStyleScoreVal = Math.round(75 + (toneStrengths * 6) - (toneWeaknesses * 7));
    toneAndStyleScoreVal = Math.max(30, Math.min(98, toneAndStyleScoreVal));

    // Calculate overallScore: weighted average
    let overallScore = Math.round(
        (atsScoreVal * 0.3) + 
        (skillsScoreVal * 0.3) + 
        (contentScoreVal * 0.2) + 
        (structureScoreVal * 0.1) + 
        (toneAndStyleScoreVal * 0.1)
    );
    overallScore = Math.max(30, Math.min(99, overallScore));

    const atsScore = {
        overallScore,
        ats: atsScoreVal,
        skills: skillsScoreVal,
        content: contentScoreVal,
        structure: structureScoreVal,
        toneAndStyle: toneAndStyleScoreVal
    };

    console.log("ATS Score Engine Outputs:", atsScore);

    // Evaluate recommended career pathways dynamically from actual skills
    const devSkillsList = ["react", "javascript", "node.js", "express.js", "mongodb", "mysql", "sql", "java", "python", "go", "typescript", "html", "css", "git", "rest apis"];
    const hasDevSkills = resumeSkills.some(s => devSkillsList.includes(s.toLowerCase()));

    let recommendedRoles: string[] = [];
    let roleDescriptions: string[] = [];

    if (hasDevSkills) {
        const evaluated = evaluateRoles(resumeSkills);
        const fullstack = evaluated.find(r => r.role === "Full Stack Developer");
        const frontend = evaluated.find(r => r.role === "Frontend Developer");
        const backend = evaluated.find(r => r.role === "Backend Developer");
        
        const finalRoles = [
            fullstack || { role: "Full Stack Developer", score: 80, description: "Designs, develops, and maintains end-to-end web applications, working on both frontend interfaces and backend APIs/databases." },
            frontend || { role: "Frontend Developer", score: 75, description: "Specializes in building responsive, pixel-perfect user interfaces, client-side application logic, and engaging user experiences." },
            backend || { role: "Backend Developer", score: 70, description: "Focuses on server-side logic, database management, API development, integration, and performance optimization of systems." }
        ];
        
        recommendedRoles = finalRoles.map(r => r.role);
        roleDescriptions = finalRoles.map(r => r.description);
    } else {
        recommendedRoles = ["Technical Analyst", "IT Consultant", "Software Developer"];
        roleDescriptions = [
            "Examines business processes and translates technical systems specs.",
            "Advises clients on how to configure and design technical architecture.",
            "Designs and builds user interfaces or core logic for software solutions."
        ];
    }

    const careerAnalysis = {
        recommendedRoles,
        matchingSkills: matchingSkillsList,
        missingSkills: missingSkillsList,
        roleDescriptions
    };

    let interviewPrep = {
        technicalQuestions: [
            { question: "What is your primary programming language and its benefits?", answer: "Answer should focus on efficiency, tooling, and ecosystem." }
        ],
        behavioralQuestions: [
            { question: "Tell me about a time you solved a hard bug.", answer: "Use the STAR method: Situation, Task, Action, Result." }
        ],
        resumeBasedQuestions: [
            { question: "Explain the architectural decisions behind your listed projects.", answer: "Discuss separation of concerns, testing strategy, or database design." }
        ]
    };

    if (feedback.interviewPrep && typeof feedback.interviewPrep === "object") {
        interviewPrep = {
            technicalQuestions: Array.isArray(feedback.interviewPrep.technicalQuestions) ? feedback.interviewPrep.technicalQuestions : interviewPrep.technicalQuestions,
            behavioralQuestions: Array.isArray(feedback.interviewPrep.behavioralQuestions) ? feedback.interviewPrep.behavioralQuestions : interviewPrep.behavioralQuestions,
            resumeBasedQuestions: Array.isArray(feedback.interviewPrep.resumeBasedQuestions) ? feedback.interviewPrep.resumeBasedQuestions : interviewPrep.resumeBasedQuestions,
        };
    }

    let roadmap = {
        day30: [
            { task: "Update resume format", details: "Apply standard single-column clean layout." }
        ],
        day60: [
            { task: "Upskill in missing key domains", details: "Learn or reinforce knowledge on target keywords." }
        ]
    };

    if (feedback.roadmap && typeof feedback.roadmap === "object") {
        roadmap = {
            day30: Array.isArray(feedback.roadmap.day30) ? feedback.roadmap.day30 : roadmap.day30,
            day60: Array.isArray(feedback.roadmap.day60) ? feedback.roadmap.day60 : roadmap.day60,
        };
    }

    return {
        atsScore,
        strengths,
        weaknesses,
        suggestions,
        extractedSkills,
        careerAnalysis,
        interviewPrep,
        roadmap
    };
}

function createDefaultFeedback(): Feedback {
    return {
        atsScore: {
            overallScore: 78,
            ats: 82,
            skills: 72,
            content: 85,
            structure: 76,
            toneAndStyle: 80,
        },
        strengths: [
            { tip: "Professional Tone", explanation: "The tone used in the experience description is professional.", category: "Tone & Style" }
        ],
        weaknesses: [
            { tip: "Keyword Match Gap", explanation: "Ensure your resume lists exact keywords matching the target role.", category: "ATS" }
        ],
        suggestions: [
            { tip: "Add Testing Frameworks", explanation: "Review job description for libraries like Jest or Cypress.", category: "Skills" }
        ],
        extractedSkills: [
            "React", "JavaScript", "Node.js", "Express.js", "MongoDB", "MySQL", "Git", "REST APIs",
            "Java", "Python", "HTML", "CSS", "Socket.io", "GitHub", "Data Structures & Algorithms",
            "Authentication & Authorization", "Responsive Web Design", "Real-Time Applications", "NLP"
        ],
        careerAnalysis: {
            recommendedRoles: ["Full Stack Developer", "Frontend Developer", "Backend Developer"],
            matchingSkills: [
                "React", "JavaScript", "Node.js", "Express.js", "MongoDB", "MySQL", "Git", "REST APIs",
                "Java", "Python", "HTML", "CSS", "Socket.io", "GitHub", "Data Structures & Algorithms",
                "Authentication & Authorization", "Responsive Web Design", "Real-Time Applications", "NLP"
            ],
            missingSkills: ["TypeScript", "Docker", "AWS", "Testing Frameworks", "CI/CD"],
            roleDescriptions: [
                "Designs, develops, and maintains end-to-end web applications, working on both frontend interfaces and backend APIs/databases.",
                "Specializes in building responsive, pixel-perfect user interfaces, client-side application logic, and engaging user experiences.",
                "Focuses on server-side logic, database management, API development, integration, and performance optimization of systems."
            ]
        },
        interviewPrep: {
            technicalQuestions: [
                { question: "What is your primary programming language and its benefits?", answer: "Answer should focus on type safety, community, or efficiency." }
            ],
            behavioralQuestions: [
                { question: "Tell me about a time you solved a hard bug.", answer: "Use the STAR method: Situation, Task, Action, Result." }
            ],
            resumeBasedQuestions: [
                { question: "Explain the architectural decisions behind your listed projects.", answer: "Discuss separation of concerns, testing strategy, or database design." }
            ]
        },
        roadmap: {
            day30: [
                { task: "Update resume format", details: "Apply standard single-column clean layout." }
            ],
            day60: [
                { task: "Upskill in missing key domains", details: "Learn or reinforce knowledge on target keywords." }
            ]
        }
    };
}

