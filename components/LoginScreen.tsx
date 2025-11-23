
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const LoginScreen: React.FC = () => {
    const { login, loading } = useAuth();
    
    const handleLogin = (role: UserRole) => {
        login(role);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#8b4513] to-[#d2691e]">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border-4 border-[#cd853f]">
                <h1 className="text-3xl font-bold text-[#8b4513] mb-2">Heritage Grand</h1>
                <p className="text-gray-500 mb-8">Event Management System</p>
                {loading ? (
                    <div className="py-10">
                         <div className="w-10 h-10 border-4 border-[#f3f3f3] border-t-4 border-t-[#8b4513] rounded-full animate-spin mx-auto mb-4"></div>
                         <p className="text-sm text-gray-500">Authenticating...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-gray-700 mb-2">Select User Role (Prototype Mode)</p>
                        <button onClick={() => handleLogin('admin')} className="w-full btn-primary justify-center">Log in as Admin</button>
                        <button onClick={() => handleLogin('manager')} className="w-full btn-secondary justify-center">Log in as Manager</button>
                        <button onClick={() => handleLogin('receptionist')} className="w-full btn-warning justify-center">Log in as Receptionist</button>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                             <p className="text-xs text-gray-400">Production Build will use Firebase Auth</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;
