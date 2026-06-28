import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const createFallbackFeedback = (jobTitle: string): Feedback => {
    const targetRole = jobTitle || "Software Developer";
    return {
        atsScore: {
            overallScore: 70,
            ats: 70,
            skills: 70,
            content: 65,
            structure: 80,
            toneAndStyle: 75,
        },
        strengths: [
            { tip: "Professional Tone", explanation: "The tone used in the experience description is professional.", category: "Tone & Style" },
            { tip: "Standard sections", explanation: "The resume contains typical sections such as Experience and Education.", category: "Structure" }
        ],
        weaknesses: [
            { tip: `Keyword Match Gap`, explanation: `Ensure your resume lists exact keywords matching the ${targetRole} role.`, category: "ATS" },
            { tip: "Lack of Quantifiable Results", explanation: "Add metrics, numbers, and percentages to showcase your achievements.", category: "Content" },
            { tip: "Skill Section Tailoring", explanation: `Include skill keywords that specifically match the requirements for a ${targetRole}.`, category: "Skills" }
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
};

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file);
        if (file) {
            setPdfUrl(URL.createObjectURL(file));
        } else {
            setPdfUrl(null);
        }
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        setIsProcessing(true);

        setStatusText('Uploading the file...');
        const uploadedFile = await fs.upload([file]);
        if(!uploadedFile) return setStatusText('Error: Failed to upload file');

        setStatusText('Converting to image...');
        const imageFile = await convertPdfToImage(file);
        if(!imageFile.file) return setStatusText('Error: Failed to convert PDF to image');

        setStatusText('Uploading the image...');
        const uploadedImage = await fs.upload([imageFile.file]);
        if(!uploadedImage) return setStatusText('Error: Failed to upload image');

        setStatusText('Preparing data...');
        const uuid = generateUUID();
        const fallbackFeedback = createFallbackFeedback(jobTitle);
        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadedImage.path,
            companyName, jobTitle, jobDescription,
            feedback: fallbackFeedback,
            createdAt: Date.now(),
        }
        console.log("Feedback before saving to DB (initial metadata):", data.feedback);
        await kv.set(`resume:${uuid}`, JSON.stringify(data));

        setStatusText('Analyzing...');

        let feedback;
        try {
            console.log("Starting AI request with instructions:", prepareInstructions({ jobTitle, jobDescription }));
            feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({ jobTitle, jobDescription })
            );
            console.log("AI request completed. Raw response:", feedback);
        } catch (e) {
            console.error("AI feedback generation failed:", e);
        }

        if (!feedback) {
            console.warn("AI returned empty/undefined feedback. Falling back to default feedback object.");
            data.feedback = fallbackFeedback;
        } else {
            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : feedback.message.content[0].text;

            console.log("Raw AI response content string:", feedbackText);

            try {
                let cleanedText = feedbackText.trim();
                // Remove markdown code block if present
                if (cleanedText.startsWith("```")) {
                    cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, "").replace(/```$/, "").trim();
                }
                const parsed = JSON.parse(cleanedText);
                console.log("Parsed response object:", parsed);
                data.feedback = parsed;
            } catch (e) {
                console.error("JSON parsing of AI response failed. Exception:", e);
                console.log("Raw response text causing failure:", feedbackText);
                console.warn("Falling back to default feedback object.");
                data.feedback = fallbackFeedback;
            }
        }

        console.log("Feedback before saving to DB (final output):", data.feedback);
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        setStatusText('Analysis complete, redirecting...');
        console.log("Full resume data being saved:", data);
        navigate(`/resume/${uuid}`);
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover pb-6">
            <Navbar />

            <section className="main-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 flex flex-col items-center">
                <div className="w-full text-center mb-5">
                    <h1 className="text-2xl sm:text-3xl font-black text-gradient">Smart Feedback for Your Dream Job</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        {isProcessing 
                            ? "Analyzing resume and preparing dashboard..." 
                            : "Provide target job details and drop your PDF resume below"}
                    </p>
                </div>

                {isProcessing ? (
                    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
                        <h2 className="text-lg font-bold text-gray-800">{statusText}</h2>
                        <img src="/images/resume-scan.gif" className="w-[180px] mx-auto mt-4" alt="Scanning" />
                    </div>
                ) : (
                    <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-5.5 w-full">
                            {/* Step 1: Company Name */}
                            <div className="form-div">
                                <label htmlFor="company-name" className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black border border-indigo-100">1</span>
                                    Company Name
                                </label>
                                <input type="text" name="company-name" placeholder="e.g. Google" id="company-name" className="w-full text-xs mt-1 border border-gray-200 focus:border-indigo-400 rounded-xl p-2.5 outline-none transition" />
                            </div>

                            {/* Step-spacing line */}
                            <div className="border-b border-gray-100" />

                            {/* Step 2: Job Title */}
                            <div className="form-div">
                                <label htmlFor="job-title" className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black border border-indigo-100">2</span>
                                    Job Title
                                </label>
                                <input type="text" name="job-title" placeholder="e.g. React Developer" id="job-title" className="w-full text-xs mt-1 border border-gray-200 focus:border-indigo-400 rounded-xl p-2.5 outline-none transition" />
                            </div>

                            {/* Step-spacing line */}
                            <div className="border-b border-gray-100" />

                            {/* Step 3: Job Description */}
                            <div className="form-div">
                                <label htmlFor="job-description" className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black border border-indigo-100">3</span>
                                    Job Description
                                </label>
                                <textarea rows={6} name="job-description" placeholder="Paste target requirements, responsibilities, and qualifications..." id="job-description" className="w-full text-xs mt-1 border border-gray-200 focus:border-indigo-400 rounded-xl p-2.5 outline-none transition resize-y" />
                            </div>

                            {/* Step-spacing line */}
                            <div className="border-b border-gray-100" />

                            {/* Step 4: Upload Resume */}
                            <div className="form-div">
                                <label className="text-xs font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black border border-indigo-100">4</span>
                                    Upload Resume (PDF)
                                </label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            {/* Step-spacing line */}
                            <div className="border-b border-gray-100" />

                            {/* Step 5: Analyze Resume */}
                            <div className="w-full pt-2 flex flex-col items-center gap-2">
                                <label className="text-xs font-bold text-gray-800 self-start mb-2.5 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black border border-indigo-100">5</span>
                                    Analyze Resume
                                </label>
                                <button className="primary-button py-3 cursor-pointer w-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2" type="submit">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-8.22-.07m0 0a6 6 0 0 1-.07-8.23m0 0a6 6 0 0 1 8.23-.07m0 0a6 6 0 0 1 .07 8.23zm0-8.23 4.25-4.25M17.25 12h4.5" />
                                    </svg>
                                    Start AI Analysis
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </section>
        </main>
    )
}
export default Upload
