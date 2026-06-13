# AI Resume & Career Analyzer

An AI-powered Resume Analyzer built using React, Tailwind CSS, Vite, React Router and Puter AI.

<div align="center">
  <img alt="React" src="https://img.shields.io/badge/React-4c84f3?style=for-the-badge&logo=react&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/-Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" />
  <img alt="Puter.js" src="https://img.shields.io/badge/Puter.js-181758?style=for-the-badge&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
</div>

---

## ✨ Features

- 📄 **Resume Upload (PDF)** — Upload your resume and have it stored securely on Puter cloud storage.
- 🎯 **ATS Score Analysis** — Get an Applicant Tracking System compatibility score with actionable tips.
- 💬 **Resume Feedback** — Receive detailed AI-generated feedback on tone & style, content, structure, and skills.
- 💡 **Resume Improvement Suggestions** — Categorized suggestions to strengthen your resume for any role.
- 🛠️ **Technical Skill Extraction** — Automatically extracts all technical skills mentioned in your resume.
- 🎯 **Career Role Recommendation** — Get top 3 recommended job roles based on your extracted skills, with confidence percentages.
- 📊 **Compact Dashboard View** — All analysis results displayed in a single-screen dashboard layout (30% preview / 70% analysis).
- 🔐 **Browser-Based Auth** — Seamless authentication via Puter.js — no backend required.
- 📱 **Responsive Design** — Fully responsive across desktop, tablet, and mobile.

## ⚙️ Tech Stack

| Technology | Purpose |
|---|---|
| **[React](https://react.dev/)** | UI library for building component-based interfaces |
| **[React Router v7](https://reactrouter.com/)** | Client-side routing with nested routes and data loading |
| **[Tailwind CSS](https://tailwindcss.com/)** | Utility-first CSS framework for rapid styling |
| **[TypeScript](https://www.typescriptlang.org/)** | Static typing for better developer experience and code quality |
| **[Vite](https://vite.dev/)** | Fast build tool with HMR and optimized production builds |
| **[Puter.js](https://puter.com/)** | Serverless SDK for auth, file storage, KV database, and AI |
| **[Claude AI](https://www.anthropic.com/)** | LLM used via Puter AI for resume analysis and skill extraction |
| **[Zustand](https://github.com/pmndrs/zustand)** | Lightweight state management for React |
| **[pdf.js](https://mozilla.github.io/pdf.js/)** | PDF rendering and conversion to image for preview |

## 📂 Project Structure

```
ai-resume-analyzer/
├── app/
│   ├── components/       # Reusable UI components (Navbar, FileUploader, Accordion, etc.)
│   ├── routes/           # Page components (home, upload, resume, auth, wipe)
│   ├── lib/              # Utilities and Puter SDK wrapper (puter.ts, utils.ts, pdf2img.ts)
│   └── app.css           # Global styles and design tokens
├── constants/            # AI prompt templates and mock data
├── types/                # TypeScript type definitions (Feedback, Resume, Puter types)
├── public/               # Static assets (images, icons)
└── vite.config.ts        # Vite configuration
```

## 🤸 Quick Start

### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en) (v18+)
- [npm](https://www.npmjs.com/)

### Installation

```bash
git clone https://github.com/Srivarun-04/ai_resume_optimizer.git
cd ai-resume-analyzer
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

## 🔄 How It Works

1. **Sign In** — Authenticate via Puter.js (browser-based, no backend needed).
2. **Upload Resume** — Select a PDF resume and optionally provide a job title & description.
3. **AI Analysis** — The resume is sent to Claude AI via Puter's AI SDK with a detailed prompt.
4. **View Dashboard** — Results are displayed in a compact dashboard:
   - **Score Cards** — ATS, Skills, Content, and Structure scores.
   - **Strengths & Weaknesses** — Categorized feedback items.
   - **Suggestions** — Detailed improvement recommendations.
   - **Extracted Skills** — Technical skills identified from the resume.
   - **Recommended Roles** — Top 3 job roles with confidence percentages.
5. **History** — All analyzed resumes are stored and accessible from the homepage.

## 📋 API / AI Response Schema

The AI returns a structured JSON object with the following shape:

```typescript
interface Feedback {
  overallScore: number;
  ATS: { score: number; tips: { type: "good" | "improve"; tip: string }[] };
  toneAndStyle: { score: number; tips: { type: "good" | "improve"; tip: string; explanation: string }[] };
  content: { score: number; tips: { ... }[] };
  structure: { score: number; tips: { ... }[] };
  skills: { score: number; tips: { ... }[] };
  extractedSkills: string[];
  recommendedRoles: { role: string; confidence: number; reason: string }[];
}
```

## ⚠️ Known Limitations

- Only the first page of multi-page PDFs is previewed as an image.
- AI responses may occasionally be wrapped in markdown code blocks — the parser handles this automatically.
- Puter.js requires an active internet connection for all operations.
- Historical resumes with empty feedback (from before the fix) require a data wipe at `/wipe`.

## 🚀 Future Enhancements

- 📈 Skill gap analysis comparing resume skills against job requirements
- 📊 Side-by-side resume comparison
- 📝 AI-powered resume rewriting suggestions
- 🔄 Multi-page PDF support
- 📤 Export analysis as PDF report

---

Built with ❤️ using React, Puter.js, and Claude AI.
