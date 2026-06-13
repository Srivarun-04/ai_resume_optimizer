import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import {normalizeFeedback} from "~/lib/utils";

const ResumeCard = ({ resume, onDelete }: { resume: Resume; onDelete: (id: string) => void }) => {
    const { id, companyName, jobTitle, jobDescription, feedback, imagePath } = resume;
    const { fs } = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');
    const normalized = normalizeFeedback(feedback, jobTitle, jobDescription);
    const score = normalized.atsScore?.overallScore || 0;

    // Debug logs: Resume ID, Stored ATS Score, Displayed ATS Score
    console.log("Resume Card Load - ID:", id);
    console.log("Resume Card Load - Stored ATS Score:", feedback?.atsScore?.overallScore);
    console.log("Resume Card Load - Displayed ATS Score:", score);

    useEffect(() => {
        const loadResume = async () => {
            const blob = await fs.read(imagePath);
            if(!blob) return;
            let url = URL.createObjectURL(blob);
            setResumeUrl(url);
        }

        loadResume();
    }, [imagePath]);

    return (
        <Link to={`/resume/${id}`} className="resume-card group relative animate-in fade-in duration-1000">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(id);
                }}
                className="absolute top-2 right-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 p-1.5 rounded-lg border border-rose-200 transition-all duration-200 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                title="Delete analysis"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
            </button>
            <div className="resume-card-header">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                    {companyName && <h2 className="!text-sm font-black text-gray-900 truncate pr-6">{companyName}</h2>}
                    {jobTitle && <h3 className="text-xs text-gray-500 truncate pr-6">{jobTitle}</h3>}
                    {!companyName && !jobTitle && <h2 className="!text-sm font-black text-gray-900 pr-6">Resume</h2>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={score} />
                </div>
            </div>
            {resumeUrl && (
                <div className="gradient-border animate-in fade-in duration-1000 overflow-hidden flex-1 bg-slate-50 border border-gray-100 rounded-lg flex items-center justify-center p-2">
                    <img
                        src={resumeUrl}
                        alt="resume"
                        className="w-full h-[290px] max-sm:h-[200px] object-contain transition-transform duration-300 hover:scale-[1.04] rounded"
                    />
                </div>
            )}
        </Link>
    )
}
export default ResumeCard
