import { Link, useParams, useNavigate } from "react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePuterStore } from "~/lib/puter";
import { cn, normalizeFeedback } from "~/lib/utils";
import { prepareInterviewInstructions, generateAIAnswerPrompt, INTERVIEW_PREP_VERSION } from "../../constants";

export const meta = () => ([
    { title: "Interview Preparation | ResumeIQ" },
    { name: "description", content: "Prepare for interviews with AI generated questions." },
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

/* ── Summary Stat Card ─────────────────────────────────────── */

const SummaryCard = ({ icon, label, value, accent }: { icon: string; label: string; value: string | number; accent: string }) => (
    <div className={cn("flex items-center gap-3 bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200", accent)}>
        <span className="text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
        </div>
    </div>
);

/* ── AI Answer Display Component ──────────────────────────── */

const AIAnswerPanel = ({ answer }: { answer: AIAnswer }) => (
    <div className="mt-3 space-y-3 animate-in fade-in duration-300">
        {/* Ideal Answer */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3">
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                ✅ Ideal Answer
            </span>
            <p className="text-[11px] text-emerald-900 leading-relaxed">{answer.idealAnswer}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Key Points */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3">
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    🎯 Key Points
                </span>
                <ul className="space-y-1">
                    {answer.keyPoints.map((p, i) => (
                        <li key={i} className="text-[10px] text-blue-800 flex items-start gap-1.5">
                            <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                            <span>{p}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Common Mistakes */}
            <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3">
                <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    ⚠️ Common Mistakes
                </span>
                <ul className="space-y-1">
                    {answer.commonMistakes.map((m, i) => (
                        <li key={i} className="text-[10px] text-rose-800 flex items-start gap-1.5">
                            <span className="text-rose-400 mt-0.5 shrink-0">✗</span>
                            <span>{m}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Follow-up Questions */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3">
                <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    🔄 Follow-up Questions
                </span>
                <ul className="space-y-1">
                    {answer.followUpQuestions.map((q, i) => (
                        <li key={i} className="text-[10px] text-amber-800 flex items-start gap-1.5">
                            <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                            <span>{q}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
);

/* ── STAR Coaching Component ──────────────────────────────── */

const STARCoachingPanel = ({ coaching }: { coaching: StarCoaching }) => {
    const starItems = [
        { key: "situation", label: "Situation", icon: "📍", color: "border-blue-200 bg-blue-50/50", textColor: "text-blue-700", labelColor: "text-blue-600", tip: coaching.situation },
        { key: "task", label: "Task", icon: "🎯", color: "border-violet-200 bg-violet-50/50", textColor: "text-violet-700", labelColor: "text-violet-600", tip: coaching.task },
        { key: "action", label: "Action", icon: "⚙️", color: "border-teal-200 bg-teal-50/50", textColor: "text-teal-700", labelColor: "text-teal-600", tip: coaching.action },
        { key: "result", label: "Result", icon: "📊", color: "border-amber-200 bg-amber-50/50", textColor: "text-amber-700", labelColor: "text-amber-600", tip: coaching.result },
    ];

    return (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {starItems.map((item) => (
                <div key={item.key} className={cn("border rounded-lg p-2.5", item.color)}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs">{item.icon}</span>
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", item.labelColor)}>{item.label}</span>
                    </div>
                    <p className={cn("text-[10px] leading-relaxed", item.textColor)}>{item.tip}</p>
                </div>
            ))}
        </div>
    );
};

/* ── Compute dynamic readiness from stored analysis ───────── */

const computeReadiness = (normalized: Feedback | null): InterviewReadiness => {
    if (!normalized) return { technical: 50, resume: 50, communication: 50, overall: 50 };

    const { atsScore, careerAnalysis, strengths, weaknesses } = normalized;
    const matchCount = careerAnalysis?.matchingSkills?.length || 0;
    const missCount = careerAnalysis?.missingSkills?.length || 0;
    const totalSkills = matchCount + missCount;

    // Technical Readiness: skill match ratio weighted with ATS skills score
    const skillRatio = totalSkills > 0 ? matchCount / totalSkills : 0.5;
    let technical = Math.round(skillRatio * 60 + (atsScore?.skills || 50) * 0.4);
    technical = Math.max(25, Math.min(95, technical));

    // Resume Readiness: ATS content + structure + strengths vs weaknesses balance
    const strengthCount = strengths?.length || 0;
    const weaknessCount = weaknesses?.length || 0;
    const balanceBonus = Math.min(10, (strengthCount - weaknessCount) * 3);
    let resume = Math.round(((atsScore?.content || 50) * 0.4 + (atsScore?.structure || 50) * 0.3 + (atsScore?.ats || 50) * 0.3) + balanceBonus);
    resume = Math.max(25, Math.min(95, resume));

    // Communication Readiness: Tone & style + content quality
    let communication = Math.round((atsScore?.toneAndStyle || 50) * 0.6 + (atsScore?.content || 50) * 0.4);
    communication = Math.max(25, Math.min(95, communication));

    // Overall: Weighted average, anchored to ATS overall (never more than +8 above it)
    const rawOverall = Math.round(technical * 0.4 + resume * 0.3 + communication * 0.3);
    const atsOverall = atsScore?.overallScore || 50;
    let overall = Math.min(rawOverall, atsOverall + 8);
    overall = Math.max(25, Math.min(95, overall));

    return { technical, resume, communication, overall };
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

    // Build project-specific resume questions from skills
    const projectSkillGroups = [
        { name: "Full Stack Web Application", techs: skills.filter(s => ["React", "Node.js", "Express.js", "MongoDB", "MySQL"].includes(s)).slice(0, 4) },
        { name: "API Integration Project", techs: skills.filter(s => ["REST APIs", "JavaScript", "Git", "Authentication & Authorization"].includes(s)).slice(0, 3) },
        { name: "Data Processing Pipeline", techs: skills.filter(s => ["Python", "Java", "SQL", "Data Structures & Algorithms"].includes(s)).slice(0, 3) },
    ].filter(g => g.techs.length > 0);

    const resumeBasedQuestions: ResumeQuestion[] = projectSkillGroups.length > 0
        ? projectSkillGroups.map(g => ({
            projectName: g.name,
            technologies: g.techs.length > 0 ? g.techs : skills.slice(0, 3),
            questions: [
                `Walk me through the architecture of your ${g.name}.`,
                `What were the biggest technical challenges you faced in this project?`,
                `Why did you choose ${g.techs[0] || "this technology"} for this project?`,
                `How would you improve the scalability of this project today?`,
                `What testing strategy did you use?`,
            ],
        }))
        : [{
            projectName: "Your Featured Project",
            technologies: skills.slice(0, 3),
            questions: [
                "Walk me through the architecture of this project.",
                "What were the biggest technical challenges you faced?",
                "How would you improve it today?",
                "What was your specific technical contribution?",
                "How did you handle deployment and monitoring?",
            ],
        }];

    const behavioralQuestions: BehavioralQuestion[] = [
        {
            question: "Tell me about yourself and your journey into tech.",
            starCoaching: {
                situation: "Set the scene with your background — what sparked your interest in technology and what path led you here.",
                task: "Highlight the key decision points or goals that directed your career toward this specific role.",
                action: "Describe the concrete steps you took: courses, projects, internships, or self-learning that built your skills.",
                result: "Summarize where you are now and connect it to why you're a strong fit for this role.",
            },
        },
        {
            question: "Describe a difficult bug you solved and your approach.",
            starCoaching: {
                situation: "Describe the production environment or project context where the bug appeared and its impact.",
                task: "Clarify what was broken and why it was urgent — mention user impact or business criticity.",
                action: "Walk through your debugging methodology: logs, reproduction steps, root cause analysis, fix implementation.",
                result: "Quantify the outcome — uptime restored, users unblocked, prevention measures added.",
            },
        },
        {
            question: "Describe a project you are most proud of and why.",
            starCoaching: {
                situation: "Set context about the project scope, team size, and timeline.",
                task: "Explain your specific role and the key challenge you were responsible for solving.",
                action: "Detail the technical decisions you made and the implementation approach.",
                result: "Share measurable outcomes: users served, performance improvements, or business metrics impacted.",
            },
        },
        {
            question: "How do you handle tight deadlines and competing priorities?",
            starCoaching: {
                situation: "Describe a real scenario with multiple urgent tasks or a tight deadline.",
                task: "Explain what was at stake and why prioritization was critical.",
                action: "Show your prioritization framework: urgency vs importance, communication with stakeholders, breaking work into deliverables.",
                result: "Highlight that you met the deadline and how your approach prevented similar issues in the future.",
            },
        },
        {
            question: `Why do you want to work as a ${jobTitle}?`,
            starCoaching: {
                situation: "Connect your career journey to this specific role — what experiences led you here.",
                task: "Explain the specific challenges of this role that excite you and align with your skills.",
                action: "Reference specific projects or skills that demonstrate your readiness for this position.",
                result: "Articulate the long-term value you'll bring and how this role fits your growth trajectory.",
            },
        },
        {
            question: "Tell me about a time you disagreed with a teammate.",
            starCoaching: {
                situation: "Describe the context of the disagreement — was it about architecture, approach, or priorities?",
                task: "Clarify your position and why you believed your approach was better.",
                action: "Explain how you communicated your perspective, listened to the other side, and reached resolution.",
                result: "Highlight the outcome: better solution, maintained relationship, or team process improvement.",
            },
        },
        {
            question: "How do you stay current with new technologies?",
            starCoaching: {
                situation: "Describe your learning ecosystem — blogs, courses, open source, communities you follow.",
                task: "Explain why staying current matters for your role and how you decide what to learn.",
                action: "Give specific examples of recent technologies you learned and how you applied them.",
                result: "Show the impact — a side project, a work improvement, or a skill that landed you an opportunity.",
            },
        },
        {
            question: "Describe a time you had to learn something quickly.",
            starCoaching: {
                situation: "Set the scene: what technology or concept did you need to learn and what was the time pressure?",
                task: "Explain why rapid learning was critical — project deadline, production issue, or team need.",
                action: "Describe your learning strategy: documentation, tutorials, pair programming, prototyping.",
                result: "Quantify how quickly you became productive and the quality of your contribution.",
            },
        },
    ];

    return {
        version: INTERVIEW_PREP_VERSION,
        technicalQuestions,
        resumeBasedQuestions,
        behavioralQuestions,
        codingTopics: [
            { topic: "Arrays & Strings", importance: "High", reason: "Foundation for most coding interviews" },
            { topic: "Hash Maps", importance: "High", reason: "Key for optimization problems" },
            { topic: "Sliding Window", importance: "Medium", reason: "Common pattern in string/array problems" },
            { topic: "Trees & Graphs", importance: "Medium", reason: "Tests algorithmic thinking" },
            { topic: "Dynamic Programming", importance: "Medium", reason: "Advanced problem solving" },
            { topic: "Stacks & Queues", importance: "Low", reason: "Basic data structure proficiency" },
        ],
        readinessScores: { technical: 50, resume: 50, communication: 50, overall: 50 },
        interviewSummary: {
            estimatedDuration: "45-60 minutes",
            topSkillsEvaluated: skills.slice(0, 3),
        },
        coachingNotes: [
            `Focus on explaining your projects in detail using ${skills[0] || "your primary technology"}.`,
            `Prepare to answer backend API and system design questions for the ${jobTitle} role.`,
            `Review core ${skills.slice(0, 3).join(", ")} concepts before the interview.`,
            "Practice behavioral questions using the STAR framework — prepare 3-4 concrete stories.",
            skills.length > 5
                ? `Strengthen knowledge of ${skills.slice(3, 5).join(" and ")} for deeper technical discussions.`
                : "Build side projects that demonstrate end-to-end ownership to strengthen your profile.",
        ],
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

    // AI Answer states
    const [aiAnswers, setAiAnswers] = useState<Record<string, AIAnswer>>({});
    const [aiErrors, setAiErrors] = useState<Record<string, string>>({});
    const [loadingAnswer, setLoadingAnswer] = useState<string | null>(null);

    // Expanded STAR coaching
    const [expandedStar, setExpandedStar] = useState<Record<string, boolean>>({});

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

                // Step 3: Check cache first (with version check)
                const cacheKey = `interview-prep:${resumeId}`;
                const cached = await kv.get(cacheKey);
                if (cached) {
                    try {
                        const parsedCache = JSON.parse(cached);
                        if (parsedCache && parsedCache.technicalQuestions && parsedCache.version === INTERVIEW_PREP_VERSION) {
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
                    const response = await ai.chat(prompt);
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
                    ? { ...aiResult, version: INTERVIEW_PREP_VERSION }
                    : generateFallbackData(extractedSkills, data.jobTitle || "Software Developer");

                // Ensure all new fields exist even if AI omitted them
                if (!finalData.interviewSummary) {
                    finalData.interviewSummary = {
                        estimatedDuration: "45-60 minutes",
                        topSkillsEvaluated: extractedSkills.slice(0, 3),
                    };
                }
                if (!finalData.coachingNotes || finalData.coachingNotes.length === 0) {
                    finalData.coachingNotes = [
                        `Focus on explaining your projects in detail using ${extractedSkills[0] || "your primary technology"}.`,
                        `Prepare for backend API questions relevant to the ${data.jobTitle || "target"} role.`,
                        "Practice behavioral questions using the STAR framework.",
                    ];
                }

                // Normalize behavioral questions if AI returned old string[] format
                if (finalData.behavioralQuestions && finalData.behavioralQuestions.length > 0) {
                    const first = finalData.behavioralQuestions[0];
                    if (typeof first === "string") {
                        finalData.behavioralQuestions = (finalData.behavioralQuestions as unknown as string[]).map(q => ({
                            question: q,
                            starCoaching: {
                                situation: "Describe the specific context and environment where this occurred.",
                                task: "Explain your specific responsibility and what needed to be accomplished.",
                                action: "Detail the concrete steps you took and the technical decisions you made.",
                                result: "Quantify the outcome with metrics, improvements, or measurable impact.",
                            },
                        }));
                    }
                }

                // Normalize resume questions if AI returned without technologies
                if (finalData.resumeBasedQuestions && finalData.resumeBasedQuestions.length > 0) {
                    finalData.resumeBasedQuestions = finalData.resumeBasedQuestions.map(rq => ({
                        ...rq,
                        technologies: rq.technologies || extractedSkills.slice(0, 3),
                    }));
                }

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

    const toggleStar = (key: string) => {
        setExpandedStar(prev => ({ ...prev, [key]: !prev[key] }));
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

    // Generate AI answer for a specific question (lazy, on-demand)
    const handleShowAIAnswer = useCallback(async (questionKey: string, questionText: string, projectContext?: string) => {
        console.log("--------------------------------------------------");
        console.log(`[DEBUG] 1. Button click fired for question: ${questionKey}`);
        
        if (aiAnswers[questionKey] || loadingAnswer === questionKey) {
            console.log(`[DEBUG] Skipping generation. Already generated or currently loading.`);
            return;
        }

        console.log(`[DEBUG] 2. AI generation function (handleShowAIAnswer) is being called.`);
        setLoadingAnswer(questionKey);
        setAiErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[questionKey];
            return newErrors;
        });

        const normalized = resumeData?.feedback
            ? normalizeFeedback(resumeData.feedback, resumeData.jobTitle, resumeData.jobDescription)
            : null;
        const extractedSkills = normalized?.extractedSkills || [];

        try {
            const prompt = generateAIAnswerPrompt({
                question: questionText,
                jobTitle: resumeData?.jobTitle || "Software Developer",
                extractedSkills,
                projectContext: projectContext || "",
            });

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("AI generation timed out after 30 seconds")), 30000)
            );

            const response = await Promise.race([
                ai.chat(prompt),
                timeoutPromise
            ]) as any;

            console.log(`[DEBUG] 8. Raw API response:`, response);
            console.log(`[DEBUG] 9. HTTP status code: (Puter JS SDK abstracts this, check raw response metadata if any)`);

            if (response) {
                const content = typeof response?.message?.content === "string"
                    ? response.message.content
                    : response?.message?.content?.[0]?.text || "";

                let cleanedText = content.trim();
                if (cleanedText.startsWith("```")) {
                    cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, "").replace(/```$/, "").trim();
                }

                console.log(`[DEBUG] Cleaned Text to parse:\n${cleanedText}`);
                const parsed = JSON.parse(cleanedText) as AIAnswer;
                console.log(`[DEBUG] 11. Parsed response:`, parsed);
                
                if (!parsed.idealAnswer || !parsed.keyPoints) {
                    throw new Error(`Parsed response is missing required fields. Parsed output: ${JSON.stringify(parsed)}`);
                }
                
                console.log(`[DEBUG] 12. Final value returned to UI:`, parsed);
                setAiAnswers(prev => ({ ...prev, [questionKey]: parsed }));
                console.log("--------------------------------------------------");
            } else {
                throw new Error("No response from AI (response is null/undefined)");
            }
        } catch (e: any) {
            console.error("[DEBUG] 10. Exception caught!");
            console.error(e);
            if (e?.stack) console.error("Stack trace:", e.stack);
            
            const errorMsg = e instanceof Error ? `${e.name}: ${e.message}` : JSON.stringify(e);
            console.log(`[DEBUG] Setting error state for UI: ${errorMsg}`);
            setAiErrors(prev => ({ ...prev, [questionKey]: errorMsg }));
            console.log("--------------------------------------------------");
        } finally {
            setLoadingAnswer(null);
        }
    }, [aiAnswers, loadingAnswer, resumeData, ai]);

    const normalized = resumeData?.feedback
        ? normalizeFeedback(resumeData.feedback, resumeData.jobTitle, resumeData.jobDescription)
        : null;

    // Compute dynamic readiness scores from stored analysis
    const readinessScores = computeReadiness(normalized);

    // Count totals for resume-based questions
    const totalResumeQuestions = interviewData?.resumeBasedQuestions?.reduce((sum, p) => sum + p.questions.length, 0) || 0;

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

                        {/* ═══════════ INTERVIEW SUMMARY DASHBOARD ═══════════ */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                                <span className="text-lg">📋</span>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800">Interview Summary</h2>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Overview of your personalized interview preparation</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <SummaryCard
                                    icon="💻"
                                    label="Technical Questions"
                                    value={interviewData.technicalQuestions.length}
                                    accent="hover:border-teal-200"
                                />
                                <SummaryCard
                                    icon="📄"
                                    label="Resume Questions"
                                    value={totalResumeQuestions}
                                    accent="hover:border-violet-200"
                                />
                                <SummaryCard
                                    icon="🗣️"
                                    label="Behavioral Questions"
                                    value={interviewData.behavioralQuestions.length}
                                    accent="hover:border-cyan-200"
                                />
                                <SummaryCard
                                    icon="⌨️"
                                    label="Coding Topics"
                                    value={interviewData.codingTopics.length}
                                    accent="hover:border-amber-200"
                                />
                                <SummaryCard
                                    icon="🎯"
                                    label="Target Role"
                                    value={resumeData?.jobTitle || "N/A"}
                                    accent="hover:border-indigo-200"
                                />
                                <SummaryCard
                                    icon="🏢"
                                    label="Company"
                                    value={resumeData?.companyName || "Not specified"}
                                    accent="hover:border-slate-200"
                                />
                                <SummaryCard
                                    icon="⏱️"
                                    label="Est. Duration"
                                    value={interviewData.interviewSummary?.estimatedDuration || "45-60 min"}
                                    accent="hover:border-emerald-200"
                                />
                                <div className="bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 hover:border-rose-200">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-lg">🔥</span>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Top Skills Evaluated</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {(interviewData.interviewSummary?.topSkillsEvaluated || normalized?.extractedSkills?.slice(0, 3) || []).map((skill, i) => (
                                            <span key={i} className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-rose-50 text-rose-700 border border-rose-100">
                                                {skill}
                                            </span>
                                        ))}
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
                                {interviewData.technicalQuestions.map((q, i) => {
                                    const qKey = `tech-${i}`;
                                    return (
                                        <div
                                            key={i}
                                            className="border border-gray-100 rounded-xl p-3.5 hover:border-teal-200 hover:bg-teal-50/20 transition-all duration-200"
                                        >
                                            <div
                                                className="flex items-start justify-between gap-2 cursor-pointer"
                                                onClick={() => toggleQuestion(qKey)}
                                            >
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
                                                expandedQuestions[qKey] ? "opacity-100 max-h-40" : "opacity-70 max-h-20 overflow-hidden"
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

                                            {/* Show AI Answer Button */}
                                            <div className="mt-3 pl-7">
                                                {aiErrors[qKey] && (
                                                    <div className="mb-2 text-[10px] text-red-600 bg-red-50 p-2 rounded border border-red-100 flex items-start gap-1.5 overflow-auto max-w-full">
                                                        <span className="mt-0.5 shrink-0">⚠️</span>
                                                        <span className="font-mono whitespace-pre-wrap break-all">{aiErrors[qKey]}</span>
                                                    </div>
                                                )}
                                                {!aiAnswers[qKey] && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleShowAIAnswer(qKey, q.question);
                                                        }}
                                                        disabled={loadingAnswer === qKey}
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer",
                                                            loadingAnswer === qKey
                                                                ? "bg-gray-50 text-gray-400 border-gray-200 cursor-wait"
                                                                : "bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 border-teal-200 hover:from-teal-100 hover:to-cyan-100 hover:shadow-sm"
                                                        )}
                                                    >
                                                        {loadingAnswer === qKey ? (
                                                            <>
                                                                <div className="w-3 h-3 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin" />
                                                                Generating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>{aiErrors[qKey] ? "🔄" : "✨"}</span>
                                                                {aiErrors[qKey] ? "Retry Generation" : "Show AI Answer"}
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                {aiAnswers[qKey] && <AIAnswerPanel answer={aiAnswers[qKey]} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ═══════════ SECTION 2: RESUME-BASED QUESTIONS ═══════════ */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                                <span className="text-lg">📋</span>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800">Resume-Based Questions</h2>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Project-specific deep-dive questions about your experience</p>
                                </div>
                                <span className="ml-auto text-xs text-violet-600 font-bold bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                                    {interviewData.resumeBasedQuestions.length} Projects
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {interviewData.resumeBasedQuestions.map((project, i) => (
                                    <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-violet-200 hover:bg-violet-50/10 transition-all duration-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm">🚀</span>
                                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">{project.projectName}</h3>
                                        </div>

                                        {/* Technology badges */}
                                        {project.technologies && project.technologies.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {project.technologies.map((tech, t) => (
                                                    <span key={t} className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-violet-100 text-violet-600 border border-violet-200">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {project.questions.map((question, j) => {
                                                const rqKey = `resume-${i}-${j}`;
                                                return (
                                                    <div key={j}>
                                                        <div className="flex items-start gap-2 bg-violet-50/50 rounded-lg px-3 py-2">
                                                            <span className="text-[9px] font-bold text-violet-500 bg-violet-100 rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
                                                                {j + 1}
                                                            </span>
                                                            <div className="flex-1">
                                                                <p className="text-[11px] text-gray-700 font-medium leading-relaxed">{question}</p>

                                                                {/* Show AI Answer Button */}
                                                                <div className="mt-2">
                                                                    {aiErrors[rqKey] && (
                                                                        <div className="mb-2 text-[10px] text-red-600 bg-red-50 p-2 rounded border border-red-100 flex items-start gap-1.5 overflow-auto max-w-full">
                                                                            <span className="mt-0.5 shrink-0">⚠️</span>
                                                                            <span className="font-mono whitespace-pre-wrap break-all">{aiErrors[rqKey]}</span>
                                                                        </div>
                                                                    )}
                                                                    {!aiAnswers[rqKey] && (
                                                                        <button
                                                                            onClick={() => handleShowAIAnswer(
                                                                                rqKey,
                                                                                question,
                                                                                `Project: ${project.projectName}, Technologies: ${(project.technologies || []).join(", ")}`
                                                                            )}
                                                                            disabled={loadingAnswer === rqKey}
                                                                            className={cn(
                                                                                "inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-md border transition-all duration-200 cursor-pointer",
                                                                                loadingAnswer === rqKey
                                                                                    ? "bg-gray-50 text-gray-400 border-gray-200 cursor-wait"
                                                                                    : "bg-white text-violet-600 border-violet-200 hover:bg-violet-50 hover:shadow-sm"
                                                                            )}
                                                                        >
                                                                            {loadingAnswer === rqKey ? (
                                                                                <>
                                                                                    <div className="w-2.5 h-2.5 border-2 border-gray-300 border-t-violet-500 rounded-full animate-spin" />
                                                                                    Generating...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <span>{aiErrors[rqKey] ? "🔄" : "✨"}</span>
                                                                                    {aiErrors[rqKey] ? "Retry Generation" : "Show AI Answer"}
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                    {aiAnswers[rqKey] && <AIAnswerPanel answer={aiAnswers[rqKey]} />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                                    <p className="text-[11px] text-gray-400 mt-0.5">Practice using the STAR method with AI coaching guidance</p>
                                </div>
                                <span className="ml-auto text-xs text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                                    {interviewData.behavioralQuestions.length} Q
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {interviewData.behavioralQuestions.map((bq, i) => {
                                    const starKey = `bq-star-${i}`;
                                    const isStarOpen = expandedStar[starKey];

                                    return (
                                        <div key={i} className="border border-gray-100 rounded-xl p-3.5 hover:border-cyan-200 hover:bg-cyan-50/20 transition-all duration-200">
                                            <div className="flex items-start gap-3">
                                                <span className="text-[10px] font-black text-white bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                                    {i + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-gray-800 leading-relaxed">{bq.question}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1.5 italic">
                                                        💡 Tip: Use the STAR method to structure your answer
                                                    </p>

                                                    {/* STAR Coaching Toggle */}
                                                    <button
                                                        onClick={() => toggleStar(starKey)}
                                                        className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border-cyan-200 hover:from-cyan-100 hover:to-blue-100 hover:shadow-sm transition-all duration-200 cursor-pointer"
                                                    >
                                                        <span>{isStarOpen ? "🔽" : "▶️"}</span>
                                                        {isStarOpen ? "Hide STAR Coaching" : "Show STAR Coaching"}
                                                    </button>

                                                    {/* STAR Coaching Panel */}
                                                    {isStarOpen && bq.starCoaching && (
                                                        <STARCoachingPanel coaching={bq.starCoaching} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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

                        {/* ═══════════ SECTION 5: PREPARATION STATUS ═══════════ */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                                <span className="text-lg">📋</span>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800">Preparation Status</h2>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Quick checklist for your upcoming interview</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                                    <span className="text-emerald-500">✅</span>
                                    <span className="text-xs font-medium text-gray-800">Resume Ready</span>
                                </div>
                                <div className="flex items-center gap-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                                    <span className="text-emerald-500">✅</span>
                                    <span className="text-xs font-medium text-gray-800">Interview Questions Ready</span>
                                </div>
                                <div className="flex items-center gap-2 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                                    <span className="text-amber-500">⚠</span>
                                    <span className="text-xs font-medium text-gray-800">Review Skill Gaps</span>
                                </div>
                                <div className="flex items-center gap-2 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                                    <span className="text-amber-500">⚠</span>
                                    <span className="text-xs font-medium text-gray-800">Practice Project Explanations</span>
                                </div>
                                <div className="flex items-center gap-2 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 md:col-span-2">
                                    <span className="text-amber-500">⚠</span>
                                    <span className="text-xs font-medium text-gray-800">Prepare STAR Stories</span>
                                </div>
                            </div>

                            {/* AI Coaching Tip */}
                            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <span className="text-lg">💡</span>
                                    <div>
                                        <h3 className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">AI Coaching Tip</h3>
                                        <p className="text-xs text-blue-900 leading-relaxed font-medium">
                                            {interviewData.coachingNotes && interviewData.coachingNotes.length > 0
                                                ? interviewData.coachingNotes[0]
                                                : "Focus on explaining your projects confidently and review core technical concepts before interviewing."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </main>
    );
}
