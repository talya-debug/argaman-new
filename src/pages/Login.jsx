import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'שם משתמש או סיסמה שגויים');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      direction: 'rtl',
      fontFamily: 'Heebo, sans-serif',
    }}>
      <div style={{
        width: 380,
        background: 'var(--dark-card, #fff)',
        border: '1px solid var(--dark-border, #e2e4e9)',
        borderRadius: 16,
        padding: 40,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.jpg" alt="ארגמן" style={{ width: 250, height: 250, borderRadius: 12, margin: '0 auto 16px' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary, #1a1d2e)', marginBottom: 4 }}>
            ארגמן
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary, #64748b)' }}>
            מערכות מיזוג — כניסה למערכת
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Label htmlFor="username" style={{ color: 'var(--text-primary, #1a1d2e)', marginBottom: 6, display: 'block' }}>
              שם משתמש
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="הכנס שם משתמש"
              required
              dir="rtl"
            />
          </div>
          <div>
            <Label htmlFor="password" style={{ color: 'var(--text-primary, #1a1d2e)', marginBottom: 6, display: 'block' }}>
              סיסמה
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="הכנס סיסמה"
              required
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: 14, textAlign: 'center' }}>{error}</p>
          )}

          <Button type="submit" disabled={loading} style={{ marginTop: 8, gap: 8, backgroundColor: '#000000', fontSize: '18px' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {loading ? 'מתחבר...' : 'כניסה למערכת'}
          </Button>
          
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <p style={{ fontSize: '11px', color: '#2563eb' }}>גרסה 2.0</p>
          </div>
        </form>
      </div>
    </div>
  );
}
