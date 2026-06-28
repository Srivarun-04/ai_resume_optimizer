import { Link, useParams, useNavigate } from "react-router";
import { useEffect, useState, useRef } from "react";
import { usePuterStore } from "~/lib/puter";
import { cn, normalizeFeedback } from "~/lib/utils";
import { prepareInterviewInstructions } from "../../constants";

export const meta = () => ([
    { title: "Resumind | Interview Preparation" },
    { name: "description", content: "AI-powered interview preparation based on your resume and target role" },
]);

/* ── Reusable tiny components ─────────────────────────────── */

const DifficultyBadge = ({ level }: { level: string }) => {
    const styles: Record<string, string> = {
        Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
        Medium: "bg-amber-50 text-amber-700 border-amber-200",
        Hard: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return (
        <span className={cn("px-2 py-0.5 text-[9px] font-bold rounded-full border shrink-0", styles[level] || styles.Medium)}>
            {level}
        </span>
    );
};

const ImportanceBadge = ({ level }: { level: string }) => {
    const config: Record<string, { icon: string; style: string }> = {
        High: { icon: "🔥", style: "bg-rose-50 text-rose-700 border-rose-200" },
        Medium: { icon: "⚡", style: "bg-amber-50 text-amber-700 border-amber-200" },
        Low: { icon: "📝", style: "bg-slate-50 text-slate-600 border-slate-200" },
    };
    const c = config[level] || config.Medium;
    return (
        <span className={cn("px-2 py-0.5 text-[9px] font-bold rounded-full border inline-flex items-center gap-1", c.style)}>
            {c.icon} {level}
        </span>
    );
};

const ProgressBar = ({ label, value, color }: { label: string; value: number; color: string }) => {
    const barRef = useRef<HTMLDivElement>(null);
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimated(true), 200);
        return () => clearTimeout(timer);
    }, []);

    const scoreColor = value >= 75 ? "text-emerald-600" : value >= 50 ? "text-amber-600" : "text-rose-600";

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">{label}</span>
                <span className={cn("text-xs font-black", scoreColor)}>{value}/100</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    ref={barRef}
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)}
                    style={{ width: animated ? `${Math.min(value, 100)}%` : "0%" }}
                />
            </div>
        </div>
    );
};

/* ── Fallback data generator (if AI fails) ────────────────── */

const generateFallbackData = (skills: string[], jobTitle: string): InterviewPrepData => {
    const technicalQuestions: InterviewQuestion[] = skills.slice(0, 10).map((skill, i) => ({
        question: `Explain the core concepts of ${skill} and how you have applied it in your projects.`,
        difficulty: i < 3 ? "Easy" as const : i < 7 ? "Medium" as const : "Hard" as const,
        expectedTopics: [skill, "Best Practices", "Real-world Usage"],
    }));

    while (technicalQuestions.length < 10) {
        technicalQuestions.push({
            question: `Describe a challenging problem you solved using ${skills[0] || "your technical skills"}.`,
            difficulty: "Medium",
            expectedTopics: ["Problem Solving", "Technical Depth"],
        });
    }

    return {
        technicalQuestions,
        resumeBasedQuestions: [
            { projectName: "Your Featured Project", questions: ["Walk me through the architecture of this project.", "What were the biggest technical challenges you faced?", "How would you improve it today?"] },
            { projectName: "Team Collaboration Project", questions: ["How did you divide responsibilities?", "What was your specific contribution?"] },
        ],
        behavioralQuestions: [
            "Tell me about yourself and your journey into tech.",
            "Describe a difficult bug you solved and your approach.",
            "Describe a project you are most proud of and why.",
            "How do you handle tight deadlines and competing priorities?",
            `Why do you want to work as a ${jobTitle}?`,
            "Tell me about a time you disagreed with a teammate.",
            "How do you stay current with new technologies?",
            "Describe a time you had to learn something quickly.",
        ],
        codingTopics: [
            { topic: "Arrays & Strings", importance: "High", reason: "Foundation for most coding interviews" },
            { topic: "Hash Maps", importance: "High", reason: "Key for optimization problems" },
            { topic: "Sliding Window", importance: "Medium", reason: "Common pattern in string/array problems" },
            { topic: "Trees & Graphs", importance: "Medium", reason: "Tests algorithmic thinking" },
            { topic: "Dynamic Programming", importance: "Medium", reason: "Advanced problem solving" },
            { topic: "Stacks & Queues", importance: "Low", reason: "Basic data structure proficiency" },
        ],
        readinessScores: {
            technical: Math.min(95, 50 + skills.length * 3),
            resume: 70,
            communication: 65,
            overall: Math.min(90, 55 + skills.length * 2),
        },
    };
};

/* ── Main Page Component ──────────────────────────────────── */

export default function InterviewPreparation() {
    const { auth, isLoading, kv, ai } = usePuterStore();
    const { resumeId } = useParams();
    const navigate = useNavigate();

    const [loadingState, setLoadingState] = useState<"loading" | "generating" | "complete" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [resumeData, setResumeData] = useState<any>(null);
    const [interviewData, setInterviewData] = useState<InterviewPrepData | null>(null);
    const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate(`/auth?next=/interview-preparation/${resumeId}`);
        }
    }, [isLoading, auth.isAuthenticated, resumeId]);

    useEffect(() => {
        if (isLoading || !auth.isAuthenticated || !resumeId) return;

        const loadAndGenerate = async () => {
            try {
                setLoadingState("loading");

                // Step 1: Load resume data from KV
                const stored = await kv.get(`resume:${resumeId}`);
                if (!stored) {
                    setLoadingState("error");
                    setErrorMessage("Resume data not found in storage.");
                    return;
                }

                const data = JSON.parse(stored);
                if (!data || !data.feedback) {
                    setLoadingState("error");
                    setErrorMessage("Invalid resume data: Feedback section is missing.");
                    return;
                }

                setResumeData(data);

                // Step 2: Normalize feedback to extract skills & career data
                const normalized = normalizeFeedback(data.feedback, data.jobTitle, data.jobDescription);
                const extractedSkills = normalized.extractedSkills || [];
                const matchingSkills = normalized.careerAnalysis?.matchingSkills || [];
                const missingSkills = normalized.careerAnalysis?.missingSkills || [];
                const recommendedRoles = normalized.careerAnalysis?.recommendedRoles || [];
                const strengths = normalized.strengths?.map(s => s.tip) || [];
                const weaknesses = normalized.weaknesses?.map(w => w.tip) || [];

                // Step 3: Check cache first
                const cacheKey = `interview-prep:${resumeId}`;
                const cached = await kv.get(cacheKey);
                if (cached) {
                    try {
                        const parsedCache = JSON.parse(cached);
                        if (parsedCache && parsedCache.technicalQuestions) {
                            setInterviewData(parsedCache);
                            setLoadingState("complete");
                            return;
                        }
                    } catch {
                        // Cache corrupted, regenerate
                    }
                }

                // Step 4: Generate via AI
                setLoadingState("generating");

                const prompt = prepareInterviewInstructions({
                    jobTitle: data.jobTitle || "Software Developer",
                    jobDescription: data.jobDescription || "",
                    extractedSkills,
                    matchingSkills,
                    missingSkills,
                    recommendedRoles,
                    strengths,
                    weaknesses,
                });

                let aiResult: InterviewPrepData | null = null;

                try {
                    const response = await ai.chat(prompt, { model: "claude-3-5-sonnet" });
                    if (response) {
                        const content = typeof response.message?.content === "string"
                            ? response.message.content
                            : response.message?.content?.[0]?.text || "";

                        let cleanedText = content.trim();
                        if (cleanedText.startsWith("```")) {
                            cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, "").replace(/```$/, "").trim();
                        }
                        aiResult = JSON.parse(cleanedText);
                    }
                } catch (e) {
                    console.error("AI interview generation failed:", e);
                }

                // Step 5: Use AI result or fallback
                const finalData = aiResult && aiResult.technicalQuestions
                    ? aiResult
                    : generateFallbackData(extractedSkills, data.jobTitle || "Software Developer");

                // Cache the result
                await kv.set(cacheKey, JSON.stringify(finalData));

                setInterviewData(finalData);
                setLoadingState("complete");

            } catch (err) {
                console.error("Error loading interview preparation:", err);
                setLoadingState("error");
                setErrorMessage(err instanceof Error ? err.message : "Failed to load interview preparation.");
            }
        };

        loadAndGenerate();
    }, [resumeId, isLoading, auth.isAuthenticated]);

    const toggleQuestion = (key: string) => {
        setExpandedQuestions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleRetry = () => {
        // Clear the cache so it regenerates
        if (resumeId) {
            kv.delete(`interview-prep:${resumeId}`);
        }
        setLoadingState("loading");
        setInterviewData(null);
        // Trigger re-run
        window.location.reload();
    };

    const normalized = resumeData?.feedback
        ? normalizeFeedback(resumeData.feedback, resumeData.jobTitle, resumeData.jobDescription)
        : null;

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
                    <span className="text-xs text-gray-500 font-medium">Interview Preparation</span>
                </div>
                <div className="text-xs font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
                    AI Interview Coach
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

                {/* ── Loading State ── */}
                {(loadingState === "loading" || loadingState === "generating") && (
                    <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center animate-pulse">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {loadingState === "generating" ? "Generating Interview Pack" : "Interview Preparation"}
                        </h1>
                        <p className="text-sm text-gray-500 mt-4">
                            {loadingState === "generating"
                                ? "AI is creating personalized questions based on your resume..."
                                : "Loading your resume data..."}
                        </p>
                        <div className="relative w-12 h-12 mx-auto mt-6">
                            <div className="absolute inset-0 rounded-full border-4 border-teal-100"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-teal-600 animate-spin"></div>
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
                                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow-sm hover:shadow cursor-pointer"
                            >
                                Retry Generation
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
                {loadingState === "complete" && interviewData && resumeData && (
                    <div className="space-y-6">

                        {/* ═══════════ HERO BANNER ═══════════ */}
                        <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 rounded-2xl p-5 text-white shadow-sm border border-teal-800">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        Interview Preparation Dashboard
                                    </span>
                                    <h1 className="text-xl md:text-2xl font-black mt-2 tracking-tight !text-white !bg-none !bg-clip-border">
                                        Ace Your Next Interview
                                    </h1>
                                    <p className="text-xs text-teal-200 mt-1 max-w-2xl">
                                        Personalized interview preparation for {resumeData?.jobTitle ? `"${resumeData.jobTitle}"` : "your target role"}
                                        {resumeData?.companyName ? ` at ${resumeData.companyName}` : ""}.
                                    </p>
                                </div>
                                <div className="flex gap-3 shrink-0">
                                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
                                        <span className="text-[10px] text-teal-300 font-semibold block uppercase">Resume Rating</span>
                                        <span className="text-2xl font-black text-white">
                                            {normalized?.atsScore?.overallScore ?? "N/A"}
                                        </span>
                                        <span className="text-[10px] text-teal-300 block">/100</span>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center min-w-[80px]">
                                        <span className="text-[10px] text-teal-300 font-semibold block uppercase">Target Role</span>
                                        <span className="text-[11px] font-bold text-white mt-1 block leading-tight">
                                            {resumeData?.jobTitle || "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══════════ SECTION 1: TECHNICAL INTERVIEW QUESTIONS ═══════════ */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                                <span className="text-lg">💻</span>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800">Technical Interview Questions</h2>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        {interviewData.technicalQuestions.length} personalized questions based on your skills
                                    </p>
                                </div>
                                <span className="ml-auto text-xs text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                                    {interviewData.technicalQuestions.length} Q
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {interviewData.technicalQuestions.map((q, i) => (
                                    <div
                                        key={i}
                                        className="border border-gray-100 rounded-xl p-3.5 hover:border-teal-200 hover:bg-teal-50/20 transition-all duration-200 cursor-pointer"
                                        onClick={() => toggleQuestion(`tech-${i}`)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2 flex-1">
                                                <span className="text-[10px] font-black text-gray-400 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                                                    {i + 1}
                                                </span>
                                                <p className="text-xs font-semibold text-gray-800 leading-relaxed">{q.question}</p>
                                            </div>
                                            <DifficultyBadge level={q.difficulty} />
                                        </div>

                                        {/* Expected Topics */}
                                        <div className={cn(
                                            "mt-2.5 pl-7 transition-all duration-200",
                                            expandedQuestions[`tech-${i}`] ? "opacity-100 max-h-40" : "opacity-70 max-h-20 overflow-hidden"
                                        )}>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Expected Topics</span>
                                            <div className="flex flex-wrap gap-1">
                                                {q.expectedTopics.map((topic, j) => (
                                                    <span key={j} className="px-2 py-0.5 text-[9px] font-medium rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ═══════════ SECTION 2: RESUME-BASED QUESTIONS ═══════════ */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                                <span className="text-lg">📋</span>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800">Resume-Based Questions</h2>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Deep-dive questions about your projects and experience</p>
                                </div>
                                <span className="ml-auto text-xs text-violet-600 font-bold bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                                    {interviewData.resumeBasedQuestions.length} Projects
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {interviewData.resumeBasedQuestions.map((project, i) => (
                                    <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-violet-200 hover:bg-violet-50/10 transition-all duration-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-sm">🚀</span>
                                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">{project.projectName}</h3>
                                        </div>
                                        <div className="space-y-2">
                                            {project.questions.map((question, j) => (
                                                <div key={j} className="flex items-start gap-2 bg-violet-50/50 rounded-lg px-3 py-2">
                                                    <span className="text-[9px] font-bold text-violet-500 bg-violet-100 rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
                                                        {j + 1}
                                                    </span>
                                                    <p className="text-[11px] text-gray-700 font-medium leading-relaxed">{question}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ═══════════ SECTION 3: BEHAVIORAL QUESTIONS ═══════════ */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                                <span className="text-lg">🗣️</span>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800">Behavioral Questions</h2>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Practice using the STAR method (Situation, Task, Action, Result)</p>
                                </div>
                                <span className="ml-auto text-xs text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                                    {interviewData.behavioralQuestions.length} Q
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {interviewData.behavioralQuestions.map((question, i) => (
                                    <div key={i} className="flex items-start gap-3 border border-gray-100 rounded-xl p-3.5 hover:border-cyan-200 hover:bg-cyan-50/20 transition-all duration-200">
                                        <span className="text-[10px] font-black text-white bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-gray-800 leading-relaxed">{question}</p>
                                            <p className="text-[10px] text-gray-400 mt-1.5 italic">
                                                💡 Tip: Use the STAR method to structure your answer
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ═══════════ SECTION 4: CODING PREPARATION ═══════════ */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                                <span className="text-lg">⌨️</span>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800">Coding Preparation</h2>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        Key topics ranked by importance for {resumeData?.jobTitle || "your target role"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {interviewData.codingTopics.map((topic, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "border rounded-xl p-4 transition-all duration-200 hover:shadow-md",
                                            topic.importance === "High"
                                                ? "border-rose-200 bg-gradient-to-b from-rose-50/50 to-white hover:border-rose-300"
                                                : topic.importance === "Medium"
                                                    ? "border-amber-200 bg-gradient-to-b from-amber-50/50 to-white hover:border-amber-300"
                                                    : "border-gray-200 bg-gradient-to-b from-gray-50/50 to-white hover:border-gray-300"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3 className="text-xs font-bold text-gray-900">{topic.topic}</h3>
                                            <ImportanceBadge level={topic.importance} />
                                        </div>
                                        <p className="text-[10px] text-gray-500 leading-relaxed">{topic.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ═══════════ SECTION 5: INTERVIEW READINESS SCORE ═══════════ */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-5 border-b border-gray-100 pb-3">
                                <span className="text-lg">📊</span>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800">Interview Readiness Score</h2>
                                    <p className="text-[11px] text-gray-400 mt-0.5">How prepared you are based on your profile analysis</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
                                <ProgressBar
                                    label="🔧 Technical Readiness"
                                    value={interviewData.readinessScores.technical}
                                    color="bg-gradient-to-r from-teal-500 to-emerald-500"
                                />
                                <ProgressBar
                                    label="📄 Resume Readiness"
                                    value={interviewData.readinessScores.resume}
                                    color="bg-gradient-to-r from-indigo-500 to-violet-500"
                                />
                                <ProgressBar
                                    label="🗣️ Communication Readiness"
                                    value={interviewData.readinessScores.communication}
                                    color="bg-gradient-to-r from-cyan-500 to-blue-500"
                                />
                                <div className="lg:col-span-2 mt-2 pt-4 border-t border-gray-100">
                                    <ProgressBar
                                        label="⭐ Overall Interview Readiness"
                                        value={interviewData.readinessScores.overall}
                                        color="bg-gradient-to-r from-amber-500 to-orange-500"
                                    />
                                </div>
                            </div>

                            {/* Readiness summary */}
                            <div className="mt-5 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-xl p-4">
                                <p className="text-xs text-teal-800 font-medium leading-relaxed">
                                    {interviewData.readinessScores.overall >= 80
                                        ? "🎉 Excellent! You're well-prepared for your interview. Focus on practicing your answers out loud and fine-tuning your responses."
                                        : interviewData.readinessScores.overall >= 60
                                            ? "👍 Good progress! Review the areas with lower scores and practice the technical and behavioral questions above."
                                            : "📚 Keep preparing! Focus on strengthening your technical skills and practicing the questions above. Consider filling the skill gaps identified in your career analysis."}
                                </p>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </main>
    );
}
