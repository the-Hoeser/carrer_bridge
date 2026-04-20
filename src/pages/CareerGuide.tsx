import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType, fetchWithAuth } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, doc, setDoc, getDoc } from 'firebase/firestore';
import {
  Sparkles, Loader2, Target, CheckCircle2, BookOpen, Briefcase, ArrowRight,
  ChevronDown, ChevronRight, Calendar, Clock, Star, Settings2, BarChart3,
  TrendingUp, Zap, CheckSquare, Square, AlertCircle, RefreshCw, Trophy, Flame
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DayTask {
  day: string;
  task: string;
  youtubeQuery: string;
  estimatedMinutes: number;
  topicsCovered?: number;
  completed?: boolean;
}
interface Week { week: number; goal: string; topicsCount?: number; days: DayTask[]; }
interface Month { month: number; title: string; focus: string; topicsCount?: number; weeks: Week[]; }
interface Roadmap {
  userId: string;
  targetRole: string;
  skillGap: string[];
  recommendedSkills: string[];
  careerAdvice: string;
  weeklyTopicsEstimate?: number;
  completionForecast?: string;
  projects: { title: string; description: string; difficulty?: string }[];
  months: Month[];
  createdAt: string;
  studyPrefs?: StudyPrefs;
  completedDays?: Record<string, boolean>;
}
interface StudyPrefs { hoursPerDay: number; daysPerWeek: number; }

// ─── Study Prefs Modal ────────────────────────────────────────────────────────
function StudyPrefsModal({
  prefs, onSave, onClose
}: {
  prefs: StudyPrefs;
  onSave: (p: StudyPrefs) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(prefs);
  const weeklyHours = local.hoursPerDay * local.daysPerWeek;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-accent-blue/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h3 className="font-bold text-[#1D1D1F]">Study Schedule Settings</h3>
            <p className="text-xs text-[#86868B]">Adjust your daily commitment</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-[#1D1D1F]">Hours per day</label>
              <span className="text-2xl font-bold text-accent-blue">{local.hoursPerDay}h</span>
            </div>
            <input
              type="range" min="0.5" max="8" step="0.5"
              value={local.hoursPerDay}
              onChange={e => setLocal({ ...local, hoursPerDay: Number(e.target.value) })}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-[#86868B] mt-1">
              <span>30 min</span><span>4h</span><span>8h</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-[#1D1D1F]">Days per week</label>
              <span className="text-2xl font-bold text-accent-blue">{local.daysPerWeek}d</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <button
                  key={d}
                  onClick={() => setLocal({ ...local, daysPerWeek: d })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    local.daysPerWeek === d
                      ? 'bg-accent-blue text-white shadow-md'
                      : 'bg-[#F5F5F7] text-[#86868B] hover:bg-black/5'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-accent-blue/5 to-accent-green/5 rounded-2xl p-4 border border-black/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#86868B]">Weekly commitment</p>
                <p className="text-xl font-bold text-[#1D1D1F] mt-0.5">{weeklyHours}h / week</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#86868B]">Monthly</p>
                <p className="text-xl font-bold text-accent-blue mt-0.5">~{Math.round(weeklyHours * 4)}h</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-black/10 text-sm font-semibold text-[#86868B] hover:bg-black/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onSave(local); onClose(); }}
            className="flex-1 py-3 rounded-xl bg-accent-blue text-white text-sm font-bold hover:bg-accent-blue/90 transition-colors"
          >
            Save & Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Weekly Forecast Card ─────────────────────────────────────────────────────
function WeeklyForecastCard({ roadmap, prefs }: { roadmap: Roadmap; prefs: StudyPrefs }) {
  const months = roadmap.months || [];
  const totalDays = months.reduce((acc, m) =>
    acc + (m.weeks || []).reduce((wa, w) => wa + (w.days?.length || 0), 0), 0);
  const completedDays = Object.values(roadmap.completedDays || {}).filter(Boolean).length;
  const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const weeklyHours = prefs.hoursPerDay * prefs.daysPerWeek;
  const weeklyTopics = roadmap.weeklyTopicsEstimate || Math.round(prefs.daysPerWeek * 0.6);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { icon: Clock, label: 'Per Day', value: `${prefs.hoursPerDay}h`, sub: `${Math.round(prefs.hoursPerDay * 60)} min`, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
        { icon: BarChart3, label: 'Per Week', value: `${weeklyHours}h`, sub: `${prefs.daysPerWeek} study days`, color: 'text-accent-green', bg: 'bg-accent-green/10' },
        { icon: BookOpen, label: 'Topics/Week', value: `~${weeklyTopics}`, sub: 'topics covered', color: 'text-violet-500', bg: 'bg-violet-50' },
        { icon: Trophy, label: 'Completed', value: `${pct}%`, sub: `${completedDays}/${totalDays} tasks`, color: 'text-accent-amber', bg: 'bg-amber-50' },
      ].map(({ icon: Icon, label, value, sub, color, bg }) => (
        <div key={label} className="glass-card p-5 flex items-center gap-4">
          <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs text-[#86868B]">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-[#86868B]">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main CareerGuide ─────────────────────────────────────────────────────────
export function CareerGuide() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [converting, setConverting] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [roadmapDocId, setRoadmapDocId] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set([0]));
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set(['0-0']));
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studyPrefs, setStudyPrefs] = useState<StudyPrefs>({ hoursPerDay: 1, daysPerWeek: 5 });

  const [formData, setFormData] = useState({
    targetRole: '',
    education: '',
    currentSkills: '',
    interests: ''
  });

  useEffect(() => {
    if (!user) return;
    const fetchLatestRoadmap = async () => {
      try {
        const q = query(collection(db, 'roadmaps'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const d = snapshot.docs[0];
          const data = d.data() as Roadmap;
          setRoadmap(data);
          setRoadmapDocId(d.id);
          if (data.studyPrefs) setStudyPrefs(data.studyPrefs);
          setExpandedMonths(new Set([0]));
          setExpandedWeeks(new Set(['0-0']));
        } else {
          // No roadmap — try pre-filling from settings
          const uSnap = await getDoc(doc(db, 'users', user.uid));
          if (uSnap.exists()) {
            const ud = uSnap.data();
            if (ud.interests && ud.interests.length > 0) {
              setFormData(p => ({ ...p, targetRole: ud.interests[0] }));
            }
          }
        }
        // Load saved prefs
        const prefsDoc = await getDocs(query(collection(db, 'studyPrefs'), where('userId', '==', user.uid)));
        if (!prefsDoc.empty) {
          const p = prefsDoc.docs[0].data();
          setStudyPrefs({ hoursPerDay: p.hoursPerDay || 1, daysPerWeek: p.daysPerWeek || 5 });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'roadmaps');
      } finally {
        setFetching(false);
      }
    };
    fetchLatestRoadmap();
  }, [user]);

  const toggleMonth = (i: number) => setExpandedMonths(prev => {
    const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next;
  });
  const toggleWeek = (key: string) => setExpandedWeeks(prev => {
    const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
  });

  // ── Toggle day task completion ─────────────────────────────────────────────
  const toggleDayComplete = useCallback(async (dayKey: string) => {
    if (!roadmap) return;
    const newCompleted = { ...(roadmap.completedDays || {}), [dayKey]: !roadmap.completedDays?.[dayKey] };
    const updatedRoadmap = { ...roadmap, completedDays: newCompleted };
    setRoadmap(updatedRoadmap);
    if (roadmapDocId) {
      try {
        const { updateDoc, doc: firestoreDoc } = await import('firebase/firestore');
        await updateDoc(firestoreDoc(db, 'roadmaps', roadmapDocId), { completedDays: newCompleted });
      } catch {}
    }
  }, [roadmap, roadmapDocId]);

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const FREE_TIER_LIMIT = 4;
    const usageKey = `ai_usage_roadmaps_${user.email || user.uid}`;
    const currentUsage = parseInt(localStorage.getItem(usageKey) || '0');
    if (currentUsage >= FREE_TIER_LIMIT) {
      setError('Free tier limit reached. You have used all 4 of your free roadmaps. Please upgrade to continue.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth('/api/generateRoadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...studyPrefs })
      });

      const text = await response.text();
      let generatedData: any;
      try {
        generatedData = JSON.parse(text);
      } catch {
        throw new Error('Server returned invalid data. Check that the backend server is running (npm run server).');
      }

      if (generatedData.error) throw new Error(generatedData.error);
      if (!generatedData.months?.length) throw new Error('AI returned an incomplete roadmap. Please try again.');

      const newRoadmap: Roadmap = {
        userId: user.uid,
        targetRole: formData.targetRole,
        ...generatedData,
        studyPrefs,
        completedDays: {},
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'roadmaps'), newRoadmap);
      setRoadmapDocId(docRef.id);
      setRoadmap(newRoadmap);
      setExpandedMonths(new Set([0]));
      setExpandedWeeks(new Set(['0-0']));

      localStorage.setItem(usageKey, (currentUsage + 1).toString());
    } catch (error: any) {
      console.error('Roadmap Generation Error:', error);
      setError(error?.message || 'Unknown error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrefs = async (newPrefs: StudyPrefs) => {
    setStudyPrefs(newPrefs);
    if (user) {
      try {
        await setDoc(doc(db, 'studyPrefs', user.uid), { userId: user.uid, ...newPrefs });
      } catch {}
    }
    // If we have a roadmap, offer to regenerate
    if (roadmap) {
      setRoadmap(null); // show form again with new prefs
      setFormData({
        targetRole: roadmap.targetRole || '',
        education: '',
        currentSkills: '',
        interests: ''
      });
    }
  };

  const convertToCourse = async () => {
    if (!user || !roadmap) return;

    const FREE_TIER_LIMIT = 4;
    const usageKey = `ai_usage_courses_${user.email || user.uid}`;
    const currentUsage = parseInt(localStorage.getItem(usageKey) || '0');
    if (currentUsage >= FREE_TIER_LIMIT) {
      setError('Free tier limit reached. You have created all 4 of your free video courses. Please upgrade to continue.');
      return;
    }

    setConverting(true);
    try {
      const response = await fetchWithAuth('/api/convertToCourse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: roadmap.targetRole, recommendedSkills: roadmap.recommendedSkills, skillGap: roadmap.skillGap })
      });

      const text = await response.text();
      let gen: any;
      try { gen = JSON.parse(text); } catch { throw new Error('Server returned invalid data.'); }
      if (gen.error) throw new Error(gen.error);
      if (!gen.courseName || !gen.modules?.length) throw new Error('Bad AI response — try again.');

      const newCourse = {
        userId: user.uid,
        targetRole: roadmap.targetRole,
        category: 'AI Generated',
        courseName: gen.courseName,
        description: gen.description,
        modules: gen.modules.map((m: any) => ({
          title: m.title,
          topics: (m.topics || []).map((t: any) => ({
            id: t.id || `t-${Math.random().toString(36).slice(2, 9)}`,
            title: t.title,
            duration: t.duration || '15 min',
            description: t.description || '',
            videoSuggestion: {
              searchQuery: t.searchQuery,
              title: t.title,
              // Pre-resolved video ID — permanently embedded, no re-fetching needed
              ...(t.videoId ? { videoId: t.videoId } : {})
            }
          }))
        })),
        progress: 0,
        completedTopics: [],
        watchProgress: {},
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'courses'), newCourse);

      localStorage.setItem(usageKey, (currentUsage + 1).toString());
      navigate('/learning');
    } catch (error: any) {
      console.error('Course Generation Error:', error);
      setError(error?.message || 'Course generation failed.');
    } finally {
      setConverting(false);
    }
  };

  if (fetching) return (
    <div className="space-y-8">
      <div className="h-10 w-72 skeleton" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
      </div>
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-10">
      {showPrefsModal && (
        <StudyPrefsModal
          prefs={studyPrefs}
          onSave={handleSavePrefs}
          onClose={() => setShowPrefsModal(false)}
        />
      )}

      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F] flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-accent-blue" />
            AI Career Guide
          </h1>
          <p className="text-[#86868B] mt-2">Get a personalized daily learning plan tailored to your goals and schedule.</p>
        </div>
        <button
          onClick={() => setShowPrefsModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] hover:border-black/20 transition-all bg-white"
        >
          <Settings2 className="w-4 h-4" />
          Study Schedule: {studyPrefs.hoursPerDay}h/day · {studyPrefs.daysPerWeek}d/week
        </button>
      </header>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Generation Failed</p>
            <p className="text-sm mt-0.5">{error}</p>
            <p className="text-xs mt-2 text-red-500">Make sure the backend is running: <code className="bg-red-100 px-1 rounded">npm run server</code></p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {!roadmap ? (
        /* ── FORM ── */
        <div className="glass-card p-8 max-w-2xl">
          <h2 className="text-xl font-bold text-[#1D1D1F] mb-6">Tell us about yourself</h2>

          {/* Study time quick-set */}
          <div className="mb-6 p-4 bg-gradient-to-r from-accent-blue/5 to-accent-green/5 rounded-2xl border border-black/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent-blue" />
                <span className="text-sm font-semibold text-[#1D1D1F]">How much time can you study?</span>
              </div>
              <span className="text-xs text-[#86868B]">{studyPrefs.hoursPerDay}h/day · {studyPrefs.daysPerWeek} days/week</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#86868B] mb-1 block">Hours per day</label>
                <div className="flex gap-1.5 flex-wrap">
                  {[0.5, 1, 1.5, 2, 3, 4].map(h => (
                    <button key={h}
                      onClick={() => setStudyPrefs(p => ({ ...p, hoursPerDay: h }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${studyPrefs.hoursPerDay === h ? 'bg-accent-blue text-white' : 'bg-white border border-black/10 text-[#86868B] hover:border-accent-blue/30'}`}
                    >{h === 0.5 ? '30m' : `${h}h`}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#86868B] mb-1 block">Days per week</label>
                <div className="flex gap-1.5">
                  {[3, 4, 5, 6, 7].map(d => (
                    <button key={d}
                      onClick={() => setStudyPrefs(p => ({ ...p, daysPerWeek: d }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${studyPrefs.daysPerWeek === d ? 'bg-accent-blue text-white' : 'bg-white border border-black/10 text-[#86868B] hover:border-accent-blue/30'}`}
                    >{d}d</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={generateRoadmap} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Target Role *</label>
              <input required type="text" placeholder="e.g. Full Stack Developer, Data Scientist, UX Designer" className="glass-input" value={formData.targetRole} onChange={e => setFormData({ ...formData, targetRole: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Current Education</label>
              <input type="text" placeholder="e.g. B.S. Computer Science, Self-taught engineer" className="glass-input" value={formData.education} onChange={e => setFormData({ ...formData, education: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Current Skills (comma separated)</label>
              <input type="text" placeholder="e.g. HTML, CSS, basic Python, Excel" className="glass-input" value={formData.currentSkills} onChange={e => setFormData({ ...formData, currentSkills: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Interests & Goals</label>
              <input type="text" placeholder="e.g. AI, startups, freelancing, gaming industry" className="glass-input" value={formData.interests} onChange={e => setFormData({ ...formData, interests: e.target.value })} />
            </div>

            <div className="pt-2 p-4 bg-[#F5F5F7] rounded-xl text-sm text-[#86868B]">
              <p className="font-medium text-[#1D1D1F] mb-1">📅 Your plan will include:</p>
              <ul className="space-y-1 text-xs">
                <li>• {Math.round(studyPrefs.hoursPerDay * 60)}-minute daily tasks, {studyPrefs.daysPerWeek} days/week</li>
                <li>• ~{Math.round(studyPrefs.daysPerWeek * 0.6)} topics covered per week</li>
                <li>• Weekly completion forecast & progress tracking</li>
              </ul>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'AI is building your roadmap…' : 'Generate My Personalized Roadmap'}
            </button>
          </form>
        </div>
      ) : (
        /* ── ROADMAP VIEW ── */
        <div className="space-y-8">

          {/* Header row */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1D1D1F]">
                Your Path to <span className="text-accent-blue">{roadmap.targetRole}</span>
              </h2>
              {roadmap.completionForecast && (
                <p className="text-sm text-[#86868B] mt-1 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-accent-green" />
                  {roadmap.completionForecast}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPrefsModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] bg-white transition-all"
              >
                <Settings2 className="w-4 h-4" />
                Schedule
              </button>
              <button
                onClick={() => { setRoadmap(null); setError(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] bg-white transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                New Roadmap
              </button>
            </div>
          </div>

          {/* Weekly Forecast Strip */}
          <WeeklyForecastCard roadmap={roadmap} prefs={studyPrefs} />

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-[#1D1D1F] mb-4">
                <Target className="w-4 h-4 text-red-500" /> Skill Gaps to Close
              </h3>
              <div className="flex flex-wrap gap-2">
                {roadmap.skillGap?.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-full text-xs font-semibold">{s}</span>
                ))}
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-[#1D1D1F] mb-4">
                <CheckCircle2 className="w-4 h-4 text-accent-green" /> Skills You'll Master
              </h3>
              <div className="flex flex-wrap gap-2">
                {roadmap.recommendedSkills?.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 bg-accent-green/10 text-accent-green border border-accent-green/20 rounded-full text-xs font-semibold">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Roadmap */}
          <div className="glass-card p-6">
            <h3 className="flex items-center gap-2 text-base font-bold text-[#1D1D1F] mb-6">
              <Calendar className="w-4 h-4 text-accent-blue" />
              Daily Learning Plan
              <span className="ml-auto text-xs font-normal text-[#86868B]">Click tasks to mark complete</span>
            </h3>
            <div className="space-y-3">
              {(roadmap.months || []).map((month, mIdx) => {
                const allDaysInMonth = (month.weeks || []).flatMap(w => w.days || []);
                // Build per-week keys correctly
                let dayCounter = 0;
                const monthDayKeys: string[] = [];
                (month.weeks || []).forEach((w, wIdx) => {
                  (w.days || []).forEach((_, dIdx) => {
                    monthDayKeys.push(`m${mIdx}-w${wIdx}-d${dIdx}`);
                    dayCounter++;
                  });
                });
                const doneInMonth = monthDayKeys.filter(k => roadmap.completedDays?.[k]).length;
                const pctMonth = allDaysInMonth.length > 0 ? Math.round((doneInMonth / allDaysInMonth.length) * 100) : 0;

                return (
                  <div key={mIdx} className="border border-black/8 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => toggleMonth(mIdx)}
                      className="w-full flex items-center justify-between p-5 bg-[#F5F5F7] hover:bg-black/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-blue text-white flex flex-col items-center justify-center font-bold text-xs leading-tight">
                          <span className="text-[10px] opacity-70">MONTH</span>
                          <span className="text-lg leading-none">{month.month}</span>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-[#1D1D1F]">{month.title}</div>
                          <div className="text-sm text-[#86868B]">{month.focus}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-black/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-blue rounded-full transition-all" style={{ width: `${pctMonth}%` }} />
                          </div>
                          <span className="text-xs font-medium text-[#86868B]">{pctMonth}%</span>
                        </div>
                        {expandedMonths.has(mIdx) ? <ChevronDown className="w-4 h-4 text-[#86868B]" /> : <ChevronRight className="w-4 h-4 text-[#86868B]" />}
                      </div>
                    </button>

                    {expandedMonths.has(mIdx) && (
                      <div className="p-4 space-y-3 bg-white">
                        {month.weeks?.map((week, wIdx) => {
                          const weekKey = `${mIdx}-${wIdx}`;
                          const weekDayKeys = (week.days || []).map((_, dI) => `m${mIdx}-w${wIdx}-d${dI}`);
                          const doneInWeek = weekDayKeys.filter(k => roadmap.completedDays?.[k]).length;
                          const totalInWeek = week.days?.length || 0;

                          return (
                            <div key={wIdx} className="border border-black/6 rounded-xl overflow-hidden">
                              <button
                                onClick={() => toggleWeek(weekKey)}
                                className="w-full flex items-center justify-between p-4 hover:bg-[#F5F5F7] transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${doneInWeek === totalInWeek && totalInWeek > 0 ? 'bg-accent-green text-white' : 'bg-accent-blue/10 text-accent-blue'}`}>
                                    W{week.week}
                                  </div>
                                  <div className="text-left">
                                    <span className="font-semibold text-[#1D1D1F] text-sm">{week.goal}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {week.topicsCount && (
                                        <span className="text-xs text-[#86868B]">{week.topicsCount} topics</span>
                                      )}
                                      <span className="text-xs text-[#86868B]">{doneInWeek}/{totalInWeek} done</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-1.5 bg-black/10 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${doneInWeek === totalInWeek && totalInWeek > 0 ? 'bg-accent-green' : 'bg-accent-blue'}`}
                                      style={{ width: totalInWeek > 0 ? `${(doneInWeek / totalInWeek) * 100}%` : '0%' }}
                                    />
                                  </div>
                                  {expandedWeeks.has(weekKey) ? <ChevronDown className="w-4 h-4 text-[#86868B]" /> : <ChevronRight className="w-4 h-4 text-[#86868B]" />}
                                </div>
                              </button>

                              {expandedWeeks.has(weekKey) && (
                                <div className="border-t border-black/5 divide-y divide-black/5">
                                  {week.days?.map((day, dIdx) => {
                                    const dayKey = `m${mIdx}-w${wIdx}-d${dIdx}`;
                                    const isDone = !!roadmap.completedDays?.[dayKey];

                                    return (
                                      <div key={dIdx} className={`flex items-start gap-4 p-4 transition-colors ${isDone ? 'bg-accent-green/3' : 'hover:bg-[#F5F5F7]/60'}`}>
                                        <button
                                          onClick={() => toggleDayComplete(dayKey)}
                                          className="mt-0.5 flex-shrink-0"
                                        >
                                          {isDone
                                            ? <CheckSquare className="w-5 h-5 text-accent-green" />
                                            : <Square className="w-5 h-5 text-black/20 hover:text-accent-blue transition-colors" />
                                          }
                                        </button>
                                        <div className="w-12 h-12 rounded-xl bg-white border border-black/8 flex flex-col items-center justify-center flex-shrink-0">
                                          <span className="text-[9px] font-bold text-[#86868B] uppercase">{day.day?.slice(0, 3)}</span>
                                          <Flame className="w-3 h-3 text-orange-400 mt-0.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-sm font-semibold ${isDone ? 'line-through text-[#86868B]' : 'text-[#1D1D1F]'}`}>{day.task}</p>
                                          <a
                                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(day.youtubeQuery)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-[#86868B] hover:text-red-500 transition-colors"
                                          >
                                            <svg className="w-3.5 h-3.5 fill-current text-red-500" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                            Watch: {day.youtubeQuery}
                                          </a>
                                          {day.topicsCovered ? <span className="ml-3 text-xs font-medium text-violet-500">+{day.topicsCovered} topic</span> : null}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-[#86868B] flex-shrink-0 bg-[#F5F5F7] px-2 py-1 rounded-lg">
                                          <Clock className="w-3 h-3" />
                                          {day.estimatedMinutes}m
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Projects */}
          <div className="glass-card p-6">
            <h3 className="flex items-center gap-2 text-base font-bold text-[#1D1D1F] mb-6">
              <Briefcase className="w-4 h-4 text-accent-blue" /> Portfolio Projects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roadmap.projects?.map((project, i) => {
                const diffColors: Record<string, string> = {
                  Beginner: 'text-accent-green bg-accent-green/10 border-accent-green/20',
                  Intermediate: 'text-accent-amber bg-amber-50 border-amber-200',
                  Advanced: 'text-red-500 bg-red-50 border-red-200',
                };
                const dc = diffColors[project.difficulty || ''] || 'text-[#86868B] bg-[#F5F5F7] border-black/10';
                return (
                  <div key={i} className="bg-[#F5F5F7] border border-black/5 p-5 rounded-2xl hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-accent-amber flex-shrink-0" />
                      {project.difficulty && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${dc}`}>{project.difficulty}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-[#1D1D1F] text-sm mb-2">{project.title}</h4>
                    <p className="text-xs text-[#86868B] leading-relaxed">{project.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Career Advice */}
          <div className="bg-gradient-to-br from-accent-blue/5 via-white to-accent-green/5 border border-black/5 rounded-2xl p-6">
            <h3 className="text-base font-bold text-[#1D1D1F] mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-blue" /> Personalized Career Advice
            </h3>
            <p className="text-[#1D1D1F] leading-relaxed text-sm">{roadmap.careerAdvice}</p>
          </div>

          {/* Convert to Course CTA */}
          <div className="flex flex-col items-center justify-center p-10 glass-card text-center">
            <div className="w-16 h-16 rounded-3xl bg-accent-blue/10 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-accent-blue" />
            </div>
            <h3 className="text-2xl font-bold text-[#1D1D1F] mb-2">Ready to start learning?</h3>
            <p className="text-[#86868B] mb-8 max-w-lg text-sm">
              Convert this roadmap into a structured video course with AI-matched YouTube tutorials for every topic.
            </p>
            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-200">{error}</div>
            )}
            <button onClick={convertToCourse} disabled={converting} className="btn-primary px-10 py-4 text-base">
              {converting ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Course…</> : <>Convert to Video Course <ArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
