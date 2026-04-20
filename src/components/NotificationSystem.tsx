import { useEffect, useState, useCallback } from 'react';
import { Flame, X, Bell, BellOff, Trophy, Zap } from 'lucide-react';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  type: 'streak' | 'reminder' | 'achievement';
  title: string;
  message: string;
  emoji: string;
}

const STREAK_MESSAGES = [
  { title: "Don't break your streak! 🔥", message: "You're on a roll! Keep learning today.", emoji: "🔥" },
  { title: "Your streak is calling!", message: "Complete a topic to keep your streak alive.", emoji: "⚡" },
  { title: "Consistency is key!", message: "Just 10 minutes of learning today keeps your streak going.", emoji: "🎯" },
  { title: "Stay on track!", message: "You're building something great. Don't stop now.", emoji: "🚀" },
];

export function NotificationSystem() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addNotification = useCallback((notif: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setNotifications(prev => [...prev.slice(-2), { ...notif, id }]); // max 3 at a time
    // Auto-dismiss after 6 seconds
    setTimeout(() => dismiss(id), 6000);
  }, []);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      setPermissionGranted(true);
      setShowPermissionBanner(false);
      addNotification({
        type: 'achievement',
        title: 'Notifications enabled! 🎉',
        message: "We'll remind you to keep learning every day.",
        emoji: '🎉'
      });
    }
  };

  useEffect(() => {
    if (!user) return;

    // Check notification permission
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission === 'default') {
        // Show banner after 3 seconds
        const timer = setTimeout(() => setShowPermissionBanner(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const streak = parseInt(localStorage.getItem(`streak_count_${user.uid}`) || '0');
    const lastActive = localStorage.getItem(`streak_date_${user.uid}`);
    const today = new Date().toDateString();

    // Show streak notification
    if (streak > 0) {
      const delay = setTimeout(() => {
        if (streak >= 7) {
          addNotification({
            type: 'achievement',
            title: `${streak} Day Streak! 🏆`,
            message: "You're a learning machine! Keep it up!",
            emoji: '🏆'
          });
        } else {
          const msg = STREAK_MESSAGES[Math.floor(Math.random() * STREAK_MESSAGES.length)];
          addNotification({ type: 'streak', ...msg });
        }
      }, 2500);
      return () => clearTimeout(delay);
    }

    // If they haven't learned today, show reminder
    if (lastActive && lastActive !== today) {
      const delay = setTimeout(() => {
        addNotification({
          type: 'reminder',
          title: "Time to learn! 📚",
          message: "You haven't studied yet today. Keep your streak alive!",
          emoji: '📚'
        });
      }, 4000);
      return () => clearTimeout(delay);
    }
  }, [user, addNotification]);

  return (
    <>
      {/* Permission Banner */}
      {showPermissionBanner && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm mx-4">
          <div className="bg-[#1D1D1F] text-white rounded-2xl p-5 shadow-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-accent-blue" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Enable notifications</h4>
              <p className="text-xs text-white/60 mt-1">Get daily reminders to keep your learning streak alive, just like Duolingo!</p>
              <div className="flex gap-2 mt-3">
                <button onClick={requestPermission} className="px-4 py-1.5 bg-accent-blue text-white text-xs font-semibold rounded-full hover:bg-accent-blue/90 transition-colors">
                  Enable
                </button>
                <button onClick={() => setShowPermissionBanner(false)} className="px-4 py-1.5 bg-white/10 text-white/80 text-xs font-semibold rounded-full hover:bg-white/20 transition-colors">
                  Not now
                </button>
              </div>
            </div>
            <button onClick={() => setShowPermissionBanner(false)} className="text-white/40 hover:text-white/80 transition-colors mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toast Notifications Stack */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 min-w-[320px] max-w-sm">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className="bg-white border border-black/5 rounded-2xl p-4 shadow-xl flex items-start gap-3 animate-slide-in"
            style={{ animation: 'slideInRight 0.4s cubic-bezier(0.16,1,0.3,1)' }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
              notif.type === 'streak' ? 'bg-orange-50' :
              notif.type === 'achievement' ? 'bg-yellow-50' :
              'bg-blue-50'
            }`}>
              {notif.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[#1D1D1F] text-sm">{notif.title}</h4>
              <p className="text-xs text-[#86868B] mt-0.5 leading-relaxed">{notif.message}</p>
            </div>
            <button onClick={() => dismiss(notif.id)} className="text-[#86868B] hover:text-[#1D1D1F] transition-colors flex-shrink-0 mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
