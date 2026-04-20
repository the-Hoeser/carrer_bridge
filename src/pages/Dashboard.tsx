import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Compass, BookOpen, FileText, ArrowRight, TrendingUp,
  Flame, Target, CheckCircle2, PlayCircle, Sparkles,
  Clock, BarChart3, Trophy, ChevronRight
} from 'lucide-react';

interface Stats { roadmaps: number; courses: number; resumes: number; }
interface CourseSnap { progress: number; title?: string; courseName?: string; }
interface RoadmapSnap { targetRole: string; completedDays?: Record<string,boolean>; months?: any[]; }

export function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ roadmaps: 0, courses: 0, resumes: 0 });
  const [latestRoadmap, setLatestRoadmap] = useState<RoadmapSnap | null>(null);
  const [topCourse, setTopCourse] = useState<CourseSnap | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalTasksDone, setTotalTasksDone] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user || hasRun.current) return;
    hasRun.current = true;

    const fetchAll = async () => {
      try {
        const [rSnap, cSnap, resSnap] = await Promise.all([
          getDocs(query(collection(db, 'roadmaps'), where('userId', '==', user.uid), orderBy('createdAt','desc'), limit(1))),
          getDocs(query(collection(db, 'courses'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'resumes'), where('userId', '==', user.uid))),
        ]);

        setStats({ roadmaps: rSnap.size, courses: cSnap.size, resumes: resSnap.size });

        if (!rSnap.empty) {
          const rd = rSnap.docs[0].data() as RoadmapSnap;
          setLatestRoadmap(rd);
          const done = Object.values(rd.completedDays || {}).filter(Boolean).length;
          setTotalTasksDone(done);
        }

        // Find the course with highest progress that's not 100%
        if (!cSnap.empty) {
          const courses = cSnap.docs.map(d => d.data() as CourseSnap);
          const inProgress = courses.filter(c => c.progress > 0 && c.progress < 100);
          const top = inProgress.length > 0
            ? inProgress.sort((a, b) => b.progress - a.progress)[0]
            : courses[0];
          setTopCourse(top);
        }

        // ── Streak Logic (Firestore-based) ──────────────────────────
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const today = new Date().toISOString().split('T')[0];
          const lastActive = userData.lastActiveDate || '';
          let currentStreak = userData.streak || 0;

          if (lastActive === today) {
            // Already logged in today
            setStreak(currentStreak);
          } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastActive === yesterdayStr) {
              currentStreak += 1;
            } else {
              currentStreak = 1;
            }

            setStreak(currentStreak);
            await updateDoc(userDocRef, {
              streak: currentStreak,
              lastActiveDate: today
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.displayName?.split(' ')[0] || 'Student';

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-36 skeleton" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="h-64 skeleton" />)}
        </div>
      </div>
    );
  }

  const isFirstTime = stats.roadmaps === 0 && stats.courses === 0 && stats.resumes === 0;

  return (
    <div className="space-y-10">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-[#8E8E93] font-medium mb-1">{greeting()}, {firstName} 👋</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1C1E]">
            {isFirstTime ? 'Welcome to CareerBridge' : 'Your Career Dashboard'}
          </h1>
          <p className="text-[#8E8E93] mt-1.5 text-sm">
            {isFirstTime
              ? 'Get started by generating your first AI career roadmap below.'
              : `You've completed ${totalTasksDone} tasks so far. Keep it up!`
            }
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-2xl">
            <Flame className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xs text-orange-500 font-medium leading-none">Day Streak</p>
              <p className="text-xl font-extrabold text-orange-600 leading-tight">{streak}</p>
            </div>
          </div>
        )}
      </header>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { title: 'Career Roadmaps', value: stats.roadmaps, icon: Compass, href: '/career-guide', color: 'text-blue-500', bg: 'bg-blue-50', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200', desc: stats.roadmaps === 0 ? 'Generate your first' : 'Active roadmap' },
          { title: 'Learning Courses', value: stats.courses, icon: BookOpen, href: '/learning', color: 'text-green-500', bg: 'bg-green-50', gradient: 'from-green-500 to-emerald-600', shadow: 'shadow-green-200', desc: stats.courses === 0 ? 'Start learning' : 'Courses enrolled' },
          { title: 'Saved Resumes', value: stats.resumes, icon: FileText, href: '/resume', color: 'text-violet-500', bg: 'bg-violet-50', gradient: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-200', desc: stats.resumes === 0 ? 'Build your resume' : 'Resume versions' },
        ].map(({ title, value, icon: Icon, href, color, bg, gradient, shadow, desc }, i) => (
          <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay: i*0.08 }}>
            <Link to={href} className="block glass-card p-6 group h-full hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md ${shadow}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:text-[#1C1C1E] group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[13px] text-[#8E8E93] font-medium">{title}</p>
              <p className="text-4xl font-extrabold text-[#1C1C1E] mt-1 tracking-tight">{value}</p>
              <p className="text-xs text-[#8E8E93] mt-1">{desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ── Quick Stats row ──────────────────────────────────────────────── */}
      {!isFirstTime && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: CheckCircle2, label: 'Tasks Done', value: totalTasksDone, color: 'text-green-500', bg: 'bg-green-50' },
            { icon: Trophy, label: 'Day Streak', value: `${streak}d`, color: 'text-orange-500', bg: 'bg-orange-50' },
            { icon: BarChart3, label: 'Completion', value: topCourse ? `${topCourse.progress}%` : '0%', color: 'text-blue-500', bg: 'bg-blue-50' },
            { icon: Target, label: 'Active Goal', value: latestRoadmap?.targetRole?.split(' ')[0] || 'None', color: 'text-violet-500', bg: 'bg-violet-50' },
          ].map(({ icon: Icon, label, value, color, bg }, i) => (
            <motion.div key={i} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.4, delay:0.3+i*0.06 }}
              className="glass-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#8E8E93]">{label}</p>
                <p className={`text-lg font-extrabold ${color} truncate`}>{value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Main content grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Next Steps */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.4 }} className="glass-card p-7">
          <h2 className="text-lg font-bold text-[#1C1C1E] mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" /> Next Steps
          </h2>
          <div className="space-y-3">
            {stats.roadmaps === 0 && (
              <ActionCard
                icon={Compass} iconBg="bg-blue-50" iconColor="text-blue-500"
                title="Generate your AI Roadmap"
                desc="Tell us your target role, schedule, and get a daily learning plan instantly."
                href="/career-guide" cta="Start now"
              />
            )}
            {stats.courses === 0 && stats.roadmaps > 0 && (
              <ActionCard
                icon={PlayCircle} iconBg="bg-green-50" iconColor="text-green-500"
                title="Convert Roadmap to Video Course"
                desc="Turn your career roadmap into a full video learning course with one click."
                href="/career-guide" cta="Open roadmap"
              />
            )}
            {stats.courses > 0 && (
              <ActionCard
                icon={BookOpen} iconBg="bg-green-50" iconColor="text-green-500"
                title="Continue Learning"
                desc={topCourse ? `${topCourse.title || topCourse.courseName} — ${topCourse.progress}% complete` : 'Pick up where you left off.'}
                href="/learning" cta="Resume course"
              />
            )}
            {stats.resumes === 0 && (
              <ActionCard
                icon={FileText} iconBg="bg-violet-50" iconColor="text-violet-500"
                title="Build Your Resume"
                desc="5 professional templates. Paste a job description and AI tailors it for you."
                href="/resume" cta="Build now"
              />
            )}
            {stats.roadmaps > 0 && (
              <ActionCard
                icon={Target} iconBg="bg-orange-50" iconColor="text-orange-500"
                title={`Path to ${latestRoadmap?.targetRole || 'your goal'}`}
                desc="Continue working through your daily tasks and track your progress."
                href="/career-guide" cta="View roadmap"
              />
            )}
          </div>
        </motion.div>

        {/* Roadmap Summary or Getting Started */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.5 }}>
          {latestRoadmap ? (
            <div className="glass-card p-7 h-full flex flex-col">
              <h2 className="text-lg font-bold text-[#1C1C1E] mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" /> Active Roadmap
              </h2>
              <p className="text-sm text-[#8E8E93] mb-5">Your path to <span className="font-semibold text-blue-500">{latestRoadmap.targetRole}</span></p>

              {/* Month breakdown */}
              <div className="space-y-3 flex-1">
                {(latestRoadmap.months || []).slice(0, 3).map((m: any, i: number) => {
                  const totalDays = (m.weeks || []).flatMap((w: any) => w.days || []).length;
                  const mKeys = (m.weeks || []).flatMap((w: any, wI: number) =>
                    (w.days || []).map((_: any, dI: number) => `m${i}-w${wI}-d${dI}`)
                  );
                  const doneDays = mKeys.filter(k => latestRoadmap.completedDays?.[k]).length;
                  const pct = totalDays > 0 ? Math.round((doneDays/totalDays)*100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0">M{m.month}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-[#1C1C1E] truncate">{m.title}</p>
                          <span className="text-xs text-[#8E8E93] ml-2">{doneDays}/{totalDays}</span>
                        </div>
                        <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-green-400' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#8E8E93] flex-shrink-0 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <Link to="/career-guide" className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-black/8 text-sm font-semibold text-[#8E8E93] hover:text-[#1C1C1E] hover:border-black/15 transition-all">
                Open Full Roadmap <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="glass-card p-7 h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="hero-blob w-64 h-64 bg-blue-300 opacity-20 -bottom-16 -right-16" />
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-5 animate-float">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1C1E] mb-2">Ready to start?</h3>
              <p className="text-sm text-[#8E8E93] mb-6 max-w-xs leading-relaxed">
                Generate your AI-powered career roadmap in seconds. Just tell us your goal and how much time you have.
              </p>
              <Link to="/career-guide" className="btn-primary px-8 py-3 text-sm">
                Generate Roadmap <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Feature pills ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.6, delay:0.7 }} className="flex flex-wrap gap-3 pt-2">
        {[
          { icon: Compass,   label: 'AI Roadmaps',     href: '/career-guide', color: 'text-blue-500 bg-blue-50 border-blue-100' },
          { icon: BookOpen,  label: 'Video Learning',  href: '/learning',     color: 'text-green-500 bg-green-50 border-green-100' },
          { icon: FileText,  label: 'Resume Builder',  href: '/resume',       color: 'text-violet-500 bg-violet-50 border-violet-100' },
        ].map(({ icon: Icon, label, href, color }) => (
          <Link key={href} to={href} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all hover:shadow-sm hover:-translate-y-0.5 ${color}`}>
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

function ActionCard({ icon: Icon, iconBg, iconColor, title, desc, href, cta }: {
  icon: any; iconBg: string; iconColor: string;
  title: string; desc: string; href: string; cta: string;
}) {
  return (
    <Link to={href} className="flex items-center gap-4 p-4 rounded-2xl bg-[#F9F9F9] border border-black/5 hover:border-black/10 hover:bg-[#F5F5F7] transition-all group">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#1C1C1E] group-hover:text-blue-500 transition-colors truncate">{title}</p>
        <p className="text-xs text-[#8E8E93] mt-0.5 line-clamp-1">{desc}</p>
      </div>
      <span className="text-xs font-semibold text-[#8E8E93] group-hover:text-blue-500 transition-colors flex-shrink-0 flex items-center gap-1">
        {cta} <ChevronRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
}
