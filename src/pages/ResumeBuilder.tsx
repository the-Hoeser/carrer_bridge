import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Save, Download, Loader2, FileText } from 'lucide-react';

export function ResumeBuilder() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [resumeId, setResumeId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    personalInfo: '',
    experience: '',
    education: '',
    skills: '',
    projects: ''
  });

  useEffect(() => {
    if (!user) return;

    const fetchResume = async () => {
      try {
        const q = query(collection(db, 'resumes'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          setResumeId(docData.id);
          setFormData({
            personalInfo: docData.data().personalInfo || '',
            experience: docData.data().experience || '',
            education: docData.data().education || '',
            skills: docData.data().skills || '',
            projects: docData.data().projects || ''
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'resumes');
      } finally {
        setFetching(false);
      }
    };

    fetchResume();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        userId: user.uid,
        ...formData,
        lastUpdated: new Date().toISOString()
      };

      if (resumeId) {
        await updateDoc(doc(db, 'resumes', resumeId), payload);
      } else {
        const docRef = await addDoc(collection(db, 'resumes'), payload);
        setResumeId(docRef.id);
      }
      alert('Resume saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'resumes');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-accent-blue" /></div>;
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F] flex items-center gap-3">
            <FileText className="w-8 h-8 text-accent-blue" />
            Resume Builder
          </h1>
          <p className="text-[#86868B] mt-2">Create an ATS-friendly resume to land your dream job.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button 
            onClick={() => alert("PDF Download coming soon!")}
            className="btn-primary"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card p-8 space-y-6"
        >
          <h2 className="text-xl font-semibold text-[#1D1D1F] mb-6">Edit Details</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Personal Info (Name, Email, Phone, Links)</label>
              <textarea 
                rows={3}
                className="glass-input resize-none"
                value={formData.personalInfo}
                onChange={e => setFormData({...formData, personalInfo: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Experience</label>
              <textarea 
                rows={4}
                className="glass-input resize-none"
                value={formData.experience}
                onChange={e => setFormData({...formData, experience: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Education</label>
              <textarea 
                rows={3}
                className="glass-input resize-none"
                value={formData.education}
                onChange={e => setFormData({...formData, education: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Skills</label>
              <textarea 
                rows={2}
                className="glass-input resize-none"
                value={formData.skills}
                onChange={e => setFormData({...formData, skills: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Projects</label>
              <textarea 
                rows={4}
                className="glass-input resize-none"
                value={formData.projects}
                onChange={e => setFormData({...formData, projects: e.target.value})}
              />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#FAFAFA] rounded-2xl p-10 text-zinc-900 shadow-2xl min-h-[800px] font-serif border border-zinc-200/50"
        >
          <div className="border-b-2 border-zinc-300 pb-4 mb-6">
            <h2 className="text-3xl font-bold uppercase tracking-wider mb-2">
              {formData.personalInfo.split('\n')[0] || 'Your Name'}
            </h2>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap">
              {formData.personalInfo.split('\n').slice(1).join(' | ') || 'email@example.com | (123) 456-7890 | linkedin.com/in/yourprofile'}
            </p>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-bold uppercase tracking-wider border-b border-zinc-300 mb-3 text-zinc-800">Experience</h3>
              <div className="text-sm whitespace-pre-wrap text-zinc-700 leading-relaxed">
                {formData.experience || 'Company Name - Role\nJan 2020 - Present\n- Achieved X by doing Y resulting in Z.'}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold uppercase tracking-wider border-b border-zinc-300 mb-3 text-zinc-800">Education</h3>
              <div className="text-sm whitespace-pre-wrap text-zinc-700 leading-relaxed">
                {formData.education || 'University Name - Degree\nGraduation Year'}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold uppercase tracking-wider border-b border-zinc-300 mb-3 text-zinc-800">Skills</h3>
              <div className="text-sm whitespace-pre-wrap text-zinc-700 leading-relaxed">
                {formData.skills || 'JavaScript, React, Node.js, Python, SQL'}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold uppercase tracking-wider border-b border-zinc-300 mb-3 text-zinc-800">Projects</h3>
              <div className="text-sm whitespace-pre-wrap text-zinc-700 leading-relaxed">
                {formData.projects || 'Project Name\n- Built a full-stack application using X, Y, Z.'}
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
