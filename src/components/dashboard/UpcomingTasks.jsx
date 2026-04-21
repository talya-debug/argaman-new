
import React from 'react';
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar, AlertCircle } from "lucide-react";

const priorityBadgeStyle = {
  "נמוכה": { background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' },
  "בינונית": { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' },
  "גבוהה": { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' },
  "דחוף": { background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }
};

const defaultBadge = { background: 'rgba(156,163,175,0.15)', color: '#9ca3af', border: '1px solid rgba(156,163,175,0.3)' };

export default function UpcomingTasks({ tasks, isLoading }) {
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
          <Calendar style={{ width: 18, height: 18 }} />
          משימות קרובות
        </h3>
      </div>
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} style={{
                padding: 12,
                borderRadius: 8,
                border: '1px solid var(--dark-border)'
              }}>
                <div style={{ height: 14, width: 120, borderRadius: 6, background: 'var(--dark-border)', marginBottom: 8 }} />
                <div style={{ height: 10, width: 80, borderRadius: 6, background: 'var(--dark-border)' }} />
              </div>
            ))
          ) : tasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '16px 0',
              color: 'var(--text-secondary)',
              fontSize: 14
            }}>
              אין משימות קרובות
            </div>
          ) : (
            tasks.map((task) => {
              const badge = priorityBadgeStyle[task.priority] || defaultBadge;
              return (
                <div
                  key={task.id}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid var(--dark-border)',
                    transition: 'background 0.2s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--argaman-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12
                  }}>
                    <div style={{ textAlign: 'right', flex: 1 }}>
                      <p style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        margin: 0,
                        marginBottom: 4
                      }}>{task.title}</p>
                      <p style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        margin: 0,
                        marginBottom: 8
                      }}>
                        יעד: {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: he })}
                      </p>
                      <span style={{
                        fontSize: 12,
                        padding: '3px 10px',
                        borderRadius: 12,
                        ...badge
                      }}>
                        {task.priority}
                      </span>
                    </div>
                    {task.priority === 'דחוף' && (
                      <AlertCircle style={{
                        width: 16,
                        height: 16,
                        flexShrink: 0,
                        marginTop: 2,
                        color: 'var(--danger)'
                      }} />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
