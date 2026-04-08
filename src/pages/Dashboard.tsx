import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Compass, BookOpen, FileText, ArrowRight } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    roadmaps: 0,
    courses: 0,
    resumes: 0
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const roadmapsQuery = query(collection(db, 'roadmaps'), where('userId', '==', user.uid));
        const progressQuery = query(collection(db, 'progress'), where('userId', '==', user.uid));
        const resumesQuery = query(collection(db, 'resumes'), where('userId', '==', user.uid));

        const [rSnap, pSnap, resSnap] = await Promise.all([
          getDocs(roadmapsQuery),
          getDocs(progressQuery),
          getDocs(resumesQuery)
        ]);

        setStats({
          roadmaps: rSnap.size,
          courses: pSnap.size,
          resumes: resSnap.size
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'multiple');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return <div className="animate-pulse flex space-x-4 p-8"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-black/5 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-black/5 rounded"></div><div className="h-4 bg-black/5 rounded w-5/6"></div></div></div></div>;
  }

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">Welcome back, {user?.displayName?.split(' ')[0] || 'Student'}</h1>
          <p className="text-[#86868B] mt-2">Here's an overview of your career journey.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          title="Career Roadmaps" 
          value={stats.roadmaps} 
          icon={Compass} 
          href="/career-guide" 
          color="text-accent-blue" 
          bg="bg-accent-blue/10" 
          delay={0.1}
        />
        <StatCard 
          title="Courses in Progress" 
          value={stats.courses} 
          icon={BookOpen} 
          href="/learning" 
          color="text-accent-green" 
          bg="bg-accent-green/10" 
          delay={0.2}
        />
        <StatCard 
          title="Saved Resumes" 
          value={stats.resumes} 
          icon={FileText} 
          href="/resume" 
          color="text-accent-amber" 
          bg="bg-accent-amber/10" 
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card p-8"
        >
          <h2 className="text-xl font-semibold text-[#1D1D1F] mb-6">Next Steps</h2>
          <div className="space-y-4">
            {stats.roadmaps === 0 ? (
              <ActionItem 
                title="Generate your first Career Roadmap" 
                desc="Tell us your goals and get a personalized learning path."
                href="/career-guide"
              />
            ) : (
              <ActionItem 
                title="Continue your Learning Journey" 
                desc="Pick up where you left off in your courses."
                href="/learning"
              />
            )}
            {stats.resumes === 0 && (
              <ActionItem 
                title="Build your Resume" 
                desc="Create an ATS-friendly resume to start applying."
                href="/resume"
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, href, color, bg, delay }: any) {
  return (
    <Link to={href}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card p-6 h-full"
      >
        <div className="flex items-center justify-between mb-6">
          <div className={`p-3 rounded-xl ${bg} border border-black/5`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
        <h3 className="text-[#86868B] text-sm font-medium">{title}</h3>
        <p className="text-4xl font-bold text-[#1D1D1F] mt-2">{value}</p>
      </motion.div>
    </Link>
  );
}

function ActionItem({ title, desc, href }: any) {
  return (
    <Link to={href} className="flex items-center justify-between p-5 rounded-xl bg-[#F5F5F7] border border-black/5 hover:border-black/10 hover:bg-[#F5F5F7]/80 transition-all duration-300 group">
      <div>
        <h4 className="font-medium text-[#1D1D1F] group-hover:text-accent-blue transition-colors">{title}</h4>
        <p className="text-sm text-[#86868B] mt-1">{desc}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-[#86868B] group-hover:text-accent-blue transition-colors" />
    </Link>
  );
}
