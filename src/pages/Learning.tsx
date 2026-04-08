import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PlayCircle, CheckCircle, Clock, ArrowLeft, Loader2, Youtube } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const COURSES = [
  { id: '1', title: 'React for Beginners', category: 'Coding', duration: '2h 30m', progress: 100 },
  { id: '2', title: 'Advanced Tailwind CSS', category: 'Coding', duration: '1h 45m', progress: 45 },
  { id: '3', title: 'Effective Communication', category: 'Life Skills', duration: '45m', progress: 0 },
  { id: '4', title: 'System Design Basics', category: 'Coding', duration: '3h 15m', progress: 10 },
  { id: '5', title: 'Time Management for Devs', category: 'Life Skills', duration: '1h 10m', progress: 0 },
  { id: '6', title: 'Git & GitHub Mastery', category: 'Coding', duration: '2h 00m', progress: 80 },
];

export function Learning() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [courses, setCourses] = useState<any[]>(COURSES);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const fetchedCourses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          title: doc.data().courseName, // map courseName to title for UI consistency
          duration: 'Self-paced',
          isCustom: true
        }));
        setCourses([...fetchedCourses, ...COURSES]);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  const toggleTopic = async (courseId: string, topicTitle: string) => {
    if (!user) return;
    
    // Find course
    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return;
    
    const course = courses[courseIndex];
    if (!course.isCustom) return; // Only custom courses have this feature for now

    const completedTopics = course.completedTopics || [];
    const isCompleted = completedTopics.includes(topicTitle);
    
    let newCompletedTopics;
    if (isCompleted) {
      newCompletedTopics = completedTopics.filter((t: string) => t !== topicTitle);
    } else {
      newCompletedTopics = [...completedTopics, topicTitle];
    }

    // Calculate new progress
    let totalTopics = 0;
    course.modules.forEach((m: any) => {
      totalTopics += m.topics.length;
    });
    
    const newProgress = totalTopics === 0 ? 0 : Math.round((newCompletedTopics.length / totalTopics) * 100);

    // Update local state
    const updatedCourse = { ...course, completedTopics: newCompletedTopics, progress: newProgress };
    const newCourses = [...courses];
    newCourses[courseIndex] = updatedCourse;
    setCourses(newCourses);
    if (selectedCourse?.id === courseId) {
      setSelectedCourse(updatedCourse);
    }

    // Update Firebase
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        completedTopics: newCompletedTopics,
        progress: newProgress
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `courses/${courseId}`);
    }
  };

  const filteredCourses = courses.filter(c => filter === 'All' || c.category === filter || (filter === 'AI Generated' && c.isCustom));

    if (loading) {
      return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-accent-blue" /></div>;
    }

    if (selectedCourse) {
      return (
        <div className="space-y-10">
          <button 
            onClick={() => setSelectedCourse(null)}
            className="flex items-center gap-2 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Learning Hub
          </button>

          <div className="glass-card p-10">
            <h1 className="text-3xl font-bold text-[#1D1D1F] mb-2">{selectedCourse.title}</h1>
            <p className="text-[#86868B] mb-8">{selectedCourse.description}</p>

            <div className="flex items-center justify-between text-sm font-medium mb-3">
              <span className="text-[#86868B]">Course Progress</span>
              <span className={selectedCourse.progress === 100 ? 'text-accent-green' : 'text-accent-blue'}>
                {selectedCourse.progress}%
              </span>
            </div>
            <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden border border-black/5 mb-6">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${selectedCourse.progress === 100 ? 'bg-accent-green shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'progress-bar-fill'}`}
                style={{ width: `${selectedCourse.progress || 0}%` }}
              />
            </div>
            
            {selectedCourse.progress === 100 ? (
              <p className="text-accent-green font-medium flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Congratulations! You're one step closer to your goal 🎉
              </p>
            ) : selectedCourse.progress > 0 ? (
              <p className="text-accent-blue font-medium">
                Keep going, you're making great progress! 🚀
              </p>
            ) : null}
          </div>

          {selectedCourse.isCustom ? (
            <div className="space-y-8">
              {selectedCourse.modules?.map((module: any, mIndex: number) => (
                <div key={mIndex} className="glass-card p-8">
                  <h2 className="text-xl font-semibold text-[#1D1D1F] mb-6 flex items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F5F5F7] border border-black/10 text-sm">{mIndex + 1}</span>
                    {module.title}
                  </h2>
                  <div className="space-y-4 pl-12">
                    {module.topics?.map((topic: any, tIndex: number) => {
                      const isCompleted = selectedCourse.completedTopics?.includes(topic.title);
                      return (
                        <div key={tIndex} className={`p-5 rounded-xl border transition-colors ${isCompleted ? 'bg-accent-green/5 border-accent-green/20' : 'bg-[#F5F5F7] border-black/5 hover:border-black/10'}`}>
                          <div className="flex items-start gap-4">
                            <button 
                              onClick={() => toggleTopic(selectedCourse.id, topic.title)}
                              className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isCompleted ? 'bg-accent-green border-accent-green text-white' : 'border-black/10 hover:border-accent-blue'}`}
                            >
                              {isCompleted && <CheckCircle className="w-3 h-3" />}
                            </button>
                            <div className="flex-1">
                              <h3 className={`font-medium ${isCompleted ? 'text-[#86868B] line-through' : 'text-[#1D1D1F]'}`}>{topic.title}</h3>
                              {topic.videoSuggestion && (
                                <a 
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic.videoSuggestion.searchQuery)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#86868B] hover:text-red-400 transition-colors"
                                >
                                  <Youtube className="w-4 h-4" />
                                  {topic.videoSuggestion.title}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <h3 className="text-xl font-medium text-[#1D1D1F] mb-2">Standard Course Content</h3>
              <p className="text-[#86868B]">This is a placeholder for standard course content. Only AI-generated courses have interactive modules in this demo.</p>
            </div>
          )}
        </div>
      );
    }

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">Learning Hub</h1>
          <p className="text-[#86868B] mt-2">Curated courses to build your skills.</p>
        </div>
        
        <div className="flex gap-2 bg-[#F5F5F7] p-1.5 rounded-xl border border-black/5 shadow-sm overflow-x-auto">
          {['All', 'AI Generated', 'Coding', 'Life Skills'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filter === f 
                  ? 'bg-white text-[#1D1D1F] shadow-sm' 
                  : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-white/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="group glass-card overflow-hidden flex flex-col"
          >
            <div className="aspect-video bg-black/5 relative flex items-center justify-center group-hover:bg-black/10 transition-colors">
              <PlayCircle className="w-12 h-12 text-[#86868B] group-hover:text-accent-blue transition-all duration-500 transform group-hover:scale-110" />
              <div className="absolute top-3 right-3 px-3 py-1 bg-white/80 backdrop-blur-md text-xs font-medium text-[#1D1D1F] rounded-full border border-black/5 shadow-sm">
                {course.category}
              </div>
            </div>
            
            <div className="p-8 flex flex-col flex-1">
              <h3 className="font-semibold text-[#1D1D1F] mb-3 truncate text-lg">{course.title}</h3>
              
              <div className="flex items-center gap-4 text-xs text-[#86868B] mb-8">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {course.duration}
                </span>
              </div>

              <div className="space-y-3 mt-auto">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#86868B]">Progress</span>
                  <span className={course.progress === 100 ? 'text-accent-green' : 'text-accent-blue'}>
                    {course.progress}%
                  </span>
                </div>
                <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden border border-black/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${course.progress === 100 ? 'bg-accent-green shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'progress-bar-fill'}`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              <button 
                onClick={() => setSelectedCourse(course)}
                className="mt-8 w-full btn-secondary"
              >
                {course.progress === 100 ? (
                  <><CheckCircle className="w-4 h-4 text-accent-green" /> Completed</>
                ) : course.progress > 0 ? (
                  'Continue Learning'
                ) : (
                  'Start Course'
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
