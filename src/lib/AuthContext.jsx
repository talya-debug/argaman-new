import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // בדיקה אם יש יוזר שמור ב-localStorage
  useEffect(() => {
    const saved = localStorage.getItem('argaman_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch {}
    }
    setIsLoadingAuth(false);
  }, []);

  // התחברות עם שם וסיסמה
  const login = async (username, password) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('שם משתמש לא נמצא');
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (userData.password !== password) {
      throw new Error('סיסמה שגויה');
    }

    const userObj = {
      id: userDoc.id,
      uid: userDoc.id,
      username: userData.username,
      full_name: userData.full_name,
      role: userData.role || 'user',
      email: userData.email || '',
    };

    setUser(userObj);
    setIsAuthenticated(true);
    localStorage.setItem('argaman_user', JSON.stringify(userObj));
    return userObj;
  };

  // התנתקות
  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('argaman_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// hook לשימוש בקונטקסט
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth חייב להיות בתוך AuthProvider');
  }
  return context;
};

// רכיב שמגן על דפים
export const ProtectedRoute = ({ children, fallback }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return fallback || (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>טוען...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return children;
};
