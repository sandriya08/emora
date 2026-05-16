import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useDiagnosis } from './DiagnosisContext';

// Define the shape of the user object (adjust based on your backend response)
interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
    therapistProfile?: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    updateUser: (newData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    const { resetDiagnosis } = useDiagnosis();
    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
        resetDiagnosis(); // Clear diagnosis state on logout
    };

    const updateUser = (newData: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...newData } : null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
