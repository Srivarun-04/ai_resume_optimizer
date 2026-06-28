import {Link} from "react-router";

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 py-10 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
                
                {/* Branding */}
                <div className="flex items-center gap-2 mb-2">
                    <img src="/images/logo.png" alt="ResumeIQ Logo" className="w-6 h-6 object-contain" />
                    <span className="text-xl font-black text-gray-900 tracking-tight">ResumeIQ</span>
                </div>
                
                {/* Tagline */}
                <p className="text-sm font-semibold text-indigo-600 mb-6">
                    Analyze. Improve. Get Hired.
                </p>

                {/* Tech Stack */}
                <p className="text-xs text-gray-400 mb-8 max-w-sm">
                    Built with React, TypeScript, Tailwind CSS and AI.
                </p>
                
                {/* Divider */}
                <div className="w-16 h-px bg-gray-200 mb-8"></div>

                {/* Copyright & Author */}
                <div className="text-xs text-gray-500 mb-6">
                    <p>&copy; {new Date().getFullYear()} ResumeIQ</p>
                    <p className="mt-1">Developed by <span className="font-bold text-gray-700">Srivarun Manthena</span></p>
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-5">
                    <a href="https://github.com/Srivarun-04" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                        <span className="sr-only">GitHub</span>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                    </a>
                    <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                        <span className="sr-only">LinkedIn</span>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                        </svg>
                    </a>
                    <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors">
                        <span className="sr-only">Portfolio</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                    </a>
                </div>
            </div>
        </footer>
    )
}

export default Footer
