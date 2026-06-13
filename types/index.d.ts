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


