import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType, fetchWithAuth } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import {
  Save, Download, Loader2, FileText, Sparkles, Wand2, CheckCircle,
  AlertCircle, ChevronRight, Layout, Palette, X, Copy
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ResumeData {
  personalInfo: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  projects: string;
  certifications: string;
}

const EMPTY_RESUME: ResumeData = {
  personalInfo: '',
  summary: '',
  experience: '',
  education: '',
  skills: '',
  projects: '',
  certifications: ''
};

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'classic',    name: 'Classic',    description: 'Traditional black & white, widely accepted by ATS' },
  { id: 'modern',     name: 'Modern',     description: 'Clean lines with a blue accent sidebar' },
  { id: 'creative',   name: 'Creative',   description: 'Bold header with colour blocks, perfect for designers' },
  { id: 'minimal',    name: 'Minimal',    description: 'Elegant whitespace, great for consultants' },
  { id: 'executive',  name: 'Executive',  description: 'Premium dark header, suits senior roles' },
] as const;
type TemplateId = typeof TEMPLATES[number]['id'];

// ── Parse helpers ─────────────────────────────────────────────────────────────
function firstLine(text: string) { return text.split('\n')[0] || ''; }
function restLines(text: string) { return text.split('\n').slice(1).join(' | ') || ''; }

// ── Resume Renderers ──────────────────────────────────────────────────────────
function SectionHead({ title, className = '' }: { title: string; className?: string }) {
  return <h3 className={`text-[11px] font-extrabold uppercase tracking-[0.14em] mb-2 mt-5 first:mt-0 ${className}`}>{title}</h3>;
}
function Body({ text, placeholder }: { text: string; placeholder: string }) {
  return <div className="text-[12px] whitespace-pre-wrap leading-[1.65] text-current">{text || placeholder}</div>;
}

function ClassicResume({ data }: { data: ResumeData }) {
  return (
    <div className="font-['Georgia',serif] text-zinc-900 min-h-[1000px] p-10 bg-white">
      <div className="border-b-2 border-zinc-900 pb-4 mb-5 text-center">
        <h1 className="text-[22px] font-bold uppercase tracking-widest">{firstLine(data.personalInfo) || 'Your Name'}</h1>
        <p className="text-[11px] text-zinc-600 mt-1">{restLines(data.personalInfo) || 'email@example.com | (123) 456-7890 | linkedin.com/in/profile'}</p>
      </div>
      {data.summary && <><SectionHead title="Professional Summary" className="text-zinc-900 border-b border-zinc-400 pb-1" /><Body text={data.summary} placeholder="" /></>}
      <SectionHead title="Experience" className="text-zinc-900 border-b border-zinc-400 pb-1" /><Body text={data.experience} placeholder="Company Name – Role | Jan 2022 – Present₊ Achieved X by doing Y resulting in Z." />
      <SectionHead title="Education" className="text-zinc-900 border-b border-zinc-400 pb-1" /><Body text={data.education} placeholder="University Name – Degree, Year" />
      <SectionHead title="Skills" className="text-zinc-900 border-b border-zinc-400 pb-1" /><Body text={data.skills} placeholder="JavaScript, React, Node.js, Python, SQL" />
      {data.projects && <><SectionHead title="Projects" className="text-zinc-900 border-b border-zinc-400 pb-1" /><Body text={data.projects} placeholder="" /></>}
      {data.certifications && <><SectionHead title="Certifications" className="text-zinc-900 border-b border-zinc-400 pb-1" /><Body text={data.certifications} placeholder="" /></>}
    </div>
  );
}

function ModernResume({ data }: { data: ResumeData }) {
  return (
    <div className="font-['Inter',sans-serif] text-slate-800 min-h-[1000px] flex bg-white">
      {/* Sidebar */}
      <div className="w-[200px] bg-blue-700 text-white p-6 flex-shrink-0">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold mb-3">
            {firstLine(data.personalInfo)?.[0]?.toUpperCase() || 'Y'}
          </div>
          <h1 className="text-[15px] font-bold leading-tight">{firstLine(data.personalInfo) || 'Your Name'}</h1>
          <p className="text-[9.5px] text-blue-200 mt-2 leading-relaxed">{restLines(data.personalInfo) || 'email@example.com'}</p>
        </div>
        {data.skills && (
          <div className="mb-6">
            <h3 className="text-[9px] font-extrabold uppercase tracking-widest text-blue-300 mb-2">Skills</h3>
            <div className="text-[10px] text-blue-100 leading-relaxed whitespace-pre-wrap">{data.skills}</div>
          </div>
        )}
        {data.certifications && (
          <div>
            <h3 className="text-[9px] font-extrabold uppercase tracking-widest text-blue-300 mb-2">Certifications</h3>
            <div className="text-[10px] text-blue-100 whitespace-pre-wrap">{data.certifications}</div>
          </div>
        )}
      </div>
      {/* Main */}
      <div className="flex-1 p-8">
        {data.summary && <><h3 className="text-[11px] font-extrabold uppercase tracking-widest text-blue-700 border-b border-blue-100 pb-1 mb-2">Summary</h3><Body text={data.summary} placeholder="" /></>}
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-blue-700 border-b border-blue-100 pb-1 mb-2 mt-5 first:mt-0">Experience</h3>
        <Body text={data.experience} placeholder="Company – Role | Jan 2022 – Present₊ Led X resulting in Y." />
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-blue-700 border-b border-blue-100 pb-1 mb-2 mt-5">Education</h3>
        <Body text={data.education} placeholder="University – Degree, Year" />
        {data.projects && <><h3 className="text-[11px] font-extrabold uppercase tracking-widest text-blue-700 border-b border-blue-100 pb-1 mb-2 mt-5">Projects</h3><Body text={data.projects} placeholder="" /></>}
      </div>
    </div>
  );
}

function CreativeResume({ data }: { data: ResumeData }) {
  return (
    <div className="font-['Inter',sans-serif] text-gray-800 min-h-[1000px] bg-white">
      <div className="bg-gradient-to-r from-violet-600 to-pink-500 p-8 text-white">
        <h1 className="text-[26px] font-black tracking-tight">{firstLine(data.personalInfo) || 'Your Name'}</h1>
        <p className="text-[11px] text-white/80 mt-1">{restLines(data.personalInfo) || 'email@example.com | portfolio.com'}</p>
      </div>
      <div className="grid grid-cols-3 gap-0 min-h-[850px]">
        <div className="col-span-1 bg-gray-50 p-6 border-r border-gray-200">
          {data.summary && <><h3 className="text-[10px] font-extrabold uppercase tracking-widest text-violet-600 mb-2">About</h3><div className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap mb-5">{data.summary}</div></>}
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-violet-600 mb-2">Skills</h3>
          <div className="text-[11px] text-gray-600 whitespace-pre-wrap mb-5">{data.skills || 'React, TypeScript, Node.js'}</div>
          {data.certifications && <><h3 className="text-[10px] font-extrabold uppercase tracking-widest text-violet-600 mb-2">Certifications</h3><div className="text-[11px] text-gray-600 whitespace-pre-wrap">{data.certifications}</div></>}
        </div>
        <div className="col-span-2 p-7">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-pink-500 border-b-2 border-pink-100 pb-1 mb-3">Experience</h3>
          <Body text={data.experience} placeholder="Company – Role | Jan 2022 – Present₊ Delivered X resulting in Y." />
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-pink-500 border-b-2 border-pink-100 pb-1 mb-3 mt-6">Education</h3>
          <Body text={data.education} placeholder="University – Degree, Year" />
          {data.projects && <><h3 className="text-[10px] font-extrabold uppercase tracking-widest text-pink-500 border-b-2 border-pink-100 pb-1 mb-3 mt-6">Projects</h3><Body text={data.projects} placeholder="" /></>}
        </div>
      </div>
    </div>
  );
}

function MinimalResume({ data }: { data: ResumeData }) {
  return (
    <div className="font-['Inter',sans-serif] text-gray-700 min-h-[1000px] bg-white p-12">
      <div className="mb-8">
        <h1 className="text-[20px] font-light tracking-[0.08em] text-gray-900">{firstLine(data.personalInfo) || 'Your Name'}</h1>
        <p className="text-[10.5px] text-gray-400 mt-1 tracking-wide">{restLines(data.personalInfo) || 'email@example.com · linkedin.com/in/profile'}</p>
        <div className="w-12 h-px bg-gray-300 mt-4" />
      </div>
      {data.summary && <><p className="text-[11.5px] text-gray-500 leading-relaxed italic mb-7 max-w-[480px]">{data.summary}</p><div className="w-12 h-px bg-gray-200 mb-7" /></>}
      {[
        { label: 'Experience', text: data.experience, ph: 'Company · Role · Jan 2022 – Present\nKey Achievement' },
        { label: 'Education', text: data.education, ph: 'University · Degree · Year' },
        { label: 'Skills', text: data.skills, ph: 'React · TypeScript · Python' },
        ...(data.projects ? [{ label: 'Projects', text: data.projects, ph: '' }] : []),
        ...(data.certifications ? [{ label: 'Certifications', text: data.certifications, ph: '' }] : []),
      ].map(({ label, text, ph }) => (
        <div key={label} className="mb-7">
          <p className="text-[9px] uppercase tracking-[0.22em] text-gray-400 mb-3">{label}</p>
          <div className="text-[11.5px] text-gray-700 whitespace-pre-wrap leading-relaxed">{text || ph}</div>
        </div>
      ))}
    </div>
  );
}

function ExecutiveResume({ data }: { data: ResumeData }) {
  return (
    <div className="font-['Georgia',serif] text-gray-800 min-h-[1000px] bg-white">
      <div className="bg-gray-900 text-white px-10 py-8">
        <h1 className="text-[24px] font-bold tracking-wide">{firstLine(data.personalInfo) || 'Your Name'}</h1>
        <p className="text-[11px] text-gray-400 mt-2 tracking-wider">{restLines(data.personalInfo) || 'email@example.com | +1 (555) 000-0000 | LinkedIn'}</p>
      </div>
      {data.summary && (
        <div className="bg-gray-100 px-10 py-4 border-b border-gray-200">
          <p className="text-[12px] text-gray-600 italic leading-relaxed">{data.summary}</p>
        </div>
      )}
      <div className="px-10 py-7 space-y-6">
        {[
          { label: 'Professional Experience', text: data.experience, ph: 'Company Name – Senior Role | Jan 2020 – Present₊ Led team of 15 engineers, increasing delivery velocity by 40%.' },
          { label: 'Education', text: data.education, ph: 'University – MBA / Degree' },
          { label: 'Core Competencies', text: data.skills, ph: 'Strategic Planning · Team Leadership · P&L Management' },
          ...(data.projects ? [{ label: 'Notable Projects', text: data.projects, ph: '' }] : []),
          ...(data.certifications ? [{ label: 'Certifications & Awards', text: data.certifications, ph: '' }] : []),
        ].map(({ label, text, ph }) => (
          <div key={label}>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.15em] text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">{label}</h3>
            <div className="text-[12px] whitespace-pre-wrap text-gray-700 leading-relaxed">{text || ph}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const RENDERERS: Record<TemplateId, ({ data }: { data: ResumeData }) => React.ReactElement> = {
  classic:   ClassicResume,
  modern:    ModernResume,
  creative:  CreativeResume,
  minimal:   MinimalResume,
  executive: ExecutiveResume,
};

// ── AI Tailor Modal ───────────────────────────────────────────────────────────
function AITailorModal({
  resumeData,
  onApply,
  onClose
}: {
  resumeData: ResumeData;
  onApply: (newData: ResumeData, notes: string[]) => void;
  onClose: () => void;
}) {
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [result, setResult] = useState<ResumeData | null>(null);

  const handleTailor = async () => {
    if (!jobDesc.trim()) return;
    setLoading(true);
    setError('');
    setNotes([]);
    try {
      const response = await fetchWithAuth('/api/tailorResume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, jobDescription: jobDesc })
      });
      const text = await response.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error('Server returned invalid data.'); }
      if (data.error) throw new Error(data.error);
      setResult(data);
      setNotes(data.tailoringNotes || []);
    } catch (e: any) {
      setError(e.message || 'Tailoring failed. Ensure backend is running (npm run server).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-black/5 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-[#1D1D1F]">AI Resume Tailor</h3>
              <p className="text-xs text-[#86868B]">Paste a job description — AI will rewrite your resume to match</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#86868B] hover:text-[#1D1D1F] transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8 space-y-6">
          {!result ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">Paste Job Description</label>
                <textarea
                  rows={10}
                  value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                  placeholder="Paste the full job description here — requirements, responsibilities, qualifications, everything. The more detail, the better the tailoring."
                  className="w-full border border-black/10 rounded-2xl p-4 text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-accent-blue/30 resize-none leading-relaxed"
                />
                <p className="text-xs text-[#86868B] mt-2">
                  {jobDesc.length} characters · Recommended: 200+ characters for best results
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Tailoring Failed</p>
                    <p className="text-xs mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="bg-[#F5F5F7] rounded-2xl p-4 text-xs text-[#86868B] space-y-1">
                <p className="font-semibold text-[#1D1D1F]">What the AI will do:</p>
                <p>✓ Rewrite experience bullets with keywords from the job description</p>
                <p>✓ Reorder skills to highlight what the employer wants</p>
                <p>✓ Craft a targeted professional summary for this specific role</p>
                <p>✓ Enhance project descriptions to show relevance</p>
                <p>✓ It will NOT invent fake experience — only reframe real ones</p>
              </div>

              <button
                onClick={handleTailor}
                disabled={loading || jobDesc.length < 50}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> AI is tailoring your resume…</> : <><Wand2 className="w-5 h-5" /> Tailor My Resume</>}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                <CheckCircle className="w-5 h-5 text-accent-green flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm text-[#1D1D1F]">Resume tailored successfully!</p>
                  <p className="text-xs text-[#86868B]">Review the changes below before applying</p>
                </div>
              </div>

              {notes.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[#1D1D1F] mb-3">Key changes made:</p>
                  <ul className="space-y-2">
                    {notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#1D1D1F]">
                        <ChevronRight className="w-4 h-4 text-accent-blue mt-0.5 flex-shrink-0" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-3 rounded-xl border border-black/10 text-sm font-semibold text-[#86868B] hover:bg-black/5 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => { onApply(result!, notes); onClose(); }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  Apply to Resume
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ResumeBuilder() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ResumeData>(EMPTY_RESUME);
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>('classic');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [tailorNotes, setTailorNotes] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fn = async () => {
      try {
        const q = query(collection(db, 'resumes'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          setResumeId(d.id);
          const dd = d.data();
          setFormData({
            personalInfo: dd.personalInfo || '',
            summary: dd.summary || '',
            experience: dd.experience || '',
            education: dd.education || '',
            skills: dd.skills || '',
            projects: dd.projects || '',
            certifications: dd.certifications || '',
          });
          if (dd.template) setActiveTemplate(dd.template as TemplateId);
        }
      } catch (e) { handleFirestoreError(e, OperationType.GET, 'resumes'); }
      finally { setFetching(false); }
    };
    fn();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      const payload = { userId: user.uid, ...formData, template: activeTemplate, lastUpdated: new Date().toISOString() };
      if (resumeId) {
        await updateDoc(doc(db, 'resumes', resumeId), payload);
      } else {
        const ref = await addDoc(collection(db, 'resumes'), payload);
        setResumeId(ref.id);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'resumes');
      setSaveStatus('error');
    }
  };

  const handleExportPDF = () => {
    setActiveTab('preview');
    setTimeout(() => window.print(), 200);
  };

  const handleApplyTailored = (newData: ResumeData, notes: string[]) => {
    setFormData(newData);
    setTailorNotes(notes);
    setSaveStatus('idle');
  };

  const Renderer = RENDERERS[activeTemplate];

  const FIELDS: { key: keyof ResumeData; label: string; rows: number; placeholder: string }[] = [
    { key: 'personalInfo', label: 'Personal Info (Name, Email, Phone, LinkedIn, GitHub)', rows: 3, placeholder: 'John Doe\njohn@example.com | +1 (555) 000-0000 | linkedin.com/in/johndoe | github.com/johndoe' },
    { key: 'summary', label: 'Professional Summary', rows: 3, placeholder: 'Results-driven software engineer with 3+ years building scalable web applications…' },
    { key: 'experience', label: 'Work Experience', rows: 6, placeholder: 'Company Name – Software Engineer | Jan 2022 – Present\n• Led migration of legacy codebase to React, reducing load time by 40%\n• Mentored 3 junior engineers and drove code review culture' },
    { key: 'education', label: 'Education', rows: 3, placeholder: 'University of Technology – B.S. Computer Science | 2021\nGPA: 3.8/4.0 | Dean\'s List' },
    { key: 'skills', label: 'Skills', rows: 3, placeholder: 'Languages: JavaScript, TypeScript, Python\nFrameworks: React, Node.js, FastAPI\nTools: Git, Docker, AWS, Figma' },
    { key: 'projects', label: 'Projects', rows: 4, placeholder: 'CareerBridge – Full-stack career platform\n• Built with React, Firebase, Gemini AI\n• 500+ active users' },
    { key: 'certifications', label: 'Certifications & Awards', rows: 2, placeholder: 'AWS Solutions Architect Associate | 2023\nGoogle Professional Cloud Developer | 2022' },
  ];

  if (fetching) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-accent-blue" /></div>;

  return (
    <div className="space-y-8">
      {showTailorModal && (
        <AITailorModal
          resumeData={formData}
          onApply={handleApplyTailored}
          onClose={() => setShowTailorModal(false)}
        />
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F] flex items-center gap-3">
            <FileText className="w-8 h-8 text-accent-blue" /> Resume Builder
          </h1>
          <p className="text-[#86868B] mt-1">Build, tailor, and export a professional resume in minutes.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowTailorModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md"
          >
            <Wand2 className="w-4 h-4" /> AI Job Tailor
          </button>
          <button onClick={handleSave} disabled={loading || saveStatus === 'saving'} className="btn-secondary">
            {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" />
              : saveStatus === 'saved' ? <CheckCircle className="w-4 h-4 text-accent-green" />
              : <Save className="w-4 h-4" />}
            {saveStatus === 'saved' ? 'Saved!' : 'Save Draft'}
          </button>
          <button onClick={handleExportPDF} className="btn-primary">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </header>

      {/* AI Tailor notes banner */}
      {tailorNotes.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-2xl">
          <Sparkles className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-violet-700 mb-2">AI tailor applied successfully</p>
            <ul className="space-y-1">
              {tailorNotes.map((n, i) => <li key={i} className="text-xs text-violet-600">• {n}</li>)}
            </ul>
          </div>
          <button onClick={() => setTailorNotes([])} className="text-violet-400 hover:text-violet-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Template Switcher */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <Palette className="w-4 h-4 text-accent-blue" />
          <span className="text-sm font-semibold text-[#1D1D1F]">Choose Template</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTemplate(t.id)}
              title={t.description}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                activeTemplate === t.id
                  ? 'bg-accent-blue text-white border-accent-blue shadow-md shadow-accent-blue/20'
                  : 'bg-white border-black/10 text-[#86868B] hover:text-[#1D1D1F] hover:border-black/20'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#86868B] mt-2">{TEMPLATES.find(t => t.id === activeTemplate)?.description}</p>
      </div>

      {/* Mobile tab switcher */}
      <div className="flex md:hidden gap-2 bg-[#F5F5F7] p-1 rounded-xl">
        {(['edit', 'preview'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#86868B]'
            }`}
          >
            {tab === 'edit' ? <><Layout className="w-3 h-3 inline mr-1" />Edit</> : <><FileText className="w-3 h-3 inline mr-1" />Preview</>}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT: Form */}
        <div className={`${activeTab === 'preview' ? 'hidden md:block' : ''} glass-card p-8 space-y-5 no-print`}>
          <h2 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
            <Layout className="w-5 h-5 text-accent-blue" /> Edit Your Resume
          </h2>
          {FIELDS.map(({ key, label, rows, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-[#1D1D1F] mb-2">{label}</label>
              <textarea
                rows={rows}
                className="glass-input resize-none text-sm leading-relaxed"
                placeholder={placeholder}
                value={formData[key]}
                onChange={e => setFormData({ ...formData, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>

        {/* RIGHT: Preview */}
        <div className={`${activeTab === 'edit' ? 'hidden md:block' : ''}`}>
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#1D1D1F]">Live Preview</span>
              <span className="text-xs text-[#86868B] bg-[#F5F5F7] px-3 py-1 rounded-full">
                {TEMPLATES.find(t => t.id === activeTemplate)?.name} Template
              </span>
            </div>
            <div
              ref={printRef}
              className="rounded-2xl overflow-hidden shadow-2xl border border-black/10 scale-[0.75] origin-top-left w-[133%] printable-resume"
              style={{ transformOrigin: 'top left' }}
            >
              <Renderer data={formData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
