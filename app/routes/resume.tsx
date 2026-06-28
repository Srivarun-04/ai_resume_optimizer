import {Link, useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import {cn, normalizeFeedback} from "~/lib/utils";

export const meta = () => ([
    { title: 'Resume Analysis | ResumeIQ' },
    { name: 'description', content: 'AI Analysis of your resume' },
])

/* ── Tiny reusable pieces ─────────────────────────────────── */

const ScoreRing = ({ score, size = 56, stroke = 5 }: { score: number; size?: number; stroke?: number }) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);
    const color = score > 69 ? "#22c55e" : score > 49 ? "#eab308" : "#ef4444";

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                className="transition-all duration-700 ease-out" />
            <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
                className="fill-gray-800 text-[11px] font-bold" transform={`rotate(90 ${size / 2} ${size / 2})`}>
                {score}
            </text>
        </svg>
    );
};

const ScoreCard = ({ title, score, icon }: { title: string; score: number; icon: string }) => {
    const bg = score > 69 ? "from-emerald-50 to-white border-emerald-200"
        : score > 49 ? "from-amber-50 to-white border-amber-200"
            : "from-red-50 to-white border-red-200";

    return (
        <div className={cn("dash-card bg-gradient-to-b border", bg)}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</span>
            </div>
            <div className="flex items-center justify-center">
                <ScoreRing score={score} size={64} stroke={5} />
            </div>
        </div>
    );
};

const TipItem = ({ tip, type }: { tip: string; type: "good" | "improve" }) => (
    <div className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
        type === "good"
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : "bg-amber-50 text-amber-800 border border-amber-200"
    )}>
        <img src={type === "good" ? "/icons/check.svg" : "/icons/warning.svg"} alt="" className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{tip}</span>
    </div>
);

/* ── Main Resume Dashboard ────────────────────────────────── */

const Resume = () => {
    const { auth, isLoading, fs, kv } = usePuterStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading])

    useEffect(() => {
        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`);
            if(!resume) return;

            const data = JSON.parse(resume);

            const resumeBlob = await fs.read(data.resumePath);
            if(!resumeBlob) return;
            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            setResumeUrl(URL.createObjectURL(pdfBlob));

            const imageBlob = await fs.read(data.imagePath);
            if(!imageBlob) return;
            setImageUrl(URL.createObjectURL(imageBlob));

            setJobTitle(data.jobTitle || '');
            setJobDescription(data.jobDescription || '');
            setFeedback(data.feedback);
            console.log("Feedback after reading from DB:", data.feedback);
        }

        loadResume();
    }, [id]);

    /* ── Derive strengths / weaknesses / suggestions / scores ── */
    const normalized = feedback ? normalizeFeedback(feedback, jobTitle, jobDescription) : null;

    const strengths = normalized?.strengths || [];
    const weaknesses = normalized?.weaknesses || [];
    const suggestions = normalized?.suggestions || [];

    const overallScore = normalized?.atsScore?.overallScore || 0;
    const atsScoreVal = normalized?.atsScore?.ats || 0;
    const skillsScoreVal = normalized?.atsScore?.skills || 0;
    const contentScoreVal = normalized?.atsScore?.content || 0;
    const structureScoreVal = normalized?.atsScore?.structure || 0;
    const toneAndStyleScoreVal = normalized?.atsScore?.toneAndStyle || 0;
    const extractedSkills = normalized?.extractedSkills || [];

    return (
        <main className="!pt-0 !min-h-screen bg-gray-50">
            {/* ── Slim top nav ── */}
            <nav className="resume-nav !py-2 bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-200">
                <Link to="/" className="back-button !py-1.5 !px-3">
                    <img src="/icons/back.svg" alt="back" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-xs font-semibold">Back</span>
                </Link>
                <span className="text-sm font-semibold text-gray-500">Resume Review</span>
            </nav>

            {feedback ? (
                <div className="dash-layout">
                    {/* ── LEFT: Resume preview ── */}
                    <aside className="dash-preview">
                        {imageUrl && resumeUrl ? (
                            <iframe src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-[85vh] border-0 rounded-xl" title="resume preview" />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <img src="/images/resume-scan-2.gif" className="w-32" />
                            </div>
                        )}
                    </aside>

                    {/* ── RIGHT: Dashboard ── */}
                    <section className="dash-content">
                        {/* ── Overall score banner ── */}
                        <div className="dash-overall">
                            <ScoreRing score={overallScore} size={72} stroke={6} />
                            <div>
                                <h2 className="!text-lg font-bold text-gray-900 leading-tight">Overall Score</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Based on ATS compatibility, content, structure, skills & tone.
                                </p>
                            </div>
                        </div>

                        {/* ── Top Row: Score cards ── */}
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                            <ScoreCard title="ATS Score" score={atsScoreVal || 0} icon="🎯" />
                            <ScoreCard title="Skills" score={skillsScoreVal || 0} icon="⚡" />
                            <ScoreCard title="Content" score={contentScoreVal || 0} icon="📝" />
                            <ScoreCard title="Structure" score={structureScoreVal || 0} icon="🏗️" />
                        </div>

                        {/* ── Career Analysis Action Card ── */}
                        <div className="dash-card bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl mt-0.5">🚀</span>
                                <div>
                                    <h3 className="text-sm font-bold text-indigo-900">Career Guidance & Pathways</h3>
                                    <p className="text-xs text-indigo-700 mt-1 max-w-2xl leading-relaxed">
                                        Unlock a comprehensive career report mapping your skills to potential roles. 
                                        Discover match percentages, address key skills gaps, and get suggested next learning steps.
                                    </p>
                                </div>
                            </div>
                            <Link to={`/career-analysis/${id}`} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-xs px-4.5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 shrink-0">
                                Career Analysis <span className="text-[14px]">→</span>
                            </Link>
                        </div>

                        {/* ── Interview Preparation Action Card ── */}
                        <div className="dash-card bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl mt-0.5">🎯</span>
                                <div>
                                    <h3 className="text-sm font-bold text-teal-900">Interview Preparation</h3>
                                    <p className="text-xs text-teal-700 mt-1 max-w-2xl leading-relaxed">
                                        Get AI-generated interview questions tailored to your resume, skills, and target role.
                                        Practice technical, behavioral, and resume-based questions before your interview.
                                    </p>
                                </div>
                            </div>
                            <Link to={`/interview-preparation/${id}`} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold text-xs px-4.5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 shrink-0">
                                Interview Preparation <span className="text-[14px]">→</span>
                            </Link>
                        </div>

                        {/* ── Middle Row: Strengths + Weaknesses ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Strengths */}
                            <div className="dash-card bg-white border border-gray-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-base">✅</span>
                                    <h3 className="text-sm font-bold text-gray-800">Strengths</h3>
                                    <span className="ml-auto text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                                        {strengths.length}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                                    {strengths.length > 0 ? strengths.map((s, i) => (
                                        <TipItem key={i} tip={s.tip} type="good" />
                                    )) : (
                                        <p className="text-xs text-gray-400 italic">No specific strengths identified.</p>
                                    )}
                                </div>
                            </div>

                            {/* Weaknesses */}
                            <div className="dash-card bg-white border border-gray-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-base">⚠️</span>
                                    <h3 className="text-sm font-bold text-gray-800">Areas to Improve</h3>
                                    <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                                        {weaknesses.length}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                                    {weaknesses.length > 0 ? weaknesses.map((w, i) => (
                                        <TipItem key={i} tip={w.tip} type="improve" />
                                    )) : (
                                        <p className="text-xs text-gray-400 italic">No weaknesses found — great job!</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Bottom Row: Suggestions ── */}
                        <div className="dash-card bg-white border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-base">💡</span>
                                <h3 className="text-sm font-bold text-gray-800">Suggestions</h3>
                                <span className="ml-auto text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
                                    {suggestions.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                {suggestions.length > 0 ? suggestions.map((s, i) => (
                                    <div key={i} className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                                                {s.category}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-indigo-900">{s.tip}</p>
                                        {s.explanation && (
                                            <p className="text-xs text-indigo-700 mt-1 leading-relaxed">{s.explanation}</p>
                                        )}
                                    </div>
                                )) : (
                                    <p className="text-xs text-gray-400 italic">No suggestions — your resume looks great!</p>
                                )}
                            </div>
                        </div>

                        {/* ── Extracted Skills ── */}
                        {extractedSkills && extractedSkills.length > 0 && (
                            <div className="dash-card bg-white border border-gray-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-base">🛠️</span>
                                    <h3 className="text-sm font-bold text-gray-800">Extracted Technical Skills</h3>
                                    <span className="ml-auto text-xs text-violet-600 font-medium bg-violet-50 px-2 py-0.5 rounded-full">
                                        {extractedSkills.length}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {extractedSkills.map((skill: string, i: number) => (
                                        <span key={i}
                                            className="px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700 border border-violet-200 shadow-sm">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}



                        {/* ── Footer: Tone & Style mini-row ── */}
                        <div className="flex items-center gap-3 px-1">
                            <div className="dash-card bg-white border border-gray-200 flex-1 !flex-row items-center gap-3">
                                <ScoreRing score={toneAndStyleScoreVal || 0} size={40} stroke={4} />
                                <div>
                                    <p className="text-xs font-semibold text-gray-700">Tone & Style</p>
                                    <p className="text-[11px] text-gray-400">{toneAndStyleScoreVal}/100</p>
                                </div>
                            </div>
                            <div className="dash-card bg-white border border-gray-200 flex-1 !flex-row items-center gap-3">
                                <ScoreRing score={structureScoreVal || 0} size={40} stroke={4} />
                                <div>
                                    <p className="text-xs font-semibold text-gray-700">Structure</p>
                                    <p className="text-[11px] text-gray-400">{structureScoreVal}/100</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[80vh]">
                    <img src="/images/resume-scan-2.gif" className="w-48" />
                    <p className="text-gray-400 mt-4 text-sm">Loading your analysis…</p>
                </div>
            )}
        </main>
    )
}
export default Resume
