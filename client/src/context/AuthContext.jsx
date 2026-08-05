import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('orvida_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const loginWithGoogle = () => {
    const mockUser = {
      uid: 'firebase_usr_998234',
      name: 'Princess Radhika',
      email: 'radhika@orvida-luxury.com',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      phone: '+91 98765 43210',
      isAdmin: true,
      memberSince: 'August 2025'
    };
    setUser(mockUser);
    localStorage.setItem('orvida_user', JSON.stringify(mockUser));
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('orvida_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.isAdmin || false,
      isAuthModalOpen,
      setIsAuthModalOpen,
      loginWithGoogle,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
