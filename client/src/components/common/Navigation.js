'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';

export default function Navigation() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    const handleLogout = () => {
        logout();
    };

    const renderAdminNav = () => (
        <div className={styles.navLinks}>
            <Link href="/admin/panel" className={isActive('/admin/panel') ? styles.active : ''}>
                Admin Panel
            </Link>
            <Link href="/admin/routine" className={isActive('/admin/routine') ? styles.active : ''}>
                Routine
            </Link>
            <Link href="/admin/dashboard" className={isActive('/admin/dashboard') ? styles.active : ''}>
                Dashboard
            </Link>
            <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
            </button>
        </div>
    );

    const renderTeacherNav = () => (
        <div className={styles.navLinks}>
            <Link href="/teacher/courses" className={isActive('/teacher/courses') ? styles.active : ''}>
                My Courses
            </Link>
            <Link href="/teacher/routine" className={isActive('/teacher/routine') ? styles.active : ''}>
                My Routine
            </Link>
            <Link href="/teacher/dashboard" className={isActive('/teacher/dashboard') ? styles.active : ''}>
                Dashboard
            </Link>
            <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
            </button>
        </div>
    );

    const renderStudentNav = () => (
        <div className={styles.navLinks}>
            <Link href="/student/courses" className={isActive('/student/courses') ? styles.active : ''}>
                My Courses
            </Link>
            <Link href="/student/routine" className={isActive('/student/routine') ? styles.active : ''}>
                My Routine
            </Link>
            <Link href="/student/dashboard" className={isActive('/student/dashboard') ? styles.active : ''}>
                Dashboard
            </Link>
            <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
            </button>
        </div>
    );

    const renderPublicNav = () => (
        <div className={styles.navLinks}>
            <Link 
                href="/register"
                className={isActive('/register') ? styles.active : ''}
                prefetch={true}
            >
                Register
            </Link>
            <Link 
                href="/login"
                className={isActive('/login') ? styles.active : ''}
                prefetch={true}
            >
                Login
            </Link>
        </div>
    );

    return (
        <nav className={styles.nav}>
            <Link href="/" className={styles.logo}>
                University Routine Manager
            </Link>
            
            {user ? (
                <>
                    {user.role === 'admin' && renderAdminNav()}
                    {user.role === 'teacher' && renderTeacherNav()}
                    {user.role === 'student' && renderStudentNav()}
                </>
            ) : (
                renderPublicNav()
            )}
        </nav>
    );
}