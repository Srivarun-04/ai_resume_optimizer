import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "ResumeIQ" },
    { name: "description", content: "Analyze. Improve. Get Hired." },
  ];
}

export default function Home() {
  const { auth, kv, fs } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    if (!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated])

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);
      try {
        const resumesData = (await kv.list('resume:*', true)) as KVItem[];
        const parsedResumes = resumesData?.map((resume) => (
          JSON.parse(resume.value) as Resume
        )) || [];

        // Sort by createdAt timestamp descending (newest first)
        const sorted = parsedResumes.sort((a: any, b: any) => {
          return (b.createdAt || 0) - (a.createdAt || 0);
        });

        setResumes(sorted);
      } catch (e) {
        console.error("Failed to load resumes from KV:", e);
      } finally {
        setLoadingResumes(false);
      }
    }

    loadResumes()
  }, []);

  const handleDelete = async (id: string) => {
    // 3. Verify correct resume ID is passed (Log immediately)
    console.log("Delete Analysis - Resume ID:", id);
    if (!id) {
      console.warn("Delete Analysis - Resume ID is missing or invalid");
      showToast("Failed to delete: Invalid resume ID", "error");
      return;
    }

    if (window.confirm("Are you sure you want to delete this resume analysis? This action cannot be undone.")) {
      // 1. Add console logs: KV key
      const kvKey = `resume:${id}`;
      console.log("Delete Analysis - Target KV Key:", kvKey);

      // Save current state for rollback on failure
      const previousResumes = [...resumes];

      // 5. Remove deleted card immediately from state (Optimistic update)
      // 6. Add optimistic update
      console.log("Delete Analysis - Performing optimistic update: removing card from UI state");
      setResumes(prev => prev.filter(r => r.id !== id));

      try {
        console.log("Delete Analysis - Fetching metadata from KV store:", kvKey);
        const stored = await kv.get(kvKey);

        let resumePath = "";
        let imagePath = "";
        if (stored) {
          try {
            const data = JSON.parse(stored);
            resumePath = data.resumePath;
            imagePath = data.imagePath;
            console.log("Delete Analysis - Extracted paths:", { resumePath, imagePath });
          } catch (parseErr) {
            console.error("Delete Analysis - JSON parse error of stored metadata:", parseErr);
          }
        } else {
          console.warn("Delete Analysis - No metadata found in KV store for key:", kvKey);
        }

        // Deleting PDF file from FS (Delete request & Verify reaches storage)
        if (resumePath) {
          console.log("Delete Analysis - FS Delete Request for PDF file:", resumePath);
          await fs.delete(resumePath)
            .then(() => console.log("Delete Analysis - FS Delete Response for PDF file: Success"))
            .catch(err => {
              // 1. Add console logs: Error response
              console.error("Delete Analysis - FS Delete Error for PDF file:", err);
            });
        }

        // Deleting Preview Image from FS (Delete request & Verify reaches storage)
        if (imagePath) {
          console.log("Delete Analysis - FS Delete Request for Image file:", imagePath);
          await fs.delete(imagePath)
            .then(() => console.log("Delete Analysis - FS Delete Response for Image file: Success"))
            .catch(err => {
              // 1. Add console logs: Error response
              console.error("Delete Analysis - FS Delete Error for Image file:", err);
            });
        }

        // 2. Verify delete operation reaches storage (KV delete request)
        console.log("Delete Analysis - KV Delete Request key:", kvKey);
        const deleteResponse = await kv.delete(kvKey);
        // 1. Add console logs: Delete response
        console.log("Delete Analysis - KV Delete Response:", deleteResponse);

        // 7. Show success toast: "Analysis deleted successfully"
        // 4. Verify UI refreshes after successful deletion (UI was updated optimistically, stays clean)
        showToast("Analysis deleted successfully", "success");
      } catch (error: any) {
        // 1. Add console logs: Error response
        console.error("Delete Analysis - Error Response:", error);

        // Rollback state since storage operation failed
        setResumes(previousResumes);

        // 8. Show detailed error message if deletion fails
        const errorDetail = error?.message || (typeof error === 'string' ? error : 'Unknown error');
        showToast(`Failed to delete analysis: ${errorDetail}`, "error");
      }
    }
  };

  return (
    <main className="min-h-screen bg-[url('/images/bg-main.svg')] bg-cover pb-12">
      <Navbar />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ── Hero Section ── */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-12 text-white border border-indigo-800 shadow-xl relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="flex flex-col gap-4">
              <img src="/images/logo.png" alt="ResumeIQ Logo" className="w-16 h-16 object-contain rounded-2xl shadow-lg border border-indigo-700/50" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider w-fit">
                ✨ AI Application Assistant
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
              ResumeIQ
            </h1>
            <p className="text-xl md:text-2xl text-indigo-300 font-bold leading-relaxed">
              Analyze. Improve. Get Hired.
            </p>
            <p className="text-xs md:text-sm text-indigo-200 max-w-xl font-medium leading-relaxed mt-2">
              Analyze your resume, evaluate ATS compatibility, discover career paths, and generate personalized learning plans.
            </p>
            <div className="pt-2">
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold px-5 py-2.5 rounded-xl transition duration-300 shadow-md hover:shadow-indigo-500/10 active:scale-95 text-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Analyze New Resume
              </Link>
            </div>
          </div>
        </div>

        {/* ── Loading State ── */}
        {loadingResumes && (
          <div className="flex flex-col items-center justify-center py-12">
            <img src="/images/resume-scan-2.gif" className="w-[160px]" />
            <p className="text-xs text-gray-500 font-medium mt-4">Loading your analyses...</p>
          </div>
        )}

        {/* ── Content Section ── */}
        {!loadingResumes && resumes.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Recent Application Analyses ({resumes.length})
              </h2>
              {resumes.length > 3 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1.5"
                >
                  {showAll ? "Show Less" : "View All Analyses →"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(showAll ? resumes : resumes.slice(0, 3)).map((resume) => (
                <ResumeCard key={resume.id} resume={resume} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loadingResumes && resumes.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 md:p-12 text-center shadow-lg max-w-4xl mx-auto mt-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"></div>
            
            <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner text-4xl">
              🚀
            </div>
            
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 tracking-tight">
              Start Your AI Resume Journey
            </h3>
            
            <p className="text-sm md:text-base text-gray-500 max-w-lg mx-auto mb-10 leading-relaxed font-medium">
              Upload your resume once and unlock intelligent career insights.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-10">
              <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-5 hover:bg-white hover:shadow-md transition duration-300">
                <div className="text-2xl mb-3">✅</div>
                <h4 className="text-sm font-bold text-gray-800 mb-1">ATS Score</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Measure resume compatibility against applicant tracking systems.</p>
              </div>

              <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-5 hover:bg-white hover:shadow-md transition duration-300">
                <div className="text-2xl mb-3">🎯</div>
                <h4 className="text-sm font-bold text-gray-800 mb-1">Career Guidance</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Discover the best matching career paths and targeted job roles.</p>
              </div>

              <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-5 hover:bg-white hover:shadow-md transition duration-300">
                <div className="text-2xl mb-3">🧠</div>
                <h4 className="text-sm font-bold text-gray-800 mb-1">Skill Gap Analysis</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Identify missing skills and improve faster with our personalized roadmap.</p>
              </div>

              <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-5 hover:bg-white hover:shadow-md transition duration-300">
                <div className="text-2xl mb-3">🎤</div>
                <h4 className="text-sm font-bold text-gray-800 mb-1">Interview Preparation</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Practice AI-generated technical and behavioral questions.</p>
              </div>
            </div>

            <Link
              to="/upload"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-8 py-3.5 rounded-xl transition text-sm shadow-md hover:shadow-lg active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload Resume
            </Link>
          </div>
        )}
      </section>

      {/* ── Toast Notifications ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4.5 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${toast.type === "success"
            ? "bg-emerald-50/90 border-emerald-200 text-emerald-900 shadow-emerald-500/10"
            : "bg-rose-50/90 border-rose-200 text-rose-900 shadow-rose-500/10"
          }`}>
          {toast.type === "success" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-600 flex-shrink-0">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.74-5.24z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-rose-600 flex-shrink-0">
              <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}
    </main>
  );
}
