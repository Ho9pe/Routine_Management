'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (user) {
            // Role-based route protection
            if (user.role === 'admin' && !pathname.startsWith('/admin')) {
                router.push('/admin/dashboard');
            }
            else if (user.role === 'teacher' && !pathname.startsWith('/teacher')) {
                router.push('/teacher/dashboard');
            }
            else if (user.role === 'student' && !pathname.startsWith('/student')) {
                router.push('/student/dashboard');
            }
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return user ? children : null;
}