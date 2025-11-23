
// NOTE: In a production environment, you would import these packages:
// import { initializeApp } from "firebase/app";
// import { getAuth, GoogleAuthProvider } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

/* 
// Production Configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
*/

// --- MOCK IMPLEMENTATION FOR DEVELOPMENT ---
// This allows the app to function without valid Firebase credentials during the prototype phase.

export const auth = {
    currentUser: null,
    signInWithRole: async (role: string) => {
        console.log(`[Mock Firebase] Signing in as ${role}`);
        return {
            uid: `mock-user-${Date.now()}`,
            email: `${role}@heritage.com`,
            displayName: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
            role: role
        };
    },
    signOut: async () => console.log('[Mock Firebase] Signed out')
};

export const COLLECTIONS = {
    BOOKINGS: 'bookings',
    EXPENSES: 'expenses',
    USERS: 'users',
    CONFIG: 'config',
    AUDIT_LOGS: 'audit_logs'
};
