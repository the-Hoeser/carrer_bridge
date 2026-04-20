import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType, logout } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import {
  User, Bell, Trash2, LogOut, Shield, BookOpen,
  Loader2, CheckCircle, Save, ChevronRight, Palette,
  Target, AlertTriangle, X, Mail, Camera, Sparkles
} from 'lucide-react';

interface UserProfile {
  displayName: string;
  email: string;
  education: string;
  interests: string[];
  currentSkills: string[];
  photoURL?: string;
  notificationsEnabled?: boolean;
  theme?: string;
}

const TABS = [
  { id: 'profile',   label: 'Profile',       icon: User },
  { id: 'goals',     label: 'Goals & Skills', icon: Target },
  { id: 'notifs',    label: 'Notifications',  icon: Bell },
  { id: 'data',      label: 'Data & Privacy', icon: Shield },
];

export function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stats, setStats] = useState({ roadmaps: 0, courses: 0, resumes: 0 });

  useEffect(() => {
    if (!user) return;

    // IMMEDIATELY pre-fill from auth — no Firestore wait
    const baseProfile: UserProfile = {
      displayName: user.displayName || '',
      email: user.email || '',
      education: '',
      interests: [],
      currentSkills: [],
      photoURL: user.photoURL || '',
      notificationsEnabled: true,
      theme: 'light',
    };
    setProfile(baseProfile);

    // Then enhance with Firestore data in the background
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setProfile(prev => prev ? {
            ...prev,
            education: d.education || prev.education,
            interests: d.interests || prev.interests,
            currentSkills: d.currentSkills || prev.currentSkills,
            notificationsEnabled: d.notificationsEnabled ?? prev.notificationsEnabled,
            theme: d.theme || prev.theme,
          } : prev);
        }
        // Load stats (background)
        const [rSnap, cSnap, resSnap] = await Promise.all([
          getDocs(query(collection(db, 'roadmaps'),  where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'courses'),   where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'resumes'),   where('userId', '==', user.uid))),
        ]);
        setStats({ roadmaps: rSnap.size, courses: cSnap.size, resumes: resSnap.size });
      } catch (e) {
        // Silent fail — profile is already pre-filled from auth
        console.warn('Firestore offline — using auth data only');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: profile.displayName,
        education: profile.education,
        interests: profile.interests,
        currentSkills: profile.currentSkills,
        notificationsEnabled: profile.notificationsEnabled,
        theme: profile.theme,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'users');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    try {
      const [rSnap, cSnap, resSnap] = await Promise.all([
        getDocs(query(collection(db, 'roadmaps'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'courses'),  where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'resumes'),  where('userId', '==', user.uid))),
      ]);
      const deletions = [
        ...rSnap.docs.map(d => deleteDoc(doc(db, 'roadmaps', d.id))),
        ...cSnap.docs.map(d => deleteDoc(doc(db, 'courses',  d.id))),
        ...resSnap.docs.map(d => deleteDoc(doc(db, 'resumes', d.id))),
      ];
      await Promise.all(deletions);
      setShowDeleteModal(false);
      logout();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'user-data');
    }
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && profile && !profile.currentSkills.includes(trimmed)) {
      setProfile({ ...profile, currentSkills: [...profile.currentSkills, trimmed] });
    }
  };
  const removeSkill = (s: string) => profile && setProfile({ ...profile, currentSkills: profile.currentSkills.filter(x => x !== s) });
  const addInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (trimmed && profile && !profile.interests.includes(trimmed)) {
      setProfile({ ...profile, interests: [...profile.interests, trimmed] });
    }
  };
  const removeInterest = (i: string) => profile && setProfile({ ...profile, interests: profile.interests.filter(x => x !== i) });

  // Don't block render — always show the form (profile pre-filled from auth above)

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-[#1C1C1E] mb-2">Delete all your data?</h3>
            <p className="text-sm text-[#8E8E93] mb-6 leading-relaxed">
              This will permanently delete your <strong>{stats.roadmaps} roadmaps</strong>, <strong>{stats.courses} courses</strong>, and <strong>{stats.resumes} resumes</strong>. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl border border-black/10 text-sm font-semibold text-[#8E8E93] hover:bg-black/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteAllData} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
                Yes, delete everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1C1E]">Settings</h1>
        <p className="text-[#8E8E93] mt-1 text-sm">Manage your profile, goals, and preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <div className="glass-card p-3 space-y-1 h-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/5'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {activeTab === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
            </button>
          ))}

          {/* User stats */}
          <div className="pt-4 mt-2 border-t border-black/5 space-y-2 px-2">
            {[
              { label: 'Roadmaps', value: stats.roadmaps, color: 'text-blue-500' },
              { label: 'Courses', value: stats.courses, color: 'text-green-500' },
              { label: 'Resumes', value: stats.resumes, color: 'text-violet-500' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span className="text-[#8E8E93]">{s.label}</span>
                <span className={`font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="md:col-span-3 space-y-5">
          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && profile && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }} className="glass-card p-7 space-y-6">
              <h2 className="text-lg font-bold text-[#1C1C1E] flex items-center gap-2"><User className="w-5 h-5 text-blue-500" /> Profile Information</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt={profile.displayName} className="w-20 h-20 rounded-2xl object-cover border-2 border-black/8" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold">
                      {profile.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white border border-black/10 flex items-center justify-center shadow-sm">
                    <Camera className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-[#1C1C1E]">{profile.displayName}</p>
                  <p className="text-sm text-[#8E8E93] flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5" /> {profile.email}
                  </p>
                  <p className="text-xs text-blue-500 mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Profile synced with Google
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1C1C1E] mb-2">Display Name</label>
                <input
                  className="glass-input text-sm"
                  value={profile.displayName}
                  onChange={e => setProfile({ ...profile, displayName: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1C1C1E] mb-2">Education</label>
                <input
                  className="glass-input text-sm"
                  value={profile.education}
                  onChange={e => setProfile({ ...profile, education: e.target.value })}
                  placeholder="e.g. B.S. Computer Science, Self-taught"
                />
              </div>

              <SaveRow saving={saving} saved={saved} onSave={handleSave} />
            </motion.div>
          )}

          {/* ── GOALS TAB ── */}
          {activeTab === 'goals' && profile && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }} className="glass-card p-7 space-y-6">
              <h2 className="text-lg font-bold text-[#1C1C1E] flex items-center gap-2"><Target className="w-5 h-5 text-orange-500" /> Goals & Skills</h2>

              {/* Skills */}
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1E] mb-2">Current Skills</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.currentSkills.map(s => (
                    <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
                      {s}
                      <button onClick={() => removeSkill(s)} className="text-blue-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <input
                  className="glass-input text-sm"
                  placeholder="Add a skill and press Enter"
                  onKeyDown={e => { if (e.key === 'Enter') { addSkill((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
                />
                <p className="text-xs text-[#8E8E93] mt-1.5">Press Enter to add each skill</p>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-semibold text-[#1C1C1E] mb-2">Career Interests</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.interests.map(i => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-xs font-semibold">
                      {i}
                      <button onClick={() => removeInterest(i)} className="text-violet-400 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <input
                  className="glass-input text-sm"
                  placeholder="Add an interest and press Enter"
                  onKeyDown={e => { if (e.key === 'Enter') { addInterest((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
                />
              </div>

              <SaveRow saving={saving} saved={saved} onSave={handleSave} />
            </motion.div>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === 'notifs' && profile && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }} className="glass-card p-7 space-y-5">
              <h2 className="text-lg font-bold text-[#1C1C1E] flex items-center gap-2"><Bell className="w-5 h-5 text-violet-500" /> Notifications</h2>

              {[
                { label: 'Daily Learning Reminders', desc: 'Get reminded to keep your streak alive every day', key: 'notificationsEnabled', value: profile.notificationsEnabled },
              ].map(({ label, desc, key, value }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-[#F9F9F9] rounded-2xl border border-black/5">
                  <div>
                    <p className="font-semibold text-sm text-[#1C1C1E]">{label}</p>
                    <p className="text-xs text-[#8E8E93] mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => setProfile({ ...profile, [key]: !value })}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${value ? 'bg-blue-500' : 'bg-black/10'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${value ? 'left-6.5 translate-x-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
                <p className="font-semibold mb-1">Browser permission required</p>
                <p className="text-xs leading-relaxed">For actual push notifications, click the bell icon that appears when you first sign in, or enable notifications in your browser settings for localhost.</p>
              </div>

              <SaveRow saving={saving} saved={saved} onSave={handleSave} />
            </motion.div>
          )}

          {/* ── DATA & PRIVACY TAB ── */}
          {activeTab === 'data' && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }} className="space-y-5">
              <div className="glass-card p-7">
                <h2 className="text-lg font-bold text-[#1C1C1E] flex items-center gap-2 mb-5"><Shield className="w-5 h-5 text-green-500" /> Your Data</h2>
                <div className="space-y-3">
                  {[
                    { icon: BookOpen, label: `${stats.roadmaps} career roadmaps stored`, desc: 'AI-generated learning paths with your task progress' },
                    { icon: BookOpen, label: `${stats.courses} learning courses stored`, desc: 'Video progress and completion data' },
                    { icon: BookOpen, label: `${stats.resumes} resume versions stored`, desc: 'Your resume content and selected template' },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3 p-4 bg-[#F9F9F9] rounded-xl border border-black/5">
                      <Icon className="w-4 h-4 text-[#8E8E93] mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#1C1C1E]">{label}</p>
                        <p className="text-xs text-[#8E8E93]">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-7 border-red-100">
                <h2 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</h2>
                <p className="text-sm text-[#8E8E93] mb-5">These actions are permanent and cannot be undone.</p>
                <div className="space-y-3">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-black/8 hover:bg-black/3 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-sm text-[#1C1C1E]">Sign Out</p>
                      <p className="text-xs text-[#8E8E93]">Securely sign out of your account</p>
                    </div>
                    <LogOut className="w-4 h-4 text-[#8E8E93]" />
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-sm text-red-600">Delete All My Data</p>
                      <p className="text-xs text-red-400">Removes all roadmaps, courses, and resumes permanently</p>
                    </div>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveRow({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void; }) {
  return (
    <div className="flex justify-end pt-2 border-t border-black/5">
      <button onClick={onSave} disabled={saving} className="btn-primary py-2.5 px-6 text-sm">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4 text-green-300" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}
