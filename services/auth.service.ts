
import { auth } from './firebase';
import { UserRole, UserProfile } from '../types';

// In production, use Firebase Auth methods here
// import { signInWithEmailAndPassword, signOut } from "firebase/auth";

export const AuthService = {
    login: async (role: UserRole): Promise<UserProfile> => {
        // Production: const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = await auth.signInWithRole(role);
        
        // Map Firebase user to our app's UserProfile
        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: role,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
    },

    logout: async (): Promise<void> => {
        await auth.signOut();
    },

    getCurrentUser: async (): Promise<UserProfile | null> => {
        // In production, verify token or check auth state observer
        const stored = localStorage.getItem('hg_user');
        return stored ? JSON.parse(stored) : null;
    }
};
