
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { auth } from '../services/firebase';

interface AuthContextType {
    user: UserProfile | null;
    isAuthenticated: boolean;
    login: (role: UserRole) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Persist session mock
        const storedUser = localStorage.getItem('hg_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (role: UserRole) => {
        setLoading(true);
        try {
            // In production: await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = await auth.signInWithRole(role);
            
            const userProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                role: role, // In production, fetch this from 'users' collection
                createdAt: new Date().toISOString()
            };

            setUser(userProfile);
            localStorage.setItem('hg_user', JSON.stringify(userProfile));
        } catch (error) {
            console.error("Login failed", error);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        auth.signOut();
        setUser(null);
        localStorage.removeItem('hg_user');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
