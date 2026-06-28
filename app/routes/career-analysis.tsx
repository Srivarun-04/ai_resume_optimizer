import { Link, useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { cn, knownSkillsList, escapeRegex, normalizeSkillName, normalizeFeedback, evaluateRoles, getSkillCategory } from "~/lib/utils";

interface CareerAnalysisData {
    recommendedRoles: string[];
    matchingSkills: string[];
    missingSkills: string[];
    roleDescriptions: string[];
}

interface RoadmapItem {
    task: string;
    details: string;
}

interface RoadmapData {
    day30: RoadmapItem[];
    day60: RoadmapItem[];
}

export const meta = () => ([
    { title: 'Career Guidance | ResumeIQ' },
    { name: 'description', content: 'AI Analysis of your career path' },
]);

const getRoleMetrics = (roleName: string) => {
    const name = roleName.toLowerCase();
    let salary = "₹6-12 LPA";
    let growth = "High";

    if (name.includes("architect") || name.includes("lead") || name.includes("manager") || name.includes("principal")) {
        salary = "₹18-35 LPA";
        growth = "Very High";
    } else if (name.includes("senior") || name.includes("sr.")) {
        salary = "₹12-22 LPA";
        growth = "High";
    } else if (name.includes("junior") || name.includes("jr.") || name.includes("intern")) {
        salary = "₹4-8 LPA";
        growth = "Medium";
    } else if (name.includes("cloud") || name.includes("devops") || name.includes("ai") || name.includes("ml") || name.includes("data scientist")) {
        salary = "₹10-20 LPA";
        growth = "Very High";
    } else if (name.includes("backend") || name.includes("fullstack") || name.includes("full stack") || name.includes("systems")) {
        salary = "₹8-16 LPA";
        growth = "High";
    } else if (name.includes("frontend") || name.includes("react") || name.includes("developer") || name.includes("engineer")) {
        salary = "₹6-12 LPA";
        growth = "High";
    } else if (name.includes("design") || name.includes("ui") || name.includes("ux")) {
        salary = "₹5-10 LPA";
        growth = "Medium";
    }
    return { salary, growth };
};

const getRoleSpecificSkills = (role: string, candidateSkills: string[]) => {
    const roleLower = role.toLowerCase();
    
    let typicalSkills: string[] = [];
    
    if (roleLower.includes("front") || roleLower.includes("react") || roleLower.includes("ui") || roleLower.includes("ux") || roleLower.includes("web")) {
        typicalSkills = ["React", "JavaScript", "CSS", "HTML", "Tailwind", "TypeScript", "Next.js", "Testing Frameworks", "Redux"];
    } else if (roleLower.includes("back") || roleLower.includes("node") || roleLower.includes("api") || roleLower.includes("systems")) {
        typicalSkills = ["Java", "SQL", "MySQL", "Git", "Spring Boot", "Docker", "AWS", "Node.js", "Express.js", "PostgreSQL", "MongoDB", "REST APIs"];
    } else if (roleLower.includes("java") && !roleLower.includes("javascript")) {
        typicalSkills = ["Java", "Spring Boot", "SQL", "MySQL", "Git", "Docker", "AWS", "REST APIs", "PostgreSQL"];
    } else if (roleLower.includes("cloud") || roleLower.includes("devops") || roleLower.includes("sre") || roleLower.includes("infrastructure")) {
        typicalSkills = ["Docker", "Kubernetes", "AWS", "CI/CD", "Git", "Linux", "Python"];
    } else if (roleLower.includes("full")) {
        typicalSkills = ["React", "Node.js", "JavaScript", "TypeScript", "SQL", "MongoDB", "Git", "Docker", "AWS", "CSS", "REST APIs", "Express.js", "Testing Frameworks"];
    } else if (roleLower.includes("data") || roleLower.includes("ai") || roleLower.includes("ml") || roleLower.includes("machine") || roleLower.includes("analytic")) {
        typicalSkills = ["Python", "SQL", "Pandas", "NumPy", "Git", "TensorFlow", "PyTorch"];
    } else if (roleLower.includes("mobile") || roleLower.includes("ios") || roleLower.includes("android") || roleLower.includes("swift") || roleLower.includes("kotlin")) {
        typicalSkills = ["Swift", "Kotlin", "Java", "Git", "React Native", "Flutter"];
    } else {
        typicalSkills = ["JavaScript", "TypeScript", "Python", "Java", "SQL", "Git", "Docker", "AWS", "CI/CD", "Testing Frameworks"];
    }
    
    const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());
    const matching = typicalSkills.filter(s => candidateSkillsLower.includes(s.toLowerCase()));
    const missing = typicalSkills.filter(s => !candidateSkillsLower.includes(s.toLowerCase()));
    
    return {
        matching,
        missing
    };
};

function getWeekMilestone(idx: number, day30: RoadmapItem[] | undefined): RoadmapItem {
    const defaultMilestones: RoadmapItem[] = [
        {
            task: "TypeScript Fundamentals & React Best Practices",
            details: "Establish type safety, define clean component interfaces, and follow idiomatic React design patterns."
        },
        {
            task: "API Integration & State Management",
            details: "Set up data fetching, handle loading/error states, and manage global/local client state efficiently."
        },
        {
            task: "Project Implementation",
            details: "Build an end-to-end feature or application using the skills acquired in the first two weeks."
        },
        {
            task: "Mock Interview Preparation",
            details: "Review technical questions, practice behavioral prompts, and perform mock coding interviews."
        }
    ];

    if (day30 && day30[idx] && day30[idx].task) {
        return day30[idx];
    }
    return defaultMilestones[idx] || defaultMilestones[0];
}

function getMonth2Milestone(idx: number, day60: RoadmapItem[] | undefined): RoadmapItem {
    const defaultMilestones: RoadmapItem[] = [
        {
            task: "Advanced React & Rendering Patterns",
            details: "Deep dive into performance tuning, concurrent features, suspense, and custom hook design."
        },
        {
            task: "System Design Basics",
            details: "Learn architecture patterns, scalability, API design principles, and deployment options."
        },
        {
            task: "Portfolio Improvements",
            details: "Refine existing projects, add test coverage, update documentation, and showcase code quality."
        }
    ];

    if (day60 && day60[idx] && day60[idx].task) {
        return day60[idx];
    }
    return defaultMilestones[idx] || defaultMilestones[0];
}

export default function CareerAnalysis() {
    const { auth, isLoading, kv } = usePuterStore();
    const { resumeId } = useParams();
    const navigate = useNavigate();

    const [loadingState, setLoadingState] = useState<"loading" | "complete" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [resumeData, setResumeData] = useState<any>(null);
    const [careerReport, setCareerReport] = useState<CareerAnalysisData | null>(null);
    const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
    const [learningStatus, setLearningStatus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate(`/auth?next=/career-analysis/${resumeId}`);
        }
    }, [isLoading, auth.isAuthenticated, resumeId]);

    useEffect(() => {
        if (isLoading || !auth.isAuthenticated || !resumeId) return;

        const getReport = async () => {
            try {
                setLoadingState("loading");
                console.log("DEBUG: resumeId =", resumeId);
                const stored = await kv.get(`resume:${resumeId}`);
                if (!stored) {
                    console.warn("DEBUG: KV data not found for resumeId =", resumeId);
                    setLoadingState("error");
                    setErrorMessage("Resume data not found in storage.");
                    return;
                }

                const data = JSON.parse(stored);
                console.log("DEBUG: KV data retrieved =", data);

                if (!data) {
                    console.warn("DEBUG: Parsed KV data is null");
                    setLoadingState("error");
                    setErrorMessage("Invalid resume data: Stored object is null.");
                    return;
                }

                const feedback = data.feedback;
                console.log("DEBUG: feedback object =", feedback);

                if (!feedback) {
                    console.warn("DEBUG: Feedback object is missing in resume data");
                    setLoadingState("error");
                    setErrorMessage("Invalid resume data: Feedback section is missing.");
                    return;
                }

                setResumeData(data);

                // Load and dynamically normalize career analysis report
                const normalized = normalizeFeedback(feedback, data.jobTitle, data.jobDescription);
                console.log("DEBUG: Loaded normalized career analysis =", normalized.careerAnalysis);
                setCareerReport(normalized.careerAnalysis);
                setRoadmap(normalized.roadmap || null);
                setLoadingState("complete");
            } catch (err) {
                console.error("DEBUG: Error loading career analysis:", err);
                if (err instanceof Error) {
                    console.error("DEBUG: Stack trace:", err.stack);
                }
                setLoadingState("error");
                setErrorMessage(err instanceof Error ? err.message : "Failed to load report.");
            }
        };

        getReport();
    }, [resumeId, isLoading, auth.isAuthenticated]);

    const handleRetry = () => {
        setLoadingState("loading");
    };

    const toggleLearningStep = (key: string) => {
        setLearningStatus(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const scrollToRoadmap = () => {
        document.getElementById('learning-roadmap')?.scrollIntoView({ behavior: 'smooth' });
    };

    // Helper to determine match score colors
    const getScoreBadgeStyles = (score: number) => {
        if (score >= 85) return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (score >= 70) return "bg-amber-50 text-amber-700 border-amber-200";
        return "bg-rose-50 text-rose-700 border-rose-200";
    };

    const normalized = resumeData?.feedback ? normalizeFeedback(resumeData.feedback, resumeData.jobTitle, resumeData.jobDescription) : null;
    const candidateSkills = normalized?.extractedSkills || [];
    const globalMatchingSkills = normalized?.careerAnalysis?.matchingSkills || [];
    const globalMissingSkills = normalized?.careerAnalysis?.missingSkills || [];
    const jdSkills = normalized ? globalMatchingSkills.concat(globalMissingSkills) : [];
    
    // Evaluate role scores dynamically for console logs
    const evaluatedRoles = candidateSkills.length > 0 ? evaluateRoles(candidateSkills) : [];
    const roleScores = evaluatedRoles.map(r => `${r.role}: ${r.score}%`);

    // Group candidate skills by category for debugging logs
    const categorizedResumeSkills = {
        "Programming Languages": [] as string[],
        "Frontend": [] as string[],
        "Backend": [] as string[],
        "Databases": [] as string[],
        "Tools": [] as string[],
        "Concepts": [] as string[]
    };
    
    candidateSkills.forEach(skill => {
        const cat = getSkillCategory(skill) as keyof typeof categorizedResumeSkills;
        if (categorizedResumeSkills[cat]) {
            categorizedResumeSkills[cat].push(skill);
        } else {
            categorizedResumeSkills["Concepts"].push(skill);
        }
    });

    // Auditing logs exactly matching requirements
    console.log("Resume Skills:");
    console.log(candidateSkills);
    console.log("Extracted Skills by Category:");
    console.log(categorizedResumeSkills);
    console.log("JD Skills:");
    console.log(jdSkills);
    console.log("Matching Skills:");
    console.log(globalMatchingSkills);
    console.log("Missing Skills:");
    console.log(globalMissingSkills);
    console.log("Role Scores:");
    console.log(roleScores);

    return (
        <main className="min-h-screen bg-gray-50 pb-12">
            {/* ── Navbar ── */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <Link
                        to={`/resume/${resumeId}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 transition bg-white shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Back to Review
                    </Link>
                    <span className="h-4 w-px bg-gray-200" />
                    <span className="text-xs text-gray-500 font-medium">Career Guidance Dashboard</span>
                </div>
                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                    AI Strategist
                </div>
            </nav>

            {/* ── Main Content Area ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                
                {/* ── Loading State ── */}
                {loadingState === "loading" && (
                    <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center animate-pulse">
                        <h1 className="text-2xl font-bold text-gray-900">Career Analysis</h1>
                        <p className="text-sm text-gray-500 mt-4">Loading career recommendations...</p>
                        <div className="relative w-12 h-12 mx-auto mt-6">
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin"></div>
                        </div>
                    </div>
                )}

                {/* ── Error State ── */}
                {loadingState === "error" && (
                    <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center">
                        <span className="text-4xl text-red-500">⚠️</span>
                        <h2 className="text-lg font-bold text-gray-800 mt-4">Generation Failed</h2>
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 mt-3 inline-block max-w-md">
                            {errorMessage || "An unexpected error occurred."}
                        </p>
                        <div className="mt-6 flex justify-center gap-3">
                            <button
                                onClick={handleRetry}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow-sm hover:shadow"
                            >
                                Retry Analysis
                            </button>
                            <Link
                                to={`/resume/${resumeId}`}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs px-4 py-2 rounded-lg transition"
                            >
                                Return to Resume
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── Complete State ── */}
                {loadingState === "complete" && careerReport && resumeData && (
                    <div className="space-y-6">
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-indigo-800">
                            <div>
                                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    Career Strategy Guidance Report
                                </span>
                                <h1 className="text-xl md:text-2xl font-black mt-2 tracking-tight text-white">
                                    Personalized Career Pathways
                                </h1>
                                <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
                                    This report maps your skills from {resumeData?.jobTitle ? `"${resumeData.jobTitle}"` : "your resume"} against target requirements in the industry.
                                </p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center shrink-0">
                                <span className="text-[10px] text-indigo-300 font-semibold block uppercase">Resume Rating</span>
                                <span className="text-2xl font-black text-white">
                                    {normalized?.atsScore?.overallScore !== undefined && normalized?.atsScore?.overallScore !== null
                                        ? normalized.atsScore.overallScore
                                        : "N/A"}
                                </span>
                                <span className="text-[10px] text-indigo-300 block">/100</span>
                            </div>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            
                            {/* LEFT COLUMN: Executive Profile Details (35%) */}
                            <div className="lg:col-span-4 space-y-4">
                                
                                {/* Profile Executive Summary */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4.5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
                                        <span className="text-base">📋</span>
                                        <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Executive Summary</h2>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                        Based on your analyzed qualifications, we have mapped out the most promising job roles, technical skills profile fit, and a 60-day upskilling roadmap to help you secure your next opportunity.
                                    </p>
                                </div>

                                {/* Skills Fit Profile */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4.5 shadow-sm space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-1.5">
                                            <span className="text-xs">🟢</span>
                                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Matching Skills ({globalMatchingSkills.length})</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                            {globalMatchingSkills.length > 0 ? (
                                                globalMatchingSkills.map((skill, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-50 border border-emerald-100 text-emerald-700"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-gray-400 italic">No skill analysis available</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-1.5">
                                            <span className="text-xs">🔴</span>
                                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Skills to Acquire ({globalMissingSkills.length})</h2>
                                        </div>
                                        <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                            {globalMissingSkills.length > 0 ? (
                                                globalMissingSkills.map((skill, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-50 border border-amber-100 text-amber-700"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-gray-400 italic">No skill analysis available</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Recommended Roles (65%) */}
                            <div className="lg:col-span-8 space-y-4">
                                <h2 className="text-sm font-bold text-gray-700 px-1 uppercase tracking-wider">
                                    Recommended Career Pathways
                                </h2>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {careerReport.recommendedRoles?.map((role: string, idx: number) => {
                                        const matchScore = Math.max(90 - idx * 7, 60);
                                        const badgeStyle = getScoreBadgeStyles(matchScore);
                                        const description = careerReport.roleDescriptions[idx] || "No description provided.";
                                        const { salary, growth } = getRoleMetrics(role);
                                        const roleSkills = getRoleSpecificSkills(role, candidateSkills);

                                        const hasSkills = candidateSkills.length > 0;
                                        
                                        const whyRecommended = hasSkills && roleSkills.matching.length > 0
                                            ? `This role is highly recommended because your technical background in ${roleSkills.matching.slice(0, 3).join(", ")} aligns directly with the core requirements.`
                                            : `Recommended based on your professional experience and core transferable credentials.`;
                                            
                                        const matchExplanation = hasSkills && roleSkills.matching.length > 0
                                            ? `Matches ${roleSkills.matching.length} of the primary skills. Acquiring ${roleSkills.missing.slice(0, 2).join(" and ")} will close the remaining capability gap.`
                                            : `No matching skill analysis available to generate a specific explanation.`;

                                        return (
                                            <div 
                                                key={idx}
                                                className="bg-white border border-gray-200 hover:border-indigo-300 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 gap-3"
                                            >
                                                {/* Card Header info */}
                                                <div className="space-y-2">
                                                    <div className="flex items-start justify-between gap-1.5">
                                                        <h3 className="text-xs font-black text-gray-900 leading-snug line-clamp-2 min-h-[32px]">{role}</h3>
                                                        <span className={cn("px-1.5 py-0.5 text-[9px] font-bold rounded-full border shrink-0", badgeStyle)}>
                                                            {matchScore}%
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Career Description */}
                                                    <div className="space-y-0.5">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase block tracking-wider">Career Description</span>
                                                        <p className="text-[10px] text-gray-600 leading-relaxed min-h-[50px] line-clamp-4">
                                                            {description}
                                                        </p>
                                                    </div>

                                                    {/* Why Recommended */}
                                                    <div className="space-y-0.5 border-t border-gray-50 pt-2">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase block tracking-wider">Why Recommended</span>
                                                        <p className="text-[10px] text-gray-600 leading-relaxed font-medium">
                                                            {whyRecommended}
                                                        </p>
                                                    </div>

                                                    {/* Match Explanation */}
                                                    <div className="space-y-0.5 border-t border-gray-50 pt-2">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase block tracking-wider">Match Explanation</span>
                                                        <p className="text-[10px] text-gray-500 leading-relaxed italic">
                                                            {matchExplanation}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Matching Skills list */}
                                                <div className="space-y-1 border-t border-gray-50 pt-2">
                                                    <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Matching Skills</h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {hasSkills && roleSkills.matching.length > 0 ? (
                                                            roleSkills.matching.slice(0, 3).map((sk, i) => (
                                                                <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                                                                    ✓ {sk}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[9px] text-gray-400 italic">No skill analysis available</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Missing Skills list */}
                                                <div className="space-y-1">
                                                    <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Missing Skills</h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {hasSkills && roleSkills.missing.length > 0 ? (
                                                            roleSkills.missing.slice(0, 3).map((sk, i) => (
                                                                <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[9px] font-bold">
                                                                    ✗ {sk}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[9px] text-gray-400 italic">No skill analysis available</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Job Metrics */}
                                                <div className="grid grid-cols-2 gap-1.5 border-t border-gray-100 py-2">
                                                    <div>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Growth</span>
                                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 inline-block mt-0.5">
                                                            {growth}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Salary</span>
                                                        <span className="text-[10px] font-bold text-gray-800 block mt-1">
                                                            {salary}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM ROW: Global Upskilling Roadmap (12 cols width) */}
                        {roadmap && (
                            <div id="learning-roadmap" className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-6 scroll-mt-6">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                    <span className="text-lg">🎯</span>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800">60-Day Strategic Upskilling Roadmap</h3>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Structured weekly and monthly milestones to guide your technical skill development</p>
                                    </div>
                                </div>

                                {/* 30-Day Learning Plan */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">📅 Month 1: 30-Day Learning Plan</h4>
                                        <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Phase 1</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[0, 1, 2, 3].map((idx) => {
                                            const itemKey = `30-${idx}`;
                                            const isChecked = !!learningStatus[itemKey];
                                            const milestone = getWeekMilestone(idx, roadmap.day30);
                                            return (
                                                <div 
                                                    key={idx}
                                                    onClick={() => toggleLearningStep(itemKey)}
                                                    className={cn(
                                                        "flex flex-col justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/20 hover:border-indigo-100 hover:bg-indigo-50/5 cursor-pointer transition select-none h-full relative overflow-hidden break-words",
                                                        isChecked && "bg-gray-50/10 border-gray-100 opacity-60"
                                                    )}
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                                Week {idx + 1}
                                                            </span>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleLearningStep(itemKey);
                                                                }}
                                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                                                            />
                                                        </div>
                                                        <p className={cn(
                                                            "text-xs font-bold text-gray-800 transition-all",
                                                            isChecked && 'line-through text-gray-400 font-normal'
                                                        )}>
                                                            {milestone.task}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 leading-relaxed">
                                                            {milestone.details}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 60-Day Learning Plan */}
                                <div className="space-y-3 pt-3 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-violet-700 uppercase tracking-wider">📅 Month 2: 60-Day Learning Plan</h4>
                                        <span className="text-[10px] text-violet-500 font-bold bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">Phase 2</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {[0, 1, 2].map((idx) => {
                                            const itemKey = `60-${idx}`;
                                            const isChecked = !!learningStatus[itemKey];
                                            const milestone = getMonth2Milestone(idx, roadmap.day60);
                                            return (
                                                <div 
                                                    key={idx}
                                                    onClick={() => toggleLearningStep(itemKey)}
                                                    className={cn(
                                                        "flex flex-col justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/20 hover:border-violet-100 hover:bg-violet-50/5 cursor-pointer transition select-none h-full relative overflow-hidden break-words",
                                                        isChecked && "bg-gray-50/10 border-gray-100 opacity-60"
                                                    )}
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                                                                Goal {idx + 1}
                                                            </span>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleLearningStep(itemKey);
                                                                }}
                                                                className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer shrink-0"
                                                            />
                                                        </div>
                                                        <p className={cn(
                                                            "text-xs font-bold text-gray-800 transition-all",
                                                            isChecked && 'line-through text-gray-400 font-normal'
                                                        )}>
                                                            {milestone.task}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 leading-relaxed">
                                                            {milestone.details}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
