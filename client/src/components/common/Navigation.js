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

    return (
        <nav className={styles.nav}>
            <div className={styles.logo}>
                {user ? (
                    <Link href={user.role === 'student' ? '/student/routine' : '/'}>
                        My Routine
                    </Link>
                ) : (
                    <Link href="/">
                        University Routine Manager
                    </Link>
                )}
            </div>
            <div className={styles.links}>
                {user ? (
                    <>
                        <Link 
                            href="/courses"
                            className={isActive('/courses') ? styles.active : ''}
                        >
                            My Courses
                        </Link>
                        <Link 
                            href="/dashboard"
                            className={isActive('/dashboard') ? styles.active : ''}
                        >
                            Dashboard
                        </Link>
                        <button 
                            onClick={handleLogout}
                            className={styles.logoutButton}
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link 
                            href="/register"
                            className={isActive('/register') ? styles.active : ''}
                        >
                            Register
                        </Link>
                        <Link 
                            href="/login"
                            className={isActive('/login') ? styles.active : ''}
                        >
                            Login
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}