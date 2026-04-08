import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { GoogleGenAI, Type } from '@google/genai';
import { motion } from 'motion/react';
import { Sparkles, Loader2, Target, CheckCircle2, BookOpen, Briefcase, ArrowRight } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function CareerGuide() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [converting, setConverting] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);

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
        const q = query(
          collection(db, 'roadmaps'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setRoadmap(snapshot.docs[0].data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'roadmaps');
      } finally {
        setFetching(false);
      }
    };

    fetchLatestRoadmap();
  }, [user]);

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const prompt = `
        You are an expert career counselor and technical mentor.
        A student has provided the following profile:
        - Target Role: ${formData.targetRole}
        - Education: ${formData.education}
        - Current Skills: ${formData.currentSkills}
        - Interests: ${formData.interests}
        
        Generate a highly personalized, structured career roadmap for them.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skillGap: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills they are missing for the target role." },
              recommendedSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills they should focus on learning." },
              learningRoadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    phase: { type: Type.STRING, description: "e.g., Month 1, Phase 1" },
                    focus: { type: Type.STRING, description: "What to focus on during this phase." }
                  }
                }
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              },
              careerAdvice: { type: Type.STRING, description: "General advice for their career journey." }
            },
            required: ["skillGap", "recommendedSkills", "learningRoadmap", "projects", "careerAdvice"]
          }
        }
      });

      const generatedData = JSON.parse(response.text || '{}');
      
      const newRoadmap = {
        userId: user.uid,
        targetRole: formData.targetRole,
        ...generatedData,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'roadmaps'), newRoadmap);
      setRoadmap(newRoadmap);
      
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const convertToCourse = async () => {
    if (!user || !roadmap) return;
    setConverting(true);
    try {
      const prompt = `
        Convert the following career roadmap into a structured learning course.
        Generate a motivating and engaging course name (e.g., "JavaScript Mastery Journey").
        Structure the course into Modules (e.g., Beginner, Intermediate, Advanced) and Topics inside each module.
        For each topic, suggest a relevant YouTube video with a title and a search query.
        
        Roadmap:
        Target Role: ${roadmap.targetRole}
        Skill Gap: ${roadmap.skillGap?.join(', ')}
        Recommended Skills: ${roadmap.recommendedSkills?.join(', ')}
        Learning Roadmap: ${JSON.stringify(roadmap.learningRoadmap)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              courseName: { type: Type.STRING },
              description: { type: Type.STRING },
              modules: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    topics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          videoSuggestion: {
                            type: Type.OBJECT,
                            properties: {
                              title: { type: Type.STRING },
                              searchQuery: { type: Type.STRING }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ["courseName", "description", "modules"]
          }
        }
      });

      const generatedCourse = JSON.parse(response.text || '{}');
      
      const newCourse = {
        userId: user.uid,
        targetRole: roadmap.targetRole,
        category: 'AI Generated',
        ...generatedCourse,
        progress: 0,
        completedTopics: [],
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'courses'), newCourse);
      alert("Your personalized course is ready 🚀");
      navigate('/learning');
      
    } catch (error) {
      console.error("Course Generation Error:", error);
      alert("Failed to convert roadmap to course. Please try again.");
    } finally {
      setConverting(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-accent-blue" /></div>;
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F] flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-accent-blue" />
          AI Career Guide
        </h1>
        <p className="text-[#86868B] mt-2">Get a personalized learning path and skill gap analysis.</p>
      </header>

      {!roadmap || loading ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card p-8 max-w-2xl"
        >
          <form onSubmit={generateRoadmap} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Target Role</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Full Stack Developer, Data Scientist"
                className="glass-input"
                value={formData.targetRole}
                onChange={e => setFormData({...formData, targetRole: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Current Education</label>
              <input 
                required
                type="text" 
                placeholder="e.g. B.S. Computer Science, Self-taught"
                className="glass-input"
                value={formData.education}
                onChange={e => setFormData({...formData, education: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Current Skills (comma separated)</label>
              <input 
                required
                type="text" 
                placeholder="e.g. HTML, CSS, basic Python"
                className="glass-input"
                value={formData.currentSkills}
                onChange={e => setFormData({...formData, currentSkills: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Interests</label>
              <input 
                required
                type="text" 
                placeholder="e.g. AI, Web3, Open Source, Design"
                className="glass-input"
                value={formData.interests}
                onChange={e => setFormData({...formData, interests: e.target.value})}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'Analyzing Profile & Generating...' : 'Generate My Roadmap'}
            </button>
          </form>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#1D1D1F]">Your Path to <span className="text-accent-blue">{roadmap.targetRole}</span></h2>
            <button 
              onClick={() => setRoadmap(null)}
              className="text-sm text-[#86868B] hover:text-[#1D1D1F] underline transition-colors"
            >
              Generate New
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8">
              <h3 className="flex items-center gap-2 text-lg font-medium text-[#1D1D1F] mb-6">
                <Target className="w-5 h-5 text-accent-blue" /> Skill Gap
              </h3>
              <ul className="space-y-4">
                {roadmap.skillGap?.map((skill: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-[#86868B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-2 flex-shrink-0" />
                    {skill}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-8">
              <h3 className="flex items-center gap-2 text-lg font-medium text-[#1D1D1F] mb-6">
                <CheckCircle2 className="w-5 h-5 text-accent-green" /> Recommended Skills
              </h3>
              <div className="flex flex-wrap gap-3">
                {roadmap.recommendedSkills?.map((skill: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-accent-green/10 text-accent-green border border-accent-green/20 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-10">
            <h3 className="flex items-center gap-2 text-lg font-medium text-[#1D1D1F] mb-10">
              <BookOpen className="w-5 h-5 text-accent-blue" /> Learning Roadmap
            </h3>
            <div className="space-y-10 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-accent-blue/50 before:via-accent-green/50 before:to-transparent">
              {roadmap.learningRoadmap?.map((step: any, i: number) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-accent-blue/20 text-accent-blue shadow-[0_0_15px_rgba(0,113,227,0.15)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-bold">
                    {i + 1}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-[#F5F5F7] border border-black/5 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-[#1D1D1F]">{step.phase}</div>
                    </div>
                    <div className="text-[#86868B] text-sm leading-relaxed">{step.focus}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-10">
            <h3 className="flex items-center gap-2 text-lg font-medium text-[#1D1D1F] mb-8">
              <Briefcase className="w-5 h-5 text-accent-blue" /> Recommended Projects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {roadmap.projects?.map((project: any, i: number) => (
                <div key={i} className="bg-[#F5F5F7] border border-black/5 p-6 rounded-xl hover:bg-[#F5F5F7]/80 transition-colors">
                  <h4 className="font-medium text-[#1D1D1F] mb-3">{project.title}</h4>
                  <p className="text-sm text-[#86868B] leading-relaxed">{project.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-accent-blue/5 to-accent-green/5 border border-black/5 rounded-2xl p-10">
            <h3 className="text-lg font-medium text-[#1D1D1F] mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-blue" /> Career Advice
            </h3>
            <p className="text-[#1D1D1F] leading-relaxed text-lg font-light">{roadmap.careerAdvice}</p>
          </div>

          <div className="flex flex-col items-center justify-center p-10 glass-card mt-12">
            <h3 className="text-2xl font-bold text-[#1D1D1F] mb-3">Ready to start learning?</h3>
            <p className="text-[#86868B] mb-8 text-center max-w-lg">
              Convert this roadmap into a structured, step-by-step course with curated YouTube video suggestions for every topic.
            </p>
            <button 
              onClick={convertToCourse}
              disabled={converting}
              className="btn-primary px-8 py-4 text-lg"
            >
              {converting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating Course...</>
              ) : (
                <>Convert to Structured Course <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </div>

        </motion.div>
      )}
    </div>
  );
}
