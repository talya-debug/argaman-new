import React, { useState, useEffect } from 'react';
import { LeadActivity, User } from '@/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function LeadActivityLog({ leadId }) {
  const [activities, setActivities] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (leadId) loadActivities();
  }, [leadId]);

  const loadActivities = async () => {
    try {
      const list = await LeadActivity.filter({ lead_id: leadId });
      setActivities(list.sort((a, b) => (b.created_date || '').localeCompare(a.created_date || '')));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const currentUser = await User.me();
      await LeadActivity.create({
        lead_id: leadId,
        user_name: currentUser?.full_name || currentUser?.username || 'משתמש',
        comment: newComment.trim(),
        type: 'comment',
        created_date: new Date().toISOString(),
      });
      setNewComment('');
      loadActivities();
    } catch (e) {
      toast.error('שגיאה בהוספת הערה');
    }
  };

  const timeAgo = (dateStr) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: he });
    } catch { return ''; }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={16} style={{ color: 'var(--text-muted)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>לוג פעילות</span>
      </div>

      <div className="flex gap-2 mb-3">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="הוסף הערה..."
          className="text-sm"
          style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}
          onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }}
        />
        <Button size="sm" onClick={addComment} disabled={!newComment.trim()} className="bg-blue-600 hover:bg-blue-700 px-3">
          <Send size={14} />
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">טוען...</p>
      ) : activities.length === 0 ? (
        <p className="text-xs text-gray-400">אין פעילות עדיין</p>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {activities.map((a, i) => (
            <div key={a.id || i} className="flex gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{a.user_name}</span>
              <span className="flex-1">{a.comment}</span>
              <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{timeAgo(a.created_date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
