interface Resume {
    id: string;
    companyName?: string;
    jobTitle?: string;
    jobDescription?: string;
    imagePath: string;
    resumePath: string;
    feedback: Feedback;
    careerAnalysis?: CareerAnalysisReport;
    createdAt?: number;
}

interface Feedback {
    atsScore: {
        overallScore: number;
        ats: number;
        skills: number;
        content: number;
        structure: number;
        toneAndStyle: number;
    };
    strengths: {
        tip: string;
        explanation?: string;
        category: string;
    }[];
    weaknesses: {
        tip: string;
        explanation?: string;
        category: string;
    }[];
    suggestions: {
        tip: string;
        explanation?: string;
        category: string;
    }[];

    extractedSkills?: string[];

    careerAnalysis: {
        recommendedRoles: string[];
        matchingSkills: string[];
        missingSkills: string[];
        roleDescriptions: string[];
    };

    interviewPrep: {
        technicalQuestions: { question: string; answer: string }[];
        behavioralQuestions: { question: string; answer: string }[];
        resumeBasedQuestions: { question: string; answer: string }[];
    };

    roadmap: {
        day30: { task: string; details: string }[];
        day60: { task: string; details: string }[];
    };
}

interface InterviewQuestion {
    question: string;
    difficulty: "Easy" | "Medium" | "Hard";
    expectedTopics: string[];
}

interface ResumeQuestion {
    projectName: string;
    questions: string[];
}

interface CodingTopic {
    topic: string;
    importance: "High" | "Medium" | "Low";
    reason: string;
}

interface InterviewReadiness {
    technical: number;
    resume: number;
    communication: number;
    overall: number;
}

interface InterviewPrepData {
    technicalQuestions: InterviewQuestion[];
    resumeBasedQuestions: ResumeQuestion[];
    behavioralQuestions: string[];
    codingTopics: CodingTopic[];
    readinessScores: InterviewReadiness;
}
