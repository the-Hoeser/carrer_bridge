import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayCircle, CheckCircle, Clock, ArrowLeft, Loader2, BookOpen,
  ChevronDown, ChevronRight, Award, Flame, Circle,
  BarChart2, ListChecks, ExternalLink, Trash2, Sparkles,
  Lightbulb, Zap, Target, Rocket, Dumbbell, RefreshCw
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType, fetchWithAuth } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';



// ─── YouTube Video Player — Simple, Reliable Iframe Embed ────────────────────
// Uses a plain <iframe> embed instead of the complex YouTube IFrame JS API.
// The JS API requires loading scripts, waiting for callbacks, and handling
// state machines — all of which break frequently. A plain iframe always works.

function YouTubePlayer({
  searchQuery,
  topicId,
  onProgress,
  savedProgress = 0,
  preResolvedVideoId,
  onVideoResolved
}: {
  searchQuery: string;
  topicId: string;
  onProgress: (topicId: string, percent: number, seconds: number) => void;
  savedProgress?: number;
  preResolvedVideoId?: string;
  onVideoResolved?: (videoId: string) => void;
}) {
  const encodedQuery = encodeURIComponent(searchQuery);
  const [videoId, setVideoId] = useState<string | null>(preResolvedVideoId || null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Only call backend if we DON'T have a pre-resolved video ID
  useEffect(() => {
    if (preResolvedVideoId) {
      setVideoId(preResolvedVideoId);
      setResolving(false);
      setResolveError(false);
      return;
    }

    // No hardcoded ID — try the backend API (for AI-generated courses)
    let cancelled = false;
    setResolving(true);
    setResolveError(false);
    setIframeLoaded(false);
    
    (async () => {
      try {
        const response = await fetchWithAuth(`/api/getVideoId?q=${encodedQuery}`);
        if (!response.ok) throw new Error('API failed');
        const data = await response.json();
        if (!cancelled && data.videoId) {
          setVideoId(data.videoId);
          // NEW: Persist this videoId so we don't have to search again
          if (onVideoResolved) onVideoResolved(data.videoId);
        } else if (!cancelled) {
          setResolveError(true);
        }
      } catch {
        if (!cancelled) setResolveError(true);
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => { cancelled = true; };
  }, [searchQuery, encodedQuery, preResolvedVideoId, onVideoResolved]);

  // When videoId changes, reset iframe loaded state
  useEffect(() => {
    setIframeLoaded(false);
  }, [videoId]);

  return (
    <div className="space-y-3">
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#0f0f0f] shadow-2xl" style={{ aspectRatio: '16/9' }}>
        
        {/* Loading spinner */}
        {(resolving || (videoId && !iframeLoaded)) && !resolveError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-[#0f0f0f]">
            <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
            <p className="text-sm text-white/50">
              {resolving ? 'Finding the best tutorial…' : 'Loading video…'}
            </p>
          </div>
        )}

        {/* ── THE ACTUAL PLAYER: iframe embed ── */}
        {/* If we have a resolved videoId, embed it directly. Otherwise, embed YouTube search results. */}
        {videoId ? (
          <iframe
            key={videoId}
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0&origin=${encodeURIComponent(window.location.origin)}`}
            title={searchQuery}
            frameBorder="0"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
          />
        ) : resolveError ? (
          /* Fallback: embed YouTube search as an iframe so video plays inline */
          <iframe
            key={`search-${encodedQuery}`}
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed?listType=search&list=${encodedQuery}&rel=0&modestbranding=1`}
            title={searchQuery}
            frameBorder="0"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
          />
        ) : null}

        {/* Progress bar overlay */}
        {savedProgress > 0 && savedProgress < 100 && iframeLoaded && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-20 pointer-events-none">
            <div className="h-full bg-accent-blue transition-all duration-1000" style={{ width: `${savedProgress}%` }} />
          </div>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-[#86868B]">
          🎬 Tutorial: <span className="font-medium text-[#1D1D1F]">"{searchQuery}"</span>
        </p>
        <a
          href={`https://www.youtube.com/results?search_query=${encodedQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[#86868B] hover:text-red-500 transition-colors"
        >
          <svg className="w-3.5 h-3.5 fill-current text-red-500" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          Open on YouTube <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}


// ─── Key Takeaways — AI-generated learning highlights ────────────────────────
// Fetches structured takeaways from /api/getKeyTakeaways and caches them.

const takeawaysCache = new Map<string, any>();

function KeyTakeaways({
  topicTitle,
  topicDescription,
  searchQuery,
}: {
  topicTitle: string;
  topicDescription?: string;
  searchQuery?: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const fetchTakeaways = useCallback(async (isRetry = false) => {
    if (!topicTitle) return;

    const cacheKey = topicTitle;

    // Check cache first (unless retrying)
    if (!isRetry && takeawaysCache.has(cacheKey)) {
      setData(takeawaysCache.get(cacheKey));
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    if (!isRetry) setData(null);

    try {
      const response = await fetchWithAuth('/api/getKeyTakeaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicTitle, topicDescription, searchQuery }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate takeaways');
      }
      const result = await response.json();
      if (result.takeaways?.length) {
        takeawaysCache.set(cacheKey, result);
        setData(result);
      } else {
        throw new Error('Invalid takeaway structure');
      }
    } catch (err: any) {
      console.error('[KeyTakeaways] Fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [topicTitle, topicDescription, searchQuery]);

  useEffect(() => {
    fetchTakeaways();
  }, [fetchTakeaways]);

  if (error && !data && !loading) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-100 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-red-900 text-sm">Takeaways unavailable</h3>
            <p className="text-xs text-red-600 line-clamp-1">{error.includes('quota') ? 'AI quota exceeded. Please try again in 1 minute.' : error}</p>
          </div>
        </div>
        <button
          onClick={() => fetchTakeaways(true)}
          className="px-4 py-2 bg-white border border-red-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#FAFAFA] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-[#1D1D1F] text-sm">Key Takeaways</h3>
            <p className="text-xs text-[#86868B]">AI-generated learning highlights</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#86868B] transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin" />
                <Sparkles className="w-4 h-4 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs text-[#86868B]">Generating key takeaways with AI…</p>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Summary */}
              {data.summary && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100/50">
                  <p className="text-sm text-amber-900 leading-relaxed font-medium">
                    📖 {data.summary}
                  </p>
                </div>
              )}

              {/* Takeaway cards */}
              <div className="space-y-2.5">
                {data.takeaways?.map((t: any, i: number) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3.5 rounded-xl bg-[#FAFAFA] hover:bg-[#F0F0F2] transition-colors group"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-black/5 flex items-center justify-center text-base shadow-sm group-hover:scale-110 transition-transform">
                      {t.icon || '💡'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1D1D1F]">{t.title}</p>
                      <p className="text-xs text-[#86868B] mt-0.5 leading-relaxed">{t.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Practice exercises */}
              {data.exercises?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-black/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Dumbbell className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-[#1D1D1F]">Practice Exercises</h4>
                  </div>
                  <div className="space-y-2">
                    {data.exercises.map((ex: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100/50">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                        <p className="text-xs text-blue-900 leading-relaxed">{ex}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}


// ─── Course Player (Physics Wallah style) ─────────────────────────────────────
function CoursePlayer({
  course,
  onBack,
  onUpdateCourse
}: {
  course: any;
  onBack: () => void;
  onUpdateCourse: (updated: any) => void;
}) {
  const { user } = useAuth();
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeTopicIdx, setActiveTopicIdx] = useState(0);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [saving, setSaving] = useState(false);

  const allModules: any[] = course.modules || [];
  const activeMod = allModules[activeModuleIdx];
  const activeTopic = activeMod?.topics?.[activeTopicIdx];

  // Flatten all topics for previous/next
  const allTopics: { mIdx: number; tIdx: number; topic: any }[] = [];
  allModules.forEach((m, mIdx) => {
    (m.topics || []).forEach((t: any, tIdx: number) => {
      allTopics.push({ mIdx, tIdx, topic: t });
    });
  });
  const flatIdx = allTopics.findIndex(x => x.mIdx === activeModuleIdx && x.tIdx === activeTopicIdx);

  const totalTopics = allTopics.length;
  const completedTopics: string[] = course.completedTopics || [];
  const watchProgress: Record<string, number> = course.watchProgress || {};
  const completedCount = completedTopics.length;
  const overallProgress = totalTopics === 0 ? 0 : Math.round((completedCount / totalTopics) * 100);

  const isCompleted = (t: any) => completedTopics.includes(t.id || t.title);
  const getWatchPct = (t: any) => watchProgress[t.id || t.title] || 0;

  const navigate = (mIdx: number, tIdx: number) => {
    setActiveModuleIdx(mIdx);
    setActiveTopicIdx(tIdx);
    setExpandedModules(prev => new Set([...prev, mIdx]));
  };

  const goNext = () => {
    if (flatIdx < allTopics.length - 1) {
      const next = allTopics[flatIdx + 1];
      navigate(next.mIdx, next.tIdx);
    }
  };

  const goPrev = () => {
    if (flatIdx > 0) {
      const prev = allTopics[flatIdx - 1];
      navigate(prev.mIdx, prev.tIdx);
    }
  };

  const handleMarkComplete = useCallback(async () => {
    if (!activeTopic || !user) return;
    const tid = activeTopic.id || activeTopic.title;
    const alreadyDone = isCompleted(activeTopic);

    const newCompleted = alreadyDone
      ? completedTopics.filter(t => t !== tid)
      : [...completedTopics, tid];

    const newWatchPct = { ...watchProgress, [tid]: alreadyDone ? 0 : 100 };
    const newProgress = Math.round((newCompleted.length / totalTopics) * 100);

    const updated = { ...course, completedTopics: newCompleted, watchProgress: newWatchPct, progress: newProgress };
    onUpdateCourse(updated);

    if (course.isCustom && course.id) {
      setSaving(true);
      try {
        await updateDoc(doc(db, 'courses', course.id), {
          completedTopics: newCompleted,
          watchProgress: newWatchPct,
          progress: newProgress
        });
      } catch (e) { console.error(e); }
      setSaving(false);
    }

    // Auto-advance after marking complete
    if (!alreadyDone && flatIdx < allTopics.length - 1) {
      setTimeout(() => goNext(), 600);
    }
  }, [activeTopic, completedTopics, watchProgress, totalTopics, flatIdx, course]);

  // Use a ref to track last persisted progress to avoid hammering Firestore
  const lastPersistedPct = useRef<Record<string, number>>({});

  const handleWatchProgress = useCallback(async (percent: number) => {
    if (!activeTopic || !user) return;
    const tid = activeTopic.id || activeTopic.title;
    const currentPct = watchProgress[tid] || 0;
    
    if (currentPct >= percent) return; // only update if higher

    const newWatchPct = { ...watchProgress, [tid]: percent };
    const updated = { ...course, watchProgress: newWatchPct };
    onUpdateCourse(updated);

    // Persist to Firestore only every 10% progress
    const lastSaved = lastPersistedPct.current[tid] || 0;
    if (course.isCustom && course.id && (percent === 100 || percent - lastSaved >= 10)) {
      lastPersistedPct.current[tid] = percent;
      try {
        await updateDoc(doc(db, 'courses', course.id), { watchProgress: newWatchPct });
      } catch (e) { console.error(e); }
    }
  }, [activeTopic, watchProgress, course, user, onUpdateCourse]);

  const handleVideoResolved = useCallback(async (videoId: string) => {
    if (!activeTopic || !user || !course.isCustom || !course.id) return;
    
    // Update local state first for immediate UI feedback
    const updatedModules = course.modules.map((m: any) => ({
      ...m,
      topics: m.topics.map((t: any) => {
        if ((t.id || t.title) === (activeTopic.id || activeTopic.title)) {
          return { ...t, videoSuggestion: { ...t.videoSuggestion, videoId } };
        }
        return t;
      })
    }));

    const updated = { ...course, modules: updatedModules };
    onUpdateCourse(updated);

    // Persist to Firestore
    try {
      await updateDoc(doc(db, 'courses', course.id), { modules: updatedModules });
      console.log('[CoursePlayer] Video ID persisted to Firestore');
    } catch (e) {
      console.error('[CoursePlayer] Failed to persist video ID:', e);
    }
  }, [activeTopic, course, user, onUpdateCourse]);

  return (
    <div className="flex flex-col h-full space-y-0 -mx-8 -mt-8 md:-mx-12 md:-mt-12">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-black/5 sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-32 h-1.5 bg-black/5 rounded-full overflow-hidden">
              <div className="h-full bg-accent-blue rounded-full transition-all duration-700" style={{ width: `${overallProgress}%` }} />
            </div>
            <span className="text-xs font-semibold text-[#1D1D1F]">{overallProgress}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-accent-green">
            <Award className="w-4 h-4" /> {completedCount}/{totalTopics} done
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT: Video + controls */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#F5F5F7]">
          {/* Video player */}
          {(activeTopic?.videoSuggestion || activeTopic?.searchQuery || activeTopic?.videoId) ? (
            <YouTubePlayer
              searchQuery={activeTopic.videoSuggestion?.searchQuery || activeTopic.searchQuery || activeTopic.title}
              topicId={activeTopic.id || activeTopic.title}
              onProgress={handleWatchProgress}
              savedProgress={getWatchPct(activeTopic)}
              preResolvedVideoId={activeTopic.videoSuggestion?.videoId || activeTopic.videoId}
              onVideoResolved={handleVideoResolved}
            />
          ) : (
            <div className="aspect-video bg-[#1D1D1F] rounded-2xl flex items-center justify-center">
              <div className="text-center text-white">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="opacity-60 text-sm">Select a video topic to start</p>
              </div>
            </div>
          )}

          {/* Topic info + actions */}
          {activeTopic && (
            <div className="bg-white rounded-2xl p-5 border border-black/5 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#86868B] mb-1">
                  <span>{activeMod?.title}</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>Lesson {activeTopicIdx + 1} of {activeMod?.topics?.length}</span>
                </div>
                <h2 className="text-xl font-bold text-[#1D1D1F]">{activeTopic.title}</h2>
                {activeTopic.description && (
                  <p className="text-sm text-[#86868B] mt-1 leading-relaxed">{activeTopic.description}</p>
                )}
              </div>

              {/* Watch progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-[#86868B] mb-1.5">
                  <span>Watch progress</span>
                  <span className="font-medium">{getWatchPct(activeTopic)}%</span>
                </div>
                <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-accent-blue to-accent-blue/70"
                    style={{ width: `${getWatchPct(activeTopic)}%` }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap">
                <button
                  disabled={flatIdx === 0}
                  onClick={goPrev}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] hover:border-black/20 disabled:opacity-30 transition-all"
                >
                  ← Previous
                </button>

                <button
                  onClick={handleMarkComplete}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isCompleted(activeTopic)
                      ? 'bg-accent-green/10 text-accent-green border border-accent-green/30 hover:bg-accent-green/20'
                      : 'bg-[#1D1D1F] text-white hover:bg-black'
                  }`}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {isCompleted(activeTopic) ? 'Completed ✓' : 'Mark as Complete'}
                </button>

                <button
                  disabled={flatIdx === allTopics.length - 1}
                  onClick={goNext}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-accent-blue/90 disabled:opacity-30 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Key Takeaways — below video + controls */}
          {activeTopic && (
            <KeyTakeaways
              topicTitle={activeTopic.title}
              topicDescription={activeTopic.description}
              searchQuery={activeTopic.videoSuggestion?.searchQuery || activeTopic.searchQuery}
            />
          )}
        </div>

        {/* RIGHT: Course Sidebar */}
        <div className="w-80 border-l border-black/5 bg-white overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-black/5 sticky top-0 bg-white z-10">
            <h3 className="font-bold text-[#1D1D1F] text-sm line-clamp-1">{course.title || course.courseName}</h3>
            <p className="text-xs text-[#86868B] mt-0.5">{allModules.length} sections • {totalTopics} lessons</p>
          </div>

          <div>
            
            {allModules.map((module, mIdx) => {
              const moduleTopics: any[] = module.topics || [];
              const moduleDone = moduleTopics.filter(t => isCompleted(t)).length;
              const isExpanded = expandedModules.has(mIdx);

              return (
                <div key={mIdx} className="border-b border-black/5 last:border-0">
                  <button
                    onClick={() => setExpandedModules(prev => {
                      const next = new Set(prev);
                      next.has(mIdx) ? next.delete(mIdx) : next.add(mIdx);
                      return next;
                    })}
                    className="w-full flex items-center justify-between p-4 hover:bg-[#F5F5F7] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        mIdx === activeModuleIdx ? 'bg-accent-blue text-white' : 'bg-[#F5F5F7] text-[#86868B]'
                      }`}>
                        {mIdx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-[#1D1D1F] text-sm block truncate">{module.title}</span>
                        <span className="text-xs text-[#86868B]">{moduleDone}/{moduleTopics.length} completed</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-[#86868B] flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#86868B] flex-shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="bg-[#FAFAFA]">
                      {moduleTopics.map((topic, tIdx) => {
                        const isActive = mIdx === activeModuleIdx && tIdx === activeTopicIdx;
                        const done = isCompleted(topic);
                        const watched = getWatchPct(topic);

                        return (
                          <button
                            key={tIdx}
                            onClick={() => navigate(mIdx, tIdx)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-2 ${
                              isActive
                                ? 'bg-accent-blue/5 border-accent-blue'
                                : 'border-transparent hover:bg-[#F5F5F7]'
                            }`}
                          >
                            <div className="flex-shrink-0">
                                {isCompleted(topic)
                                  ? <CheckCircle className="w-4 h-4 text-accent-green" />
                                  : topic.videoSuggestion?.videoId || topic.videoId
                                    ? <div className="w-12 h-8 rounded-md overflow-hidden bg-black/10 border border-black/5">
                                        <img 
                                          src={`https://i.ytimg.com/vi/${topic.videoSuggestion?.videoId || topic.videoId}/mqdefault.jpg`} 
                                          className="w-full h-full object-cover"
                                          alt=""
                                        />
                                      </div>
                                    : isActive
                                      ? <PlayCircle className="w-4 h-4 text-accent-blue" />
                                      : <Circle className="w-4 h-4 text-black/15" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${
                                isActive ? 'text-accent-blue' : isCompleted(topic) ? 'text-[#86868B] line-through' : 'text-[#1D1D1F]'
                              }`}>
                                {topic.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-[#86868B] font-medium">{topic.duration}</span>
                                {getWatchPct(topic) > 0 && !isCompleted(topic) && (
                                  <div className="flex-1 h-1 bg-black/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent-blue/40 rounded-full" style={{ width: `${getWatchPct(topic)}%` }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Static Sample Courses (with hardcoded video IDs — no backend needed) ─────
const STATIC_COURSES = [
  {
    id: 's1', title: 'React Complete Bootcamp', category: 'Coding', duration: '8h', progress: 0, isCustom: false,
    description: 'From zero to hero in React — components, hooks, state management and more.',
    modules: [
      {
        title: 'Getting Started',
        topics: [
          { id: 'react-basics', title: 'React Basics & JSX', duration: '20 min', description: 'Understanding JSX and the component model', videoSuggestion: { searchQuery: 'React JS tutorial for beginners 2024 full course freeCodeCamp', title: 'React Basics', videoId: 'bMknfKXIFA8' } },
          { id: 'react-props', title: 'Props & State', duration: '20 min', description: 'Passing data between components', videoSuggestion: { searchQuery: 'React props state explained tutorial 2024', title: 'Props & State', videoId: 'O6P86uwfdR0' } },
          { id: 'react-hooks', title: 'useState & useEffect', duration: '25 min', description: 'Core React hooks for state and side effects', videoSuggestion: { searchQuery: 'React useState useEffect hooks tutorial beginner 2024', title: 'React Hooks', videoId: 'TNhaISOUy6Q' } },
          { id: 'react-events', title: 'Event Handling', duration: '15 min', description: 'Forms, clicks and user interaction', videoSuggestion: { searchQuery: 'React event handling forms tutorial 2024', title: 'Events', videoId: 'a83f3YoyuYM' } },
        ]
      },
      {
        title: 'Intermediate React',
        topics: [
          { id: 'react-router', title: 'React Router', duration: '25 min', description: 'Multi-page navigation in React apps', videoSuggestion: { searchQuery: 'React Router v6 tutorial 2024 complete guide', title: 'Routing', videoId: 'Ul3y1LXxzdU' } },
          { id: 'react-context', title: 'Context API', duration: '20 min', description: 'Global state management without Redux', videoSuggestion: { searchQuery: 'React Context API tutorial 2024', title: 'Context', videoId: 'HYKDUF8X3qI' } },
          { id: 'react-custom-hooks', title: 'Custom Hooks', duration: '20 min', description: 'Extracting reusable logic into hooks', videoSuggestion: { searchQuery: 'React custom hooks tutorial 2024', title: 'Custom Hooks', videoId: '6ThXsUwLWvc' } },
          { id: 'react-api', title: 'API Calls with fetch', duration: '20 min', description: 'Fetching and displaying data from APIs', videoSuggestion: { searchQuery: 'React fetch API async await tutorial 2024', title: 'API calls', videoId: 'uSRBVvLKhFY' } },
        ]
      },
      {
        title: 'Advanced React',
        topics: [
          { id: 'react-ts', title: 'TypeScript with React', duration: '30 min', description: 'Add type safety to your React apps', videoSuggestion: { searchQuery: 'React TypeScript tutorial beginner 2024', title: 'TypeScript', videoId: 'jrKcJxF0lAU' } },
          { id: 'react-perf', title: 'Performance Optimization', duration: '25 min', description: 'useMemo, useCallback, React.memo', videoSuggestion: { searchQuery: 'React performance optimization useMemo useCallback 2024', title: 'Performance', videoId: 'qySZIzZvZOY' } },
          { id: 'react-testing', title: 'Testing React Apps', duration: '30 min', description: 'Unit and integration testing with Vitest', videoSuggestion: { searchQuery: 'React testing tutorial Vitest 2024', title: 'Testing', videoId: 'T2sv8jXoP4s' } },
          { id: 'react-deploy', title: 'Deploying React Apps', duration: '20 min', description: 'Deploy to Vercel and Netlify', videoSuggestion: { searchQuery: 'Deploy React app Vercel Netlify tutorial 2024', title: 'Deploy', videoId: 'XFiNvHEzFaE' } },
        ]
      }
    ]
  },
  {
    id: 's2', title: 'Python for Data Science', category: 'Coding', duration: '10h', progress: 0, isCustom: false,
    description: 'Learn Python from scratch through data science and AI fundamentals.',
    modules: [
      {
        title: 'Python Basics',
        topics: [
          { id: 'py-vars', title: 'Variables & Data Types', duration: '15 min', description: 'Python basics: numbers, strings, booleans', videoSuggestion: { searchQuery: 'Python variables data types tutorial beginner 2024', title: 'Python Basics', videoId: 'rfscVS0vtbw' } },
          { id: 'py-lists', title: 'Lists & Loops', duration: '20 min', description: 'Iterating and working with collections', videoSuggestion: { searchQuery: 'Python lists loops for beginners 2024 tutorial', title: 'Lists', videoId: 'W8KRzm-HUcc' } },
          { id: 'py-funcs', title: 'Functions & Modules', duration: '20 min', description: 'Writing reusable functions and importing modules', videoSuggestion: { searchQuery: 'Python functions modules tutorial 2024', title: 'Functions', videoId: '9Os0o3wzS_I' } },
          { id: 'py-pandas', title: 'Pandas & DataFrames', duration: '30 min', description: 'Data manipulation with Pandas', videoSuggestion: { searchQuery: 'Pandas DataFrame tutorial Python data analysis 2024', title: 'Pandas', videoId: 'vmEHCJofslg' } },
        ]
      },
      {
        title: 'Data Analysis & Visualization',
        topics: [
          { id: 'py-numpy', title: 'NumPy Arrays', duration: '20 min', description: 'Fast numerical computing with NumPy', videoSuggestion: { searchQuery: 'NumPy tutorial Python beginners 2024', title: 'NumPy', videoId: 'QUT1VHiLmmI' } },
          { id: 'py-matplotlib', title: 'Matplotlib Visualizations', duration: '20 min', description: 'Create charts and plots with Python', videoSuggestion: { searchQuery: 'Matplotlib tutorial Python data visualization 2024', title: 'Matplotlib', videoId: '3Xc3CA655Y4' } },
          { id: 'py-sklearn', title: 'Intro to Machine Learning', duration: '30 min', description: 'Scikit-learn for beginner ML models', videoSuggestion: { searchQuery: 'scikit-learn machine learning tutorial Python beginner 2024', title: 'ML Basics', videoId: 'pqNCD_5r0IU' } },
          { id: 'py-project', title: 'Data Science Project', duration: '45 min', description: 'End-to-end data science project walkthrough', videoSuggestion: { searchQuery: 'Python data science project beginner end to end 2024', title: 'Project', videoId: 'u4wnnjMpNas' } },
        ]
      }
    ]
  },
  {
    id: 's3', title: 'JavaScript Mastery', category: 'Coding', duration: '12h', progress: 0, isCustom: false,
    description: 'Master modern JavaScript from fundamentals to advanced async patterns.',
    modules: [
      {
        title: 'JS Fundamentals',
        topics: [
          { id: 'js-basics', title: 'Variables & Data Types', duration: '20 min', description: 'let, const, var and JS data types', videoSuggestion: { searchQuery: 'JavaScript tutorial full beginners 2024 freeCodeCamp', title: 'JS Basics', videoId: 'PkZNo7MFNFg' } },
          { id: 'js-functions', title: 'Functions & Arrow Functions', duration: '20 min', description: 'Regular and arrow function syntax', videoSuggestion: { searchQuery: 'JavaScript functions arrow functions tutorial 2024', title: 'Functions', videoId: 'N8ap4k_1QEQ' } },
          { id: 'js-dom', title: 'DOM Manipulation', duration: '25 min', description: 'Dynamically update HTML with JavaScript', videoSuggestion: { searchQuery: 'JavaScript DOM manipulation tutorial 2024', title: 'DOM', videoId: '5fb2aPlgoys' } },
          { id: 'js-async', title: 'Promises & Async/Await', duration: '25 min', description: 'Handle asynchronous operations cleanly', videoSuggestion: { searchQuery: 'JavaScript async await promises tutorial 2024', title: 'Async', videoId: 'V_Kr9OSfDeU' } },
        ]
      },
      {
        title: 'Modern JavaScript',
        topics: [
          { id: 'js-es6', title: 'ES6+ Features', duration: '20 min', description: 'Destructuring, spread, template literals', videoSuggestion: { searchQuery: 'ES6 JavaScript features tutorial destructuring spread 2024', title: 'ES6+', videoId: 'NCwa_xi0Uuc' } },
          { id: 'js-fetch', title: 'Fetch API & REST', duration: '20 min', description: 'Fetch data from APIs and REST services', videoSuggestion: { searchQuery: 'Fetch API JavaScript REST tutorial 2024', title: 'Fetch API', videoId: 'drK3uWfC_yA' } },
          { id: 'js-classes', title: 'Classes & OOP', duration: '25 min', description: 'Object-oriented programming in JavaScript', videoSuggestion: { searchQuery: 'JavaScript classes OOP tutorial beginner 2024', title: 'OOP', videoId: 'PFmuCDHHpwk' } },
          { id: 'js-modules', title: 'ES Modules', duration: '15 min', description: 'Import/export and modular code', videoSuggestion: { searchQuery: 'JavaScript ES modules import export tutorial 2024', title: 'Modules', videoId: 'cRHQNNkYi58' } },
        ]
      }
    ]
  }
];

// ─── Main Learning Page ───────────────────────────────────────────────────────
export function Learning() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          title: d.data().courseName || d.data().title,
          duration: 'Self-paced',
          isCustom: true
        }));
        setCourses([...fetched, ...STATIC_COURSES]);

        const today = new Date().toDateString();
        const lastActive = localStorage.getItem(`streak_date_${user.uid}`);
        const savedStreak = parseInt(localStorage.getItem(`streak_count_${user.uid}`) || '0');
        if (lastActive === today) setStreak(savedStreak);
        else if (lastActive === new Date(Date.now() - 86400000).toDateString()) {
          const s = savedStreak + 1;
          setStreak(s);
          localStorage.setItem(`streak_count_${user.uid}`, String(s));
          localStorage.setItem(`streak_date_${user.uid}`, today);
        } else {
          setStreak(1);
          localStorage.setItem(`streak_count_${user.uid}`, '1');
          localStorage.setItem(`streak_date_${user.uid}`, today);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  const handleUpdateCourse = (updated: any) => {
    setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedCourse?.id === updated.id) setSelectedCourse(updated);
  };

  const filteredCourses = courses.filter(c => {
    const matchesFilter = filter === 'All' ||
      c.category === filter ||
      (filter === 'AI Generated' && c.isCustom);
    const matchesSearch = (c.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return (
    <div className="space-y-10">
      <div className="h-10 w-72 skeleton" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="rounded-2xl overflow-hidden border border-black/5">
            <div className="aspect-video skeleton" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-3/4 skeleton" />
              <div className="h-3 w-full skeleton" />
              <div className="h-2 skeleton rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleDeleteCourse = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `courses/${id}`);
    }
  };

  if (selectedCourse) return (
    <CoursePlayer
      course={selectedCourse}
      onBack={() => setSelectedCourse(null)}
      onUpdateCourse={handleUpdateCourse}
    />
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">Learning Hub</h1>
          <p className="text-[#86868B] mt-1">Watch, learn, and track your progress — all in one place.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#8E8E93]">
              <Rocket className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-black/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-full">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-600">{streak} day streak</span>
            </div>
            <div className="flex gap-1.5 bg-[#F5F5F7] p-1.5 rounded-xl border border-black/5 flex-wrap">
              {['All', 'AI Generated', 'Coding'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-white text-[#1C1C1E] shadow-sm font-semibold' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
                >{f}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Course grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => {
          const allTopics = (course.modules || []).flatMap((m: any) => m.topics || []);
          const totalTopics = allTopics.length;
          const completed = (course.completedTopics || []).length;
          const progress = totalTopics === 0 ? (course.progress || 0) : Math.round((completed / totalTopics) * 100);
          const watchProgress = course.watchProgress || {};
          const avgWatch = totalTopics === 0 ? 0 : Math.round(
            Object.values(watchProgress).reduce((a: any, b: any) => a + b, 0) as number / totalTopics
          );

          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourse({ ...course, progress })}
              className="group glass-card overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-[#1D1D1F] to-[#2d2d2f] relative flex items-center justify-center overflow-hidden">
                {/* Try to find a video ID for thumbnail */}
                {(() => {
                  const firstVideoId = allTopics.find((t: any) => t.videoSuggestion?.videoId || t.videoId)?.videoSuggestion?.videoId || allTopics.find((t: any) => t.videoSuggestion?.videoId || t.videoId)?.videoId;
                  if (firstVideoId) {
                    return (
                      <img 
                        src={`https://i.ytimg.com/vi/${firstVideoId}/hqdefault.jpg`}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700"
                        alt=""
                      />
                    );
                  }
                  return <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-accent-blue to-accent-green" />;
                })()}
                
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent-blue/20 transition-transform duration-500">
                  <PlayCircle className="w-9 h-9 text-white shadow-xl" />
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <div className="px-3 py-1 text-xs font-bold rounded-full bg-white/10 backdrop-blur-sm text-white border border-white/10">
                    {course.isCustom ? '✨ AI' : course.category}
                  </div>
                  {course.isCustom && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id, e); }}
                      className="p-1.5 rounded-lg bg-red-500/10 backdrop-blur-sm text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div className={`h-full transition-all ${progress === 100 ? 'bg-accent-green' : 'bg-accent-blue'}`} style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-[#1D1D1F] text-base mb-1 line-clamp-2">{course.title}</h3>
                {course.description && <p className="text-xs text-[#86868B] mb-3 line-clamp-2">{course.description}</p>}

                <div className="flex items-center gap-4 text-xs text-[#86868B] mb-4">
                  <span className="flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" /> {totalTopics} lessons</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.duration}</span>
                  {avgWatch > 0 && <span className="flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" /> {avgWatch}% watched</span>}
                </div>

                {/* Progress */}
                <div className="mt-auto space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#86868B]">{progress === 100 ? '🎉 Completed' : progress > 0 ? 'In progress' : 'Not started'}</span>
                    <span className={progress === 100 ? 'text-accent-green' : 'text-accent-blue'}>{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? 'bg-accent-green' : 'bg-accent-blue'}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCourse({ ...course, progress })}
                  className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                    progress === 100
                      ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                      : progress > 0
                        ? 'bg-accent-blue text-white hover:bg-accent-blue/90'
                        : 'bg-[#1D1D1F] text-white hover:bg-black'
                  }`}
                >
                  <PlayCircle className="w-4 h-4" />
                  {progress === 100 ? 'Review Course' : progress > 0 ? 'Continue Learning' : 'Start Course'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-5 animate-float shadow-xl shadow-blue-200">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#1C1C1E] mb-2">
            {filter === 'All' ? 'No courses yet' : `No ${filter} courses`}
          </h3>
          <p className="text-[#8E8E93] text-sm mb-6 max-w-xs leading-relaxed">
            {filter === 'All'
              ? 'Generate a career roadmap and convert it into a full structured video course with one click.'
              : "Try switching the filter to 'All' to see all courses."
            }
          </p>
          {filter !== 'All' && (
            <button onClick={() => setFilter('All')} className="btn-secondary py-2.5 px-6 text-sm mb-3">
              Show All Courses
            </button>
          )}
          <a href="/career-guide" className="btn-primary py-2.5 px-6 text-sm">
            <Sparkles className="w-4 h-4" /> Generate Career Roadmap
          </a>
        </div>
      )}
    </div>
  );
}
