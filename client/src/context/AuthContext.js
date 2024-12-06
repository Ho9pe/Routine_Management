'use client';
import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (data) => {
        try {
            if (data.token && data.user) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                document.cookie = `token=${data.token}; path=/`;
                document.cookie = `user_role=${data.user.role}; path=/`;
                setUser(data.user);
                return { success: true };
            }
    
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const responseData = await res.json();
    
            if (res.ok) {
                localStorage.setItem('token', responseData.token);
                localStorage.setItem('user', JSON.stringify(responseData.user));
                document.cookie = `token=${responseData.token}; path=/`;
                document.cookie = `user_role=${responseData.user.role}; path=/`;
                setUser(responseData.user);
                return { success: true };
            } else {
                return { success: false, message: responseData.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Connection error' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Remove cookies
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        setUser(null);
    };

    const updateUserData = (newData) => {
        if (user) {
            const updatedUser = { ...user, ...newData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, updateUserData }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);