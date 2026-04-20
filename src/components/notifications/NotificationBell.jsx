import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, AlertTriangle, ClipboardList, FolderOpen, Info, X } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { markAsRead, markAllAsRead } from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// אייקון לפי סוג התראה
const typeIcons = {
  task_assigned: ClipboardList,
  task_due: AlertTriangle,
  payment_overdue: AlertTriangle,
  project_started: FolderOpen,
  general: Info,
};

const typeColors = {
  task_assigned: '#3b82f6',
  task_due: '#f59e0b',
  payment_overdue: '#dc2626',
  project_started: '#22c55e',
  general: '#94a3b8',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // האזנה בזמן אמת להתראות
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, []);

  // סגירת הדרופדאון בלחיצה מחוץ
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // לחיצה על התראה
  const handleClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setOpen(false);
  };

  // סימון הכל כנקרא
  const handleMarkAllRead = async () => {
    const user = auth.currentUser;
    if (user) {
      await markAllAsRead(user.uid);
    }
  };

  // פורמט זמן
  const timeAgo = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true, locale: he });
    } catch {
      return '';
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* כפתור הפעמון */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Bell size={22} color="#f1f5f9" />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              background: '#dc2626',
              color: '#fff',
              borderRadius: '50%',
              width: 18,
              height: 18,
              fontSize: 11,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* דרופדאון התראות */}
      {open && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '100%',
            marginTop: 8,
            width: 340,
            maxHeight: 420,
            overflowY: 'auto',
            background: '#1a1d27',
            border: '1px solid #2d3348',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            zIndex: 1000,
            direction: 'rtl',
          }}
        >
          {/* כותרת */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #2d3348',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 15 }}>התראות</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <X size={16} color="#94a3b8" />
            </button>
          </div>

          {/* רשימת התראות */}
          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              אין התראות
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = typeIcons[n.type] || Info;
              const iconColor = typeColors[n.type] || '#94a3b8';
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #2d3348',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    background: n.read ? 'transparent' : 'rgba(59,130,246,0.06)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#232736')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = n.read
                      ? 'transparent'
                      : 'rgba(59,130,246,0.06)')
                  }
                >
                  <div
                    style={{
                      minWidth: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: `${iconColor}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={16} color={iconColor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: '#f1f5f9',
                        fontSize: 13,
                        fontWeight: n.read ? 400 : 600,
                        marginBottom: 2,
                      }}
                    >
                      {n.title}
                    </div>
                    <div
                      style={{
                        color: '#94a3b8',
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {n.message}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  {!n.read && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#3b82f6',
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              );
            })
          )}

          {/* כפתור סמן הכל כנקרא */}
          {unreadCount > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #2d3348' }}>
              <button
                onClick={handleMarkAllRead}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  background: 'transparent',
                  border: '1px solid #2d3348',
                  borderRadius: 8,
                  color: '#94a3b8',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#232736')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <CheckCircle size={14} />
                סמן הכל כנקרא
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
