
import React from 'react';
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { User, Clock } from "lucide-react";

const statusBadgeStyle = {
  "חדש": { background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' },
  "איסוף מידע מלקוח": { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' },
  "סיווג / הכנת הצעה": { background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' },
  "תיאום סיור": { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' },
  "הצעה נשלחה": { background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' },
  "אושר": { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }
};

const defaultBadge = { background: 'rgba(156,163,175,0.15)', color: '#9ca3af', border: '1px solid rgba(156,163,175,0.3)' };

export default function RecentActivity({ leads, isLoading }) {
  return (
    <div style={{
      background: 'var(--dark-card)',
      border: '1px solid var(--dark-border)',
      borderRadius: 12,
      overflow: 'hidden'
    }}>
      <div style={{ padding: '24px 24px 16px' }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--argaman)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Clock style={{ width: 18, height: 18 }} />
          פעילות אחרונה
        </h3>
      </div>
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--dark-border)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, width: 120, borderRadius: 6, background: 'var(--dark-border)', marginBottom: 6 }} />
                  <div style={{ height: 10, width: 80, borderRadius: 6, background: 'var(--dark-border)' }} />
                </div>
                <div style={{ height: 24, width: 60, borderRadius: 12, background: 'var(--dark-border)' }} />
              </div>
            ))
          ) : (
            leads.map((lead) => {
              const badge = statusBadgeStyle[lead.status] || defaultBadge;
              return (
                <div
                  key={lead.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 8,
                    borderRadius: 8,
                    transition: 'background 0.2s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--argaman-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--argaman-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User style={{ width: 18, height: 18, color: 'var(--argaman-light)' }} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{lead.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                      {format(new Date(lead.created_date), 'dd/MM/yyyy', { locale: he })}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 12,
                    whiteSpace: 'nowrap',
                    ...badge
                  }}>
                    {lead.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
